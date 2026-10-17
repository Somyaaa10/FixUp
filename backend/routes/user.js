import express from "express";
import {
  updateUser,
  updateUserProfileMe,
  deleteUser,
  getSingleUser,
  getAllUsers,
  getUserProfile,
  getMyAppointments,
  cancelMyAppointment,
} from "../Controllers/userController.js";
import { authenticate, restrict } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/profile/me", authenticate, restrict(["customer"]), getUserProfile);
router.put("/profile/me", authenticate, restrict(["customer"]), updateUserProfileMe);
router.get("/appointments/my-appointments", authenticate, restrict(["customer"]), getMyAppointments);
router.patch("/appointments/:id/cancel", authenticate, restrict(["customer"]), cancelMyAppointment);

router.get("/:id", authenticate, restrict(["customer", "admin"]), getSingleUser);
router.get("/", authenticate, restrict(["admin"]), getAllUsers);
router.put("/:id", authenticate, restrict(["customer"]), updateUser);
router.delete("/:id", authenticate, restrict(["customer", "admin"]), deleteUser);

export default router;
