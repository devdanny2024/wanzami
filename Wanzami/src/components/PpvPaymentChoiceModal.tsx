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
  onSelect: (provider: "paystack" | "flutterwave") => void;
};

export function PpvPaymentChoiceModal({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-full bg-[#0d0d0d] border border-white/10 text-white"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Choose Payment Method</DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Select your preferred gateway to complete the purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-lg bg-[#fd7e14] text-black font-semibold flex items-center justify-center"
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
          <button
            type="button"
            className="w-full px-4 py-3 rounded-lg border border-white/20 text-white flex items-center justify-center"
            onClick={() => onSelect("flutterwave")}
          >
            <Image
              src="/brands/flutterwave.svg"
              alt="Flutterwave"
              width={160}
              height={32}
              className="h-6 w-auto"
            />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
