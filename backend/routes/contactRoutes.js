import express from "express";
import { submitContactMessage } from "../Controllers/contactController.js";

const router = express.Router();

// POST /api/v1/contact - Public contact submission
router.post("/", submitContactMessage);

export default router;
