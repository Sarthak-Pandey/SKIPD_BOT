"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import {
  HandoffFormData,
  HandoffValidationErrors,
  validateHandoffForm,
} from "@/lib/handoff-validation";

interface HandoffFormProps {
  messageId: string;
  initialData?: HandoffFormData;
  defaultDescription?: string;
  isSubmitted?: boolean;
  onSubmit: (data: HandoffFormData) => void;
  onEdit?: () => void;
}

export default function HandoffForm({
  messageId,
  initialData,
  defaultDescription = "",
  isSubmitted = false,
  onSubmit,
  onEdit,
}: HandoffFormProps) {
  const [formData, setFormData] = useState<HandoffFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    orderNumber: initialData?.orderNumber || "",
    issueDescription: initialData?.issueDescription || defaultDescription || "",
  });

  const [errors, setErrors] = useState<HandoffValidationErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // If the user already attempted to submit, validate actively on change
    if (hasAttemptedSubmit) {
      const res = validateHandoffForm(updated);
      setErrors(res.errors);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const validation = validateHandoffForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      orderNumber: formData.orderNumber.trim(),
      issueDescription: formData.issueDescription.trim(),
    });
  };

  // 1. Prepared / Submitted State View (Never claims human notified or ticket created)
  if (isSubmitted && initialData) {
    return (
      <div
        role="region"
        aria-label="Prepared Handoff Details"
        className="mt-2.5 p-3.5 bg-[#FFF8E7] border border-[#3C0C1C]/20 rounded-xl shadow-xs text-xs text-[#3C0C1C] space-y-2.5 animate-fadeIn"
      >
        <div className="flex items-center gap-1.5 font-semibold text-[#3C0C1C]">
          <svg
            className="w-4 h-4 text-[#3C0C1C]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Handoff Request Prepared (Prototype)</span>
        </div>

        {/* Clear prototype disclaimer */}
        <div className="p-2.5 rounded-lg bg-[#FFE6A9]/40 border border-[#3C0C1C]/15 text-[11px] leading-relaxed text-[#3C0C1C]/90">
          <p className="font-medium text-[#3C0C1C] mb-1">
            Status: Prepared locally in this session
          </p>
          <p>
            Please note: In this prototype, your details have{" "}
            <strong>not been sent to the SKIPD team</strong> and{" "}
            <strong>no support ticket has been created</strong>.
          </p>
          <p className="mt-1">
            To reach our human team directly, please email{" "}
            <a
              href="mailto:info@skipd.in"
              className="underline font-semibold text-[#3C0C1C] hover:text-[#5c132b]"
            >
              info@skipd.in
            </a>
            .
          </p>
        </div>

        {/* Prepared Data Summary */}
        <div className="space-y-1.5 pt-1 text-[11px] border-t border-[#3C0C1C]/10">
          <div>
            <span className="font-semibold text-[#3C0C1C]/70">Name: </span>
            <span className="font-medium">{initialData.name}</span>
          </div>
          <div>
            <span className="font-semibold text-[#3C0C1C]/70">Email: </span>
            <span className="font-medium">{initialData.email}</span>
          </div>
          <div>
            <span className="font-semibold text-[#3C0C1C]/70">Order Number: </span>
            <span className="font-medium">{initialData.orderNumber}</span>
          </div>
          <div>
            <span className="font-semibold text-[#3C0C1C]/70">Description: </span>
            <p className="mt-0.5 whitespace-pre-wrap text-[#3C0C1C]/90 bg-white/70 p-1.5 rounded border border-[#3C0C1C]/10">
              {initialData.issueDescription}
            </p>
          </div>
        </div>

        {onEdit && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-medium text-[#3C0C1C] hover:underline underline-offset-2 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span>Edit prepared details</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Active Handoff Input Form
  return (
    <div
      role="region"
      aria-label="Support handoff form"
      className="mt-2.5 p-3.5 bg-white border border-[#3C0C1C]/20 rounded-xl shadow-xs text-[#3C0C1C] animate-fadeIn"
    >
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#3C0C1C]/10">
        <svg
          className="w-4 h-4 text-[#3C0C1C]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="font-semibold text-xs tracking-wide">
          Connect with SKIPD Support
        </span>
      </div>

      <p className="text-[11px] text-[#3C0C1C]/75 mb-3 leading-relaxed">
        Our support team handles sensitive topics and special inquiries directly.
        Please provide your details below.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
        {/* Name Field */}
        <div>
          <label
            htmlFor={`handoff-name-${messageId}`}
            className="block text-[11px] font-semibold text-[#3C0C1C] mb-1"
          >
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id={`handoff-name-${messageId}`}
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Priyal Sharma"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `err-name-${messageId}` : undefined}
            className={`w-full px-2.5 py-1.5 text-xs bg-[#FFF8E7]/40 border rounded-lg text-[#3C0C1C] placeholder-[#3C0C1C]/40 focus:outline-none focus:ring-2 focus:ring-[#3C0C1C] focus:bg-white transition-colors ${
              errors.name ? "border-red-500 bg-red-50/30" : "border-[#3C0C1C]/25"
            }`}
          />
          {errors.name && (
            <p
              id={`err-name-${messageId}`}
              className="text-[10px] text-red-600 font-medium mt-0.5"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor={`handoff-email-${messageId}`}
            className="block text-[11px] font-semibold text-[#3C0C1C] mb-1"
          >
            Email Address <span className="text-red-600">*</span>
          </label>
          <input
            id={`handoff-email-${messageId}`}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `err-email-${messageId}` : undefined}
            className={`w-full px-2.5 py-1.5 text-xs bg-[#FFF8E7]/40 border rounded-lg text-[#3C0C1C] placeholder-[#3C0C1C]/40 focus:outline-none focus:ring-2 focus:ring-[#3C0C1C] focus:bg-white transition-colors ${
              errors.email ? "border-red-500 bg-red-50/30" : "border-[#3C0C1C]/25"
            }`}
          />
          {errors.email && (
            <p
              id={`err-email-${messageId}`}
              className="text-[10px] text-red-600 font-medium mt-0.5"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Order Number Field */}
        <div>
          <label
            htmlFor={`handoff-order-${messageId}`}
            className="block text-[11px] font-semibold text-[#3C0C1C] mb-1"
          >
            Order Number <span className="text-red-600">*</span>
            <span className="text-[10px] font-normal text-[#3C0C1C]/60 ml-1">
              (or enter &apos;N/A&apos; if no order)
            </span>
          </label>
          <input
            id={`handoff-order-${messageId}`}
            name="orderNumber"
            type="text"
            value={formData.orderNumber}
            onChange={handleChange}
            placeholder="e.g. #1042 or N/A"
            aria-required="true"
            aria-invalid={!!errors.orderNumber}
            aria-describedby={
              errors.orderNumber ? `err-order-${messageId}` : undefined
            }
            className={`w-full px-2.5 py-1.5 text-xs bg-[#FFF8E7]/40 border rounded-lg text-[#3C0C1C] placeholder-[#3C0C1C]/40 focus:outline-none focus:ring-2 focus:ring-[#3C0C1C] focus:bg-white transition-colors ${
              errors.orderNumber
                ? "border-red-500 bg-red-50/30"
                : "border-[#3C0C1C]/25"
            }`}
          />
          {errors.orderNumber && (
            <p
              id={`err-order-${messageId}`}
              className="text-[10px] text-red-600 font-medium mt-0.5"
            >
              {errors.orderNumber}
            </p>
          )}
        </div>

        {/* Issue Description Field */}
        <div>
          <label
            htmlFor={`handoff-desc-${messageId}`}
            className="block text-[11px] font-semibold text-[#3C0C1C] mb-1"
          >
            Issue Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id={`handoff-desc-${messageId}`}
            name="issueDescription"
            rows={3}
            value={formData.issueDescription}
            onChange={handleChange}
            placeholder="Please describe your question or issue in detail..."
            aria-required="true"
            aria-invalid={!!errors.issueDescription}
            aria-describedby={
              errors.issueDescription ? `err-desc-${messageId}` : undefined
            }
            className={`w-full px-2.5 py-1.5 text-xs bg-[#FFF8E7]/40 border rounded-lg text-[#3C0C1C] placeholder-[#3C0C1C]/40 focus:outline-none focus:ring-2 focus:ring-[#3C0C1C] focus:bg-white transition-colors resize-none ${
              errors.issueDescription
                ? "border-red-500 bg-red-50/30"
                : "border-[#3C0C1C]/25"
            }`}
          />
          {errors.issueDescription && (
            <p
              id={`err-desc-${messageId}`}
              className="text-[10px] text-red-600 font-medium mt-0.5"
            >
              {errors.issueDescription}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-1.5">
          <button
            type="submit"
            className="w-full py-2 px-3 bg-[#3C0C1C] text-[#FFE6A9] font-medium text-xs rounded-lg hover:bg-[#2b0813] active:scale-[0.98] transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#3C0C1C] focus:ring-offset-1 flex items-center justify-center gap-1.5"
          >
            <span>Prepare Support Details</span>
            <svg
              className="w-3.5 h-3.5 text-[#FFE6A9]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
