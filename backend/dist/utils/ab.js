import crypto from "crypto";
/**
 * Deterministically assign a variant given a stable seed (e.g., profileId).
 * No persistence needed; hashing keeps buckets sticky.
 */
export function assignVariant(experiment, seed, variants = ["control", "treatment"]) {
    const hash = crypto.createHash("sha256").update(`${experiment}:${seed}`).digest("hex");
    // Take first 8 hex chars to an int
    const bucket = parseInt(hash.slice(0, 8), 16);
    const variant = variants[bucket % variants.length] ?? variants[0];
    return { experiment, variant };
}
