import { NextRequest, NextResponse } from "next/server";
import { ChatApiRequest, ChatApiResponse, ChatApiErrorResponse } from "@/lib/chat-types";
import { searchFAQ } from "@/lib/faq";
import { generateChatResponse, generateRecommendationExplanation } from "@/lib/ai";
import { evaluateGuardrails } from "@/lib/guardrails";
import { evaluateRecommendation } from "@/lib/recommendation";

// Maximum allowable customer message length in characters
const MAX_MESSAGE_LENGTH = 1000;

/**
 * Validates request Origin against approved development origins and returns CORS headers.
 * Never uses wildcard '*' with credentials or unverified remote origins.
 */
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin) {
    return {};
  }

  const customAllowed = process.env.ALLOWED_CORS_ORIGINS
    ? process.env.ALLOWED_CORS_ORIGINS.split(",").map((o) => o.trim().toLowerCase())
    : [];

  const originLower = origin.toLowerCase();

  // Allow localhost / 127.0.0.1 development servers (Next.js, Shopify CLI theme dev server on 9292, etc.)
  const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(originLower);

  // Allow *.myshopify.com development stores
  const isShopifyStore = /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com$/.test(originLower);

  const isCustomAllowed = customAllowed.includes(originLower);

  if (isLocalDev || isShopifyStore || isCustomAllowed) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
  }

  return {};
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const corsHeaders = getCorsHeaders(request);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatApiResponse | ChatApiErrorResponse>> {
  const corsHeaders = getCorsHeaders(request);

  try {
    // 1. Validate that the request body is valid JSON
    let body: Partial<ChatApiRequest>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Validate that 'message' is present and is a string
    if (!body || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "The 'message' field is required and must be a string." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Trim whitespace and verify non-empty
    const trimmedMessage = body.message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Enforce reasonable maximum length limit
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds the maximum limit of ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Existing Guardrails: Run deterministic safety checks BEFORE any LLM or recommendation step
    const guardrail = evaluateGuardrails(trimmedMessage);

    // If guardrails determine human handoff or intercept an unsafe/unverified inquiry:
    // Never invoke Groq; return predefined safe response immediately with handoff signal
    if (!guardrail.allowAIResponse || guardrail.action === "handoff_required") {
      return NextResponse.json(
        {
          reply:
            guardrail.safeResponse ||
            "This request requires review by our support team. Please email info@skipd.in for verified assistance.",
          requiresHandoff: true,
          intent: guardrail.intent,
          reason: guardrail.reason,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // 6. Existing FAQ Retrieval: Search knowledge base for verified context
    const searchResult = searchFAQ(trimmedMessage);

    // 7. Recommendation Engine: Evaluate whether customer is seeking routine/product guidance
    const recommendation = evaluateRecommendation(trimmedMessage);

    if (recommendation.isRecommendationRequest) {
      // 7a. If customer's goals are unclear, ask follow-up clarification question
      if (recommendation.needsClarification && recommendation.clarificationQuestion) {
        return NextResponse.json(
          {
            reply: recommendation.clarificationQuestion,
            requiresHandoff: false,
            intent: "product_recommendation",
            reason: "none",
          },
          { status: 200, headers: corsHeaders }
        );
      }

      // 7b. Generate grounded recommendation explanation using verified product facts
      if (recommendation.recommendedProduct !== "none") {
        const reply = await generateRecommendationExplanation(trimmedMessage, recommendation);
        return NextResponse.json(
          {
            reply,
            requiresHandoff: false,
            intent: "product_recommendation",
            reason: "none",
          },
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // 8. Standard FAQ handling for non-recommendation inquiries:
    // If FAQ retrieval finds no sufficiently relevant answer, return clear uncertainty response.
    if (!searchResult.hasMatch || searchResult.matches.length === 0) {
      return NextResponse.json(
        {
          reply:
            "I don't have verified information on that in our official documentation. For details on our products, routines, or policies, please reach out to our team at info@skipd.in.",
          requiresHandoff: true,
          intent: "unknown_information",
          reason: "unverified_information",
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // 9. If the matched FAQ itself indicates human handoff (e.g. sensitive policy),
    // provide the verified FAQ answer directly without invoking unconstrained AI generation.
    if (searchResult.topMatch?.requiresHandoff) {
      return NextResponse.json(
        {
          reply: searchResult.topMatch.answer,
          requiresHandoff: true,
          intent: guardrail.intent,
          reason: guardrail.reason,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // 10. Call Groq only when request is allowed and verified context is available
    const reply = await generateChatResponse(trimmedMessage, searchResult.matches);

    return NextResponse.json(
      {
        reply,
        requiresHandoff: false,
        intent: guardrail.intent,
        reason: guardrail.reason,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch {
    // 11. Never expose internal error details, API secrets, or stack traces
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500, headers: corsHeaders }
    );
  }
}
