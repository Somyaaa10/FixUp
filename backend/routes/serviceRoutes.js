import express from "express";
import { getAllServices, getSingleService } from "../Controllers/serviceController.js";

const router = express.Router();

router.get("/", getAllServices);
router.get("/:id", getSingleService);

export default router;
