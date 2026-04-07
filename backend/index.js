require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ─── Database ───────────────────────────────────────────────────────────── */
connectDB();

/* ─── Middleware ─────────────────────────────────────────────────────────── */
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* ─── Routes ─────────────────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes); // Handles /api/protected and /api/me

/* ─── Health check ───────────────────────────────────────────────────────── */
app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

/* ─── 404 ────────────────────────────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

/* ─── Global error handler ───────────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* ─── Start ──────────────────────────────────────────────────────────────── */
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
