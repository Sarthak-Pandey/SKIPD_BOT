const fs = require('fs');
const path = require('path');

// 1. Verify product-facts.md
const factsPath = path.join(__dirname, 'src', 'data', 'product-facts.md');
if (!fs.existsSync(factsPath)) {
  console.error('FAIL: src/data/product-facts.md does not exist!');
  process.exit(1);
}
const factsContent = fs.readFileSync(factsPath, 'utf8');
const requiredFacts = [
  'Glowscreen',
  'SPF 50+',
  'Moonscreen',
  'recovery balm',
  'fine lines',
  'Unknown or Unverified Information',
  'Ingredient lists',
  'delivery timelines',
  'return',
  'refund',
  'retinol',
  'sweat-proof',
  'pregnancy'
];
for (const fact of requiredFacts) {
  if (!factsContent.toLowerCase().includes(fact.toLowerCase())) {
    console.error(`FAIL: product-facts.md missing key term: "${fact}"`);
    process.exit(1);
  }
}
console.log('PASS: product-facts.md verified and contains all required sections and terms.');

// 2. Verify faq.json
const faqPath = path.join(__dirname, 'src', 'data', 'faq.json');
if (!fs.existsSync(faqPath)) {
  console.error('FAIL: src/data/faq.json does not exist!');
  process.exit(1);
}

const faqRaw = fs.readFileSync(faqPath, 'utf8');
let faqs;
try {
  faqs = JSON.parse(faqRaw);
} catch (e) {
  console.error('FAIL: faq.json is not valid JSON:', e.message);
  process.exit(1);
}

if (!Array.isArray(faqs)) {
  console.error('FAIL: faq.json root is not an array!');
  process.exit(1);
}

console.log(`Total FAQ entries found: ${faqs.length}`);
if (faqs.length < 22) {
  console.error(`FAIL: Expected at least 22 FAQs, found ${faqs.length}`);
  process.exit(1);
}

const requiredFields = ['id', 'category', 'question', 'answer', 'keywords', 'requiresHandoff'];
const seenIds = new Set();

for (let i = 0; i < faqs.length; i++) {
  const item = faqs[i];
  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === null) {
      console.error(`FAIL: Item at index ${i} is missing field "${field}"`);
      process.exit(1);
    }
  }

  if (typeof item.id !== 'string' || item.id.trim() === '') {
    console.error(`FAIL: Item at index ${i} has invalid ID`);
    process.exit(1);
  }

  if (seenIds.has(item.id)) {
    console.error(`FAIL: Duplicate ID found: "${item.id}"`);
    process.exit(1);
  }
  seenIds.add(item.id);

  if (!Array.isArray(item.keywords) || item.keywords.length === 0) {
    console.error(`FAIL: Item ${item.id} has invalid or empty keywords`);
    process.exit(1);
  }

  if (typeof item.requiresHandoff !== 'boolean') {
    console.error(`FAIL: Item ${item.id} requiresHandoff is not boolean`);
    process.exit(1);
  }
}

console.log('PASS: All entries have unique IDs and all required fields.');

// 3. Check topic coverage
const requiredTopics = [
  'shipping',
  'tracking',
  'refund',
  'payment',
  'glowscreen',
  'moonscreen',
  'moisturiser',
  'routine',
  'recommendation',
  'oily',
  'retinol',
  'ingredient',
  'travel',
  'pregnan',
  'reaction',
  'fairness',
  'clinical',
  'sweat',
  'layer',
  'discount'
];

const allText = JSON.stringify(faqs).toLowerCase();
for (const topic of requiredTopics) {
  if (!allText.includes(topic)) {
    console.error(`FAIL: Missing topic coverage for "${topic}"`);
    process.exit(1);
  }
}
console.log('PASS: All required topics are covered.');

// 4. Validate sensitive topics have requiresHandoff: true
const sensitiveKeywords = ['pregnan', 'reaction', 'retinol', 'clinical', 'dispute', 'damaged'];
for (const item of faqs) {
  const itemStr = (item.question + ' ' + item.answer).toLowerCase();
  for (const kw of sensitiveKeywords) {
    if (itemStr.includes(kw) && !item.requiresHandoff) {
      console.error(`FAIL: Item "${item.id}" contains sensitive topic "${kw}" but requiresHandoff is false!`);
      process.exit(1);
    }
  }
}
console.log('PASS: Sensitive topics properly have requiresHandoff = true.');

console.log('\n--- ALL KNOWLEDGE BASE VALIDATIONS PASSED ---');
