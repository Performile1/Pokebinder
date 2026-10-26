import React, { useState } from 'react';
import {
  ExternalLink,
  Flame,
  ShieldCheck,
  Scale,
  Send,
  Sparkles,
  Download,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  ShieldAlert,
} from 'lucide-react';
import { ScanItem } from '../types';

interface ArbitrageTableProps {
  items: ScanItem[];
  valuationBasis: 'sold_for' | 'leading_bid';
  onOpenConditionModal: (item: ScanItem) => void;
  onOpenTiltModal: (item: ScanItem) => void;
  onSendDiscordAlert: (item: ScanItem) => void;
  onOpenDetailModal: (item: ScanItem) => void;
}

export const ArbitrageTable: React.FC<ArbitrageTableProps> = ({
  items,
  valuationBasis,
  onOpenConditionModal,
  onOpenTiltModal,
  onSendDiscordAlert,
  onOpenDetailModal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'profitable' | 'high_arb' | 'high_value'>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'profit' | 'time'>('roi');

  // Filter items
  const filtered = items.filter((item) => {
    if (!item.card || !item.economics) return false;
    if (filterMode === 'profitable') return item.economics.isProfitable;
    if (filterMode === 'high_arb') return item.economics.isHighArbitrage;
    if (filterMode === 'high_value') return item.card.isHighValue;
    return true;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'roi') {
      return (b.economics?.roiPercentage || 0) - (a.economics?.roiPercentage || 0);
    }
    if (sortBy === 'profit') {
      return (b.economics?.netProfitSek || 0) - (a.economics?.netProfitSek || 0);
    }
    return b.timestamp - a.timestamp;
  });

  // Export inventory as CSV
  const handleExportCSV = () => {
    const headers = [
      'Card Name',
      'Set Number',
      'Set Name',
      'Valuation Basis',
      'Tradera Price (SEK)',
      'eBay Sold (USD)',
      'Gross Revenue (SEK)',
      'Total Fees & Shipping (SEK)',
      'Net Profit (SEK)',
      'Net ROI (%)',
      'Centering (L/R)',
      'Centering (T/B)',
      'Estimated Grade',
      'Scan Time',
    ];

    const rows = sorted.map((i) => [
      `"${i.card?.name || ''}"`,
      `"${i.card?.setNumber || ''}"`,
      `"${i.card?.setName || ''}"`,
      `"${i.economics?.valuationBasis || valuationBasis}"`,
      i.economics?.costOfGoodsSek || 0,
      i.economics?.grossRevenueUsd || 0,
      i.economics?.grossRevenueSek || 0,
      i.economics?.totalFeesSek || 0,
      i.economics?.netProfitSek || 0,
      i.economics?.roiPercentage || 0,
      `"${i.condition?.centering.leftRightRatio.join('/') || ''}"`,
      `"${i.condition?.centering.topBottomRatio.join('/') || ''}"`,
      `"${i.condition?.estimatedGrade || ''}"`,
      `"${new Date(i.timestamp).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pokearb_scans_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden flex flex-col">
      {/* Control Bar - Bright Pokémon Red & Grey styling */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono uppercase text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-red-600" /> Filter:
          </span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Scans ({items.length})
          </button>
          <button
            onClick={() => setFilterMode('high_arb')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              filterMode === 'high_arb'
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/30'
                : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            &gt;20% ROI Hits ({items.filter((i) => i.economics?.isHighArbitrage).length})
          </button>
          <button
            onClick={() => setFilterMode('profitable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterMode === 'profitable'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Profitable ({items.filter((i) => i.economics?.isProfitable).length})
          </button>
          <button
            onClick={() => setFilterMode('high_value')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterMode === 'high_value'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            Grails &gt;$100 ({items.filter((i) => i.card?.isHighValue).length})
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Leading Bid vs Sold For Ticker */}
          <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-mono flex items-center gap-1.5">
            <Gavel className="w-3 h-3 text-red-600" />
            <span>Mode:</span>
            <span className="font-bold text-red-600">
              {valuationBasis === 'sold_for' ? 'Sold For (Slutpris)' : 'Leading Bid (Auction Sniping)'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'roi' | 'profit' | 'time')}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="roi">Sort by Net ROI %</option>
              <option value="profit">Sort by Net Profit (SEK)</option>
              <option value="time">Sort by Scan Time</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition disabled:opacity-50 shadow-2xs"
            title="Export CSV for inventory or cross-listing"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            CSV Export
          </button>
        </div>
      </div>

      {/* Table Data - Clean Bright White */}
      {sorted.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          No cards matched the current filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Card / Set</th>
                <th className="py-3 px-4">Tradera (Leading vs Sold)</th>
                <th className="py-3 px-4">eBay Sold Comps</th>
                <th className="py-3 px-4">Deductions (Fees + Post)</th>
                <th className="py-3 px-4">Net Profit (SEK)</th>
                <th className="py-3 px-4">Net ROI</th>
                <th className="py-3 px-4">Caliper &amp; Anti-Fake</th>
                <th className="py-3 px-4 text-right">Arbitrage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((item) => {
                const { card, economics, condition } = item;
                if (!card || !economics) return null;

                const traderaUrl = `https://www.tradera.com/search?q=${encodeURIComponent(`${card.name} ${card.setNumber}`)}&itemStatus=Active`;
                const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${card.name} ${card.setNumber} -PSA -CGC -BGS`)}&LH_Sold=1&LH_Complete=1`;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition group ${
                      economics.isHighArbitrage ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* Card Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => onOpenDetailModal(item)}
                          className="relative w-11 h-15 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 cursor-pointer group-hover:border-red-500 transition shadow-2xs"
                        >
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          {card.isHighValue && (
                            <div className="absolute top-0 right-0 p-0.5 bg-red-600 rounded-bl text-[8px] text-white font-bold">
                              ★
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div
                            onClick={() => onOpenDetailModal(item)}
                            className="font-bold text-slate-900 hover:text-red-600 cursor-pointer truncate flex items-center gap-1.5"
                          >
                            {card.name}
                            {economics.isHighArbitrage && (
                              <span className="p-0.5 rounded bg-red-100 text-red-600" title="Arbitrage Margin > 20%">
                                <Flame className="w-3 h-3 fill-current" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {card.setNumber} &bull; {card.setName} ({card.releaseYear})
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tradera: Leading Bid vs Sold For */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {economics.costOfGoodsSek} SEK
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">
                          ({valuationBasis === 'sold_for' ? 'Slutpris' : 'Leading Bid'})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>Leading: {card.typicalTraderaLeadingBidSEK} SEK ({card.typicalTraderaBidsCount} bids)</span>
                      </div>
                    </td>

                    {/* eBay Comps */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 text-sm">
                        ${economics.grossRevenueUsd} USD
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ~{economics.grossRevenueSek} SEK (Mid-Market)
                      </div>
                    </td>

                    {/* Deductions */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      <div>eBay 13.25%: -{economics.ebayFeeSek} SEK</div>
                      <div className="text-[10px] text-slate-400">
                        PostNord: -{economics.internationalShippingSek} SEK &bull; FX 3%
                      </div>
                    </td>

                    {/* Net Profit */}
                    <td className="py-3.5 px-4 font-mono">
                      <div
                        className={`text-sm font-bold ${
                          economics.netProfitSek > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {economics.netProfitSek > 0 ? '+' : ''}
                        {economics.netProfitSek} SEK
                      </div>
                      <div className="text-[10px] text-slate-400">
                        (~${economics.netProfitUsd} USD)
                      </div>
                    </td>

                    {/* Net ROI */}
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                          economics.isHighArbitrage
                            ? 'bg-red-600 text-white shadow-xs'
                            : economics.netProfitSek > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {economics.isHighArbitrage && <Flame className="w-3 h-3 fill-current text-white" />}
                        {economics.roiPercentage > 0 ? '+' : ''}
                        {economics.roiPercentage}%
                      </span>
                    </td>

                    {/* Condition & Anti-Fake Shield */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenConditionModal(item)}
                          className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 flex items-center gap-1 transition"
                        >
                          <Scale className="w-3 h-3 text-red-600" />
                          <span>
                            {condition?.centering.leftRightRatio[0]}:{condition?.centering.leftRightRatio[1]} LR
                          </span>
                        </button>
                        <span
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600"
                          title="Sanitized via Keyword Blacklist & IQR statistical math"
                        >
                          IQR Clean
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {condition?.estimatedGrade || 'PSA 9-10'}
                      </div>
                    </td>

                    {/* Arbitrage Action Links */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Buy on Tradera link */}
                        <a
                          href={traderaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                          title="Open Tradera live listings"
                        >
                          🛒 Tradera <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>

                        {/* Check eBay Sold link */}
                        <a
                          href={ebayUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition"
                          title="Check eBay raw sold comps (-PSA -CGC -BGS)"
                        >
                          📈 eBay <ExternalLink className="w-3 h-3 ml-0.5 text-slate-400" />
                        </a>

                        {/* High-value Tilt Test button */}
                        {card.isHighValue && (
                          <button
                            onClick={() => onOpenTiltModal(item)}
                            className={`p-1.5 rounded-lg border transition ${
                              item.tiltTestPassed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                            }`}
                            title={item.tiltTestPassed ? 'Holo Tilt Verified Authentic' : 'Verify Holo Tilt & Rosettes'}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Send Discord alert */}
                        <button
                          onClick={() => onSendDiscordAlert(item)}
                          className={`p-1.5 rounded-lg border transition ${
                            item.discordAlertSent
                              ? 'bg-red-50 border-red-300 text-red-600'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                          title="Dispatch Discord Webhook Alert"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
