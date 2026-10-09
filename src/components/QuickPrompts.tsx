"use client";

import React from "react";

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const DEFAULT_PROMPTS = [
  "Which stick is right for me?",
  "How do I use Glowscreen?",
  "Where's my order?",
];

export default function QuickPrompts({ onSelectPrompt, disabled = false }: QuickPromptsProps) {
  return (
    <div className="px-4 py-2 border-t border-[#3C0C1C]/10 bg-[#FFF8E7]/60">
      <p className="text-[11px] font-medium text-[#3C0C1C]/70 mb-1.5 uppercase tracking-wider">
        Quick Questions:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="text-xs text-[#3C0C1C] bg-white border border-[#3C0C1C]/20 hover:bg-[#FFE6A9]/50 hover:border-[#3C0C1C]/40 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-[#3C0C1C]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
