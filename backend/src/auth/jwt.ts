import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
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

const signJwt = (
  payload: jwt.JwtPayload,
  secret: Secret,
  expiresIn: string | number
) => jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const signAccessToken = (payload: AccessTokenPayload) =>
  signJwt(
    {
      ...payload,
      userId: payload.userId.toString(),
    },
    config.accessSecret as Secret,
    config.accessTokenTtl
  );

export const signRefreshToken = (payload: RefreshTokenPayload) =>
  signJwt(
    {
      ...payload,
      userId: payload.userId.toString(),
    },
    config.refreshSecret as Secret,
    config.refreshTokenTtl
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
