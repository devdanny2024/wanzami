import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { config } from "../config.js";

export type CreatorAccessTokenPayload = {
  creatorId: bigint;
  email: string;
};

const signJwt = (payload: jwt.JwtPayload, secret: Secret, expiresIn: string | number) =>
  jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const signCreatorAccessToken = (payload: CreatorAccessTokenPayload) =>
  signJwt(
    { ...payload, creatorId: payload.creatorId.toString() },
    config.creatorJwtSecret as Secret,
    config.creatorAccessTokenTtl
  );

export const verifyCreatorAccessToken = (token: string) => {
  const payload = jwt.verify(token, config.creatorJwtSecret as Secret) as jwt.JwtPayload;
  return {
    creatorId: BigInt(payload.creatorId as string),
    email: payload.email as string,
  };
};

export type CreatorRefreshTokenPayload = {
  creatorId: bigint;
  sessionId: bigint;
};

export const signCreatorRefreshToken = (payload: CreatorRefreshTokenPayload) =>
  signJwt(
    { creatorId: payload.creatorId.toString(), sessionId: payload.sessionId.toString() },
    config.creatorJwtSecret as Secret,
    config.creatorRefreshTokenTtl
  );

export const verifyCreatorRefreshToken = (token: string) => {
  const payload = jwt.verify(token, config.creatorJwtSecret as Secret) as jwt.JwtPayload;
  return {
    creatorId: BigInt(payload.creatorId as string),
    sessionId: BigInt(payload.sessionId as string),
  };
};
