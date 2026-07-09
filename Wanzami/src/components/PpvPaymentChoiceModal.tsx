"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (provider: "paystack") => void;
};

export function PpvPaymentChoiceModal({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-[calc(100%-2rem)] bg-cs-panel cs-border cs-shadow text-cs-ink"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wide text-2xl text-cs-ink">Pay with Paystack</DialogTitle>
          <DialogDescription className="text-sm text-cs-muted">
            Complete your purchase securely with Paystack.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <button
            type="button"
            className="w-full px-4 py-3 min-h-[48px] bg-cs-ink text-cs-paper cs-shadow-sm font-semibold flex items-center justify-center transition-transform hover:-translate-y-0.5"
            onClick={() => onSelect("paystack")}
          >
            <Image
              src="/brands/paystack.svg"
              alt="Paystack"
              width={140}
              height={32}
              className="h-6 w-auto"
            />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
