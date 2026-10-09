"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import QuickPrompts from "./QuickPrompts";
import { ChatMessage, ChatApiResponse, ChatApiErrorResponse } from "@/lib/chat-types";
import { HandoffFormData } from "@/lib/handoff-validation";

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome-1",
  role: "assistant",
  content:
    "Hello! Welcome to SKIPD. We're here to help you skip the steps and keep the skin. How can we help you simplify your routine today?",
  timestamp: new Date().toISOString(),
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when chat window opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Main message sending handler
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    // Reset error state
    setErrorMessage(null);

    // 1. Immediately append user's message to conversation state
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Call backend Route Handler
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        const errorData: ChatApiErrorResponse = await response.json().catch(() => ({
          error: `Server responded with status ${response.status}`,
        }));
        throw new Error(errorData.error || "Failed to receive response from server.");
      }

      const data: ChatApiResponse = await response.json();

      // 3. Render backend reply
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
        requiresHandoff: data.requiresHandoff,
        intent: data.intent,
        reason: data.reason,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorText =
        err instanceof Error
          ? err.message
          : "Network error: Unable to reach the SKIPD assistant. Please check your connection.";
      setErrorMessage(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleSelectPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleHandoffSubmit = (messageId: string, data: HandoffFormData) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, handoffData: data, handoffSubmitted: true }
          : msg
      )
    );
  };

  const handleHandoffEdit = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, handoffSubmitted: false }
          : msg
      )
    );
  };

  return (
    <aside aria-label="Customer support chat assistant" className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Launcher Button (visible when closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open SKIPD Support Chat"
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#3C0C1C] text-[#FFF8E7] rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-[#FFE6A9]/30 focus:outline-none focus:ring-2 focus:ring-[#3C0C1C] focus:ring-offset-2"
        >
          <div className="w-6 h-6 rounded-full bg-[#FFE6A9] text-[#3C0C1C] flex items-center justify-center font-serif font-bold text-xs">
            S
          </div>
          <span className="font-medium text-sm text-[#FFE6A9] tracking-wide">
            Chat with SKIPD
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-5 h-5 text-[#FFE6A9] transition-transform group-hover:translate-x-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.874-.954 6.786 6.786 0 001.076-2.616A8.04 8.04 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </button>
      )}

      {/* Floating Chat Window (visible when open) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="SKIPD Support Chat Window"
          className="flex flex-col w-[92vw] sm:w-[390px] h-[550px] max-h-[85vh] bg-[#FFF8E7] rounded-2xl shadow-2xl border border-[#3C0C1C]/25 overflow-hidden transition-all duration-300"
        >
          {/* Header */}
          <ChatHeader onClose={() => setIsOpen(false)} />

          {/* Conversation Area */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Conversation message history"
            className="flex-1 overflow-y-auto px-4 py-3 bg-[#FFF8E7] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#3C0C1C]/20"
          >
            {messages.map((msg, index) => {
              let precedingUserMsg = "";
              if (msg.role === "assistant" && msg.requiresHandoff && index > 0) {
                const prev = messages[index - 1];
                if (prev && prev.role === "user") {
                  precedingUserMsg = prev.content;
                }
              }
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  defaultDescription={precedingUserMsg}
                  onHandoffSubmit={handleHandoffSubmit}
                  onHandoffEdit={handleHandoffEdit}
                />
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-white text-[#3C0C1C] border border-[#3C0C1C]/15 shadow-xs flex items-center space-x-1.5">
                  <span className="text-xs text-[#3C0C1C]/70 mr-1 font-medium">SKIPD is thinking</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3C0C1C] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3C0C1C] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3C0C1C] animate-bounce" />
                </div>
              </div>
            )}

            {/* Error Message Display */}
            {errorMessage && (
              <div
                role="alert"
                className="my-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start justify-between gap-2"
              >
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-600 hover:text-red-900 font-bold ml-1 focus:outline-none"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <QuickPrompts onSelectPrompt={handleSelectPrompt} disabled={isLoading} />

          {/* Input & Send Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-[#3C0C1C]/15 bg-white flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, routine, shipping..."
              disabled={isLoading}
              aria-label="Type your message"
              className="flex-1 px-3 py-2 text-sm bg-[#FFF8E7]/50 border border-[#3C0C1C]/20 rounded-full text-[#3C0C1C] placeholder-[#3C0C1C]/40 focus:outline-none focus:ring-2 focus:ring-[#3C0C1C] focus:bg-white disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-[#3C0C1C] text-[#FFE6A9] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2b0813] active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3C0C1C]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 translate-x-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
