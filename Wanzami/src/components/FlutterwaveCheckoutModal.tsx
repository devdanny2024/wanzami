"use client";

import { useEffect, useMemo, useState } from "react";
import {
  authorizePpvV4General,
  initiatePpvV4General,
  verifyPpvV4General,
} from "@/lib/contentClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "ussd"
  | "opay"
  | "googlepay"
  | "applepay";

type NextAction = {
  type?: string;
  redirect_url?: { url?: string };
  url?: string;
  [key: string]: any;
} | null;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  accessToken: string;
  amountLabel?: string;
  currency?: string;
  onSuccess?: () => void;
};

const methodOptions: Array<{ key: PaymentMethod; label: string; hint?: string }> = [
  { key: "card", label: "Card" },
  { key: "bank_transfer", label: "Bank Transfer" },
  { key: "ussd", label: "USSD" },
  { key: "opay", label: "Opay" },
  { key: "googlepay", label: "Google Pay" },
  { key: "applepay", label: "Apple Pay" },
];

const normalizePhone = (value: string) => value.replace(/\s+/g, "").trim();

export function FlutterwaveCheckoutModal({
  open,
  onOpenChange,
  titleId,
  accessToken,
  amountLabel,
  currency,
  onSuccess,
}: Props) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAction, setNextAction] = useState<NextAction>(null);
  const [paymentInstruction, setPaymentInstruction] = useState<any>(null);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [additionalJson, setAdditionalJson] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [card, setCard] = useState({
    number: "",
    cvv: "",
    expiryMonth: "",
    expiryYear: "",
    pin: "",
  });

  const [ussd, setUssd] = useState({
    bankCode: "",
    phoneNumber: "",
  });

  const [walletName, setWalletName] = useState("" as string);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNextAction(null);
    setPaymentInstruction(null);
    setChargeId(null);
    setReference(null);
    setStatus(null);
    setPin("");
    setOtp("");
    setAdditionalJson("");
  }, [open]);

  const redirectUrl = useMemo(() => {
    if (!nextAction) return null;
    if (nextAction.type === "redirect_url") {
      return nextAction.redirect_url?.url ?? nextAction.url ?? null;
    }
    return null;
  }, [nextAction]);

  const startPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const customerPayload = {
        phone: customerPhone ? normalizePhone(customerPhone) : undefined,
      };

      const res = await initiatePpvV4General({
        titleId,
        accessToken,
        method,
        card:
          method === "card"
            ? {
                number: card.number,
                cvv: card.cvv,
                expiryMonth: card.expiryMonth,
                expiryYear: card.expiryYear,
                pin: card.pin || undefined,
              }
            : undefined,
        ussd:
          method === "ussd"
            ? {
                bankCode: ussd.bankCode || undefined,
                phoneNumber: ussd.phoneNumber || undefined,
              }
            : undefined,
        googlepay:
          method === "googlepay"
            ? {
                cardHolderName: walletName || undefined,
              }
            : undefined,
        applepay:
          method === "applepay"
            ? {
                cardHolderName: walletName || undefined,
              }
            : undefined,
        opay:
          method === "opay"
            ? {
                phoneNumber: normalizePhone(customerPhone || ""),
              }
            : undefined,
        customer: customerPayload,
      });

      setReference(res.reference ?? null);
      setChargeId(res.chargeId ?? null);
      setStatus(res.status ?? null);
      setNextAction(res.nextAction ?? null);
      setPaymentInstruction(res.paymentInstruction ?? null);
    } catch (err: any) {
      setError(err?.message ?? "Unable to start payment");
    } finally {
      setLoading(false);
    }
  };

  const authorize = async () => {
    if (!chargeId) return;
    setLoading(true);
    setError(null);
    try {
      let authorization: Record<string, any> = {};
      if (nextAction?.type === "requires_pin") {
        authorization = { type: "pin", pin };
      } else if (nextAction?.type === "requires_otp") {
        authorization = { type: "otp", otp: { code: otp } };
      } else if (nextAction?.type === "requires_additional_fields") {
        if (!additionalJson) throw new Error("Provide additional fields JSON");
        authorization = JSON.parse(additionalJson);
      } else {
        throw new Error("No authorization step required");
      }

      const res = await authorizePpvV4General({
        accessToken,
        chargeId,
        authorization,
      });
      const data = res?.data ?? res;
      setStatus(data?.status ?? res?.status ?? "pending");
      setNextAction(data?.next_action ?? null);
      setPaymentInstruction(data?.payment_instruction ?? null);
    } catch (err: any) {
      setError(err?.message ?? "Authorization failed");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!chargeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyPpvV4General({ accessToken, chargeId });
      const data = res?.data ?? res;
      const currentStatus = data?.status ?? data?.data?.status ?? res?.status;
      setStatus(currentStatus ?? "pending");
      if (["successful", "succeeded", "completed"].includes(String(currentStatus).toLowerCase())) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const hasAuthStep =
    nextAction?.type === "requires_pin" ||
    nextAction?.type === "requires_otp" ||
    nextAction?.type === "requires_additional_fields";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-card border border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wide text-2xl">Flutterwave Checkout</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {amountLabel ? `Pay ${amountLabel} ${currency ?? ""}` : "Complete your purchase"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {methodOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`px-3 py-1.5 min-h-[40px] rounded-full text-sm border transition ${
                  method === opt.key
                    ? "bg-brand text-primary-foreground border-brand"
                    : "border-white/15 text-muted-foreground hover:border-white/40 hover:text-foreground"
                }`}
                onClick={() => setMethod(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {(method === "opay" || method === "ussd") ? (
            <input
              className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
              placeholder="Phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          ) : null}

          {method === "card" ? (
            <div className="grid gap-3">
              <input
                className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                placeholder="Card number"
                value={card.number}
                onChange={(e) => setCard((prev) => ({ ...prev, number: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                  placeholder="MM"
                  value={card.expiryMonth}
                  onChange={(e) => setCard((prev) => ({ ...prev, expiryMonth: e.target.value }))}
                />
                <input
                  className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                  placeholder="YYYY"
                  value={card.expiryYear}
                  onChange={(e) => setCard((prev) => ({ ...prev, expiryYear: e.target.value }))}
                />
                <input
                  className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                  placeholder="CVV"
                  value={card.cvv}
                  onChange={(e) => setCard((prev) => ({ ...prev, cvv: e.target.value }))}
                />
              </div>
              <input
                className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                placeholder="PIN (if required)"
                value={card.pin}
                onChange={(e) => setCard((prev) => ({ ...prev, pin: e.target.value }))}
              />
            </div>
          ) : null}

          {method === "ussd" ? (
            <div className="grid gap-3">
              <input
                className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                placeholder="Bank code"
                value={ussd.bankCode}
                onChange={(e) => setUssd((prev) => ({ ...prev, bankCode: e.target.value }))}
              />
              <input
                className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                placeholder="Phone number"
                value={ussd.phoneNumber}
                onChange={(e) => setUssd((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
          ) : null}

          {method === "googlepay" || method === "applepay" ? (
            <div className="grid gap-3">
              <input
                className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                placeholder="Card holder name"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-brand hover:bg-brand-dark text-primary-foreground text-sm font-semibold disabled:opacity-60 transition-colors"
              disabled={loading}
              onClick={startPayment}
            >
              {loading ? "Processing..." : "Start payment"}
            </button>
            {chargeId ? (
              <button
                type="button"
                className="px-5 py-2.5 min-h-[44px] rounded-lg border border-white/20 hover:bg-white/5 text-sm transition-colors"
                disabled={loading}
                onClick={verify}
              >
                Check status
              </button>
            ) : null}
          </div>

          {nextAction || paymentInstruction ? (
            <div className="rounded-xl border border-white/10 bg-graphite-2 p-3 text-sm space-y-2">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {reference ? <span>Ref: {reference}</span> : null}
                {chargeId ? <span>Charge: {chargeId}</span> : null}
                {status ? <span>Status: {status}</span> : null}
              </div>

              {redirectUrl ? (
                <div>
                  <p className="text-foreground/70 mb-2">Complete payment in the new window.</p>
                  <a
                    className="inline-flex min-h-[44px] items-center px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-primary-foreground font-semibold transition-colors"
                    href={redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Continue to payment
                  </a>
                </div>
              ) : null}

              {paymentInstruction ? (
                <div className="text-foreground/70">
                  <p className="mb-2 font-semibold">Payment instructions</p>
                  <pre className="whitespace-pre-wrap text-xs text-foreground/70 bg-black/50 p-2 rounded-lg overflow-x-auto">
                    {JSON.stringify(paymentInstruction, null, 2)}
                  </pre>
                </div>
              ) : null}

              {hasAuthStep ? (
                <div className="space-y-2">
                  {nextAction?.type === "requires_pin" ? (
                    <input
                      className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                      placeholder="Enter card PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                    />
                  ) : null}
                  {nextAction?.type === "requires_otp" ? (
                    <input
                      className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:border-brand/50"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  ) : null}
                  {nextAction?.type === "requires_additional_fields" ? (
                    <textarea
                      className="bg-graphite-2 border border-white/10 rounded-lg px-3 py-2 text-xs min-h-[120px] focus:outline-none focus:border-brand/50"
                      placeholder="Paste authorization JSON for additional fields"
                      value={additionalJson}
                      onChange={(e) => setAdditionalJson(e.target.value)}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="px-5 py-2.5 min-h-[44px] rounded-lg border border-white/20 hover:bg-white/5 text-sm transition-colors"
                    disabled={loading}
                    onClick={authorize}
                  >
                    Submit authorization
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
