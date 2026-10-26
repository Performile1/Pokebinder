import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Award,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Layers,
  Target,
  LineChart,
  CheckCircle2,
  X,
  Zap,
} from 'lucide-react';
import { PokemonCard, CardAppreciationForecast } from '../types';
import { predictCardAppreciation } from '../utils/predictiveAppreciation';

interface AppreciationAnalysisModalProps {
  card: PokemonCard;
  onClose: () => void;
  onTargetCard?: (card: PokemonCard) => void;
  onOpenPriceCurve?: (card: PokemonCard) => void;
  usdToSek?: number;
  isTargetLocked?: boolean;
}

type Scenario = 'base' | 'bull' | 'bear';

export const AppreciationAnalysisModal: React.FC<AppreciationAnalysisModalProps> = ({
  card,
  onClose,
  onTargetCard,
  onOpenPriceCurve,
  usdToSek = 9.94,
  isTargetLocked = false,
}) => {
  const [scenario, setScenario] = useState<Scenario>('base');
  const [showPsa10Overlay, setShowPsa10Overlay] = useState<boolean>(true);

  const forecast = predictCardAppreciation(card, usdToSek);

  const getScenarioPrice12m = () => {
    if (scenario === 'bull') return forecast.forecast12m.bullSek;
    if (scenario === 'bear') return forecast.forecast12m.bearSek;
    return forecast.forecast12m.baseSek;
  };

  const getScenarioPrice36m = () => {
    if (scenario === 'bull') return forecast.forecast36m.bullSek;
    if (scenario === 'bear') return forecast.forecast36m.bearSek;
    return forecast.forecast36m.baseSek;
  };

  const getScenarioGrowthPct = (months: 12 | 36) => {
    const targetPrice = months === 12 ? getScenarioPrice12m() : getScenarioPrice36m();
    return Math.round(((targetPrice - forecast.currentPriceSek) / forecast.currentPriceSek) * 100);
  };

  // SVG Chart Dimensions
  const chartW = 620;
  const chartH = 210;
  const padX = 40;
  const padY = 25;

  const maxVal = Math.round(
    Math.max(
      forecast.forecast36m.bullSek * 1.15,
      showPsa10Overlay ? forecast.psa10Projected36mSek * 1.1 : forecast.forecast36m.bullSek
    )
  );
  const minVal = Math.round(forecast.currentPriceSek * 0.85);
  const valRange = maxVal - minVal || 1;

  const points = forecast.trajectoryPoints.map((pt, i) => {
    const x = padX + (i / (forecast.trajectoryPoints.length - 1)) * (chartW - padX * 2);
    let rawPrice = pt.projectedPriceSek;
    if (scenario === 'bull') rawPrice = pt.upperBandSek;
    if (scenario === 'bear') rawPrice = pt.lowerBandSek;

    const y = chartH - padY - ((rawPrice - minVal) / valRange) * (chartH - padY * 2);
    const psa10Y =
      chartH - padY - ((pt.projectedPsa10Sek - minVal) / valRange) * (chartH - padY * 2);
    const lowerY = chartH - padY - ((pt.lowerBandSek - minVal) / valRange) * (chartH - padY * 2);
    const upperY = chartH - padY - ((pt.upperBandSek - minVal) / valRange) * (chartH - padY * 2);

    return { x, y, psa10Y, lowerY, upperY, pt, rawPrice };
  });

  // SVG Line paths
  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const psa10LineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.psa10Y}`).join(' ');
  const tunnelD = `M ${points[0].x} ${points[0].upperY} ` +
    points.map((p) => `L ${p.x} ${p.upperY}`).join(' ') +
    points.slice().reverse().map((p) => `L ${p.x} ${p.lowerY}`).join(' ') +
    ' Z';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-start sm:items-center justify-between border-b border-white/10 gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-16 bg-white/10 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-md">
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI-VÄRDEÖKNINGSMODELL
                </span>
                <span className="text-xs font-mono text-slate-300">#{card.setNumber}</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5 tracking-tight">
                {card.name} &bull; Värdeprognos
              </h3>
              <p className="text-xs text-slate-300">
                {card.setName} ({card.releaseYear}) &bull; Modellerad efter historiska kohortmönster
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confidence & Spot Price Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 border-b border-slate-200 bg-slate-50 text-xs">
          <div className="p-3.5 sm:p-4">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Dagspris (Spot)</span>
            <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">
              {forecast.currentPriceSek.toLocaleString()} SEK
            </div>
            <span className="text-[10px] text-slate-400 font-mono">(~${forecast.currentPriceUsd})</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-emerald-50/50">
            <span className="text-[10px] font-mono uppercase text-emerald-800 block font-semibold">
              Prognos 12 Månader
            </span>
            <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono flex items-center gap-1">
              <span>{getScenarioPrice12m().toLocaleString()} SEK</span>
              <span className="text-xs font-bold text-emerald-600">
                (+{getScenarioGrowthPct(12)}%)
              </span>
            </div>
            <span className="text-[10px] text-emerald-800 font-mono">
              {scenario.toUpperCase()}-scenario
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-indigo-50/50">
            <span className="text-[10px] font-mono uppercase text-indigo-800 block font-semibold">
              Prognos 36 Månader
            </span>
            <div className="text-lg font-black text-indigo-700 mt-0.5 font-mono flex items-center gap-1">
              <span>{getScenarioPrice36m().toLocaleString()} SEK</span>
              <span className="text-xs font-bold text-indigo-600">
                (+{getScenarioGrowthPct(36)}%)
              </span>
            </div>
            <span className="text-[10px] text-indigo-800 font-mono">Out-of-Print mognad</span>
          </div>

          <div className="p-3.5 sm:p-4">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Modellens Konfidens
            </span>
            <div className="text-lg font-black text-slate-900 mt-0.5 font-mono flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{forecast.confidenceScore}%</span>
            </div>
            <span className="text-[10px] text-slate-500">{forecast.riskRating}</span>
          </div>
        </div>

        {/* Interactive Scenario Controls */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold text-xs">Marknadsscenario:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-xs">
              <button
                onClick={() => setScenario('base')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  scenario === 'base'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Base Case (Normal)
              </button>
              <button
                onClick={() => setScenario('bull')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  scenario === 'bull'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bull Case (+155%)
              </button>
              <button
                onClick={() => setScenario('bear')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  scenario === 'bear'
                    ? 'bg-slate-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bear Case (Lågkonj.)
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-700">
            <input
              type="checkbox"
              checked={showPsa10Overlay}
              onChange={(e) => setShowPsa10Overlay(e.target.checked)}
              className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-amber-700">Visa PSA 10 Trajektoria (Guldlinje)</span>
          </label>
        </div>

        {/* Forecast Trajectory Visual Chart */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 select-none">
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900">
                Beräknad Värdeökningskurva (0 &ndash; 36 månader)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Skuggat fält = Konfidensintervall (Bear till Bull)
            </span>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48 sm:h-56 overflow-visible">
            {/* Shaded Uncertainty Tunnel */}
            <path d={tunnelD} fill="#10b981" fillOpacity="0.08" />

            {/* Grid horizontal lines */}
            {[0, 0.33, 0.66, 1].map((pct, i) => {
              const y = padY + (chartH - padY * 2) * pct;
              const val = Math.round(maxVal - (maxVal - minVal) * pct);
              return (
                <g key={i}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={chartW - padX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={chartW - padX + 5}
                    y={y + 3}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {val} kr
                  </text>
                </g>
              );
            })}

            {/* PSA 10 line */}
            {showPsa10Overlay && (
              <path
                d={psa10LineD}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
            )}

            {/* Main forecast line */}
            <path
              d={lineD}
              fill="none"
              stroke={scenario === 'bull' ? '#059669' : scenario === 'bear' ? '#475569' : '#0284c7'}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Nodes */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={scenario === 'bull' ? '#10b981' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#0f172a"
                >
                  {p.rawPrice.toLocaleString()} kr
                </text>
                {showPsa10Overlay && (
                  <circle cx={p.x} cy={p.psa10Y} r={3.5} fill="#f59e0b" stroke="#ffffff" />
                )}
              </g>
            ))}
          </svg>

          {/* Time axis labels */}
          <div className="flex justify-between px-6 pt-2 text-[10px] font-mono text-slate-600 border-t border-slate-200">
            {forecast.trajectoryPoints.map((pt, i) => (
              <span key={i} className="text-center">
                {pt.label}
              </span>
            ))}
          </div>
        </div>

        {/* Historical Comparative Cohort Card */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Historisk Jämförelsekohort &bull; {forecast.cohortComparison.cohortName}
              </h4>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {forecast.cohortComparison.correlationRationale}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-amber-200/80 text-xs font-mono">
              <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-slate-500 block">Referenskort:</span>
                <strong className="text-slate-900 truncate block">
                  {forecast.cohortComparison.referenceCardName}
                </strong>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-slate-500 block">Historisk ökning 12m:</span>
                <strong className="text-emerald-700 block">
                  +{forecast.cohortComparison.historical12mGrowthPct}% (från {forecast.cohortComparison.initialPriceSek} kr)
                </strong>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-slate-500 block">Historisk ökning 36m:</span>
                <strong className="text-emerald-700 block">
                  +{forecast.cohortComparison.historical36mGrowthPct}% (till {forecast.cohortComparison.priceAfter36mSek} kr)
                </strong>
              </div>
            </div>
          </div>

          {/* Growth Catalysts Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Identifierade Tillväxtkatalysatorer
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {forecast.growthCatalysts.map((cat, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenPriceCurve && (
              <button
                onClick={() => {
                  onOpenPriceCurve(card);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <LineChart className="w-3.5 h-3.5 text-amber-400" />
                <span>Se Historisk 365d Prisgraf</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onTargetCard && (
              <button
                onClick={() => {
                  onTargetCard(card);
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isTargetLocked
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>{isTargetLocked ? 'Mål Låst ✓' : 'Målsätt & Fota i Sökaren'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
