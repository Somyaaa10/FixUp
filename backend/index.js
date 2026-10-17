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

const allowedOrigins = [
  process.env.CLIENT_SITE_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or allowed origins or non-production environment
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: origin not allowed"));
    }
  },
  credentials: true,
};

app.get("/", (req, res) => {
  res.send("FixUp API is running");
});

// Database connection
mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup");
    console.log("MongoDB is connected");
    await seedServicesIfEmpty();
    await seedAdminIfMissing();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/professionals", professionalRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/bookings", bookingRoute);
app.use("/api/v1/services", serviceRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/contact", contactRoute);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();
