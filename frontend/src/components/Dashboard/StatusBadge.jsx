import React from "react";
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiCheck,
  FiArchive,
} from "react-icons/fi";

/**
 * Shared Monochrome StatusBadge with subtle semantic accents.
 * Follows the Black-and-White Design System specifications.
 */
const StatusBadge = ({ type = "booking", status = "", isPaid = null }) => {
  const norm = String(status || "").toLowerCase().trim();

  // If explicit payment badge requested
  if (type === "payment" || isPaid !== null) {
    const paid = isPaid === true || norm === "paid";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          paid
            ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30"
            : "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${paid ? "bg-[#16A34A]" : "bg-[#D97706]"}`}
        />
        {paid ? "Paid Online" : "Payment Pending"}
      </span>
    );
  }

  // Account active status
  if (type === "active") {
    const active = status === true || norm === "active" || norm === "live";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          active
            ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30"
            : "bg-[#737373]/10 text-[#737373] border-[#737373]/30"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#16A34A]" : "bg-[#737373]"}`}
        />
        {active ? "Active" : "Inactive"}
      </span>
    );
  }

  // Professional approval status
  if (type === "approval") {
    switch (norm) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30">
            <FiCheck className="w-3 h-3" />
            Approved
          </span>
        );
      case "cancelled":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30">
            <FiXCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/30">
            <FiClock className="w-3 h-3" />
            Pending Approval
          </span>
        );
    }
  }

  // Contact inquiry status
  if (type === "inquiry") {
    switch (norm) {
      case "unread":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#111111] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Unread
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
            <FiCheck className="w-3 h-3" />
            Read
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30">
            <FiCheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      case "archived":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F5] text-[#737373] border border-[#E5E5E5]">
            <FiArchive className="w-3 h-3" />
            Archived
          </span>
        );
    }
  }

  // Default: Booking status
  switch (norm) {
    case "approved":
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#111111] text-white">
          <FiCheck className="w-3 h-3" />
          Confirmed
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/30">
          <FiClock className="w-3 h-3" />
          In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30">
          <FiCheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30">
          <FiXCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
          <FiClock className="w-3 h-3 text-[#D97706]" />
          Pending
        </span>
      );
  }
};

export default StatusBadge;
