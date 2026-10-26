import { CollectionCardItem, GeneratedListing, ListingPlatform, PokemonCard } from '../types';

export function generateMarketplaceListing(
  card: PokemonCard | CollectionCardItem,
  platform: ListingPlatform,
  customPriceSek?: number,
  conditionText?: string
): GeneratedListing {
  const name = 'cardName' in card ? card.cardName : card.name;
  const setNumber = card.setNumber;
  const setName = card.setName;
  const imageUrl = card.imageUrl;
  const basePriceSek = customPriceSek || ('currentMarketPriceSek' in card ? card.currentMarketPriceSek : card.typicalTraderaSoldSEK);
  const condition = conditionText || ('condition' in card ? card.condition : 'Near Mint (NM)');

  switch (platform) {
    case 'tradera': {
      // Tradera max 65 chars title limit
      let rawTitle = `Pokemon ${name} ${setNumber} ${setName} ${condition}`.trim();
      if (rawTitle.length > 65) {
        rawTitle = `Pokemon ${name} ${setNumber} ${condition}`.trim();
      }
      if (rawTitle.length > 65) {
        rawTitle = rawTitle.slice(0, 65);
      }

      const startingBid = Math.max(1, Math.round(basePriceSek * 0.65));
      const buyNowPrice = Math.round(basePriceSek * 1.05);

      const description = `Hej samlare!

Säljer ett autentiskt Pokémon TCG-kort i mycket fint samlarskick:
• Kort: ${name}
• Nummer: ${setNumber}
• Set: ${setName}
• Skick: ${condition}
• Äkthet: 100% garanterat original. Verifierat via tilt- och mönstertest.

Kortet skickas säkert packat i sleeve (Penny Sleeve), hård toploader eller semi-rigid korthållare och skyddande bubbelkuvert.

Fraktalternativ:
• PostNord Frimärke (vadderat): 18 kr (köparens risk)
• PostNord Spårbart Brev (rekommenderas): 58 kr
• Samfraktar självklart vid vinst av flera auktioner!

Betalning inom 3 dagar via Tradera (Swish, Kort, Klarna). Lycka till med budgivningen!`;

      return {
        id: `listing-tradera-${Date.now()}`,
        platform: 'tradera',
        title: rawTitle,
        priceSek: buyNowPrice,
        startingBidSek: startingBid,
        shippingDetails: 'PostNord Spårbart (58 SEK) / Frimärke (18 SEK)',
        conditionGrade: condition,
        categoryPath: 'Samlarsaker > Samlarkort > Pokémon TCG > Enstaka Kort',
        description,
        directUrl: `https://www.tradera.com/search?q=${encodeURIComponent(`${name} ${setNumber}`)}`,
      };
    }

    case 'ebay': {
      // eBay max 80 chars title limit
      let rawTitle = `Pokemon ${name} ${setNumber} ${setName} Holo Rare ${condition} Authentic`.trim();
      if (rawTitle.length > 80) {
        rawTitle = `Pokemon ${name} ${setNumber} ${setName} ${condition}`.trim();
      }
      if (rawTitle.length > 80) {
        rawTitle = rawTitle.slice(0, 80);
      }

      const priceUsd = Number((basePriceSek / 9.94).toFixed(2));
      const description = `Authentic Pokémon TCG Single Card:
- Card Name: ${name}
- Number: ${setNumber}
- Set: ${setName}
- Condition: ${condition}
- 100% Genuine Official Pokemon Card (Tested against proxies/reprints)

SHIPPING & PACKAGING:
Card will be shipped sleeved in a fresh Penny Sleeve, inserted into a sturdy Ultra Pro Toploader, sealed in a team bag and protected between cardboard sheets in a bubble mailer.
International tracked shipping with tracking number provided immediately upon dispatch.

Combined shipping available for multiple purchases. Please feel free to message with any questions!`;

      return {
        id: `listing-ebay-${Date.now()}`,
        platform: 'ebay',
        title: rawTitle,
        priceSek: basePriceSek,
        priceLocalCurrency: `$${priceUsd} USD`,
        startingBidSek: Math.round(basePriceSek * 0.7),
        shippingDetails: 'Tracked International Bubble Mailer ($14 USD)',
        conditionGrade: condition,
        categoryPath: 'Collectibles > Collectible Card Games > CCG Individual Cards',
        description,
        directUrl: `https://www.ebay.com/sl/prelist/suggest?sr=sh&q=${encodeURIComponent(`${name} ${setNumber}`)}`,
      };
    }

    case 'cardmarket': {
      const priceEur = Number((basePriceSek / 10.82).toFixed(2));
      const title = `${name} (${setName} ${setNumber})`;
      const description = `Cardmarket single listing details:
Language: English
Condition: ${condition.includes('PSA 10') ? 'Mint (M)' : condition.includes('LP') ? 'Light Played (LP)' : 'Near Mint (NM)'}
First Edition / Foil: Holo / Foil
Packaging: Double-sleeved in Perfect Fit + KMC Hard sleeve inside cardboard envelope.`;

      return {
        id: `listing-cardmarket-${Date.now()}`,
        platform: 'cardmarket',
        title,
        priceSek: basePriceSek,
        priceLocalCurrency: `€${priceEur} EUR`,
        shippingDetails: 'Standard PostNord European Tracked Envelope (€6.50)',
        conditionGrade: condition,
        categoryPath: 'Pokémon > Singles',
        description,
        directUrl: `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}`,
      };
    }

    case 'blocket': {
      const title = `Pokemon kort: ${name} (${setNumber} ${setName})`;
      const description = `Säljer ${name} från setet ${setName} (${setNumber}).
Skick: ${condition}
Originalkort förvarat i skyddsficka.

Pris: ${basePriceSek} kr.
Kan mötas upp lokalt eller skickas spårbart via Blocketpaket / PostNord.
Betalning via Swish eller Blocket säker betalning.`;

      return {
        id: `listing-blocket-${Date.now()}`,
        platform: 'blocket',
        title,
        priceSek: basePriceSek,
        priceLocalCurrency: `${basePriceSek} SEK`,
        shippingDetails: 'Blocketpaket eller PostNord (58 kr)',
        conditionGrade: condition,
        categoryPath: 'Fritid & Hobby > Samlarföremål',
        description,
        directUrl: 'https://www.blocket.se/skapa-annons',
      };
    }
  }
}
