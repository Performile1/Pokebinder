import React from 'react';
import {
  X,
  ExternalLink,
  Flame,
  ShieldCheck,
  Scale,
  Send,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
  Gavel,
  ShieldAlert,
  Globe,
  LineChart,
  Award,
} from 'lucide-react';
import { ScanItem, PokemonCard } from '../types';
import { getCardRarityData } from '../data/rarityPopulationIndex';

interface CardDetailModalProps {
  item: ScanItem;
  onClose: () => void;
  onOpenConditionModal: (item: ScanItem) => void;
  onOpenTiltModal: (item: ScanItem) => void;
  onSendDiscordAlert: (item: ScanItem) => void;
  onOpenPriceCurve?: (card: PokemonCard) => void;
  onOpenAppreciationModal?: (card: PokemonCard) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  item,
  onClose,
  onOpenConditionModal,
  onOpenTiltModal,
  onSendDiscordAlert,
  onOpenPriceCurve,
  onOpenAppreciationModal,
}) => {
  const { card, economics, comps, condition, filterTelemetry } = item;
  if (!card || !economics) return null;

  const hasSnappedFront = Boolean(item.thumbnailUrl && item.thumbnailUrl.startsWith('data:'));
  const hasSnappedBack = Boolean(item.backThumbnailUrl);
  const [selectedPhoto, setSelectedPhoto] = React.useState<'official' | 'snapped_front' | 'snapped_back'>(
    hasSnappedFront ? 'snapped_front' : 'official'
  );

  const activePhotoUrl =
    selectedPhoto === 'snapped_front' && hasSnappedFront
      ? item.thumbnailUrl
      : selectedPhoto === 'snapped_back' && hasSnappedBack
      ? item.backThumbnailUrl!
      : card.imageUrl;

  const traderaUrl = `https://www.tradera.com/search?q=${encodeURIComponent(`${card.name} ${card.setNumber}`)}&itemStatus=Active`;
  const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${card.name} ${card.setNumber} -PSA -CGC -BGS`)}&LH_Sold=1&LH_Complete=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Pokémon Red Accent */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {card.name}
                <span className="text-xs font-mono text-red-600 font-normal">
                  {card.setNumber}
                </span>
                {item.isTargetedSetCard && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-mono font-bold">
                    Targeted Set Card
                  </span>
                )}
                {economics.isHighArbitrage && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-2xs">
                    <Flame className="w-3 h-3 fill-current text-white" />
                    ARBITRAGE HIT (&gt;20% ROI)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {card.setName} ({card.releaseYear}) &bull; {card.rarity} &bull; {card.foilType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Card Overview & Quick Financial Metric Grid */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-2 flex-shrink-0 self-center sm:self-start">
              <div className="relative w-48 h-68 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-50">
                <img
                  src={activePhotoUrl}
                  alt={card.name}
                  className="w-full h-full object-contain p-1"
                />
                {card.isHighValue && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-600 text-[9px] font-mono font-bold text-white shadow-2xs">
                    GRAIL
                  </div>
                )}
                {selectedPhoto.startsWith('snapped') && (
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-center text-white backdrop-blur-xs">
                    Physical Photo (L:{item.sharpnessScore})
                  </div>
                )}
              </div>

              {/* Photo Source Selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold">
                <button
                  onClick={() => setSelectedPhoto('official')}
                  className={`px-2 py-0.5 rounded transition ${
                    selectedPhoto === 'official' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Reference
                </button>
                {hasSnappedFront && (
                  <button
                    onClick={() => setSelectedPhoto('snapped_front')}
                    className={`px-2 py-0.5 rounded transition ${
                      selectedPhoto === 'snapped_front' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Front Photo
                  </button>
                )}
                {hasSnappedBack && (
                  <button
                    onClick={() => setSelectedPhoto('snapped_back')}
                    className={`px-2 py-0.5 rounded transition ${
                      selectedPhoto === 'snapped_back' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Back Photo
                  </button>
                )}
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="flex-1 w-full space-y-3.5">
              {/* Card Rarity & Scarcity Census Banner */}
              {(() => {
                const r = getCardRarityData(card);
                return (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        Sällsynthet &amp; PSA Populationscensus
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-mono font-black shadow-2xs">
                        {r.rarityTier.toUpperCase()} &bull; {r.scarcityScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="bg-white/90 p-2 rounded-lg border border-amber-200">
                        <span className="text-[10px] text-slate-500 block uppercase">Dra-chans (Pull Rate)</span>
                        <strong className="text-slate-900 block mt-0.5">1 på {r.pullRatePacks} paket</strong>
                        <span className="text-[9px] text-slate-400">({r.pullProbabilityPercent}%)</span>
                      </div>

                      <div className="bg-white/90 p-2 rounded-lg border border-amber-200">
                        <span className="text-[10px] text-slate-500 block uppercase">PSA 10 Gem Mint Pop</span>
                        <strong className="text-emerald-700 block mt-0.5">{r.psa10Count.toLocaleString()} st</strong>
                        <span className="text-[9px] text-emerald-600 font-semibold">{r.psa10GemRatePercent}% Gem Rate</span>
                      </div>

                      <div className="bg-white/90 p-2 rounded-lg border border-amber-200 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 block uppercase">Totalt Graderade</span>
                        <strong className="text-slate-800 block mt-0.5">{r.psaTotalGraded.toLocaleString()} st</strong>
                        <span className="text-[9px] text-purple-700 font-semibold">{r.printClassification.split(' (')[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Leading Bid vs Sold For Comparison Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                    <Gavel className="w-3.5 h-3.5 text-red-600" />
                    Tradera Acquisition Pricing
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-mono font-bold">
                    Active Mode: {economics.valuationBasis === 'sold_for' ? 'Sold For (Slutpris)' : 'Leading Bid (Sniping)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Confirmed Sold For (Slutpris)</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {card.typicalTraderaSoldSEK} SEK
                    </div>
                    <div className="text-[10px] text-slate-400">Historical closed average</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Active Leading Bid</div>
                    <div className="text-base font-bold text-red-600 mt-0.5">
                      {card.typicalTraderaLeadingBidSEK} SEK
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {card.typicalTraderaBidsCount} bids &bull; {card.typicalTraderaTimeLeft} left
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Spreadsheet */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">
                  Cross-Border Fee Deductions
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross eBay Selling Price:</span>
                  <span className="font-bold text-slate-900">${economics.grossRevenueUsd} USD (~{economics.grossRevenueSek} SEK)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>eBay Trading Cards Fee (13.25%):</span>
                  <span className="text-red-600">-${economics.ebayFeeUsd} (-{economics.ebayFeeSek} SEK)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hidden FX Conversion Spread (3%):</span>
                  <span className="text-red-600">-{economics.fxSpreadSek} SEK</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tracked PostNord Shipping (SE &rarr; US):</span>
                  <span className="text-red-600">-${economics.internationalShippingUsd} (-{economics.internationalShippingSek} SEK)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Total Deductions:</span>
                  <span className="text-red-600">-{economics.totalFeesSek} SEK</span>
                </div>
              </div>

              {/* Net Profit Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  economics.netProfitSek > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase font-mono font-bold tracking-wider">
                    Net Arbitrage Profit
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {economics.netProfitSek > 0 ? '+' : ''}
                    {economics.netProfitSek} SEK
                    <span className="text-sm font-normal text-slate-600 ml-2">
                      (~${economics.netProfitUsd} USD)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono font-bold tracking-wider">
                    Net ROI
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {economics.roiPercentage > 0 ? '+' : ''}
                    {economics.roiPercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subgrades & Anti-Fake Sanitization Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Condition & Centering */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-red-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Condition Caliper</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    L/R {condition?.centering.leftRightRatio[0]}:{condition?.centering.leftRightRatio[1]} &bull; {condition?.estimatedGrade}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenConditionModal(item)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                Inspect
              </button>
            </div>

            {/* Anti-Fake Shield */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Anti-Fake Defense</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Sanitized: {filterTelemetry?.rejectedKeywords ?? 1} keywords, {filterTelemetry?.rejectedOutliers ?? 1} outliers dropped
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                IQR Clean
              </span>
            </div>
          </div>

          {/* Multi-Market Cross-Border Valuation Comparison */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-red-600" />
                Cross-Border Marknadsjämförelse
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                EU Fri Rörlighet: 0% Tull
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {/* Cardmarket */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>🇪🇺</span> Cardmarket (EUR)
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  €{card.typicalCardmarketEUR || Math.round(card.typicalTraderaSoldSEK / 11.13)}
                </div>
                <div className="text-[10px] text-emerald-600">0% Tull inom EU</div>
              </div>

              {/* TCGPlayer */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>🇺🇸</span> TCGPlayer (USD)
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  ${card.typicalTcgplayerUSD || card.typicalEbayUSD}
                </div>
                <div className="text-[10px] text-slate-400">Market Price US</div>
              </div>

              {/* Mercari Japan */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>🇯🇵</span> Mercari Japan (JPY)
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  ¥{(card.typicalMercariJPY || 25000).toLocaleString()}
                </div>
                <div className="text-[10px] text-amber-600">+25% Moms / PostNord</div>
              </div>

              {/* Blocket */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>🇸🇪</span> Blocket / Samling
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {card.typicalBlocketSEK || card.typicalTraderaLeadingBidSEK} kr
                </div>
                <div className="text-[10px] text-slate-400">Lokal affär (Swish)</div>
              </div>
            </div>
          </div>

          {/* Recent Market Comps with Leading Bid vs Sold For Badges */}
          {comps && comps.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Recent Market Comps &amp; Leading Bids (eBay &amp; Tradera)
              </h4>
              <div className="space-y-2">
                {comps.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs font-mono shadow-2xs"
                  >
                    <div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${
                          comp.isLeadingBid
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : comp.source === 'eBay Sold'
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {comp.isLeadingBid ? 'Active Leading Bid' : comp.source === 'eBay Sold' ? 'eBay Sold For' : 'Tradera Slutpris'}
                      </span>
                      <span className="text-slate-800">{comp.title}</span>
                      {comp.timeLeft && (
                        <span className="text-[10px] text-red-600 font-bold ml-2">({comp.timeLeft} left)</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="font-bold text-slate-900">
                        {comp.priceUSD ? `$${comp.priceUSD} (~${comp.priceSEK} SEK)` : `${comp.priceSEK} SEK`}
                      </div>
                      <div className="text-[10px] text-slate-400">{comp.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={traderaUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <span>🛒</span> Buy on Tradera <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>

            {onOpenPriceCurve && (
              <button
                onClick={() => {
                  onOpenPriceCurve(card);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <LineChart className="w-3.5 h-3.5 text-red-400" />
                <span>Price Curve (365d)</span>
              </button>
            )}

            {onOpenAppreciationModal && (
              <button
                onClick={() => {
                  onOpenAppreciationModal(card);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-100" />
                <span>Värdeprognos (1–3 år)</span>
              </button>
            )}
          </div>

          <button
            onClick={() => onSendDiscordAlert(item)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Discord Alert
          </button>
        </div>
      </div>
    </div>
  );
};
