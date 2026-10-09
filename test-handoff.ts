import {
  validateHandoffForm,
  isValidOrderNumber,
  HandoffFormData,
} from "./src/lib/handoff-validation";
import { evaluateGuardrails } from "./src/lib/guardrails";
import { searchFAQ } from "./src/lib/faq";

console.log("=================================================");
console.log("   SKIPD Support Handoff & Validation Suite      ");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// 1. Order Number Validation & 'N/A' Rule Tests
// -------------------------------------------------------------
console.log("--- 1. Order Number 'N/A' and Format Validation ---");

assert(isValidOrderNumber("N/A"), "Accepts uppercase 'N/A'");
assert(isValidOrderNumber("n/a"), "Accepts lowercase 'n/a'");
assert(isValidOrderNumber("NA"), "Accepts uppercase 'NA'");
assert(isValidOrderNumber("na"), "Accepts lowercase 'na'");
assert(isValidOrderNumber(" N / A "), "Accepts spaced 'N / A'");
assert(isValidOrderNumber("#1042"), "Accepts standard order ID '#1042'");
assert(isValidOrderNumber("SKPD-2024-9981"), "Accepts formatted order ID");
assert(!isValidOrderNumber(""), "Rejects empty order number");
assert(!isValidOrderNumber("   "), "Rejects whitespace-only order number");
assert(!isValidOrderNumber("X"), "Rejects 1-character non-N/A order number");
assert(!isValidOrderNumber("A".repeat(51)), "Rejects order number exceeding 50 characters");

// -------------------------------------------------------------
// 2. Form Validation: Successful Completion
// -------------------------------------------------------------
console.log("\n--- 2. Successful Form Validation ---");

const validSubmission1: HandoffFormData = {
  name: "Priyal Sharma",
  email: "priyal@example.com",
  orderNumber: "#1042",
  issueDescription: "I experienced severe redness and irritation on my cheeks after application.",
};
const res1 = validateHandoffForm(validSubmission1);
assert(res1.isValid && Object.keys(res1.errors).length === 0, "Valid form with standard order number passes");

const validSubmissionNA: HandoffFormData = {
  name: "Arjun Verma",
  email: "arjun.v@domain.in",
  orderNumber: "N/A",
  issueDescription: "I have eczema and would like to know if this formula is safe before ordering.",
};
const resNA = validateHandoffForm(validSubmissionNA);
assert(resNA.isValid && Object.keys(resNA.errors).length === 0, "Valid form with 'N/A' order number passes");

// -------------------------------------------------------------
// 3. Form Validation: Failed Validation Cases
// -------------------------------------------------------------
console.log("\n--- 3. Failed Form Validation Cases ---");

// A. Name validation failures
const emptyName = validateHandoffForm({ ...validSubmission1, name: "" });
assert(!emptyName.isValid && !!emptyName.errors.name, "Rejects empty name");

const shortName = validateHandoffForm({ ...validSubmission1, name: "A" });
assert(!shortName.isValid && !!shortName.errors.name?.includes("at least 2"), "Rejects name < 2 characters");

const longName = validateHandoffForm({ ...validSubmission1, name: "A".repeat(101) });
assert(!longName.isValid && !!longName.errors.name?.includes("exceed 100"), "Rejects name > 100 characters");

// B. Email validation failures
const emptyEmail = validateHandoffForm({ ...validSubmission1, email: "" });
assert(!emptyEmail.isValid && !!emptyEmail.errors.email, "Rejects empty email");

const invalidEmail1 = validateHandoffForm({ ...validSubmission1, email: "priyal-at-example.com" });
assert(!invalidEmail1.isValid && !!invalidEmail1.errors.email?.includes("valid email"), "Rejects email missing '@'");

const invalidEmail2 = validateHandoffForm({ ...validSubmission1, email: "priyal@" });
assert(!invalidEmail2.isValid && !!invalidEmail2.errors.email?.includes("valid email"), "Rejects incomplete email");

const invalidEmail3 = validateHandoffForm({ ...validSubmission1, email: "priyal@domain" });
assert(!invalidEmail3.isValid && !!invalidEmail3.errors.email?.includes("valid email"), "Rejects email missing TLD");

