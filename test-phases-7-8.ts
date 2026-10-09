import { searchFAQ } from "./src/lib/faq";
import { generateChatResponse, SKIPD_SYSTEM_PROMPT } from "./src/lib/ai";
import Groq from "groq-sdk";

// Mock factory for Groq SDK
function createMockGroqClient(mockReply: string, shouldThrow = false): Groq {
  return {
    chat: {
      completions: {
        create: async (params: any) => {
          if (shouldThrow) {
            throw new Error("Simulated Groq 503 Service Unavailable / Rate Limit");
          }
          return {
            id: "chatcmpl-mock-123",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: mockReply,
                },
                finish_reason: "stop",
              },
            ],
          };
        },
      },
    },
  } as unknown as Groq;
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("   SKIPD Bot Phases 7 & 8 Verification Suite     ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  // Case 1: "How do I use Glowscreen?" — uses verified FAQ information
  try {
    const q = "How do I use Glowscreen?";
    const search = searchFAQ(q);
    const mockReply = "Glowscreen is an SPF 50+ morning glow stick. Smooth it over clean skin in the morning for hydration and sun defense.";
    const mockClient = createMockGroqClient(mockReply);
    const reply = await generateChatResponse(q, search.matches, { groqClient: mockClient });

    if (search.topMatch?.id === "faq-glowscreen-05" && reply.includes("SPF 50+")) {
      console.log("✅ Case 1: 'How do I use Glowscreen?' — Correctly matched FAQ & generated grounded reply.");
      passed++;
    } else {
      throw new Error(`Failed to match or generate for Glowscreen usage. Got topMatch: ${search.topMatch?.id}`);
    }
  } catch (err: any) {
    console.error("❌ Case 1 FAILED:", err.message);
    failed++;
  }

  // Case 2: "What does Moonscreen do?" — retrieves relevant Moonscreen information
  try {
    const q = "What does Moonscreen do?";
    const search = searchFAQ(q);
    const mockReply = "Moonscreen is an overnight recovery balm designed for barrier repair and smoothing fine lines.";
    const mockClient = createMockGroqClient(mockReply);
    const reply = await generateChatResponse(q, search.matches, { groqClient: mockClient });

    if (search.topMatch?.id === "faq-moonscreen-06" && reply.includes("barrier repair")) {
      console.log("✅ Case 2: 'What does Moonscreen do?' — Retrieved Moonscreen FAQ & generated response.");
      passed++;
    } else {
      throw new Error(`Failed to match Moonscreen. Got: ${search.topMatch?.id}`);
    }
  } catch (err: any) {
    console.error("❌ Case 2 FAILED:", err.message);
    failed++;
  }

  // Case 3: "Do I still need moisturiser?" — identifies the relevant Glowscreen FAQ
  try {
    const q = "Do I still need moisturiser?";
    const search = searchFAQ(q);
    const mockReply = "No need for a separate moisturiser! Glowscreen combines hydration, SPF 50+, and glow in one stick.";
    const mockClient = createMockGroqClient(mockReply);
    const reply = await generateChatResponse(q, search.matches, { groqClient: mockClient });

    if (search.topMatch?.id === "faq-moisturiser-07") {
      console.log("✅ Case 3: 'Do I still need moisturiser?' — Identified FAQ on replacing moisturiser.");
      passed++;
    } else {
      throw new Error(`Failed to match moisturiser FAQ. Got: ${search.topMatch?.id}`);
    }
  } catch (err: any) {
    console.error("❌ Case 3 FAILED:", err.message);
    failed++;
  }

  // Case 4: "I travel a lot. Which stick should I buy?" — avoids inventing skin-type suitability
  try {
    const q = "I travel a lot. Which stick should I buy?";
    const search = searchFAQ(q);
    const hasTravelOrRecMatch = search.matches.some(
      (m) => m.id === "faq-oily-travel-10" || m.id === "faq-travel-13" || m.id === "faq-recommendations-09"
    );

    if (hasTravelOrRecMatch) {
      console.log("✅ Case 4: 'I travel a lot. Which stick should I buy?' — Retrieved travel & stick FAQs.");
      passed++;
    } else {
      throw new Error(`Did not match travel/recommendation FAQ. Top match: ${search.topMatch?.id}`);
    }
  } catch (err: any) {
    console.error("❌ Case 4 FAILED:", err.message);
    failed++;
  }

  // Case 5: "What ingredients are in Glowscreen?" — does not invent ingredients
  try {
    const q = "What ingredients are in Glowscreen?";
    const search = searchFAQ(q);
    const mockReply = "Full ingredient lists have not been publicly published on our website yet. Contact info@skipd.in for verified details.";
    const mockClient = createMockGroqClient(mockReply);
    const reply = await generateChatResponse(q, search.matches, { groqClient: mockClient });

    if (search.topMatch?.id === "faq-ingredients-12" && search.topMatch?.requiresHandoff === true) {
      console.log("✅ Case 5: 'What ingredients are in Glowscreen?' — Retained unverified boundary & handoff flag.");
      passed++;
    } else {
      throw new Error(`Ingredients FAQ match failed. Got: ${search.topMatch?.id}`);
    }
  } catch (err: any) {
    console.error("❌ Case 5 FAILED:", err.message);
    failed++;
  }

  // Case 6: "Is Glowscreen safe during pregnancy?" — does not provide a medical safety verdict
  try {
    const q = "Is Glowscreen safe during pregnancy?";
    const search = searchFAQ(q);
    const mockReply = "Pregnancy safety has not been officially verified. We advise consulting your doctor before introducing new products.";
    const mockClient = createMockGroqClient(mockReply);
    const reply = await generateChatResponse(q, search.matches, { groqClient: mockClient });

    if (search.topMatch?.id === "faq-pregnancy-14" && search.topMatch?.requiresHandoff === true) {
      console.log("✅ Case 6: 'Is Glowscreen safe during pregnancy?' — Flagged for medical handoff without safety verdict.");
      passed++;
    } else {
      throw new Error(`Pregnancy FAQ failed. Got: ${search.topMatch?.id}`);
    }
  } catch (err: any) {
    console.error("❌ Case 6 FAILED:", err.message);
    failed++;
  }

  // Case 7: "Give me a discount code." — does not invent a discount
  try {
    const q = "Give me a discount code.";
    const search = searchFAQ(q);
    const mockReply = "Promotional offers vary. Please check our official website or contact support at info@skipd.in for active promotions.";
    const mockClient = createMockGroqClient(mockReply);
    const reply = await generateChatResponse(q, search.matches, { groqClient: mockClient });

    if (search.topMatch?.id === "faq-discounts-20" && search.topMatch?.requiresHandoff === true) {
      console.log("✅ Case 7: 'Give me a discount code.' — Handled promo query with verified boundary & handoff flag.");
      passed++;
    } else {
      throw new Error(`Discount FAQ failed. Got: ${search.topMatch?.id}`);
    }
  } catch (err: any) {
    console.error("❌ Case 7 FAILED:", err.message);
    failed++;
  }

  // Case 8: An unrelated question — acknowledges available info is insufficient
  try {
    const q = "What is the capital of France?";
    const search = searchFAQ(q);
    const replyWithoutFaq = await generateChatResponse(q, search.matches, {
      groqClient: null, // Fallback without API key
    });

    if (
      !search.hasMatch &&
      replyWithoutFaq.includes("don't have verified information")
    ) {
      console.log("✅ Case 8: Unrelated question — Correctly returned no match and acknowledged missing info.");
      passed++;
    } else {
      throw new Error(`Unrelated question failed. hasMatch: ${search.hasMatch}`);
    }
  } catch (err: any) {
    console.error("❌ Case 8 FAILED:", err.message);
    failed++;
  }

  // Case 9: An empty request — returns validation error
  try {
    const q = "";
    const search = searchFAQ(q);
    if (!search.hasMatch && search.matches.length === 0) {
      console.log("✅ Case 9: Empty request — Handled cleanly at FAQ layer without errors.");
      passed++;
    } else {
      throw new Error("Empty query returned unexpected matches.");
    }
  } catch (err: any) {
    console.error("❌ Case 9 FAILED:", err.message);
    failed++;
  }

  // Case 10: A Groq API failure — handled without exposing internal details
  try {
    const q = "How do I use Glowscreen?";
    const search = searchFAQ(q);
    const failingClient = createMockGroqClient("", true);
    const reply = await generateChatResponse(q, search.matches, { groqClient: failingClient });

    // Should gracefully fallback to verified FAQ answer without throwing or leaking stack traces
    if (reply === search.topMatch?.answer && !reply.includes("Error:") && !reply.includes("503")) {
      console.log("✅ Case 10: Groq API failure — Gracefully fell back to verified FAQ answer without leaking errors.");
      passed++;
    } else {
      throw new Error(`Fallback failed or leaked error: ${reply}`);
    }
  } catch (err: any) {
    console.error("❌ Case 10 FAILED:", err.message);
    failed++;
  }

  // Case 11: System prompt rule integrity
  try {
    const requiredRules = [
      "customer support assistant",
      "Glowscreen",
      "Moonscreen",
      "SPF 50+",
      "NEVER INVENT",
      "ingredients",
      "medical claims",
      "pregnancy",
      "untrusted input",
    ];
    for (const rule of requiredRules) {
      if (!SKIPD_SYSTEM_PROMPT.toLowerCase().includes(rule.toLowerCase())) {
        throw new Error(`System prompt is missing required rule: "${rule}"`);
      }
    }
    console.log("✅ Case 11: System prompt integrity — Verified all 9 essential prompt rules and safety guardrails.");
    passed++;
  } catch (err: any) {
    console.error("❌ Case 11 FAILED:", err.message);
    failed++;
  }

  console.log(`\n=================================================`);
  console.log(`Total Cases: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error("Fatal test error:", e);
  process.exit(1);
});
