export interface PokemonCard {
  id: string;
  name: string;
  setNumber: string;
  setName: string;
  series: string;
  releaseYear: number;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Rare Holo' | 'Ultra Rare' | 'Secret Rare' | 'Illustration Rare' | 'Special Illustration Rare';
  foilType: 'None' | 'Holo' | 'Reverse Holo' | 'Textured Ultra' | 'Cosmos Holo' | 'Rainbow Rare';
  imageUrl: string;
  typicalTraderaSoldSEK: number;       // Confirmed closed historical sales (Slutpris)
  typicalTraderaLeadingBidSEK: number;  // Current active leading auction bid (e.g. sniping opportunity)
  typicalTraderaBidsCount: number;      // e.g. 12 bids
  typicalTraderaTimeLeft: string;       // e.g. "2h 45m"
  typicalEbayUSD: number;               // Confirmed eBay sold price (USD)
  typicalEbayActiveUSD: number;         // eBay active lowest buy-it-now or leading bid
  typicalCardmarketEUR?: number;        // Cardmarket Price Trend (EUR)
  typicalCardmarketLowEUR?: number;     // Cardmarket Lowest "From" (EUR)
  typicalTcgplayerUSD?: number;         // TCGPlayer Market Price (USD)
  typicalMercariJPY?: number;           // Mercari Japan Buyee price (JPY)
  typicalBlocketSEK?: number;           // Blocket local listing price (SEK)
  cardmarketSlug?: string;              // e.g. "Base-Set/Charizard"
  isHighValue: boolean;                 // > 1000 SEK / $100 -> requires tilt test
  proxyRiskNotes?: string;              // Specific counterfeit warnings
  rarityData?: CardRarityData;          // Pull rates, PSA population & rarity score
}

export interface CardRarityData {
  rarityTier: 'Holy Grail' | 'Ultra Chase' | 'Secret Rare' | 'Illustration Rare' | 'Ultra Rare' | 'Holo Rare' | 'Common/Uncommon';
  scarcityScore: number;               // 1 to 100 relative scarcity
  pullRatePacks: number;               // e.g. 1664 (1 in 1664 packs)
  pullRateDisplay: string;             // e.g. "1 av 1 664 paket (~46 boosterboxar)"
  pullProbabilityPercent: number;      // e.g. 0.06%
  psaTotalGraded: number;              // Total cards graded across PSA registry
  psa10Count: number;                  // PSA 10 Gem Mint pop
  psa9Count: number;                   // PSA 9 Mint pop
  psa10GemRatePercent: number;         // Gem Mint success rate e.g. 77% or 0.9% for vintage
  estimatedTotalPrinted?: string;      // Estimated circulation context
  printClassification: string;         // e.g. "Secret Rare (215/203 - Beyond Official Set Number)"
}

export interface SetRarityStats {
  setId: string;
  setName: string;
  totalCardsPrinted: number;           // e.g. 237 cards
  standardCardsCount: number;          // e.g. 203
  secretRaresCount: number;            // e.g. 34 beyond set number
  averagePacksPerUltraRare: number;    // e.g. 6 packs
  averagePacksPerSecretRare: number;   // e.g. 72 packs
  averagePacksPerGrail: number;        // e.g. 1664 packs
  printVolumeTier: 'Mass Print (Modern)' | 'Limited Print Run' | 'Vintage WotC Scarcity (1999-2003)' | 'Japanese Specialty';
}

export interface CenteringScore {
  leftRightRatio: [number, number]; // e.g. [52, 48]
  topBottomRatio: [number, number];  // e.g. [51, 49]
  frontCenteringGrade: 'PSA 10 (<= 55/45)' | 'PSA 9 (<= 60/40)' | 'PSA 8 (<= 65/35)' | 'Raw NM/Off-Center';
}

export interface ConditionEvaluation {
  centering: CenteringScore;
  cornerWhitening: 'None (Pristine)' | 'Slight (NM)' | 'Moderate (LP)' | 'Heavy (MP/HP)';
  edgeWear: 'Clean' | 'Minor Silvering' | 'Chipped' | 'Rough';
  surfaceQuality: 'Flawless Foil' | 'Micro Scratches' | 'Print Line' | 'Cloudy Holo';
  estimatedGrade: 'PSA 10 Contender' | 'PSA 9 Mint' | 'Raw NM' | 'Raw LP' | 'Raw MP';
}

export interface ArbitrageEconomics {
  midMarketFxRate: number;      // 1 USD to SEK (e.g. 9.94)
  effectiveFxRate: number;      // after spread
  valuationBasis: 'sold_for' | 'leading_bid';
  costOfGoodsSek: number;       // Tradera buy price in SEK (Sold For or Leading Bid)
  grossRevenueUsd: number;      // eBay sold price in USD
  grossRevenueSek: number;      // eBay sold in SEK at mid-market
  ebayFeeUsd: number;           // eBay fee
  ebayFeeSek: number;
  fxSpreadSek: number;          // hidden conversion loss
  internationalShippingUsd: number; // e.g. $15
  internationalShippingSek: number;
  totalFeesSek: number;
  netRevenueUsd: number;
  netRevenueSek: number;
  netProfitSek: number;
  netProfitUsd: number;
  roiPercentage: number;
  isProfitable: boolean;
  isHighArbitrage: boolean;     // ROI >= threshold
}

