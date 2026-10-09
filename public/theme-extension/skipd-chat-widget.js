/**
 * SKIPD Customer Support Chat Widget — Theme App Extension Client Bundle
 * Injected into Shopify Storefront via App Embed Block
 * Connects to SKIPD Next.js backend (POST /api/chat)
 */

(function () {
  "use strict";

  // Prevent multiple initializations if theme re-renders
  if (window.__SKIPD_CHAT_INITIALIZED__) {
    return;
  }
  window.__SKIPD_CHAT_INITIALIZED__ = true;

  // Wait for DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSkipdChat);
  } else {
    initSkipdChat();
  }

  function initSkipdChat() {
    let rootEl = document.getElementById("skipd-chat-root");
    if (!rootEl) {
      rootEl = document.createElement("div");
      rootEl.id = "skipd-chat-root";
      document.body.appendChild(rootEl);
    }

    // Read merchant settings from block data attributes
    const rawApiUrl = rootEl.getAttribute("data-api-base-url") || "http://localhost:3000";
    const apiBaseUrl = rawApiUrl.replace(/\/+$/, "");
    const launcherText = rootEl.getAttribute("data-launcher-text") || "Chat with SKIPD";
    const greetingText =
      rootEl.getAttribute("data-greeting") ||
      "Hello! Welcome to SKIPD. We're here to help you skip the steps and keep the skin. How can we help you simplify your routine today?";
    const position = rootEl.getAttribute("data-position") || "bottom-right";

    // Client State
    let isOpen = false;
    let isLoading = false;
    let errorMessage = null;
    const messages = [
      {
        id: "welcome-1",
        role: "assistant",
        content: greetingText,
        timestamp: new Date().toISOString(),
        requiresHandoff: false,
      },
    ];

    // Create Widget Container
    const container = document.createElement("aside");
    container.id = "skipd-chat-container";
    container.className = `skipd-chat-widget-root ${position === "bottom-left" ? "skipd-pos-left" : ""}`;
    container.setAttribute("aria-label", "SKIPD customer support chat assistant");
    rootEl.appendChild(container);

    // Initial Render
    renderWidget();

    // -------------------------------------------------------------
    // Render Functions
    // -------------------------------------------------------------

    function renderWidget() {
      container.innerHTML = "";

      if (!isOpen) {
        // Floating Launcher Button
        const launcherBtn = document.createElement("button");
        launcherBtn.type = "button";
        launcherBtn.className = "skipd-launcher-btn";
        launcherBtn.setAttribute("aria-label", launcherText);
        launcherBtn.setAttribute("aria-expanded", "false");
        launcherBtn.innerHTML = `
          <div class="skipd-launcher-avatar" aria-hidden="true">S</div>
          <span class="skipd-launcher-text">${escapeHtml(launcherText)}</span>
          <svg class="skipd-launcher-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.874-.954 6.786 6.786 0 001.076-2.616A8.04 8.04 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        `;
        launcherBtn.addEventListener("click", () => {
          isOpen = true;
          renderWidget();
          focusInput();
        });
        container.appendChild(launcherBtn);
      } else {
        // Floating Chat Window Modal
        const chatWindow = document.createElement("div");
        chatWindow.className = "skipd-chat-window";
        chatWindow.setAttribute("role", "dialog");
        chatWindow.setAttribute("aria-label", "SKIPD Support Chat Window");

        // Header
        const header = document.createElement("div");
        header.className = "skipd-chat-header";
        header.innerHTML = `
          <div class="skipd-header-left">
            <div class="skipd-header-avatar" aria-hidden="true">S</div>
            <div class="skipd-header-info">
              <div class="skipd-header-title-row">
                <h3 class="skipd-header-title">SKIPD Assistant</h3>
                <span class="skipd-online-dot" title="Online" aria-label="Online"></span>
                <span class="skipd-demo-badge">DEV DEMO</span>
              </div>
              <p class="skipd-header-subtitle">Skipcare™ simplified routine guide</p>
            </div>
          </div>
          <button type="button" class="skipd-close-btn" aria-label="Close chat window">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        `;
        header.querySelector(".skipd-close-btn").addEventListener("click", () => {
          isOpen = false;
          renderWidget();
        });
        chatWindow.appendChild(header);

        // Body: Message Stream
        const body = document.createElement("div");
        body.className = "skipd-chat-body";
        body.setAttribute("role", "log");
        body.setAttribute("aria-live", "polite");

        messages.forEach((msg, idx) => {
          const isUser = msg.role === "user";
          const row = document.createElement("div");
          row.className = `skipd-msg-row ${isUser ? "skipd-msg-user-row" : "skipd-msg-assistant-row"}`;

          const wrapper = document.createElement("div");
          wrapper.className = `skipd-msg-wrapper ${!isUser && msg.requiresHandoff ? "skipd-wide" : ""}`;

          const bubble = document.createElement("div");
          bubble.className = `skipd-msg-bubble ${isUser ? "skipd-msg-bubble-user" : "skipd-msg-bubble-assistant"}`;
          bubble.textContent = msg.content;
          wrapper.appendChild(bubble);

          // Support Handoff Pathway
          if (!isUser && msg.requiresHandoff) {
            let precedingUserMsg = "";
            if (idx > 0 && messages[idx - 1].role === "user") {
              precedingUserMsg = messages[idx - 1].content;
            }
            const handoffSection = createHandoffElement(msg, precedingUserMsg);
            wrapper.appendChild(handoffSection);
          }

          // Timestamp
          const time = document.createElement("div");
          time.className = "skipd-msg-time";
          time.textContent = formatTime(msg.timestamp);
          wrapper.appendChild(time);

          row.appendChild(wrapper);
          body.appendChild(row);
        });

        // Loading indicator
        if (isLoading) {
          const loadingRow = document.createElement("div");
          loadingRow.className = "skipd-loading-row";
          loadingRow.innerHTML = `
            <span>SKIPD is thinking</span>
            <span class="skipd-dots" aria-hidden="true">
              <span class="skipd-dot"></span>
              <span class="skipd-dot"></span>
              <span class="skipd-dot"></span>
            </span>
          `;
          body.appendChild(loadingRow);
        }

        // Error Banner
        if (errorMessage) {
          const errBanner = document.createElement("div");
          errBanner.className = "skipd-error-banner";
          errBanner.setAttribute("role", "alert");
          errBanner.innerHTML = `
            <span>${escapeHtml(errorMessage)}</span>
            <button type="button" class="skipd-error-close" aria-label="Dismiss error">×</button>
          `;
          errBanner.querySelector(".skipd-error-close").addEventListener("click", () => {
            errorMessage = null;
            renderWidget();
          });
          body.appendChild(errBanner);
        }

        chatWindow.appendChild(body);

        // Quick Prompts
        const chipsWrapper = document.createElement("div");
        chipsWrapper.className = "skipd-quick-chips-wrapper";
        const promptOptions = [
          "How do I use Glowscreen?",
          "What is Moonscreen used for?",
          "Recommend a routine",
          "I have oily skin & travel a lot",
        ];
        promptOptions.forEach((promptText) => {
          const chipBtn = document.createElement("button");
          chipBtn.type = "button";
          chipBtn.className = "skipd-chip-btn";
          chipBtn.textContent = promptText;
          chipBtn.disabled = isLoading;
          chipBtn.addEventListener("click", () => {
            handleSendMessage(promptText);
          });
          chipsWrapper.appendChild(chipBtn);
        });
        chatWindow.appendChild(chipsWrapper);

        // Form: Input and Send
        const form = document.createElement("form");
        form.className = "skipd-chat-form";
        form.innerHTML = `
          <input
            type="text"
            class="skipd-chat-input"
            placeholder="Ask about products, routine, shipping..."
            aria-label="Type your message"
            ${isLoading ? "disabled" : ""}
          />
          <button
            type="submit"
            class="skipd-send-btn"
            aria-label="Send message"
            ${isLoading ? "disabled" : ""}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        `;

        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const input = form.querySelector(".skipd-chat-input");
          const val = input.value.trim();
          if (val && !isLoading) {
            handleSendMessage(val);
          }
        });

        chatWindow.appendChild(form);
        container.appendChild(chatWindow);

        // Scroll to bottom
        setTimeout(() => {
          body.scrollTop = body.scrollHeight;
        }, 30);
      }
    }

    function focusInput() {
      setTimeout(() => {
        const input = container.querySelector(".skipd-chat-input");
        if (input) input.focus();
      }, 100);
    }

    // -------------------------------------------------------------
    // Send Message Handler
    // -------------------------------------------------------------

    async function handleSendMessage(text) {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      errorMessage = null;

      // 1. Immediately append user's message
      const userMsg = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };
      messages.push(userMsg);
      isLoading = true;
      renderWidget();

      // Abort controller for 15s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const targetEndpoint = `${apiBaseUrl}/api/chat`;
        const response = await fetch(targetEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: trimmed }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errDetail = `Server responded with status ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.error) errDetail = errData.error;
          } catch (_) {}
          throw new Error(errDetail);
        }

        const data = await response.json();

        // Append assistant response
        const assistantMsg = {
          id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          role: "assistant",
          content: data.reply || "Thank you for reaching out to SKIPD.",
          timestamp: new Date().toISOString(),
          requiresHandoff: Boolean(data.requiresHandoff),
          intent: data.intent,
          reason: data.reason,
        };
        messages.push(assistantMsg);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          errorMessage = "Request timed out: The SKIPD assistant took too long to respond. Please try again.";
        } else if (err.message && err.message.includes("Failed to fetch")) {
          errorMessage =
            "Unable to connect to the SKIPD assistant backend. Please ensure the backend server is running and accessible at: " +
            apiBaseUrl;
        } else {
          errorMessage = err.message || "An unexpected network error occurred. Please try again.";
        }
      } finally {
        isLoading = false;
        renderWidget();
        focusInput();
      }
    }

    // -------------------------------------------------------------
    // Handoff Form Component
    // -------------------------------------------------------------

    function createHandoffElement(msg, defaultDescription) {
      const section = document.createElement("div");
      section.className = "skipd-handoff-section";

      // Banner
      const banner = document.createElement("div");
      banner.className = "skipd-handoff-banner";
      banner.innerHTML = `
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="13" height="13" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Support handoff pathway active · info@skipd.in</span>
      `;
      section.appendChild(banner);

      if (msg.handoffSubmitted && msg.handoffData) {
        // Summary View
        const summaryCard = document.createElement("div");
        summaryCard.className = "skipd-handoff-summary-card";
        summaryCard.innerHTML = `
          <div class="skipd-handoff-summary-title">Support Request Prepared</div>
          <div class="skipd-handoff-summary-meta">
            <strong>Contact:</strong> ${escapeHtml(msg.handoffData.name)} (${escapeHtml(msg.handoffData.email)})<br />
            <strong>Order #:</strong> ${escapeHtml(msg.handoffData.orderNumber)}<br />
            <strong>Inquiry:</strong> ${escapeHtml(msg.handoffData.issueDescription)}
          </div>
          <div class="skipd-handoff-proto-disclaimer">
            Note: This is a local development session. Details are not transmitted to an external ticketing server.
          </div>
          <button type="button" class="skipd-handoff-edit-btn">Edit Details</button>
        `;
        summaryCard.querySelector(".skipd-handoff-edit-btn").addEventListener("click", () => {
          msg.handoffSubmitted = false;
          renderWidget();
        });
        section.appendChild(summaryCard);
      } else {
        // Form View
        const initial = msg.handoffData || {
          name: "",
          email: "",
          orderNumber: "N/A",
          issueDescription: defaultDescription || "",
        };

        const formCard = document.createElement("div");
        formCard.className = "skipd-handoff-card";
        formCard.innerHTML = `
          <h4>Submit Support Details</h4>
          <div class="skipd-handoff-group">
            <label class="skipd-handoff-label">Full Name *</label>
            <input type="text" class="skipd-handoff-input skipd-input-name" placeholder="Your name" value="${escapeHtml(initial.name)}" />
            <div class="skipd-handoff-error-text skipd-err-name"></div>
          </div>
          <div class="skipd-handoff-group">
            <label class="skipd-handoff-label">Email Address *</label>
            <input type="email" class="skipd-handoff-input skipd-input-email" placeholder="you@example.com" value="${escapeHtml(initial.email)}" />
            <div class="skipd-handoff-error-text skipd-err-email"></div>
          </div>
          <div class="skipd-handoff-group">
            <label class="skipd-handoff-label">Order Number (or 'N/A') *</label>
            <input type="text" class="skipd-handoff-input skipd-input-order" placeholder="#1042 or N/A" value="${escapeHtml(initial.orderNumber)}" />
            <div class="skipd-handoff-error-text skipd-err-order"></div>
          </div>
          <div class="skipd-handoff-group">
            <label class="skipd-handoff-label">Describe your inquiry *</label>
            <textarea class="skipd-handoff-input skipd-input-desc" rows="2" placeholder="Details of your inquiry...">${escapeHtml(initial.issueDescription)}</textarea>
            <div class="skipd-handoff-error-text skipd-err-desc"></div>
          </div>
          <button type="button" class="skipd-handoff-submit-btn">Prepare Support Summary</button>
        `;

        const submitBtn = formCard.querySelector(".skipd-handoff-submit-btn");
        submitBtn.addEventListener("click", () => {
          const nameVal = formCard.querySelector(".skipd-input-name").value.trim();
          const emailVal = formCard.querySelector(".skipd-input-email").value.trim();
          const orderVal = formCard.querySelector(".skipd-input-order").value.trim();
          const descVal = formCard.querySelector(".skipd-input-desc").value.trim();

          const errName = formCard.querySelector(".skipd-err-name");
          const errEmail = formCard.querySelector(".skipd-err-email");
          const errOrder = formCard.querySelector(".skipd-err-order");
          const errDesc = formCard.querySelector(".skipd-err-desc");

          // Reset errors
          errName.textContent = "";
          errEmail.textContent = "";
          errOrder.textContent = "";
          errDesc.textContent = "";

          let isValid = true;

          // Validate Name
          if (!nameVal || nameVal.length < 2) {
            errName.textContent = "Please enter your full name (at least 2 characters).";
            isValid = false;
          }

          // Validate Email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailVal || !emailRegex.test(emailVal)) {
            errEmail.textContent = "Please enter a valid email address.";
            isValid = false;
          }

          // Validate Order
          if (!orderVal) {
            errOrder.textContent = "Please provide an order number or enter 'N/A'.";
            isValid = false;
          }

          // Validate Issue Description
          if (!descVal || descVal.length < 10) {
            errDesc.textContent = "Please provide at least 10 characters describing your inquiry.";
            isValid = false;
          }

          if (isValid) {
            msg.handoffData = {
              name: nameVal,
              email: emailVal,
              orderNumber: orderVal,
              issueDescription: descVal,
            };
            msg.handoffSubmitted = true;
            renderWidget();
          }
        });

        section.appendChild(formCard);
      }

      return section;
    }

    // -------------------------------------------------------------
    // Helper Utilities
    // -------------------------------------------------------------

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatTime(isoString) {
      try {
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } catch (_) {
        return "";
      }
    }

    // Global Key Listener for Accessibility (ESC to close)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        isOpen = false;
        renderWidget();
      }
    });
  }
})();