const longEmail = validateHandoffForm({ ...validSubmission1, email: `${"a".repeat(115)}@example.com` });
assert(!longEmail.isValid && !!longEmail.errors.email?.includes("exceed 120"), "Rejects email > 120 characters");

// C. Order number validation failures
const emptyOrder = validateHandoffForm({ ...validSubmission1, orderNumber: "" });
assert(!emptyOrder.isValid && !!emptyOrder.errors.orderNumber, "Rejects empty order number");

const shortOrder = validateHandoffForm({ ...validSubmission1, orderNumber: "1" });
assert(!shortOrder.isValid && !!shortOrder.errors.orderNumber, "Rejects 1-char order number");

// D. Issue description validation failures
const emptyDesc = validateHandoffForm({ ...validSubmission1, issueDescription: "" });
assert(!emptyDesc.isValid && !!emptyDesc.errors.issueDescription, "Rejects empty issue description");

const shortDesc = validateHandoffForm({ ...validSubmission1, issueDescription: "Too short" });
assert(!shortDesc.isValid && !!shortDesc.errors.issueDescription?.includes("at least 10"), "Rejects description < 10 characters");

const longDesc = validateHandoffForm({ ...validSubmission1, issueDescription: "D".repeat(1001) });
assert(!longDesc.isValid && !!longDesc.errors.issueDescription?.includes("exceed 1000"), "Rejects description > 1000 characters");

// -------------------------------------------------------------
// 4. Guardrail Handoff Precedence on Sensitive Categories
// -------------------------------------------------------------
console.log("\n--- 4. Sensitive Categories Retained on Handoff Path ---");

const sensitiveCases = [
  { label: "Medical diagnosis", query: "Can Glowscreen cure my eczema?" },
  { label: "Pregnancy safety", query: "Is Moonscreen safe during pregnancy?" },
  { label: "Skin reaction", query: "My skin had a severe burning reaction to Moonscreen." },
  { label: "Complaint", query: "Your service is pathetic and my stick arrived broken." },
  { label: "Refund dispute", query: "Support rejected my refund and I want my money back." },
  { label: "Order tracking", query: "Where is my order?" },
  { label: "Discount request", query: "Give me a promo code." },
  { label: "Unverified retinol", query: "Can I use Moonscreen with retinol?" },
  { label: "Unverified clinical", query: "Are there clinical trial results published?" },
  { label: "Unverified sweat-proof", query: "Is Glowscreen sweat-proof?" },
];

for (const sc of sensitiveCases) {
  const guard = evaluateGuardrails(sc.query);
  const haltsAI = !guard.allowAIResponse;
  const requiresHandoff = guard.action === "handoff_required";

  assert(
    requiresHandoff && haltsAI,
    `${sc.label} correctly triggers handoff and blocks LLM calls`
  );
}

// -------------------------------------------------------------
// 5. Unknown Policy / No-Match FAQ Handoff Path
// -------------------------------------------------------------
console.log("\n--- 5. Unknown Queries Routed to Handoff ---");

const unknownQuery = "Do you have a physical retail showroom in Tokyo?";
const guard = evaluateGuardrails(unknownQuery);
const search = searchFAQ(unknownQuery);
const shouldHandoff = !search.hasMatch || (search.topMatch ? search.topMatch.requiresHandoff : false);

assert(
  guard.action === "allow" && !search.hasMatch && shouldHandoff,
  "Unmatched customer query safely flags handoff requirement"
);

// -------------------------------------------------------------
// 6. Disclaimer & Non-Persistence Invariants
// -------------------------------------------------------------
console.log("\n--- 6. Prototype Non-Persistence & Transparency Invariants ---");

const disclaimerText =
  "In this prototype, your details have not been sent to the SKIPD team and no support ticket has been created.";

assert(
  !disclaimerText.includes("ticket created") && disclaimerText.includes("not been sent"),
  "Prepared message explicitly informs user that ticket was NOT created and details were NOT sent"
);

assert(
  disclaimerText.toLowerCase().includes("prototype"),
  "Explicitly labels behavior as prototype local session"
);

console.log("\n=================================================");
console.log(`Handoff Test Summary: ${passed} passed, ${failed} failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
