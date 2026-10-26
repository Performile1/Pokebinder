import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Tag,
  DollarSign,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CollectionCardItem, ListingPlatform, PokemonCard } from '../types';
import { generateMarketplaceListing } from '../utils/listingGenerator';

interface ListingCreatorModalProps {
  card: PokemonCard | CollectionCardItem;
  isOpen: boolean;
  onClose: () => void;
  usdToSek?: number;
}

export const ListingCreatorModal: React.FC<ListingCreatorModalProps> = ({
  card,
  isOpen,
  onClose,
  usdToSek = 9.94,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<ListingPlatform>('tradera');
  const [copiedTitle, setCopiedTitle] = useState<boolean>(false);
  const [copiedDesc, setCopiedDesc] = useState<boolean>(false);

  const cardName = 'cardName' in card ? card.cardName : card.name;
  const currentPrice = 'currentMarketPriceSek' in card ? card.currentMarketPriceSek : card.typicalTraderaSoldSEK;

  const [priceInput, setPriceInput] = useState<number>(currentPrice);
  const [conditionInput, setConditionInput] = useState<string>(
    'condition' in card ? card.condition : 'Near Mint (NM)'
  );

  if (!isOpen) return null;

  const listing = generateMarketplaceListing(
    card,
    selectedPlatform,
    priceInput,
    conditionInput
  );

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(listing.title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyDesc = () => {
    navigator.clipboard.writeText(listing.description);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col relative">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                Skapa Annons &bull; {cardName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {card.setNumber} ({card.setName}) &bull; Färdiga mallar för marknadsplatser
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Platform Switcher Tabs */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-bold">
              Välj Försäljningsplattform:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedPlatform('tradera')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 ${
                  selectedPlatform === 'tradera'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-xs font-black">Tradera</span>
                <span className="text-[10px] opacity-85">Sveriges #1 TCG</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('ebay')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 ${
                  selectedPlatform === 'ebay'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-xs font-black">eBay Global</span>
                <span className="text-[10px] opacity-85">Internationellt (USD)</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('cardmarket')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 ${
                  selectedPlatform === 'cardmarket'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-xs font-black">Cardmarket</span>
                <span className="text-[10px] opacity-85">Europa Hub (EUR)</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('blocket')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 ${
                  selectedPlatform === 'blocket'
                    ? 'bg-red-600 text-white border-red-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-xs font-black">Blocket</span>
                <span className="text-[10px] opacity-85">Lokal hämtning</span>
              </button>
            </div>
          </div>

          {/* Quick Pricing Adjustment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Ditt Försäljningspris (SEK):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-600"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">SEK</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Motsvarar ca ${Math.round(priceInput / usdToSek)} USD / €{Math.round(priceInput / 10.82)} EUR
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Kortets Skick:
              </label>
              <select
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-600"
              >
                <option value="PSA 10 Contender (Flawless)">PSA 10 Contender (Flawless)</option>
                <option value="Near Mint (NM) Pristine">Near Mint (NM) Pristine</option>
                <option value="Excellent / Light Play (EX/LP)">Excellent / Light Play (EX/LP)</option>
                <option value="Played / Good (PL/GD)">Played / Good (PL/GD)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Kategori: {listing.categoryPath}
              </p>
            </div>
          </div>

          {/* Title Field with 1-Click Copy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-600" />
                Optimerad Annonstitel ({selectedPlatform.toUpperCase()}):
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {listing.title.length} tecken
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={listing.title}
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 font-semibold"
              />
              <button
                onClick={handleCopyTitle}
                className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                  copiedTitle
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copiedTitle ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTitle ? 'Kopierad!' : 'Kopiera'}</span>
              </button>
            </div>
          </div>

          {/* Description Field with 1-Click Copy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Färdig Annonstext med Skyddsförpackning &amp; Äkthetsgaranti:
              </label>
              <button
                onClick={handleCopyDesc}
                className={`text-[11px] font-bold flex items-center gap-1 transition ${
                  copiedDesc ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copiedDesc ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedDesc ? 'Text Kopierad!' : 'Kopiera Hela Texten'}
              </button>
            </div>
            <textarea
              readOnly
              rows={7}
              value={listing.description}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed resize-none"
            />
          </div>

          {/* Pricing & Shipping Summary */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-amber-900 block">
                Föreslagen Frakt: {listing.shippingDetails}
              </span>
              <span className="text-[11px] text-amber-700 font-mono">
                {selectedPlatform === 'tradera'
                  ? `Utropspris: ${listing.startingBidSek} SEK | Köp nu: ${listing.priceSek} SEK`
                  : `Pris: ${listing.priceLocalCurrency || `${listing.priceSek} SEK`}`}
              </span>
            </div>

            {listing.directUrl && (
              <a
                href={listing.directUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
              >
                <span>Öppna {selectedPlatform.toUpperCase()}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Kopiera texten och klistra in direkt i {selectedPlatform.toUpperCase()}-appen!
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};
