import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  Target,
  ExternalLink,
  Calendar,
  Filter,
  CheckCircle2,
  ArrowRight,
  LineChart,
  Eye,
  X,
  Compass,
} from 'lucide-react';
import { PokecollectorSet, PokemonCard, CardPriceTimeline } from '../types';
import { POKECOLLECTOR_SETS, generatePriceTimeline } from '../data/pokecollectorCatalog';
import { PriceHistoryChart } from './PriceHistoryChart';

interface PokecollectorBrowserProps {
  onTargetAndSnap: (card: PokemonCard) => void;
  currentlyTargetedCard: PokemonCard | null;
  usdToSek: number;
  eurToSek: number;
}

type SeriesTab = 'ALL' | 'Scarlet & Violet' | 'Sword & Shield' | 'Sun & Moon' | 'XY & Vintage' | 'Japanese Sets';

export const PokecollectorBrowser: React.FC<PokecollectorBrowserProps> = ({
  onTargetAndSnap,
  currentlyTargetedCard,
  usdToSek,
  eurToSek,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<SeriesTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSetId, setSelectedSetId] = useState<string>('sv8pt5'); // Default to Prismatic Evolutions
  const [activeCurveCard, setActiveCurveCard] = useState<PokemonCard | null>(
    POKECOLLECTOR_SETS[0].featuredCards[0]
  );
  const [showCurveModal, setShowCurveModal] = useState<boolean>(false);

  // Filter sets by series
  const filteredSets = useMemo(() => {
    let sets = POKECOLLECTOR_SETS;
    if (selectedSeries !== 'ALL') {
      sets = sets.filter((s) => s.series === selectedSeries);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      sets = sets.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.series.toLowerCase().includes(q) ||
          s.featuredCards.some((c) => c.name.toLowerCase().includes(q) || c.setNumber.includes(q))
      );
    }
    return sets;
  }, [selectedSeries, searchQuery]);

  // Current active set
  const currentSet = useMemo(() => {
    return (
      POKECOLLECTOR_SETS.find((s) => s.id === selectedSetId) ||
      filteredSets[0] ||
      POKECOLLECTOR_SETS[0]
    );
  }, [selectedSetId, filteredSets]);

  // Active timeline for selected card
  const activeTimeline = useMemo<CardPriceTimeline | null>(() => {
    if (!activeCurveCard) return null;
    return generatePriceTimeline(activeCurveCard, usdToSek, eurToSek);
  }, [activeCurveCard, usdToSek, eurToSek]);

  const handleOpenPriceCurve = (card: PokemonCard) => {
    setActiveCurveCard(card);
    setShowCurveModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Pokélector Database & Set Browser Overview */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-mono font-bold tracking-wide mb-3">
            <Compass className="w-3.5 h-3.5 text-white" />
            POKÉCOLLECTOR ALL-SETS INDEX &bull; PRICE CURVE TRACKER
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            All Sets, Chase Cards &amp; Price Curves Over Time
          </h2>
          <p className="text-xs sm:text-sm text-red-100 mt-1.5 leading-relaxed">
            Browse complete expansions from modern <span className="font-bold text-white">Prismatic Evolutions</span> and <span className="font-bold text-white">Pokémon 151</span> back to vintage <span className="font-bold text-white">Base Set 1999</span>. Inspect historical sale curves, track PSA 10 premiums, and target cards directly for camera scanning.
          </p>
        </div>

        {/* Search & Series Switcher in Banner */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-10">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search set name (151, Crown Zenith, Base) or card name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-white/60 text-xs font-medium border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Series Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
            {(
              [
                'ALL',
                'Scarlet & Violet',
                'Sword & Shield',
                'Sun & Moon',
                'XY & Vintage',
                'Japanese Sets',
              ] as SeriesTab[]
            ).map((series) => (
              <button
                key={series}
                onClick={() => setSelectedSeries(series)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  selectedSeries === series
                    ? 'bg-white text-red-700 font-bold shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {series === 'ALL' ? 'All Eras' : series}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Sets Carousel / Sidebar + Set Cards View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sets List Explorer (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-red-600" />
              Expansions ({filteredSets.length})
            </span>
            <span className="text-[11px] font-mono text-slate-600">Select to browse cards</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-2 max-h-[620px] overflow-y-auto space-y-1.5 shadow-xs">
            {filteredSets.map((set) => {
              const isSelected = set.id === selectedSetId;
              return (
                <button
                  key={set.id}
                  onClick={() => setSelectedSetId(set.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-red-50/70 border-red-300 shadow-2xs'
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">{set.name}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                      <span>{set.series}</span>
                      <span>&bull;</span>
                      <span>{set.releaseYear}</span>
                      <span>&bull;</span>
                      <span className="font-mono">{set.cardsCount} cards</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <span className="text-xs font-mono font-bold text-slate-600 px-2 py-1 rounded bg-slate-100 border border-slate-200">
                      {set.id.toUpperCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Set Details & Cards Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Set Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">{currentSet.name}</h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                  {currentSet.series}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Released {currentSet.releaseDate} &bull; {currentSet.totalCards} Official Cards &bull; pokecollector.com/sets/{currentSet.pokecollectorSlug}
              </p>
            </div>

            <a
              href={`https://www.pokecollector.com/sets/${currentSet.pokecollectorSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>View on Pokélector</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSet.featuredCards.map((card) => {
              const isTargeted = currentlyTargetedCard?.id === card.id;

              return (
                <div
                  key={card.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition hover:shadow-md group"
                >
                  <div className="flex items-start gap-3">
                    {/* Card Scan Image */}
                    <div className="relative w-20 h-28 shrink-0 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-sm group-hover:scale-102 transition duration-200">
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-contain p-0.5"
                        loading="lazy"
                      />
                    </div>

                    {/* Metadata & Prices */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          #{card.setNumber}
                        </span>
                        <span className="text-[11px] text-red-600 font-semibold truncate">
                          {card.rarity}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-red-600 transition">
                        {card.name}
                      </h4>

                      {/* Pricing Benchmarks */}
                      <div className="mt-2.5 space-y-1 font-mono text-xs">
                        <div className="flex items-center justify-between text-amber-900 bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200/60">
                          <span className="text-[10px] text-amber-700 uppercase font-sans font-semibold">
                            Tradera Sold:
                          </span>
                          <span className="font-bold">
                            ~{card.typicalTraderaSoldSEK.toLocaleString()} SEK
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-blue-900 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200/60">
                          <span className="text-[10px] text-blue-700 uppercase font-sans font-semibold">
                            eBay USD:
                          </span>
                          <span className="font-bold">${card.typicalEbayUSD}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    {/* View Curve Button */}
                    <button
                      onClick={() => handleOpenPriceCurve(card)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <LineChart className="w-3.5 h-3.5 text-slate-600" />
                      <span>Price Curve</span>
                    </button>

                    {/* Target & Snap Button */}
                    <button
                      onClick={() => onTargetAndSnap(card)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                        isTargeted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>{isTargeted ? 'Target Locked' : 'Target & Snap'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Standalone Full Price Curve & Sales Modal */}
      {showCurveModal && activeTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Pokélector Price Curve &bull; {activeTimeline.cardName}
                </h3>
              </div>
              <button
                onClick={() => setShowCurveModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <PriceHistoryChart
                timeline={activeTimeline}
                onTargetCard={() => {
                  if (activeCurveCard) {
                    onTargetAndSnap(activeCurveCard);
                    setShowCurveModal(false);
                  }
                }}
                isTargetLocked={currentlyTargetedCard?.id === activeCurveCard?.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
