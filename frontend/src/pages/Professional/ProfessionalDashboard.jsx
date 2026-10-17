import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import ProfessionalLayout from "./ProfessionalLayout";
import StatCard from "../../components/Dashboard/StatCard";
import StatusBadge from "../../components/Dashboard/StatusBadge";
import EmptyState from "../../components/Dashboard/EmptyState";
import ErrorState from "../../components/Dashboard/ErrorState";
import LoadingSkeleton from "../../components/Dashboard/LoadingSkeleton";
import DetailModal from "../../components/Dashboard/DetailModal";
import userImg from "../../assets/images/avatar-img.png";
import {
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiStar,
  FiUser,
  FiMail,
  FiPhone,
  FiArrowRight,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiEye,
  FiCalendar,
  FiShield,
  FiRefreshCw,
  FiCreditCard,
  FiMapPin,
  FiTool,
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

const ProfessionalDashboard = () => {
  const { token, user: authUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Job detail / status modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to load professional dashboard");
      }

      setProfile(result.data);
      setAppointments(result.data?.appointments || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Unable to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Update Job Status Handler
  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingStatusId(bookingId);
    setStatusMessage({ type: "", text: "" });

    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/professionals/appointments/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to update job status");
      }

      // Update state locally
      setAppointments((prev) =>
        prev.map((app) =>
          app._id === bookingId ? { ...app, status: newStatus } : app
        )
      );

      if (selectedJob && selectedJob._id === bookingId) {
        setSelectedJob((prev) => ({ ...prev, status: newStatus }));
      }

      setStatusMessage({
        type: "success",
        text: `Job status successfully updated to ${newStatus.replace("_", " ")}`,
      });
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update job status",
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Calculations derived strictly from stored data
  const totalJobs = appointments.length;
  const upcomingJobs = appointments.filter((a) =>
    ["pending", "approved", "in_progress"].includes(a.status?.toLowerCase())
  ).length;
  const completedJobs = appointments.filter(
    (a) => a.status?.toLowerCase() === "completed"
  ).length;

  const avgRating = Number(
    profile?.averageRating ||
      (profile?.reviews && profile.reviews.length > 0
        ? profile.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
          profile.reviews.length
        : 5.0)
  ).toFixed(1);

  // Reliable verified paid job earnings
  const paidEarnings = appointments.reduce((sum, a) => {
    if (a.isPaid === true && a.status?.toLowerCase() !== "cancelled") {
      const price = Number(a.ticketPrice) || 0;
      return sum + price;
    }
    return sum;
  }, 0);

  const recentJobs = appointments.slice(0, 5);
  const reviews = profile?.reviews || [];

  const isApproved = profile?.isApproved === "approved";
  const isCancelled = profile?.isApproved === "cancelled";
  const isPending = !isApproved && !isCancelled;
  const isActive = profile?.isActive !== false;

  return (
    <ProfessionalLayout profileData={profile}>
      <div className="space-y-6">
        {/* Status Toast Notification */}
        {statusMessage.text && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
              statusMessage.type === "success"
                ? "bg-white border-[#16A34A]/40 text-[#16A34A] shadow-xs"
                : "bg-white border-[#DC2626]/40 text-[#DC2626] shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <FiCheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
              ) : (
                <FiAlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage({ type: "", text: "" })}
              className="p-1 hover:opacity-75"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Approval and Verification Status Banner */}
        {isPending && (
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#D97706]/40 flex items-start gap-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <FiClock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#111111]">
                Application Under Admin Review
              </h4>
              <p className="text-xs text-[#525252] mt-0.5 leading-relaxed">
                Your professional profile is currently pending verification by the FixUp administration.
                In accordance with security policies, unapproved profiles remain hidden from the public directory.
                You can still customize your profile and add service offerings below.
              </p>
            </div>
          </div>
        )}

        {!isActive && (
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#737373]/40 flex items-start gap-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-[#F5F5F5] text-[#737373] flex items-center justify-center shrink-0 mt-0.5">
              <FiAlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#111111]">
                Account Inactive / Hidden
              </h4>
              <p className="text-xs text-[#525252] mt-0.5 leading-relaxed">
                Your account is currently set to inactive. Customers cannot discover or book your services.
                You can reactivate your live availability anytime from{" "}
                <Link to="/professional/settings" className="font-semibold underline text-[#111111]">
                  Settings
                </Link>.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Heading Header */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md">
                Professional Overview
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                  !isActive
                    ? "bg-[#737373]/10 text-[#737373] border-[#737373]/20"
                    : isApproved
                    ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20"
                    : "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    !isActive ? "bg-[#737373]" : isApproved ? "bg-[#16A34A]" : "bg-[#D97706]"
                  }`}
                />
                {!isActive
                  ? "Inactive"
                  : isApproved
                  ? "Verified & Live"
                  : "Pending Approval"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] mt-2 tracking-tight">
              {profile?.name || "Professional"}&apos;s Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-0.5">
              Specialization:{" "}
              <span className="font-semibold text-[#111111]">
                {profile?.specialization || "Home Service Specialist"}
              </span>{" "}
              • Base Rate:{" "}
              <span className="font-semibold text-[#111111]">
                {formatCurrency(profile?.ticketPrice || 500)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/professional/jobs"
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <FiBriefcase className="w-3.5 h-3.5" />
              <span>Manage Jobs</span>
            </Link>
            <Link
              to="/professional/profile"
              className="px-4 py-2 bg-white border border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <FiUser className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Jobs"
            value={loading ? "..." : totalJobs}
            subtitle="All assigned customer bookings"
            icon={FiBriefcase}
          />
          <StatCard
            title="Upcoming Jobs"
            value={loading ? "..." : upcomingJobs}
            subtitle="Scheduled & in-progress"
            icon={FiClock}
            badgeText={upcomingJobs > 0 ? "Pending action" : null}
            badgeType="warning"
          />
          <StatCard
            title="Completed Jobs"
            value={loading ? "..." : completedJobs}
            subtitle="Fulfillments confirmed"
            icon={FiCheckCircle}
            badgeText={completedJobs > 0 ? "Done" : null}
            badgeType="success"
          />
          <StatCard
            title="Rating & Paid Earnings"
            value={loading ? "..." : `${avgRating} ★`}
            subtitle={
              loading
                ? "Calculating..."
                : `${formatCurrency(paidEarnings)} paid online`
            }
            icon={FiCreditCard}
          />
        </div>

        {/* Main Content Grid: Recent Jobs + Customer Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Recent Jobs Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111111]">Recent Jobs</h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Latest customer bookings and service appointments
                </p>
              </div>
              <Link
                to="/professional/jobs"
                className="text-xs font-semibold text-[#111111] hover:underline inline-flex items-center gap-1"
              >
                <span>View all jobs</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading && <LoadingSkeleton type="table" count={3} />}

            {!loading && error && (
              <ErrorState title="Failed to load jobs" message={error} onRetry={fetchDashboardData} />
            )}

            {!loading && !error && recentJobs.length === 0 && (
              <EmptyState
                icon={FiBriefcase}
                title="No assigned jobs yet"
                description="When customers book appointments with your profile, they will appear here."
              />
            )}

            {!loading && !error && recentJobs.length > 0 && (
              <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Date & Slot</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {recentJobs.map((job) => {
                        const custName = job.user?.name || "Customer";
                        const custPhone = job.user?.phone || "";
                        const isCanc = job.status?.toLowerCase() === "cancelled";
                        const isComp = job.status?.toLowerCase() === "completed";

                        return (
                          <tr key={job._id} className="hover:bg-[#F5F5F5] transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#111111] block">
                                {custName}
                              </span>
                              <span className="text-[11px] text-[#737373] block">
                                {job.serviceAddress || "Address on File"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-[#111111]">
                              <span className="font-medium block">
                                {formatDate(job.appointmentDate)}
                              </span>
                              <span className="text-[11px] text-[#737373]">
                                {job.timeSlot}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-[#111111]">
                              {formatCurrency(Number(job.ticketPrice) || 500)}
                            </td>

                            <td className="py-3.5 px-4">
                              <StatusBadge type="booking" status={job.status} />
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedJob(job)}
                                  className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                  title="View Details"
                                  aria-label="View Details"
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                </button>

                                {/* Quick inline progression if not cancelled or completed */}
                                {!isCanc && !isComp && (
                                  <button
                                    onClick={() => {
                                      const nextStatus =
                                        job.status === "pending"
                                          ? "approved"
                                          : job.status === "approved"
                                          ? "in_progress"
                                          : "completed";
                                      handleUpdateStatus(job._id, nextStatus);
                                    }}
                                    disabled={updatingStatusId === job._id}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#111111] hover:bg-black text-white transition-colors"
                                  >
                                    {updatingStatusId === job._id
                                      ? "Updating..."
                                      : job.status === "pending"
                                      ? "Confirm"
                                      : job.status === "approved"
                                      ? "Start Job"
                                      : "Complete"}
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

          {/* Right Column: Customer Reviews */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5">
              <h3 className="text-base font-bold text-[#111111]">Customer Reviews</h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Feedback from completed appointments ({reviews.length})
              </p>

              <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FiStar className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-xl font-bold text-[#111111]">{avgRating}</span>
                  <span className="text-xs text-[#737373]">/ 5.0</span>
                </div>
                <span className="text-xs text-[#525252] font-medium">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="p-6 bg-white border border-[#E5E5E5] rounded-xl text-center text-xs text-[#737373]">
                No customer reviews yet. Reviews can be posted by customers once their booking is marked completed.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 4).map((r, i) => (
                  <div
                    key={r._id || i}
                    className="p-4 bg-white border border-[#E5E5E5] rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={r.user?.photo || userImg}
                          alt={r.user?.name || "Customer"}
                          className="w-6 h-6 rounded-full object-cover border border-[#E5E5E5]"
                        />
                        <span className="font-semibold text-[#111111]">
                          {r.user?.name || "Customer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: r.rating || 5 }).map((_, sIdx) => (
                          <FiStar key={sIdx} className="w-3 h-3 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#525252] italic leading-relaxed">
                      &ldquo;{r.reviewText}&rdquo;
                    </p>
                    <span className="text-[10px] text-[#737373] block text-right">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Job Details & Status Management Modal */}
        <DetailModal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          title={`Job Details #${selectedJob?._id?.slice(-6)?.toUpperCase() || ""}`}
          subtitle={`Customer: ${selectedJob?.user?.name || "Valued Homeowner"}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[#737373]">
                Change status according to current job progress
              </span>
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-1.5 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          }
        >
          {selectedJob && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="text-[#737373] block text-[11px]">Current Status</span>
                  <StatusBadge type="booking" status={selectedJob.status} />
                </div>
                <div className="text-right">
                  <span className="text-[#737373] block text-[11px]">Payment</span>
                  <StatusBadge type="payment" isPaid={selectedJob.isPaid} />
                </div>
              </div>

              {/* Status Action Buttons */}
              {selectedJob.status !== "cancelled" && selectedJob.status !== "completed" && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl">
                  <span className="text-xs font-semibold text-[#111111] block mb-2">
                    Update Job Progression
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedJob.status !== "approved" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedJob._id, "approved")}
                        disabled={updatingStatusId === selectedJob._id}
                        className="px-3 py-1.5 bg-[#111111] text-white rounded-lg font-semibold hover:bg-black transition-colors"
                      >
                        Accept / Confirm
                      </button>
                    )}
                    {selectedJob.status !== "in_progress" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedJob._id, "in_progress")}
                        disabled={updatingStatusId === selectedJob._id}
                        className="px-3 py-1.5 bg-white border border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] rounded-lg font-semibold transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(selectedJob._id, "completed")}
                      disabled={updatingStatusId === selectedJob._id}
                      className="px-3 py-1.5 bg-[#16A34A] text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedJob._id, "cancelled")}
                      disabled={updatingStatusId === selectedJob._id}
                      className="px-3 py-1.5 border border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg font-semibold transition-colors"
                    >
                      Cancel Job
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Appointment Date</span>
                  <span className="font-bold text-[#111111] text-xs">
                    {formatDate(selectedJob.appointmentDate)}
                  </span>
                </div>
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Time Window</span>
                  <span className="font-bold text-[#111111] text-xs">
                    {selectedJob.timeSlot}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block">Service Location</span>
                <span className="font-medium text-[#111111] flex items-center gap-1.5 mt-0.5">
                  <FiMapPin className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>{selectedJob.serviceAddress || "Address on file"}</span>
                </span>
              </div>

              <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block">Customer Contact</span>
                <span className="font-bold text-[#111111] block mt-0.5">
                  {selectedJob.user?.name || "Customer"}
                </span>
                <span className="text-[#737373] text-[11px]">
                  {selectedJob.user?.email} {selectedJob.user?.phone ? `• ${selectedJob.user?.phone}` : ""}
                </span>
              </div>

              {selectedJob.customerNotes && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Customer Instructions</span>
                  <p className="text-[#111111] mt-0.5">{selectedJob.customerNotes}</p>
                </div>
              )}
            </div>
          )}
        </DetailModal>
      </div>
    </ProfessionalLayout>
  );
};

export default ProfessionalDashboard;
