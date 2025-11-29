import jwt from "jsonwebtoken";
import { config } from "../config.js";
const signJwt = (payload, secret, expiresIn) => jwt.sign(payload, secret, { expiresIn });
export const signAccessToken = (payload) => signJwt({
    ...payload,
    userId: payload.userId.toString(),
}, config.accessSecret, config.accessTokenTtl);
export const signRefreshToken = (payload) => signJwt({
    ...payload,
    userId: payload.userId.toString(),
}, config.refreshSecret, config.refreshTokenTtl);
export const verifyAccessToken = (token) => {
    const decoded = jwt.verify(token, config.accessSecret);
    return {
        ...decoded,
        userId: BigInt(decoded.userId),
    };
};
export const verifyRefreshToken = (token) => {
    const decoded = jwt.verify(token, config.refreshSecret);
    return {
        ...decoded,
        userId: BigInt(decoded.userId),
    };
};
