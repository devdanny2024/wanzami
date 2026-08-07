import { NextFunction, Request, Response } from "express";
import { verifyCreatorAccessToken } from "../auth/creatorJwt.js";

export interface CreatorAuthenticatedRequest extends Request {
  creator?: {
    creatorId: bigint;
    email: string;
  };
}

export const requireCreatorAuth = (
  req: CreatorAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing access token" });
    }
    const token = header.replace("Bearer ", "");
    req.creator = verifyCreatorAccessToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
