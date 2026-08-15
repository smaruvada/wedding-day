import "dotenv/config";
import jwt from "jsonwebtoken";
import { AuthUser } from "./types.js";
const isProduction = process.env.NODE_ENV === "production";
const secret = process.env.JWT_SECRET;

if (isProduction && (!secret || secret.length < 32)) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

const signingSecret = secret ?? "unsafe-development-secret";
export const signToken = (user: AuthUser) =>
  jwt.sign(user, signingSecret, { expiresIn: "7d" });
export const verifyToken = (token: string) =>
  jwt.verify(token, signingSecret) as AuthUser;
