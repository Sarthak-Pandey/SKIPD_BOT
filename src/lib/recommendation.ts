/**
 * Product Recommendation Engine for SKIPD Support Bot (Phase 10).
 *
 * Deterministically recommends Glowscreen, Moonscreen, or both based on verified
 * product facts, stated routines, and customer goals.
 *
 * Never invents skin-type suitability, treatment claims, or guarantees.
 */

export type RecommendedProduct = "glowscreen" | "moonscreen" | "both" | "none";

export interface RecommendationEvaluation {
  isRecommendationRequest: boolean;
  recommendedProduct: RecommendedProduct;
  needsClarification: boolean;
  clarificationQuestion?: string;
  hasMorningGoal: boolean;
  hasNightGoal: boolean;
  unverifiedSkinType?: string | null;
  travelMentioned: boolean;
  reason: string;
}

function cleanText(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Evaluates whether a customer message is seeking a product recommendation,
 * and determines the appropriate product(s) or follow-up question.
 */
export function evaluateRecommendation(message: string): RecommendationEvaluation {
  const cleaned = cleanText(message);

  // 1. Detect Skin Types Mentioned (to attach strict non-suitability disclaimers)
  let unverifiedSkinType: string | null = null;
  if (/\b(oily\s+skin|oily)\b/.test(cleaned)) {
    unverifiedSkinType = "oily skin";
  } else if (/\b(dry\s+skin|dry)\b/.test(cleaned)) {
    unverifiedSkinType = "dry skin";
  } else if (/\b(sensitive\s+skin|sensitive)\b/.test(cleaned)) {
    unverifiedSkinType = "sensitive skin";
  } else if (/\b(acne\s*prone|combination\s+skin)\b/.test(cleaned)) {
    unverifiedSkinType = "acne-prone skin";
  }

  // 2. Detect Travel Mention
  const travelMentioned = /\b(travel|travelling|traveling|traveler|travelers|frequent\s+travel|on\s+the\s+go|flight|trip)\b/.test(
    cleaned
  );

  // 3. Detect Morning / Sun Protection Goals
  const hasMorningGoal =
    /\b(morning|am\s+routine|daytime|day\s+routine|spf|sunscreen|sun\s+protection|glow|hydration)\b/.test(
      cleaned
    );

  // 4. Detect Nighttime / Recovery Goals
  const hasNightGoal =
    /\b(night|nighttime|pm\s+routine|overnight|recovery|barrier\s+repair|fine\s+lines|evening|recovery\s+balm)\b/.test(
      cleaned
    );

  // 5. Detect Explicit Both / Dual-Routine Intent
  const hasBothGoal =
    /\b(both|morning\s+and\s+(night|nighttime|overnight|evening)|mornings?\s+and\s+(night|overnight)|am\s+and\s+pm|complete\s+routine|full\s+routine)\b/.test(
      cleaned
    ) || (hasMorningGoal && hasNightGoal);

  // 6. Detect Generic Recommendation Intent without specified routine
  const isGenericRecommendation =
    /\b(which\s+(stick|one|product)\s+(is\s+)?(best|right|good|better)\s+(for\s+me)?|what\s+should\s+i\s+(buy|get|choose)|recommend(\s+me)?\s+(a\s+)?(stick|product|routine)|help\s+me\s+choose)\b/.test(
      cleaned
    );

  const hasRecommendationKeywords =
    /\b(recommend|recommendation|should\s+i\s+buy|should\s+i\s+get|which\s+stick|need\s+a\s+routine|need\s+spf|need\s+help\s+with|want\s+an?\s+(overnight|morning|recovery|balm|stick))\b/.test(
      cleaned
    ) || isGenericRecommendation || hasBothGoal;

  // If this is not a recommendation request, return false
  if (!hasRecommendationKeywords && !hasMorningGoal && !hasNightGoal) {
    return {
      isRecommendationRequest: false,
      recommendedProduct: "none",
      needsClarification: false,
      hasMorningGoal: false,
      hasNightGoal: false,
      unverifiedSkinType,
      travelMentioned,
      reason: "Not a product recommendation request",
    };
  }

  // Branch A: Explicit Both Goal
  if (hasBothGoal) {
    return {
      isRecommendationRequest: true,
      recommendedProduct: "both",
      needsClarification: false,
      hasMorningGoal: true,
      hasNightGoal: true,
      unverifiedSkinType,
      travelMentioned,
      reason: "Customer seeks help with both morning routine and overnight recovery",
    };
  }

  // Branch B: Generic recommendation with unclear goals -> Ask follow-up question
  if (isGenericRecommendation && !hasMorningGoal && !hasNightGoal) {
    return {
      isRecommendationRequest: true,
      recommendedProduct: "none",
      needsClarification: true,
      clarificationQuestion:
        "To help you choose the right stick: Are you looking for morning hydration and sun protection with SPF 50+ (Glowscreen), overnight barrier recovery and line smoothing (Moonscreen), or a complete routine covering both?",
      hasMorningGoal: false,
      hasNightGoal: false,
      unverifiedSkinType,
      travelMentioned,
      reason: "Customer's routine goals are unclear; follow-up question required",
    };
  }

  // Branch C: Morning Goal Only -> Glowscreen
  if (hasMorningGoal && !hasNightGoal) {
    return {
      isRecommendationRequest: true,
      recommendedProduct: "glowscreen",
      needsClarification: false,
      hasMorningGoal: true,
      hasNightGoal: false,
      unverifiedSkinType,
      travelMentioned,
      reason: "Customer's primary goal is morning routine, hydration, SPF 50+, or glow",
    };
  }

  // Branch D: Night Goal Only -> Moonscreen
  if (hasNightGoal && !hasMorningGoal) {
    return {
      isRecommendationRequest: true,
      recommendedProduct: "moonscreen",
      needsClarification: false,
      hasMorningGoal: false,
      hasNightGoal: true,
      unverifiedSkinType,
      travelMentioned,
      reason: "Customer's primary goal is overnight recovery or barrier repair",
    };
  }

  // Branch E: User mentioned only skin type and travel (e.g., "I have oily skin and travel a lot")
  if (unverifiedSkinType || travelMentioned) {
    return {
      isRecommendationRequest: true,
      recommendedProduct: "glowscreen",
      needsClarification: false,
      hasMorningGoal: false,
      hasNightGoal: false,
      unverifiedSkinType,
      travelMentioned,
      reason: "Travel or skin type mentioned without explicit AM/PM goal; explain verified daytime stick purpose with caveat",
    };
  }

  return {
    isRecommendationRequest: false,
    recommendedProduct: "none",
    needsClarification: false,
    hasMorningGoal: false,
    hasNightGoal: false,
    unverifiedSkinType,
    travelMentioned,
    reason: "No recommendation criteria met",
  };
}

/**
 * Returns a deterministic, verified recommendation explanation in SKIPD's voice.
 */
export function getDeterministicRecommendationResponse(evaluation: RecommendationEvaluation): string {
  if (evaluation.needsClarification && evaluation.clarificationQuestion) {
    return evaluation.clarificationQuestion;
  }

  let response = "";

  if (evaluation.recommendedProduct === "glowscreen") {
    response =
      "For your morning routine and sun protection, we recommend **Glowscreen**! It is a multifunctional morning glow stick with SPF 50+ designed to combine hydration, broad-spectrum UV protection, and a healthy glow in a single step, replacing separate toner, serum, moisturiser, and sunscreen.";
  } else if (evaluation.recommendedProduct === "moonscreen") {
    response =
      "For overnight care and recovery, we recommend **Moonscreen**! It is an overnight recovery balm designed for barrier repair and recovery while smoothing the appearance of fine lines, replacing separate barrier repair cream, eye cream, and anti-ageing steps.";
  } else if (evaluation.recommendedProduct === "both") {
    response =
      "For a complete routine covering both mornings and nights, we recommend using both **Glowscreen** and **Moonscreen**:\n\n• **Glowscreen (AM)**: Multifunctional morning glow stick with SPF 50+ that combines hydration, sun defense, and a healthy glow.\n• **Moonscreen (PM)**: Overnight recovery balm formulated for barrier repair, deep recovery, and smoothing the appearance of fine lines.\n\nTogether, they replace a 10-step routine with a simple, 2-step system designed for real life.";
  }

  // Attach skin type limitation caveat if mentioned
  if (evaluation.unverifiedSkinType) {
    response += `\n\n*Note on skin type:* Specific suitability claims for ${evaluation.unverifiedSkinType} have not been clinically verified, so we recommend patch testing. However, SKIPD sticks are designed in solid formats to avoid the heavy, melting feel of conventional cream layering in warm climates.`;
  }

  // Attach travel convenience notice without making airline cabin guarantees
  if (evaluation.travelMentioned) {
    response +=
      "\n\n*Note on travel:* The solid stick format is convenient and mess-free on the go, though individual airline cabin baggage regulations vary by carrier and should be verified independently.";
  }

  return response;
}

/**
 * Formats structured recommendation guidance to be passed to Groq as context,
 * ensuring the AI explanation strictly reflects the deterministic selection.
 */
export function formatRecommendationContext(evaluation: RecommendationEvaluation): string {
  let context = `Recommended Product: ${evaluation.recommendedProduct.toUpperCase()}\nReason: ${evaluation.reason}\n`;

  if (evaluation.recommendedProduct === "glowscreen") {
    context += `Verified Facts: Glowscreen is an SPF 50+ multifunctional morning glow stick combining hydration, protection, and glow. Replaces separate toner, serum, moisturiser, and sunscreen.`;
  } else if (evaluation.recommendedProduct === "moonscreen") {
    context += `Verified Facts: Moonscreen is an overnight recovery balm for barrier repair, recovery, and smoothing the appearance of fine lines. Replaces separate barrier repair cream, eye cream, and anti-ageing steps.`;
  } else if (evaluation.recommendedProduct === "both") {
    context += `Verified Facts: Glowscreen (AM: SPF 50+ morning glow stick combining hydration, protection, glow) and Moonscreen (PM: overnight recovery balm for barrier repair and fine lines). Distinct purposes for morning and night.`;
  }

  if (evaluation.unverifiedSkinType) {
    context += `\nSTRICT CONSTRAINT: The customer mentioned "${evaluation.unverifiedSkinType}". You MUST explicitly state that suitability for this skin type has NOT been clinically verified. Do NOT claim the product cures or controls oily/dry skin.`;
  }

  if (evaluation.travelMentioned) {
    context += `\nSTRICT CONSTRAINT: Travel convenience may be mentioned as a portable solid stick format, but do NOT promise airline cabin baggage compliance.`;
  }

  return context;
}
