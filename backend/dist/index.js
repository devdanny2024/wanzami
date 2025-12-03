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
const app = express();
app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", contentRoutes);
app.use("/api", eventRoutes);
app.use("/api", popularityRoutes);
app.use("/api", recommendationRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use((_, res) => res.status(404).json({ message: "Not found" }));
app.listen(config.port, () => {
    console.log(`Auth service running on http://localhost:${config.port}`);
});
