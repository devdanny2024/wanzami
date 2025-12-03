import { prisma } from "../prisma.js";
export async function auditLog(params) {
    try {
        await prisma.adminAuditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                resource: params.resource,
                detail: params.detail,
            },
        });
    }
    catch (err) {
        console.warn("auditLog failed", err);
    }
}
