import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import Service from "../models/ServiceSchema.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// GET /api/v1/admin/dashboard - Platform-level statistics
export const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProfessionals,
      totalBookings,
      pendingBookings,
      approvedBookings,
      cancelledBookings,
      totalServices,
      activeServices,
      inactiveServices,
      paidBookings,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Profession.countDocuments({}),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "approved" }),
      Booking.countDocuments({ status: "cancelled" }),
      Service.countDocuments({}),
      Service.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: false }),
      Booking.find({ isPaid: true }).select("ticketPrice"),
    ]);

    // Calculate revenue safely converting ticketPrice to number
    const totalRevenue = paidBookings.reduce((sum, booking) => {
      const price = Number(booking.ticketPrice) || 0;
      return sum + price;
    }, 0);

    res.status(200).json({
      success: true,
      message: "Admin dashboard statistics retrieved successfully",
      data: {
        users: {
          total: totalUsers,
        },
        professionals: {
          total: totalProfessionals,
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          approved: approvedBookings,
          cancelled: cancelledBookings,
        },
        services: {
          total: totalServices,
          active: activeServices,
          inactive: inactiveServices,
        },
        revenue: {
          total: totalRevenue,
        },
      },
    });
  } catch (err) {
    console.error("Admin dashboard stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

// GET /api/v1/admin/recent-bookings - Latest 10 bookings
export const getRecentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email photo")
      .populate("professional", "name specialization photo averageRating avgRating");

    const mappedBookings = bookings.map((b) => ({
      bookingId: b._id,
      appointmentDate: b.appointmentDate,
      status: b.status,
      isPaid: b.isPaid,
      ticketPrice: b.ticketPrice,
      user: b.user || null,
      professional: b.professional || null,
      createdAt: b.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "Recent bookings retrieved successfully",
      data: mappedBookings,
    });
  } catch (err) {
    console.error("Get recent bookings error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent bookings",
    });
  }
};

// GET /api/v1/admin/recent-users - Latest 10 users
export const getRecentUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-password");

    const mappedUsers = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      photo: u.photo,
      createdAt: u.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "Recent users retrieved successfully",
      data: mappedUsers,
    });
  } catch (err) {
    console.error("Get recent users error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent users",
    });
  }
};

// GET /api/v1/admin/recent-professionals - Latest 10 professionals
export const getRecentProfessionals = async (req, res) => {
  try {
    const professionals = await Profession.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-password");

    const mappedProfessionals = professionals.map((p) => ({
      _id: p._id,
      name: p.name,
      specialization: p.specialization,
      photo: p.photo,
      rating: p.averageRating || p.avgRating || 4.8,
      totalRating: p.totalRating || 0,
      createdAt: p.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "Recent professionals retrieved successfully",
      data: mappedProfessionals,
    });
  } catch (err) {
    console.error("Get recent professionals error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent professionals",
    });
  }
};

// GET /api/v1/admin/users - List users with pagination, search, status, & role filters
export const getAdminUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status = "", role = "" } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (limit > 50) limit = 50;

    const query = {};

    if (role) {
      query.role = role;
    } else {
      query.role = { $ne: "admin" };
    }

    if (status === "active") {
      query.isActive = { $ne: false };
    } else if (status === "inactive") {
      query.isActive = false;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password"),
      User.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("Get admin users error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// GET /api/v1/admin/users/:id - Get single user details by ID
export const getAdminUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid User ID format",
    });
  }

  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
    });
  }
};

// PATCH /api/v1/admin/users/:id/status - Update account status (Activate / Deactivate)
export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid User ID format",
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive property must be a boolean",
    });
  }

  // Admin Self-Deactivation Protection
  if (req.userId === id && isActive === false) {
    return res.status(400).json({
      success: false,
      message: "You cannot deactivate your own admin account",
    });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    const { password, ...updatedUser } = user._doc;

    res.status(200).json({
      success: true,
      message: `User status updated to ${isActive ? "active" : "inactive"} successfully`,
      data: updatedUser,
    });
  } catch (err) {
    console.error("Update user status error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// DELETE /api/v1/admin/users/:id - Delete user account
export const deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid User ID format",
    });
  }

  // Admin Self-Deletion Protection
  if (req.userId === id) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own admin account",
    });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// GET /api/v1/admin/professionals - List professionals with pagination, search, & status filters
export const getAdminProfessionals = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status = "" } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (limit > 50) limit = 50;

    const query = {};

    if (status === "active") {
      query.isActive = { $ne: false };
    } else if (status === "inactive") {
      query.isActive = false;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { specialization: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [professionals, total] = await Promise.all([
      Profession.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password"),
      Profession.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: professionals,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("Get admin professionals error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch professionals",
    });
  }
};

// GET /api/v1/admin/professionals/:id - Get professional details & booking statistics by ID
export const getAdminProfessionalById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Professional ID format",
    });
  }

  try {
    const professional = await Profession.findById(id).select("-password");

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    const [totalBookings, approvedBookings, pendingBookings, cancelledBookings] =
      await Promise.all([
        Booking.countDocuments({ professional: id }),
        Booking.countDocuments({ professional: id, status: "approved" }),
        Booking.countDocuments({ professional: id, status: "pending" }),
        Booking.countDocuments({ professional: id, status: "cancelled" }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        professional,
        statistics: {
          totalBookings,
          approvedBookings,
          pendingBookings,
          cancelledBookings,
        },
      },
    });
  } catch (err) {
    console.error("Get professional by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch professional details",
    });
  }
};

