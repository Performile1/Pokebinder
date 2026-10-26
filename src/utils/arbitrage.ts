import { ArbitrageEconomics, MarketComp } from '../types';
import { RawSaleListing, sanitizePricingListings, DEFAULT_PROXY_KEYWORDS } from './filterProxy';

export const EBAY_FEE_RATE = 0.1325; // 13.25% eBay Trading Cards final value fee
export const FX_SPREAD = 0.03;       // 3% hidden conversion fee (PayPal/bank spread)
export const INT_SHIPPING_USD = 15;  // Baseline tracked international shipping ($15 USD)
export const DEFAULT_USD_TO_SEK = 9.94; // Frankfurter ECB reference rate

export function calculateArbitrageEconomics(
  traderaPriceSek: number,
  ebayPriceUsd: number,
  usdToSek: number = DEFAULT_USD_TO_SEK,
  valuationBasis: 'sold_for' | 'leading_bid' = 'sold_for',
  ebayFeeRate: number = EBAY_FEE_RATE,
  fxSpread: number = FX_SPREAD,
  intShippingUsd: number = INT_SHIPPING_USD
): ArbitrageEconomics {
  const midMarketFxRate = usdToSek > 0 ? usdToSek : DEFAULT_USD_TO_SEK;
  
  // 1. Calculate eBay Revenue in USD
  const ebayFeeUsd = ebayPriceUsd * ebayFeeRate;
  const netRevenueUsd = ebayPriceUsd - ebayFeeUsd - intShippingUsd;

  // 2. Normalize to SEK using the Effective FX Rate
  const effectiveFxRate = midMarketFxRate * (1 - fxSpread);
  const netRevenueSek = netRevenueUsd * effectiveFxRate;

  // 3. Calculate Final Arbitrage Margin
  const netProfitSek = Math.round(netRevenueSek - traderaPriceSek);
  const netProfitUsd = Number((netProfitSek / midMarketFxRate).toFixed(2));
  const roiPercentage = traderaPriceSek > 0
    ? Number(((netProfitSek / traderaPriceSek) * 100).toFixed(2))
    : 0;

  const grossRevenueSek = Math.round(ebayPriceUsd * midMarketFxRate);
  const ebayFeeSek = Math.round(ebayFeeUsd * midMarketFxRate);
  const fxSpreadSek = Math.round(ebayPriceUsd * midMarketFxRate * fxSpread);
  const internationalShippingSek = Math.round(intShippingUsd * midMarketFxRate);
  const totalFeesSek = ebayFeeSek + fxSpreadSek + internationalShippingSek;

  return {
    midMarketFxRate: Number(midMarketFxRate.toFixed(2)),
    effectiveFxRate: Number(effectiveFxRate.toFixed(2)),
    valuationBasis,
    costOfGoodsSek: Math.round(traderaPriceSek),
    grossRevenueUsd: Number(ebayPriceUsd.toFixed(2)),
    grossRevenueSek,
    ebayFeeUsd: Number(ebayFeeUsd.toFixed(2)),
    ebayFeeSek,
    fxSpreadSek,
    internationalShippingUsd: intShippingUsd,
    internationalShippingSek,
    totalFeesSek,
    netRevenueUsd: Number(netRevenueUsd.toFixed(2)),
    netRevenueSek: Math.round(netRevenueSek),
    netProfitSek,
    netProfitUsd,
    roiPercentage,
    isProfitable: netProfitSek > 0,
    isHighArbitrage: roiPercentage >= 20,
  };
}

