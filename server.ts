import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { searchPokemonCards, POKEMON_CARD_DATABASE } from './src/data/pokemonCards.js';
import { POKECOLLECTOR_SETS, generatePriceTimeline } from './src/data/pokecollectorCatalog.js';
import type { PokemonCard } from './src/types.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Cached FX rates (Frankfurter ECB API)
interface MultiFxRates {
  usdToSek: number;
  eurToSek: number;
  jpyToSek: number;
  lastUpdated: string;
}

let cachedRates: MultiFxRates = {
  usdToSek: 9.94,
  eurToSek: 11.13,
  jpyToSek: 0.0634,
  lastUpdated: new Date().toISOString(),
};
let lastFxFetch = 0;

async function getLiveFxRates(): Promise<MultiFxRates> {
  const now = Date.now();
  if (now - lastFxFetch < 30 * 60 * 1000) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=SEK,USD,JPY', {
      redirect: 'follow',
    });
    if (res.ok) {
      const data = await res.json() as { rates: { SEK: number; USD: number; JPY: number } };
      if (data?.rates?.SEK && data?.rates?.USD && data?.rates?.JPY) {
        const eurToSek = Number(data.rates.SEK.toFixed(4));
        const usdToSek = Number((data.rates.SEK / data.rates.USD).toFixed(4));
        const jpyToSek = Number((data.rates.SEK / data.rates.JPY).toFixed(5));
        cachedRates = {
          usdToSek,
          eurToSek,
          jpyToSek,
          lastUpdated: new Date().toISOString(),
        };
        lastFxFetch = now;
      }
    }
  } catch (err) {
    console.warn('Could not fetch Frankfurter multi-FX rates, using fallbacks:', err);
  }
  return cachedRates;
}

// 1. Multi-Currency FX Endpoint (EUR, USD, JPY to SEK)
app.get('/api/fx', async (req: Request, res: Response) => {
  const rates = await getLiveFxRates();
  const FX_SPREAD = 0.03;
  res.json({
    baseCurrencies: {
      USD: rates.usdToSek,
      EUR: rates.eurToSek,
      JPY: rates.jpyToSek,
    },
    target: 'SEK',
    effectiveUsdToSek: Number((rates.usdToSek * (1 - FX_SPREAD)).toFixed(4)),
    effectiveEurToSek: Number((rates.eurToSek * (1 - FX_SPREAD)).toFixed(4)),
    effectiveJpyToSek: Number((rates.jpyToSek * (1 + FX_SPREAD)).toFixed(5)),
    spreadPercent: 3,
    timestamp: rates.lastUpdated,
  });
});

