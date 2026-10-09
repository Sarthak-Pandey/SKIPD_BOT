import rawFaqs from "@/data/faq.json";

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  requiresHandoff: boolean;
}

export interface FAQMatch {
  id: string;
  category: string;
  question: string;
  answer: string;
  requiresHandoff: boolean;
  score: number;
}

export interface FAQSearchResult {
  query: string;
  matches: FAQMatch[];
  topMatch: FAQMatch | null;
  hasMatch: boolean;
}

export interface FAQSearchOptions {
  threshold?: number;
  maxResults?: number;
}

// Default minimum score threshold required to consider a match valid.
export const DEFAULT_MATCH_THRESHOLD = 2.0;

// Maximum number of relevant matches returned for contextual feeding.
export const DEFAULT_MAX_RESULTS = 3;

// Common stop words filtered during tokenization to boost topical signal
const STOP_WORDS = new Set([
  "a", "about", "am", "an", "and", "are", "as", "at", "be", "by", "can",
  "could", "did", "do", "does", "for", "from", "had", "has", "have", "he",
  "her", "him", "his", "how", "i", "if", "in", "is", "it", "its", "me",
  "my", "no", "not", "of", "on", "or", "our", "she", "should", "so", "that",
  "the", "their", "them", "there", "they", "this", "to", "us", "was", "we",
  "what", "when", "where", "which", "who", "why", "will", "with", "would",
  "you", "your"
]);

/**
 * Normalises text by lowercasing, stripping punctuation,
 * and collapsing extra whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // replace punctuation with spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Basic word stemmer to handle simple singular/plural and common variations.
 */
function stemWord(word: string): string {
  if (word.endsWith("ies") && word.length > 4) {
    return word.slice(0, -3) + "y";
  }
  if (word.endsWith("es") && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }
  if (word.endsWith("ing") && word.length > 5) {
    return word.slice(0, -3);
  }
  if (word.endsWith("er") && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith("ness") && word.length > 5) {
    return word.slice(0, -4);
  }
  return word;
}

/**
 * Extracts normalized, non-stopword tokens and stems from a text string.
 */
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const tokens = normalized
    .split(" ")
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));

  const stems = tokens.map(stemWord);
  // Return unique combination of original tokens and stems
  return Array.from(new Set([...tokens, ...stems]));
}

/**
 * Returns all FAQ items loaded from the source of truth faq.json.
 */
export function getAllFAQs(): FAQItem[] {
  return rawFaqs as FAQItem[];
}

/**
 * Computes a relevance score between a user query and a FAQ item.
 */
function scoreFAQItem(query: string, normalizedQuery: string, queryTokens: string[], item: FAQItem): number {
  if (!normalizedQuery || queryTokens.length === 0) {
    return 0;
  }

  let score = 0;

  // 1. Keyword matching (high precision signal)
  for (const rawKw of item.keywords) {
    const kw = normalizeText(rawKw);
    if (!kw) continue;

    // Multi-word phrase exact match in normalized query
    if (kw.includes(" ") && normalizedQuery.includes(kw)) {
      score += 4.5;
      continue;
    }

    // Exact single-word keyword in query
    const kwTokens = kw.split(" ").filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    for (const kt of kwTokens) {
      const stemmedKt = stemWord(kt);
      if (queryTokens.includes(kt) || queryTokens.includes(stemmedKt)) {
        score += 2.5;
      } else if (new RegExp(`\\b${kt}\\b`).test(normalizedQuery)) {
        score += 1.5;
      }
    }
  }

  // 2. Question token overlap
  const questionTokens = tokenize(item.question);
  let qTokenMatches = 0;
  for (const qToken of questionTokens) {
    if (queryTokens.includes(qToken)) {
      qTokenMatches++;
    }
  }
  score += qTokenMatches * 1.5;

  // 3. Category token overlap
  const categoryTokens = tokenize(item.category);
  let catTokenMatches = 0;
  for (const cToken of categoryTokens) {
    if (queryTokens.includes(cToken)) {
      catTokenMatches++;
    }
  }
  score += catTokenMatches * 0.8;

  // 4. Boost exact or high containment of product names
  const mentionsGlowscreen = queryTokens.includes("glowscreen");
  const mentionsMoonscreen = queryTokens.includes("moonscreen");

  if (mentionsGlowscreen && (item.id.includes("glowscreen") || item.question.toLowerCase().includes("glowscreen"))) {
    score += 2.0;
  }
  if (mentionsMoonscreen && (item.id.includes("moonscreen") || item.question.toLowerCase().includes("moonscreen"))) {
    score += 2.0;
  }

  return score;
}

/**
 * Searches the FAQ knowledge base for entries relevant to a customer query.
 *
 * @param query Customer question or prompt
 * @param options Configurable threshold and max results
 * @returns FAQSearchResult with matched entries or explicit no-match
 */
export function searchFAQ(query: string, options: FAQSearchOptions = {}): FAQSearchResult {
  const threshold = options.threshold ?? DEFAULT_MATCH_THRESHOLD;
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;

  const trimmedQuery = query ? query.trim() : "";
  if (!trimmedQuery) {
    return {
      query: "",
      matches: [],
      topMatch: null,
      hasMatch: false,
    };
  }

  const normalizedQuery = normalizeText(trimmedQuery);
  const queryTokens = tokenize(trimmedQuery);

  if (queryTokens.length === 0) {
    return {
      query: trimmedQuery,
      matches: [],
      topMatch: null,
      hasMatch: false,
    };
  }

  const faqs = getAllFAQs();
  const scoredMatches: FAQMatch[] = [];

  for (const item of faqs) {
    const score = scoreFAQItem(trimmedQuery, normalizedQuery, queryTokens, item);
    if (score >= threshold) {
      scoredMatches.push({
        id: item.id,
        category: item.category,
        question: item.question,
        answer: item.answer,
        requiresHandoff: item.requiresHandoff,
        score: Math.round(score * 10) / 10,
      });
    }
  }

  // Sort descending by relevance score
  scoredMatches.sort((a, b) => b.score - a.score);

  const topMatches = scoredMatches.slice(0, maxResults);
  const topMatch = topMatches.length > 0 ? topMatches[0] : null;

  return {
    query: trimmedQuery,
    matches: topMatches,
    topMatch,
    hasMatch: topMatches.length > 0,
  };
}
