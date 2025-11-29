import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", uploadRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((_, res) => res.status(404).json({ message: "Not found" }));

app.listen(config.port, () => {
  console.log(`Auth service running on http://localhost:${config.port}`);
});
