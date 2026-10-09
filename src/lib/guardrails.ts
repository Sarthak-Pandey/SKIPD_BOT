/**
 * Deterministic rule-based Guardrail Engine for SKIPD Support Bot.
 *
 * Runs strictly BEFORE any LLM invocation to intercept medical, pregnancy,
 * adverse reaction, order tracking, dispute, unverified claims, and prompt injection
 * inquiries, ensuring deterministic safety and compliance without relying on AI self-moderation.
 */

export type IntentCategory =
  | "normal_faq"
  | "product_recommendation"
  | "order_tracking"
  | "complaint"
  | "skin_reaction"
  | "medical_question"
  | "pregnancy"
  | "refund_dispute"
  | "unknown_information"
  | "discount_request";

export type GuardrailAction =
  | "allow"
  | "handoff_required"
  | "clarification_required";

export type EscalationReason =
  | "none"
  | "pregnancy"
  | "medical_question"
  | "skin_reaction"
  | "complaint"
  | "refund_dispute"
  | "order_tracking"
  | "unverified_information"
  | "discount_request"
  | "prompt_injection";

export interface GuardrailDecision {
  intent: IntentCategory;
  action: GuardrailAction;
  allowAIResponse: boolean;
  reason: EscalationReason;
  safeResponse?: string;
}

/**
 * Normalises text for reliable regex and token matching.
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Detects prompt injection or jailbreak attempts.
 */
export function detectPromptInjection(cleaned: string): boolean {
  const patterns = [
    /\bignore\s+(all\s+)?(previous|your)\s+(instructions|rules|prompts)\b/,
    /\bdisregard\s+(all\s+)?(previous|your)\b/,
    /\b(system\s+prompt|developer\s+mode|jailbreak|pretend\s+you\s+are)\b/,
    /\bbypass\s+guardrails?\b/,
  ];
  return patterns.some((p) => p.test(cleaned));
}

/**
 * Detects pregnancy and breastfeeding inquiries.
 */
export function detectPregnancy(cleaned: string): boolean {
  const patterns = [
    /\bpregnan(t|cy)\b/,
    /\bbreastfeed(ing)?\b/,
    /\bnursing\s+(mother|women|mom)?\b/,
    /\blactat(ing|ion)\b/,
    /\bgarbhavastha\b/,
    /\bexpecting\s+a\s+baby\b/,
  ];
  return patterns.some((p) => p.test(cleaned));
}

/**
 * Detects reports of adverse skin reactions (rashes, burning, swelling, irritation).
 * Includes negative filtering to avoid triggering on harmless inquiries like "protect against sunburn".
 */
export function detectSkinReaction(cleaned: string): boolean {
  // Disregard if customer explicitly states they do NOT have a reaction or asks about general protection
  if (
    /\b(no\s+rash|don\s*t\s+have\s+a\s+rash|not\s+burning|protect\s+against\s+sunburn|prevent\s+sunburn)\b/.test(
      cleaned
    )
  ) {
    return false;
  }

  const adversePatterns = [
    /\b(got|developed|have|having|caused|gives?\s+me)\s+(a\s+)?(rash|rashes|allergy|allergic\s+reaction)\b/,
    /\b(rash|rashes)\b/,
    /\b(burning|burns|stung|stinging)\b/,
    /\b(swelling|swollen|hives|blisters?)\b/,
    /\b(severe|bad)\s+irritat(ion|ed)\b/,
    /\birritat(ing|ion)\s+(on|my|after)\b/,
    /\b(allergic\s+reaction|bad\s+reaction|skin\s+reaction)\b/,
    /\bitching\s+(badly|a\s+lot|after)\b/,
    // Hinglish patterns
    /\bskin\s+jal\s+rahi\b/,
    /\bdaane\s+nikal\b/,
    /\breaction\s+ho\s+gaya\b/,
    /\bjalan\s+ho\s+rahi\b/,
  ];

  return adversePatterns.some((p) => p.test(cleaned));
}

/**
 * Detects medical questions, medical conditions, and clinical diagnoses.
 */
export function detectMedicalQuestion(cleaned: string): boolean {
  const medicalPatterns = [
    /\b(eczema|psoriasis|rosacea|dermatitis)\b/,
    /\b(cure|treat|diagnose)\s+(my\s+)?(acne|skin|condition)\b/,
    /\b(cystic\s+acne|fungal\s+acne)\b/,
    /\b(prescription|prescribed|steroid|antibiotic|medication)\b/,
    /\bmedical\s+(advice|claim|condition)\b/,
  ];
  return medicalPatterns.some((p) => p.test(cleaned));
}

