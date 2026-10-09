/**
 * Seed Demo Products for SKIPD Shopify Development Store
 *
 * Adds the two verified SKIPD demo products:
 * 1. Glowscreen (Price: ₹1,500) - SPF 50+ multifunctional morning glow stick
 * 2. Moonscreen (Price: ₹1,500) - Overnight recovery balm
 *
 * Strict Knowledge Boundaries Applied:
 * - No invented ingredients
 * - No clinical testing claims
 * - No medical claims
 * - No fake product reviews
 * - No sweat-proof / water-resistant claims
 * - No unverified skin-type suitability claims
 *
 * Usage:
 *   SHOPIFY_STORE_DOMAIN="your-dev-store.myshopify.com" \
 *   SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_xxxx" \
 *   node seed-demo-products.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Load .env.local or .env if present in root or current directory
function loadEnvFile() {
  const possiblePaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "..", ".env.local"),
    path.resolve(__dirname, "..", ".env"),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf8");
        content.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [k, ...v] = trimmed.split("=");
            const key = k.trim();
            const val = v.join("=").trim().replace(/^["']|["']$/g, "");
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        break;
      } catch (_) {}
    }
  }
}
loadEnvFile();

const DEMO_PRODUCTS = [
  {
    title: "Glowscreen SPF 50+ Morning Glow Stick",
    bodyHtml:
      "<p><strong>Multifunctional morning glow stick</strong> combining hydration, broad-spectrum sun protection (SPF 50+), and a healthy, dewy finish.</p>" +
      "<p>Designed for daily morning routines and warm climate convenience.</p>" +
      "<p><em>[DEMO PRODUCT PLACEHOLDER — For Development Storefront Testing Only]</em></p>",
    vendor: "SKIPD Demo",
    productType: "Sunscreen & Moisturiser Stick",
    tags: ["demo", "morning-routine", "spf50", "skipcare"],
    price: "1500.00",
    sku: "SKP-GLOW-50",
  },
  {
    title: "Moonscreen Overnight Recovery Balm",
    bodyHtml:
      "<p><strong>Overnight recovery balm</strong> formulated for barrier repair and recovery while smoothing the appearance of fine lines.</p>" +
      "<p>Rich, restorative nighttime balm stick designed for evening skincare routines.</p>" +
      "<p><em>[DEMO PRODUCT PLACEHOLDER — For Development Storefront Testing Only]</em></p>",
    vendor: "SKIPD Demo",
    productType: "Overnight Recovery Balm",
    tags: ["demo", "night-routine", "barrier-repair", "skipcare"],
    price: "1500.00",
    sku: "SKP-MOON-REC",
  },
];

async function seedProducts() {
  let storeDomain = (process.env.SHOPIFY_STORE_DOMAIN || "").trim();
  storeDomain = storeDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const accessToken = (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "").trim();

  console.log("==================================================");
  console.log("   SKIPD Shopify Dev Store Product Seeding Tool   ");
  console.log("==================================================\n");

  if (!storeDomain || !accessToken) {
    console.log("ℹ️  Store credentials not provided in environment variables.");
    console.log("   To automatically seed to your store via GraphQL Admin API, run:");
    console.log('   SHOPIFY_STORE_DOMAIN="your-store.myshopify.com" \\');
    console.log('   SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_xxxx" \\');
    console.log("   node seed-demo-products.js\n");
    console.log("--- MANUAL CREATION DETAILS FOR SHOPIFY DEV DASHBOARD ---");
    DEMO_PRODUCTS.forEach((p, idx) => {
      console.log(`\nProduct #${idx + 1}:`);
      console.log(`- Title:       ${p.title}`);
      console.log(`- Price:       ₹${p.price}`);
      console.log(`- Product Type:${p.productType}`);
      console.log(`- Tags:        ${p.tags.join(", ")}`);
      console.log(`- SKU:         ${p.sku}`);
      console.log(`- Description: ${p.bodyHtml.replace(/<[^>]+>/g, " ").trim()}`);
    });
    console.log("\n==================================================");
    return;
  }

  console.log(`Connecting to store: ${storeDomain}...`);

  for (const product of DEMO_PRODUCTS) {
    console.log(`Creating product: "${product.title}"...`);
    const query = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        title: product.title,
        descriptionHtml: product.bodyHtml,
        vendor: product.vendor,
        productType: product.productType,
        tags: product.tags,
        variants: [
          {
            price: product.price,
            sku: product.sku,
          },
        ],
      },
    };

    try {
      const response = await postGraphQL(storeDomain, accessToken, query, variables);
      if (response.data && response.data.productCreate) {
        const { product: createdProduct, userErrors } = response.data.productCreate;
        if (userErrors && userErrors.length > 0) {
          console.error(`❌ Errors creating ${product.title}:`, userErrors);
        } else {
          console.log(`✅ Created ${createdProduct.title} (ID: ${createdProduct.id})`);
        }
      } else {
        console.error("❌ Unexpected response:", response);
      }
    } catch (err) {
      console.error(`❌ Failed to create product ${product.title}:`, err.message);
    }
  }

  console.log("\nSeeding finished!");
}

function postGraphQL(domain, token, query, variables) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const options = {
      hostname: domain,
      path: "/admin/api/2025-01/graphql.json",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(data);
    req.end();
  });
}

if (require.main === module) {
  seedProducts();
}

module.exports = { DEMO_PRODUCTS, seedProducts };
