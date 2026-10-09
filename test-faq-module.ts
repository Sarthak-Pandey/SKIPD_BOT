import { searchFAQ, getAllFAQs } from "./src/lib/faq";

interface TestCase {
  name: string;
  query: string;
  expectMatch: boolean;
  expectedFaqId?: string;
  expectedHandoff?: boolean;
}

const testCases: TestCase[] = [
  {
    name: "1. Known FAQ: How do I use Glowscreen?",
    query: "How do I use Glowscreen?",
    expectMatch: true,
    expectedFaqId: "faq-glowscreen-05",
    expectedHandoff: false,
  },
  {
    name: "2. Different wording: What does Moonscreen do?",
    query: "What does Moonscreen do?",
    expectMatch: true,
    expectedFaqId: "faq-moonscreen-06",
    expectedHandoff: false,
  },
  {
    name: "3. Different wording: Do I still need moisturiser?",
    query: "Do I still need moisturiser?",
    expectMatch: true,
    expectedFaqId: "faq-moisturiser-07",
    expectedHandoff: false,
  },
  {
    name: "4. Wording variant: I travel a lot. Which stick should I buy?",
    query: "I travel a lot. Which stick should I buy?",
    expectMatch: true,
    expectedFaqId: "faq-oily-travel-10",
  },
  {
    name: "5. Ingredients inquiry: What ingredients are in Glowscreen?",
    query: "What ingredients are in Glowscreen?",
    expectMatch: true,
    expectedFaqId: "faq-ingredients-12",
    expectedHandoff: true,
  },
  {
    name: "6. Sensitive FAQ (Pregnancy): Is Glowscreen safe during pregnancy?",
    query: "Is Glowscreen safe during pregnancy?",
    expectMatch: true,
    expectedFaqId: "faq-pregnancy-14",
    expectedHandoff: true,
  },
  {
    name: "7. Sensitive FAQ (Skin reaction): My skin had a reaction and burns",
    query: "My skin had a reaction and burns",
    expectMatch: true,
    expectedFaqId: "faq-reaction-15",
    expectedHandoff: true,
  },
  {
    name: "8. Promotional / Discount: Give me a discount code.",
    query: "Give me a discount code.",
    expectMatch: true,
    expectedFaqId: "faq-discounts-20",
    expectedHandoff: true,
  },
  {
    name: "9. Irrelevant question: What is the capital of France?",
    query: "What is the capital of France?",
    expectMatch: false,
  },
  {
    name: "10. Empty query: empty string",
    query: "",
    expectMatch: false,
  },
  {
    name: "11. Whitespace query: whitespace only",
    query: "    ",
    expectMatch: false,
  },
  {
    name: "12. Order tracking: Where is my order?",
    query: "Where is my order?",
    expectMatch: true,
    expectedFaqId: "faq-tracking-02",
    expectedHandoff: true,
  },
];

console.log("=== Testing FAQ Search Module (src/lib/faq.ts) ===\n");

const allFaqs = getAllFAQs();
console.log(`Loaded ${allFaqs.length} total FAQ records from source of truth.\n`);

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = searchFAQ(tc.query);

  if (tc.expectMatch) {
    if (!result.hasMatch || !result.topMatch) {
      console.error(`❌ FAILED: ${tc.name}`);
      console.error(`   Query: "${tc.query}" expected a match, but got none.`);
      failed++;
      continue;
    }

    if (tc.expectedFaqId && result.topMatch.id !== tc.expectedFaqId) {
      // Check if the expected ID is at least among the top matches
      const foundInMatches = result.matches.some((m) => m.id === tc.expectedFaqId);
      if (!foundInMatches) {
        console.error(`❌ FAILED: ${tc.name}`);
        console.error(`   Expected ID: ${tc.expectedFaqId}, Top Match: ${result.topMatch.id} (${result.topMatch.question})`);
        failed++;
        continue;
      }
    }

    if (tc.expectedHandoff !== undefined && result.topMatch.requiresHandoff !== tc.expectedHandoff) {
      console.error(`❌ FAILED: ${tc.name}`);
      console.error(`   Expected requiresHandoff: ${tc.expectedHandoff}, Got: ${result.topMatch.requiresHandoff}`);
      failed++;
      continue;
    }

    console.log(`✅ PASSED: ${tc.name}`);
    console.log(`   Matched: [${result.topMatch.id}] Score: ${result.topMatch.score} | Q: "${result.topMatch.question}"`);
    passed++;
  } else {
    if (result.hasMatch) {
      console.error(`❌ FAILED: ${tc.name}`);
      console.error(`   Expected NO match, but got: [${result.topMatch?.id}] Score: ${result.topMatch?.score}`);
      failed++;
    } else {
      console.log(`✅ PASSED: ${tc.name} (Correctly returned no match)`);
      passed++;
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n--- ALL FAQ SEARCH TESTS PASSED SUCCESSFULLY ---");
}
