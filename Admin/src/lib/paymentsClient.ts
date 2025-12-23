import { authFetch } from "@/lib/authClient";

export type PpvPurchase = {
  id: string;
  userId: string;
  titleId: string;
  amountNaira: number;
  currency: string;
  gateway: string;
  status: string;
  paystackRef?: string | null;
  paystackTrxId?: string | null;
  accessExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
  } | null;
  title?: {
    id: string;
    name?: string | null;
    type?: string | null;
    ppvPriceNaira?: number | null;
    ppvCurrency?: string | null;
  } | null;
};

export type PpvPurchaseResponse = {
  totalCount: number;
  totalSuccessAmountNaira: number;
  items: PpvPurchase[];
};

export async function fetchPpvPurchases(token?: string | null, filters?: { status?: string; gateway?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.gateway) params.set("gateway", filters.gateway);
  const res = await authFetch(`/admin/ppv/purchases?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error((res.data as any)?.message || "Failed to load purchases");
  }
  return res.data as PpvPurchaseResponse;
}

