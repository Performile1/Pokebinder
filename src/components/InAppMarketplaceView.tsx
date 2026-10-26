import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Sparkles,
  CreditCard,
  QrCode,
  Flame,
  Search,
  ExternalLink,
  X,
  Package,
  Barcode,
  Star,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { MarketplaceCardForSale, AppOrderRecord, CollectionCardItem, CollectorProfile } from '../types';
import { MARKETPLACE_INVENTORY } from '../data/marketplaceInventory';
import { createInAppOrder } from '../services/collectionService';
import { soundEffects } from '../utils/audio';

interface InAppMarketplaceViewProps {
  onCardPurchasedAndAddedToCollection: (card: CollectionCardItem) => void;
  currentUser: CollectorProfile | null;
  onNavigateToCollection: () => void;
}

export const InAppMarketplaceView: React.FC<InAppMarketplaceViewProps> = ({
  onCardPurchasedAndAddedToCollection,
  currentUser,
  onNavigateToCollection,
}) => {
  const [inventory, setInventory] = useState<MarketplaceCardForSale[]>(MARKETPLACE_INVENTORY);
  const [selectedCardForPurchase, setSelectedCardForPurchase] = useState<MarketplaceCardForSale | null>(null);
  const [filter, setFilter] = useState<'all' | 'discounted' | 'grails'>('all');
  const [search, setSearch] = useState<string>('');

  // Checkout form state
  const [paymentMethod, setPaymentMethod] = useState<'swish' | 'card' | 'klarna'>('swish');
  const [fullName, setFullName] = useState<string>('William Grund');
  const [streetAddress, setStreetAddress] = useState<string>('Storgatan 14B');
  const [postalCode, setPostalCode] = useState<string>('111 22');
  const [city, setCity] = useState<string>('Stockholm');
  const [phone, setPhone] = useState<string>('070-123 45 67');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<AppOrderRecord | null>(null);

  const filteredInventory = inventory.filter((item) => {
    if (filter === 'discounted' && item.savingsPct <= 5) return false;
    if (filter === 'grails' && item.priceSek < 1000) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.setName.toLowerCase().includes(q) ||
        item.setNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExecutePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForPurchase) return;

    setIsProcessing(true);

    try {
      // Simulate realistic payment gateway latency
      await new Promise((r) => setTimeout(r, 1200));

      const totalAmountSek = selectedCardForPurchase.priceSek + selectedCardForPurchase.shippingFeeSek;
      const orderId = `order-${Date.now()}`;

      const newOrder: AppOrderRecord = {
        id: orderId,
        buyerId: currentUser?.uid || 'guest-collector',
        buyerEmail: currentUser?.email || 'samlare@pokearb.se',
        cardId: selectedCardForPurchase.cardId,
        cardName: selectedCardForPurchase.name,
        cardImageUrl: selectedCardForPurchase.imageUrl,
        priceSek: selectedCardForPurchase.priceSek,
        shippingSek: selectedCardForPurchase.shippingFeeSek,
        totalAmountSek,
        paymentMethod,
        status: 'completed',
        shippingAddress: {
          fullName,
          streetAddress,
          postalCode,
          city,
          phone,
        },
        createdAt: new Date().toISOString(),
      };

      // 1. Save in-app order in Firestore + localStorage
      await createInAppOrder(newOrder);

      // 2. Automatically add to user's personal collection with purchase price & default +50% profit target!
      const collectionItem: CollectionCardItem = {
        id: `col-${Date.now()}`,
        userId: currentUser?.uid || 'demo-collector',
        cardId: selectedCardForPurchase.cardId,
        cardName: selectedCardForPurchase.name,
        setNumber: selectedCardForPurchase.setNumber,
        setName: selectedCardForPurchase.setName,
        imageUrl: selectedCardForPurchase.imageUrl,
        acquisitionType: 'purchase',
        purchasePriceSek: selectedCardForPurchase.priceSek,
        targetProfitPercentage: 50,
        targetSellPriceSek: Math.round(selectedCardForPurchase.priceSek * 1.5),
        currentMarketPriceSek: selectedCardForPurchase.marketPriceSek,
        currentProfitPercentage: Number(
          (
            ((selectedCardForPurchase.marketPriceSek - selectedCardForPurchase.priceSek) /
              selectedCardForPurchase.priceSek) *
            100
          ).toFixed(1)
        ),
        alertTriggered: selectedCardForPurchase.marketPriceSek >= Math.round(selectedCardForPurchase.priceSek * 1.5),
        condition: selectedCardForPurchase.condition,
        notes: `Köpt direkt i PokéArb-appen från ${selectedCardForPurchase.sellerName}. Order #${orderId.slice(-6)}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onCardPurchasedAndAddedToCollection(collectionItem);

      // Celebrate
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      soundEffects.playFocusLock();

      setCompletedOrder(newOrder);
      setSelectedCardForPurchase(null);
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              VERIFIERAD MARKNAD
            </span>
            <span className="text-xs text-slate-500 font-mono">100% Äkthetsgaranti</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Köp Pokémon-Kort Direkt i Appen
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Säkra köp med Swish, Kort &amp; Klarna. Köpta kort läggs automatiskt in i din samling med aktiva vinstvarningar!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToCollection}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <span>Öppna Min Samling</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            Alla Kort ({inventory.length})
          </button>
          <button
            onClick={() => setFilter('discounted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
              filter === 'discounted'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Under Marknadspris</span>
          </button>
          <button
            onClick={() => setFilter('grails')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
              filter === 'grails'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grails &gt;1 000 kr</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök bland kort för köp..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Äkthet Verifierad
                </span>
                {item.savingsPct > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold">
                    -{item.savingsPct}% under comps
                  </span>
                )}
              </div>

              <div className="flex items-start gap-3.5">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-28 object-contain rounded-xl shadow-xs border border-slate-200 bg-slate-50 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {item.setNumber} &bull; {item.setName}
                  </p>
                  <p className="text-xs text-slate-700 font-semibold mt-1">
                    {item.condition}
                  </p>
                  {item.batchCodeOrigin && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Barcode className="w-3 h-3" />
                      {item.batchCodeOrigin}
                    </p>
                  )}
                </div>
              </div>

              {/* Seller Trust & Shipping */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-slate-800">{item.sellerName}</span>
                  <span className="flex items-center text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px] ml-0.5 font-bold font-mono">{item.sellerRating}</span>
                  </span>
                  <span className="text-slate-400">({item.sellerCity})</span>
                </div>
                <span className="font-mono text-slate-500 shrink-0">
                  {item.shippingFeeSek === 0 ? 'Fri frakt' : `${item.shippingFeeSek} kr frakt`}
                </span>
              </div>
            </div>

            {/* Price & Buy Button Footer */}
            <div className="p-4 pt-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-black font-mono text-slate-900">
                  {item.priceSek.toLocaleString()} SEK
                </div>
                <div className="text-[10px] text-slate-400 font-mono line-through">
                  Ord. comps: {item.marketPriceSek.toLocaleString()} SEK
                </div>
              </div>

              <button
                onClick={() => setSelectedCardForPurchase(item)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Köp Nu</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Modal */}
      {selectedCardForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col relative">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Snabbkassa &bull; Köp Kort</h3>
                  <p className="text-xs text-slate-500 font-mono">Direkt tillägg till din personliga samling</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCardForPurchase(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePurchase} className="p-6 space-y-4">
              {/* Card Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src={selectedCardForPurchase.imageUrl}
                  alt={selectedCardForPurchase.name}
                  className="w-12 h-16 object-contain rounded-lg border border-slate-200 bg-white"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {selectedCardForPurchase.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {selectedCardForPurchase.setNumber} &bull; {selectedCardForPurchase.condition}
                  </div>
                  <div className="text-xs font-mono font-bold text-red-600 mt-0.5">
                    {selectedCardForPurchase.priceSek} SEK + {selectedCardForPurchase.shippingFeeSek} kr spårbar frakt
                  </div>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-bold">
                  Välj Betalsätt:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('swish')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'swish'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold">Swish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'card'
                        ? 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold">Bankkort</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('klarna')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'klarna'
                        ? 'bg-pink-50 border-pink-500 text-pink-900 ring-2 ring-pink-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-bold">Klarna</span>
                  </button>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-2.5 pt-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
                  Leveransadress (PostNord Spårbart Brev):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Fullständigt namn"
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobilnummer för SMS-avi"
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Gatuadress"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Postnummer"
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ort"
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Total & Confirmation */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-amber-900 font-bold block">
                    Totalt att betala: {(selectedCardForPurchase.priceSek + selectedCardForPurchase.shippingFeeSek).toLocaleString()} SEK
                  </span>
                  <span className="text-[10px] text-amber-700">
                    Kortet läggs automatiskt in i din samling med vinstmål +50%!
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-900 text-sm">
                  {selectedCardForPurchase.priceSek + selectedCardForPurchase.shippingFeeSek} SEK
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Bearbetar betalning...'
                    : `Bekräfta köp med ${paymentMethod.toUpperCase()}`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Köp Genomfört!</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Order #{completedOrder.id.slice(-8)} &bull; {completedOrder.paymentMethod.toUpperCase()}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <strong>{completedOrder.cardName}</strong> har köpts för{' '}
              <strong>{completedOrder.totalAmountSek} SEK</strong> och har automatiskt lagts till i din{' '}
              <strong>personliga samling</strong> med aktiverad vinstuppföljning och säljvarningar!
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Stäng
              </button>
              <button
                onClick={() => {
                  setCompletedOrder(null);
                  onNavigateToCollection();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Gå till Samlingen →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
