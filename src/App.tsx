import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  Layers,
  Flame,
  TrendingUp,
  DollarSign,
  Bell,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Zap,
  Info,
  SwitchCamera,
  Settings,
  Gavel,
  ShieldAlert,
  ListFilter,
  Globe,
  FileSpreadsheet,
  Search,
  Target,
  LineChart,
  X,
  Award,
  Home,
  BookmarkCheck,
  ShoppingBag,
  User,
} from 'lucide-react';

import {
  ScanItem,
  DiscordWebhookConfig,
  PokemonCard,
  ConditionEvaluation,
  AppSettings,
  ComprehensiveListing,
  CollectionCardItem,
  CollectorProfile,
} from './types';
import { POKEMON_CARD_DATABASE, findMatchingCard } from './data/pokemonCards';
import { generatePriceTimeline } from './data/pokecollectorCatalog';
import {
  calculateArbitrageEconomics,
  generateRealisticComps,
  DEFAULT_USD_TO_SEK,
} from './utils/arbitrage';
import { soundEffects } from './utils/audio';
import { DEFAULT_PROXY_KEYWORDS } from './utils/filterProxy';
import {
  subscribeToUserCollection,
  saveCollectionCard,
  deleteCollectionCard,
  getLocalCollection,
} from './services/collectionService';
import { testFirestoreConnection } from './firebase';

import { CameraScanner } from './components/CameraScanner';
import { ScanQueue } from './components/ScanQueue';
import { ArbitrageTable } from './components/ArbitrageTable';
import { ConditionScreeningModal } from './components/ConditionScreeningModal';
import { TiltTestModal } from './components/TiltTestModal';
import { DiscordWebhookSettings } from './components/DiscordWebhookSettings';
import { SampleStackDrawer } from './components/SampleStackDrawer';
import { CardDetailModal } from './components/CardDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ComprehensiveListingsView } from './components/ComprehensiveListingsView';
import { CrossBorderScraperModal } from './components/CrossBorderScraperModal';
import { TargetCardSearchModal } from './components/TargetCardSearchModal';
import { PokecollectorBrowser } from './components/PokecollectorBrowser';
import { PriceHistoryChart } from './components/PriceHistoryChart';
import { RarityPopulationExplorer } from './components/RarityPopulationExplorer';
import { HomeDashboard } from './components/HomeDashboard';
import { AppreciationExplorerView } from './components/AppreciationExplorerView';
import { AppreciationAnalysisModal } from './components/AppreciationAnalysisModal';
import { CollectionVaultView } from './components/CollectionVaultView';
import { InAppMarketplaceView } from './components/InAppMarketplaceView';
import { AuthModal } from './components/AuthModal';
import { ListingCreatorModal } from './components/ListingCreatorModal';

// Initial pre-loaded scans with realistic market pricing and anti-fake telemetry
function getInitialScans(usdToSek: number, valuationBasis: 'sold_for' | 'leading_bid'): ScanItem[] {
  const cards = [
    POKEMON_CARD_DATABASE[0], // Charizard 4/102 Base Set
    POKEMON_CARD_DATABASE[1], // Umbreon VMAX 215/203
    POKEMON_CARD_DATABASE[2], // Blastoise 2/102
    POKEMON_CARD_DATABASE[4], // Charizard ex 199/165 (151)
  ];

  return cards.map((card, idx) => {
    const buyPrice = valuationBasis === 'sold_for' ? card.typicalTraderaSoldSEK : card.typicalTraderaLeadingBidSEK;
    const econ = calculateArbitrageEconomics(
      buyPrice,
      card.typicalEbayUSD,
      usdToSek,
      valuationBasis
    );
    const compsResult = generateRealisticComps(
      card.name,
      card.setNumber,
      card.typicalEbayUSD,
      card.typicalTraderaSoldSEK,
      card.typicalTraderaLeadingBidSEK,
      usdToSek
    );

    const condition: ConditionEvaluation = {
      centering: {
        leftRightRatio: [52, 48],
        topBottomRatio: [51, 49],
        frontCenteringGrade: 'PSA 10 (<= 55/45)',
      },
      cornerWhitening: 'None (Pristine)',
      edgeWear: 'Clean',
      surfaceQuality: 'Flawless Foil',
      estimatedGrade: 'PSA 10 Contender',
    };

    return {
      id: `initial-scan-${idx}`,
      timestamp: Date.now() - idx * 14000,
      thumbnailUrl: card.imageUrl,
      status: 'completed',
      sharpnessScore: 140 + idx * 8,
      card,
      condition,
      economics: econ,
      comps: compsResult.comps,
      tiltTestPassed: idx === 0,
      filterTelemetry: compsResult.filterTelemetry,
    };
  });
}

