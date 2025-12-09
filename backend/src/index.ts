import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import popularityRoutes from "./routes/popularityRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import { recordError } from "./utils/errorLogger.js";
import type { AuthenticatedRequest } from "./middleware/auth.js";

const app = express();

const allowedOrigins = [
  "https://wanzami.vercel.app",
  "https://wanzami-admin.vercel.app",
  "https://wanzami.duckdns.org",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", contentRoutes);
app.use("/api", eventRoutes);
app.use("/api", popularityRoutes);
app.use("/api", recommendationRoutes);
app.use("/api", logRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((_, res) => res.status(404).json({ message: "Not found" }));

app.use((err: any, req: AuthenticatedRequest, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  void recordError(err, { path: req.originalUrl, userId: req.user?.userId });
  return res.status(500).json({ message: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`Auth service running on http://localhost:${config.port}`);
});
