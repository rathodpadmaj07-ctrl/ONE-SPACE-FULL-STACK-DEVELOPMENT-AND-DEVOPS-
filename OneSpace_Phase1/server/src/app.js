import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import itemsRoutes from "./routes/items.js";
import spacesRoutes from "./routes/spaces.js";
import usersRoutes from "./routes/users.js";
import notificationsRoutes from "./routes/notifications.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = new Set([
  "http://onespace.local",
  "http://onespace.local:80",
  "http://onespace.local:5173",
  "http://localhost:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5000"
]);

if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.add(process.env.CLIENT_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "OneSpace API is running" });
});

app.use("/api/items", itemsRoutes);
app.use("/api/spaces", spacesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes);

// Static frontend production build serving (Express 5 compatible)
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: "Validation failed", errors: error.errors });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
