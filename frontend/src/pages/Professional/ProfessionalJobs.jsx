import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import ProfessionalLayout from "./ProfessionalLayout";
import StatusBadge from "../../components/Dashboard/StatusBadge";
import SearchToolbar from "../../components/Dashboard/SearchToolbar";
import EmptyState from "../../components/Dashboard/EmptyState";
import ErrorState from "../../components/Dashboard/ErrorState";
import LoadingSkeleton from "../../components/Dashboard/LoadingSkeleton";
import DetailModal from "../../components/Dashboard/DetailModal";
import userImg from "../../assets/images/avatar-img.png";
import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiEye,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiMail,
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

const ProfessionalJobs = () => {
  const { token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals & Action States
  const [selectedJob, setSelectedJob] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load jobs");
      }
      setProfile(data.data);
      setAppointments(data.data?.appointments || []);
    } catch (err) {
      setError(err.message || "Failed to retrieve job requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchJobs();
    }
  }, [token]);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 4000);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setAppointments((prev) =>
        prev.map((app) =>
          app._id === bookingId ? { ...app, status: newStatus } : app
        )
      );

      if (selectedJob && selectedJob._id === bookingId) {
        setSelectedJob((prev) => ({ ...prev, status: newStatus }));
      }

      showToast("success", `Job updated to ${newStatus.replace("_", " ")}`);
    } catch (err) {
      showToast("error", err.message || "Failed to update job status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered jobs
  const filteredJobs = appointments.filter((job) => {
    const status = (job.status || "pending").toLowerCase();
    if (statusFilter !== "all" && status !== statusFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const cName = (job.user?.name || "").toLowerCase();
      const addr = (job.serviceAddress || "").toLowerCase();
      const sName = (job.serviceName || "").toLowerCase();
      const id = String(job._id || "").toLowerCase();
      return cName.includes(q) || addr.includes(q) || sName.includes(q) || id.includes(q);
    }
    return true;
  });

  // Filter counts
  const countFor = (st) =>
    st === "all"
      ? appointments.length
      : appointments.filter((a) => (a.status || "pending").toLowerCase() === st).length;

  return (
    <ProfessionalLayout profileData={profile}>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage.text && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
              toastMessage.type === "success"
                ? "bg-white border-[#16A34A]/40 text-[#16A34A] shadow-xs"
                : "bg-white border-[#DC2626]/40 text-[#DC2626] shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <FiCheckCircle className="w-4 h-4 text-[#16A34A]" />
              ) : (
                <FiAlertCircle className="w-4 h-4 text-[#DC2626]" />
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

        {/* Page Header */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md inline-block mb-1.5">
              Service Management
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
              Customer Jobs & Work Orders
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-0.5">
              Review incoming service appointments, accept work orders, and mark completions
            </p>
          </div>

          <button
            onClick={fetchJobs}
            disabled={loading}
            className="px-4 py-2 border border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <FiClock className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Jobs</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by customer, address, or booking ID..."
          filters={[
            { label: "All", value: "all", count: countFor("all") },
            { label: "Pending", value: "pending", count: countFor("pending") },
            { label: "Confirmed", value: "approved", count: countFor("approved") },
            { label: "In Progress", value: "in_progress", count: countFor("in_progress") },
            { label: "Completed", value: "completed", count: countFor("completed") },
            { label: "Cancelled", value: "cancelled", count: countFor("cancelled") },
          ]}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {/* Content Views */}
        {loading && <LoadingSkeleton type="table" count={5} />}

        {!loading && error && (
          <ErrorState title="Failed to load jobs" message={error} onRetry={fetchJobs} />
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <EmptyState
            icon={FiBriefcase}
            title="No jobs matching criteria"
            description={
              search
                ? `No work orders matched "${search}".`
                : statusFilter !== "all"
                ? `There are currently no jobs with status "${statusFilter}".`
                : "No customer bookings have been assigned to your account yet."
            }
            actionLabel={search || statusFilter !== "all" ? "Reset Filters" : null}
            onAction={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          />
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Service & Slot</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Job Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredJobs.map((job) => {
                    const custName = job.user?.name || "Customer";
                    const isCancelled = job.status?.toLowerCase() === "cancelled";
                    const isCompleted = job.status?.toLowerCase() === "completed";

                    return (
                      <tr key={job._id} className="hover:bg-[#F5F5F5] transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#111111] block">
                            #{job._id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-[#737373]">
                            {formatDate(job.appointmentDate)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={job.user?.photo || userImg}
                              alt={custName}
                              className="w-7 h-7 rounded-full object-cover border border-[#E5E5E5]"
                              onError={(e) => {
                                e.currentTarget.src = userImg;
                              }}
                            />
                            <div>
                              <span className="font-bold text-[#111111] block">
                                {custName}
                              </span>
                              <span className="text-[11px] text-[#737373] flex items-center gap-1">
                                <FiMapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[160px]">
                                  {job.serviceAddress || "Address on File"}
                                </span>
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#111111] block">
                            {job.serviceName || profile?.specialization || "Home Service"}
                          </span>
                          <span className="text-[11px] text-[#737373]">
                            {job.timeSlot}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#111111] block">
                            {formatCurrency(Number(job.ticketPrice) || 500)}
                          </span>
                          <StatusBadge type="payment" isPaid={job.isPaid} />
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge type="booking" status={job.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                              title="View Work Order"
                              aria-label="View Work Order"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                            </button>

                            {/* Job Progression Buttons */}
                            {!isCancelled && !isCompleted && (
                              <>
                                {job.status === "pending" && (
                                  <button
                                    onClick={() => handleUpdateStatus(job._id, "approved")}
                                    disabled={updatingId === job._id}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#111111] hover:bg-black text-white transition-colors"
                                  >
                                    Accept
                                  </button>
                                )}
                                {job.status === "approved" && (
                                  <button
                                    onClick={() => handleUpdateStatus(job._id, "in_progress")}
                                    disabled={updatingId === job._id}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#111111] transition-colors"
                                  >
                                    Start
                                  </button>
                                )}
                                {job.status === "in_progress" && (
                                  <button
                                    onClick={() => handleUpdateStatus(job._id, "completed")}
                                    disabled={updatingId === job._id}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white transition-colors"
                                  >
                                    Complete
                                  </button>
                                )}
                              </>
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

        {/* Job Details Modal */}
        <DetailModal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          title={`Work Order #${selectedJob?._id?.slice(-6)?.toUpperCase() || ""}`}
          subtitle={`Client: ${selectedJob?.user?.name || "Customer"}`}
          footer={
            <button
              onClick={() => setSelectedJob(null)}
              className="px-4 py-1.5 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
            >
              Done
            </button>
          }
        >
          {selectedJob && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="text-[#737373] text-[11px] block">Job Status</span>
                  <StatusBadge type="booking" status={selectedJob.status} />
                </div>
                <div className="text-right">
                  <span className="text-[#737373] text-[11px] block">Payment</span>
                  <StatusBadge type="payment" isPaid={selectedJob.isPaid} />
                </div>
              </div>

              {selectedJob.status !== "cancelled" && selectedJob.status !== "completed" && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl">
                  <span className="text-xs font-bold text-[#111111] block mb-2">
                    Update Progress
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedJob.status !== "approved" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedJob._id, "approved")}
                        disabled={updatingId === selectedJob._id}
                        className="px-3 py-1.5 bg-[#111111] text-white rounded-lg font-semibold"
                      >
                        Accept Work Order
                      </button>
                    )}
                    {selectedJob.status !== "in_progress" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedJob._id, "in_progress")}
                        disabled={updatingId === selectedJob._id}
                        className="px-3 py-1.5 bg-white border border-[#E5E5E5] text-[#111111] rounded-lg font-semibold"
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(selectedJob._id, "completed")}
                      disabled={updatingId === selectedJob._id}
                      className="px-3 py-1.5 bg-[#16A34A] text-white rounded-lg font-semibold"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedJob._id, "cancelled")}
                      disabled={updatingId === selectedJob._id}
                      className="px-3 py-1.5 border border-[#DC2626]/40 text-[#DC2626] rounded-lg font-semibold"
                    >
                      Cancel Work Order
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Appointment Date</span>
                  <span className="font-bold text-[#111111]">
                    {formatDate(selectedJob.appointmentDate)}
                  </span>
                </div>
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Time Window</span>
                  <span className="font-bold text-[#111111]">
                    {selectedJob.timeSlot}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block">Destination Address</span>
                <span className="font-medium text-[#111111] block mt-0.5">
                  {selectedJob.serviceAddress || "Address on File"}
                </span>
              </div>

              <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block">Client Contact Info</span>
                <span className="font-bold text-[#111111] block mt-0.5">
                  {selectedJob.user?.name || "Customer"}
                </span>
                <span className="text-[#737373] text-[11px]">
                  {selectedJob.user?.email} {selectedJob.user?.phone ? `• ${selectedJob.user?.phone}` : ""}
                </span>
              </div>

              {selectedJob.customerNotes && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Customer Notes</span>
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

export default ProfessionalJobs;
