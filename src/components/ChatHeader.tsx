"use client";

import React from "react";

interface ChatHeaderProps {
  onClose: () => void;
}

export default function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 bg-[#3C0C1C] text-[#FFF8E7] rounded-t-2xl shadow-sm border-b border-[#3C0C1C]/20 select-none">
      <div className="flex items-center space-x-3">
        {/* Brand Monogram Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#FFE6A9] text-[#3C0C1C] font-serif font-bold text-sm flex items-center justify-center shadow-inner">
          S
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm text-[#FFF8E7] tracking-tight">
              SKIPD Assistant
            </h2>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
          </div>
          <p className="text-[11px] text-[#FFE6A9]/80 font-normal">
            Skipcare™ simplified routine guide
          </p>
        </div>
      </div>

      {/* Close button with accessible labeling */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close chat window"
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#FFF8E7]/70 hover:text-[#FFF8E7] hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFE6A9]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