export type MarketplaceCode = 'cardmarket' | 'tcgplayer' | 'tradera' | 'ebay' | 'mercari_jp' | 'blocket';
export type ListingStatus = 'sold' | 'active_auction' | 'buy_it_now' | 'classified_lot';

export interface ComprehensiveListing {
  id: string;
  cardId: string;
  cardName: string;
  setNumber: string;
  setName: string;
  imageUrl: string;
  marketplace: 'Cardmarket' | 'TCGPlayer' | 'Tradera' | 'eBay' | 'Mercari Japan' | 'Blocket';
  marketplaceCode: MarketplaceCode;
  countryFlag: '🇪🇺' | '🇺🇸' | '🇸🇪' | '🇯🇵';
  status: ListingStatus;
  title: string;
  condition: 'Raw NM' | 'Raw LP' | 'Raw MP' | 'PSA 10' | 'PSA 9' | 'PSA 8' | 'BGS 9.5' | 'CGC 10';
  isGraded: boolean;
  gradingCompany?: 'PSA' | 'BGS' | 'CGC' | 'None';
  nativeCurrency: 'EUR' | 'USD' | 'SEK' | 'JPY';
  nativePrice: number;
  priceInSEK: number;
  dateOrTimeLeft: string;
  isSold: boolean;
  bidsCount?: number;
  sellerRating?: string;
  customsNote: string;
  importMomsSEK?: number;
  postNordFeeSEK?: number;
  estimatedNetProfitSEK: number;
  estimatedRoi: number;
  isArbitrageOpportunity: boolean;
  sourceUrl: string;
  iqrClean: boolean;
  bestExitMarketplace?: string;
}

export interface CardmarketScrapedData {
  url: string;
  cardTitle: string;
  expansion: string;
  priceTrendEUR: number;
  lowestPriceEUR: number;
  avg30DaysEUR: number;
  availableItems: number;
  priceTrendSEK: number;
  lowestPriceSEK: number;
  timestamp: string;
  source: 'direct-stealth-scraper' | 'vps-microservice' | 'cloud-simulation';
}

export interface MarketComp {
  id: string;
  source: 'eBay Sold' | 'Tradera Closed' | 'Tradera Active' | 'eBay Active' | 'Cardmarket Trend' | 'Cardmarket Low' | 'TCGPlayer Market' | 'Mercari Japan Buyee';
  title: string;
  date: string;
  priceUSD?: number;
  priceEUR?: number;
  priceJPY?: number;
  priceSEK: number;
  condition: string;
  isLeadingBid?: boolean;
  bidCount?: number;
  timeLeft?: string;
  wasBestOffer?: boolean;
  marketplace?: string;
}

export interface ScanItem {
  id: string;
  timestamp: number;
  thumbnailUrl: string;
  status: 'queued' | 'analyzing' | 'completed' | 'flagged';
  sharpnessScore: number;       // Laplacian variance
  card?: PokemonCard;
  condition?: ConditionEvaluation;
  economics?: ArbitrageEconomics;
  comps?: MarketComp[];
  tiltTestPassed?: boolean;
  notes?: string;
  discordAlertSent?: boolean;
  backThumbnailUrl?: string;
  photoSide?: 'front' | 'back';
  isTargetedSetCard?: boolean;
  filterTelemetry?: {
    rejectedKeywords: number;
    rejectedOutliers: number;
    rawCompsCount: number;
    gradedCompsCount: number;
  };
}

export interface DiscordWebhookConfig {
  url: string;
  enabled: boolean;
  minRoiThreshold: number; // default 20%
  autoSend: boolean;
}

export interface AppSettings {
  valuationBasis: 'sold_for' | 'leading_bid';
  targetSlabType: 'raw' | 'psa10' | 'psa9';
  iqrMultiplier: number;
  proxyKeywords: string[];
  ebayFeeRate: number;
  cardmarketFeeRate: number;
  fxSpreadPercent: number;
  intShippingUsd: number;
  minRoiThreshold: number;
  autoSnapEnabled: boolean;
  blurThreshold: number;
  soundEnabled: boolean;
  // Cross-Border & Scraper settings
  eurToSek: number;
  jpyToSek: number;
  scraperMicroserviceUrl: string;
  scraperMode: 'vps_proxy' | 'cloud_simulation';
  includeSwedishMoms: boolean;
}

export interface PokecollectorSet {
  id: string;
  name: string;
  series: 'Scarlet & Violet' | 'Sword & Shield' | 'Sun & Moon' | 'XY & Vintage' | 'Japanese Sets';
  releaseDate: string;
  releaseYear: number;
  totalCards: number;
  iconSymbol?: string;
  logoUrl?: string;
  pokecollectorSlug: string;
  cardsCount: number;
  featuredCards: PokemonCard[];
}

