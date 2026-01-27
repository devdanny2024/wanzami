"use client";

import { useEffect, useMemo, useState } from "react";
import {
  authorizePpvOrchestrated,
  initiatePpvOrchestrated,
  verifyPpvOrchestrated,
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

  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
  });

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
        firstName: customer.firstName || undefined,
        lastName: customer.lastName || undefined,
        email: customer.email || undefined,
        phone: customer.phone ? normalizePhone(customer.phone) : undefined,
        country: customer.country || undefined,
        address:
          customer.line1 || customer.city || customer.state || customer.postalCode
            ? {
                line1: customer.line1 || undefined,
                city: customer.city || undefined,
                state: customer.state || undefined,
                postalCode: customer.postalCode || undefined,
                country: customer.country || undefined,
              }
            : undefined,
      };

      const res = await initiatePpvOrchestrated({
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
                phoneNumber: normalizePhone(customer.phone || ""),
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

      const res = await authorizePpvOrchestrated({
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
      const res = await verifyPpvOrchestrated({ accessToken, chargeId });
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
      <DialogContent className="max-w-2xl bg-[#0d0d0d] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg">Flutterwave Checkout</DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            {amountLabel ? `Pay ${amountLabel} ${currency ?? ""}` : "Complete your purchase"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {methodOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  method === opt.key
                    ? "bg-[#fd7e14] text-black border-[#fd7e14]"
                    : "border-white/15 text-white/70 hover:border-white/40"
                }`}
                onClick={() => setMethod(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="First name"
                value={customer.firstName}
                onChange={(e) => setCustomer((prev) => ({ ...prev, firstName: e.target.value }))}
              />
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Last name"
                value={customer.lastName}
                onChange={(e) => setCustomer((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Email"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Country code (e.g. NG, US)"
                value={customer.country}
                onChange={(e) => setCustomer((prev) => ({ ...prev, country: e.target.value }))}
              />
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Address line"
                value={customer.line1}
                onChange={(e) => setCustomer((prev) => ({ ...prev, line1: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="City"
                value={customer.city}
                onChange={(e) => setCustomer((prev) => ({ ...prev, city: e.target.value }))}
              />
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="State"
                value={customer.state}
                onChange={(e) => setCustomer((prev) => ({ ...prev, state: e.target.value }))}
              />
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Postal code"
                value={customer.postalCode}
                onChange={(e) => setCustomer((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
          </div>

          {method === "card" ? (
            <div className="grid gap-3">
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Card number"
                value={card.number}
                onChange={(e) => setCard((prev) => ({ ...prev, number: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                  placeholder="MM"
                  value={card.expiryMonth}
                  onChange={(e) => setCard((prev) => ({ ...prev, expiryMonth: e.target.value }))}
                />
                <input
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                  placeholder="YYYY"
                  value={card.expiryYear}
                  onChange={(e) => setCard((prev) => ({ ...prev, expiryYear: e.target.value }))}
                />
                <input
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                  placeholder="CVV"
                  value={card.cvv}
                  onChange={(e) => setCard((prev) => ({ ...prev, cvv: e.target.value }))}
                />
              </div>
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="PIN (if required)"
                value={card.pin}
                onChange={(e) => setCard((prev) => ({ ...prev, pin: e.target.value }))}
              />
            </div>
          ) : null}

          {method === "ussd" ? (
            <div className="grid gap-3">
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Bank code"
                value={ussd.bankCode}
                onChange={(e) => setUssd((prev) => ({ ...prev, bankCode: e.target.value }))}
              />
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Phone number"
                value={ussd.phoneNumber}
                onChange={(e) => setUssd((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
          ) : null}

          {method === "googlepay" || method === "applepay" ? (
            <div className="grid gap-3">
              <input
                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                placeholder="Card holder name"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded bg-[#fd7e14] text-black text-sm font-semibold disabled:opacity-60"
              disabled={loading}
              onClick={startPayment}
            >
              {loading ? "Processing..." : "Start payment"}
            </button>
            {chargeId ? (
              <button
                type="button"
                className="px-4 py-2 rounded border border-white/20 text-sm"
                disabled={loading}
                onClick={verify}
              >
                Check status
              </button>
            ) : null}
          </div>

          {nextAction || paymentInstruction ? (
            <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm space-y-2">
              <div className="flex flex-wrap gap-3 text-xs text-white/60">
                {reference ? <span>Ref: {reference}</span> : null}
                {chargeId ? <span>Charge: {chargeId}</span> : null}
                {status ? <span>Status: {status}</span> : null}
              </div>

              {redirectUrl ? (
                <div>
                  <p className="text-white/70 mb-2">Complete payment in the new window.</p>
                  <a
                    className="inline-flex px-3 py-2 rounded bg-white/10 text-white"
                    href={redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Continue to payment
                  </a>
                </div>
              ) : null}

              {paymentInstruction ? (
                <div className="text-white/70">
                  <p className="mb-2 font-semibold">Payment instructions</p>
                  <pre className="whitespace-pre-wrap text-xs text-white/70 bg-black/50 p-2 rounded">
                    {JSON.stringify(paymentInstruction, null, 2)}
                  </pre>
                </div>
              ) : null}

              {hasAuthStep ? (
                <div className="space-y-2">
                  {nextAction?.type === "requires_pin" ? (
                    <input
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                      placeholder="Enter card PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                    />
                  ) : null}
                  {nextAction?.type === "requires_otp" ? (
                    <input
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  ) : null}
                  {nextAction?.type === "requires_additional_fields" ? (
                    <textarea
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-xs min-h-[120px]"
                      placeholder="Paste authorization JSON for additional fields"
                      value={additionalJson}
                      onChange={(e) => setAdditionalJson(e.target.value)}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="px-3 py-2 rounded border border-white/20 text-sm"
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
