import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Target,
  LineChart,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
  X,
  Compass,
} from 'lucide-react';
import { PokemonCard, CardAppreciationForecast } from '../types';
import { POKEMON_CARD_DATABASE } from '../data/pokemonCards';
import { POKECOLLECTOR_SETS } from '../data/pokecollectorCatalog';
import {
  predictCardAppreciation,
  HISTORICAL_COHORTS,
} from '../utils/predictiveAppreciation';
import { AppreciationAnalysisModal } from './AppreciationAnalysisModal';

interface AppreciationExplorerViewProps {
  onTargetAndSnap: (card: PokemonCard) => void;
  onOpenPriceCurve: (card: PokemonCard) => void;
  currentlyTargetedCard: PokemonCard | null;
  usdToSek: number;
}

export const AppreciationExplorerView: React.FC<AppreciationExplorerViewProps> = ({
  onTargetAndSnap,
  onOpenPriceCurve,
  currentlyTargetedCard,
  usdToSek,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCohort, setSelectedCohort] = useState<string>('ALL');
  const [activeModalCard, setActiveModalCard] = useState<PokemonCard | null>(null);

  // Gather unique cards
  const allCards = useMemo(() => {
    const map = new Map<string, PokemonCard>();
    POKEMON_CARD_DATABASE.forEach((c) => map.set(c.id, c));
    POKECOLLECTOR_SETS.forEach((s) => {
      s.featuredCards.forEach((c) => map.set(c.id, c));
    });
    return Array.from(map.values()).map((card) => ({
      card,
      forecast: predictCardAppreciation(card, usdToSek),
    }));
  }, [usdToSek]);

  // Filtered cards list
  const filteredList = useMemo(() => {
    let result = allCards;

    if (selectedCohort !== 'ALL') {
      result = result.filter(
        (item) => item.forecast.cohortComparison.cohortId === selectedCohort
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

    // Sort by 36-month expected growth descending
    return result.sort(
      (a, b) => b.forecast.forecast36m.expectedGrowthPct - a.forecast.forecast36m.expectedGrowthPct
    );
  }, [allCards, selectedCohort, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Predictive Value Engine */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-mono font-bold tracking-wide mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            HISTORISK KOHORTMODELL &bull; PREDIKTIV VÄRDEÖKNINGSANALYS
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Vad borde kortet vara värt om 1 till 3 år?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1.5 leading-relaxed">
            Med hjälp av empirisk data från tidigare set (*Evolving Skies*, *Hidden Fates*, *Team Up* och *Base Set*) beräknar modellen framtida prisökning baserat på när trycket upphör (Out-of-Print), PSA 10-sällsynthet och samlarkohort.
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
              placeholder="Sök kort att analysera (Charizard, Umbreon, Magikarp, Lugia)..."
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

          {/* Cohort Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
            <button
              onClick={() => setSelectedCohort('ALL')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                selectedCohort === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Alla Kohorter
            </button>
            {Object.values(HISTORICAL_COHORTS).map((coh) => (
              <button
                key={coh.cohortId}
                onClick={() => setSelectedCohort(coh.cohortId)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  selectedCohort === coh.cohortId
                    ? 'bg-white text-slate-900 font-bold shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {coh.cohortName.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cohort Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.values(HISTORICAL_COHORTS)
          .slice(0, 3)
          .map((c) => (
            <div
              key={c.cohortId}
              onClick={() => setSelectedCohort(c.cohortId)}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedCohort === c.cohortId
                  ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 truncate">{c.cohortName.split(' (')[0]}</span>
                <span className="text-emerald-700 font-mono font-bold">+{c.historical36mGrowthPct}% (3 år)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {c.correlationRationale}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Ref: {c.referenceCardName.split(' (')[0]}</span>
                <span className="text-slate-600 font-bold">{c.initialPriceSek} kr &rarr; {c.priceAfter36mSek} kr</span>
              </div>
            </div>
          ))}
      </div>

      {/* Main Analysis Cards & Forecast Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Prognostiserad Värdeökning (1 till 3 år)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visar {filteredList.length} kort rankade efter beräknad 3-årig tillväxtpotential
            </p>
          </div>

          <div className="text-xs font-mono text-slate-600 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Baserad på historisk utbudsbrist &amp; PSA Gem-rate</span>
          </div>
        </div>

        {/* Cards Rows */}
        <div className="divide-y divide-slate-100">
          {filteredList.map(({ card, forecast }) => {
            const isTargeted = currentlyTargetedCard?.id === card.id;

            return (
              <div
                key={card.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
              >
                {/* Left: Thumbnail & Name */}
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
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        #{card.setNumber}
                      </span>
                      <span className="text-xs text-red-600 font-bold font-mono">
                        {card.rarity}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">{card.name}</h4>

                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{card.setName}</span>
                      <span>&bull;</span>
                      <span>{card.releaseYear}</span>
                    </div>

                    <div className="text-[11px] font-mono text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                      <span>Jämförs med: {forecast.cohortComparison.referenceCardName.split(' (')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Dagspris */}
                <div className="min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Dagspris</span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {forecast.currentPriceSek.toLocaleString()} SEK
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">(~${forecast.currentPriceUsd})</span>
                </div>

                {/* 12-Månaders Prognos */}
                <div className="min-w-[150px] bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] font-mono uppercase text-emerald-800 block font-semibold">
                    1 År (+12 mån)
                  </span>
                  <div className="text-sm font-bold font-mono text-emerald-800 mt-0.5 flex items-center gap-1">
                    <span>{forecast.forecast12m.baseSek.toLocaleString()} SEK</span>
                    <span className="text-xs font-bold text-emerald-600">
                      (+{forecast.forecast12m.expectedGrowthPct}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Intervall: {forecast.forecast12m.bearSek} - {forecast.forecast12m.bullSek} kr
                  </span>
                </div>

                {/* 36-Månaders Prognos (OOP) */}
                <div className="min-w-[160px] bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-200/80">
                  <span className="text-[10px] font-mono uppercase text-indigo-800 block font-semibold">
                    3 År (+36 mån OOP)
                  </span>
                  <div className="text-sm font-bold font-mono text-indigo-800 mt-0.5 flex items-center gap-1">
                    <span>{forecast.forecast36m.baseSek.toLocaleString()} SEK</span>
                    <span className="text-xs font-bold text-indigo-600">
                      (+{forecast.forecast36m.expectedGrowthPct}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-mono block font-semibold">
                    PSA 10 beräknas: ~{forecast.psa10Projected36mSek.toLocaleString()} kr
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                  <button
                    onClick={() => setActiveModalCard(card)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Öppna djupgående prognosgraf och kohortanalys"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Se AI-Analys</span>
                  </button>

                  <button
                    onClick={() => onTargetAndSnap(card)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                      isTargeted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>{isTargeted ? 'Låst' : 'Fota'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standalone Deep Analysis Modal */}
      {activeModalCard && (
        <AppreciationAnalysisModal
          card={activeModalCard}
          onClose={() => setActiveModalCard(null)}
          onTargetCard={(c) => {
            onTargetAndSnap(c);
            setActiveModalCard(null);
          }}
          onOpenPriceCurve={(c) => {
            onOpenPriceCurve(c);
            setActiveModalCard(null);
          }}
          usdToSek={usdToSek}
        />
      )}
    </div>
  );
};