/**
 * Detects disputed refunds and financial conflict.
 */
export function detectRefundDispute(cleaned: string): boolean {
  const disputePatterns = [
    /\b(support\s+rejected|refund\s+rejected|rejected\s+(my\s+)?refund)\b/,
    /\b(refund\s+dispute|disputed?\s+refund)\b/,
    /\b(want|need|where\s+is)\s+my\s+refund\b/,
    /\b(money\s+not\s+refunded|refund\s+not\s+received)\b/,
    /\b(charged\s+twice|double\s+charge|scam|chargeback)\b/,
    // Hinglish
    /\b(paise\s+wapas\s+nahi|refund\s+nahi\s+mila|paise\s+vapas\s+karo)\b/,
  ];
  return disputePatterns.some((p) => p.test(cleaned));
}

/**
 * Detects explicit customer complaints and escalations.
 */
export function detectComplaint(cleaned: string): boolean {
  const complaintPatterns = [
    /\b(file\s+a\s+complaint|lodge\s+a\s+complaint|register\s+a\s+complaint|complaint|complain)\b/,
    /\b(pathetic|terrible|horrible|worst|useless)\b/,
    /\b(cheated|fraud|unacceptable)\b/,
    /\b(damaged|broken)\s+(package|item|stick|product|bottle)\b/,
    /\b(package|item|stick|product|bottle)\s+(is|was)\s+(damaged|broken)\b/,
    /\bwrong\s+item\s+sent\b/,
    // Hinglish
    /\b(bahut\s+bekar|shikayat\s+karni\s+hai|shikayat)\b/,
  ];
  return complaintPatterns.some((p) => p.test(cleaned));
}

/**
 * Detects order tracking inquiries.
 */
export function detectOrderTracking(cleaned: string): boolean {
  const trackingPatterns = [
    /\b(where\s+is\s+my\s+order|track\s+my\s+order|order\s+status|order\s+tracking)\b/,
    /\b(where\s+is\s+my\s+package|shipment\s+status|tracking\s+link|awb\s+number)\b/,
    /\b(delivery\s+status|when\s+will\s+my\s+order\s+arrive)\b/,
    // Hinglish
    /\b(order\s+kahan\s+hai|kahan\s+hai\s+mera\s+order|mera\s+parcel)\b/,
  ];
  return trackingPatterns.some((p) => p.test(cleaned));
}

/**
 * Detects discount and coupon code requests.
 */
export function detectDiscountRequest(cleaned: string): boolean {
  const discountPatterns = [
    /\b(discount\s+code|promo\s+code|coupon\s+code|voucher\s+code)\b/,
    /\b(give\s+me\s+a\s+discount|any\s+discount|coupon|voucher)\b/,
    // Hinglish
    /\b(discount\s+milega|coupon\s+chahiye|code\s+dedo)\b/,
  ];
  return discountPatterns.some((p) => p.test(cleaned));
}

/**
 * Detects unverified claims explicitly categorized as unverified in product-facts.md
 * (retinol compatibility, clinical proofs, sweat-proof/waterproof claims).
 */
export function detectUnverifiedClaims(cleaned: string): { isUnverified: boolean; claimType?: string } {
  // 1. Retinol / prescription active compatibility
  if (/\b(retinol|tretinoin|aha|bha|salicylic\s+acid)\b/.test(cleaned)) {
    return { isUnverified: true, claimType: "retinol" };
  }

  // 2. Clinical trial evidence / proof
  if (/\b(clinically\s+proven|clinical\s+trials?|clinical\s+evidence|lab\s+reports?)\b/.test(cleaned)) {
    return { isUnverified: true, claimType: "clinical" };
  }

  // 3. Sweat-proof / water-resistant claims
  if (/\b(sweat\s*proof|water\s*proof|water\s*resistant)\b/.test(cleaned)) {
    return { isUnverified: true, claimType: "sweatproof" };
  }

  return { isUnverified: false };
}

/**
 * Evaluates a customer message against the deterministic guardrail rules.
 *
 * @param message Raw customer inquiry
 * @returns GuardrailDecision indicating action, intent, escalation reason, and safe response
 */
