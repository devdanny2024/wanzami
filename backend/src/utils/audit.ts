import { prisma } from "../prisma.js";

export type AuditAction =
  | "TITLE_CREATE"
  | "TITLE_UPDATE"
  | "TITLE_DELETE"
  | "EPISODE_CREATE"
  | "EPISODE_UPDATE"
  | "ASSET_PRESIGN"
  | "PROFILE_UPDATE";

export async function auditLog(params: {
  userId?: bigint;
  action: AuditAction | string;
  resource: string;
  detail?: Record<string, any>;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        detail: params.detail,
      },
    });
  } catch (err) {
    console.warn("auditLog failed", err);
  }
}