export function generateRealisticComps(
  cardName: string,
  setNumber: string,
  typicalEbayUSD: number,
  typicalTraderaSoldSEK: number,
  typicalTraderaLeadingBidSEK: number = Math.round(typicalTraderaSoldSEK * 0.65),
  usdToSek: number = DEFAULT_USD_TO_SEK
): { comps: MarketComp[]; filterTelemetry: { rejectedKeywords: number; rejectedOutliers: number; rawCompsCount: number; gradedCompsCount: number } } {
  // Raw pool containing confirmed sales, active leading bids, and a proxy decoy to demonstrate filtering!
  const rawListingsPool: RawSaleListing[] = [
    // Legitimate Raw eBay Sold
    {
      id: 'ebay-sold-1',
      source: 'eBay Sold',
      title: `Pokemon ${cardName} ${setNumber} Raw NM - Clean Holo`,
      price: Math.round(typicalEbayUSD * 1.02),
      currency: 'USD',
      normalizedSEK: Math.round(typicalEbayUSD * 1.02 * usdToSek),
      date: 'Yesterday',
      isLeadingBid: false,
    },
    {
      id: 'ebay-sold-2',
      source: 'eBay Sold',
      title: `Pokemon ${cardName} ${setNumber} Ungraded Light Play`,
      price: Math.round(typicalEbayUSD * 0.94),
      currency: 'USD',
      normalizedSEK: Math.round(typicalEbayUSD * 0.94 * usdToSek),
      date: '3 days ago',
      wasBestOffer: true,
      isLeadingBid: false,
    },
    // Legitimate Tradera Sold (Slutpris)
    {
      id: 'tradera-sold-1',
      source: 'Tradera Closed',
      title: `${cardName} ${setNumber} Pokémon Kort Slutpris Äkta Samlarskick`,
      price: Math.round(typicalTraderaSoldSEK * 1.03),
      currency: 'SEK',
      normalizedSEK: Math.round(typicalTraderaSoldSEK * 1.03),
      date: '2 days ago',
      isLeadingBid: false,
    },
    // Tradera Active Auction with Leading Bid
    {
      id: 'tradera-active-1',
      source: 'Tradera Active',
      title: `${cardName} ${setNumber} Pokémon Kort Auktion - Ledande Bud`,
      price: Math.round(typicalTraderaLeadingBidSEK),
      currency: 'SEK',
      normalizedSEK: Math.round(typicalTraderaLeadingBidSEK),
      date: 'Ending in 3h 40m',
      isLeadingBid: true,
      bidCount: 14,
      timeLeft: '3h 40m',
    },
    // Graded PSA 10 Slab (To test Graded separator)
    {
      id: 'ebay-graded-psa10',
      source: 'eBay Sold',
      title: `Pokemon ${cardName} ${setNumber} PSA 10 Gem Mint Slab`,
      price: Math.round(typicalEbayUSD * 5.8),
      currency: 'USD',
      normalizedSEK: Math.round(typicalEbayUSD * 5.8 * usdToSek),
      date: '4 days ago',
      isLeadingBid: false,
    },
    // Fake Proxy Decoy (To test Keyword and IQR outlier filter)
    {
      id: 'fake-proxy-decoy',
      source: 'eBay Sold',
      title: `Pokemon ${cardName} ${setNumber} Custom Metal Gold Proxy Replica`,
      price: 18, // $18 fake proxy
      currency: 'USD',
      normalizedSEK: Math.round(18 * usdToSek),
      date: '1 week ago',
      isLeadingBid: false,
    },
    // Outlier low fake on Tradera
    {
      id: 'fake-tradera-decoy',
      source: 'Tradera Closed',
      title: `${cardName} ${setNumber} Orica Flash Print Kort`,
      price: 95, // 95 SEK fake
      currency: 'SEK',
      normalizedSEK: 95,
      date: '5 days ago',
      isLeadingBid: false,
    }
  ];

  // Run through two-pronged sanitizer (Keyword blacklist + IQR math filter)
  const report = sanitizePricingListings(rawListingsPool, {
    targetType: 'raw',
    proxyKeywords: DEFAULT_PROXY_KEYWORDS,
    iqrMultiplier: 1.0,
  });

  const finalComps: MarketComp[] = report.sanitizedListings.map(item => ({
    id: item.id,
    source: item.source,
    title: item.title,
    date: item.date,
    priceUSD: item.currency === 'USD' ? item.price : undefined,
    priceSEK: item.currency === 'SEK' ? item.price : item.normalizedSEK,
    condition: item.isLeadingBid ? 'Active Leading Bid' : 'Raw NM Sold For',
    isLeadingBid: item.isLeadingBid,
    bidCount: item.bidCount,
    timeLeft: item.timeLeft,
    wasBestOffer: item.wasBestOffer,
  }));

  return {
    comps: finalComps,
    filterTelemetry: {
      rejectedKeywords: report.rejectedKeywords,
      rejectedOutliers: report.rejectedOutliers,
      rawCompsCount: report.rawListingsCount,
      gradedCompsCount: report.gradedListingsCount,
    }
  };
}
