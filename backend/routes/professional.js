import express from "express";
import {
  updateProfessional,
  deleteProfessional,
  getSingleProfessional,
  getAllProfessionals,
  getProfessionalProfile,
} from "../Controllers/professionalController.js";
import { authenticate, restrict } from "../middleware/verifyToken.js";
import reviewRouter from "./review.js";

const router = express.Router();

// Nested route for reviews
router.use("/:professionalId/reviews", reviewRouter);

router.get("/profile/me", authenticate, restrict(["professional"]), getProfessionalProfile);

router.get("/:id", getSingleProfessional);
router.get("/", getAllProfessionals);
router.put("/:id", authenticate, restrict(["professional"]), updateProfessional);
router.delete("/:id", authenticate, restrict(["professional", "admin"]), deleteProfessional);

export default router;
