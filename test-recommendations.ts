import { evaluateRecommendation, getDeterministicRecommendationResponse } from "./src/lib/recommendation";
import { evaluateGuardrails } from "./src/lib/guardrails";
import { searchFAQ } from "./src/lib/faq";
import { generateRecommendationExplanation, generateChatResponse } from "./src/lib/ai";
import Groq from "groq-sdk";

// Helper mock Groq client tracking call count
function createMockGroq(mockReply: string) {
  let callCount = 0;
  const client = {
    chat: {
      completions: {
        create: async () => {
          callCount++;
          return {
            choices: [{ message: { content: mockReply } }],
          };
        },
      },
    },
  } as unknown as Groq;

  return { client, getCount: () => callCount };
}

async function runRecommendationTests() {
  console.log("=================================================");
  console.log("   SKIPD Product Recommendation Test Suite       ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  // Case 1: "I need SPF for my morning routine." → Glowscreen
  try {
    const q = "I need SPF for my morning routine.";
    const guard = evaluateGuardrails(q);
    const rec = evaluateRecommendation(q);
    const reply = getDeterministicRecommendationResponse(rec);

    if (
      guard.action === "allow" &&
      rec.recommendedProduct === "glowscreen" &&
      reply.toLowerCase().includes("glowscreen") &&
      reply.includes("SPF 50+")
    ) {
      console.log("✅ Case 1: 'I need SPF for my morning routine.' → Recommended Glowscreen.");
      passed++;
    } else {
      throw new Error(`Failed to recommend Glowscreen. Got: ${rec.recommendedProduct}`);
    }
  } catch (err: any) {
    console.error("❌ Case 1 FAILED:", err.message);
    failed++;
  }

  // Case 2: "I want an overnight recovery balm." → Moonscreen
  try {
    const q = "I want an overnight recovery balm.";
    const guard = evaluateGuardrails(q);
    const rec = evaluateRecommendation(q);
    const reply = getDeterministicRecommendationResponse(rec);

    if (
      guard.action === "allow" &&
      rec.recommendedProduct === "moonscreen" &&
      reply.toLowerCase().includes("moonscreen") &&
      reply.toLowerCase().includes("barrier repair")
    ) {
      console.log("✅ Case 2: 'I want an overnight recovery balm.' → Recommended Moonscreen.");
      passed++;
    } else {
      throw new Error(`Failed to recommend Moonscreen. Got: ${rec.recommendedProduct}`);
    }
  } catch (err: any) {
    console.error("❌ Case 2 FAILED:", err.message);
    failed++;
  }

  // Case 3: "I need a morning routine and nighttime recovery." → Both
  try {
    const q = "I need a morning routine and nighttime recovery.";
    const guard = evaluateGuardrails(q);
    const rec = evaluateRecommendation(q);
    const reply = getDeterministicRecommendationResponse(rec);

    if (
      guard.action === "allow" &&
      rec.recommendedProduct === "both" &&
      reply.includes("Glowscreen") &&
      reply.includes("Moonscreen")
    ) {
      console.log("✅ Case 3: 'I need a morning routine and nighttime recovery.' → Recommended Both.");
      passed++;
    } else {
      throw new Error(`Failed to recommend Both. Got: ${rec.recommendedProduct}`);
    }
  } catch (err: any) {
    console.error("❌ Case 3 FAILED:", err.message);
    failed++;
  }

  // Case 4: "I have oily skin and travel a lot." → Do not claim verified oily-skin suitability
  try {
    const q = "I have oily skin and travel a lot.";
    const guard = evaluateGuardrails(q);
    const rec = evaluateRecommendation(q);
    const reply = getDeterministicRecommendationResponse(rec);

    const avoidsClaim =
      reply.toLowerCase().includes("not been clinically verified") ||
      reply.toLowerCase().includes("unverified");
    const mentionsTravel = reply.toLowerCase().includes("travel");

    if (guard.action === "allow" && rec.unverifiedSkinType === "oily skin" && avoidsClaim && mentionsTravel) {
      console.log("✅ Case 4: 'I have oily skin and travel a lot.' → Avoided claiming verified oily skin suitability.");
      passed++;
    } else {
      throw new Error(`Failed oily skin disclaimer check. Reply: ${reply}`);
    }
  } catch (err: any) {
    console.error("❌ Case 4 FAILED:", err.message);
    failed++;
  }

  // Case 5: "Which stick is best for me?" → Ask a follow-up question
  try {
    const q = "Which stick is best for me?";
    const guard = evaluateGuardrails(q);
    const rec = evaluateRecommendation(q);

    if (
      guard.action === "allow" &&
      rec.needsClarification &&
      rec.clarificationQuestion &&
      rec.clarificationQuestion.includes("?")
    ) {
      console.log("✅ Case 5: 'Which stick is best for me?' → Asked follow-up question.");
      passed++;
    } else {
      throw new Error(`Failed to ask clarification. NeedsClarification: ${rec.needsClarification}`);
    }
  } catch (err: any) {
    console.error("❌ Case 5 FAILED:", err.message);
    failed++;
  }

  // Case 6: "Can I use Moonscreen with retinol?" → Respect existing safety and uncertainty routing
  try {
    const q = "Can I use Moonscreen with retinol?";
    const guard = evaluateGuardrails(q);

    if (guard.action === "handoff_required" && guard.reason === "unverified_information") {
      console.log("✅ Case 6: 'Can I use Moonscreen with retinol?' → Guardrail caught unverified active compatibility.");
      passed++;
    } else {
      throw new Error(`Failed guardrail precedence on retinol. Got action: ${guard.action}`);
    }
  } catch (err: any) {
    console.error("❌ Case 6 FAILED:", err.message);
    failed++;
  }

  // Case 7: "Is Glowscreen safe during pregnancy?" → Existing guardrail takes precedence
  try {
    const q = "Is Glowscreen safe during pregnancy?";
    const guard = evaluateGuardrails(q);

    if (guard.action === "handoff_required" && guard.reason === "pregnancy" && !guard.allowAIResponse) {
      console.log("✅ Case 7: 'Is Glowscreen safe during pregnancy?' → Existing guardrail took precedence.");
      passed++;
    } else {
      throw new Error(`Pregnancy guardrail check failed. Got: ${guard.reason}`);
    }
  } catch (err: any) {
    console.error("❌ Case 7 FAILED:", err.message);
    failed++;
  }

  // Case 8: "I got a rash after using Moonscreen." → Existing skin-reaction escalation takes precedence
  try {
    const q = "I got a rash after using Moonscreen.";
    const guard = evaluateGuardrails(q);

    if (guard.action === "handoff_required" && guard.reason === "skin_reaction" && !guard.allowAIResponse) {
      console.log("✅ Case 8: 'I got a rash after using Moonscreen.' → Skin-reaction escalation took precedence.");
      passed++;
    } else {
      throw new Error(`Skin reaction guardrail check failed. Got: ${guard.reason}`);
    }
  } catch (err: any) {
    console.error("❌ Case 8 FAILED:", err.message);
    failed++;
  }

  // Case 9: "Will Glowscreen make me fairer?" → Do not promise skin-lightening results
  try {
    const q = "Will Glowscreen make me fairer?";
    const search = searchFAQ(q);
    const mockGroq = createMockGroq(
      "No. SKIPD does not make fairness or skin-lightening claims. Glowscreen provides hydration, SPF 50+ protection, and a natural glow."
    );
    const reply = await generateChatResponse(q, search.matches, { groqClient: mockGroq.client });

    const doesNotPromiseFairness =
      reply.toLowerCase().includes("does not make fairness") ||
      reply.toLowerCase().includes("not make fairness") ||
      !reply.toLowerCase().includes("will make you fairer");

    if (search.topMatch?.id === "faq-fairness-16" && doesNotPromiseFairness) {
      console.log("✅ Case 9: 'Will Glowscreen make me fairer?' → Matched fairness FAQ & refused lightening claims.");
      passed++;
    } else {
      throw new Error(`Failed fairness test. TopMatch: ${search.topMatch?.id}, Reply: ${reply}`);
    }
  } catch (err: any) {
    console.error("❌ Case 9 FAILED:", err.message);
    failed++;
  }

  // Case 10: "Is Glowscreen sweat-proof?" → Do not make an unverified performance claim
  try {
    const q = "Is Glowscreen sweat-proof?";
    const guard = evaluateGuardrails(q);

    if (guard.action === "handoff_required" && guard.reason === "unverified_information") {
      console.log("✅ Case 10: 'Is Glowscreen sweat-proof?' → Intercepted unverified sweat-proof claim.");
      passed++;
    } else {
      throw new Error(`Sweatproof claim check failed. Action: ${guard.action}, Reason: ${guard.reason}`);
    }
  } catch (err: any) {
    console.error("❌ Case 10 FAILED:", err.message);
    failed++;
  }

  // Case 11: "I travel frequently and need a simple morning routine." → Explain Glowscreen's verified morning purpose without inventing airline compliance
  try {
    const q = "I travel frequently and need a simple morning routine.";
    const guard = evaluateGuardrails(q);
    const rec = evaluateRecommendation(q);
    const reply = getDeterministicRecommendationResponse(rec);

    const explainsGlowscreen = reply.toLowerCase().includes("glowscreen") && reply.includes("SPF 50+");
    const noAirlinePromise = !reply.toLowerCase().includes("cabin approved") && !reply.toLowerCase().includes("guaranteed on flight");

    if (guard.action === "allow" && rec.recommendedProduct === "glowscreen" && explainsGlowscreen && noAirlinePromise) {
      console.log("✅ Case 11: 'I travel frequently and need a simple morning routine.' → Verified morning purpose without airline guarantees.");
      passed++;
    } else {
      throw new Error(`Failed travel morning routine check. Reply: ${reply}`);
    }
  } catch (err: any) {
    console.error("❌ Case 11 FAILED:", err.message);
    failed++;
  }

  // Case 12: "I need help with both mornings and overnight recovery." → Explain distinct purposes of both products
  try {
    const q = "I need help with both mornings and overnight recovery.";
    const guard = evaluateGuardrails(q);
    const rec = evaluateRecommendation(q);
    const reply = getDeterministicRecommendationResponse(rec);

    const explainsBoth =
      rec.recommendedProduct === "both" &&
      reply.includes("Glowscreen (AM)") &&
      reply.includes("Moonscreen (PM)");

    if (guard.action === "allow" && explainsBoth) {
      console.log("✅ Case 12: 'I need help with both mornings and overnight recovery.' → Explained distinct purposes of both products.");
      passed++;
    } else {
      throw new Error(`Failed dual routine test. Product: ${rec.recommendedProduct}, Reply: ${reply}`);
    }
  } catch (err: any) {
    console.error("❌ Case 12 FAILED:", err.message);
    failed++;
  }

  // Case 13: Mock Groq integration for recommendation explanation
  try {
    const q = "I need SPF for my morning routine.";
    const rec = evaluateRecommendation(q);
    const mockGroq = createMockGroq(
      "For your morning routine, Glowscreen is the perfect stick! It combines hydration, SPF 50+, and a healthy glow in one swipe."
    );
    const reply = await generateRecommendationExplanation(q, rec, { groqClient: mockGroq.client });

    if (mockGroq.getCount() === 1 && reply.includes("Glowscreen")) {
      console.log("✅ Case 13: Mock Groq explanation generator invoked exactly 1 time with recommendation context.");
      passed++;
    } else {
      throw new Error(`Mock Groq invocation failed. Calls: ${mockGroq.getCount()}`);
    }
  } catch (err: any) {
    console.error("❌ Case 13 FAILED:", err.message);
    failed++;
  }

  console.log(`\n=================================================`);
  console.log(`Recommendation Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("\n--- ALL RECOMMENDATION TESTS PASSED SUCCESSFULLY ---");
  }
}

runRecommendationTests().catch((e) => {
  console.error("Fatal error running recommendation tests:", e);
  process.exit(1);
});