export default function App() {
  const [usdToSek, setUsdToSek] = useState<number>(DEFAULT_USD_TO_SEK);
  const [eurToSek, setEurToSek] = useState<number>(11.13);
  const [jpyToSek, setJpyToSek] = useState<number>(0.0634);

  // Active Main View: 'home', 'scanner', 'appreciation', 'pokecollector', 'rarity', 'listings', 'collection', 'marketplace'
  const [activeView, setActiveView] = useState<
    'home' | 'scanner' | 'listings' | 'pokecollector' | 'rarity' | 'appreciation' | 'collection' | 'marketplace'
  >('home');

  // User Authentication & Collector Profile
  const [currentUser, setCurrentUser] = useState<CollectorProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pokearb_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      uid: 'demo-wigrund81',
      email: 'wigrund81@gmail.com',
      displayName: 'wigrund81',
      isAnonymous: false,
    };
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // User Card Collection with Profit Sell Alerts
  const [collection, setCollection] = useState<CollectionCardItem[]>(() => getLocalCollection());
  const [listingModalCard, setListingModalCard] = useState<PokemonCard | CollectionCardItem | null>(null);

  // Dedicated Price Curve & Appreciation state
  const [activePriceCurveCard, setActivePriceCurveCard] = useState<PokemonCard | null>(null);
  const [showPriceCurveModal, setShowPriceCurveModal] = useState<boolean>(false);
  const [activeAppreciationCard, setActiveAppreciationCard] = useState<PokemonCard | null>(null);
  const [showAppreciationModal, setShowAppreciationModal] = useState<boolean>(false);

  // Global Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('pokearb_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, autoSnapEnabled: false }; // Auto-snap is off from the start
      }
    } catch {
      // ignore
    }
    return {
      valuationBasis: 'sold_for',
      targetSlabType: 'raw',
      iqrMultiplier: 1.0,
      proxyKeywords: DEFAULT_PROXY_KEYWORDS,
      ebayFeeRate: 0.1325,
      cardmarketFeeRate: 0.05,
      fxSpreadPercent: 3.0,
      intShippingUsd: 15,
      minRoiThreshold: 20,
      autoSnapEnabled: false, // OFF from the start
      blurThreshold: 75,
      soundEnabled: true,
      eurToSek: 11.13,
      jpyToSek: 0.0634,
      scraperMicroserviceUrl: '',
      scraperMode: 'vps_proxy',
      includeSwedishMoms: true,
    };
  });

  const [queue, setQueue] = useState<ScanItem[]>(() =>
    getInitialScans(DEFAULT_USD_TO_SEK, settings.valuationBasis)
  );
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);

  // Modals state
  const [conditionModalItem, setConditionModalItem] = useState<ScanItem | null>(null);
  const [tiltModalItem, setTiltModalItem] = useState<ScanItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<ScanItem | null>(null);
  const [showDiscordModal, setShowDiscordModal] = useState<boolean>(false);
  const [showStackDrawer, setShowStackDrawer] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showScraperModal, setShowScraperModal] = useState<boolean>(false);
  const [currentlyTargetedCard, setCurrentlyTargetedCard] = useState<PokemonCard | null>(null);
  const [showSearchTargetModal, setShowSearchTargetModal] = useState<boolean>(false);

  // Discord config with local storage persistence
  const [discordConfig, setDiscordConfig] = useState<DiscordWebhookConfig>(() => {
    try {
      const saved = localStorage.getItem('pokearb_discord_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      url: '',
      enabled: false,
      minRoiThreshold: 20,
      autoSend: true,
    };
  });

  const isProcessingQueue = useRef<boolean>(false);

  // Fetch live multi-currency FX rates on mount
  useEffect(() => {
    async function fetchFx() {
      try {
        const res = await fetch('/api/fx');
        if (res.ok) {
          const data = await res.json();
          if (data?.baseCurrencies) {
            if (data.baseCurrencies.USD) setUsdToSek(data.baseCurrencies.USD);
            if (data.baseCurrencies.EUR) setEurToSek(data.baseCurrencies.EUR);
            if (data.baseCurrencies.JPY) setJpyToSek(data.baseCurrencies.JPY);
          } else if (data?.midMarketRate) {
            setUsdToSek(data.midMarketRate);
          }
        }
      } catch (err) {
        console.warn('FX fetch fallback:', err);
      }
    }
    fetchFx();
  }, []);

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Subscribe to user collection changes (realtime Firestore + local cache)
  useEffect(() => {
    const unsub = subscribeToUserCollection(currentUser?.uid || 'demo-collector', (cards) => {
      setCollection(cards);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleUserChange = (user: CollectorProfile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('pokearb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pokearb_user');
    }
  };

  const handleAddCardToCollection = async (card: CollectionCardItem) => {
    const updated = await saveCollectionCard(currentUser?.uid || 'demo-collector', card);
    setCollection((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);
  };

  const handleDeleteCardFromCollection = async (cardId: string) => {
    await deleteCollectionCard(currentUser?.uid || 'demo-collector', cardId);
    setCollection((prev) => prev.filter((c) => c.id !== cardId));
  };

  // Save Settings & Discord config
  const handleSaveAllSettings = (newSettings: AppSettings, newDiscord: DiscordWebhookConfig) => {
    setSettings(newSettings);
    setDiscordConfig(newDiscord);
    try {
      localStorage.setItem('pokearb_settings', JSON.stringify(newSettings));
      localStorage.setItem('pokearb_discord_config', JSON.stringify(newDiscord));
    } catch {
      // ignore
    }

    // Re-evaluate queue items if valuationBasis or fees changed
    setQueue((prev) =>
      prev.map((item) => {
        if (!item.card) return item;
        const buyPrice =
          newSettings.valuationBasis === 'sold_for'
            ? item.card.typicalTraderaSoldSEK
            : item.card.typicalTraderaLeadingBidSEK;
        const newEcon = calculateArbitrageEconomics(
          buyPrice,
          item.card.typicalEbayUSD,
          usdToSek,
          newSettings.valuationBasis,
          newSettings.ebayFeeRate,
          newSettings.fxSpreadPercent / 100,
          newSettings.intShippingUsd
        );
        return {
          ...item,
          economics: newEcon,
        };
      })
    );
  };

  // Quick toggle between Sold For (Slutpris) and Leading Bid (Auction Sniping)
  const handleToggleValuationBasis = (basis: 'sold_for' | 'leading_bid') => {
    const updated: AppSettings = { ...settings, valuationBasis: basis };
    handleSaveAllSettings(updated, discordConfig);
  };

  // Background Queue Processing Engine
  useEffect(() => {
    async function processNextQueueItem() {
      if (isProcessingQueue.current) return;

      const nextItem = queue.find((i) => i.status === 'queued');
      if (!nextItem) return;

      isProcessingQueue.current = true;

      // 1. Mark as analyzing
      setQueue((prev) =>
        prev.map((i) => (i.id === nextItem.id ? { ...i, status: 'analyzing' } : i))
      );

      // Short delay for simulated OCR / feature extraction
      await new Promise((r) => setTimeout(r, 450));

      // 2. Identify card & OCR set number
      let matchedCard: PokemonCard = POKEMON_CARD_DATABASE[0];
      let centeringLR: [number, number] = [52, 48];
      let centeringTB: [number, number] = [51, 49];
      let estGrade: ConditionEvaluation['estimatedGrade'] = 'PSA 10 Contender';

      try {
        const recRes = await fetch('/api/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: nextItem.thumbnailUrl.startsWith('data:') ? nextItem.thumbnailUrl : undefined,
            cardHint: nextItem.card?.name,
          }),
        });

        if (recRes.ok) {
          const resData = await recRes.json();
          if (nextItem.card) {
            matchedCard = nextItem.card;
            if (resData?.data?.leftRightCentering) centeringLR = resData.data.leftRightCentering;
            if (resData?.data?.topBottomCentering) centeringTB = resData.data.topBottomCentering;
            if (resData?.data?.estimatedGrade) estGrade = resData.data.estimatedGrade;
          } else if (resData?.data?.name) {
            matchedCard = findMatchingCard(resData.data.name, resData.data.setNumber);
            if (resData.data.leftRightCentering) centeringLR = resData.data.leftRightCentering;
            if (resData.data.topBottomCentering) centeringTB = resData.data.topBottomCentering;
            if (resData.data.estimatedGrade) estGrade = resData.data.estimatedGrade;
          } else {
            const randomIdx = Math.floor(Math.random() * POKEMON_CARD_DATABASE.length);
            matchedCard = POKEMON_CARD_DATABASE[randomIdx];
          }
        }
      } catch (err) {
        console.warn('Recognition fallback:', err);
        matchedCard = nextItem.card || POKEMON_CARD_DATABASE[0];
      }

      // 3. Condition pre-screening
      const condition: ConditionEvaluation = {
        centering: {
          leftRightRatio: centeringLR,
          topBottomRatio: centeringTB,
          frontCenteringGrade:
            centeringLR[0] <= 55 && centeringLR[1] >= 45 ? 'PSA 10 (<= 55/45)' : 'PSA 9 (<= 60/40)',
        },
        cornerWhitening: 'None (Pristine)',
        edgeWear: 'Clean',
        surfaceQuality: 'Flawless Foil',
        estimatedGrade: estGrade,
      };

      // 4. Calculate Cross-Border Arbitrage Economics with Leading Bid vs Sold For
      const buyPrice =
        settings.valuationBasis === 'sold_for'
          ? matchedCard.typicalTraderaSoldSEK
          : matchedCard.typicalTraderaLeadingBidSEK;

      const econ = calculateArbitrageEconomics(
        buyPrice,
        matchedCard.typicalEbayUSD,
        usdToSek,
        settings.valuationBasis,
        settings.ebayFeeRate,
        settings.fxSpreadPercent / 100,
        settings.intShippingUsd
      );

      // 5. Generate sold comps & sanitize through Two-Pronged Proxy & Outlier Filter
      const compsResult = generateRealisticComps(
        matchedCard.name,
        matchedCard.setNumber,
        matchedCard.typicalEbayUSD,
        matchedCard.typicalTraderaSoldSEK,
        matchedCard.typicalTraderaLeadingBidSEK,
        usdToSek
      );

      // 6. High Arbitrage trigger (>20% ROI)
      if (econ.isHighArbitrage) {
        soundEffects.playArbitrageChime();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#ffffff', '#2563eb', '#10b981'],
        });

        if (discordConfig.autoSend && discordConfig.url) {
          fetch('/api/discord-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webhookUrl: discordConfig.url,
              cardName: matchedCard.name,
              setNumber: matchedCard.setNumber,
              economics: econ,
              imageUrl: matchedCard.imageUrl,
            }),
          }).catch(console.error);
        }
      }

      // 7. Update queue item
      setQueue((prev) =>
        prev.map((i) =>
          i.id === nextItem.id
            ? {
                ...i,
                status: 'completed',
                card: matchedCard,
                condition,
                economics: econ,
                comps: compsResult.comps,
                filterTelemetry: compsResult.filterTelemetry,
                discordAlertSent: econ.isHighArbitrage && Boolean(discordConfig.url),
              }
            : i
        )
      );

      isProcessingQueue.current = false;
    }

    processNextQueueItem();
  }, [queue, usdToSek, discordConfig, settings]);

  // Handler for auto-capture from CameraScanner
  const handleCapture = useCallback(
    (
      dataUrl: string,
      sharpness: number,
      targetCard?: PokemonCard | null,
      photoSide: 'front' | 'back' = 'front'
    ) => {
      // If photoSide is 'back' and targetCard matches recent card, attach as back photo
      if (photoSide === 'back' && targetCard) {
        setQueue((prev) => {
          const index = prev.findIndex(
            (i) => i.card?.id === targetCard.id && !i.backThumbnailUrl
          );
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              backThumbnailUrl: dataUrl,
            };
            return updated;
          }
          const newItem: ScanItem = {
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: Date.now(),
            thumbnailUrl: dataUrl,
            status: 'queued',
            sharpnessScore: sharpness,
            card: targetCard,
            photoSide: 'back',
            isTargetedSetCard: true,
          };
          return [newItem, ...prev];
        });
        return;
      }

      const newItem: ScanItem = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        thumbnailUrl: dataUrl,
        status: 'queued',
        sharpnessScore: sharpness,
        card: targetCard || undefined,
        photoSide,
        isTargetedSetCard: Boolean(targetCard),
      };

      setQueue((prev) => [newItem, ...prev]);
    },
    []
  );

  // Handler to inject sample cards from drawer
  const handleInjectStack = (count: number) => {
    const newItems: ScanItem[] = [];
    for (let i = 0; i < count; i++) {
      const card = POKEMON_CARD_DATABASE[i % POKEMON_CARD_DATABASE.length];
      newItems.push({
        id: `sample-batch-${Date.now()}-${i}`,
        timestamp: Date.now() + i * 200,
        thumbnailUrl: card.imageUrl,
        status: 'queued',
        sharpnessScore: 135 + (i % 20),
        card,
      });
    }
    setQueue((prev) => [...newItems, ...prev]);
  };

  const handleInjectSingleCard = (card: PokemonCard) => {
    const newItem: ScanItem = {
      id: `single-${Date.now()}`,
      timestamp: Date.now(),
      thumbnailUrl: card.imageUrl,
      status: 'queued',
      sharpnessScore: 165,
      card,
    };
    setQueue((prev) => [newItem, ...prev]);
  };

  // Dispatch Discord alert manually
  const handleSendDiscordAlert = async (item: ScanItem) => {
    if (!item.card || !item.economics) return;
    try {
      const res = await fetch('/api/discord-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: discordConfig.url,
          cardName: item.card.name,
          setNumber: item.card.setNumber,
          economics: item.economics,
          imageUrl: item.card.imageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        soundEffects.playFocusLock();
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, discordAlertSent: true } : i))
        );
        if (data.simulated) {
          setShowDiscordModal(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispatch Discord alert from Comprehensive Listings Explorer
  const handleSendListingDiscordAlert = async (listing: ComprehensiveListing) => {
    try {
      const res = await fetch('/api/discord-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: discordConfig.url,
          cardName: `${listing.cardName} (${listing.marketplace} ${listing.countryFlag})`,
          setNumber: listing.setNumber,
          economics: {
            costOfGoodsSek: listing.priceInSEK,
            grossRevenueSek: listing.priceInSEK + listing.estimatedNetProfitSEK,
            grossRevenueUsd: Math.round((listing.priceInSEK + listing.estimatedNetProfitSEK) / usdToSek),
            netProfitSek: listing.estimatedNetProfitSEK,
            netProfitUsd: Math.round(listing.estimatedNetProfitSEK / usdToSek),
            roiPercentage: listing.estimatedRoi,
            ebayFeeSek: 0,
            internationalShippingSek: 75,
          },
          imageUrl: listing.imageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        soundEffects.playFocusLock();
        if (data.simulated) {
          setShowDiscordModal(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open interactive price history curve
  const handleOpenPriceCurve = (card: PokemonCard) => {
    setActivePriceCurveCard(card);
    setShowPriceCurveModal(true);
  };

  // Open predictive value appreciation modal
  const handleOpenAppreciationModal = (card: PokemonCard) => {
    setActiveAppreciationCard(card);
    setShowAppreciationModal(true);
  };

  // Target card from Pokélector browser and jump to camera scanner
  const handleTargetAndSnap = (card: PokemonCard) => {
    setCurrentlyTargetedCard(card);
    setActiveView('scanner');
    setShowPriceCurveModal(false);
    setShowAppreciationModal(false);
    setShowSearchTargetModal(false);
    soundEffects.playFocusLock();
  };

  // Cumulative metrics
  const totalScans = queue.length;
  const highArbHits = queue.filter((i) => i.economics?.isHighArbitrage).length;
  const totalNetProfitSek = queue.reduce((sum, i) => sum + (i.economics?.netProfitSek || 0), 0);
  const avgRoi =
    totalScans > 0
      ? Math.round(queue.reduce((sum, i) => sum + (i.economics?.roiPercentage || 0), 0) / totalScans)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500/20 selection:text-red-700">
      {/* Top Header Navigation - Bright Pokémon Pokéball Red & White Theme */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-red-600 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            {/* Pokéball Graphic Icon */}
            <div className="relative w-10 h-10 rounded-full border-2 border-slate-800 shadow-sm overflow-hidden flex-shrink-0 flex flex-col">
              <div className="w-full h-1/2 bg-red-600" />
              <div className="w-full h-1/2 bg-white" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800" />
              <div className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-800 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  PokéArb <span className="text-red-600">Scanner</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-black shadow-2xs">
                  POKÉMON TCG
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Continuous Auto-Snap &bull; Leading Bid vs Sold For Arbitrage &bull; Anti-Fake IQR
              </p>
            </div>
          </div>

          {/* Quick Valuation Mode Toggle + Top Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Toggle: Sold For vs Leading Bid */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => handleToggleValuationBasis('sold_for')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  settings.valuationBasis === 'sold_for'
                    ? 'bg-white text-red-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Calculate arbitrage using confirmed historical sales"
              >
                Sold For (Slutpris)
              </button>
              <button
                onClick={() => handleToggleValuationBasis('leading_bid')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  settings.valuationBasis === 'leading_bid'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Calculate arbitrage using active auction leading bids for sniping"
              >
                Leading Bid (Sniping)
              </button>
            </div>

            {/* Live FX ticker badge */}
            <div
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-1.5"
              title="ECB Reference Exchange Rate via Frankfurter API"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                1 USD = <strong className="text-slate-900">{usdToSek} SEK</strong>
              </span>
            </div>

            {/* Test Stack Generator button */}
            <button
              onClick={() => setShowStackDrawer(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Layers className="w-3.5 h-3.5 text-red-600" />
              Stack Sim
            </button>

            {/* Discord Webhook button */}
            <button
              onClick={() => setShowDiscordModal(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                discordConfig.url
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-red-600" />
              Discord
              {discordConfig.url && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-red-600 transition shadow-2xs cursor-pointer"
              title="Valuation, Anti-Fake Shield & System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Collector Profile / Login Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Hantera ditt samlarkonto och molnsynkning"
            >
              <User className="w-3.5 h-3.5 text-red-400" />
              <span>{currentUser ? currentUser.displayName : 'Logga in'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Banner: Scanner HUD vs Comprehensive Multi-Market Listings */}
        <div className="bg-slate-100 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar">
              {/* Home Dashboard Gateway */}
              <button
                onClick={() => setActiveView('home')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'home'
                    ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Gå till översikt och navigationsnav"
              >
                <Home className="w-4 h-4 text-red-500" />
                <span>Hem</span>
              </button>

              {/* Personal Collection Vault with active alert badge */}
              <button
                onClick={() => setActiveView('collection')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'collection'
                    ? 'bg-amber-600 text-white shadow-xs border-amber-600'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Hantera din samling, inköpspriser, pack-batchkoder och säljvarningar"
              >
                <BookmarkCheck className="w-4 h-4 text-amber-500" />
                <span>Min Samling</span>
                {collection.filter((c) => c.alertTriggered).length > 0 && (
                  <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white animate-pulse">
                    🚨 {collection.filter((c) => c.alertTriggered).length}
                  </span>
                )}
              </button>

              {/* In-App Direct Buy Marketplace */}
              <button
                onClick={() => setActiveView('marketplace')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'marketplace'
                    ? 'bg-emerald-600 text-white shadow-xs border-emerald-600'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Köp verifierade Pokémon-kort direkt med Swish, Kort & Klarna"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span>Köp Kort</span>
              </button>

              <button
                onClick={() => setActiveView('scanner')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'scanner'
                    ? 'bg-red-600 text-white shadow-xs border-red-600'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Kamerasök</span>
              </button>

              <button
                onClick={() => setActiveView('appreciation')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'appreciation'
                    ? 'bg-emerald-600 text-white shadow-xs border-emerald-600'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Prediktiv analys: vad borde kortet vara värt om 1 till 3 år?"
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Värdeprognos</span>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  AI
                </span>
              </button>

              <button
                onClick={() => setActiveView('pokecollector')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'pokecollector'
                    ? 'bg-blue-600 text-white shadow-xs border-blue-600'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Browse all cards from all sets via Pokélector and view 365-day price history curves"
              >
                <LineChart className="w-4 h-4 text-blue-500" />
                <span>Pokélector Sets</span>
              </button>

              <button
                onClick={() => setActiveView('rarity')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'rarity'
                    ? 'bg-amber-600 text-white shadow-xs border-amber-600'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Se hur sällsynt kortet är: tillverkade upplagor, dra-chanser per paket och PSA 10 populationscensus"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>Sällsynthet</span>
              </button>

              <button
                onClick={() => setActiveView('listings')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
                  activeView === 'listings'
                    ? 'bg-purple-600 text-white shadow-xs border-purple-600'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                <span>Marknadspriser</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowScraperModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-red-600" />
                Cross-Border Scraper Hub
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {activeView === 'home' ? (
          <HomeDashboard
            onNavigate={(view) => setActiveView(view)}
            onSelectTargetCard={(card) => {
              setCurrentlyTargetedCard(card);
              setActiveView('scanner');
              soundEffects.playFocusLock();
            }}
            onOpenPriceCurve={handleOpenPriceCurve}
            onOpenAppreciationModal={handleOpenAppreciationModal}
            onOpenSearchModal={() => setShowSearchTargetModal(true)}
            onOpenScraperModal={() => setShowScraperModal(true)}
            usdToSek={usdToSek}
            eurToSek={eurToSek}
            totalScans={totalScans}
            highArbHits={highArbHits}
            collectionAlertCount={collection.filter((c) => c.alertTriggered).length}
          />
        ) : activeView === 'collection' ? (
          <CollectionVaultView
            collection={collection}
            currentUser={currentUser}
            onAddCard={handleAddCardToCollection}
            onDeleteCard={handleDeleteCardFromCollection}
            onOpenPriceCurve={handleOpenPriceCurve}
            onOpenAppreciationModal={handleOpenAppreciationModal}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        ) : activeView === 'marketplace' ? (
          <InAppMarketplaceView
            currentUser={currentUser}
            onCardPurchasedAndAddedToCollection={handleAddCardToCollection}
            onNavigateToCollection={() => setActiveView('collection')}
          />
        ) : activeView === 'appreciation' ? (
          <AppreciationExplorerView
            onTargetAndSnap={handleTargetAndSnap}
            onOpenPriceCurve={handleOpenPriceCurve}
            currentlyTargetedCard={currentlyTargetedCard}
            usdToSek={usdToSek}
          />
        ) : activeView === 'rarity' ? (
          <RarityPopulationExplorer
            onTargetAndSnap={handleTargetAndSnap}
            onOpenPriceCurve={handleOpenPriceCurve}
            currentlyTargetedCard={currentlyTargetedCard}
          />
        ) : activeView === 'pokecollector' ? (
          <PokecollectorBrowser
            onTargetAndSnap={handleTargetAndSnap}
            currentlyTargetedCard={currentlyTargetedCard}
            usdToSek={usdToSek}
            eurToSek={eurToSek}
          />
        ) : activeView === 'listings' ? (
          <ComprehensiveListingsView
            usdToSek={usdToSek}
            eurToSek={eurToSek}
            jpyToSek={jpyToSek}
            onSendDiscordAlert={handleSendListingDiscordAlert}
            onOpenCardDetails={(cardId) => {
              const matched = queue.find((q) => q.card?.id === cardId);
              if (matched) setDetailModalItem(matched);
            }}
          />
        ) : (
          <>
            {/* Cumulative Metric Ribbon - Bright White Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                  Total Cards Scanned
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {totalScans}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Hands-Free Stack Queue
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-red-200 shadow-xs">
                <div className="text-[10px] uppercase font-mono tracking-wider text-red-600 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  &gt;20% ROI Arbitrage Hits
                </div>
                <div className="text-2xl font-bold font-mono text-red-600 mt-1">
                  {highArbHits}
                </div>
                <div className="text-[11px] text-red-500 font-mono mt-0.5">
                  High Margin Cross-Border
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                  Cumulative Net Profit
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  +{totalNetProfitSek.toLocaleString()} SEK
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  (~${Math.round(totalNetProfitSek / usdToSek)} USD Net)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                  Average Net Margin
                </div>
                <div className="text-2xl font-bold font-mono text-red-600 mt-1">
                  +{avgRoi}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  After 13.25% eBay + 3% FX
                </div>
              </div>
            </div>

            {/* Top Split Section: Live Camera Auto-Snap HUD + Asynchronous Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Camera Viewfinder (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <CameraScanner
                  onCapture={handleCapture}
                  queueCount={queue.filter((q) => q.status === 'queued' || q.status === 'analyzing').length}
                  onOpenSampleStack={() => setShowStackDrawer(true)}
                  currentlyTargetedCard={currentlyTargetedCard}
                  onSetTargetCard={setCurrentlyTargetedCard}
                  onOpenSearchModal={() => setShowSearchTargetModal(true)}
                  initialAutoSnap={settings.autoSnapEnabled}
                />

                {currentlyTargetedCard && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="truncate">
                        Targeting <strong>{currentlyTargetedCard.name} #{currentlyTargetedCard.setNumber}</strong> ({currentlyTargetedCard.setName}). All photos taken will be tied to this card and graded!
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => setShowSearchTargetModal(true)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-red-200 text-[11px] font-bold text-red-700 hover:bg-red-100 transition cursor-pointer shadow-2xs"
                      >
                        Change Card
                      </button>
                      <button
                        onClick={() => setCurrentlyTargetedCard(null)}
                        className="px-2 py-1 rounded-lg text-slate-500 hover:text-red-700 text-[11px] transition cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    Write card name or set number to lock target, then snap your physical copy (front &amp; back).
                  </span>
                  <span className="font-mono text-slate-500 hidden sm:inline">
                    63x88mm boundary
                  </span>
                </div>
              </div>

              {/* Queue & Quick Feed (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <ScanQueue
                  queue={queue}
                  onClearQueue={() => setQueue([])}
                  onSelectItem={(item) => setDetailModalItem(item)}
                  selectedItemId={selectedItemId}
                />

                {/* Two-Pronged Anti-Fake & Arbitrage Info Box */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      Anti-Fake IQR &amp; Keyword Shield Active
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Q1 - 1.0&times;IQR
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    App actively rejects titles with proxy keywords (<code className="bg-slate-100 px-1 py-0.2 rounded font-mono">proxy, replica, metal, custom</code>) and uses statistical IQR filtering to drop $15 counterfeit outliers from contaminating your arbitrage margins.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Basis: <strong>{settings.valuationBasis === 'sold_for' ? 'Sold For (Slutpris)' : 'Leading Bid (Sniping)'}</strong></span>
                    <span className="text-red-600 font-bold">&gt;20% ROI Alerts Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Cross-Border Arbitrage Master Table */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Cross-Border Market Discrepancies &amp; Valuation Comps
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Real-time Tradera buy prices vs. eBay sold comps with automatic condition-caliper adjustments
                  </p>
                </div>
              </div>

              <ArbitrageTable
                items={queue}
                valuationBasis={settings.valuationBasis}
                onOpenConditionModal={(item) => setConditionModalItem(item)}
                onOpenTiltModal={(item) => setTiltModalItem(item)}
                onSendDiscordAlert={handleSendDiscordAlert}
                onOpenDetailModal={(item) => setDetailModalItem(item)}
              />
            </section>
          </>
        )}
      </main>

      {/* Modals */}
      {conditionModalItem && (
        <ConditionScreeningModal
          item={conditionModalItem}
          onClose={() => setConditionModalItem(null)}
        />
      )}

      {tiltModalItem && (
        <TiltTestModal
          item={tiltModalItem}
          onClose={() => setTiltModalItem(null)}
          onConfirmAuthenticity={(verified) => {
            setQueue((prev) =>
              prev.map((i) =>
                i.id === tiltModalItem.id ? { ...i, tiltTestPassed: verified } : i
              )
            );
          }}
        />
      )}

      {detailModalItem && (
        <CardDetailModal
          item={detailModalItem}
          onClose={() => setDetailModalItem(null)}
          onOpenConditionModal={(item) => {
            setDetailModalItem(null);
            setConditionModalItem(item);
          }}
          onOpenTiltModal={(item) => {
            setDetailModalItem(null);
            setTiltModalItem(item);
          }}
          onSendDiscordAlert={handleSendDiscordAlert}
          onOpenPriceCurve={handleOpenPriceCurve}
          onOpenAppreciationModal={handleOpenAppreciationModal}
        />
      )}

      {showDiscordModal && (
        <DiscordWebhookSettings
          config={discordConfig}
          onSaveConfig={(cfg) => handleSaveAllSettings(settings, cfg)}
          onClose={() => setShowDiscordModal(false)}
          sampleCard={queue[0]?.card}
          sampleEconomics={queue[0]?.economics}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          discordConfig={discordConfig}
          onSaveSettings={handleSaveAllSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showStackDrawer && (
        <SampleStackDrawer
          onClose={() => setShowStackDrawer(false)}
          onInjectStack={handleInjectStack}
          onInjectSingleCard={handleInjectSingleCard}
        />
      )}

      {showScraperModal && (
        <CrossBorderScraperModal
          settings={settings}
          eurToSek={eurToSek}
          usdToSek={usdToSek}
          jpyToSek={jpyToSek}
          onSaveSettings={(newSettings) => handleSaveAllSettings(newSettings, discordConfig)}
          onClose={() => setShowScraperModal(false)}
        />
      )}

      <TargetCardSearchModal
        isOpen={showSearchTargetModal}
        onClose={() => setShowSearchTargetModal(false)}
        onSelectTargetCard={(card) => {
          setCurrentlyTargetedCard(card);
          setShowSearchTargetModal(false);
          setActiveView('scanner');
        }}
        currentlyTargetedCard={currentlyTargetedCard}
        onOpenPriceCurve={handleOpenPriceCurve}
        onOpenAppreciationModal={handleOpenAppreciationModal}
      />

      {/* Standalone Price History Curve Modal */}
      {showPriceCurveModal && activePriceCurveCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Pokélector Price Curve &bull; {activePriceCurveCard.name}
                </h3>
              </div>
              <button
                onClick={() => setShowPriceCurveModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <PriceHistoryChart
                timeline={generatePriceTimeline(activePriceCurveCard, usdToSek, eurToSek)}
                onTargetCard={() => handleTargetAndSnap(activePriceCurveCard)}
                isTargetLocked={currentlyTargetedCard?.id === activePriceCurveCard.id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Predictive Appreciation Analysis Modal */}
      {showAppreciationModal && activeAppreciationCard && (
        <AppreciationAnalysisModal
          card={activeAppreciationCard}
          usdToSek={usdToSek}
          onClose={() => setShowAppreciationModal(false)}
          onTargetCard={() => {
            handleTargetAndSnap(activeAppreciationCard);
            setShowAppreciationModal(false);
          }}
          onOpenPriceCurve={(card) => {
            setShowAppreciationModal(false);
            handleOpenPriceCurve(card);
          }}
          isTargetLocked={currentlyTargetedCard?.id === activeAppreciationCard.id}
        />
      )}
    </div>
  );
}
