import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Plus,
  Trash2,
  Share2,
  TrendingUp,
  LineChart,
  Package,
  ShoppingBag,
  Barcode,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Target,
  Edit2,
  ArrowUpRight,
} from 'lucide-react';
import { CollectionCardItem, CollectorProfile, PokemonCard } from '../types';
import { POKEMON_CARD_DATABASE } from '../data/pokemonCards';
import { AddCardToCollectionModal } from './AddCardToCollectionModal';
import { ListingCreatorModal } from './ListingCreatorModal';

interface CollectionVaultViewProps {
  collection: CollectionCardItem[];
  currentUser: CollectorProfile | null;
  onAddCard: (card: CollectionCardItem) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenPriceCurve: (card: PokemonCard) => void;
  onOpenAppreciationModal: (card: PokemonCard) => void;
  onOpenAuthModal: () => void;
}

export const CollectionVaultView: React.FC<CollectionVaultViewProps> = ({
  collection,
  currentUser,
  onAddCard,
  onDeleteCard,
  onOpenPriceCurve,
  onOpenAppreciationModal,
  onOpenAuthModal,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [listingModalCard, setListingModalCard] = useState<CollectionCardItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alerts_only' | 'pack_pulls' | 'purchases'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Portfolio aggregates
  const totalInvestedSek = collection.reduce((sum, c) => sum + c.purchasePriceSek, 0);
  const totalMarketValueSek = collection.reduce((sum, c) => sum + c.currentMarketPriceSek, 0);
  const netProfitSek = totalMarketValueSek - totalInvestedSek;
  const netRoiPct = totalInvestedSek > 0 ? Number(((netProfitSek / totalInvestedSek) * 100).toFixed(1)) : 0;
  const triggeredAlerts = collection.filter((c) => c.alertTriggered);

  // Filter items
  const filteredItems = collection.filter((item) => {
    if (activeFilter === 'alerts_only' && !item.alertTriggered) return false;
    if (activeFilter === 'pack_pulls' && item.acquisitionType !== 'pack_pull') return false;
    if (activeFilter === 'purchases' && item.acquisitionType !== 'purchase') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.cardName.toLowerCase().includes(q);
      const matchSet = item.setName.toLowerCase().includes(q) || item.setNumber.toLowerCase().includes(q);
      const matchBatch = item.packBatchCode?.toLowerCase().includes(q);
      if (!matchName && !matchSet && !matchBatch) return false;
    }
    return true;
  });

  const getCorrespondingPokemonCard = (item: CollectionCardItem): PokemonCard => {
    const matched = POKEMON_CARD_DATABASE.find((c) => c.id === item.cardId);
    if (matched) return matched;
    return {
      id: item.cardId,
      name: item.cardName,
      setNumber: item.setNumber,
      setName: item.setName,
      series: 'Scarlet & Violet',
      releaseYear: 2023,
      rarity: 'Special Illustration Rare',
      foilType: 'Holo',
      imageUrl: item.imageUrl,
      typicalTraderaSoldSEK: item.currentMarketPriceSek,
      typicalTraderaLeadingBidSEK: Math.round(item.currentMarketPriceSek * 0.75),
      typicalTraderaBidsCount: 14,
      typicalTraderaTimeLeft: '3h 12m',
      typicalEbayUSD: Math.round(item.currentMarketPriceSek / 9.94),
      typicalEbayActiveUSD: Math.round(item.currentMarketPriceSek / 9.94 * 1.05),
      typicalCardmarketEUR: Math.round(item.currentMarketPriceSek / 10.82),
      isHighValue: item.currentMarketPriceSek > 1000,
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Portfolio Command Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold">
              VAULT &amp; SÄLJVARNINGAR
            </span>
            {currentUser ? (
              <span className="text-xs font-semibold text-slate-600">
                Inloggad som: <strong className="text-slate-900">{currentUser.displayName}</strong>
              </span>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
              >
                Logga in för molnsynkning
              </button>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Min Samling &amp; Vinstvarningar
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Spåra inköpspris, pack-batchkoder och få automatiska larm när det är dags att sälja
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lägg till kort</span>
          </button>
        </div>
      </div>

      {/* Portfolio Financial Performance Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
            Totalt Investerat
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalInvestedSek.toLocaleString()} SEK
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Inköp + packkostnader
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
            Aktuellt Marknadsvärde
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalMarketValueSek.toLocaleString()} SEK
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Baserat på färska Tradera comps
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
            Orealiserad Vinst
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            +{netProfitSek.toLocaleString()} SEK
          </div>
          <div className="text-[11px] text-emerald-600 font-mono font-bold mt-0.5">
            +{netRoiPct}% total avkastning
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          triggeredAlerts.length > 0
            ? 'bg-red-50/80 border-red-200 text-red-900'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="text-[10px] uppercase font-mono tracking-wider font-bold flex items-center gap-1 text-red-600">
            <Flame className="w-3.5 h-3.5 fill-current" />
            Aktiva Säljvarningar
          </div>
          <div className="text-2xl font-bold font-mono text-red-600 mt-1">
            {triggeredAlerts.length} st
          </div>
          <div className="text-[11px] text-red-500 font-mono mt-0.5">
            {triggeredAlerts.length > 0 ? 'Mål uppnått! Dags att sälja' : 'Inga mål nådda ännu'}
          </div>
        </div>
      </div>

      {/* Triggered Säljvarningar Alert Banner */}
      {triggeredAlerts.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">
                🚨 SÄLJVARNING AKTIVERAD ({triggeredAlerts.length} KORT REDO FÖR FÖRSÄLJNING)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
              Vinstmål Uppnått
            </span>
          </div>
          <p className="text-xs text-white/90 leading-relaxed">
            Dessa kort har överträffat din personliga vinstmarginal! Skapa en optimerad annons direkt på Tradera, eBay eller Cardmarket med ett klick.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {triggeredAlerts.map((card) => (
              <div
                key={card.id}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs flex items-center gap-2 transition"
              >
                <span className="font-bold">{card.cardName}</span>
                <span className="font-mono text-emerald-300 font-bold">
                  +{card.currentProfitPercentage}% (Mål: +{card.targetProfitPercentage}%)
                </span>
                <button
                  onClick={() => setListingModalCard(card)}
                  className="px-2 py-0.5 rounded-lg bg-white text-red-600 font-bold text-[10px] hover:bg-red-50 transition cursor-pointer"
                >
                  Skapa Annons
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Alla ({collection.length})
          </button>

          <button
            onClick={() => setActiveFilter('alerts_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
              activeFilter === 'alerts_only'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Säljklara ({triggeredAlerts.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('pack_pulls')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
              activeFilter === 'pack_pulls'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Pack-dragningar ({collection.filter((c) => c.acquisitionType === 'pack_pull').length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('purchases')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
              activeFilter === 'purchases'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Singelköp ({collection.filter((c) => c.acquisitionType === 'purchase').length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök kort eller batchkod..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Card Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">Inga kort matchar ditt filter</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Lägg till ditt första kort eller ändra dina sökkriterier ovan för att visa samlingen.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
          >
            + Lägg till kort nu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const correspondingCard = getCorrespondingPokemonCard(item);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between relative ${
                  item.alertTriggered ? 'border-red-300 ring-2 ring-red-500/20' : 'border-slate-200'
                }`}
              >
                {/* Top Badge Strip */}
                <div className="p-4 pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.acquisitionType === 'pack_pull' ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Package className="w-3 h-3 text-blue-600" />
                        Pack-dragning
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-mono font-bold flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-purple-600" />
                        Singelköp
                      </span>
                    )}

                    {item.packBatchCode && (
                      <span
                        className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-bold flex items-center gap-1"
                        title="Stämplad batchkod på förpackning"
                      >
                        <Barcode className="w-3 h-3 text-slate-500" />
                        {item.packBatchCode}
                      </span>
                    )}
                  </div>

                  {item.alertTriggered ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                      <Flame className="w-3 h-3 fill-current" />
                      SÄLJNU!
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      Mål: +{item.targetProfitPercentage}%
                    </span>
                  )}
                </div>

                {/* Card Main Info Split */}
                <div className="p-4 flex items-start gap-3.5">
                  <img
                    src={item.imageUrl}
                    alt={item.cardName}
                    className="w-16 h-22 object-contain rounded-xl shadow-xs border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                      {item.cardName}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {item.setNumber} &bull; {item.setName}
                    </p>
                    <div className="mt-1 text-[11px] text-slate-600 font-semibold truncate">
                      {item.condition}
                    </div>

                    {/* Cost vs Current Value */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase">Inköpspris</span>
                        <strong className="text-slate-900 font-bold">
                          {item.purchasePriceSek} SEK
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 block uppercase">Nuvärde</span>
                        <strong className="text-emerald-900 font-bold">
                          {item.currentMarketPriceSek} SEK
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profit Progress Bar */}
                <div className="px-4 py-2 bg-slate-50 border-t border-b border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600">
                      Vinst: <strong className={item.currentProfitPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        +{item.currentProfitPercentage}%
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Mål: <strong>{item.targetSellPriceSek} SEK</strong> (+{item.targetProfitPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.alertTriggered ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, (item.currentProfitPercentage / item.targetProfitPercentage) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="p-3 bg-white flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setListingModalCard(item)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                        item.alertTriggered
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                      title="Skapa annons med 1-klick för Tradera, eBay eller Cardmarket"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Skapa Annons</span>
                    </button>

                    <button
                      onClick={() => onOpenPriceCurve(correspondingCard)}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                      title="Se 365d priskurva"
                    >
                      <LineChart className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenAppreciationModal(correspondingCard)}
                      className="p-2 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                      title="Se 1-3 års prediktiv värdeprognos"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteCard(item.id)}
                    className="p-2 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Ta bort från samling"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <AddCardToCollectionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddCard={onAddCard}
          userId={currentUser?.uid || 'demo-collector'}
        />
      )}

      {/* Listing Creator Modal */}
      {listingModalCard && (
        <ListingCreatorModal
          card={listingModalCard}
          isOpen={Boolean(listingModalCard)}
          onClose={() => setListingModalCard(null)}
        />
      )}
    </div>
  );
};
