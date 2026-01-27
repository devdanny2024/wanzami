"use client";

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
  onSelect: (provider: "paystack" | "flutterwave") => void;
};

export function PpvPaymentChoiceModal({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 bg-[#0d0d0d] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg">Choose Payment Method</DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Select your preferred gateway to complete the purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-lg bg-[#fd7e14] text-black font-semibold"
            onClick={() => onSelect("paystack")}
          >
            Pay using Paystack
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 rounded-lg border border-white/20 text-white"
            onClick={() => onSelect("flutterwave")}
          >
            Pay using Flutterwave
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
