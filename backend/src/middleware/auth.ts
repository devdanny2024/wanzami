import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/jwt.js";
import { ROLE_PERMISSIONS, Permission } from "../auth/permissions.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: bigint;
    email: string;
    role: string;
    permissions: Permission[];
    deviceId: string;
  };
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing access token" });
    }
    const token = header.replace("Bearer ", "");
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role === "USER") {
    return res.status(403).json({ message: "Admin role required" });
  }
  return next();
};

export const requirePermission =
  (permission: Permission) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const allowed =
      req.user.permissions?.includes(permission) ||
      ROLE_PERMISSIONS[req.user.role]?.includes(permission);
    if (!allowed) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };

export const verifyJWT = requireAuth;
