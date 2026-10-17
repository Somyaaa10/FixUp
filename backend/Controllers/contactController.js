import Contact from "../models/ContactSchema.js";
import mongoose from "mongoose";

// In-memory rate limiting map: ip/email -> timestamp array
const submissionWindowMs = 10 * 60 * 1000; // 10 minutes
const maxSubmissionsPerWindow = 5;
const rateLimitMap = new Map();

// Periodic cleanup of rate limit map every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => now - t < submissionWindowMs);
    if (valid.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, valid);
    }
  }
}, 15 * 60 * 1000).unref();

const checkRateLimit = (key) => {
  if (!key) return false;
  const now = Date.now();
  const history = rateLimitMap.get(key) || [];
  const valid = history.filter((t) => now - t < submissionWindowMs);
  if (valid.length >= maxSubmissionsPerWindow) {
    return true; // Rate limit exceeded
  }
  valid.push(now);
  rateLimitMap.set(key, valid);
  return false;
};

// Email validation regex (RFC 5322 compliant subset)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * POST /api/v1/contact
 * Public endpoint to submit contact inquiries
 */
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message, hp, website } = req.body;

    // Spam Honeypot Detection: if bot filled hidden field, return fake success without persisting
    if (hp || website) {
      return res.status(200).json({
        success: true,
        message: "Your inquiry has been received. Our support team will follow up with you shortly.",
      });
    }

    // Type validation
    if (
      (name !== undefined && typeof name !== "string") ||
      (email !== undefined && typeof email !== "string") ||
      (subject !== undefined && typeof subject !== "string") ||
      (message !== undefined && typeof message !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid field format. All inputs must be text strings.",
      });
    }

    // Trim inputs
    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedSubject = (subject || "").trim();
    const trimmedMessage = (message || "").trim();

    // Check required fields
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!trimmedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    if (!trimmedSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject is required.",
      });
    }

    if (!trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    // Length and format validation
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long.",
      });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 100 characters.",
      });
    }

    if (trimmedEmail.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Email cannot exceed 150 characters.",
      });
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (trimmedSubject.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Subject must be at least 3 characters long.",
      });
    }

    if (trimmedSubject.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Subject cannot exceed 200 characters.",
      });
    }

    if (trimmedMessage.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters long.",
      });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters.",
      });
    }

    // Rate Limiting check per IP and per normalized email
    const clientIp = (req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim();
    if (checkRateLimit(`ip:${clientIp}`) || checkRateLimit(`email:${trimmedEmail}`)) {
      return res.status(429).json({
        success: false,
        message: "Too many contact submissions from this source. Please wait a few minutes before trying again.",
      });
    }

    // Persist contact message
    const newContact = new Contact({
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
      status: "unread",
      ipAddress: clientIp,
    });

    const saved = await newContact.save();

    return res.status(201).json({
      success: true,
      message: "Your inquiry has been received. Our support team will follow up with you shortly.",
      data: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        subject: saved.subject,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    // Avoid exposing internal database details or stack traces to client
    console.error("Error submitting contact inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while processing your inquiry. Please try again later.",
    });
  }
};

/**
 * GET /api/v1/admin/contact-messages
 * Admin-only endpoint to list inquiries with pagination & status filters
 */
export const getAdminContactMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (status && ["unread", "read", "resolved", "archived"].includes(status)) {
      filter.status = status;
    }

    if (search && typeof search === "string" && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
        { message: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [messages, totalCount, unreadCount] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v"),
      Contact.countDocuments(filter),
      Contact.countDocuments({ status: "unread" }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Contact messages retrieved successfully",
      data: messages,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error retrieving contact messages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve contact inquiries",
    });
  }
};

/**
 * GET /api/v1/admin/contact-messages/:id
 * Admin-only endpoint to view a specific contact inquiry
 */
export const getAdminContactMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact inquiry ID format",
      });
    }

    const message = await Contact.findById(id).select("-__v");
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    // Auto-mark as read if viewing unread message
    if (message.status === "unread") {
      message.status = "read";
      await message.save();
    }

    return res.status(200).json({
      success: true,
      message: "Contact inquiry retrieved successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error retrieving single contact message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve contact inquiry",
    });
  }
};

/**
 * PATCH /api/v1/admin/contact-messages/:id/status
 * Admin-only endpoint to update inquiry status
 */
export const updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact inquiry ID format",
      });
    }

    const validStatuses = ["unread", "read", "resolved", "archived"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Inquiry status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating contact message status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inquiry status",
    });
  }
};

/**
 * DELETE /api/v1/admin/contact-messages/:id
 * Admin-only endpoint to delete inquiry
 */
export const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact inquiry ID format",
      });
    }

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete contact inquiry",
    });
  }
};
