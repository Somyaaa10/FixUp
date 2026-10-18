import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoute from "./routes/auth.js";
import userRoute from "./routes/user.js";
import professionalRoute from "./routes/professional.js";
import reviewRoute from "./routes/review.js";
import bookingRoute from "./routes/booking.js";
import serviceRoute from "./routes/serviceRoutes.js";
import adminRoute from "./routes/adminRoutes.js";
import contactRoute from "./routes/contactRoutes.js";
import { seedServicesIfEmpty } from "./Controllers/serviceController.js";
import { seedAdminIfMissing } from "./scripts/createAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 8001;

// Allowed Origins configuration
const configuredOrigins = [
  process.env.CLIENT_SITE_URL,
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const allowedOrigins = Array.from(
  new Set(configuredOrigins.flatMap((url) => [url.trim().replace(/\/+$/, ""), url.trim()]))
);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests, allowed origins, or non-production environment
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: origin not allowed"));
    }
  },
  credentials: true,
};

// Database connection logic with caching for serverless environments
let dbConnectionPromise = null;
let isSeeded = false;

mongoose.set("strictQuery", false);

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }

  const rawMongoUri =
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

  const mongoUri = rawMongoUri?.trim() || "mongodb://127.0.0.1:27017/fixup";
  const sanitizedUri = mongoUri.replace(/\/\/(.*?):(.*?)@/, "//$1:***@");

  dbConnectionPromise = mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(async (conn) => {
      console.log(`MongoDB connected successfully (${sanitizedUri})`);
      if (!isSeeded) {
        try {
          await seedServicesIfEmpty();
          await seedAdminIfMissing();
          isSeeded = true;
        } catch (seedErr) {
          console.warn("Database seeding warning:", seedErr.message);
        }
      }
      return conn;
    })
    .catch((error) => {
      dbConnectionPromise = null;
      console.error(`MongoDB connection error (${sanitizedUri}):`, error.message);
      throw error;
    });

  return dbConnectionPromise;
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Serverless DB connection middleware: ensure DB connection is initiated before handling requests
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error("Database connection failure in request middleware:", err.message);
    }
  }
  next();
});

// Root & Health Check routes
app.get("/", (req, res) => {
  res.send("FixUp API is running");
});

app.get(["/api/health", "/health"], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? "ok" : "degraded";

  return res.status(isDbConnected ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: isDbConnected ? "connected" : "disconnected",
  });
});

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/professionals", professionalRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/bookings", bookingRoute);
app.use("/api/v1/services", serviceRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/contact", contactRoute);

// Start server when executed directly as a standalone process
export const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB during startup:", err.message);
  }

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(server);
    });
  });
};

const isDirectRun = Boolean(
  process.argv?.[1] &&
    (() => {
      try {
        return path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
      } catch {
        return false;
      }
    })()
);

if (isDirectRun && !process.env.VERCEL) {
  startServer();
}

export default app;
