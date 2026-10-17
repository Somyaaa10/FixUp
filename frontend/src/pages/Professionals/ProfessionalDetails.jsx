import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import avatarImg from "../../assets/images/avatar-img.png";
import electricianImg from "../../assets/images/electrician-img.jpg";
import plumberImg from "../../assets/images/plumber-img.jpg";
import painterImg from "../../assets/images/painter-img.jpg";
import cleanImg from "../../assets/images/homeClean-img.jpg";
import useFetchData from "../../hooks/useFetchData";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import {
  FiStar,
  FiCheckCircle,
  FiCheck,
  FiClock,
  FiShield,
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiArrowLeft,
  FiSend,
  FiAlertCircle,
  FiLock,
  FiTool,
  FiMapPin,
} from "react-icons/fi";

const getSpecializationImage = (spec) => {
  const s = (spec || "").toLowerCase();
  if (s.includes("electric")) return electricianImg;
  if (s.includes("plumb")) return plumberImg;
  if (s.includes("paint")) return painterImg;
  if (s.includes("clean")) return cleanImg;
  return electricianImg;
};

const ProfessionalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("about");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");

  // Phase 3 Review Eligibility States
  const [reviewEligibility, setReviewEligibility] = useState({
    checked: false,
    eligible: false,
    bookingId: null,
    message: "",
  });
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  
  // Phase 2 Scheduling States
  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [appointmentDate, setAppointmentDate] = useState(getTomorrowDateStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("09:00 AM - 11:00 AM");
  const [serviceAddress, setServiceAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookingError, setBookingError] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const { token, user } = useContext(AuthContext);

  const {
    data: professional,
    loading,
    error,
  } = useFetchData(`${BASE_URL}/api/v1/professionals/${id}`);

  // Fetch real-time time slot availability when date or professional changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!id || !appointmentDate) return;
      try {
        setCheckingAvailability(true);
        const res = await fetch(
          `${BASE_URL}/api/v1/bookings/availability/${id}?date=${appointmentDate}`
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setBookedSlots(data.bookedSlots || []);
        }
      } catch (err) {
        console.error("Availability fetch error:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchAvailability();
  }, [id, appointmentDate]);

  // Phase 3: Check review eligibility for logged-in customer
  useEffect(() => {
    const checkEligibility = async () => {
      if (!token || !id || user?.role !== "customer") {
        setReviewEligibility({
          checked: true,
          eligible: false,
          bookingId: null,
          message: !token
            ? "Please log in as a homeowner to leave a review."
            : user?.role !== "customer"
            ? "Only customer accounts can submit reviews."
            : "",
        });
        return;
      }

      try {
        setCheckingEligibility(true);
        const res = await fetch(
          `${BASE_URL}/api/v1/professionals/${id}/reviews/eligibility`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setReviewEligibility({
            checked: true,
            eligible: Boolean(data.eligible),
            bookingId: data.bookingId || null,
            message: data.message || "",
          });
        } else {
          setReviewEligibility({
            checked: true,
            eligible: false,
            bookingId: null,
            message: data.message || "Unable to verify review eligibility",
          });
        }
      } catch (err) {
        console.error("Review eligibility fetch error:", err);
        setReviewEligibility({
          checked: true,
          eligible: false,
          bookingId: null,
          message: "Failed to verify review eligibility",
        });
      } finally {
        setCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [id, token, user]);

  // Load Razorpay Checkout SDK Script
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (document.getElementById("razorpay-sdk")) return;
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpayScript();
  }, []);

  // Compute profile data with rich fallbacks matching reference
  const prof = professional?._id
    ? professional
    : {
        _id: id || "01",
        name: professional?.name || "Rohan Jadhav",
        specialization: professional?.specialization || "Electrician & Appliance Specialist",
        averageRating: professional?.averageRating || 4.9,
        totalRating: professional?.totalRating || 1,
        photo: professional?.photo || null,
        bio:
          professional?.bio ||
          "Certified home technician with 8+ years of field experience in residential electrical repairs and installations.",
        about:
          professional?.about ||
          "Professional certified home technician dedicated to fast, reliable, and high-quality services. Equipped with standard diagnostics tools, circuit testing equipment, and industry-grade safety protocols for all residential repairs, appliance installations, and regular maintenance.",
        ticketPrice: professional?.ticketPrice || 500,
        qualifications:
          professional?.qualifications && professional.qualifications.length > 0
            ? professional.qualifications
            : [
                { degree: "Certified Master Technician", institute: "National Skill Council" },
                { degree: "Advanced Household Electrical Systems", institute: "Technical Training Board" },
              ],
        experiences:
          professional?.experiences && professional.experiences.length > 0
            ? professional.experiences
            : [
                { role: "Senior Maintenance Specialist", hospital: "Urban Fix Services (4 yrs)" },
                { role: "Independent Household Installer", hospital: "FixUp Platform (4 yrs)" },
              ],
        timeSlots:
          professional?.timeSlots && professional.timeSlots.length > 0
            ? professional.timeSlots
            : [
                { day: "Monday - Friday", time: "09:00 AM - 01:00 PM" },
                { day: "Monday - Friday", time: "02:00 PM - 06:00 PM" },
                { day: "Saturday", time: "10:00 AM - 04:00 PM" },
              ],
        reviews: professional?.reviews || [],
      };

  const defaultImg = getSpecializationImage(prof.specialization);

  const handleBooking = async () => {
    try {
      if (!token) {
        window.alert("Please login as a customer to book an appointment");
        navigate("/login");
        return;
      }

      setBookingError("");

      if (!appointmentDate) {
        setBookingError("Please select a valid appointment date.");
        return;
      }

      const todayStr = new Date().toISOString().split("T")[0];
      if (appointmentDate < todayStr) {
        setBookingError("Appointment date cannot be in the past.");
        return;
      }

      if (!selectedTimeSlot) {
        setBookingError("Please select an available time window.");
        return;
      }

      if (bookedSlots.includes(selectedTimeSlot)) {
        setBookingError("The selected time slot is already booked. Please choose an alternate slot.");
        return;
      }

      if (!serviceAddress.trim() || serviceAddress.trim().length < 5) {
        setBookingError("Please provide your complete service address (at least 5 characters).");
        return;
      }

      setBookingLoading(true);

      // Step 1: Create Razorpay Order on Backend with scheduling details
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${prof._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointmentDate,
            timeSlot: selectedTimeSlot,
            serviceAddress: serviceAddress.trim(),
            customerNotes: customerNotes.trim(),
            serviceId: prof.services?.[0]?._id || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not initiate Razorpay order");
      }

      const { order, key } = data;

      // Step 2: Open Razorpay Payment Modal
      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock_key",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "FixUp Home Services",
        description: `Booking with ${prof.name} (${prof.specialization || "Professional"})`,
        image: prof.photo || defaultImg,
        order_id: order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#202124",
        },
        handler: async function (response) {
          // Step 3: Verify Payment Signature & Create Booking
          try {
            const verifyRes = await fetch(
              `${BASE_URL}/api/v1/bookings/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  professionalId: prof._id,
                  appointmentDate,
                  timeSlot: selectedTimeSlot,
                  serviceAddress: serviceAddress.trim(),
                  customerNotes: customerNotes.trim(),
                  serviceId: prof.services?.[0]?._id || undefined,
                }),
              }
            );

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              navigate("/checkout-success");
            } else {
              setBookingError(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            setBookingError("Payment verification error: " + err.message);
          } finally {
            setBookingLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setBookingLoading(false);
            setBookingError("Payment checkout cancelled. Your appointment has not been booked yet.");
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setBookingLoading(false);
          setBookingError(`Payment declined: ${response.error?.description || "Transaction failed"}`);
        });
        rzp.open();
      } else {
        setBookingLoading(false);
        setBookingError("Payment gateway is initializing. Please click Book again in a few moments.");
      }
    } catch (err) {
      setBookingLoading(false);
      setBookingError(err.message || "Failed to initiate Razorpay booking");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      window.alert("Please login to submit a review");
      navigate("/login");
      return;
    }

    if (!reviewText.trim()) {
      window.alert("Please provide feedback text for your review");
      return;
    }

    if (!reviewEligibility.eligible) {
      window.alert(reviewEligibility.message || "You are not eligible to review this professional");
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback("");

    try {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          reviewText: reviewText.trim(),
          bookingId: reviewEligibility.bookingId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setReviewFeedback("Thank you! Your verified review has been submitted.");
      setReviewText("");
      setReviewEligibility({
        checked: true,
        eligible: false,
        bookingId: null,
        message: "You have reviewed your completed booking for this professional. Thank you for your feedback!",
      });

      // Append review locally
      if (prof.reviews) {
        prof.reviews.unshift({
          user: { name: user?.name || "You", photo: user?.photo },
          rating,
          reviewText: reviewText.trim(),
          createdAt: new Date(),
        });
      }

      setTimeout(() => setReviewFeedback(""), 5000);
    } catch (err) {
      window.alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-[#F7F7F6] min-h-screen py-8 sm:py-12 text-[#202124]">
      <div className="container max-w-6xl mx-auto px-4 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <Link
            to="/professionals"
            className="inline-flex items-center gap-1.5 font-medium hover:text-[#202124] transition"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Professionals</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5">
            <Link to="/home" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to="/professionals" className="hover:underline">Professionals</Link>
            <span>/</span>
            <span className="text-[#202124] font-semibold">{prof.name}</span>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-[#AD7B5D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-heading text-sm text-[#6B7280]">Loading professional profile...</p>
          </div>
        )}

        {error && (
          <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-center max-w-md mx-auto">
            <FiAlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="font-heading text-sm font-bold text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2 text-xs font-semibold bg-[#202124] text-white rounded-full hover:bg-black transition"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && (
          <>
            {/* ========================================================
                1. HERO PROFILE CARD
                ======================================================== */}
            <div className="bg-white rounded-3xl border border-[#EAE7E3] p-6 sm:p-8 lg:p-10 shadow-soft">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-8">
                {/* Professional Photo with Fallbacks */}
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden bg-gray-100 border-2 border-[#EAE7E3] shadow-card">
                    <img
                      src={prof.photo || defaultImg}
                      alt={prof.name ? `${prof.name} professional profile photo` : "Professional profile photo"}
                      width={160}
                      height={160}
                      loading="eager"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.currentTarget.src = defaultImg;
                      }}
                    />
                  </div>
                  <span
                    className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-white shadow-soft"
                    title="Verified Professional"
                  >
                    <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                </div>

                {/* Professional Header Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-[#AD7B5D]/10 text-[#AD7B5D] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      {prof.specialization || "Home Service Expert"}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#EFFBF5] text-[#27865B] px-3 py-1 rounded-full text-xs font-semibold border border-[#A7F3D0]/60">
                      <FiShield className="w-3.5 h-3.5" />
                      FixUp Verified Pro
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#202124] bg-[#F7F7F6] border border-[#EAE7E3]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Ready to Book
                    </span>
                  </div>

                  <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#202124] tracking-tight">
                    {prof.name}
                  </h1>

                  {/* Rating Strip */}
                  <div className="flex items-center gap-3 mt-2.5">
                    <div className="flex items-center gap-1 bg-[#FEF9E7] text-amber-700 font-semibold px-2.5 py-0.5 rounded-full text-xs border border-amber-200">
                      <FiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{prof.averageRating || 4.9}</span>
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      Based on{" "}
                      <strong className="text-[#202124]">
                        {prof.reviews?.length || prof.totalRating || 1}
                      </strong>{" "}
                      verified homeowner review{prof.reviews?.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-xs sm:text-sm text-[#6B7280] mt-3 leading-relaxed max-w-2xl">
                    {prof.bio}
                  </p>


                </div>
              </div>
            </div>

            {/* ========================================================
                2. MAIN CONTENT & SIDEBAR GRID
                ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Tabs & Sections */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-3xl border border-[#EAE7E3] p-6 sm:p-8 shadow-soft">
                  {/* Modern Pill Tab Switcher */}
                  <div className="flex items-center gap-2 border-b border-[#EAE7E3] pb-5 overflow-x-auto">
                    <button
                      onClick={() => setTab("about")}
                      className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-heading font-semibold transition-all whitespace-nowrap ${
                        tab === "about"
                          ? "bg-[#202124] text-white shadow-soft"
                          : "bg-[#F7F7F6] text-[#6B7280] hover:text-[#202124]"
                      }`}
                    >
                      About & Services
                    </button>

                    <button
                      onClick={() => setTab("credentials")}
                      className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-heading font-semibold transition-all whitespace-nowrap ${
                        tab === "credentials"
                          ? "bg-[#202124] text-white shadow-soft"
                          : "bg-[#F7F7F6] text-[#6B7280] hover:text-[#202124]"
                      }`}
                    >
                      Experience & Credentials
                    </button>

                    <button
                      onClick={() => setTab("feedback")}
                      className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-heading font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        tab === "feedback"
                          ? "bg-[#202124] text-white shadow-soft"
                          : "bg-[#F7F7F6] text-[#6B7280] hover:text-[#202124]"
                      }`}
                    >
                      <span>Customer Reviews</span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full ${
                          tab === "feedback"
                            ? "bg-white/20 text-white"
                            : "bg-[#EAE7E3] text-[#202124]"
                        }`}
                      >
                        {prof.reviews?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* TAB 1: ABOUT & SERVICES */}
                  {tab === "about" && (
                    <div className="pt-6 space-y-6 text-xs sm:text-sm leading-relaxed text-[#6B7280]">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-[#202124] mb-3">
                          About {prof.name}
                        </h3>
                        <p className="leading-relaxed">
                          {prof.about}
                        </p>
                      </div>

                      {/* Registered Trade Services */}
                      {prof.services && prof.services.length > 0 && (
                        <div className="p-6 rounded-2xl bg-[#FEF9E7] border border-[#FDE68A]/60">
                          <h4 className="font-heading text-sm font-bold text-[#202124] mb-3 flex items-center gap-2">
                            <FiTool className="w-4 h-4 text-[#AD7B5D]" />
                            Registered Services & Trade Offerings:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {prof.services.map((svc) => (
                              <span
                                key={svc._id || svc.name}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EAE7E3] text-xs font-semibold text-[#202124] shadow-soft"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                {svc.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Included in Every Visit */}
                      <div className="p-6 rounded-2xl bg-[#EFFBF5] border border-[#A7F3D0]/60">
                        <h4 className="font-heading text-sm font-bold text-[#202124] mb-3 flex items-center gap-2">
                          <FiTool className="w-4 h-4 text-[#27865B]" />
                          Included in Every Service Visit:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#202124]">
                          <div className="flex items-center gap-2">
                            <FiCheck className="w-3.5 h-3.5 text-[#27865B] shrink-0" />
                            <span>Complete initial diagnosis & inspection</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiCheck className="w-3.5 h-3.5 text-[#27865B] shrink-0" />
                            <span>Professional labor with standard tools included</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiCheck className="w-3.5 h-3.5 text-[#27865B] shrink-0" />
                            <span>Clear pricing quote before starting any extra work</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiCheck className="w-3.5 h-3.5 text-[#27865B] shrink-0" />
                            <span>Post-service cleanup & testing guarantee</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CREDENTIALS & EXPERIENCE */}
                  {tab === "credentials" && (
                    <div className="pt-6 space-y-6">
                      {/* Qualifications */}
                      <div>
                        <h3 className="font-heading text-base font-bold text-[#202124] mb-3 flex items-center gap-2">
                          <FiAward className="w-4 h-4 text-[#AD7B5D]" />
                          Qualifications & Certifications
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {prof.qualifications?.map((q, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EAE7E3]"
                            >
                              <p className="font-heading text-xs font-bold text-[#202124]">
                                {q.degree || "Certified Trade Specialist"}
                              </p>
                              <p className="text-[11px] text-[#6B7280] mt-0.5">
                                {q.institute || "Professional Standards Council"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Work Experience */}
                      <div className="pt-4 border-t border-[#EAE7E3]">
                        <h3 className="font-heading text-base font-bold text-[#202124] mb-3 flex items-center gap-2">
                          <FiBriefcase className="w-4 h-4 text-[#AD7B5D]" />
                          Experience & Work History
                        </h3>
                        <div className="space-y-3">
                          {prof.experiences?.map((exp, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EAE7E3] flex items-center justify-between"
                            >
                              <div>
                                <p className="font-heading text-xs font-bold text-[#202124]">
                                  {exp.role || "Senior Home Technician"}
                                </p>
                                <p className="text-[11px] text-[#6B7280] mt-0.5">
                                  {exp.hospital || "Residential Service Team"}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-[#AD7B5D] bg-[#AD7B5D]/10 px-3 py-1 rounded-full">
                                Verified
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FEEDBACK & REVIEWS */}
                  {tab === "feedback" && (
                    <div className="pt-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-base font-bold text-[#202124]">
                          Homeowner Feedback
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-semibold bg-[#FEF9E7] text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                          <FiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{prof.averageRating || 4.9} out of 5.0</span>
                        </div>
                      </div>

                      {reviewFeedback && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                          <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{reviewFeedback}</span>
                        </div>
                      )}

                      {/* Review List */}
                      {(!prof.reviews || prof.reviews.length === 0) ? (
                        <div className="text-center py-10 border border-dashed border-[#EAE7E3] rounded-2xl bg-[#F7F7F6]">
                          <FiStar className="w-8 h-8 text-[#6B7280]/40 mx-auto mb-2" />
                          <p className="font-heading text-xs font-bold text-[#202124]">
                            No reviews yet
                          </p>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            Be the first to review after your service visit!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {prof.reviews.map((rev, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-2xl bg-[#F7F7F6] border border-[#EAE7E3]"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={rev.user?.photo || avatarImg}
                                    alt={rev.user?.name ? `${rev.user.name}'s customer avatar` : "Verified customer avatar"}
                                    width={32}
                                    height={32}
                                    loading="lazy"
                                    className="w-8 h-8 rounded-full object-cover border border-[#EAE7E3]"
                                    onError={(e) => {
                                      e.currentTarget.src = avatarImg;
                                    }}
                                  />
                                  <div>
                                    <h5 className="font-heading text-xs font-bold text-[#202124]">
                                      {rev.user?.name || "Verified Customer"}
                                    </h5>
                                    <span className="text-[10px] text-[#6B7280]">
                                      FixUp Homeowner
                                    </span>
                                  </div>
                                </div>

                                <div className="flex text-amber-500 gap-0.5">
                                  {[...Array(rev.rating || 5)].map((_, i) => (
                                    <FiStar key={i} className="w-3 h-3 fill-amber-500" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-[#202124] italic pl-10 leading-relaxed">
                                &ldquo;{rev.reviewText}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Review Submission Area: Displayed only when verified eligible */}
                      {checkingEligibility ? (
                        <div className="mt-8 p-6 rounded-3xl bg-white border border-[#EAE7E3] text-center shadow-soft">
                          <div className="w-5 h-5 border-2 border-[#AD7B5D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-xs text-[#6B7280]">
                            Verifying service completion eligibility...
                          </p>
                        </div>
                      ) : reviewEligibility.eligible ? (
                        <form
                          onSubmit={handleReviewSubmit}
                          className="mt-8 bg-white p-6 sm:p-7 rounded-3xl border border-[#EAE7E3] shadow-soft space-y-4"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#EAE7E3]">
                            <div>
                              <h4 className="font-heading text-sm font-bold text-[#202124]">
                                Leave a Verified Customer Review
                              </h4>
                              <p className="text-[11px] text-[#6B7280]">
                                Booking Ref #{String(reviewEligibility.bookingId).slice(-8).toUpperCase()}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FiCheck className="w-3 h-3" />
                              Completed Booking Verified
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                              Service Rating:
                            </label>
                            <div className="flex gap-2">
                              {[5, 4, 3, 2, 1].map((num) => (
                                <button
                                  type="button"
                                  key={num}
                                  onClick={() => setRating(num)}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                                    rating === num
                                      ? "bg-[#202124] text-white border-[#202124]"
                                      : "bg-[#F7F7F6] text-[#6B7280] border-[#EAE7E3] hover:text-[#202124]"
                                  }`}
                                >
                                  <FiStar
                                    className={`w-3 h-3 ${
                                      rating === num ? "fill-amber-400 text-amber-400" : ""
                                    }`}
                                  />
                                  <span>{num} Star{num > 1 ? "s" : ""}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                              Your Service Feedback:
                            </label>
                            <textarea
                              rows={3}
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Share your experience regarding punctuality, work quality, and service professionalism..."
                              required
                              className="w-full p-3.5 bg-[#F7F7F6] border border-[#EAE7E3] rounded-2xl text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D]"
                            />
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="px-6 py-2.5 bg-[#202124] hover:bg-black text-white font-heading font-semibold text-xs rounded-full shadow-soft transition flex items-center gap-2 disabled:opacity-50"
                            >
                              <FiSend className="w-3.5 h-3.5" />
                              <span>{submittingReview ? "Submitting..." : "Submit Review"}</span>
                            </button>
                          </div>
                        </form>
                      ) : !token ? (
                        <div className="mt-8 p-6 rounded-3xl bg-white border border-[#EAE7E3] text-center shadow-soft">
                          <FiLock className="w-6 h-6 text-[#AD7B5D] mx-auto mb-2" />
                          <h4 className="font-heading text-sm font-bold text-[#202124]">
                            Verified Homeowner Reviews
                          </h4>
                          <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1 leading-relaxed">
                            Only homeowners with a completed service appointment can review professionals on FixUp. Please log in to check your eligibility.
                          </p>
                          <Link
                            to="/login"
                            className="mt-3.5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#202124] hover:bg-black text-white text-xs font-semibold rounded-full transition shadow-soft"
                          >
                            <span>Log In to Review</span>
                          </Link>
                        </div>
                      ) : user?.role !== "customer" ? (
                        <div className="mt-8 p-5 rounded-3xl bg-[#F7F7F6] border border-[#EAE7E3] text-center">
                          <FiShield className="w-5 h-5 text-[#AD7B5D] mx-auto mb-1.5" />
                          <p className="font-heading text-xs font-bold text-[#202124]">
                            Customer Reviews Only
                          </p>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            Only registered homeowners can submit service reviews.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-8 p-6 rounded-3xl bg-white border border-[#EAE7E3] shadow-soft">
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                              <FiShield className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-heading text-sm font-bold text-[#202124]">
                                Verified Review Eligibility
                              </h4>
                              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                                {reviewEligibility.message ||
                                  "Only customers who have an eligible completed service appointment with this professional can submit a review. Once your appointment is completed, the review form will unlock automatically."}
                              </p>
                              <div className="mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F7F7F6] text-[#202124] border border-[#EAE7E3]">
                                  <FiCheck className="w-3 h-3 text-emerald-600" />
                                  100% Genuine Customer Reviews
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================
                  RIGHT COLUMN: STICKY BOOKING CARD
                  ======================================================== */}
              <div className="lg:col-span-4">
                <div className="sticky top-28 bg-white rounded-3xl border border-[#EAE7E3] p-6 sm:p-7 shadow-card space-y-6">
                  {/* Step 1: Standard Service Fee Banner */}
                  <div className="flex items-baseline justify-between pb-4 border-b border-[#EAE7E3]">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] block">
                        Standard Service Fee
                      </span>
                      <span className="text-[11px] text-[#27865B] font-medium flex items-center gap-1 mt-0.5">
                        <FiCheck className="w-3 h-3" />
                        Professional Visit & Inspection
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-heading text-3xl font-bold text-[#202124]">
                        ₹{prof.ticketPrice || 500}
                      </span>
                      <span className="text-[10px] text-[#6B7280] block">INR (Tax Incl.)</span>
                    </div>
                  </div>

                  {/* Step 2: Date & Available Time Slot */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#202124] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5 text-[#AD7B5D]" />
                        1. Select Service Date:
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={appointmentDate}
                        onChange={(e) => {
                          setAppointmentDate(e.target.value);
                          setBookingError("");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] bg-[#F7F7F6] focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] transition"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5 text-[#AD7B5D]" />
                          2. Select Time Window:
                        </label>
                        {checkingAvailability && (
                          <span className="text-[10px] text-[#AD7B5D] animate-pulse">
                            Checking slots...
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          "09:00 AM - 11:00 AM",
                          "11:00 AM - 01:00 PM",
                          "02:00 PM - 04:00 PM",
                          "04:00 PM - 06:00 PM",
                        ].map((slot, index) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = selectedTimeSlot === slot;

                          return (
                            <button
                              key={index}
                              type="button"
                              disabled={isBooked}
                              onClick={() => {
                                setSelectedTimeSlot(slot);
                                setBookingError("");
                              }}
                              className={`p-2.5 rounded-2xl border text-xs text-left transition flex flex-col justify-between ${
                                isBooked
                                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                                  : isSelected
                                  ? "bg-[#EFFBF5] border-[#27865B] text-[#202124] font-semibold shadow-soft"
                                  : "bg-[#F7F7F6] border-[#EAE7E3] text-[#6B7280] hover:bg-white hover:border-[#AD7B5D]"
                              }`}
                            >
                              <span className="truncate">{slot}</span>
                              <span
                                className={`text-[10px] font-medium mt-1 ${
                                  isBooked
                                    ? "text-red-500 font-semibold"
                                    : isSelected
                                    ? "text-[#27865B]"
                                    : "text-[#6B7280]"
                                }`}
                              >
                                {isBooked ? "• Booked" : isSelected ? "• Selected" : "• Available"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Service Address & Notes */}
                  <div className="space-y-3 pt-2 border-t border-[#EAE7E3]">
                    <div>
                      <label className="block text-xs font-bold text-[#202124] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FiMapPin className="w-3.5 h-3.5 text-[#AD7B5D]" />
                        3. Service Address:
                      </label>
                      <textarea
                        rows={2}
                        value={serviceAddress}
                        onChange={(e) => {
                          setServiceAddress(e.target.value);
                          setBookingError("");
                        }}
                        placeholder="House / Flat No., Building, Street Name, Area..."
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#EAE7E3] text-xs text-[#202124] bg-[#F7F7F6] focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                        Optional Notes for Technician:
                      </label>
                      <input
                        type="text"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="e.g. Please bring extra piping, gate code #1234"
                        className="w-full px-3.5 py-2 rounded-2xl border border-[#EAE7E3] text-xs text-[#202124] bg-[#F7F7F6] focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] transition"
                      />
                    </div>
                  </div>

                  {/* Booking Error Banner */}
                  {bookingError && (
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                      <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Trust Promises */}
                  <div className="p-3.5 rounded-2xl bg-[#F7F7F6] border border-[#EAE7E3] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#202124]">
                      <FiCheckCircle className="w-4 h-4 text-[#27865B] shrink-0" />
                      <span>Certified expert arrives at your scheduled window</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#202124]">
                      <FiCheckCircle className="w-4 h-4 text-[#27865B] shrink-0" />
                      <span>FixUp 100% Service Quality Guarantee</span>
                    </div>
                  </div>

                  {/* Booking CTA Button */}
                  <div>
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="w-full rounded-full bg-[#202124] hover:bg-black text-white font-heading font-semibold text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-soft transition disabled:opacity-50"
                    >
                      <FiLock className="w-4 h-4 text-[#AD7B5D]" />
                      <span>
                        {bookingLoading
                          ? "Connecting Razorpay Gateway..."
                          : `Book Appointment (₹${prof.ticketPrice || 500})`}
                      </span>
                    </button>

                    <div className="mt-2.5 text-center">
                      <p className="text-[11px] text-[#6B7280] flex items-center justify-center gap-1.5">
                        <FiShield className="w-3.5 h-3.5 text-[#27865B]" />
                        <span>100% Secure Checkout powered by Razorpay</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDetails;