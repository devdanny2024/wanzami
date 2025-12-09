import { Request, Response } from "express";
import { prisma } from "../prisma.js";

export const listLogs = async (_req: Request, res: Response) => {
  const logs = await prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return res.json({
    logs: logs.map((l) => ({
      id: l.id.toString(),
      level: l.level,
      message: l.message,
      stack: l.stack,
      path: l.path,
      context: l.context,
      userId: l.userId ? l.userId.toString() : null,
      createdAt: l.createdAt,
    })),
  });
};
