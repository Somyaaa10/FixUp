import User from "../models/UserSchema.js";
import Booking from "../models/BookingSchema.js";
import Profession from "../models/professionSchema.js";
import mongoose from "mongoose";

export const updateUser = async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid User ID format" });
  }

  // Security: customer can only update their own record unless admin
  if (req.role === "customer" && req.userId !== id) {
    return res.status(403).json({ success: false, message: "Unauthorized to update another profile" });
  }

  const updates = { ...req.body };
  if (req.role === "customer") {
    delete updates.role;
    delete updates.email;
  }
  if (updates.phone !== undefined) {
    updates.phone = updates.phone === null ? "" : String(updates.phone).trim();
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
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

export const updateUserProfileMe = async (req, res) => {
  const userId = req.userId;

  try {
    const { name, phone, gender, photo, bloodType } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name ?? "").trim();
    if (phone !== undefined) updates.phone = phone === null ? "" : String(phone).trim();
    if (gender !== undefined) updates.gender = gender;
    if (photo !== undefined) updates.photo = String(photo ?? "").trim();
    if (bloodType !== undefined) updates.bloodType = bloodType;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid User ID format" });
  }

  // Security: Only an admin or the account owner can delete this profile
  if (req.role !== "admin" && req.userId !== id) {
    return res.status(403).json({ success: false, message: "Unauthorized to delete another profile" });
  }

  // Prevent admin from deleting their own admin account via user deletion route
  if (req.role === "admin" && req.userId === id) {
    return res.status(400).json({ success: false, message: "You cannot delete your own admin account" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid User ID format" });
  }

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
    // Step 1: Retrieve bookings for logged-in user and populate professional and service details
    const bookings = await Booking.find({ user: req.userId })
      .populate("professional", "-password")
      .populate("service", "name desc")
      .sort({ createdAt: -1 });

    // Step 2: Map bookings into a clean structure combining booking & professional info
    const appointments = bookings.map((booking) => ({
      bookingId: booking._id,
      appointmentDate: booking.appointmentDate,
      timeSlot: booking.timeSlot || "09:00 AM - 11:00 AM",
      serviceAddress: booking.serviceAddress || "Address on File",
      serviceName: booking.serviceName || booking.service?.name || booking.professional?.specialization || "Home Service",
      customerNotes: booking.customerNotes || "",
      status: booking.status,
      isPaid: booking.isPaid,
      ticketPrice: booking.ticketPrice,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      createdAt: booking.createdAt,
      professional: booking.professional || null,
      service: booking.service || null,
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

export { cancelCustomerBooking as cancelMyAppointment } from "./bookingController.js";

