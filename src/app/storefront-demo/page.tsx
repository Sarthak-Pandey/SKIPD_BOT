"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Script from "next/script";
import Link from "next/link";

interface DemoProduct {
  id: string;
  name: string;
  badge: string;
  price: number;
  description: string;
  image: string;
  routine: "morning" | "night";
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "prod-glowscreen",
    name: "Glowscreen SPF 50+",
    badge: "Morning Glow Stick · SPF 50+",
    price: 1500,
    description:
      "SPF 50+ multifunctional morning glow stick combining hydration, broad-spectrum protection, and a natural, dewy glow in a single swipe.",
    image: "/demo/glowscreen-placeholder.svg",
    routine: "morning",
  },
  {
    id: "prod-moonscreen",
    name: "Moonscreen Recovery Balm",
    badge: "Overnight Barrier Repair",
    price: 1500,
    description:
      "Overnight recovery balm formulated for barrier repair and recovery while smoothing the appearance of fine lines while you sleep.",
    image: "/demo/moonscreen-placeholder.svg",
    routine: "night",
  },
];

export default function StorefrontDemoPage() {
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "morning" | "night">("all");

  const handleAddToCart = (product: DemoProduct) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => prev + product.price);
    setAddedItem(product.name);
    setTimeout(() => setAddedItem(null), 3000);
  };

  const filteredProducts =
    selectedFilter === "all"
      ? DEMO_PRODUCTS
      : DEMO_PRODUCTS.filter((p) => p.routine === selectedFilter);

  // Initialize theme extension script if already loaded
  useEffect(() => {
    const rootEl = document.getElementById("skipd-chat-root");
    if (rootEl && !document.getElementById("skipd-chat-container")) {
      const script = document.createElement("script");
      script.src = "/theme-extension/skipd-chat-widget.js";
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#2B1810] font-sans antialiased">
      {/* Extension CSS injection */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/theme-extension/skipd-chat-widget.css" />

      {/* Top Announcement Bar */}
      <div className="bg-[#3C0C1C] text-[#FFE6A9] py-2 px-4 text-xs font-medium text-center flex items-center justify-between">
        <span className="hidden sm:inline">🚚 Free Shipping Across India</span>
        <span className="mx-auto font-semibold tracking-wide">
          SKIPD Shopify Development Storefront · Phase 12 Integration Preview
        </span>
        <span className="hidden sm:inline">Demo Currency: ₹ INR</span>
      </div>

      {/* Store Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#3C0C1C]/10 px-4 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full bg-[#3C0C1C] text-[#FFE6A9] font-serif font-bold text-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                S
              </div>
              <span className="text-xl md:text-2xl font-serif font-bold tracking-tight text-[#3C0C1C]">
                SKIPD
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#3C0C1C]/80">
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={`transition-colors hover:text-[#3C0C1C] ${selectedFilter === "all" ? "text-[#3C0C1C] font-semibold underline underline-offset-4" : ""}`}
              >
                All Products
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("morning")}
                className={`transition-colors hover:text-[#3C0C1C] ${selectedFilter === "morning" ? "text-[#3C0C1C] font-semibold underline underline-offset-4" : ""}`}
              >
                Morning Routine (SPF 50+)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("night")}
                className={`transition-colors hover:text-[#3C0C1C] ${selectedFilter === "night" ? "text-[#3C0C1C] font-semibold underline underline-offset-4" : ""}`}
              >
                Night Recovery (Balm)
              </button>
              <Link href="/" className="hover:text-[#3C0C1C] text-[#3C0C1C]/60 text-xs">
                ← Next.js Bot Home
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input Mock */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF8E7] border border-[#3C0C1C]/15 text-xs text-[#3C0C1C]">
              <svg className="w-3.5 h-3.5 text-[#3C0C1C]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                aria-label="Search storefront products"
                className="bg-transparent text-xs outline-none w-32 placeholder-[#3C0C1C]/40"
              />
            </div>

            {/* Shopping Bag Button */}
            <div className="relative">
              <button
                type="button"
                aria-label="View shopping bag"
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#FFF8E7] text-[#3C0C1C] border border-[#3C0C1C]/20 hover:border-[#3C0C1C] transition-colors text-xs font-semibold"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Bag ({cartCount})</span>
                {cartTotal > 0 && <span className="font-mono">₹{cartTotal.toLocaleString()}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Added to Bag Toast Alert */}
      {addedItem && (
        <div className="fixed top-20 right-6 z-50 bg-[#3C0C1C] text-[#FFE6A9] px-4 py-3 rounded-xl shadow-xl border border-[#FFE6A9]/40 flex items-center gap-3 animate-fadeIn text-xs">
          <span>✓ Added <strong>{addedItem}</strong> to your bag.</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8E7] to-[#FFFDF7] py-14 px-4 md:px-12 border-b border-[#3C0C1C]/10">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFE6A9]/70 text-[#3C0C1C] text-xs font-medium border border-[#3C0C1C]/15">
            <span>✨ Skipcare™ Multifunctional Skincare</span>
            <span>·</span>
            <span>Formulated for Indian Skin &amp; Warm Climates</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#3C0C1C] tracking-tight">
            Skip The Steps. Keep The Skin.
          </h1>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-[#3C0C1C]/80 leading-relaxed">
            Simplified routines that respect your skin barrier. Tested across the official SKIPD Customer Support
            Bot knowledge base with deterministic guardrails.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-md bg-white border border-[#3C0C1C]/15 font-mono text-[#3C0C1C]/70">
              Demo Storefront Environment
            </span>
            <span className="px-3 py-1 rounded-md bg-white border border-[#3C0C1C]/15 font-mono text-[#3C0C1C]/70">
              Theme App Extension: Active
            </span>
            <span className="px-3 py-1 rounded-md bg-white border border-[#3C0C1C]/15 font-mono text-[#3C0C1C]/70">
              Backend: POST /api/chat
            </span>
          </div>
        </div>
      </section>

      {/* Products Catalog Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-4 border-b border-[#3C0C1C]/10">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#3C0C1C]">
              Demo Products
            </h2>
            <p className="text-sm text-[#3C0C1C]/70 mt-1">
              Verified specifications from Phase 1 source of truth (₹1,500 each).
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-[#FFF8E7] p-1.5 rounded-full border border-[#3C0C1C]/15 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                selectedFilter === "all"
                  ? "bg-[#3C0C1C] text-[#FFE6A9] font-medium shadow-xs"
                  : "text-[#3C0C1C]/70 hover:text-[#3C0C1C]"
              }`}
            >
              All (2)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("morning")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                selectedFilter === "morning"
                  ? "bg-[#3C0C1C] text-[#FFE6A9] font-medium shadow-xs"
                  : "text-[#3C0C1C]/70 hover:text-[#3C0C1C]"
              }`}
            >
              Morning (Glowscreen)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("night")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                selectedFilter === "night"
                  ? "bg-[#3C0C1C] text-[#FFE6A9] font-medium shadow-xs"
                  : "text-[#3C0C1C]/70 hover:text-[#3C0C1C]"
              }`}
            >
              Night (Moonscreen)
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-[#3C0C1C]/15 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Product Image & Badge */}
                <div className="relative aspect-square w-full bg-[#FFF8E7] p-6 flex items-center justify-center overflow-hidden border-b border-[#3C0C1C]/10">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={320}
                    height={320}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#3C0C1C] text-[#FFE6A9]">
                      {product.badge}
                    </span>
                  </div>
                </div>

                {/* Product Meta */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-xl font-serif font-bold text-[#3C0C1C]">
                      {product.name}
                    </h3>
                    <span className="text-lg font-bold font-mono text-[#3C0C1C] whitespace-nowrap">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#3C0C1C]/75 leading-relaxed mb-4">
                    {product.description}
                  </p>

                  <div className="space-y-1.5 text-[11px] text-[#3C0C1C]/65 border-t border-[#3C0C1C]/10 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span>Multifunctional solid stick format</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span>Indian skin &amp; warm climate formulated</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#3C0C1C]/50">
                      <span>ℹ</span>
                      <span>Verified facts only · No unverified clinical claims</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add To Cart Button */}
              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  aria-label={`Add ${product.name} to bag`}
                  className="w-full py-3 px-4 rounded-xl bg-[#3C0C1C] text-[#FFE6A9] font-medium text-sm hover:bg-[#2B0813] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add to Bag · ₹{product.price.toLocaleString()}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Architecture Info Banner */}
        <section className="mt-16 p-6 md:p-8 rounded-2xl bg-[#FFF8E7] border border-[#3C0C1C]/20 text-[#3C0C1C]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#3C0C1C] text-[#FFE6A9] mb-2">
                Phase 12 Architecture
              </div>
              <h3 className="text-lg md:text-xl font-serif font-bold">
                Shopify Theme App Extension Embed
              </h3>
              <p className="text-xs md:text-sm text-[#3C0C1C]/80 mt-1 max-w-2xl leading-relaxed">
                This page mounts the real theme app extension embed block (<code>blocks/skipd-chat-embed.liquid</code>)
                connected to the live Next.js backend at <code>POST /api/chat</code>. Guardrails, FAQ retrieval,
                product recommendations, and support handoffs run deterministically on the backend.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#3C0C1C]/30 text-xs font-semibold hover:bg-white text-center transition-colors"
              >
                View App Overview
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Storefront Footer */}
      <footer className="bg-[#3C0C1C] text-[#FFF8E7] py-10 px-4 md:px-12 border-t border-[#FFE6A9]/20 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-[#FFE6A9]">SKIPD</span>
            <span className="text-[#FFE6A9]/60">·</span>
            <span className="text-[#FFE6A9]/80">Jain Sisters Private Limited</span>
          </div>
          <div className="text-center sm:text-right text-[#FFE6A9]/60">
            <span>Shopify Development Store Integration · Phase 12</span>
          </div>
        </div>
      </footer>

      {/* 
        Shopify Theme App Extension Root Mount:
        Matches blocks/skipd-chat-embed.liquid rendered by Shopify Theme Editor
      */}
      <div
        id="skipd-chat-root"
        data-api-base-url=""
        data-launcher-text="Chat with SKIPD"
        data-greeting="Hello! Welcome to SKIPD. We're here to help you skip the steps and keep the skin. How can we help you simplify your routine today?"
        data-position="bottom-right"
      />

      {/* Theme App Extension JavaScript Bundle */}
      <Script
        src="/theme-extension/skipd-chat-widget.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
