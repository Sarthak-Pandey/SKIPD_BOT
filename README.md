# SKIPD Customer Support Bot (`skipd-bot`)

> Automated customer support knowledge base, FAQ retrieval, deterministic guardrail engine, and AI response system for **SKIPD** ([skipd.in](https://www.skipd.in/)), an Indian skincare startup pioneering Skipcare™ with multifunctional formats designed for Indian skin and warm climates.

---

## 1. Project Purpose

This project implements the complete customer support bot pipeline across Phases 1 through 10:
- **Phase 1: Product Knowledge & Brand Research**: Source of truth document ([`src/data/product-facts.md`](src/data/product-facts.md)) covering brand identity, visual system, verified product specifications (Glowscreen & Moonscreen), and explicit boundaries for unverified policies.
- **Phase 2: Structured FAQ Knowledge Base**: 24 structured customer FAQ entries in standardized JSON format ([`src/data/faq.json`](src/data/faq.json)) with strict categorization and sensitive inquiry handoff flags.
- **Phase 3: Next.js Foundation**: Clean Next.js application setup with App Router, TypeScript, Tailwind CSS, and ESLint.
- **Phase 4: Architecture Organization**: Modular layout dividing UI components ([`src/components/`](src/components/)), shared TypeScript types ([`src/lib/chat-types.ts`](src/lib/chat-types.ts)), data files ([`src/data/`](src/data/)), and API route handlers ([`src/app/api/`](src/app/api/)).
- **Phase 5: SKIPD Chat Interface**: Responsive floating chat widget with brand colors (`#3C0C1C`, `#FFE6A9`, `#FFF8E7`), quick prompts, conversation bubbles, typing indicator, error handling, auto-scroll, and accessibility.
- **Phase 6: Backend Chat API**: Robust `POST /api/chat` Route Handler with JSON parsing validation, non-empty string checks, character limit enforcement, clear status codes (200, 400, 405, 500), and a structured response.
- **Phase 7: FAQ Knowledge Base Integration**: Reusable search module ([`src/lib/faq.ts`](src/lib/faq.ts)) with text normalization, keyword matching, question token overlap, configurable threshold, and no-match detection.
- **Phase 8: Groq AI Integration & Grounded Prompt**: Server-only module ([`src/lib/ai.ts`](src/lib/ai.ts)) applying the SKIPD system prompt, grounding answers strictly in retrieved FAQ reference context, handling timeouts, preventing prompt injection, and falling back safely when unconfigured or offline.
- **Phase 9: Guardrail Engine**: Deterministic rule-based safety layer ([`src/lib/guardrails.ts`](src/lib/guardrails.ts)) intercepting sensitive requests (pregnancy, skin reactions, medical questions, refund disputes, complaints, order tracking without live integration, discount requests, prompt injection, and unverified claims) *before* any LLM invocation, preventing hallucinated medical claims or fabricated policies.
- **Phase 10: Product Recommendation Engine**: Deterministic recommendation engine ([`src/lib/recommendation.ts`](src/lib/recommendation.ts)) recommending Glowscreen, Moonscreen, or both based on morning/night routine goals; asks clarifying questions when ambiguous; attaches unverified skin-type and airline disclaimers; strictly preserves safety guardrail precedence.
- **Phase 11: Support Handoff & Transparency Validation**: Robust form validation and client-side summary preparation with strict prototype non-persistence disclaimers.
- **Phase 12: Shopify Storefront Integration**: Official Shopify Theme App Extension (`shopify-app/`) with app embed block (`blocks/skipd-chat-embed.liquid`), responsive floating launcher, CORS allowlist, configurable backend URL, and demo products (Glowscreen and Moonscreen).

---

## 2. Directory Architecture

```
skipd_bot/
├── shopify-app/                        # Minimal Shopify App & Theme Extension Project
│   ├── shopify.app.toml                # App configuration (scopes, auth, webhooks)
│   ├── package.json                    # Shopify CLI scripts (dev, build, deploy)
│   ├── seed-demo-products.js           # Automated GraphQL product seeder for dev stores
│   └── extensions/
│       └── skipd-chat-theme-extension/ # Official Shopify Theme App Extension
│           ├── shopify.extension.toml  # Extension metadata (type = "theme")
│           ├── blocks/
│           │   └── skipd-chat-embed.liquid # App embed block for Shopify Theme Editor
│           ├── assets/
│           │   ├── skipd-chat-widget.js    # Idempotent vanilla JS client widget
│           │   └── skipd-chat-widget.css   # Scoped SKIPD styling and animations
│           └── locales/
│               └── en.default.json     # Extension strings & default translations
├── public/
│   ├── demo/                           # Placeholder SVGs for Glowscreen & Moonscreen
│   └── theme-extension/                # Publicly served theme assets for preview
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts           # POST /api/chat with CORS allowlist & OPTIONS preflight
│   │   ├── storefront-demo/page.tsx    # Shopify Storefront preview with demo products
│   │   ├── globals.css                 # Theme tokens, fonts, animations
│   │   ├── layout.tsx                  # Root HTML layout and metadata
│   │   └── page.tsx                    # Next.js bot dashboard & chat interface
│   ├── components/                     # Modular React UI components
│   ├── data/                           # Verified brand specifications & 24 FAQ records
│   └── lib/                            # AI, FAQ search, Guardrails, Recommendation logic
└── test-shopify-integration.ts         # 21 automated integration assertions for Phase 12
```

---

## 3. Guardrail Intent Categories & Rules

The Guardrail Engine ([`src/lib/guardrails.ts`](src/lib/guardrails.ts)) deterministically routes incoming inquiries into 10 intent categories:

| Intent Category | Guardrail Action | AI Permitted? | Escalation Reason | Deterministic Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `pregnancy` | `handoff_required` | **No (0 calls)** | `pregnancy` | Advises consulting healthcare professional; provides support contact without medical verdict. |
| `skin_reaction` | `handoff_required` | **No (0 calls)** | `skin_reaction` | Instructs immediate discontinuation and cool water rinse; signals support escalation. |
| `medical_question` | `handoff_required` | **No (0 calls)** | `medical_question` | Clarifies cosmetic nature; disclaims diagnosing conditions (eczema, rosacea, acne cure). |
| `order_tracking` | `handoff_required` | **No (0 calls)** | `order_tracking` | States live tracking is not yet connected; requests order ID via email. |
| `refund_dispute` | `handoff_required` | **No (0 calls)** | `refund_dispute` | Never promises refund; flags for direct human investigation. |
| `complaint` | `handoff_required` | **No (0 calls)** | `complaint` | Empathetic acknowledgment; directs to support leadership. |
| `discount_request` | `handoff_required` | **No (0 calls)** | `discount_request` | Never invents coupon codes; directs to official website campaigns. |
| `unknown_information` | `handoff_required` | **No (0 calls)** | `unverified_information` | Intercepts unverified claims (retinol, clinical trials, sweat-proof, or non-matching FAQs). |
| `normal_faq` | `allow` | **Yes** | `none` | Retrieves relevant FAQ context and invokes grounded Groq AI generation. |
| `product_recommendation` | `allow` | **Yes** | `none` | Allows grounded routine guidance within verified product specifications. |

---

## 4. Product Recommendation Engine (Phase 10)

The recommendation engine ([`src/lib/recommendation.ts`](src/lib/recommendation.ts)) uses deterministic logic grounded exclusively in verified facts:

| Product Selection | Trigger Criteria | Explanation Summary |
| :--- | :--- | :--- |
| **Glowscreen** | Morning routine, SPF 50+, hydration, glow, daytime protection. | Multifunctional morning glow stick combining hydration, sun protection (SPF 50+), and a healthy glow. |
| **Moonscreen** | Overnight recovery, nighttime routine, barrier repair, fine lines. | Overnight recovery balm formulated for barrier repair and recovery while smoothing the appearance of fine lines. |
| **Both Products** | Explicit morning + overnight recovery routine desired. | Glowscreen for morning SPF 50+ & glow; Moonscreen for overnight barrier repair and fine line care. |
| **Needs Clarification** | Ambiguous prompt (e.g., *"Which stick is best for me?"*). | Asks a polite follow-up question regarding morning protection vs. nighttime recovery goals. |

### Strict Knowledge Boundaries & Disclaimers:
- **Skin-Type Suitability**: Never assumes or claims suitability for oily, dry, acne-prone, or sensitive skin; explicitly disclaims clinical oily-skin testing while noting the non-melting solid format.
- **Travel Claims**: Mentions solid stick convenience without guaranteeing airline cabin-baggage compliance.
- **Fairness Claims**: Explicitly rejects fairness/skin-lightening claims per SKIPD's ethical policy.
- **Safety Precedence**: Guardrail checks run strictly before recommendation evaluations, ensuring pregnancy inquiries, adverse skin reactions, medical diagnoses, and unverified active questions (e.g. retinol) escalate immediately.

---

## 5. Environment Variables

Create a `.env.local` file based on [`.env.example`](.env.example):
```bash
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```
*Note: If `GROQ_API_KEY` is not set or external services are down, the backend automatically and safely falls back to direct verified FAQ matching and deterministic recommendation copy, ensuring zero crashes.*

---

## 6. Installation & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to interact with the chat widget.

3. Execute production build:
   ```bash
   npm run build
   ```

4. Run lint checks:
   ```bash
   npm run lint
   ```

---

## 7. Automated Test Suites

### 1. Product Recommendation Test Suite (Phase 10)
```bash
npx tsx test-recommendations.ts
```
Verifies 13 test assertions covering:
- Morning routine & SPF -> Glowscreen
- Overnight recovery & barrier repair -> Moonscreen
- Combined routine -> Both products
- Oily skin -> Refuses unverified oily skin claims
- Ambiguous inquiry -> Generates clarification follow-up
- Retinol, Pregnancy, Rashes -> Existing guardrails take precedence
- Fairness & Sweat-proof -> Refuses unverified claims
- Travel convenience without airline guarantees
- Mock Groq explanation generation verification

### 2. Guardrail Engine Test Suite (Phase 9)
```bash
npx tsx test-guardrails.ts
```
Verifies 24 test assertions covering deterministic classification, safety handoffs, Groq call blocking, and injection defense.

### 3. Live HTTP API End-to-End Suite
With `npm run dev` running:
```bash
npx tsx test-live-e2e.ts
```
Executes 18 live HTTP requests covering FAQs, guardrail handoffs, input validations, recommendation routing, and HTTP methods.

### 4. FAQ Search Unit Tests (Phase 7)
```bash
npx tsx test-faq-module.ts
```

### 5. Support Handoff & Validation Suite
```bash
npx tsx test-handoff.ts
```
Verifies 39 test assertions covering:
- Order number format validation and 'N/A' allowance
- Form field validation (name, email format, issue description length)
- Failed validation rejection behavior
- Guardrail handoff precedence for sensitive requests (pregnancy, reactions, medical, disputes)
- Prototype non-persistence and transparency disclaimers

### 6. Knowledge Base Verification
```bash
node validate-knowledge.js
```

### 7. Shopify Storefront Integration Test Suite (Phase 12)
```bash
npx tsx test-shopify-integration.ts
```
Verifies 21 test assertions covering:
- Storefront product questions (`Glowscreen`, `Moonscreen`)
- Oily skin and travel disclaimers without unverified claims
- Deterministic safety guardrail precedence (pregnancy, adverse skin reactions, discount requests)
- Unverified question interception and uncertainty fallback
- API request validation (empty, missing, invalid JSON, length limits)
- CORS support (`OPTIONS` preflight and `Access-Control-Allow-Origin` allowlist)
- Support handoff client form validation rules and prototype disclaimers

---

## 8. Shopify Storefront Integration (Phase 12)

Phase 12 connects the SKIPD Customer Support Bot directly to a Shopify Online Store via an official **Theme App Extension App Embed Block** without modifying theme source files directly.

### Architecture Overview
```
┌────────────────────────────────────────────────────────────────────────┐
│  Shopify Development Storefront (Theme: Dawn / Online Store 2.0)       │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │ App Embed Block (blocks/skipd-chat-embed.liquid)              │    │
│   │ - Idempotent initialization guard (no duplicate widgets)     │    │
│   │ - Configurable settings: api_base_url, launcher_text, pos    │    │
│   │ - Scoped Stylesheet: assets/skipd-chat-widget.css            │    │
│   │ - Lightweight Vanilla JS: assets/skipd-chat-widget.js         │    │
│   └──────────────────────────────┬───────────────────────────────┘    │
│                                  │ fetch('POST /api/chat')             │
│                                  │ (with CORS preflight & allowlist)   │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  SKIPD Next.js Backend (App Router)                                    │
│  POST /api/chat & OPTIONS /api/chat                                    │
│  ├── 1. CORS Allowlist: Localhost & *.myshopify.com dev origins        │
│  ├── 2. Deterministic Guardrail Engine (Pregnancy, Reactions, etc.)    │
│  ├── 3. Structured FAQ Retrieval (src/data/faq.json - 24 items)         │
│  ├── 4. Product Recommendation Engine (Glowscreen / Moonscreen)       │
│  └── 5. Grounded Groq AI Response (Grounded strictly in verified facts)│
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Shopify Development Store Setup Steps
1. Navigate to the [Shopify Partners Dashboard](https://partners.shopify.com/) or [Shopify Dev Dashboard](https://dev.shopify.com/).
2. In the navigation sidebar, go to **Stores** > **Add Store** > **Create development store**.
3. Select **Create a store for testing and building**.
4. Set the **Store name** (e.g. `skipd-dev-store`).
5. Select a standard theme (such as **Dawn**) for testing theme app extensions.
6. Click **Create development store**.

> [!NOTE]
> Never connect or link real customer data or live stores. Only use an isolated development store.

### 2. Shopify CLI & Extension Workflow
The Shopify app extension is organized under [`shopify-app/`](shopify-app/):
- Root app configuration: [`shopify-app/shopify.app.toml`](shopify-app/shopify.app.toml)
- Theme Extension TOML: [`shopify-app/extensions/skipd-chat-theme-extension/shopify.extension.toml`](shopify-app/extensions/skipd-chat-theme-extension/shopify.extension.toml)
- App Embed Block: [`shopify-app/extensions/skipd-chat-theme-extension/blocks/skipd-chat-embed.liquid`](shopify-app/extensions/skipd-chat-theme-extension/blocks/skipd-chat-embed.liquid)

#### To validate and build the Theme Extension:
```bash
npm run shopify:build
# Or directly via Shopify CLI:
npx @shopify/cli app build --path shopify-app
```
*Runs Shopify Theme Check against the extension, validating schemas, Liquid syntax, and asset bundling with 0 errors.*

#### To run the extension in local development against your store:
```bash
npx @shopify/cli auth login
cd shopify-app
npx @shopify/cli app dev --store your-dev-store.myshopify.com
```

### 3. Theme Editor Instructions (Enabling the Chat Embed)
1. Open your store's Shopify Admin: `https://admin.shopify.com/store/your-dev-store`
2. Navigate to **Online Store** > **Themes**.
3. Next to your active theme, click **Customize**.
4. In the left toolbar, click on the **App embeds** icon (third icon from top).
5. Locate **SKIPD Support Chat** in the list.
6. Toggle the embed switch to **Enabled / On**.
7. In the settings panel:
   - **SKIPD Backend API URL**: Enter your backend URL (`http://localhost:3000` for local testing or your HTTPS tunnel / production URL).
   - **Launcher Button Text**: `Chat with SKIPD`
   - **Widget Position**: `Bottom Right`
8. Click **Save** in the top-right corner.

### 4. Creating Demo Products in the Development Store
Two demo products are defined strictly in accordance with verified specifications:
1. **Glowscreen**
   - **Price**: ₹1,500
   - **Type**: SPF 50+ multifunctional morning glow stick
   - **Description**: Combines hydration, broad-spectrum sun protection (SPF 50+), and a healthy glow in a solid stick format.
2. **Moonscreen**
   - **Price**: ₹1,500
   - **Type**: Overnight recovery balm
   - **Description**: Formulated for barrier repair and recovery while smoothing the appearance of fine lines.

#### Automated Product Seeding:
```bash
SHOPIFY_STORE_DOMAIN="your-dev-store.myshopify.com" \
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_xxxx" \
node shopify-app/seed-demo-products.js
```

#### Strict Knowledge Boundaries Enforced:
- No invented ingredients
- No clinical trial claims
- No medical claims or treatments
- No fake reviews or testimonials
- No sweat-proof / water-resistant claims
- No unverified skin-type suitability claims

### 5. Local Storefront Demo Preview
A simulated Shopify development storefront is built into this project at:
```
http://localhost:3000/storefront-demo
```
It displays the two verified demo products (Glowscreen and Moonscreen) with placeholder graphics and mounts the Theme App Extension client bundle directly.

### 6. Current Limitations & Manual Configuration Notes
- **Shopify Authentication**: Running `shopify app dev` requires manual authentication via `npx @shopify/cli auth login` with your own Shopify Partner account.
- **HTTPS Tunnel for Remote Stores**: Shopify storefronts served over HTTPS require an HTTPS endpoint (e.g. Cloudflare tunnel, ngrok, or Vercel deployment) if testing against remote cloud stores.
- **Human Handoff Transparency**: The handoff form prepares a structured customer inquiry card for transparency but explicitly disclaims that it does not transmit tickets to an external ticketing CRM during development.

---

## 7. Phase 13: Final QA & Submission Deliverables

### Submission Documentation Index (`docs/`)
All final submission materials required by the Task 4 assignment are organized under the [`docs/`](docs/) directory:
1. **Authoritative FAQ Document**: [`docs/SKIPD_FAQ.md`](docs/SKIPD_FAQ.md) — 24 questions across 12 categories with human escalation requirements and policy placeholders.
2. **One-Page Technical Overview**: [`docs/SKIPD_Technical_Overview.md`](docs/SKIPD_Technical_Overview.md) — Architecture, retrieval, Groq integration, pre-LLM guardrails, monthly cost estimate (~$1.08/month), and roadmap.
3. **Architecture Diagram**: [`docs/SKIPD_Architecture.md`](docs/SKIPD_Architecture.md) — Mermaid diagram of actual implemented request flow and pre-LLM safety boundaries.
4. **Video Demo Recording Script**: [`docs/SKIPD_Demo_Script.md`](docs/SKIPD_Demo_Script.md) — 3–5 minute step-by-step recording plan covering the 10 required questions with timestamps and exact inputs/outputs.
5. **Final Submission Checklist**: [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md) — Verification matrix, security audit, link access reminder, and integrity disclosure.

### QA Test Commands

| Command | Target / Scope | Assertions Passed |
|---|---|---|
| `npm test` | Exact 10 required assignment questions (`test-10-required-questions.ts`) | **10 / 10** |
| `npm run test:qa` | 10 required questions + Failure & abuse scenarios (`test-failure-and-abuse.ts`) | **28 / 28** |
| `npm run test:all` | Full end-to-end regression test across all 8 modules | **148 / 148** |
| `npm run shopify:build` | Theme Check on Shopify Theme App Extension | **0 errors, 0 warnings** |
| `npm run lint` | ESLint check on entire codebase | **0 errors, 0 warnings** |
| `npm run build` | Next.js production TypeScript compilation & route optimization | **Exit code 0** |

