import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";

export const updateProfessional = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedProfessional = await Profession.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    ).select("-password");

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

  try {
    await Profession.findByIdAndDelete(id);

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

  try {
    const professional = await Profession.findById(id)
      .populate("reviews")
      .select("-password");

    if (!professional) {
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

export const getAllProfessionals = async (req, res) => {
  try {
    const { query } = req.query;
    let professionals;

    if (query) {
      professionals = await Profession.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { specialization: { $regex: query, $options: "i" } },
        ],
      }).select("-password");
    } else {
      professionals = await Profession.find({}).select("-password");
    }

    res.status(200).json({
      success: true,
      message: "Professionals found",
      data: professionals,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getProfessionalProfile = async (req, res) => {
  const professionalId = req.userId;

  try {
    const professional = await Profession.findById(professionalId);

    if (!professional) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    const { password, ...rest } = professional._doc;
    const appointments = await Booking.find({ doctor: professionalId });

    res.status(200).json({
      success: true,
      message: "Profile info retrieved",
      data: { ...rest, appointments },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