// 1b. Cardmarket Stealth Scraper & VPS Proxy Endpoint
app.post('/api/scraper/cardmarket', async (req: Request, res: Response) => {
  try {
    const { cardUrl, remoteVpsUrl, cardSlug } = req.body;
    const rates = await getLiveFxRates();

    if (remoteVpsUrl && remoteVpsUrl !== process.env.SCRAPER_SERVICE_URL) {
      return res.status(400).json({ error: 'Scraper URL must match the server-configured SCRAPER_SERVICE_URL.' });
    }
    // If the user configured a remote Hetzner VPS microservice URL, proxy the request to it
    if (remoteVpsUrl && (remoteVpsUrl.startsWith('http://') || remoteVpsUrl.startsWith('https://'))) {
      try {
        const vpsResp = await fetch(`${remoteVpsUrl.replace(/\/$/, '')}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'error',
          body: JSON.stringify({ cardUrl }),
          signal: AbortSignal.timeout(12000),
        });

        if (vpsResp.ok) {
          const vpsData = await vpsResp.json();
          const trendEur = vpsData.pricingData?.trendPrice || 0;
          const lowEur = vpsData.pricingData?.lowestPrice || 0;
          return res.json({
            source: 'hetzner-vps-microservice',
            url: cardUrl,
            currency: 'EUR',
            priceTrendEUR: trendEur,
            lowestPriceEUR: lowEur,
            priceTrendSEK: Math.round(trendEur * rates.eurToSek),
            lowestPriceSEK: Math.round(lowEur * rates.eurToSek),
            customsPolicy: '0% EU Customs (Fri rörlighet)',
            raw: vpsData,
          });
        }
      } catch (vpsErr) {
        console.warn('Remote VPS call timed out or failed, falling back to stealth simulator:', vpsErr);
      }
    }

    // High-fidelity fallback / simulated data parser for Cardmarket URLs
    const effectiveSlug = cardSlug || (cardUrl ? cardUrl.split('Singles/')[1] || 'Base-Set/Charizard' : 'Base-Set/Charizard');

    const knownSlugs: Record<string, { trend: number; low: number; avg30: number; available: number; name: string }> = {
      'Base-Set/Charizard': { trend: 285.0, low: 240.0, avg30: 279.0, available: 68, name: 'Charizard (Base Set Holo 4/102)' },
      'Evolving-Skies/Umbreon-VMAX-V2': { trend: 790.0, low: 710.0, avg30: 765.0, available: 24, name: 'Umbreon VMAX Alt Art (Evolving Skies 215/203)' },
      'Base-Set/Blastoise': { trend: 110.0, low: 92.0, avg30: 108.0, available: 85, name: 'Blastoise (Base Set Holo 2/102)' },
      'Base-Set/Venusaur': { trend: 90.0, low: 75.0, avg30: 88.0, available: 92, name: 'Venusaur (Base Set Holo 15/102)' },
      '151/Charizard-ex-V2': { trend: 148.0, low: 132.0, avg30: 145.0, available: 140, name: 'Charizard ex SIR (Pokémon 151 199/165)' },
      'Fusion-Strike/Gengar-VMAX-V2': { trend: 295.0, low: 260.0, avg30: 290.0, available: 31, name: 'Gengar VMAX Alt Art (Fusion Strike 271/264)' },
      'Neo-Genesis/Lugia': { trend: 245.0, low: 210.0, avg30: 240.0, available: 42, name: 'Lugia (Neo Genesis 9/111)' },
      'Lost-Origin/Giratina-V-V2': { trend: 340.0, low: 305.0, avg30: 335.0, available: 29, name: 'Giratina V Alt Art (Lost Origin 186/196)' },
    };

    const match = knownSlugs[effectiveSlug] || {
      trend: 120.0,
      low: 95.0,
      avg30: 118.0,
      available: 50,
      name: effectiveSlug.replace(/-/g, ' '),
    };

    return res.json({
      source: 'demo-simulation',
      simulated: true,
      url: cardUrl || `https://www.cardmarket.com/en/Pokemon/Products/Singles/${effectiveSlug}`,
      cardName: match.name,
      currency: 'EUR',
      priceTrendEUR: match.trend,
      lowestPriceEUR: match.low,
      avg30DaysEUR: match.avg30,
      availableItems: match.available,
      priceTrendSEK: Math.round(match.trend * rates.eurToSek),
      lowestPriceSEK: Math.round(match.low * rates.eurToSek),
      eurToSekRate: rates.eurToSek,
      customsPolicy: '0% EU Tull & Importmoms (Fri rörlighet)',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// 1c. Japanese / US Customs & Moms Import Calculator
app.post('/api/customs-calculator', async (req: Request, res: Response) => {
  try {
    const { originCountry, nativePrice, nativeCurrency } = req.body;
    const rates = await getLiveFxRates();

    let fxRate = rates.usdToSek;
    if (nativeCurrency === 'EUR') fxRate = rates.eurToSek;
    if (nativeCurrency === 'JPY') fxRate = rates.jpyToSek;

    const baseCostSek = nativePrice * fxRate;

    // EU items: 0% customs, 0% import moms (already taxed in EU)
    if (originCountry === 'EU' || nativeCurrency === 'EUR') {
      return res.json({
        origin: 'European Union (Cardmarket)',
        isInsideEU: true,
        baseCostSek: Math.round(baseCostSek),
        importMomsSek: 0,
        customsDutySek: 0,
        postNordHandlingSek: 0,
        totalLandedCostSek: Math.round(baseCostSek),
        notes: 'Fri rörlighet för varor inom EU. Ingen tull, ingen svensk importmoms och ingen PostNord-deklaration.',
      });
    }

    // Japan (Mercari / Yahoo JP) & USA (eBay / TCGPlayer):
    const BUYEE_FEE_JPY = originCountry === 'JP' ? 300 : 0;
    const buyeeFeeSek = BUYEE_FEE_JPY * rates.jpyToSek;
    const shippingSek = originCountry === 'JP' ? 180 : 150; // International tracked shipping
    const POSTNORD_DECLARATION_SEK = 75; // PostNord hanteringsavgift för tullhantering
    const SWEDISH_MOMS_RATE = 0.25; // 25% moms

    // Moms beräknas på (varuvärde + frakt)
    const taxableBase = baseCostSek + buyeeFeeSek + shippingSek;
    const importMomsSek = taxableBase * SWEDISH_MOMS_RATE;
    const totalLandedCostSek = taxableBase + importMomsSek + POSTNORD_DECLARATION_SEK;

    return res.json({
      origin: originCountry === 'JP' ? 'Japan (Mercari / Yahoo! Auctions)' : 'USA (eBay / TCGPlayer)',
      isInsideEU: false,
      baseCostSek: Math.round(baseCostSek),
      buyeeFeeSek: Math.round(buyeeFeeSek),
      shippingSek,
      postNordHandlingSek: POSTNORD_DECLARATION_SEK,
      importMomsRate: 0.25,
      importMomsSek: Math.round(importMomsSek),
      totalLandedCostSek: Math.round(totalLandedCostSek),
      notes: '25% svensk moms debiteras av Tullverket/PostNord + 75 kr hanteringsavgift.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// 1d. Pokélector All Sets & Price History Endpoints
app.get('/api/pokecollector/sets', (req: Request, res: Response) => {
  const seriesFilter = req.query.series as string;
  let sets = POKECOLLECTOR_SETS;
  if (seriesFilter && seriesFilter !== 'ALL') {
    sets = sets.filter((s) => s.series === seriesFilter);
  }
  res.json({
    count: sets.length,
    sets: sets.map((s) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      releaseDate: s.releaseDate,
      releaseYear: s.releaseYear,
      totalCards: s.totalCards,
      pokecollectorSlug: s.pokecollectorSlug,
      cardsCount: s.cardsCount,
      chaseCount: s.featuredCards.length,
    })),
  });
});

app.get('/api/pokecollector/sets/:setId', (req: Request, res: Response) => {
  const { setId } = req.params;
  const set = POKECOLLECTOR_SETS.find((s) => s.id.toLowerCase() === setId.toLowerCase());
  if (!set) {
    return res.status(404).json({ error: `Set with id "${setId}" not found in Pokécollector index.` });
  }
  res.json(set);
});

app.get('/api/pokecollector/timeline/:cardId', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const rates = await getLiveFxRates();

    // Look in all featured cards across all sets, or fall back to main database
    let card: PokemonCard | undefined;
    for (const set of POKECOLLECTOR_SETS) {
      const found = set.featuredCards.find((c) => c.id === cardId || c.setNumber === cardId);
      if (found) {
        card = found;
        break;
      }
    }
    if (!card) {
      card = POKEMON_CARD_DATABASE.find((c) => c.id === cardId || c.setNumber === cardId);
    }
    if (!card) {
      card = POKEMON_CARD_DATABASE[0];
    }

    const timeline = generatePriceTimeline(card, rates.usdToSek, rates.eurToSek);
    res.json(timeline);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// 1e. Card Name & Set Number Universal Search Endpoint
app.get('/api/cards/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').trim();
    const setFilter = String(req.query.setName || '').trim();
    const rates = await getLiveFxRates();

    // 1. Instant local search from curated database
    const localMatches = searchPokemonCards(query, setFilter);
    let allCards: PokemonCard[] = [...localMatches];

    const searchOnline = req.query.online === 'true';
    let externalCards: PokemonCard[] = [];

    // 2. Auxiliary external search from pokemontcg.io if explicitly requested
    if (query && searchOnline) {
      try {
        const isNumeric = /^\d+(\/\d+)?$/.test(query);
        let apiQuery = '';
        if (isNumeric) {
          const numOnly = query.split('/')[0];
          apiQuery = `number:${numOnly}`;
        } else {
          const cleanName = query.replace(/[^\w\s-]/g, '').trim();
          apiQuery = `name:${cleanName}`;
        }

        if (setFilter && setFilter !== 'ALL') {
          const cleanSet = setFilter.replace(/[^\w\s-]/g, '').trim();
          apiQuery += ` set.name:"${cleanSet}"`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const apiRes = await fetch(
          `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(apiQuery)}&pageSize=15`,
          {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PokéArb/1.0',
              'Accept': 'application/json',
            },
          }
        );
        clearTimeout(timeout);

        if (apiRes.ok) {
          const json = (await apiRes.json()) as any;
          if (Array.isArray(json?.data)) {
            externalCards = json.data.map((c: any) => {
              const tcgMarket =
                c.tcgplayer?.prices?.holofoil?.market ||
                c.tcgplayer?.prices?.normal?.market ||
                c.tcgplayer?.prices?.reverseHolofoil?.market ||
                c.tcgplayer?.prices?.unlimitedHolofoil?.market ||
                28;
              const cmTrend =
                c.cardmarket?.prices?.trendPrice ||
                c.cardmarket?.prices?.averageSellPrice ||
                Math.round(tcgMarket * (rates.usdToSek / rates.eurToSek));
              const cmLow = c.cardmarket?.prices?.lowPrice || Math.round(cmTrend * 0.82);

              const soldSek = Math.round(tcgMarket * rates.usdToSek * 0.8);
              const leadingBidSek = Math.round(soldSek * 0.65);

              return {
                id: c.id,
                name: c.name,
                setNumber: `${c.number}/${c.set?.printedTotal || c.set?.total || ''}`,
                setName: c.set?.name || 'Pokémon TCG',
                series: c.set?.series || 'Pokémon',
                releaseYear: parseInt(c.set?.releaseDate?.slice(0, 4) || '2022', 10),
                rarity: c.rarity || 'Rare',
                foilType: c.tcgplayer?.prices?.holofoil ? 'Holo' : 'None',
                imageUrl: c.images?.large || c.images?.small,
                typicalTraderaSoldSEK: soldSek,
                typicalTraderaLeadingBidSEK: leadingBidSek,
                typicalTraderaBidsCount: Math.floor(Math.random() * 12) + 3,
                typicalTraderaTimeLeft: '3h 15m',
                typicalEbayUSD: Math.round(tcgMarket * 1.05),
                typicalEbayActiveUSD: Math.round(tcgMarket * 1.15),
                typicalCardmarketEUR: Math.round(cmTrend),
                typicalCardmarketLowEUR: Math.round(cmLow),
                typicalTcgplayerUSD: Math.round(tcgMarket),
                typicalMercariJPY: Math.round(tcgMarket * (rates.usdToSek / rates.jpyToSek) * 0.9),
                typicalBlocketSEK: Math.round(soldSek * 0.85),
                cardmarketSlug: `${c.set?.name?.replace(/\s+/g, '-')}/${c.name?.replace(/\s+/g, '-')}`,
                isHighValue: soldSek > 1000 || tcgMarket > 100,
                proxyRiskNotes:
                  soldSek > 1000
                    ? 'High-value target. Check micro-texture & holofoil rosette pattern.'
                    : undefined,
              };
            });

            // Merge externalCards into allCards deduplicated
            const existingKeys = new Set(allCards.map(c => `${c.name.toLowerCase()}-${c.setNumber}`));
            for (const ext of externalCards) {
              const key = `${ext.name.toLowerCase()}-${ext.setNumber}`;
              if (!existingKeys.has(key)) {
                allCards.push(ext);
                existingKeys.add(key);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Pokemontcg API search fallback error:', e);
      }
    }

    return res.json({
      query,
      count: allCards.length,
      cards: allCards,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// 2. Card Recognition API
app.post('/api/recognize', async (req: Request, res: Response) => {
  try {
    const { imageBase64, cardHint } = req.body;

    if (!imageBase64 && !cardHint) {
      return res.status(400).json({ error: 'imageBase64 or cardHint is required' });
    }

    // If Gemini is available and image is provided, use multimodal vision
    if (ai && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const prompt = `You are a certified professional Pokémon TCG card authentication and grading expert.
Analyze this Pokémon card image in detail and return ONLY a valid JSON object with the following schema:
{
  "name": "Exact card name, e.g. Charizard, Umbreon VMAX, Blastoise",
  "setNumber": "Printed set number in bottom corner e.g. 4/102, 215/203, 199/165",
  "setName": "Official expansion set name e.g. Base Set, Evolving Skies, Pokémon 151",
  "series": "Series name e.g. Base, Sword & Shield, Scarlet & Violet",
  "rarity": "One of: Common, Uncommon, Rare, Rare Holo, Ultra Rare, Secret Rare, Special Illustration Rare",
  "foilType": "One of: None, Holo, Reverse Holo, Textured Ultra, Cosmos Holo",
  "leftRightCentering": [number, number], // percentage estimated border ratio e.g. [52, 48]
  "topBottomCentering": [number, number],   // percentage estimated border ratio e.g. [51, 49]
  "cornerWhitening": "One of: None (Pristine), Slight (NM), Moderate (LP), Heavy (MP/HP)",
  "edgeWear": "One of: Clean, Minor Silvering, Chipped, Rough",
  "surfaceDefects": "Brief note about print lines, scratches, or clean holo",
  "estimatedGrade": "One of: PSA 10 Contender, PSA 9 Mint, Raw NM, Raw LP, Raw MP",
  "confidence": number between 0.0 and 1.0,
  "isHighValue": boolean (true if market value is generally > $100 / 1000 SEK),
  "proxyRiskNotes": "Specific advice on what to check for proxies for this card"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);
        return res.json({
          source: 'gemini-vision',
          data: parsed,
        });
      } catch (geminiErr) {
        console.warn('Gemini vision analysis failed, falling back to local database matcher:', geminiErr);
      }
    }

    // Local / offline fallback or hint-based matcher
    return res.json({
      source: 'local-feature-matcher',
      data: {
        note: 'Simulated visual recognition engine matching card features and ROI set number',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// 3. Pricing & Comps API (Simulating CompSniper eBay sold + Tradera ended filter)
app.post('/api/prices', async (req: Request, res: Response) => {
  try {
    const { cardName, setNumber, typicalTraderaSEK, typicalEbayUSD } = req.body;
    const rates = await getLiveFxRates();
    const usdToSek = rates.usdToSek;

    const ebayPrice = typicalEbayUSD || 150;
    const traderaPrice = typicalTraderaSEK || 900;

    res.json({
      cardName,
      setNumber,
      source: 'Aggregated (eBay Sold Comps & Tradera Closed)',
      usdToSek,
      averageSoldEbayUsd: ebayPrice,
      averageSoldTraderaSek: traderaPrice,
      filterQueryUsed: `Pokemon ${cardName} ${setNumber} -PSA -CGC -BGS`,
      compsCount: 5,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// 4. Cross-Border Arbitrage Calculator
app.post('/api/arbitrage', async (req: Request, res: Response) => {
  try {
    const { traderaPriceSek, ebayPriceUsd } = req.body;
    const rates = await getLiveFxRates();
    const usdToSek = rates.usdToSek;

    const EBAY_FEE_RATE = 0.1325; // 13.25% eBay Trading Cards category fee
    const FX_SPREAD = 0.03;       // 3% hidden conversion fee (PayPal/bank spread)
    const INT_SHIPPING_USD = 15;  // Baseline tracked shipping (Sweden to US)

    const grossRevenueSek = ebayPriceUsd * usdToSek;
    const ebayFeeUsd = ebayPriceUsd * EBAY_FEE_RATE;
    const netRevenueUsd = ebayPriceUsd - ebayFeeUsd - INT_SHIPPING_USD;

    const effectiveFxRate = usdToSek * (1 - FX_SPREAD);
    const netRevenueSek = netRevenueUsd * effectiveFxRate;

    const netProfitSek = Math.round(netRevenueSek - traderaPriceSek);
    const roiPercentage = traderaPriceSek > 0
      ? Number(((netProfitSek / traderaPriceSek) * 100).toFixed(2))
      : 0;

    res.json({
      currency: {
        midMarketRate: Number(usdToSek.toFixed(4)),
        effectiveRate: Number(effectiveFxRate.toFixed(4)),
        spreadPercent: 3,
      },
      economics: {
        grossRevenueUsd: ebayPriceUsd,
        grossRevenueSek: Math.round(grossRevenueSek),
        ebayFeeUsd: Number(ebayFeeUsd.toFixed(2)),
        ebayFeeSek: Math.round(ebayFeeUsd * usdToSek),
        shippingUsd: INT_SHIPPING_USD,
        shippingSek: Math.round(INT_SHIPPING_USD * usdToSek),
        costOfGoodsSek: traderaPriceSek,
        netProfitSek,
        netProfitUsd: Number((netProfitSek / usdToSek).toFixed(2)),
        roi: roiPercentage,
      },
      isProfitable: netProfitSek > 0,
      isHighArbitrage: roiPercentage >= 20,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// 5. Discord Webhook Dispatcher
app.post('/api/discord-webhook', async (req: Request, res: Response) => {
  try {
    const { webhookUrl, cardName, setNumber, economics, imageUrl } = req.body;

    if (webhookUrl && webhookUrl !== process.env.DISCORD_WEBHOOK_URL) {
      return res.status(400).json({ error: 'Use the server-configured Discord webhook.' });
    }
    const effectiveUrl = process.env.DISCORD_WEBHOOK_URL;

    // Build the exact Discord Embed and Action Row Button payload requested by the user
    const traderaSearchUrl = `https://www.tradera.com/search?q=${encodeURIComponent(`${cardName} ${setNumber}`)}&itemStatus=Active`;
    const ebayCompsUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${cardName} ${setNumber} -PSA -CGC -BGS`)}&LH_Sold=1&LH_Complete=1`;

    const embedPayload = {
      embeds: [
        {
          title: `🚨 Arbitrage Alert: ${cardName} (${setNumber})`,
          description: 'A Pokémon card with > 20% net margin has been scanned by PokéArb Scanner.',
          color: 3066993, // Green
          thumbnail: {
            url: imageUrl || 'https://images.pokemontcg.io/base1/4_hires.png',
          },
          fields: [
            {
              name: 'Tradera (Buy)',
              value: `${economics?.costOfGoodsSek ?? 0} SEK`,
              inline: true,
            },
            {
              name: 'eBay (Sell)',
              value: `${Number(economics?.grossRevenueSek ?? 0).toFixed(0)} SEK ($${Number(economics?.grossRevenueUsd ?? 0).toFixed(0)})`,
              inline: true,
            },
            {
              name: 'Net Profit (After Fees & Tracked Post)',
              value: `**${economics?.netProfitSek ?? 0} SEK** (~$${economics?.netProfitUsd ?? 0})`,
              inline: false,
            },
            {
              name: 'Net ROI',
              value: `**+${economics?.roiPercentage ?? economics?.roi ?? 0}%**`,
              inline: true,
            },
            {
              name: 'Deductions Breakdown',
              value: `eBay 13.25% (-${economics?.ebayFeeSek ?? 0} SEK) • PostNord Tracked (-${economics?.internationalShippingSek ?? 150} SEK) • FX Spread 3%`,
              inline: false,
            },
          ],
          footer: {
            text: 'PokéArb Scanner • Cross-Border Pokémon Arbitrage Engine',
          },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link Style
              label: 'Buy on Tradera',
              url: traderaSearchUrl,
              emoji: { name: '🛒' },
            },
            {
              type: 2,
              style: 5,
              label: 'Check eBay Comps',
              url: ebayCompsUrl,
              emoji: { name: '📈' },
            },
          ],
        },
      ],
    };

    if (!effectiveUrl) {
      // Return simulation payload for interactive preview in UI
      return res.json({
        simulated: true,
        message: 'No Discord Webhook URL provided. Simulation preview generated successfully.',
        payload: embedPayload,
      });
    }

    const discordResp = await fetch(`${effectiveUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embedPayload),
    });

    if (!discordResp.ok) {
      const errorText = await discordResp.text();
      return res.status(discordResp.status).json({
        error: `Discord Webhook error: ${errorText}`,
        payload: embedPayload,
      });
    }

    const discordJson = await discordResp.json().catch(() => ({}));
    return res.json({
      success: true,
      message: 'Alert sent successfully to Discord channel!',
      discordMessageId: (discordJson as { id?: string }).id,
      payload: embedPayload,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// Vite middleware / static files mounting
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ArbScanner server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
