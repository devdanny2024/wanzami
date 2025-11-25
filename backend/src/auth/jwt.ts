import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { Permission } from "./permissions.js";

export type AccessTokenPayload = {
  userId: bigint;
  email: string;
  role: string;
  permissions: Permission[];
  deviceId: string;
};

export type RefreshTokenPayload = {
  userId: bigint;
  deviceId: string;
  tokenId: string;
};

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(
    {
      ...payload,
      userId: payload.userId.toString(),
    },
    config.accessSecret,
    { expiresIn: config.accessTokenTtl }
  );

export const signRefreshToken = (payload: RefreshTokenPayload) =>
  jwt.sign(
    {
      ...payload,
      userId: payload.userId.toString(),
    },
    config.refreshSecret,
    { expiresIn: config.refreshTokenTtl }
  );

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, config.accessSecret) as AccessTokenPayload & {
    userId: string;
  };
  return {
    ...decoded,
    userId: BigInt(decoded.userId),
  };
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, config.refreshSecret) as RefreshTokenPayload & {
    userId: string;
  };
  return {
    ...decoded,
    userId: BigInt(decoded.userId),
  };
};
