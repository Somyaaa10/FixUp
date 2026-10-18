import app, { connectDB } from "../index.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("MongoDB connection error in Vercel serverless handler:", err.message);
  }
  return app(req, res);
}
