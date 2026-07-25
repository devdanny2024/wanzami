import { config } from "../config.js";

export const isInternalTestAccount = (email?: string | null) => {
  if (!email) return false;
  return config.internalTestEmails.includes(email.trim().toLowerCase());
};
