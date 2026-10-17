import express from "express";
import {
  getAllReviews,
  createReview,
  checkReviewEligibility,
} from "../Controllers/reviewController.js";
import { authenticate, restrict } from "../middleware/verifyToken.js";

const router = express.Router({ mergeParams: true });

// Check whether logged-in customer has an eligible completed booking to review
router.get("/eligibility", authenticate, restrict(["customer"]), checkReviewEligibility);

router
  .route("/")
  .get(getAllReviews)
  .post(authenticate, restrict(["customer"]), createReview);

export default router;
