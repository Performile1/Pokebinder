import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CollectionCardItem, AppOrderRecord } from '../types';

const LOCAL_STORAGE_COLLECTION_KEY = 'pokearb_user_collection';
const LOCAL_STORAGE_ORDERS_KEY = 'pokearb_user_orders';

// Initial starter collection for new collectors / demo preview
export const INITIAL_DEMO_COLLECTION: CollectionCardItem[] = [
  {
    id: 'col-card-1',
    userId: 'demo-collector',
    cardId: 'sv3pt5-199',
    cardName: 'Charizard ex (Special Illustration Rare)',
    setNumber: '199/165',
    setName: 'Pokémon 151',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
    acquisitionType: 'pack_pull',
    purchasePriceSek: 69, // Cost of the booster pack!
    packCostSek: 69,
    packBatchCode: 'F23-09A', // Batch code on booster foil
    targetProfitPercentage: 100, // +100% target
    targetSellPriceSek: 138,
    currentMarketPriceSek: 1350,
    currentProfitPercentage: 1856, // Massive pack pull ROI!
    alertTriggered: true, // Target exceeded!
    condition: 'PSA 10 Contender (Flawless Centering)',
    notes: 'Dragen ur boosterpaket från ICA Maxi Uppsala. Första print run batch.',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col-card-2',
    userId: 'demo-collector',
    cardId: 'swsh7-215',
    cardName: 'Umbreon VMAX (Moonbreon Alt Art)',
    setNumber: '215/203',
    setName: 'Evolving Skies',
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    acquisitionType: 'purchase',
    purchasePriceSek: 6500,
    targetProfitPercentage: 25, // Target +25%
    targetSellPriceSek: 8125,
    currentMarketPriceSek: 8900,
    currentProfitPercentage: 36.9,
    alertTriggered: true, // +36.9% exceeds +25%!
    condition: 'Raw Near Mint (Hållen i Magnetic One-Touch)',
    notes: 'Köpt på Tradera för 6500 kr. Riktkurs 8125 kr passerad.',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col-card-3',
    userId: 'demo-collector',
    cardId: 'sv4-198',
    cardName: 'Roaring Moon ex (Special Illustration Rare)',
    setNumber: '251/182',
    setName: 'Paradox Rift',
    imageUrl: 'https://images.pokemontcg.io/sv4/251_hires.png',
    acquisitionType: 'pack_pull',
    purchasePriceSek: 65,
    packCostSek: 65,
    packBatchCode: 'E22-B12',
    targetProfitPercentage: 50,
    targetSellPriceSek: 97,
    currentMarketPriceSek: 720,
    currentProfitPercentage: 1007,
    alertTriggered: true,
    condition: 'Raw NM',
    notes: 'Booster Box pull, batch E22-B12.',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col-card-4',
    userId: 'demo-collector',
    cardId: 'base1-4',
    cardName: 'Charizard (Holo Rare 1st Print)',
    setNumber: '4/102',
    setName: 'Base Set',
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    acquisitionType: 'purchase',
    purchasePriceSek: 3200,
    targetProfitPercentage: 50,
    targetSellPriceSek: 4800,
    currentMarketPriceSek: 4200,
    currentProfitPercentage: 31.2,
    alertTriggered: false, // 31.2% has not yet reached 50%
    condition: 'Excellent / Light Play',
    notes: 'Klassiker från 1999. Väntar på 4800 kr för sälj.',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getLocalCollection(): CollectionCardItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COLLECTION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading local collection:', err);
  }
  return INITIAL_DEMO_COLLECTION;
}

export function saveLocalCollection(items: CollectionCardItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_COLLECTION_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed saving local collection:', err);
  }
}

/**
 * Calculates profit % and checks if alert should trigger
 */
