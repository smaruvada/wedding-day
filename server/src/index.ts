import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import { pool } from "./db/index.js";
import {
  authRouter,
  memberRouter,
  questionRouter,
  taskRouter,
} from "./routes.js";
const app = express();
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));
app.use("/uploads", express.static(process.env.UPLOAD_DIR ?? "uploads"));
app.use("/auth", authRouter);
app.use("/tasks", taskRouter);
app.use("/questions", questionRouter);
app.use("/members", memberRouter);
if (process.env.NODE_ENV === "production") {
  const clientDir = path.resolve("client/dist");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDir, "index.html")));
}
app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof Error && error.message.includes("Only image"))
      return res.status(400).json({ error: error.message });
    console.error(error);
    res.status(500).json({ error: "Unexpected server error" });
  },
);
const server = app.listen(Number(process.env.PORT ?? 3001), () =>
  console.log(`Wedding Day API listening on ${process.env.PORT ?? 3001}`),
);

const shutdown = (signal: string) => {
  console.log(`${signal} received; shutting down`);
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

export { app };
