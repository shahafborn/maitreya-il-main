import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import type { RetreatLang } from "./types";

interface MailingListSignupProps {
  heading: string;
  subheading: string;
  placeholder: string;
  ctaLabel: string;
  successMessage: string;
  errorMessage: string;
  /** Language, passed straight to the Mailchimp sync function as `language`. */
  language: RetreatLang;
  /** Mailchimp tag to apply (e.g. "Hebrew"). */
  tag: string;
}

/**
 * Thin form that POSTs to the `mailchimp-sync` Supabase edge function.
 * All copy comes from props so it's language-agnostic.
 */
export const MailingListSignup = ({
  heading,
  subheading,
  placeholder,
  ctaLabel,
  successMessage,
  errorMessage,
  language,
  tag,
}: MailingListSignupProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const { error } = await supabase.functions.invoke("mailchimp-sync", {
        body: { email, tag, language },
      });
      if (error) throw error;
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-16 px-4" style={{ backgroundColor: "#F5F0EB" }}>
      <div className="max-w-xl mx-auto text-center">
        <h2
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: RETREAT_FONTS.serif }}
        >
          {heading}
        </h2>
        <p className="mb-6" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          {subheading}
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <input
              type="email"
              required
              placeholder={placeholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
              }}
              className="w-full sm:w-72 px-4 py-3 rounded-lg border border-stone-300 bg-white text-right focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: RETREAT_THEME.GOLD }}
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {ctaLabel}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-red-600 text-sm flex items-center justify-center gap-1">
            <XCircle className="h-4 w-4" />
            {errorMessage}
          </p>
        )}
      </div>
    </section>
  );
};
