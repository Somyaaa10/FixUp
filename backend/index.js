import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoute from "./routes/auth.js";
import userRoute from "./routes/user.js";
import professionalRoute from "./routes/professional.js";
import reviewRoute from "./routes/review.js";
import bookingRoute from "./routes/booking.js";
import serviceRoute from "./routes/serviceRoutes.js";
import adminRoute from "./routes/adminRoutes.js";
import { seedServicesIfEmpty } from "./Controllers/serviceController.js";
import { seedAdminIfMissing } from "./scripts/createAdmin.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

const corsOptions = {
  origin: true,
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

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();
