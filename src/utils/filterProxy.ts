/**
 * Two-Pronged Proxy & Counterfeit Sales Filter
 * 1. Aggressive Keyword Blacklist (title text regex)
 * 2. Statistical Outlier Rejection via Interquartile Range (IQR)
 * 3. Raw vs. Graded Slabs condition parser (PSA, BGS, CGC, SGC, ACE, TAG, PCG)
 */

export const DEFAULT_PROXY_KEYWORDS = [
  'proxy',
  'replica',
  'orica',
  'custom',
  'handmade',
  'metal',
  'gold',
  'plastic',
  'flash',
  'reprint',
  'art card',
  'novelty'
];

export interface CardConditionParseResult {
  type: 'raw' | 'graded';
  company?: string;
  grade?: string;
  condition?: string;
}

export interface RawSaleListing {
  id: string;
  source: 'eBay Sold' | 'Tradera Closed' | 'Tradera Active' | 'eBay Active';
  title: string;
  price: number;
  currency: 'USD' | 'SEK';
  normalizedSEK: number;
  date: string;
  isLeadingBid?: boolean;
  bidCount?: number;
  timeLeft?: string;
  wasBestOffer?: boolean;
}

export interface FilterReport {
  totalScanned: number;
  rejectedKeywords: number;
  rejectedOutliers: number;
  rawListingsCount: number;
  gradedListingsCount: number;
  sanitizedListings: RawSaleListing[];
}

// 1. Title Keyword Blacklist Regex
export function getProxyRegex(keywords: string[] = DEFAULT_PROXY_KEYWORDS): RegExp {
  const pattern = keywords.map(k => k.trim()).filter(Boolean).join('|');
  return new RegExp(`\\b(${pattern})\\b|(${pattern})`, 'i');
}

// 2. Graded vs Raw Parser
export function parseCardCondition(listingTitle: string): CardConditionParseResult {
  const lowerTitle = listingTitle.toLowerCase();

  // Check for Grading Companies (PSA, BGS, CGC, SGC, ACE, TAG, PCG, Beckett)
  const gradedRegex = /(psa|bgs|cgc|sgc|ace|tag|pcg|beckett)\s*(10|9\.?5?|9|8\.?5?|8|7|6|5|4|3|2|1)?/i;
  const match = lowerTitle.match(gradedRegex);

  if (match) {
    return {
      type: 'graded',
      company: match[1].toUpperCase(),
      grade: match[2] ? match[2] : 'AUTHENTIC',
    };
  }

  const isExplicitlyRaw = /(raw|ungraded|nm|near mint|lp|lightly played|mp|hp|oöppnad|mycket fint skick)/i.test(lowerTitle);

  return {
    type: 'raw',
    condition: isExplicitlyRaw ? 'specified_raw' : 'assumed_raw',
  };
}

// 3. Two-Pronged Sanitizer with Statistical Outlier Rejection (IQR)
export function sanitizePricingListings(
  listings: RawSaleListing[],
  options: {
    targetType?: 'raw' | 'graded';
    targetGrade?: string;
    proxyKeywords?: string[];
    iqrMultiplier?: number;
  } = {}
): FilterReport {
  const {
    targetType = 'raw',
    targetGrade = '10',
    proxyKeywords = DEFAULT_PROXY_KEYWORDS,
    iqrMultiplier = 1.0,
  } = options;

  const proxyRegex = getProxyRegex(proxyKeywords);
  let rejectedKeywords = 0;
  let rejectedOutliers = 0;
  let rawListingsCount = 0;
  let gradedListingsCount = 0;

  // Step 1: Text-based filtering & Condition Parsing
  const typeFiltered: RawSaleListing[] = [];

  for (const item of listings) {
    const isFake = proxyRegex.test(item.title);
    if (isFake) {
      rejectedKeywords++;
      continue;
    }

    const condition = parseCardCondition(item.title);
    if (condition.type === 'raw') {
      rawListingsCount++;
      if (targetType === 'raw') {
        typeFiltered.push(item);
      }
    } else {
      gradedListingsCount++;
      if (targetType === 'graded') {
        if (!targetGrade || condition.grade === targetGrade) {
          typeFiltered.push(item);
        }
      }
    }
  }

  // If we don't have at least 4 items, we can't do statistical IQR safely
  if (typeFiltered.length < 4) {
    return {
      totalScanned: listings.length,
      rejectedKeywords,
      rejectedOutliers: 0,
      rawListingsCount,
      gradedListingsCount,
      sanitizedListings: typeFiltered,
    };
  }

  // Step 2: Statistical Outlier Rejection (The Math Defense - IQR)
  // Sort listings by normalized SEK price
  const sorted = [...typeFiltered].sort((a, b) => a.normalizedSEK - b.normalizedSEK);
  const prices = sorted.map(l => l.normalizedSEK);

  const q1Index = Math.floor(prices.length * 0.25);
  const q3Index = Math.floor(prices.length * 0.75);
  const q1 = prices[q1Index];
  const q3 = prices[q3Index];
  const iqr = q3 - q1;

  // For trading cards, aggressively tighten the lower bound to chop off $15 fake proxies
  const lowerBound = Math.max(10, q1 - iqrMultiplier * iqr);
  const upperBound = q3 + 1.6 * iqr;

  const sanitizedListings: RawSaleListing[] = [];

  for (const item of sorted) {
    if (item.normalizedSEK >= lowerBound && item.normalizedSEK <= upperBound) {
      sanitizedListings.push(item);
    } else {
      rejectedOutliers++;
    }
  }

  return {
    totalScanned: listings.length,
    rejectedKeywords,
    rejectedOutliers,
    rawListingsCount,
    gradedListingsCount,
    sanitizedListings: sanitizedListings.length > 0 ? sanitizedListings : sorted,
  };
}
