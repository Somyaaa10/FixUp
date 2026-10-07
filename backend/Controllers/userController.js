import User from "../models/UserSchema.js";
import Booking from "../models/BookingSchema.js";
import Profession from "../models/professionSchema.js";

export const updateUser = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Successfully deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

export const getSingleUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found" });
    }

    res.status(200).json({
      success: true,
      message: "User found",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");

    res.status(200).json({
      success: true,
      message: "Users found",
      data: users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { password, ...rest } = user._doc;

    res.status(200).json({
      success: true,
      message: "Profile info retrieved",
      data: { ...rest },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    // Step 1: Retrieve bookings for logged-in user and populate professional details
    const bookings = await Booking.find({ user: req.userId }).populate(
      "professional",
      "-password"
    );

    // Step 2: Map bookings into a clean structure combining booking & professional info
    const appointments = bookings.map((booking) => ({
      bookingId: booking._id,
      appointmentDate: booking.appointmentDate,
      status: booking.status,
      isPaid: booking.isPaid,
      ticketPrice: booking.ticketPrice,
      professional: booking.professional || null,
    }));

    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      data: appointments,
    });
  } catch (err) {
    console.error("Get appointments error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
};
