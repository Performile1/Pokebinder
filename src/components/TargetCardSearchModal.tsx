import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Target,
  Sparkles,
  Layers,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  LineChart,
} from 'lucide-react';
import { PokemonCard } from '../types';
import { POKEMON_CARD_DATABASE, searchPokemonCards } from '../data/pokemonCards';

interface TargetCardSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTargetCard: (card: PokemonCard) => void;
  currentlyTargetedCard: PokemonCard | null;
  onOpenPriceCurve?: (card: PokemonCard) => void;
  onOpenAppreciationModal?: (card: PokemonCard) => void;
}

const POPULAR_SETS = [
  'ALL',
  'Pokémon 151',
  'Evolving Skies',
  'Base Set',
  'Crown Zenith',
  'Paldea Evolved',
  'Lost Origin',
  'Neo Genesis',
  'Fusion Strike',
];

export const TargetCardSearchModal: React.FC<TargetCardSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTargetCard,
  currentlyTargetedCard,
  onOpenPriceCurve,
  onOpenAppreciationModal,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedSet, setSelectedSet] = useState<string>('ALL');
  const [searchOnline, setSearchOnline] = useState<boolean>(false);
  const [onlineResults, setOnlineResults] = useState<PokemonCard[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(false);

  // Local instant match results
  const localResults = useMemo(() => {
    return searchPokemonCards(query, selectedSet);
  }, [query, selectedSet]);

  // Online search effect when online mode is active or user triggers it
  useEffect(() => {
    if (!searchOnline || !query.trim() || query.trim().length < 2) {
      setOnlineResults([]);
      setIsLoadingOnline(false);
      return;
    }

    let active = true;
    setIsLoadingOnline(true);
    const timer = setTimeout(async () => {
      try {
        const setParam = selectedSet !== 'ALL' ? `&setName=${encodeURIComponent(selectedSet)}` : '';
        const res = await fetch(`/api/cards/search?q=${encodeURIComponent(query.trim())}${setParam}&online=true`);
        if (res.ok && active) {
          const data = await res.json();
          if (Array.isArray(data.cards)) {
            setOnlineResults(data.cards);
          }
        }
      } catch (err) {
        console.warn('Online card search failed:', err);
      } finally {
        if (active) setIsLoadingOnline(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, selectedSet, searchOnline]);

  // Combine and deduplicate results
  const displayedCards = useMemo(() => {
    if (!searchOnline) return localResults;
    if (onlineResults.length === 0) return localResults;

    const map = new Map<string, PokemonCard>();
    localResults.forEach((c) => map.set(`${c.name.toLowerCase()}-${c.setNumber}`, c));
    onlineResults.forEach((c) => {
      const key = `${c.name.toLowerCase()}-${c.setNumber}`;
      if (!map.has(key)) {
        map.set(key, c);
      }
    });
    return Array.from(map.values());
  }, [localResults, onlineResults, searchOnline]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header - Pokémon Red Accent */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between border-b border-red-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-xs">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Search &amp; Target Set Card
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Step 1: Pick Card • Step 2: Snap Photos
                </span>
              </h3>
              <p className="text-xs text-red-100">
                Write card name, printed set number (e.g. 4/102, 215/203) or expansion set to lock the target before photographing your card.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Write card name (Charizard, Umbreon, Pikachu) or number (4/102, 215/203, 199/165)..."
              autoFocus
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition shadow-xs"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Set Filter Chips & Online Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar text-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono mr-1">
                Set:
              </span>
              {POPULAR_SETS.map((set) => (
                <button
                  key={set}
                  onClick={() => setSelectedSet(set)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedSet === set
                      ? 'bg-red-600 text-white shadow-xs font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {set === 'ALL' ? 'All Sets' : set}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSearchOnline(!searchOnline)}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                searchOnline
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Search official global Pokémon TCG database (15,000+ cards)"
            >
              <Globe className="w-3.5 h-3.5" />
              {searchOnline ? 'Online Search Active' : 'Search All 15,000+ Cards'}
            </button>
          </div>
        </div>

        {/* Current Active Target Banner if selected */}
        {currentlyTargetedCard && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Currently Locked: <strong className="font-bold">{currentlyTargetedCard.name}</strong> ({currentlyTargetedCard.setName} #{currentlyTargetedCard.setNumber})
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
              Tradera: ~{currentlyTargetedCard.typicalTraderaSoldSEK} SEK
            </span>
          </div>
        )}

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
          {isLoadingOnline && (
            <div className="py-6 text-center text-xs font-mono text-slate-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              Querying Pokémon TCG API database...
            </div>
          )}

          {displayedCards.length === 0 && !isLoadingOnline && (
            <div className="py-12 text-center text-slate-500">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No cards matched &quot;{query}&quot;</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching for just the Pokémon name (e.g. &quot;Charizard&quot;) or the card number only (e.g. &quot;4&quot; or &quot;215&quot;), or click &quot;Search All 15,000+ Cards&quot;.
              </p>
              {!searchOnline && (
                <button
                  onClick={() => setSearchOnline(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Enable Online API Search
                </button>
              )}
            </div>
          )}

          {displayedCards.map((card) => {
            const isCurrentlyTargeted = currentlyTargetedCard?.id === card.id;

            return (
              <div
                key={card.id}
                className={`pt-3 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl transition ${
                  isCurrentlyTargeted
                    ? 'bg-red-50/60 border border-red-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                {/* Left: Thumbnail & Card Identity */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-20 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-2xs group">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain p-0.5"
                      loading="lazy"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{card.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                        #{card.setNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{card.setName}</span>
                      <span>•</span>
                      <span>{card.releaseYear}</span>
                      <span>•</span>
                      <span className="text-red-600 font-medium">{card.rarity}</span>
                    </div>

                    {/* Price Benchmarks Grid */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                        Tradera: ~{card.typicalTraderaSoldSEK.toLocaleString()} SEK{' '}
                        <span className="text-amber-700 font-normal">
                          (Bid: {card.typicalTraderaLeadingBidSEK} SEK)
                        </span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-semibold">
                        eBay: ${card.typicalEbayUSD}
                      </span>
                      {card.typicalCardmarketEUR && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                          Cardmarket: €{card.typicalCardmarketEUR}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Select & Target Button & Price Curve */}
                <div className="shrink-0 w-full sm:w-auto flex flex-wrap sm:flex-col items-center sm:items-end justify-between gap-2">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {onOpenPriceCurve && (
                      <button
                        onClick={() => {
                          onOpenPriceCurve(card);
                          onClose();
                        }}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                        title="Visa 365-dagars prishistorik och senaste försäljningar"
                      >
                        <LineChart className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Kurva</span>
                      </button>
                    )}
                    {onOpenAppreciationModal && (
                      <button
                        onClick={() => {
                          onOpenAppreciationModal(card);
                          onClose();
                        }}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer border border-emerald-200"
                        title="Beräkna förväntad värdeökning 1-3 år baserat på historisk kohortdata"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Prognos</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectTargetCard(card);
                        onClose();
                      }}
                      className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                        isCurrentlyTargeted
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md'
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      <span>{isCurrentlyTargeted ? 'Target Locked ✓' : 'Target & Snap'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Locks card metadata for viewfinder
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-700">
              {displayedCards.length} cards available
            </span>
            <span>•</span>
            <span>Type any number like 4/102 or 215 to jump straight to card</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