export function evaluateGuardrails(message: string): GuardrailDecision {
  try {
    const cleaned = cleanText(message);

    // Rule 1: Pregnancy & nursing safety (Highest priority medical boundary)
    if (detectPregnancy(cleaned)) {
      return {
        intent: "pregnancy",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "pregnancy",
        safeResponse:
          "Pregnancy and nursing safety has not been officially verified for our products. We strongly recommend consulting your healthcare provider or OB-GYN before introducing any new skincare items. Our support team at info@skipd.in can provide formulation details for your doctor.",
      };
    }

    // Rule 2: Adverse skin reactions (Immediate medical/support boundary)
    if (detectSkinReaction(cleaned)) {
      return {
        intent: "skin_reaction",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "skin_reaction",
        safeResponse:
          "We are very sorry to hear about your experience. Please discontinue using the product immediately and rinse your skin gently with cool water. Adverse reactions require personal assistance—please contact our team directly at info@skipd.in with your details, and consult a doctor if irritation persists.",
      };
    }

    // Rule 3: Medical questions, diagnoses & conditions
    if (detectMedicalQuestion(cleaned)) {
      return {
        intent: "medical_question",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "medical_question",
        safeResponse:
          "SKIPD products are cosmetic skincare formulations and are not intended to diagnose, treat, or cure medical skin conditions (such as eczema, rosacea, or dermatitis). Please consult a dermatologist for medical guidance. You can also contact info@skipd.in for general product questions.",
      };
    }

    // Rule 4: Prompt injection / Jailbreak attempt (after checking high-priority safety)
    if (detectPromptInjection(cleaned)) {
      return {
        intent: "unknown_information",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "prompt_injection",
        safeResponse:
          "I am SKIPD's customer support assistant and must follow verified safety guidelines. How can I assist you with our skincare routine or products?",
      };
    }

    // Rule 5: Refund disputes and financial conflicts
    if (detectRefundDispute(cleaned)) {
      return {
        intent: "refund_dispute",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "refund_dispute",
        safeResponse:
          "Refund disputes require direct investigation by our human support team. Please send your order ID and payment details directly to info@skipd.in so an escalation specialist can review your case and resolve it.",
      };
    }

    // Rule 6: Customer complaints and escalations
    if (detectComplaint(cleaned)) {
      return {
        intent: "complaint",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "complaint",
        safeResponse:
          "We deeply apologize for your experience and take all complaints seriously. Please write directly to info@skipd.in with your order details so our support team can investigate and assist you personally.",
      };
    }

    // Rule 7: Order tracking (No live tracking integration yet)
    if (detectOrderTracking(cleaned)) {
      return {
        intent: "order_tracking",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "order_tracking",
        safeResponse:
          "Live automated order tracking is currently not connected directly to this chat assistant. To check the real-time shipping status of your order, please email your order number to info@skipd.in, and our team will verify the dispatch status for you.",
      };
    }

    // Rule 8: Discount and promo code requests
    if (detectDiscountRequest(cleaned)) {
      return {
        intent: "discount_request",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "discount_request",
        safeResponse:
          "We do not have any active or automated discount codes available in the chat assistant. Current promotional offers or bundles are announced directly on our website (skipd.in). For special inquiries, please contact info@skipd.in.",
      };
    }

    // Rule 9: Explicit unverified claims (retinol, clinical proof, sweat-proof)
    const unverifiedCheck = detectUnverifiedClaims(cleaned);
    if (unverifiedCheck.isUnverified) {
      let specificSafeResponse =
        "This information has not been verified in our official documentation. To avoid guesswork, please check with our team at info@skipd.in.";

      if (unverifiedCheck.claimType === "retinol") {
        specificSafeResponse =
          "Compatibility with separate retinol or prescription actives has not been officially verified. We advise consulting your dermatologist or contacting our team at info@skipd.in before combining active treatments.";
      } else if (unverifiedCheck.claimType === "clinical") {
        specificSafeResponse =
          "Specific clinical trial documentation and laboratory testing reports have not been publicly released at this time. Our team at info@skipd.in can share verified details once officially published.";
      } else if (unverifiedCheck.claimType === "sweatproof") {
        specificSafeResponse =
          "Specific sweat-proof or water-resistance certifications have not been officially verified for our sticks. Reapplying after heavy perspiration or water exposure is recommended, and our team at info@skipd.in can assist with specific usage questions.";
      }

      return {
        intent: "unknown_information",
        action: "handoff_required",
        allowAIResponse: false,
        reason: "unverified_information",
        safeResponse: specificSafeResponse,
      };
    }

    // Default: Normal product questions and recommendation requests are allowed to proceed
    return {
      intent: "normal_faq",
      action: "allow",
      allowAIResponse: true,
      reason: "none",
    };
  } catch {
    // Fail-safe fallback: If classification encounters an unexpected error, fail closed
    return {
      intent: "unknown_information",
      action: "handoff_required",
      allowAIResponse: false,
      reason: "unverified_information",
      safeResponse:
        "I was unable to verify this request safely. Please reach out to our team at info@skipd.in for direct assistance.",
    };
  }
}
