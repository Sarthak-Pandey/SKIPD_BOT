export interface HandoffFormData {
  name: string;
  email: string;
  orderNumber: string;
  issueDescription: string;
}

export interface HandoffValidationErrors {
  name?: string;
  email?: string;
  orderNumber?: string;
  issueDescription?: string;
}

export interface HandoffValidationResult {
  isValid: boolean;
  errors: HandoffValidationErrors;
}

/**
 * Standard RFC-compliant email regex pattern for basic format verification.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether an order number string is valid.
 * Allows 'N/A' (case-insensitive) when the customer does not have an order number.
 * Otherwise requires between 2 and 50 characters.
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  if (!orderNumber) return false;
  const trimmed = orderNumber.trim();
  if (trimmed.length === 0) return false;

  const normalized = trimmed.toUpperCase().replace(/\s+/g, "");
  if (normalized === "N/A" || normalized === "NA") {
    return true;
  }

  return trimmed.length >= 2 && trimmed.length <= 50;
}

/**
 * Validates the handoff form fields according to SKIPD support requirements:
 * 1. Name: required, 2-100 characters.
 * 2. Email: required, valid email format, max 120 characters.
 * 3. Order number: required (or 'N/A'), 2-50 characters.
 * 4. Issue description: required, 10-1000 characters.
 */
export function validateHandoffForm(data: Partial<HandoffFormData>): HandoffValidationResult {
  const errors: HandoffValidationErrors = {};

  // 1. Name validation
  const trimmedName = data.name ? data.name.trim() : "";
  if (!trimmedName) {
    errors.name = "Name is required.";
  } else if (trimmedName.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (trimmedName.length > 100) {
    errors.name = "Name must not exceed 100 characters.";
  }

  // 2. Email validation
  const trimmedEmail = data.email ? data.email.trim() : "";
  if (!trimmedEmail) {
    errors.email = "Email address is required.";
  } else if (trimmedEmail.length > 120) {
    errors.email = "Email address must not exceed 120 characters.";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address (e.g. name@example.com).";
  }

  // 3. Order number validation
  const trimmedOrderNumber = data.orderNumber ? data.orderNumber.trim() : "";
  if (!trimmedOrderNumber) {
    errors.orderNumber = "Order number is required (enter 'N/A' if you do not have one).";
  } else if (!isValidOrderNumber(trimmedOrderNumber)) {
    errors.orderNumber = "Order number must be between 2 and 50 characters, or 'N/A'.";
  }

  // 4. Issue description validation
  const trimmedDescription = data.issueDescription ? data.issueDescription.trim() : "";
  if (!trimmedDescription) {
    errors.issueDescription = "Issue description is required.";
  } else if (trimmedDescription.length < 10) {
    errors.issueDescription = "Please provide at least 10 characters describing your issue.";
  } else if (trimmedDescription.length > 1000) {
    errors.issueDescription = "Issue description must not exceed 1000 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
