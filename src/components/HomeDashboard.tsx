import React, { useState } from 'react';
import {
  Camera,
  TrendingUp,
  LineChart,
  Award,
  FileSpreadsheet,
  Globe,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Flame,
  Layers,
  Clock,
  Compass,
  CheckCircle2,
  DollarSign,
  Package,
  ShoppingBag,
  BookmarkCheck,
} from 'lucide-react';
import { PokemonCard } from '../types';
import { POKEMON_CARD_DATABASE } from '../data/pokemonCards';
import { predictCardAppreciation } from '../utils/predictiveAppreciation';

interface HomeDashboardProps {
  onNavigate: (view: 'scanner' | 'listings' | 'pokecollector' | 'rarity' | 'appreciation' | 'collection' | 'marketplace') => void;
  onSelectTargetCard: (card: PokemonCard) => void;
  onOpenPriceCurve: (card: PokemonCard) => void;
  onOpenAppreciationModal: (card: PokemonCard) => void;
  onOpenSearchModal: () => void;
  onOpenScraperModal: () => void;
  usdToSek: number;
  eurToSek: number;
  totalScans: number;
  highArbHits: number;
  collectionAlertCount?: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  onSelectTargetCard,
  onOpenPriceCurve,
  onOpenAppreciationModal,
  onOpenSearchModal,
  onOpenScraperModal,
  usdToSek,
  eurToSek,
  totalScans,
  highArbHits,
  collectionAlertCount = 0,
}) => {
  const [quickSearch, setQuickSearch] = useState<string>('');

  // Spotlight cards
  const spotlightCards = [
    POKEMON_CARD_DATABASE[1], // Umbreon VMAX 215/203
    POKEMON_CARD_DATABASE[4], // Charizard ex 199/165
    POKEMON_CARD_DATABASE[7], // Magikarp 203/193
  ];

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenSearchModal();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Cockpit Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-6 sm:p-10 shadow-2xl overflow-hidden border border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono font-semibold text-red-200 mb-4 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>POKÉMON TCG INTELLIGENCE &bull; ARBITRAGE &bull; PROGNOS</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            Identifiera, värdera och förutspå värdeökning på <span className="text-red-500">Pokémonkort</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Professionell plattform för samlare och investerare. Skanna dina fysiska kort, analysera historiska kohorter för framtida prisutveckling, jämför Tradera mot eBay och kontrollera PSA 10-populationer.
          </p>

          {/* Quick Search Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div
              onClick={onOpenSearchModal}
              className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-white/70 hover:text-white transition cursor-pointer shadow-lg group"
            >
              <Search className="w-5 h-5 text-red-400 group-hover:scale-110 transition" />
              <span className="text-xs sm:text-sm font-medium">
                Sök bland 15 000+ kort (namn, t.ex. Charizard, eller nummer som 215/203)...
              </span>
            </div>

            <button
              onClick={() => onNavigate('scanner')}
              className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Starta Kamerasök</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Popular fast-chip targets */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-mono mr-1">Snabbval:</span>
            {spotlightCards.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenAppreciationModal(c)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{c.name.split(' (')[0]}</span>
                <span className="text-red-300 text-[10px]">#{c.setNumber}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Market Pulse Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">ECB Valutakurs</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              1 USD = {usdToSek} SEK
            </div>
            <span className="text-[11px] text-slate-500 font-mono">1 EUR = {eurToSek} SEK</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Kort I Kö / Skannade</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {totalScans} kort
            </div>
            <span className="text-[11px] text-emerald-600 font-mono font-semibold">
              {highArbHits} Arbitrage-träffar
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <Flame className="w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Out-of-Print Våg</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              Pokémon 151
            </div>
            <span className="text-[11px] text-purple-600 font-mono font-semibold">+65% est. inflektion</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Högsta Sällsynthet</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              Lugia 1st Ed.
            </div>
            <span className="text-[11px] text-amber-700 font-mono font-semibold">Endast 44 st PSA 10</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main 6 Feature Gateways Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Verktyg &amp; Databaser
            </h2>
            <p className="text-xs text-slate-500">
              Välj en modul nedan för att komma igång med analys, sökning eller kamerasök
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gateway A: Personal Collection & Sell Alerts */}
          <div
            onClick={() => onNavigate('collection')}
            className={`group p-5 rounded-3xl bg-white border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              collectionAlertCount > 0
                ? 'border-red-400 ring-2 ring-red-500/20 hover:shadow-2xl'
                : 'border-slate-200 hover:border-red-300 hover:shadow-xl'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition">
                  <BookmarkCheck className="w-6 h-6" />
                </div>
                {collectionAlertCount > 0 ? (
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                    🚨 {collectionAlertCount} SÄLJKLARA!
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    SÄLJVARNINGAR
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition">
                Min Samling &amp; Säljvarningar
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Registrera inköpspris och pack-batchkoder (t.ex. F23-09A). Få automatiska larm när korten når din önskade vinstmarginal i procent!
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Hantera samling &amp; larm &rarr;</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Gateway B: In-App Buy Marketplace */}
          <div
            onClick={() => onNavigate('marketplace')}
            className="group p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  SWISH &bull; KLARNA
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                Köp Kort i Appen
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Köp verifierade Pokémon-kort direkt med 100% äkthetsgaranti. Köpta kort läggs automatiskt in i din personliga samling med inköpspris.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Handla kort &rarr;</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 1: Camera Scanner */}
          <div
            onClick={() => onNavigate('scanner')}
            className="group p-5 rounded-3xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 group-hover:scale-110 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  AUTO-SNAP HUD
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition">
                Kamerasök &amp; Auto-Snap
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Fotografera fram- och baksida av dina fysiska kort. Centreringsmätning (50/50 caliper), skärpedetektering och direkt beräkning av Tradera vs. eBay nettomarginal.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-600">
              <span>Starta kamerasökare</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Predictive Value Appreciation (NEW) */}
          <div
            onClick={() => onNavigate('appreciation')}
            className="group p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AI-VÄRDEÖKNING
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                Värdeprognos &amp; Kohortanalys
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Analysera vad ditt kort borde vara värt om 1 till 3 år baserat på historisk data från tidigare flaggskeppskort, out-of-print-cykler och PSA 10-premie.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Se värdeprognoser &rarr;</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Pokélector Sets & Price History */}
          <div
            onClick={() => onNavigate('pokecollector')}
            className="group p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
                  <LineChart className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  ALLA SETS
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                Pokélector Sets &amp; Prisgrafer
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Bläddra igenom alla expansioner från Prismatic Evolutions till 1999 Base Set. Interaktiva 365-dagars prisgrafer och avslutade köp på Tradera, eBay och Cardmarket.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Utforska alla sets &rarr;</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 4: Rarity & PSA Population Census */}
          <div
            onClick={() => onNavigate('rarity')}
            className="group p-5 rounded-3xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  HUR RARE?
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition">
                Sällsynthet &amp; PSA Census
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Se exakt hur sällsynt kortet är: totalt antal tillverkade kort i setet, dragchans (t.ex. 1 på 1 664 paket) och hur många PSA 10 Gem Mint som existerar i världen.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Öppna populationsrapport &rarr;</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 5: Cross-Border Scraper Hub */}
          <div
            onClick={onOpenScraperModal}
            className="group p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  0% EU TULL
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
                Cross-Border Scraper Hub
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Koppla live mot Cardmarket EU för 0% tull (fri rörlighet) eller beräkna 25% importmoms, PostNord 75 kr avgift och Buyee-avgifter för import från Japan och USA.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
              <span>Öppna tullkalkylator &rarr;</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 6: Comprehensive Market Listings */}
          <div
            onClick={() => onNavigate('listings')}
            className="group p-5 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-110 transition">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  ARBITRAGE TABELL
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition">
                Marknadspriser &amp; Auktioner
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Fullständig lista över aktiva Tradera-auktioner (budgivning &amp; sniping) samt avslutade slutpriser, med automatiskt anti-fake filter för kopior och proxykort.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Visa marknadspriser &rarr;</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* Spotlight Cards Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Veckans Spotlight-Kort med Högst Värdeökningspotential
            </h3>
            <p className="text-xs text-slate-500">
              Baserat på historisk kohortregression och kommande utbudsbrist (OOP)
            </p>
          </div>

          <button
            onClick={() => onNavigate('appreciation')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Se alla prognoser</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {spotlightCards.map((card) => {
            const forecast = predictCardAppreciation(card, usdToSek);

            return (
              <div
                key={card.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-xs">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                        #{card.setNumber}
                      </span>
                      <span className="text-[10px] text-red-600 font-bold truncate">
                        {card.setName}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                      {card.name}
                    </h4>

                    <div className="mt-2 space-y-0.5 text-xs font-mono">
                      <div className="text-slate-600 text-[11px]">
                        Idag: <strong>{forecast.currentPriceSek.toLocaleString()} SEK</strong>
                      </div>
                      <div className="text-emerald-700 font-bold flex items-center gap-1">
                        <span>3 År: ~{forecast.forecast36m.baseSek.toLocaleString()} SEK</span>
                        <span className="text-[11px] text-emerald-600">
                          (+{forecast.forecast36m.expectedGrowthPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => onOpenAppreciationModal(card)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>AI-Prognos</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectTargetCard(card);
                      onNavigate('scanner');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <Target className="w-3 h-3" />
                    <span>Målsätt &amp; Fota</span>
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