export interface PriceHistoryPoint {
  date: string;
  timestamp: number;
  priceSek: number;
  priceUsd: number;
  priceEur: number;
  psa10Sek: number;
  psa9Sek: number;
  volume: number;
  note?: string;
}

export interface CompletedSaleRecord {
  id: string;
  date: string;
  platform: 'Tradera' | 'eBay' | 'Cardmarket';
  priceSek: number;
  priceNative: number;
  nativeCurrency: 'SEK' | 'USD' | 'EUR';
  condition: 'PSA 10' | 'PSA 9' | 'Raw NM' | 'Raw LP';
  title: string;
  bidsCount?: number;
  seller: string;
  url: string;
}

export interface CardPriceTimeline {
  cardId: string;
  cardName: string;
  setNumber: string;
  setName: string;
  imageUrl: string;
  currentPriceSek: number;
  currentPriceUsd: number;
  currentPriceEur: number;
  change30dPct: number;
  change90dPct: number;
  change1yPct: number;
  allTimeHighSek: number;
  allTimeHighDate: string;
  allTimeLowSek: number;
  allTimeLowDate: string;
  averageWeeklyVolume: number;
  history: PriceHistoryPoint[];
  latestSales: CompletedSaleRecord[];
}

export interface HistoricalCohortMatch {
  cohortId: string;
  cohortName: string;
  referenceCardName: string;
  referenceSet: string;
  historicalReleaseYear: number;
  initialPriceSek: number;
  priceAfter12mSek: number;
  priceAfter36mSek: number;
  historical12mGrowthPct: number;
  historical36mGrowthPct: number;
  correlationRationale: string;
}

export interface TrajectoryProjectionPoint {
  monthOffset: number;
  label: string;
  projectedPriceSek: number;
  projectedPsa10Sek: number;
  lowerBandSek: number;
  upperBandSek: number;
}

export interface CardAppreciationForecast {
  cardId: string;
  cardName: string;
  setNumber: string;
  setName: string;
  imageUrl: string;
  currentPriceSek: number;
  currentPriceUsd: number;
  currentPriceEur: number;
  forecast12m: {
    bearSek: number;
    baseSek: number;
    bullSek: number;
    expectedGrowthPct: number;
  };
  forecast36m: {
    bearSek: number;
    baseSek: number;
    bullSek: number;
    expectedGrowthPct: number;
  };
  psa10Multiplier: number;
  psa10Projected36mSek: number;
  confidenceScore: number;
  riskRating: 'Låg Risk (Stabil)' | 'Medel Risk (Modern Chase)' | 'Hög Volatilitet (Spekulativ)';
  outOfPrintStatus: 'Aktivt i tryck' | 'Nära Out-of-Print' | 'Out-of-Print (OOP)' | 'Vintage Classic (1999-2003)';
  outOfPrintSurgeEstimatedPct: number;
  cohortComparison: HistoricalCohortMatch;
  growthCatalysts: string[];
  trajectoryPoints: TrajectoryProjectionPoint[];
}

export interface CollectionCardItem {
  id: string;
  userId: string;
  cardId: string;
  cardName: string;
  setNumber: string;
  setName: string;
  imageUrl: string;
  acquisitionType: 'purchase' | 'pack_pull';
  purchasePriceSek: number;
  packCostSek?: number;
  packBatchCode?: string; // e.g. "F23-09A", "E22-B12"
  targetProfitPercentage: number; // e.g. 25, 50, 100
  targetSellPriceSek: number;
  currentMarketPriceSek: number;
  currentProfitPercentage: number;
  alertTriggered: boolean;
  condition: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectorProfile {
  uid: string;
  email: string;
  displayName: string;
  isAnonymous?: boolean;
}

export type ListingPlatform = 'tradera' | 'ebay' | 'cardmarket' | 'blocket';

export interface GeneratedListing {
  id: string;
  platform: ListingPlatform;
  title: string;
  priceSek: number;
  priceLocalCurrency?: string;
  startingBidSek?: number;
  shippingDetails: string;
  description: string;
  conditionGrade: string;
  categoryPath: string;
  directUrl?: string;
}

export interface MarketplaceCardForSale {
  id: string;
  cardId: string;
  name: string;
  setNumber: string;
  setName: string;
  imageUrl: string;
  priceSek: number;
  marketPriceSek: number;
  savingsPct: number;
  condition: string;
  sellerName: string;
  sellerRating: number;
  sellerCity: string;
  verifiedAuthenticity: boolean;
  shippingFeeSek: number;
  isRare: boolean;
  batchCodeOrigin?: string;
}

export interface AppOrderRecord {
  id: string;
  buyerId: string;
  buyerEmail: string;
  cardId: string;
  cardName: string;
  cardImageUrl: string;
  priceSek: number;
  shippingSek: number;
  totalAmountSek: number;
  paymentMethod: 'swish' | 'card' | 'klarna';
  status: 'completed' | 'pending' | 'shipped';
  shippingAddress: {
    fullName: string;
    streetAddress: string;
    postalCode: string;
    city: string;
    phone: string;
  };
  createdAt: string;
}

