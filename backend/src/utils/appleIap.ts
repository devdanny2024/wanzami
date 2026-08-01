import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AppStoreServerAPIClient,
  SignedDataVerifier,
  Environment,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Apple's own public root CA, checked in as a binary asset under backend/certs.
// Downloaded from https://www.apple.com/certificateauthority/ — this is
// Apple's public PKI material, not a secret. The library needs it to confirm
// a signed transaction genuinely chains back to Apple before it's trusted.
const rootCertPath = path.join(__dirname, "..", "..", "certs", "AppleRootCA-G3.cer");
let rootCert: Buffer | null = null;
try {
  rootCert = fs.readFileSync(rootCertPath);
} catch (err) {
  console.error(`[appleIap] Could not read root certificate at ${rootCertPath}`, err);
}

export const isAppleIapConfigured = () =>
  Boolean(
    config.appleIap.issuerId &&
      config.appleIap.keyId &&
      config.appleIap.privateKey &&
      rootCert
  );

const makeClient = (environment: Environment) =>
  new AppStoreServerAPIClient(
    config.appleIap.privateKey,
    config.appleIap.keyId,
    config.appleIap.issuerId,
    config.appleIap.bundleId,
    environment
  );

const makeVerifier = (environment: Environment) => {
  if (!rootCert) throw new Error("Apple root certificate not loaded");
  return new SignedDataVerifier([rootCert], true, environment, config.appleIap.bundleId);
};

export type VerifiedAppleTransaction = {
  decoded: JWSTransactionDecodedPayload;
  environment: Environment;
};

// A transaction lives in exactly one of Apple's two environments depending on
// whether it was a real purchase or a sandbox/TestFlight one, and there is no
// way to know which in advance from the client alone. Production is the
// common case, so try it first and only fall back to sandbox on a genuine
// "transaction not found" — any other failure (auth, network) should not be
// masked by silently retrying against the other environment.
export const verifyAppleTransaction = async (
  transactionId: string
): Promise<VerifiedAppleTransaction> => {
  if (!isAppleIapConfigured()) {
    throw new Error("Apple IAP is not configured on this server");
  }

  const environments = [Environment.PRODUCTION, Environment.SANDBOX];
  let lastError: unknown;

  for (const environment of environments) {
    try {
      const client = makeClient(environment);
      const info = await client.getTransactionInfo(transactionId);
      if (!info.signedTransactionInfo) {
        throw new Error("Apple returned no signed transaction info");
      }
      const decoded = await makeVerifier(environment).verifyAndDecodeTransaction(
        info.signedTransactionInfo
      );
      return { decoded, environment };
    } catch (err: any) {
      lastError = err;
      const status = err?.httpStatusCode;
      const isNotFound = status === 404 || /transaction.*not.*found/i.test(String(err?.message ?? ""));
      if (environment === Environment.PRODUCTION && isNotFound) {
        continue; // try sandbox next
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Transaction not found in production or sandbox");
};
