import Service from "../models/ServiceSchema.js";
import mongoose from "mongoose";

// Initial default services data matching the frontend static data
const initialServicesData = [
  {
    name: "Electrician",
    desc: "Our certified electricians are available to handle all your electrical needs, from installing new fixtures to troubleshooting electrical issues. Whether you need wiring, repairs, or installations, our experts ensure safe and efficient service.",
    bgColor: "rgba(254, 182, 13, .2)",
    textColor: "#FEB60D",
    isActive: true,
  },
  {
    name: "Carpenter",
    desc: "Our skilled carpenters can help with a wide range of woodworking projects, including furniture repair, custom cabinetry, and home renovations. We deliver high-quality craftsmanship for all your carpentry needs.",
    bgColor: "rgba(151, 113, 255, .2)",
    textColor: "#9771FF",
    isActive: true,
  },
  {
    name: "Plumber",
    desc: "FixUp offers reliable plumbing services to fix leaks, unclog drains, install fixtures, and maintain your plumbing system. Our professional plumbers provide prompt and effective solutions to keep your water flowing smoothly.",
    bgColor: "rgba(1, 181, 197, .2)",
    textColor: "#01B5C5",
    isActive: true,
  },
  {
    name: "House Cleaning",
    desc: "Our professional cleaning team provides thorough and efficient house cleaning services. From regular maintenance to deep cleaning, we ensure your home remains spotless and hygienic.",
    bgColor: "rgba(1, 181, 197, .2)",
    textColor: "#01B5C5",
    isActive: true,
  },
  {
    name: "Driver",
    desc: "Hire experienced and reliable drivers through FixUp for your transportation needs. Whether it's for daily commuting, special occasions, or long-distance travel, our drivers offer safe and punctual service.",
    bgColor: "rgba(254, 182, 13, .2)",
    textColor: "#FEB60D",
    isActive: true,
  },
  {
    name: "Painter",
    desc: "Transform your space with our expert painting services. Our painters provide high-quality interior and exterior painting, ensuring a flawless finish that revitalizes your home or office.",
    bgColor: "rgba(151, 113, 255, .2)",
    textColor: "#9771FF",
    isActive: true,
  },
];

// Helper to seed services if collection is empty
export const seedServicesIfEmpty = async () => {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.insertMany(initialServicesData);
      console.log("Initial services seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding initial services:", err.message);
  }
};

// GET /api/v1/services - Get all active services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: services,
    });
  } catch (err) {
    console.error("Get all services error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};

// GET /api/v1/services/:id - Get single service by ID
export const getSingleService = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Service ID format",
    });
  }

  try {
    const service = await Service.findById(id);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service retrieved successfully",
      data: service,
    });
  } catch (err) {
    console.error("Get single service error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service details",
    });
  }
};
