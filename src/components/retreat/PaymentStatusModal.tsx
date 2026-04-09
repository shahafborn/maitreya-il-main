import { CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import type { RetreatDir } from "./types";

interface PaymentStatusModalProps {
  status: "success" | "failed";
  dir: RetreatDir;
  successTitle: string;
  successBody: string;
  successDetails?: { heading: string; lines: string[] };
  failedTitle: string;
  failedBody: string;
  closeLabel: string;
  failedReturnLabel: string;
  contactEmail: string;
  onClose: () => void;
}

/**
 * Dialog shown on return from Cardcom. `status` comes from the `?payment=` query param.
 * All copy is passed as props so the dialog is language-agnostic.
 */
export const PaymentStatusModal = ({
  status,
  dir,
  successTitle,
  successBody,
  successDetails,
  failedTitle,
  failedBody,
  closeLabel,
  failedReturnLabel,
  contactEmail,
  onClose,
}: PaymentStatusModalProps) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent
      dir={dir}
      className="max-w-md rounded-xl border-0 text-center"
      style={{ fontFamily: RETREAT_FONTS.sans }}
    >
      <div className="py-6 space-y-4">
        {status === "success" ? (
          <>
            <CheckCircle2 className="h-16 w-16 mx-auto" style={{ color: "#4CAF50" }} />
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle
                className="text-2xl font-bold"
                style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK }}
              >
                {successTitle}
              </DialogTitle>
              <DialogDescription
                className="text-base mt-3 leading-relaxed"
                style={{ color: RETREAT_THEME.WARM_GRAY }}
              >
                {successBody}
              </DialogDescription>
            </DialogHeader>
            {successDetails && (
              <div
                className="bg-stone-50 rounded-lg p-4 text-sm space-y-1"
                style={{ color: RETREAT_THEME.WARM_GRAY }}
              >
                <p className="font-semibold" style={{ color: RETREAT_THEME.DARK }}>
                  {successDetails.heading}
                </p>
                {successDetails.lines.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle
                className="text-2xl font-bold"
                style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK }}
              >
                {failedTitle}
              </DialogTitle>
              <DialogDescription
                className="text-base mt-3 leading-relaxed"
                style={{ color: RETREAT_THEME.WARM_GRAY }}
              >
                {failedBody}
              </DialogDescription>
            </DialogHeader>
          </>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 text-base font-bold text-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg"
            style={{ backgroundColor: RETREAT_THEME.GOLD }}
          >
            {status === "success" ? closeLabel : failedReturnLabel}
          </button>
          {status === "failed" && (
            <a
              href={`mailto:${contactEmail}`}
              className="text-sm underline underline-offset-4 transition-colors hover:text-[#C9A961]"
              style={{ color: RETREAT_THEME.WARM_GRAY }}
            >
              {contactEmail}
            </a>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
