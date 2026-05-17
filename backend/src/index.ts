import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import popularityRoutes from "./routes/popularityRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import ppvRoutes from "./routes/ppvRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import liveRoutes from "./routes/liveRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { recordError } from "./utils/errorLogger.js";
import type { AuthenticatedRequest } from "./middleware/auth.js";
import { prisma } from "./prisma.js";

const app = express();

const allowedOrigins = [
  "https://wanzami.vercel.app",
  "https://wanzami-admin.vercel.app",
  "https://wanzami.tv",
  "https://www.wanzami.tv",
  "https://api.carlylehub.org",
  "https://wanzami.duckdns.org",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4173",
];

const allowedOriginPatterns = [
  // Vercel preview domains for Wanzami frontend/admin under this project team.
  // Keep broad enough for branch preview naming changes.
  /^https:\/\/wanzami(?:-admin)?-git-[^.]+-blvckcodeios-projects\.vercel\.app$/i,
  /^https:\/\/wanzami(?:-admin)?-[^.]*\.vercel\.app$/i,
];

const isAllowedOrigin = (origin: string) =>
  allowedOrigins.includes(origin) || allowedOriginPatterns.some((re) => re.test(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
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
app.use("/api", ppvRoutes);
app.use("/api", emailRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", supportRoutes);
app.use("/api", liveRoutes);
app.use("/api", notificationRoutes);

const healthHandler = async (_req: express.Request, res: express.Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok", database: "ok" });
  } catch (err: any) {
    console.error("healthcheck database error", err);
    return res.status(503).json({
      status: "degraded",
      database: "unavailable",
      reason: err?.name ?? "DatabaseError",
    });
  }
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.use((_, res) => res.status(404).json({ message: "Not found" }));

app.use((err: any, req: AuthenticatedRequest, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  void recordError(err, { path: req.originalUrl, userId: req.user?.userId });
  return res.status(500).json({ message: "Internal server error" });
});

async function bootstrapSuperAdmin() {
  const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_SUPER_ADMIN_NAME ?? "Super Admin";

  if (!email || !password) return;

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      password: passwordHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
      name,
    },
    create: {
      email: email.toLowerCase(),
      password: passwordHash,
      name,
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  console.log("Bootstrapped SUPER_ADMIN:", { id: user.id.toString(), email: user.email });
}

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

void (async () => {
  try {
    await bootstrapSuperAdmin();
  } catch (err) {
    // Don't block service startup if bootstrap fails.
    console.error("bootstrapSuperAdmin failed:", err);
  }

  app.listen(config.port, () => {
    console.log(`Auth service running on http://localhost:${config.port}`);
  });
})();
