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
import ppvRoutes from "./routes/ppvRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import { recordError } from "./utils/errorLogger.js";
import type { AuthenticatedRequest } from "./middleware/auth.js";

const app = express();

const allowedOrigins = [
  "https://wanzami.vercel.app",
  "https://wanzami-admin.vercel.app",
  "https://api.carlylehub.org",
  "https://wanzami.duckdns.org",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Fallback: allow all origins to avoid blocking admin until we have the exact host configured.
      return callback(null, true);
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
// Ensure CORS headers even on errors/proxies that might strip the above.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", contentRoutes);
app.use("/api", eventRoutes);
app.use("/api", popularityRoutes);
app.use("/api", recommendationRoutes);
app.use("/api", logRoutes);
app.use("/api", ppvRoutes);
app.use("/api", emailRoutes);

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
