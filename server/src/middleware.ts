import { NextFunction, Request, Response } from "express";
import { verifyToken } from "./auth.js";
import { Role } from "./types.js";
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) =>
    !req.user || !roles.includes(req.user.role)
      ? res.status(403).json({ error: "Insufficient permission" })
      : next();
