import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  Flame,
  Globe,
  Coins,
  Download,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ComprehensiveListing, MarketplaceCode, ListingStatus } from '../types';
import { COMPREHENSIVE_MARKET_LISTINGS, MARKETPLACE_CONFIGS } from '../data/comprehensiveListings';

interface Props {
  usdToSek: number;
  eurToSek: number;
  jpyToSek: number;
  onSendDiscordAlert?: (listing: ComprehensiveListing) => void;
  onOpenCardDetails?: (cardId: string) => void;
}

export function ComprehensiveListingsView({
  usdToSek,
  eurToSek,
  jpyToSek,
  onSendDiscordAlert,
  onOpenCardDetails,
}: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'sold' | 'active' | 'arbitrage'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<MarketplaceCode[]>([
    'cardmarket',
    'tradera',
    'ebay',
    'tcgplayer',
    'mercari_jp',
    'blocket',
  ]);
  const [conditionFilter, setConditionFilter] = useState<'all' | 'raw' | 'graded'>('all');
  const [currencyMode, setCurrencyMode] = useState<'sek' | 'native'>('sek');
  const [sortBy, setSortBy] = useState<'profit_desc' | 'roi_desc' | 'price_asc' | 'price_desc' | 'newest'>('profit_desc');
  const [selectedListing, setSelectedListing] = useState<ComprehensiveListing | null>(null);

  // Toggle market filter
  const toggleMarketplace = (code: MarketplaceCode) => {
    if (selectedMarketplaces.includes(code)) {
      if (selectedMarketplaces.length === 1) return; // Keep at least one
      setSelectedMarketplaces(selectedMarketplaces.filter((m) => m !== code));
    } else {
      setSelectedMarketplaces([...selectedMarketplaces, code]);
    }
  };

  // Select all or clear
  const handleSelectAllMarkets = () => {
    setSelectedMarketplaces(['cardmarket', 'tradera', 'ebay', 'tcgplayer', 'mercari_jp', 'blocket']);
  };

  // Recalculate listing prices based on active live FX rates
  const enrichedListings = useMemo(() => {
    return COMPREHENSIVE_MARKET_LISTINGS.map((item) => {
      let currentPriceSEK = item.priceInSEK;
      if (item.nativeCurrency === 'EUR') {
        currentPriceSEK = Math.round(item.nativePrice * eurToSek);
      } else if (item.nativeCurrency === 'USD') {
        currentPriceSEK = Math.round(item.nativePrice * usdToSek);
      } else if (item.nativeCurrency === 'JPY') {
        currentPriceSEK = Math.round(item.nativePrice * jpyToSek);
      }

      return {
        ...item,
        priceInSEK: currentPriceSEK,
      };
    });
  }, [eurToSek, usdToSek, jpyToSek]);

  // Filter listings
  const filteredListings = useMemo(() => {
    return enrichedListings.filter((item) => {
      // Tab filter
      if (activeTab === 'sold' && !item.isSold) return false;
      if (activeTab === 'active' && item.isSold) return false;
      if (activeTab === 'arbitrage' && (!item.isArbitrageOpportunity || item.estimatedRoi < 25)) return false;

      // Marketplace filter
      if (!selectedMarketplaces.includes(item.marketplaceCode)) return false;

      // Condition filter
      if (conditionFilter === 'raw' && item.isGraded) return false;
      if (conditionFilter === 'graded' && !item.isGraded) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.cardName.toLowerCase().includes(q) ||
          item.setNumber.toLowerCase().includes(q) ||
          item.setName.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.marketplace.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [enrichedListings, activeTab, selectedMarketplaces, conditionFilter, searchQuery]);

  // Sort listings
  const sortedListings = useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      if (sortBy === 'profit_desc') {
        return b.estimatedNetProfitSEK - a.estimatedNetProfitSEK;
      }
      if (sortBy === 'roi_desc') {
        return b.estimatedRoi - a.estimatedRoi;
      }
      if (sortBy === 'price_asc') {
        return a.priceInSEK - b.priceInSEK;
      }
      if (sortBy === 'price_desc') {
        return b.priceInSEK - a.priceInSEK;
      }
      return 0;
    });
  }, [filteredListings, sortBy]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Card Name',
      'Set Number',
      'Set Name',
      'Marketplace',
      'Status',
      'Condition',
      'Native Price',
      'Currency',
      'Price (SEK)',
      'Estimated Profit (SEK)',
      'ROI (%)',
      'Customs Note',
    ];
    const rows = sortedListings.map((l) => [
      `"${l.cardName}"`,
      `"${l.setNumber}"`,
      `"${l.setName}"`,
      `"${l.marketplace}"`,
      `"${l.status}"`,
      `"${l.condition}"`,
      l.nativePrice,
      l.nativeCurrency,
      l.priceInSEK,
      l.estimatedNetProfitSEK,
      `${l.estimatedRoi}%`,
      `"${l.customsNote}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pokearb_comprehensive_listings_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Utförlig Lista: Sålda &amp; Listade Kort
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold">
                {sortedListings.length} träffar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cross-border marknadsdata från Cardmarket (EU), TCGPlayer (USA), Tradera (SE), eBay (Global), Mercari Japan (JP) &amp; Blocket
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Currency Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setCurrencyMode('sek')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  currencyMode === 'sek' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Visa i SEK (kr)
              </button>
              <button
                onClick={() => setCurrencyMode('native')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  currencyMode === 'native' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Originalvaluta (€, $, ¥)
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Exportera CSV
            </button>
          </div>
        </div>

        {/* Live FX Rates Ribbon */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-red-600" />
            Live ECB Kurser:
          </span>
          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            1 EUR = <strong className="text-slate-900">{eurToSek} SEK</strong> (Cardmarket)
          </span>
          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            1 USD = <strong className="text-slate-900">{usdToSek} SEK</strong> (TCGPlayer / eBay)
          </span>
          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            100 JPY = <strong className="text-slate-900">{(jpyToSek * 100).toFixed(2)} SEK</strong> (Mercari Japan)
          </span>
          <span className="text-emerald-600 font-sans font-semibold flex items-center gap-1 ml-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            EU Fri Rörlighet: 0% Tull
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Main Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alla Listningar
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'sold' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sålda Kort (Slutpriser)
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'active' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktiva Listningar &amp; Bud
            </button>
            <button
              onClick={() => setActiveTab('arbitrage')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === 'arbitrage' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <Flame className="w-3 h-3 fill-current" />
              Arbitrage-Fynd (&gt;25% ROI)
            </button>
          </div>

          {/* Condition Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setConditionFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                conditionFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Alla Skick
            </button>
            <button
              onClick={() => setConditionFilter('raw')}
              className={`px-2.5 py-1 rounded-lg transition ${
                conditionFilter === 'raw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Endast Råkort (Raw)
            </button>
            <button
              onClick={() => setConditionFilter('graded')}
              className={`px-2.5 py-1 rounded-lg transition ${
                conditionFilter === 'graded' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Graderade (PSA/BGS/CGC)
            </button>
          </div>
        </div>

        {/* Marketplace Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Marknadsplatser:
          </span>
          {(Object.keys(MARKETPLACE_CONFIGS) as MarketplaceCode[]).map((code) => {
            const conf = MARKETPLACE_CONFIGS[code];
            const isSelected = selectedMarketplaces.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleMarketplace(code)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                  isSelected
                    ? 'bg-red-50 border-red-300 text-red-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{conf.flag}</span>
                <span>{conf.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({conf.currency})</span>
              </button>
            );
          })}
          <button
            onClick={handleSelectAllMarkets}
            className="text-[11px] font-mono text-red-600 hover:underline ml-auto"
          >
            Välj alla
          </button>
        </div>

        {/* Search input and Sort selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök på kortnamn, set, kortnummer (t.ex. Charizard 4/102, Moonbreon 215, Blastoise)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Sortera:
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              <option value="profit_desc">Högst Vinst (SEK)</option>
              <option value="roi_desc">Högst ROI (%)</option>
              <option value="price_asc">Lägsta Pris</option>
              <option value="price_desc">Högsta Pris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Listings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-mono">
                <th className="py-3 px-4">Kort &amp; Expansion</th>
                <th className="py-3 px-3">Marknad &amp; Typ</th>
                <th className="py-3 px-3">Skick / Gradering</th>
                <th className="py-3 px-3">Pris &amp; Valuta</th>
                <th className="py-3 px-3">Tull / Logistik</th>
                <th className="py-3 px-3 text-right">Arbitrage Potential</th>
                <th className="py-3 px-4 text-center">Åtgärd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sortedListings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    Inga listningar matchade dina sökfilter. Pröva att välja fler marknadsplatser eller rensa sökord.
                  </td>
                </tr>
              ) : (
                sortedListings.map((listing) => {
                  const isTopArbitrage = listing.estimatedRoi >= 35;
                  return (
                    <tr
                      key={listing.id}
                      onClick={() => setSelectedListing(listing)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Card Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={listing.imageUrl}
                            alt={listing.cardName}
                            className="w-10 h-14 object-contain rounded bg-slate-100 border border-slate-200 shadow-2xs flex-shrink-0"
                            loading="lazy"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {listing.cardName}
                              <span className="font-mono text-slate-400 font-normal">
                                #{listing.setNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {listing.setName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={listing.title}>
                              {listing.title}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Marketplace & Status */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <span>{listing.countryFlag}</span>
                            <span>{listing.marketplace}</span>
                          </div>
                          <div>
                            {listing.status === 'sold' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Slutpris (Såld)
                              </span>
                            )}
                            {listing.status === 'active_auction' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Aktiv Auktion
                              </span>
                            )}
                            {listing.status === 'buy_it_now' && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                Köp Nu (Fast pris)
                              </span>
                            )}
                            {listing.status === 'classified_lot' && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                                Pärm / Samling
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {listing.dateOrTimeLeft}
                          </div>
                        </div>
                      </td>

                      {/* Condition / Slab */}
                      <td className="py-3.5 px-3">
                        <div>
                          {listing.isGraded ? (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              {listing.condition}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold text-[11px]">
                              {listing.condition}
                            </span>
                          )}
                          {listing.iqrClean && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                              <ShieldCheck className="w-3 h-3" />
                              IQR-Clean
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900 font-mono text-sm">
                            {listing.priceInSEK.toLocaleString()} SEK
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {listing.nativeCurrency === 'EUR' && `€${listing.nativePrice.toFixed(2)} EUR`}
                            {listing.nativeCurrency === 'USD' && `$${listing.nativePrice.toFixed(2)} USD`}
                            {listing.nativeCurrency === 'JPY' && `¥${listing.nativePrice.toLocaleString()} JPY`}
                            {listing.nativeCurrency === 'SEK' && `${listing.nativePrice.toLocaleString()} kr`}
                          </div>
                        </div>
                      </td>

                      {/* Customs & Shipping */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-600 leading-tight">
                            {listing.customsNote}
                          </p>
                          {listing.importMomsSEK && (
                            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              +25% moms ({listing.importMomsSEK} kr)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Net Arbitrage Potential */}
                      <td className="py-3.5 px-3 text-right">
                        <div>
                          <div
                            className={`font-bold font-mono text-sm ${
                              listing.estimatedNetProfitSEK > 0 ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            {listing.estimatedNetProfitSEK > 0 ? `+${listing.estimatedNetProfitSEK.toLocaleString()} SEK` : '-'}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {isTopArbitrage ? (
                              <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono font-bold text-[10px] flex items-center gap-0.5 shadow-2xs">
                                <Flame className="w-2.5 h-2.5 fill-current" />
                                +{listing.estimatedRoi}%
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono text-[11px]">
                                +{listing.estimatedRoi}% ROI
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={listing.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                            title="Öppna annons på marknadsplatsen"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {onSendDiscordAlert && (
                            <button
                              onClick={() => onSendDiscordAlert(listing)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                              title="Skicka Discord-larm"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Listing Inspection Modal / Drawer */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedListing.countryFlag}</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {selectedListing.cardName} &bull; {selectedListing.marketplace}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedListing.setName} #{selectedListing.setNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm transition"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Card visual + Main numbers */}
              <div className="flex items-start gap-4">
                <img
                  src={selectedListing.imageUrl}
                  alt={selectedListing.cardName}
                  className="w-24 h-34 object-contain rounded-xl bg-slate-100 border border-slate-200 shadow-md flex-shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                      {selectedListing.condition}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      {selectedListing.status === 'sold' ? 'Slutpris' : 'Aktiv'}
                    </span>
                    {selectedListing.isGraded && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {selectedListing.gradingCompany} Snabba Kunder
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    <div className="text-xs text-slate-500 font-mono">Listat / Slutpris:</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono">
                      {selectedListing.priceInSEK.toLocaleString()} SEK
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      (Original: {selectedListing.nativePrice} {selectedListing.nativeCurrency})
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Notes */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Annonsrubrik</div>
                <div className="text-xs font-semibold text-slate-800">{selectedListing.title}</div>
                {selectedListing.sellerRating && (
                  <div className="text-[11px] text-slate-500 font-mono pt-1">
                    Säljare: {selectedListing.sellerRating}
                  </div>
                )}
              </div>

              {/* Cross-Border Customs & Fee Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-red-600" />
                  Tull, Moms &amp; Handelsvillkor
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Handelszon:</span>
                    <span className="font-semibold text-slate-900">{selectedListing.customsNote}</span>
                  </div>
                  {selectedListing.marketplaceCode === 'cardmarket' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        <strong>Europeisk Fri Rörlighet:</strong> 0% tull och ingen importmoms mellan Sverige och Cardmarket-säljare inom EU.
                      </span>
                    </div>
                  )}
                  {selectedListing.importMomsSEK && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Svensk Importmoms (25%):</span>
                      <span className="font-mono text-red-600">+{selectedListing.importMomsSEK} SEK</span>
                    </div>
                  )}
                  {selectedListing.postNordFeeSEK && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>PostNord Deklarationsavgift:</span>
                      <span className="font-mono text-red-600">+{selectedListing.postNordFeeSEK} SEK</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900">
                    <span>Beräknad Netto Arbitrage-vinst:</span>
                    <span className="font-mono text-emerald-600 text-sm">
                      +{selectedListing.estimatedNetProfitSEK.toLocaleString()} SEK (+{selectedListing.estimatedRoi}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Best exit recommendation */}
              {selectedListing.bestExitMarketplace && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    Arbitrage-Strategi:
                  </div>
                  <p>{selectedListing.bestExitMarketplace}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <a
                href={selectedListing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Gå till {selectedListing.marketplace}
              </a>

              {onSendDiscordAlert && (
                <button
                  onClick={() => {
                    onSendDiscordAlert(selectedListing);
                    setSelectedListing(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Skicka Discord-Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
