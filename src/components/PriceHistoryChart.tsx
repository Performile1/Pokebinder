import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  DollarSign,
  Gavel,
  ShieldCheck,
  Award,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { CardPriceTimeline, PriceHistoryPoint, CompletedSaleRecord } from '../types';

interface PriceHistoryChartProps {
  timeline: CardPriceTimeline;
  onTargetCard?: () => void;
  isTargetLocked?: boolean;
}

type Timeframe = '1M' | '3M' | '6M' | '1Y' | 'ALL';
type Currency = 'SEK' | 'USD' | 'EUR';
type GradeView = 'raw' | 'psa10' | 'psa9';

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  timeline,
  onTargetCard,
  isTargetLocked,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');
  const [currency, setCurrency] = useState<Currency>('SEK');
  const [gradeView, setGradeView] = useState<GradeView>('raw');
  const [hoveredPoint, setHoveredPoint] = useState<PriceHistoryPoint | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'Tradera' | 'eBay' | 'Cardmarket'>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter history points according to timeframe
  const filteredPoints = useMemo(() => {
    const total = timeline.history.length;
    if (total === 0) return [];

    let count = total;
    if (timeframe === '1M') count = Math.min(5, total);
    else if (timeframe === '3M') count = Math.min(13, total);
    else if (timeframe === '6M') count = Math.min(26, total);
    else if (timeframe === '1Y') count = Math.min(52, total);
    else count = total;

    return timeline.history.slice(total - count);
  }, [timeline.history, timeframe]);

  // Determine min & max price in the active view
  const { minVal, maxVal, pricePoints } = useMemo(() => {
    if (filteredPoints.length === 0) {
      return { minVal: 0, maxVal: 100, pricePoints: [] };
    }

    const prices = filteredPoints.map((pt) => {
      let p = pt.priceSek;
      if (currency === 'USD') p = pt.priceUsd;
      if (currency === 'EUR') p = pt.priceEur;

      if (gradeView === 'psa10') p = currency === 'SEK' ? pt.psa10Sek : Math.round(p * 2.45);
      if (gradeView === 'psa9') p = currency === 'SEK' ? pt.psa9Sek : Math.round(p * 1.3);

      return { pt, val: p };
    });

    const values = prices.map((p) => p.val);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Add 10% vertical padding so curve doesn't clip top/bottom
    const range = max - min || 1;
    const paddedMin = Math.max(0, Math.floor(min - range * 0.08));
    const paddedMax = Math.ceil(max + range * 0.1);

    return { minVal: paddedMin, maxVal: paddedMax, pricePoints: prices };
  }, [filteredPoints, currency, gradeView]);

  // Compute SVG Bézier Path Coordinates
  const chartWidth = 720;
  const chartHeight = 260;
  const paddingX = 40;
  const paddingY = 25;

  const svgCoordinates = useMemo(() => {
    if (pricePoints.length === 0) return [];
    const usableW = chartWidth - paddingX * 2;
    const usableH = chartHeight - paddingY * 2;
    const valRange = maxVal - minVal || 1;

    return pricePoints.map((item, idx) => {
      const x = paddingX + (idx / (pricePoints.length - 1 || 1)) * usableW;
      const normalizedY = (item.val - minVal) / valRange;
      const y = chartHeight - paddingY - normalizedY * usableH;
      return { x, y, pt: item.pt, val: item.val };
    });
  }, [pricePoints, minVal, maxVal]);

  // Build smooth cubic bezier path
  const { linePath, areaPath } = useMemo(() => {
    if (svgCoordinates.length === 0) return { linePath: '', areaPath: '' };
    if (svgCoordinates.length === 1) {
      const p = svgCoordinates[0];
      return {
        linePath: `M ${p.x} ${p.y}`,
        areaPath: `M ${p.x} ${p.y} L ${p.x} ${chartHeight - paddingY} Z`,
      };
    }

    let d = `M ${svgCoordinates[0].x} ${svgCoordinates[0].y}`;
    for (let i = 0; i < svgCoordinates.length - 1; i++) {
      const curr = svgCoordinates[i];
      const next = svgCoordinates[i + 1];
      const cx1 = curr.x + (next.x - curr.x) / 3;
      const cy1 = curr.y;
      const cx2 = next.x - (next.x - curr.x) / 3;
      const cy2 = next.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${next.x} ${next.y}`;
    }

    const first = svgCoordinates[0];
    const last = svgCoordinates[svgCoordinates.length - 1];
    const area = `${d} L ${last.x} ${chartHeight - paddingY} L ${first.x} ${chartHeight - paddingY} Z`;

    return { linePath: d, areaPath: area };
  }, [svgCoordinates]);

  // Current spot value and calculated period momentum
  const activeSpotPrice = useMemo(() => {
    if (pricePoints.length === 0) return 0;
    return pricePoints[pricePoints.length - 1].val;
  }, [pricePoints]);

  const periodChange = useMemo(() => {
    if (pricePoints.length < 2) return { amount: 0, pct: 0, isPositive: true };
    const first = pricePoints[0].val;
    const last = pricePoints[pricePoints.length - 1].val;
    const diff = last - first;
    const pct = first > 0 ? (diff / first) * 100 : 0;
    return {
      amount: diff,
      pct: Number(pct.toFixed(1)),
      isPositive: diff >= 0,
    };
  }, [pricePoints]);

  // Format currency symbol
  const formatPrice = (val: number) => {
    if (currency === 'SEK') return `${val.toLocaleString()} SEK`;
    if (currency === 'USD') return `$${val.toLocaleString()}`;
    return `€${val.toLocaleString()}`;
  };

  // Filtered recent sales
  const filteredSales = useMemo(() => {
    if (platformFilter === 'ALL') return timeline.latestSales;
    return timeline.latestSales.filter((s) => s.platform === platformFilter);
  }, [timeline.latestSales, platformFilter]);

  // Interactive mouse move over chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const usableW = chartWidth - paddingX * 2;
    const scaledX = (clientX / rect.width) * chartWidth;

    if (scaledX < paddingX || scaledX > chartWidth - paddingX) {
      setHoveredPoint(null);
      return;
    }

    const relativeX = (scaledX - paddingX) / usableW;
    const index = Math.round(relativeX * (svgCoordinates.length - 1));
    const clampedIndex = Math.max(0, Math.min(svgCoordinates.length - 1, index));
    if (svgCoordinates[clampedIndex]) {
      setHoveredPoint(svgCoordinates[clampedIndex].pt);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const currentHoveredCoord = useMemo(() => {
    if (!hoveredPoint) return null;
    return svgCoordinates.find((c) => c.pt.timestamp === hoveredPoint.timestamp) || null;
  }, [hoveredPoint, svgCoordinates]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Header Card Metadata & Fast Actions */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-20 bg-slate-950/60 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md">
            <img
              src={timeline.imageUrl}
              alt={timeline.cardName}
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {timeline.cardName}
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/10 border border-white/20 text-red-300">
                #{timeline.setNumber}
              </span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2 mt-1">
              <span className="font-semibold text-slate-200">{timeline.setName}</span>
              <span>&bull;</span>
              <span>Pokélector Verified Index</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-mono font-medium">Real-Time Market Curve</span>
            </div>
          </div>
        </div>

        {onTargetCard && (
          <button
            onClick={onTargetCard}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
              isTargetLocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white hover:scale-102'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isTargetLocked ? 'Target Card Locked in Camera ✓' : 'Target & Snap in Viewfinder'}</span>
          </button>
        )}
      </div>

      {/* Financial Spot Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 border-b border-slate-200 bg-slate-50/70 text-xs">
        <div className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-600 block">
            Current Spot Price ({currency})
          </span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-baseline gap-2">
            <span>{formatPrice(activeSpotPrice)}</span>
            <span
              className={`text-xs font-mono font-bold flex items-center ${
                periodChange.isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {periodChange.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {periodChange.isPositive ? '+' : ''}
              {periodChange.pct}%
            </span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-600 block">
            All-Time High (ATH)
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center justify-between">
            <span>
              {currency === 'SEK'
                ? `${timeline.allTimeHighSek.toLocaleString()} SEK`
                : currency === 'USD'
                ? `$${Math.round(timeline.allTimeHighSek / 9.94)}`
                : `€${Math.round(timeline.allTimeHighSek / 10.82)}`}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{timeline.allTimeHighDate}</span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-600 block">
            All-Time Low (ATL)
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center justify-between">
            <span>
              {currency === 'SEK'
                ? `${timeline.allTimeLowSek.toLocaleString()} SEK`
                : currency === 'USD'
                ? `$${Math.round(timeline.allTimeLowSek / 9.94)}`
                : `€${Math.round(timeline.allTimeLowSek / 10.82)}`}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{timeline.allTimeLowDate}</span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-600 block">
            Avg Weekly Volume
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center justify-between">
            <span>{timeline.averageWeeklyVolume} Sales/wk</span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              High Liquidity
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Timeframe, Currency & Slabs */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 font-semibold">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-mono ${
                timeframe === tf
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-medium">Currency:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-xs">
            <button
              onClick={() => setCurrency('SEK')}
              className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                currency === 'SEK'
                  ? 'bg-white text-red-600 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SEK (Tradera)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                currency === 'USD'
                  ? 'bg-white text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD (eBay)
            </button>
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                currency === 'EUR'
                  ? 'bg-white text-emerald-600 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EUR (Cardmarket)
            </button>
          </div>
        </div>

        {/* Grade Multiplier Overlay */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-medium">Condition:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setGradeView('raw')}
              className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                gradeView === 'raw'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw NM
            </button>
            <button
              onClick={() => setGradeView('psa10')}
              className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                gradeView === 'psa10'
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PSA 10 (Gem Mint)
            </button>
            <button
              onClick={() => setGradeView('psa9')}
              className={`px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                gradeView === 'psa9'
                  ? 'bg-slate-700 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PSA 9 (Mint)
            </button>
          </div>
        </div>
      </div>

      {/* SVG Interactive Financial Chart Canvas */}
      <div className="relative p-4 sm:p-6 bg-gradient-to-b from-white to-slate-50/50 select-none">
        {/* Scrubber Tooltip when hovering over curve */}
        {currentHoveredCoord && hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700 animate-in fade-in duration-150"
            style={{
              left: `${(currentHoveredCoord.x / chartWidth) * 100}%`,
              top: `${(currentHoveredCoord.y / chartHeight) * 100}%`,
            }}
          >
            <div className="font-mono text-[10px] text-slate-400">{hoveredPoint.date}</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span>{formatPrice(currentHoveredCoord.val)}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-red-200">
                {gradeView.toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">
              Volume: {hoveredPoint.volume} completed sales
            </div>
          </div>
        )}

        <div className="w-full overflow-hidden" ref={containerRef}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-56 sm:h-72 cursor-crosshair overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {/* Gradient under the curve */}
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#dc2626" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
              </linearGradient>

              {/* Gold gradient for PSA 10 view */}
              <linearGradient id="psa10Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingY + (chartHeight - paddingY * 2) * pct;
              const val = Math.round(maxVal - (maxVal - minVal) * pct);
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={chartWidth - paddingX + 6}
                    y={y + 3}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area under curve fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill={gradeView === 'psa10' ? 'url(#psa10Gradient)' : 'url(#curveGradient)'}
              />
            )}

            {/* The Main Bézier Price Line Curve */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={gradeView === 'psa10' ? '#d97706' : '#dc2626'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data point anchors */}
            {svgCoordinates.map((coord, i) => (
              <circle
                key={i}
                cx={coord.x}
                cy={coord.y}
                r={hoveredPoint?.timestamp === coord.pt.timestamp ? 5 : 2}
                fill={gradeView === 'psa10' ? '#f59e0b' : '#dc2626'}
                stroke="#ffffff"
                strokeWidth={hoveredPoint?.timestamp === coord.pt.timestamp ? 2 : 1}
                className="transition-all"
              />
            ))}

            {/* Vertical crosshair line when scrubbing */}
            {currentHoveredCoord && (
              <line
                x1={currentHoveredCoord.x}
                y1={paddingY}
                x2={currentHoveredCoord.x}
                y2={chartHeight - paddingY}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
          </svg>
        </div>

        {/* X-Axis Date markers */}
        <div className="flex justify-between px-6 pt-2 text-[10px] font-mono text-slate-600 border-t border-slate-100">
          <span>{filteredPoints[0]?.date}</span>
          <span>{filteredPoints[Math.floor(filteredPoints.length / 2)]?.date}</span>
          <span>{filteredPoints[filteredPoints.length - 1]?.date} (Latest)</span>
        </div>
      </div>

      {/* Latest Completed Sales Feed */}
      <div className="border-t border-slate-200 p-4 sm:p-5 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Latest Verified Sales Feed &bull; {timeline.cardName}
            </h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              {filteredSales.length} Recent Closings
            </span>
          </div>

          {/* Filter by Platform */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-600 text-[11px] mr-1">Platform:</span>
            {(['ALL', 'Tradera', 'eBay', 'Cardmarket'] as const).map((plat) => (
              <button
                key={plat}
                onClick={() => setPlatformFilter(plat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  platformFilter === plat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 text-xs">
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                {/* Platform Badge */}
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-tight uppercase border ${
                    sale.platform === 'Tradera'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : sale.platform === 'eBay'
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}
                >
                  {sale.platform}
                </span>

                <div>
                  <div className="font-semibold text-slate-900 line-clamp-1">{sale.title}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono mt-0.5">
                    <span>{sale.date}</span>
                    <span>&bull;</span>
                    <span className="text-slate-700">Seller: {sale.seller}</span>
                    {sale.bidsCount && (
                      <>
                        <span>&bull;</span>
                        <span className="text-amber-700 font-semibold">{sale.bidsCount} bids</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Price & External Proof Link */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="font-extrabold text-sm text-slate-900 font-mono">
                    {sale.priceSek.toLocaleString()} SEK
                  </div>
                  {sale.nativeCurrency !== 'SEK' && (
                    <div className="text-[10px] text-slate-600 font-mono">
                      ({sale.nativeCurrency === 'USD' ? `$${sale.priceNative}` : `€${sale.priceNative}`})
                    </div>
                  )}
                </div>

                <a
                  href={sale.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                  title="View closed listing proof"
                >
                  <span>Verify</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
