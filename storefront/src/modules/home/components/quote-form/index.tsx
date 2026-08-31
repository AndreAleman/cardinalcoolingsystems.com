"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { captureEvent, identifyUser } from "@lib/util/posthog";
import { filesToAttachments } from "@lib/util/attachments";
import AttachmentInput from "@modules/common/components/attachment-input";

type ProjectType = "Industrial" | "Data Center" | "Food & Sanitary" | null;

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  projectType: ProjectType;
  specifications: string;
}

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  projectType: null,
  specifications: "",
};

export default function QuoteForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const PROJECT_TYPES: ProjectType[] = ["Industrial", "Data Center", "Food & Sanitary"];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.projectType) {
      setErrorMsg("Please select a project type.");
      return;
    }
    setErrorMsg("");
    setStatus("loading");

    try {
      const attachments = await filesToAttachments(attachedFiles);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
          // Map to the shape your existing /store/contact endpoint expects.
          // projectType + specifications are combined into `message`.
          body: JSON.stringify({
            name: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            message: `Project Type: ${form.projectType}\n\nSpecifications:\n${
              form.specifications || "Not provided"
            }`,
            ...(attachments.length > 0 ? { attachments } : {}),
          }),
        }
      );

      if (!res.ok) throw new Error("Request failed");

      // Mirror the GA4 dataLayer push used on the contact page
      if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "contact_form_submit",
          form_type: "rfq",
          project_type: form.projectType,
          user_email: form.email,
          form_location: "homepage_rfq",
        });
      }

      // PostHog: track the form conversion and identify the lead by email
      captureEvent("form_submitted", {
        form_type: "rfq",
        form_location: "homepage_rfq",
        project_type: form.projectType,
        email: form.email,
        num_attachments: attachments.length,
      });
      captureEvent("quote_requested", {
        form_location: "homepage_rfq",
        project_type: form.projectType,
        email: form.email,
      });
      identifyUser(form.email, {
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        lead_project_type: form.projectType,
      });

      setStatus("success");
      setForm(INITIAL_STATE);
      setAttachedFiles([]);
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again or email us directly.");
    }
  }

  const inputClass =
    "w-full bg-white border border-[#dde0e6] text-[#0a1628] placeholder-[#9ca3af] px-4 py-3 text-sm outline-none transition-all duration-150 focus:border-[#0a1628] focus:ring-1 focus:ring-[#0a1628]";

  return (
    <section
      style={{ backgroundColor: "#f0f0f0" }}
      className="relative w-full overflow-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');` }} />

      {/* ── Desktop: image pinned to right edge behind content ── */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* Gradient fade so form stays readable over the image */}
        <div
          className="absolute inset-y-0 left-0 w-[55%] z-10"
          style={{
            background: "linear-gradient(to right, #f0f0f0 65%, transparent 100%)",
          }}
        />
        <div className="absolute inset-y-0 right-0 w-[88%]">
          <Image
            src="/images/quote-form.jpg"
            alt="Cardinal Cooling Systems industrial equipment"
            fill
            loading="lazy"
            sizes="(max-width: 1024px) 0vw, 50vw"
            className="object-cover object-left"
          />
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="relative z-20 flex flex-col lg:flex-row lg:items-start lg:min-h-[700px]">

        {/* ── Left: form content ── */}
        <div className="w-full lg:w-[48%] px-8 md:px-14 lg:px-16 py-16 lg:py-20">

          {/* Eyebrow */}
          <p
            className="text-xs font-medium tracking-[0.18em] uppercase mb-5"
            style={{ color: "#c0392b" }}
          >
            Request a Quote
          </p>

          {/* Headline */}
          <h2
            className="text-4xl md:text-[2.75rem] font-semibold leading-[1.08] tracking-tight mb-4"
            style={{ color: "#0a1628" }}
          >
            Initialize
            <br />
            Project.
          </h2>

          {/* Subheadline */}
          <p
            className="text-[14px] leading-relaxed font-light mb-8 max-w-xs"
            style={{ color: "#4b5563" }}
          >
            Discuss your cooling infrastructure requirements with our engineering team.
          </p>

          {/* ── Success state ── */}
          {status === "success" ? (
            <div
              className="py-10 px-8 bg-white border border-[#dde0e6]"
              style={{ borderRadius: "5px" }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center mb-5"
                style={{ backgroundColor: "#0a1628", borderRadius: "5px" }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M3 9L7.5 13.5L15 5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#0a1628" }}>
                Request received.
              </h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: "#6b7280" }}>
                Our engineering team will review your requirements and follow up within one business
                day.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-7 text-xs font-medium tracking-widest uppercase underline underline-offset-4"
                style={{ color: "#c0392b" }}
              >
                Submit another request
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate className="space-y-3">

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-[11px] font-medium tracking-widest uppercase mb-1.5"
                    style={{ color: "#0a1628" }}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Jane"
                    className={inputClass}
                    style={{ borderRadius: "5px" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-[11px] font-medium tracking-widest uppercase mb-1.5"
                    style={{ color: "#0a1628" }}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Smith"
                    className={inputClass}
                    style={{ borderRadius: "5px" }}
                  />
                </div>
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-[11px] font-medium tracking-widest uppercase mb-1.5"
                    style={{ color: "#0a1628" }}
                  >
                    Work Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    className={inputClass}
                    style={{ borderRadius: "5px" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-[11px] font-medium tracking-widest uppercase mb-1.5"
                    style={{ color: "#0a1628" }}
                  >
                    Phone{" "}
                    <span
                      className="normal-case font-light tracking-normal text-[10px]"
                      style={{ color: "#9ca3af" }}
                    >
                      (optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (800) 000-0000"
                    className={inputClass}
                    style={{ borderRadius: "5px" }}
                  />
                </div>
              </div>

              {/* Project Type toggles */}
              <div>
                <label
                  className="block text-[11px] font-medium tracking-widest uppercase mb-2"
                  style={{ color: "#0a1628" }}
                >
                  Project Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TYPES.map((type) => {
                    const active = form.projectType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, projectType: type }))}
                        style={{
                          borderRadius: "5px",
                          backgroundColor: active ? "#0a1628" : "white",
                          color: active ? "white" : "#0a1628",
                          border: active ? "1px solid #0a1628" : "1px solid #dde0e6",
                          transition: "all 0.12s ease",
                        }}
                        className="px-4 py-2 text-[11px] font-medium tracking-wide"
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <label
                  className="block text-[11px] font-medium tracking-widest uppercase mb-1.5"
                  style={{ color: "#0a1628" }}
                >
                  Specifications
                </label>
                <textarea
                  name="specifications"
                  value={form.specifications}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Flow rate, pressure, temperature range, connection sizes…"
                  className={`${inputClass} resize-none`}
                  style={{ borderRadius: "5px" }}
                />
              </div>

              {/* Attachments */}
              <AttachmentInput
                files={attachedFiles}
                onChange={setAttachedFiles}
                disabled={status === "loading"}
                labelClassName="block text-[11px] font-medium tracking-widest uppercase mb-1.5 text-[#0a1628]"
              />

              {/* Error message */}
              {(status === "error" || errorMsg) && (
                <p className="text-xs font-medium" style={{ color: "#c0392b" }}>
                  {errorMsg}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  backgroundColor: "#0a1628",
                  borderRadius: "5px",
                  transition: "opacity 0.15s ease",
                }}
                className="w-full py-3.5 text-sm font-medium tracking-wide text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="white"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                      />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  "Submit Request →"
                )}
              </button>

              <p className="text-[11px] font-light text-center pt-1" style={{ color: "#9ca3af" }}>
                Or email us at{" "}
                <a
                  href="mailto:aleman@cardinalcoolingsystems.com"
                  className="underline underline-offset-2"
                  style={{ color: "#6b7280" }}
                >
                  aleman@cardinalcoolingsystems.com
                </a>
              </p>
            </form>
          )}
        </div>

        {/* ── Mobile: image stacks below the form ── */}
        <div className="block lg:hidden w-full h-64 relative">
          <Image
            src="/images/quote-form.jpg"
            alt="Cardinal Cooling Systems industrial equipment"
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}
