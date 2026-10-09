import type { IntentCategory, EscalationReason } from "./guardrails";
import type { HandoffFormData } from "./handoff-validation";

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO string format for consistent serialization
  requiresHandoff?: boolean;
  intent?: IntentCategory;
  reason?: EscalationReason;
  handoffData?: HandoffFormData;
  handoffSubmitted?: boolean;
}

export interface ChatApiRequest {
  message: string;
}

export interface ChatApiResponse {
  reply: string;
  requiresHandoff?: boolean;
  intent?: IntentCategory;
  reason?: EscalationReason;
}

export interface ChatApiErrorResponse {
  error: string;
}
