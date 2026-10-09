import ChatWidget from "@/components/ChatWidget";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-8 md:p-16 bg-[#FFF8E7] text-[#3C0C1C]">
      <header className="max-w-4xl mx-auto w-full border-b border-[#3C0C1C]/15 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#3C0C1C]/70">
              Jain Sisters Private Limited
            </span>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight font-bold text-[#3C0C1C] mt-1">
              SKIPD · Support Bot
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/storefront-demo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFE6A9] text-[#3C0C1C] border border-[#3C0C1C]/20 hover:bg-[#ffdf8d] transition-colors"
            >
              <span>🛍️ Storefront Demo</span>
              <span>→</span>
            </a>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#3C0C1C] text-[#FFE6A9]">
              Phase 12: Shopify Integration
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm md:text-base text-[#3C0C1C]/80">
          Skip the steps. Keep the skin. Experience the floating customer support bot at the bottom right, or explore the <a href="/storefront-demo" className="font-semibold underline">Shopify Storefront Demo</a>.
        </p>
      </header>

      <main className="max-w-4xl mx-auto w-full my-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-[#3C0C1C]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#3C0C1C] text-[#FFE6A9] flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h2 className="text-lg font-semibold text-[#3C0C1C]">
              Brand &amp; Product Facts
            </h2>
            <p className="mt-2 text-sm text-[#3C0C1C]/75">
              Verified specifications for Glowscreen (SPF 50+ stick) and Moonscreen (recovery balm), with strictly documented unverified boundaries.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#3C0C1C]/10 text-xs font-mono text-[#3C0C1C]/60">
            src/data/product-facts.md
          </div>
        </div>

        <div className="rounded-xl border border-[#3C0C1C]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#3C0C1C] text-[#FFE6A9] flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h2 className="text-lg font-semibold text-[#3C0C1C]">
              Structured FAQ Base
            </h2>
            <p className="mt-2 text-sm text-[#3C0C1C]/75">
              24 verified FAQ entries covering routines, travel, safety, sensitive topics, and explicit human handoff flags (<code className="bg-[#3C0C1C]/10 px-1 py-0.5 rounded">requiresHandoff</code>).
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#3C0C1C]/10 text-xs font-mono text-[#3C0C1C]/60">
            src/data/faq.json (24 items)
          </div>
        </div>

        <div className="rounded-xl border border-[#3C0C1C]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#3C0C1C] text-[#FFE6A9] flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h2 className="text-lg font-semibold text-[#3C0C1C]">
              Interactive Chat &amp; API
            </h2>
            <p className="mt-2 text-sm text-[#3C0C1C]/75">
              SKIPD-themed floating chat widget connected via <code className="bg-[#3C0C1C]/10 px-1 py-0.5 rounded">fetch</code> to <code className="bg-[#3C0C1C]/10 px-1 py-0.5 rounded">POST /api/chat</code> with input validation and temporary response.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#3C0C1C]/10 text-xs font-mono text-[#3C0C1C]/60">
            src/components/ChatWidget.tsx
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full border-t border-[#3C0C1C]/15 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#3C0C1C]/60 gap-2">
        <span>© 2026 Jain Sisters Private Limited. Formulated for Indian skin.</span>
        <span>skipd-bot · Phases 1–6 Verified</span>
      </footer>

      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  );
}
