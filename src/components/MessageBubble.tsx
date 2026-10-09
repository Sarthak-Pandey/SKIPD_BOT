"use client";

import React from "react";
import { ChatMessage } from "@/lib/chat-types";
import { HandoffFormData } from "@/lib/handoff-validation";
import HandoffForm from "./HandoffForm";

interface MessageBubbleProps {
  message: ChatMessage;
  onHandoffSubmit?: (messageId: string, data: HandoffFormData) => void;
  onHandoffEdit?: (messageId: string) => void;
  defaultDescription?: string;
}

export default function MessageBubble({
  message,
  onHandoffSubmit,
  onHandoffEdit,
  defaultDescription,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  const formattedTime = (() => {
    try {
      const date = new Date(message.timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  })();

  const maxWidthClass = isUser
    ? "max-w-[82%] items-end"
    : message.requiresHandoff
    ? "w-full max-w-[95%] items-start"
    : "max-w-[82%] items-start";

  return (
    <div
      className={`flex w-full mb-3 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
    >
      <div className={`flex flex-col ${maxWidthClass}`}>
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl shadow-xs ${
            isUser
              ? "bg-[#3C0C1C] text-[#FFF8E7] rounded-br-xs"
              : "bg-white text-[#2B1810] border border-[#3C0C1C]/15 rounded-bl-xs"
          }`}
        >
          {message.content}
        </div>

        {/* Handoff required notification badge & form for sensitive/unverified queries */}
        {!isUser && message.requiresHandoff && (
          <div className="w-full mt-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFE6A9]/50 border border-[#3C0C1C]/10 text-[10px] text-[#3C0C1C]/80 font-medium select-none mb-1">
              <svg
                className="w-3 h-3 text-[#3C0C1C]/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Support handoff pathway active · info@skipd.in</span>
            </div>

            {/* Embedded Handoff Form */}
            <HandoffForm
              messageId={message.id}
              initialData={message.handoffData}
              defaultDescription={defaultDescription}
              isSubmitted={message.handoffSubmitted}
              onSubmit={(data) => onHandoffSubmit?.(message.id, data)}
              onEdit={() => onHandoffEdit?.(message.id)}
            />
          </div>
        )}

        {formattedTime && (
          <span className="text-[10px] text-[#3C0C1C]/50 mt-1 px-1 select-none">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}