// POST /api/v1/admin/professionals - Add a new professional
export const createProfessionalByAdmin = async (req, res) => {
  const {
    name,
    email,
    password,
    specialization,
    ticketPrice,
    photo,
    bio,
    about,
    timeSlots,
    qualifications,
    experiences,
  } = req.body;

  if (!name || !email || !specialization) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and specialization are required fields",
    });
  }

  try {
    // Check duplicate email in Profession & User collections
    const [existingProf, existingUser] = await Promise.all([
      Profession.findOne({ email }),
      User.findOne({ email }),
    ]);

    if (existingProf || existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user or professional with this email already exists",
      });
    }

    const rawPassword = password || "FixUpPass123!";
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(rawPassword, salt);

    const newProfessional = new Profession({
      name,
      email,
      password: hashPassword,
      specialization,
      ticketPrice: Number(ticketPrice) || 500,
      photo: photo || "",
      bio: bio || "",
      about: about || "",
      timeSlots: timeSlots || [],
      qualifications: qualifications || [],
      experiences: experiences || [],
      role: "professional",
      isActive: true,
    });

    await newProfessional.save();

    const { password: pw, ...createdData } = newProfessional._doc;

    res.status(201).json({
      success: true,
      message: "Professional created successfully",
      data: createdData,
    });
  } catch (err) {
    console.error("Create professional error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create professional",
    });
  }
};

// PATCH /api/v1/admin/professionals/:id - Update professional details
export const updateProfessionalByAdmin = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Professional ID format",
    });
  }

  // Allowed editable fields
  const allowedFields = [
    "name",
    "email",
    "specialization",
    "ticketPrice",
    "photo",
    "bio",
    "about",
    "timeSlots",
    "qualifications",
    "experiences",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  try {
    const updatedProfessional = await Profession.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!updatedProfessional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Professional updated successfully",
      data: updatedProfessional,
    });
  } catch (err) {
    console.error("Update professional error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update professional",
    });
  }
};

// PATCH /api/v1/admin/professionals/:id/status - Update active status
export const updateProfessionalStatusByAdmin = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Professional ID format",
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive property must be a boolean",
    });
  }

  try {
    const professional = await Profession.findById(id);

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    professional.isActive = isActive;
    await professional.save();

    const { password, ...updatedData } = professional._doc;

    res.status(200).json({
      success: true,
      message: `Professional status updated to ${isActive ? "active" : "inactive"} successfully`,
      data: updatedData,
    });
  } catch (err) {
    console.error("Update professional status error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update professional status",
    });
  }
};

// DELETE /api/v1/admin/professionals/:id - Delete professional account (Blocked if bookings exist)
export const deleteProfessionalByAdmin = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Professional ID format",
    });
  }

  try {
    const professional = await Profession.findById(id);

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    // Safety check: Check if bookings exist for this professional
    const bookingCount = await Booking.countDocuments({ professional: id });

    if (bookingCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete professional with existing bookings. Deactivate the professional instead.",
      });
    }

    await Profession.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Professional deleted successfully",
    });
  } catch (err) {
    console.error("Delete professional error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete professional",
    });
  }
};

// GET /api/v1/admin/bookings - List bookings with pagination, search, status, paymentStatus, & date filters
export const getAdminBookings = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      paymentStatus = "",
      date = "",
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (limit > 50) limit = 50;

    const query = {};

    // Status filter
    if (status && ["pending", "approved", "cancelled"].includes(status)) {
      query.status = status;
    }

    // Payment status filter
    if (paymentStatus === "paid") {
      query.isPaid = true;
    } else if (paymentStatus === "unpaid") {
      query.isPaid = false;
    }

    // Date filter (matches appointmentDate for that day)
    if (date && date.trim()) {
      const startDate = new Date(date.trim());
      if (!isNaN(startDate.getTime())) {
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date.trim());
        endDate.setHours(23, 59, 59, 999);
        query.appointmentDate = { $gte: startDate, $lte: endDate };
      }
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      const [matchingUsers, matchingProfessionals] = await Promise.all([
        User.find({
          $or: [{ name: searchRegex }, { email: searchRegex }],
        }).select("_id"),
        Profession.find({
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { specialization: searchRegex },
          ],
        }).select("_id"),
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const proIds = matchingProfessionals.map((p) => p._id);

      const searchConditions = [];
      if (userIds.length > 0) searchConditions.push({ user: { $in: userIds } });
      if (proIds.length > 0)
        searchConditions.push({ professional: { $in: proIds } });

      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        searchConditions.push({ _id: search.trim() });
      }

      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      } else {
        // No matches found for search query
        query._id = null;
      }
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email phone photo")
        .populate(
          "professional",
          "name email specialization photo averageRating avgRating ticketPrice"
        ),
      Booking.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("Get admin bookings error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// GET /api/v1/admin/bookings/:id - Get booking details by ID
export const getAdminBookingById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Booking ID format",
    });
  }

  try {
    const booking = await Booking.findById(id)
      .populate("user", "-password")
      .populate("professional", "-password");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error("Get booking by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking details",
    });
  }
};

// PATCH /api/v1/admin/bookings/:id/status - Update booking status (Approve / Cancel)
export const updateBookingStatusByAdmin = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Booking ID format",
    });
  }

  const allowedStatuses = ["pending", "approved", "cancelled"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value. Allowed: pending, approved, cancelled",
    });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Status transition safety checks
    if (booking.status === "cancelled" && status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot approve a cancelled booking",
      });
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("user", "name email phone photo")
      .populate("professional", "name email specialization photo");

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} successfully`,
      data: updatedBooking,
    });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
    });
  }
};

