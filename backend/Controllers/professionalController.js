import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import Service from "../models/ServiceSchema.js";
import User from "../models/UserSchema.js";
import mongoose from "mongoose";

export const updateProfessional = async (req, res) => {
  const id = req.params.id;

  // Security check: professional can only update their own record unless admin
  if (req.role === "professional" && req.userId !== id) {
    return res.status(403).json({ success: false, message: "Unauthorized to update another profile" });
  }

  const updates = { ...req.body };
  if (req.role === "professional") {
    delete updates.ticketPrice;
    delete updates.role;
    delete updates.isApproved;
    delete updates.email;
  }
  if (updates.phone !== undefined) {
    updates.phone = updates.phone === null ? "" : String(updates.phone).trim();
  }

  // Handle services if provided
  if (updates.services && Array.isArray(updates.services)) {
    const validServiceIds = [];
    for (const s of updates.services) {
      if (mongoose.Types.ObjectId.isValid(s)) {
        validServiceIds.push(new mongoose.Types.ObjectId(s));
      } else if (typeof s === "string" && s.trim()) {
        const existing = await Service.findOne({
          name: { $regex: `^${s.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        });
        if (existing) validServiceIds.push(existing._id);
      }
    }
    updates.services = validServiceIds;
  }

  try {
    const updatedProfessional = await Profession.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate("services", "name desc bgColor textColor isActive")
      .select("-password");

    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: updatedProfessional,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

export const deleteProfessional = async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Professional ID format" });
  }

  // Security: Only an admin or the account owner can delete this profile
  if (req.role !== "admin" && req.userId !== id) {
    return res.status(403).json({ success: false, message: "Unauthorized to delete another profile" });
  }

  try {
    const deletedProf = await Profession.findByIdAndDelete(id);

    if (!deletedProf) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    res.status(200).json({
      success: true,
      message: "Successfully deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

export const getSingleProfessional = async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Professional ID format" });
  }

  try {
    const professional = await Profession.findById(id)
      .populate("services", "name desc bgColor textColor isActive")
      .populate({
        path: "reviews",
        populate: { path: "user", select: "name photo" },
      })
      .select("-password");

    // Only active, admin-approved professionals are accessible to the public
    if (
      !professional ||
      professional.isActive === false ||
      professional.isApproved !== "approved"
    ) {
      return res.status(404).json({ success: false, message: "No professional found" });
    }

    res.status(200).json({
      success: true,
      message: "Professional found",
      data: professional,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Helper to build stem regex pattern for category/specialization matching
export const buildCategoryPattern = (categoryStr) => {
  if (!categoryStr || typeof categoryStr !== "string") return null;
  const raw = categoryStr.trim();
  if (!raw || raw.toLowerCase() === "all" || raw.toLowerCase() === "all services") return null;

  // Normalize and tokenize by non-alphanumeric chars
  const words = raw
    .toLowerCase()
    .split(/[\s,&/\\-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !["and", "services", "repair", "repairs", "the", "for", "with"].includes(w));

  if (words.length === 0) {
    return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Derive roots / stems so "plumbing" matches "plumber", "electrical" matches "electrician", etc.
  const stems = words.map((w) => {
    let stem = w;
    if (w.startsWith("plumb")) stem = "plumb";
    else if (w.startsWith("electr")) stem = "electr";
    else if (w.startsWith("paint")) stem = "paint";
    else if (w.startsWith("clean")) stem = "clean";
    else if (w.startsWith("carpent")) stem = "carpent";
    else if (w.startsWith("handy")) stem = "handy";
    else if (w.endsWith("ing") && w.length > 5) stem = w.slice(0, -3);
    else if (w.endsWith("ian") && w.length > 5) stem = w.slice(0, -3);
    else if (w.endsWith("ers") && w.length > 5) stem = w.slice(0, -3);
    else if (w.endsWith("er") && w.length > 4) stem = w.slice(0, -2);
    return stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });

  return Array.from(new Set(stems)).join("|");
};

export const getAllProfessionals = async (req, res) => {
  try {
    const { query, category, specialization, serviceId, service } = req.query;

    // Filter: only active and admin-approved professionals are visible in public directory
    const baseFilter = {
      isApproved: "approved",
      isActive: { $ne: false },
    };

    const conditions = [{ ...baseFilter }];

    // 1. Search query filter (matches name, specialization, bio, or associated services)
    if (query && query.trim()) {
      const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingServicesForQuery = await Service.find({
        name: { $regex: q, $options: "i" },
      }).select("_id");

      const queryOr = [
        { name: { $regex: q, $options: "i" } },
        { specialization: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
      ];

      if (matchingServicesForQuery.length > 0) {
        queryOr.push({
          services: { $in: matchingServicesForQuery.map((s) => s._id) },
        });
      }

      conditions.push({ $or: queryOr });
    }

    // 2. Category filter (matches specialization or associated services)
    const targetCategory = category || specialization || serviceId || service;
    if (
      targetCategory &&
      typeof targetCategory === "string" &&
      targetCategory.trim() &&
      targetCategory.trim().toLowerCase() !== "all" &&
      targetCategory.trim().toLowerCase() !== "all services"
    ) {
      const catOrConditions = [];
      const catPattern = buildCategoryPattern(targetCategory);
      if (catPattern) {
        catOrConditions.push({
          specialization: { $regex: catPattern, $options: "i" },
        });
      }

      // Check if targetCategory is an ObjectId
      if (mongoose.Types.ObjectId.isValid(targetCategory.trim())) {
        catOrConditions.push({ services: new mongoose.Types.ObjectId(targetCategory.trim()) });
      }

      // Check matching services by name in Service collection
      const serviceSearchRegex =
        catPattern || targetCategory.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingServices = await Service.find({
        name: { $regex: serviceSearchRegex, $options: "i" },
      }).select("_id");

      if (matchingServices.length > 0) {
        const matchingIds = matchingServices.map((s) => s._id);
        catOrConditions.push({ services: { $in: matchingIds } });
      }

      if (catOrConditions.length > 0) {
        conditions.push({ $or: catOrConditions });
      } else {
        conditions.push({
          specialization: {
            $regex: targetCategory.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        });
      }
    }

    const finalFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const professionals = await Profession.find(finalFilter)
      .populate("services", "name desc bgColor textColor isActive")
      .select("-password")
      .sort({ averageRating: -1, totalRating: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Professionals found",
      data: professionals,
    });
  } catch (err) {
    console.error("Get all professionals error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getProfessionalProfile = async (req, res) => {
  let professionalId = req.userId;

  try {
    let professional = await Profession.findById(professionalId)
      .populate("services", "name desc bgColor textColor isActive")
      .populate({
        path: "reviews",
        populate: { path: "user", select: "name photo" },
      })
      .select("-password");

    if (!professional) {
      // Check if user was registered in User collection with professional role
      const userRecord = await User.findById(professionalId);
      if (userRecord && userRecord.role === "professional") {
        professional = await Profession.findOne({ email: userRecord.email })
          .populate("services", "name desc bgColor textColor isActive")
          .populate({
            path: "reviews",
            populate: { path: "user", select: "name photo" },
          })
          .select("-password");
        if (professional) {
          professionalId = professional._id;
        }
      }
    }

    if (!professional) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    const { password, ...rest } = professional._doc;
    const appointments = await Booking.find({ professional: professionalId })
      .populate("user", "name email phone photo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Profile info retrieved",
      data: { ...rest, appointments },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const getProfessionalAppointments = async (req, res) => {
  const professionalId = req.userId;

  try {
    const appointments = await Booking.find({ professional: professionalId })
      .populate("user", "name email phone photo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Appointments retrieved",
      data: appointments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve appointments" });
  }
};

export const updateBookingStatusByProfessional = async (req, res) => {
  const professionalId = req.userId;
  const { bookingId } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "approved", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
    });
  }

  try {
    const booking = await Booking.findOne({
      _id: bookingId,
      professional: professionalId,
    }).populate("user", "name email phone photo");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not assigned to your account",
      });
    }

    // Status transition validation
    if (booking.status === "cancelled" && status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled bookings cannot be reopened",
      });
    }

    if (booking.status === "completed" && status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed bookings cannot be modified",
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Job status updated to ${status}`,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
    });
  }
};

export const updateProfessionalProfileMe = async (req, res) => {
  const professionalId = req.userId;

  try {
    const {
      name,
      phone,
      bio,
      about,
      specialization,
      qualifications,
      experiences,
      timeSlots,
      photo,
      services,
      serviceId,
      serviceName,
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = String(name ?? "").trim();
    if (phone !== undefined) updateFields.phone = phone === null ? "" : String(phone).trim();
    if (bio !== undefined) updateFields.bio = String(bio ?? "").trim();
    if (about !== undefined) updateFields.about = String(about ?? "").trim();
    if (specialization !== undefined) updateFields.specialization = String(specialization ?? "").trim();
    if (qualifications !== undefined) updateFields.qualifications = qualifications;
    if (experiences !== undefined) updateFields.experiences = experiences;
    if (timeSlots !== undefined) updateFields.timeSlots = timeSlots;
    if (photo !== undefined) updateFields.photo = String(photo ?? "").trim();

    // Resolve services array
    let resolvedServiceIds = [];

    if (Array.isArray(services)) {
      for (const item of services) {
        if (item && mongoose.Types.ObjectId.isValid(item)) {
          const sDoc = await Service.findById(item);
          if (sDoc) resolvedServiceIds.push(sDoc._id);
        } else if (typeof item === "string" && item.trim()) {
          const sName = item.trim();
          let sDoc = await Service.findOne({
            name: { $regex: `^${sName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
          });
          if (!sDoc) {
            sDoc = await Service.create({ name: sName, isActive: true });
          }
          resolvedServiceIds.push(sDoc._id);
        }
      }
    } else if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      const sDoc = await Service.findById(serviceId);
      if (sDoc) resolvedServiceIds.push(sDoc._id);
    } else if (serviceName && typeof serviceName === "string" && serviceName.trim()) {
      const sName = serviceName.trim();
      let sDoc = await Service.findOne({
        name: { $regex: `^${sName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
      if (!sDoc) {
        sDoc = await Service.create({ name: sName, isActive: true });
      }
      resolvedServiceIds.push(sDoc._id);
    }

    // If specialization is provided and no service resolved yet, attempt to match catalog service (avoiding duplicates)
    if (resolvedServiceIds.length === 0 && specialization && typeof specialization === "string" && specialization.trim()) {
      const specTrimmed = specialization.trim();
      let sDoc = await Service.findOne({
        name: { $regex: `^${specTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
      if (!sDoc) {
        const stem = buildCategoryPattern(specTrimmed);
        if (stem) {
          sDoc = await Service.findOne({
            name: { $regex: stem, $options: "i" },
          });
        }
      }
      if (sDoc && !resolvedServiceIds.some((id) => id.toString() === sDoc._id.toString())) {
        resolvedServiceIds.push(sDoc._id);
      }
    }

    if (resolvedServiceIds.length > 0) {
      updateFields.services = resolvedServiceIds;
      // If specialization was not explicitly provided, synchronize with primary service name
      if (!updateFields.specialization) {
        const primaryService = await Service.findById(resolvedServiceIds[0]);
        if (primaryService) {
          updateFields.specialization = primaryService.name;
        }
      }
    }

    let updated = await Profession.findByIdAndUpdate(
      professionalId,
      { $set: updateFields },
      { new: true }
    )
      .populate("services", "name desc bgColor textColor isActive")
      .select("-password");

    if (!updated) {
      const userRecord = await User.findById(professionalId);
      if (userRecord && userRecord.role === "professional") {
        let prof = await Profession.findOne({ email: userRecord.email });
        if (!prof) {
          prof = await Profession.create({
            name: updateFields.name || userRecord.name,
            email: userRecord.email,
            password: userRecord.password,
            photo: updateFields.photo || userRecord.photo,
            role: "professional",
            isApproved: "pending",
            isActive: true,
            ...updateFields,
          });
        } else {
          prof = await Profession.findByIdAndUpdate(
            prof._id,
            { $set: updateFields },
            { new: true }
          );
        }
        updated = await Profession.findById(prof._id)
          .populate("services", "name desc bgColor textColor isActive")
          .select("-password");
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: "Professional profile not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
