import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Award,
  Sparkles,
  TrendingUp,
  Target,
  LineChart,
  ShieldCheck,
  Package,
  Info,
  Filter,
  Flame,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';
import { PokemonCard, CardRarityData } from '../types';
import { POKEMON_CARD_DATABASE } from '../data/pokemonCards';
import { POKECOLLECTOR_SETS } from '../data/pokecollectorCatalog';
import {
  CARD_RARITY_CENSUS,
  SETS_RARITY_DIRECTORY,
  getCardRarityData,
} from '../data/rarityPopulationIndex';

interface RarityPopulationExplorerProps {
  onTargetAndSnap: (card: PokemonCard) => void;
  onOpenPriceCurve: (card: PokemonCard) => void;
  currentlyTargetedCard: PokemonCard | null;
}

type RarityFilter = 'ALL' | 'Holy Grail' | 'Ultra Chase' | 'Secret Rare' | 'Illustration Rare';

export const RarityPopulationExplorer: React.FC<RarityPopulationExplorerProps> = ({
  onTargetAndSnap,
  onOpenPriceCurve,
  currentlyTargetedCard,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('ALL');
  const [selectedSetFilter, setSelectedSetFilter] = useState<string>('ALL');

  // Gather all unique cards across database and Pokécollector sets
  const allCards = useMemo(() => {
    const map = new Map<string, PokemonCard>();
    POKEMON_CARD_DATABASE.forEach((c) => map.set(c.id, c));
    POKECOLLECTOR_SETS.forEach((s) => {
      s.featuredCards.forEach((c) => map.set(c.id, c));
    });
    return Array.from(map.values()).map((card) => ({
      card,
      rarityData: getCardRarityData(card),
    }));
  }, []);

  // Filtered cards list
  const filteredCards = useMemo(() => {
    let result = allCards;

    if (selectedRarity !== 'ALL') {
      result = result.filter((item) => item.rarityData.rarityTier === selectedRarity);
    }

    if (selectedSetFilter !== 'ALL') {
      result = result.filter((item) =>
        item.card.setName.toLowerCase().includes(selectedSetFilter.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.card.name.toLowerCase().includes(q) ||
          item.card.setNumber.toLowerCase().includes(q) ||
          item.card.setName.toLowerCase().includes(q)
      );
    }

    // Sort by highest scarcity score descending
    return result.sort((a, b) => b.rarityData.scarcityScore - a.rarityData.scarcityScore);
  }, [allCards, selectedRarity, selectedSetFilter, searchQuery]);

  // Set Directories list
  const setsList = useMemo(() => Object.values(SETS_RARITY_DIRECTORY), []);

  const getRarityBadgeStyle = (tier: CardRarityData['rarityTier']) => {
    switch (tier) {
      case 'Holy Grail':
        return 'bg-amber-500 text-white border-amber-600 shadow-sm';
      case 'Ultra Chase':
        return 'bg-red-600 text-white border-red-700 shadow-sm';
      case 'Secret Rare':
        return 'bg-purple-600 text-white border-purple-700';
      case 'Illustration Rare':
        return 'bg-blue-600 text-white border-blue-700';
      default:
        return 'bg-slate-200 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Rarity & Population Intelligence */}
      <div className="bg-gradient-to-r from-amber-600 via-red-600 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-mono font-bold tracking-wide mb-3">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            POKÉMON TCG SCARCITY, PULL RATES &amp; PSA POPULATION REPORT
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Hur sällsynt är kortet? Upplagor, Chanser &amp; PSA 10 Census
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1.5 leading-relaxed">
            Här ser du hur många kort som tillverkats i varje set, hur många boosterpaket som i genomsnitt krävs för att dra kortet (t.ex. <span className="font-bold text-white">1 på 1 664 paket</span> för Moonbreon), samt exakt hur många exemplar som graderats i <span className="font-bold text-white">PSA 10 Gem Mint</span> i hela världen.
          </p>
        </div>

        {/* Filter & Search Bar in Banner */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-10">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök kortnamn (Charizard, Umbreon, Magikarp) eller setnummer (215/203)..."
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

          {/* Rarity Level Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
            {(['ALL', 'Holy Grail', 'Ultra Chase', 'Secret Rare', 'Illustration Rare'] as RarityFilter[]).map(
              (tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedRarity(tier)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                    selectedRarity === tier
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {tier === 'ALL' ? 'Alla Sällsynthetsnivåer' : tier}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Set-Level Print Statistics Carousel / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
          <span className="flex items-center gap-1.5">
            <Package className="w-4 h-4 text-red-600" />
            Setöversikt &bull; Antal Tillverkade Kort &amp; Secret Rares
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {setsList.length} Expansions analyserade
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {setsList.map((set) => (
            <div
              key={set.setId}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                selectedSetFilter === set.setName
                  ? 'bg-red-50 border-red-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              onClick={() =>
                setSelectedSetFilter(selectedSetFilter === set.setName ? 'ALL' : set.setName)
              }
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 truncate">{set.setName}</h4>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                  {set.setId.toUpperCase()}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Totalt i set:</span>
                  <span className="font-bold text-slate-900">{set.totalCardsPrinted} kort</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-purple-700 block">Secret Rares:</span>
                  <span className="font-bold text-purple-900">+{set.secretRaresCount} st</span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-600 font-mono flex items-center justify-between">
                <span>Grail-chans: 1 på {set.averagePacksPerGrail}</span>
                <span className="text-[10px] font-sans font-semibold text-emerald-700">
                  {set.printVolumeTier.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Cards Scarcity & Population Census Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Kortens Sällsynthet &amp; PSA Population Report
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visar {filteredCards.length} kort sorterade efter absolut sällsynthet (Scarcity Index 1-100)
            </p>
          </div>

          {selectedSetFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedSetFilter('ALL')}
              className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Set: {selectedSetFilter}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Cards Table */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredCards.map(({ card, rarityData }) => {
            const isTargeted = currentlyTargetedCard?.id === card.id;

            return (
              <div
                key={card.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
              >
                {/* Left: Card Thumbnail + Name & Print Classification */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <div className="relative w-16 h-22 shrink-0 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain p-0.5"
                      loading="lazy"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getRarityBadgeStyle(
                          rarityData.rarityTier
                        )}`}
                      >
                        {rarityData.rarityTier.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        #{card.setNumber}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">{card.name}</h4>

                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{card.setName}</span>
                      <span>&bull;</span>
                      <span>{card.releaseYear}</span>
                    </div>

                    <div className="text-[11px] font-mono text-purple-700 mt-1 font-semibold">
                      {rarityData.printClassification}
                    </div>
                  </div>
                </div>

                {/* Middle 1: Scarcity Caliper Score (1 to 100) */}
                <div className="min-w-[140px]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Sällsynthetsindex
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {rarityData.scarcityScore}
                    </span>
                    <span className="text-xs font-mono text-slate-400">/ 100</span>
                  </div>
                  {/* Caliper Bar */}
                  <div className="w-28 h-2 rounded-full bg-slate-200 overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        rarityData.scarcityScore >= 95
                          ? 'bg-amber-500'
                          : rarityData.scarcityScore >= 88
                          ? 'bg-red-600'
                          : 'bg-purple-600'
                      }`}
                      style={{ width: `${rarityData.scarcityScore}%` }}
                    />
                  </div>
                </div>

                {/* Middle 2: Pull Rate Odds (Paket & Boxar) */}
                <div className="min-w-[180px]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Dra-Chans (Pull Rate)
                  </span>
                  <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                    1 på {rarityData.pullRatePacks.toLocaleString()} paket
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {rarityData.pullProbabilityPercent}% chans (~{(rarityData.pullRatePacks / 36).toFixed(1)} boosterboxar)
                  </div>
                </div>

                {/* Middle 3: PSA Census Population Report */}
                <div className="min-w-[200px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span>PSA 10 POP:</span>
                    <strong className="text-emerald-700 font-bold">
                      {rarityData.psa10Count.toLocaleString()} st
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span>PSA 9 POP:</span>
                    <strong className="text-slate-800">
                      {rarityData.psa9Count.toLocaleString()} st
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200">
                    <span>Totalt graderade:</span>
                    <span>{rarityData.psaTotalGraded.toLocaleString()} st ({rarityData.psa10GemRatePercent}% Gem)</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                  <button
                    onClick={() => onOpenPriceCurve(card)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                    title="Se 365-dagars prisgraf och historiska försäljningar"
                  >
                    <LineChart className="w-3.5 h-3.5 text-red-600" />
                    <span>Prisgraf</span>
                  </button>

                  <button
                    onClick={() => onTargetAndSnap(card)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                      isTargeted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>{isTargeted ? 'Target Locked ✓' : 'Målsätt & Fota'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
