import Review from "../models/ReviewSchema.js";
import Profession from "../models/professionSchema.js";

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({});
    res.status(200).json({ success: true, message: "Successful", data: reviews });
  } catch (err) {
    res.status(404).json({ success: false, message: "Not found" });
  }
};

export const createReview = async (req, res) => {
  if (!req.body.professional) req.body.professional = req.params.professionalId;
  if (!req.body.user) req.body.user = req.userId;

  const newReview = new Review(req.body);

  try {
    const savedReview = await newReview.save();

    // Push review to professional's reviews array
    const professional = await Profession.findByIdAndUpdate(req.body.professional, {
      $push: { reviews: savedReview._id },
    });

    // Recalculate average rating
    const allReviews = await Review.find({ professional: req.body.professional });
    const totalRating = allReviews.length;
    const avgRating =
      allReviews.reduce((acc, item) => item.rating + acc, 0) / totalRating;

    await Profession.findByIdAndUpdate(req.body.professional, {
      averageRating: avgRating.toFixed(1),
      totalRating: totalRating,
    });

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
      data: savedReview,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
