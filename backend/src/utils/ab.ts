import crypto from "crypto";

export type VariantAssignment = {
  experiment: string;
  variant: string;
};

/**
 * Deterministically assign a variant given a stable seed (e.g., profileId).
 * No persistence needed; hashing keeps buckets sticky.
 */
export function assignVariant(
  experiment: string,
  seed: string,
  variants: string[] = ["control", "treatment"],
): VariantAssignment {
  const hash = crypto.createHash("sha256").update(`${experiment}:${seed}`).digest("hex");
  // Take first 8 hex chars to an int
  const bucket = parseInt(hash.slice(0, 8), 16);
  const variant = variants[bucket % variants.length] ?? variants[0];
  return { experiment, variant };
}
