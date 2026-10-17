import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import userImg from "../../assets/images/avatar-img.png";
import StatCard from "../../components/Dashboard/StatCard";
import StatusBadge from "../../components/Dashboard/StatusBadge";
import EmptyState from "../../components/Dashboard/EmptyState";
import ErrorState from "../../components/Dashboard/ErrorState";
import LoadingSkeleton from "../../components/Dashboard/LoadingSkeleton";
import ConfirmModal from "../../components/Dashboard/ConfirmModal";
import DetailModal from "../../components/Dashboard/DetailModal";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiStar,
  FiTool,
  FiEye,
  FiLogOut,
  FiEdit3,
  FiSave,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRight,
  FiSearch,
  FiMapPin,
  FiCreditCard,
  FiExternalLink,
} from "react-icons/fi";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const MyAccount = () => {
  const { user, token, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navigation tab: 'bookings' | 'browse' | 'settings'
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingFilter, setBookingFilter] = useState("all"); // 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [userData, setUserData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorUser, setErrorUser] = useState(null);
  const [errorBookings, setErrorBookings] = useState(null);

  // Browse professionals in dashboard state
  const [browsePros, setBrowsePros] = useState([]);
  const [loadingPros, setLoadingPros] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });

  // Review modal state
  const [bookingToReview, setBookingToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Form State for Profile Settings
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "male",
    bloodType: "",
    photo: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [formFeedback, setFormFeedback] = useState({ type: "", message: "" });

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 5000);
  };

  // 1. Fetch Profile
  const fetchProfile = async () => {
    setLoadingUser(true);
    setErrorUser(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/users/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        dispatch({ type: "LOGOUT" });
        navigate("/login", { replace: true });
        return;
      }

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to load customer profile");
      }

      setUserData(result.data);
      setFormData({
        name: String(result.data?.name ?? "").trim(),
        phone: String(result.data?.phone ?? "").trim(),
        gender: result.data?.gender || "male",
        bloodType: result.data?.bloodType || "",
        photo: String(result.data?.photo ?? "").trim(),
      });
    } catch (err) {
      setErrorUser(err.message || "Unable to retrieve profile");
    } finally {
      setLoadingUser(false);
    }
  };

  // 2. Fetch Appointments
  const fetchAppointments = async () => {
    setLoadingBookings(true);
    setErrorBookings(null);
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/users/appointments/my-appointments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 401) {
        dispatch({ type: "LOGOUT" });
        navigate("/login", { replace: true });
        return;
      }

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to load bookings");
      }

      setAppointments(result.data || []);
    } catch (err) {
      setErrorBookings(err.message || "Unable to retrieve bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  // 3. Fetch Approved Professionals for Find Professionals Directory
  const fetchProfessionals = async (category = "All") => {
    setLoadingPros(true);
    try {
      let url = `${BASE_URL}/api/v1/professionals`;
      if (category && category !== "All") {
        url += `?category=${encodeURIComponent(category)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setBrowsePros(data.data || []);
      }
    } catch (err) {
      console.error("Fetch pros error:", err);
    } finally {
      setLoadingPros(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchAppointments();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "browse") {
      fetchProfessionals(selectedCategory);
    }
  }, [activeTab, selectedCategory]);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login", { replace: true });
  };

  // Cancel Booking Workflow
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    const targetId = bookingToCancel.bookingId || bookingToCancel._id;
    if (!targetId) return;

    setCancellingBooking(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/users/appointments/${targetId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel booking");
      }

      // Update state in place
      setAppointments((prev) =>
        prev.map((app) =>
          app.bookingId === targetId || app._id === targetId
            ? { ...app, status: "cancelled" }
            : app
        )
      );

      if (selectedBooking && (selectedBooking.bookingId === targetId || selectedBooking._id === targetId)) {
        setSelectedBooking((prev) => ({ ...prev, status: "cancelled" }));
      }

      const notice = data.refundNotice
        ? `Booking cancelled. ${data.refundNotice}`
        : "Booking has been cancelled successfully.";

      showToast("success", notice);
      setBookingToCancel(null);
    } catch (err) {
      showToast("error", err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setCancellingBooking(false);
    }
  };

  // Submit Review Workflow
  const handleOpenReviewModal = (booking) => {
    setBookingToReview(booking);
    setReviewRating(5);
    setReviewText("");
    setReviewError("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!bookingToReview) return;
    const proId =
      bookingToReview.professional?._id ||
      bookingToReview.professional?.id ||
      bookingToReview.professional;
    const targetBookingId = bookingToReview.bookingId || bookingToReview._id;

    if (!reviewText.trim()) {
      setReviewError("Please write a short review describing your experience.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      const res = await fetch(`${BASE_URL}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          professional: proId,
          bookingId: targetBookingId,
          rating: Number(reviewRating),
          reviewText: reviewText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      showToast("success", "Review submitted successfully! Thank you for your feedback.");
      setBookingToReview(null);
    } catch (err) {
      setReviewError(err.message || "Error submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Profile Save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFormFeedback({ type: "", message: "" });

    try {
      const payload = {
        name: String(formData.name ?? "").trim(),
        phone: String(formData.phone ?? "").trim(),
        gender: formData.gender,
        bloodType: formData.bloodType,
        photo: String(formData.photo ?? "").trim(),
      };

      const res = await fetch(`${BASE_URL}/api/v1/users/profile/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      setUserData(result.data);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: {
            ...user,
            name: result.data?.name || formData.name,
            photo: result.data?.photo || formData.photo,
          },
          token,
          role: "customer",
        },
      });

      setFormFeedback({
        type: "success",
        message: "Profile updated successfully!",
      });
      showToast("success", "Profile settings saved successfully.");
    } catch (err) {
      setFormFeedback({
        type: "error",
        message: err.message || "Failed to save profile changes",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Derived KPI Metrics (Accurate, Real Data Only)
  const totalBookingsCount = appointments.length;
  const upcomingBookingsCount = appointments.filter((a) =>
    ["pending", "approved", "in_progress"].includes(a.status?.toLowerCase())
  ).length;
  const completedBookingsCount = appointments.filter(
    (a) => a.status?.toLowerCase() === "completed"
  ).length;

  // Reliable total spending from verified paid bookings
  const verifiedTotalSpending = appointments.reduce((sum, b) => {
    if (b.isPaid === true && b.status?.toLowerCase() !== "cancelled") {
      const price = Number(b.ticketPrice) || 0;
      return sum + price;
    }
    return sum;
  }, 0);

  // Filtered Bookings for the Table
  const filteredAppointments = appointments.filter((b) => {
    const status = b.status?.toLowerCase() || "pending";
    if (bookingFilter === "upcoming") {
      if (!["pending", "approved", "in_progress"].includes(status)) return false;
    } else if (bookingFilter === "completed") {
      if (status !== "completed") return false;
    } else if (bookingFilter === "cancelled") {
      if (status !== "cancelled") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const sName = (b.serviceName || "").toLowerCase();
      const pName = (b.professional?.name || "").toLowerCase();
      const pSpec = (b.professional?.specialization || "").toLowerCase();
      const bId = String(b.bookingId || b._id || "").toLowerCase();
      return (
        sName.includes(q) ||
        pName.includes(q) ||
        pSpec.includes(q) ||
        bId.includes(q)
      );
    }

    return true;
  });

  const displayName = userData?.name || user?.name || "Valued Customer";
  const displayEmail = userData?.email || user?.email || "";
  const displayPhoto = userData?.photo || user?.photo || userImg;

  return (
    <div className="bg-[#F5F5F5] min-h-[calc(100vh-80px)] py-6 sm:py-10 text-[#111111] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Toast Alert Notification */}
        {toastMessage.text && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium animate-in fade-in ${
              toastMessage.type === "success"
                ? "bg-white border-[#16A34A]/40 text-[#16A34A] shadow-xs"
                : "bg-white border-[#DC2626]/40 text-[#DC2626] shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <FiCheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
              ) : (
                <FiAlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage({ type: "", text: "" })}
              className="p-1 hover:opacity-75"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Top Header */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={displayPhoto}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border border-[#E5E5E5] shrink-0"
              onError={(e) => {
                e.currentTarget.src = userImg;
              }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md">
                  Customer Portal
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  Active Account
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111111] mt-1 tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] mt-0.5">
                {displayEmail} {userData?.phone ? `• ${userData.phone}` : ""}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 ${
                activeTab === "browse"
                  ? "bg-[#111111] text-white"
                  : "bg-white border border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5]"
              }`}
            >
              <FiSearch className="w-3.5 h-3.5" />
              <span>Find Professionals</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold text-[#DC2626] bg-white border border-[#E5E5E5] hover:bg-[#DC2626]/10 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            OVERVIEW KPI CARDS (Real Authenticated Data Only)
            ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={loadingBookings ? "..." : totalBookingsCount}
            subtitle="Platform service orders placed"
            icon={FiCalendar}
            onClick={() => {
              setActiveTab("bookings");
              setBookingFilter("all");
            }}
          />
          <StatCard
            title="Upcoming Jobs"
            value={loadingBookings ? "..." : upcomingBookingsCount}
            subtitle="Confirmed & scheduled"
            icon={FiClock}
            badgeText={upcomingBookingsCount > 0 ? "Active" : null}
            badgeType="warning"
            onClick={() => {
              setActiveTab("bookings");
              setBookingFilter("upcoming");
            }}
          />
          <StatCard
            title="Completed Services"
            value={loadingBookings ? "..." : completedBookingsCount}
            subtitle="Successfully fulfilled"
            icon={FiCheckCircle}
            badgeText={completedBookingsCount > 0 ? "Done" : null}
            badgeType="success"
            onClick={() => {
              setActiveTab("bookings");
              setBookingFilter("completed");
            }}
          />
          <StatCard
            title="Total Spending"
            value={loadingBookings ? "..." : formatCurrency(verifiedTotalSpending)}
            subtitle="Verified online payments"
            icon={FiCreditCard}
          />
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-1.5 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "bookings"
                ? "bg-[#111111] text-white"
                : "text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5]"
            }`}
          >
            <FiCalendar className="w-4 h-4" />
            <span>My Bookings</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === "bookings"
                  ? "bg-white/20 text-white"
                  : "bg-[#E5E5E5] text-[#111111]"
              }`}
            >
              {appointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("browse")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "browse"
                ? "bg-[#111111] text-white"
                : "text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5]"
            }`}
          >
            <FiTool className="w-4 h-4" />
            <span>Find Professionals</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-[#111111] text-white"
                : "text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5]"
            }`}
          >
            <FiUser className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: MY BOOKINGS
            ======================================================== */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: "all", label: "All" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "completed", label: "Completed" },
                  { id: "cancelled", label: "Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setBookingFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      bookingFilter === tab.id
                        ? "bg-[#111111] text-white"
                        : "text-[#525252] hover:bg-[#F5F5F5] hover:text-[#111111]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative max-w-xs w-full">
                <FiSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#737373]" />
                <input
                  type="text"
                  placeholder="Search service or professional..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] placeholder-[#737373] focus:outline-none focus:border-[#111111] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Loading state */}
            {loadingBookings && <LoadingSkeleton type="table" count={4} />}

            {/* Error state */}
            {!loadingBookings && errorBookings && (
              <ErrorState
                title="Unable to load appointments"
                message={errorBookings}
                onRetry={fetchAppointments}
              />
            )}

            {/* Empty state */}
            {!loadingBookings && !errorBookings && filteredAppointments.length === 0 && (
              <EmptyState
                icon={FiCalendar}
                title="No bookings found"
                description={
                  searchQuery
                    ? `No bookings matching "${searchQuery}". Try clearing search.`
                    : bookingFilter !== "all"
                    ? `You have no ${bookingFilter} bookings at this moment.`
                    : "You haven't booked any home service professionals yet."
                }
                actionLabel={bookingFilter !== "all" || searchQuery ? "Show All Bookings" : "Book a Professional"}
                onAction={() => {
                  if (bookingFilter !== "all" || searchQuery) {
                    setBookingFilter("all");
                    setSearchQuery("");
                  } else {
                    setActiveTab("browse");
                  }
                }}
              />
            )}

            {/* Bookings Data Table */}
            {!loadingBookings && !errorBookings && filteredAppointments.length > 0 && (
              <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Service & Reference</th>
                        <th className="py-3 px-4">Professional</th>
                        <th className="py-3 px-4">Date & Slot</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {filteredAppointments.map((booking) => {
                        const targetId = booking.bookingId || booking._id;
                        const shortId = targetId ? targetId.slice(-6).toUpperCase() : "FX-REQ";
                        const proName = booking.professional?.name || "Assigned Specialist";
                        const proSpec =
                          booking.professional?.specialization || "Professional";
                        const canCancel = [
                          "pending",
                          "approved",
                          "in_progress",
                        ].includes(booking.status?.toLowerCase());
                        const isCompleted =
                          booking.status?.toLowerCase() === "completed";

                        return (
                          <tr
                            key={targetId}
                            className="hover:bg-[#F5F5F5] transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#111111] block text-xs">
                                {booking.serviceName || "Home Service"}
                              </span>
                              <span className="text-[11px] font-mono text-[#737373]">
                                #{shortId}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={booking.professional?.photo || userImg}
                                  alt={proName}
                                  className="w-7 h-7 rounded-full object-cover border border-[#E5E5E5]"
                                  onError={(e) => {
                                    e.currentTarget.src = userImg;
                                  }}
                                />
                                <div>
                                  <span className="font-semibold text-[#111111] block">
                                    {proName}
                                  </span>
                                  <span className="text-[11px] text-[#737373]">
                                    {proSpec}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-[#111111]">
                              <div className="flex items-center gap-1 font-medium">
                                <FiCalendar className="w-3.5 h-3.5 text-[#737373]" />
                                <span>{formatDate(booking.appointmentDate)}</span>
                              </div>
                              <span className="text-[11px] text-[#737373] block mt-0.5">
                                {booking.timeSlot}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-[#111111]">
                              {formatCurrency(Number(booking.ticketPrice) || 500)}
                            </td>

                            <td className="py-3.5 px-4">
                              <StatusBadge
                                type="booking"
                                status={booking.status}
                              />
                            </td>

                            <td className="py-3.5 px-4">
                              <StatusBadge
                                type="payment"
                                isPaid={booking.isPaid}
                              />
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedBooking(booking)}
                                  className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                  title="View Booking Details"
                                  aria-label="View Booking Details"
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                </button>

                                {isCompleted && (
                                  <button
                                    onClick={() => handleOpenReviewModal(booking)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#111111] hover:bg-black text-white transition-colors inline-flex items-center gap-1"
                                    title="Leave a Review"
                                  >
                                    <FiStar className="w-3 h-3 text-amber-400" />
                                    <span>Review</span>
                                  </button>
                                )}

                                {canCancel && (
                                  <button
                                    onClick={() => setBookingToCancel(booking)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                                    title="Cancel Booking"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: FIND PROFESSIONALS (Directory Integration)
            ======================================================== */}
        {activeTab === "browse" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  Verified Home Service Specialists
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Browse vetted, admin-approved professionals ready to help you
                </p>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {["All", "Plumber", "Electrician", "Painter", "Carpenter", "Cleaning"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        selectedCategory === cat
                          ? "bg-[#111111] text-white"
                          : "bg-[#F5F5F5] border border-[#E5E5E5] text-[#525252] hover:text-[#111111]"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {loadingPros && <LoadingSkeleton type="card" count={4} />}

            {!loadingPros && browsePros.length === 0 && (
              <EmptyState
                icon={FiTool}
                title="No professionals available"
                description={`No verified professionals currently found in the "${selectedCategory}" category.`}
                actionLabel="Show All Categories"
                onAction={() => setSelectedCategory("All")}
              />
            )}

            {!loadingPros && browsePros.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {browsePros.map((pro) => (
                  <div
                    key={pro._id}
                    className="bg-white border border-[#E5E5E5] rounded-xl p-5 hover:border-[#111111] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <img
                          src={pro.photo || userImg}
                          alt={pro.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#E5E5E5] shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = userImg;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-md inline-block">
                            Verified & Live
                          </span>
                          <h4 className="font-bold text-sm text-[#111111] mt-1 truncate">
                            {pro.name}
                          </h4>
                          <p className="text-xs text-[#737373] truncate">
                            {pro.specialization || "Professional Specialist"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex items-center justify-between text-xs text-[#525252]">
                        <span className="flex items-center gap-1 font-semibold text-[#111111]">
                          <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{pro.averageRating ? pro.averageRating.toFixed(1) : "5.0"}</span>
                          <span className="text-[#737373] font-normal">
                            ({pro.totalRating || 0})
                          </span>
                        </span>

                        <span className="font-bold text-[#111111]">
                          {formatCurrency(pro.ticketPrice || 500)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E5E5E5]">
                      <Link
                        to={`/professionals/${pro._id}`}
                        className="w-full py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <span>View & Book Appointment</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: PROFILE SETTINGS
            ======================================================== */}
        {activeTab === "settings" && (
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="mb-6 pb-4 border-b border-[#E5E5E5]">
              <h3 className="text-base font-bold text-[#111111]">
                Customer Profile Details
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Update your contact details and account preferences
              </p>
            </div>

            {formFeedback.message && (
              <div
                className={`p-4 rounded-lg mb-6 text-xs font-semibold ${
                  formFeedback.type === "success"
                    ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30"
                    : "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30"
                }`}
              >
                {formFeedback.message}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  value={displayEmail}
                  disabled
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#E5E5E5]/50 border border-[#E5E5E5] rounded-lg text-[#737373] cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="others">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Avatar Photo URL
                </label>
                <input
                  type="url"
                  name="photo"
                  value={formData.photo}
                  onChange={(e) =>
                    setFormData({ ...formData, photo: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("bookings")}
                  className="px-4 py-2 text-xs font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-black rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {savingProfile ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSave className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            MODAL 1: BOOKING DETAILS MODAL
            ======================================================== */}
        <DetailModal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details #${selectedBooking?.bookingId?.slice(-6)?.toUpperCase() || "FX-REQ"}`}
          subtitle={selectedBooking?.serviceName || "Home Service Order"}
          footer={
            <button
              onClick={() => setSelectedBooking(null)}
              className="px-4 py-1.5 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
            >
              Close
            </button>
          }
        >
          {selectedBooking && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="text-[#737373] block text-[11px]">Status</span>
                  <StatusBadge type="booking" status={selectedBooking.status} />
                </div>
                <div className="text-right">
                  <span className="text-[#737373] block text-[11px]">Payment</span>
                  <StatusBadge type="payment" isPaid={selectedBooking.isPaid} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Scheduled Date</span>
                  <span className="font-bold text-[#111111] text-xs">
                    {formatDate(selectedBooking.appointmentDate)}
                  </span>
                </div>
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Time Window</span>
                  <span className="font-bold text-[#111111] text-xs">
                    {selectedBooking.timeSlot}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block">Service Address</span>
                <span className="font-medium text-[#111111] flex items-center gap-1.5 mt-0.5">
                  <FiMapPin className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>{selectedBooking.serviceAddress || "Address on File"}</span>
                </span>
              </div>

              {selectedBooking.customerNotes && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Customer Special Instructions</span>
                  <p className="text-[#111111] mt-0.5">{selectedBooking.customerNotes}</p>
                </div>
              )}

              {selectedBooking.professional && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg flex items-center gap-3">
                  <img
                    src={selectedBooking.professional.photo || userImg}
                    alt={selectedBooking.professional.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E5E5]"
                  />
                  <div>
                    <span className="font-bold text-[#111111] block">
                      {selectedBooking.professional.name}
                    </span>
                    <span className="text-[#737373] text-[11px]">
                      {selectedBooking.professional.specialization || "Professional Specialist"}
                    </span>
                  </div>
                </div>
              )}

              {selectedBooking.razorpayPaymentId && (
                <div className="p-3 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5] text-[11px] text-[#737373] space-y-1">
                  <div>Payment ID: <span className="font-mono text-[#111111]">{selectedBooking.razorpayPaymentId}</span></div>
                  {selectedBooking.razorpayOrderId && (
                    <div>Order ID: <span className="font-mono text-[#111111]">{selectedBooking.razorpayOrderId}</span></div>
                  )}
                </div>
              )}
            </div>
          )}
        </DetailModal>

        {/* ========================================================
            MODAL 2: CONFIRM CANCELLATION MODAL
            ======================================================== */}
        <ConfirmModal
          isOpen={Boolean(bookingToCancel)}
          title="Cancel Appointment"
          message={
            bookingToCancel?.isPaid
              ? "Are you sure you want to cancel this booking? Please note: FixUp does not process automatic gateway refunds. Paid bookings require contacting support for manual refund review."
              : "Are you sure you want to cancel this scheduled service booking? This slot will immediately be restored as available."
          }
          confirmLabel="Yes, Cancel Booking"
          cancelLabel="Keep Booking"
          isDanger={true}
          loading={cancellingBooking}
          onConfirm={handleConfirmCancel}
          onCancel={() => setBookingToCancel(null)}
        />

        {/* ========================================================
            MODAL 3: SUBMIT REVIEW MODAL
            ======================================================== */}
        <DetailModal
          isOpen={Boolean(bookingToReview)}
          onClose={() => setBookingToReview(null)}
          title="Review Completed Service"
          subtitle={`Share feedback for ${bookingToReview?.professional?.name || "your professional"}`}
        >
          {bookingToReview && (
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {reviewError && (
                <div className="p-3 rounded-lg bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30">
                  {reviewError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#111111] mb-1.5">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <FiStar
                        className={`w-6 h-6 transition-colors ${
                          star <= reviewRating
                            ? "text-amber-500 fill-amber-500"
                            : "text-[#E5E5E5]"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-sm text-[#111111] ml-2">
                    {reviewRating} of 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Your Review Comments
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How was the quality of work, punctuality, and professionalism?..."
                  className="w-full p-3 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBookingToReview(null)}
                  disabled={submittingReview}
                  className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-[#525252] hover:bg-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submittingReview && (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Post Review</span>
                </button>
              </div>
            </form>
          )}
        </DetailModal>
      </div>
    </div>
  );
};

export default MyAccount;
