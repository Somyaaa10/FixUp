import Review from "../models/ReviewSchema.js";
import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import mongoose from "mongoose";

// GET /api/v1/reviews or /api/v1/professionals/:professionalId/reviews
export const getAllReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.params.professionalId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.professionalId)) {
        return res.status(400).json({ success: false, message: "Invalid Professional ID format" });
      }
      filter.professional = req.params.professionalId;
    }

    const reviews = await Review.find(filter)
      .populate("user", "name photo")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Successful", data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve reviews" });
  }
};

// GET /api/v1/professionals/:professionalId/reviews/eligibility
export const checkReviewEligibility = async (req, res) => {
  try {
    const professionalId = req.params.professionalId;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(professionalId)) {
      return res.status(400).json({ success: false, message: "Invalid Professional ID format" });
    }

    // Find all completed bookings for this customer and professional
    const completedBookings = await Booking.find({
      professional: professionalId,
      user: userId,
      status: "completed",
    }).sort({ createdAt: -1 });

    if (!completedBookings || completedBookings.length === 0) {
      return res.status(200).json({
        success: true,
        eligible: false,
        message: "Only homeowners with a completed booking can review this professional.",
      });
    }

    // Check which completed bookings have already been reviewed
    const bookingIds = completedBookings.map((b) => b._id);
    const existingReviews = await Review.find({ booking: { $in: bookingIds } }).select("booking");
    const reviewedSet = new Set(existingReviews.map((r) => r.booking?.toString()));

    const eligibleBooking = completedBookings.find(
      (b) => !reviewedSet.has(b._id.toString())
    );

    if (!eligibleBooking) {
      return res.status(200).json({
        success: true,
        eligible: false,
        message: "You have already reviewed all your completed bookings for this professional.",
      });
    }

    return res.status(200).json({
      success: true,
      eligible: true,
      bookingId: eligibleBooking._id,
      message: "Eligible to review",
    });
  } catch (err) {
    console.error("Check review eligibility error:", err);
    res.status(500).json({ success: false, message: "Failed to verify review eligibility" });
  }
};

// POST /api/v1/professionals/:professionalId/reviews
export const createReview = async (req, res) => {
  const professionalId = req.params.professionalId || req.body.professional;
  const userId = req.userId;
  const { rating, reviewText, bookingId } = req.body;

  if (!professionalId || !mongoose.Types.ObjectId.isValid(professionalId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing Professional ID" });
  }

  // 1. Rating validation: must be an integer between 1 and 5
  const numericRating = Number(rating);
  if (
    rating === undefined ||
    rating === null ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return res.status(400).json({
      success: false,
      message: "Rating must be an integer between 1 and 5",
    });
  }

  // 2. Review text validation: must be non-empty string
  if (
    !reviewText ||
    typeof reviewText !== "string" ||
    reviewText.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Review text is required and cannot be empty",
    });
  }

  try {
    // 3. Verify target professional exists
    const professional = await Profession.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    let targetBooking = null;

    if (bookingId) {
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ success: false, message: "Invalid Booking ID format" });
      }

      targetBooking = await Booking.findById(bookingId);
      if (!targetBooking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }

      // Customer ownership check
      if (targetBooking.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only review bookings made by your own account",
        });
      }

      // Professional assignment check
      if (targetBooking.professional.toString() !== professionalId) {
        return res.status(400).json({
          success: false,
          message: "This booking does not belong to the professional being reviewed",
        });
      }

      // Status check: must be completed
      if (targetBooking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: `Cannot review an uncompleted booking. Current booking status is '${targetBooking.status}'.`,
        });
      }
    } else {
      // Auto-discover an eligible completed booking for this user & professional
      const completedBookings = await Booking.find({
        professional: professionalId,
        user: userId,
        status: "completed",
      }).sort({ createdAt: -1 });

      if (!completedBookings || completedBookings.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You must have a completed booking with this professional to submit a review",
        });
      }

      const bookingIds = completedBookings.map((b) => b._id);
      const existingReviews = await Review.find({ booking: { $in: bookingIds } }).select("booking");
      const reviewedSet = new Set(existingReviews.map((r) => r.booking?.toString()));

      targetBooking = completedBookings.find((b) => !reviewedSet.has(b._id.toString()));

      if (!targetBooking) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed all your completed bookings with this professional",
        });
      }
    }

    // 4. Duplicate review prevention on this booking
    const duplicateReview = await Review.findOne({ booking: targetBooking._id });
    if (duplicateReview) {
      return res.status(400).json({
        success: false,
        message: "A review has already been submitted for this booking",
      });
    }

    // 5. Create and save new review
    const newReview = new Review({
      professional: professionalId,
      user: userId,
      booking: targetBooking._id,
      rating: numericRating,
      reviewText: reviewText.trim(),
    });

    const savedReview = await newReview.save();

    // 6. Push review to professional's reviews array
    await Profession.findByIdAndUpdate(professionalId, {
      $push: { reviews: savedReview._id },
    });

    // 7. Recalculate and update professional's averageRating and totalRating
    const allReviews = await Review.find({ professional: professionalId });
    const totalRating = allReviews.length;
    const avgRating =
      totalRating > 0
        ? Number((allReviews.reduce((sum, item) => item.rating + sum, 0) / totalRating).toFixed(1))
        : 0;

    await Profession.findByIdAndUpdate(professionalId, {
      averageRating: avgRating,
      totalRating: totalRating,
    });

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
      data: savedReview,
    });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to submit review" });
  }
};
