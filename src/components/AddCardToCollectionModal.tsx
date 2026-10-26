import React, { useState } from 'react';
import {
  X,
  Plus,
  Package,
  ShoppingBag,
  TrendingUp,
  Barcode,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CollectionCardItem, PokemonCard } from '../types';
import { POKEMON_CARD_DATABASE } from '../data/pokemonCards';
import { recalculateCardEconomics } from '../services/collectionService';

interface AddCardToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: CollectionCardItem) => void;
  userId: string;
  preselectedCard?: PokemonCard | null;
}

export const AddCardToCollectionModal: React.FC<AddCardToCollectionModalProps> = ({
  isOpen,
  onClose,
  onAddCard,
  userId,
  preselectedCard,
}) => {
  const [selectedCard, setSelectedCard] = useState<PokemonCard>(
    preselectedCard || POKEMON_CARD_DATABASE[4] // default Charizard ex 151
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingCard, setIsSearchingCard] = useState<boolean>(false);

  // Acquisition details
  const [acquisitionType, setAcquisitionType] = useState<'purchase' | 'pack_pull'>('pack_pull');
  const [purchasePriceSek, setPurchasePriceSek] = useState<number>(69);
  const [packBatchCode, setPackBatchCode] = useState<string>('F23-09A');
  const [targetProfitPercentage, setTargetProfitPercentage] = useState<number>(50);
  const [condition, setCondition] = useState<string>('PSA 10 Contender (Flawless)');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const currentMarketPriceSek = selectedCard.typicalTraderaSoldSEK || 800;
  const cost = purchasePriceSek > 0 ? purchasePriceSek : 1;
  const targetSellPriceSek = Math.round(cost * (1 + targetProfitPercentage / 100));

  const filteredCards = POKEMON_CARD_DATABASE.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.setNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.setName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCardData: Omit<
      CollectionCardItem,
      'targetSellPriceSek' | 'currentProfitPercentage' | 'alertTriggered'
    > = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: userId || 'demo-collector',
      cardId: selectedCard.id,
      cardName: selectedCard.name,
      setNumber: selectedCard.setNumber,
      setName: selectedCard.setName,
      imageUrl: selectedCard.imageUrl,
      acquisitionType,
      purchasePriceSek,
      packCostSek: acquisitionType === 'pack_pull' ? purchasePriceSek : undefined,
      packBatchCode: acquisitionType === 'pack_pull' ? packBatchCode.trim() : undefined,
      targetProfitPercentage,
      currentMarketPriceSek,
      condition,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const calculated = recalculateCardEconomics(newCardData);
    onAddCard(calculated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col relative">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Lägg till kort i din Samling
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Sätt inköpspris, pack-batchkod och personligt vinstmål
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Card Selector Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.name}
                className="w-12 h-16 object-contain rounded-lg shadow-xs border border-slate-200 shrink-0 bg-white"
              />
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{selectedCard.name}</div>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedCard.setNumber} &bull; {selectedCard.setName}
                </div>
                <div className="text-xs font-mono font-bold text-red-600 mt-0.5">
                  Nuvärde: ~{currentMarketPriceSek.toLocaleString()} SEK
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSearchingCard(!isSearchingCard)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer shrink-0"
            >
              {isSearchingCard ? 'Dölj lista' : 'Byt kort'}
            </button>
          </div>

          {/* Collapsible Card Quick Search */}
          {isSearchingCard && (
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 space-y-2 animate-in fade-in">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök namn eller set..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredCards.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setSelectedCard(c);
                      setIsSearchingCard(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition cursor-pointer ${
                      selectedCard.id === c.id
                        ? 'bg-red-50 text-red-900 font-bold border border-red-200'
                        : 'bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">
                      {c.name} ({c.setNumber})
                    </span>
                    <span className="font-mono text-slate-500 text-[11px] shrink-0 ml-2">
                      {c.typicalTraderaSoldSEK} SEK
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acquisition Method: Pack pull vs Individual Purchase */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-bold">
              Hur fick du tag på kortet?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAcquisitionType('pack_pull');
                  if (purchasePriceSek > 150) setPurchasePriceSek(69); // reset to normal pack cost
                }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  acquisitionType === 'pack_pull'
                    ? 'bg-red-50 border-red-300 text-red-900 ring-2 ring-red-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Package className="w-4 h-4 text-red-600" />
                  <span>Dragen ur ett Pack</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Registrera packpris + batchkod
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAcquisitionType('purchase');
                  if (purchasePriceSek < 100) setPurchasePriceSek(selectedCard.typicalTraderaSoldSEK);
                }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  acquisitionType === 'purchase'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Köpt som Singelkort</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Tradera, Cardmarket, m.m.
                </span>
              </button>
            </div>
          </div>

          {/* Inköpspris / Pack-kostnad & Batchkod */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {acquisitionType === 'pack_pull' ? 'Vad kostade boosterpacket?' : 'Vad köpte du kortet för?'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={purchasePriceSek}
                  onChange={(e) => setPurchasePriceSek(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-600"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-slate-500">SEK</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                {acquisitionType === 'pack_pull' ? 'T.ex. 69 kr för ett vanligt boosterpaket' : 'Ditt faktiska inköpspris'}
              </p>
            </div>

            {/* Pack Batchkod om pack-dragning */}
            {acquisitionType === 'pack_pull' ? (
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Barcode className="w-3.5 h-3.5 text-red-600" />
                  <span>Batchkod på packet / boxen:</span>
                </label>
                <input
                  type="text"
                  value={packBatchCode}
                  onChange={(e) => setPackBatchCode(e.target.value)}
                  placeholder="t.ex. F23-09A eller SV3-B12"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-600 uppercase"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Finns stämplad på förpackningens baksida
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Skick vid inköp:
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-600"
                >
                  <option value="PSA 10 Contender (Flawless)">PSA 10 Contender (Flawless)</option>
                  <option value="Near Mint (NM) Pristine">Near Mint (NM) Pristine</option>
                  <option value="Excellent / Light Play">Excellent / Light Play</option>
                  <option value="Played / Good">Played / Good</option>
                </select>
              </div>
            )}
          </div>

          {/* Vinstmål & Säljvarning */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Önskad Vinstprocent (Säljvarning):
              </label>
              <span className="text-sm font-mono font-black text-emerald-700">
                +{targetProfitPercentage}%
              </span>
            </div>

            {/* Quick Profit Target Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 100, 200].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => setTargetProfitPercentage(pct)}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                    targetProfitPercentage === pct
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>

            {/* Live Target Sell Threshold Calculation */}
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="text-emerald-900">
                🚨 Säljvarning aktiveras vid:
              </span>
              <span className="font-mono font-extrabold text-emerald-900 text-sm">
                {targetSellPriceSek.toLocaleString()} SEK
              </span>
            </div>

            {currentMarketPriceSek >= targetSellPriceSek && (
              <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  OBS: Nuvärdet ({currentMarketPriceSek} kr) överstiger redan ditt mål på {targetSellPriceSek} kr! Säljvarning kommer triggas direkt.
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Anteckningar (valfritt):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="t.ex. Köpt på Comic Con, perfekt centrering, sparad i Pro-Mold"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Spara i Samlingen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
