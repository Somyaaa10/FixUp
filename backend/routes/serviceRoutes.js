import express from "express";
import {
  getAllServices,
  getSingleService,
  createOrRegisterService,
} from "../Controllers/serviceController.js";
import { authenticate } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", getAllServices);
router.get("/:id", getSingleService);
router.post("/", authenticate, createOrRegisterService);

export default router;