export function recalculateCardEconomics(
  card: Omit<CollectionCardItem, 'targetSellPriceSek' | 'currentProfitPercentage' | 'alertTriggered'>
): CollectionCardItem {
  const cost = card.purchasePriceSek > 0 ? card.purchasePriceSek : 1;
  const targetSellPriceSek = Math.round(cost * (1 + card.targetProfitPercentage / 100));
  const currentProfitPercentage = Number((((card.currentMarketPriceSek - cost) / cost) * 100).toFixed(1));
  const alertTriggered = card.currentMarketPriceSek >= targetSellPriceSek;

  return {
    ...card,
    targetSellPriceSek,
    currentProfitPercentage,
    alertTriggered,
  };
}

/**
 * Save or update a card in user collection (Firestore + localStorage sync)
 */
export async function saveCollectionCard(
  userId: string,
  cardData: CollectionCardItem
): Promise<CollectionCardItem> {
  const recalculated = recalculateCardEconomics(cardData);

  // 1. Update localStorage instantly
  const local = getLocalCollection();
  const existingIdx = local.findIndex((c) => c.id === recalculated.id);
  let updatedList: CollectionCardItem[];
  if (existingIdx >= 0) {
    updatedList = [...local];
    updatedList[existingIdx] = recalculated;
  } else {
    updatedList = [recalculated, ...local];
  }
  saveLocalCollection(updatedList);

  // 2. Sync to Firestore if authenticated
  if (userId && userId !== 'demo-collector' && !userId.startsWith('guest-')) {
    const path = `users/${userId}/collection`;
    try {
      const cardDocRef = doc(db, path, recalculated.id);
      await setDoc(cardDocRef, recalculated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${path}/${recalculated.id}`);
    }
  }

  return recalculated;
}

/**
 * Delete a card from user collection
 */
export async function deleteCollectionCard(userId: string, cardDocId: string): Promise<void> {
  // Update localStorage
  const local = getLocalCollection();
  const filtered = local.filter((c) => c.id !== cardDocId);
  saveLocalCollection(filtered);

  // Sync to Firestore
  if (userId && userId !== 'demo-collector' && !userId.startsWith('guest-')) {
    const path = `users/${userId}/collection/${cardDocId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

/**
 * Fetch all collection cards for user
 */
export async function fetchUserCollection(userId: string): Promise<CollectionCardItem[]> {
  if (!userId || userId === 'demo-collector' || userId.startsWith('guest-')) {
    return getLocalCollection();
  }

  const path = `users/${userId}/collection`;
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      // If Firestore is empty for this user, seed with local collection
      const local = getLocalCollection();
      for (const item of local) {
        await setDoc(doc(db, path, item.id), { ...item, userId });
      }
      return local;
    }
    const cards: CollectionCardItem[] = [];
    snap.forEach((d) => {
      cards.push(d.data() as CollectionCardItem);
    });
    saveLocalCollection(cards);
    return cards;
  } catch (err) {
    console.warn('Firestore fetch failed, using local cache:', err);
    return getLocalCollection();
  }
}

/**
 * Listen to live real-time changes in collection
 */
export function subscribeToUserCollection(
  userId: string,
  onUpdate: (cards: CollectionCardItem[]) => void
): () => void {
  if (!userId || userId === 'demo-collector' || userId.startsWith('guest-')) {
    onUpdate(getLocalCollection());
    return () => {};
  }

  const path = `users/${userId}/collection`;
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: CollectionCardItem[] = [];
      snap.forEach((d) => items.push(d.data() as CollectionCardItem));
      saveLocalCollection(items);
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
      onUpdate(getLocalCollection());
    }
  );
}

/**
 * Save in-app order
 */
export async function createInAppOrder(order: AppOrderRecord): Promise<void> {
  // Local storage
  try {
    const existing: AppOrderRecord[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || '[]'
    );
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([order, ...existing]));
  } catch (e) {
    console.error(e);
  }

  // Firestore sync
  if (order.buyerId && !order.buyerId.startsWith('guest-')) {
    const path = `orders/${order.id}`;
    try {
      await setDoc(doc(db, path), order);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}
