import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import AdminLayout from "./AdminLayout";
import StatusBadge from "../../components/Dashboard/StatusBadge";
import SearchToolbar from "../../components/Dashboard/SearchToolbar";
import Pagination from "../../components/Dashboard/Pagination";
import EmptyState from "../../components/Dashboard/EmptyState";
import ErrorState from "../../components/Dashboard/ErrorState";
import LoadingSkeleton from "../../components/Dashboard/LoadingSkeleton";
import ConfirmModal from "../../components/Dashboard/ConfirmModal";
import DetailModal from "../../components/Dashboard/DetailModal";
import userImg from "../../assets/images/avatar-img.png";
import {
  FiCalendar,
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiDollarSign,
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

const AdminBookings = () => {
  const { token } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "pending", "approved", "cancelled"
  const [paymentFilter, setPaymentFilter] = useState(""); // "", "paid", "unpaid"
  const [dateFilter, setDateFilter] = useState("");

  // Modals & Action States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState(null); // { booking, status }
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 4000);
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${BASE_URL}/api/v1/admin/bookings?page=${page}&limit=10`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (paymentFilter) url += `&paymentStatus=${paymentFilter}`;
    if (dateFilter) url += `&date=${dateFilter}`;

    try {
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch bookings");
      }

      setBookings(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError(err.message || "Unable to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token, page, statusFilter, paymentFilter, dateFilter]);

  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateTarget) return;
    setActionLoading(true);

    try {
      const { booking, status } = statusUpdateTarget;
      const res = await fetch(`${BASE_URL}/api/v1/admin/bookings/${booking._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update booking status");
      }

      showToast("success", `Booking #${booking._id.slice(-6).toUpperCase()} marked ${status}`);
      setStatusUpdateTarget(null);
      if (selectedBooking && selectedBooking._id === booking._id) {
        setSelectedBooking((prev) => ({ ...prev, status }));
      }
      fetchBookings();
    } catch (err) {
      showToast("error", err.message || "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Booking Operations"
      subtitle="Monitor customer appointments, service scheduling, and fulfillment statuses across all trades"
    >
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

        {/* Search & Filter Toolbar */}
        <div className="space-y-3">
          <SearchToolbar
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={() => {
              setPage(1);
              fetchBookings();
            }}
            placeholder="Search bookings by customer, specialist or ID..."
            filters={[
              { label: "All Bookings", value: "" },
              { label: "Pending", value: "pending" },
              { label: "Confirmed", value: "approved" },
              { label: "Cancelled", value: "cancelled" },
            ]}
            activeFilter={statusFilter}
            onFilterChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />

          {/* Secondary Payment & Date Filter Bar */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap text-xs text-[#525252]">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#111111]">Payment Filter:</span>
              <button
                onClick={() => {
                  setPaymentFilter("");
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  paymentFilter === ""
                    ? "bg-[#111111] text-white font-semibold"
                    : "hover:bg-[#F5F5F5] text-[#525252]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setPaymentFilter("paid");
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  paymentFilter === "paid"
                    ? "bg-[#16A34A] text-white font-semibold"
                    : "hover:bg-[#F5F5F5] text-[#525252]"
                }`}
              >
                Paid Online
              </button>
              <button
                onClick={() => {
                  setPaymentFilter("unpaid");
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  paymentFilter === "unpaid"
                    ? "bg-[#D97706] text-white font-semibold"
                    : "hover:bg-[#F5F5F5] text-[#525252]"
                }`}
              >
                Unpaid / COD
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111111]">Filter by Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 bg-[#F5F5F5] border border-[#E5E5E5] rounded-md text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              />
              {dateFilter && (
                <button
                  onClick={() => {
                    setDateFilter("");
                    setPage(1);
                  }}
                  className="text-xs text-[#737373] hover:text-[#111111] underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {loading && <LoadingSkeleton type="table" count={5} />}

        {!loading && error && (
          <ErrorState
            title="Failed to retrieve bookings"
            message={error}
            onRetry={fetchBookings}
          />
        )}

        {!loading && !error && bookings.length === 0 && (
          <EmptyState
            icon={FiCalendar}
            title="No bookings found"
            description={
              search || statusFilter || paymentFilter || dateFilter
                ? "No service appointments matched your active filter criteria."
                : "No customer bookings have been placed on FixUp yet."
            }
            actionLabel={
              search || statusFilter || paymentFilter || dateFilter
                ? "Clear All Filters"
                : null
            }
            onAction={() => {
              setSearch("");
              setStatusFilter("");
              setPaymentFilter("");
              setDateFilter("");
              setPage(1);
            }}
          />
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Order ID & Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Professional</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {bookings.map((b) => {
                      const isCancelled = b.status?.toLowerCase() === "cancelled";
                      const isApproved = b.status?.toLowerCase() === "approved";

                      return (
                        <tr key={b._id} className="hover:bg-[#F5F5F5] transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#111111] block">
                              #{b._id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[11px] text-[#737373]">
                              {formatDate(b.appointmentDate)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#111111] block">
                              {b.user?.name || "Customer"}
                            </span>
                            <span className="text-[11px] text-[#737373] block truncate max-w-[140px]">
                              {b.user?.email || "—"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#111111] block">
                              {b.professional?.name || "Professional"}
                            </span>
                            <span className="text-[11px] text-[#737373] block">
                              {b.professional?.specialization || "Specialist"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#111111]">
                            {formatCurrency(Number(b.ticketPrice) || 500)}
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge type="payment" isPaid={b.isPaid} />
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge type="booking" status={b.status} />
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedBooking(b)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title="View Details"
                                aria-label="View Details"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                              </button>

                              {!isApproved && !isCancelled && (
                                <button
                                  onClick={() =>
                                    setStatusUpdateTarget({ booking: b, status: "approved" })
                                  }
                                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#111111] hover:bg-black text-white transition-colors"
                                  title="Approve Booking"
                                >
                                  Approve
                                </button>
                              )}

                              {!isCancelled && (
                                <button
                                  onClick={() =>
                                    setStatusUpdateTarget({ booking: b, status: "cancelled" })
                                  }
                                  className="px-2 py-1 text-xs font-semibold rounded-lg border border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
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

            <Pagination
              page={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}

        {/* View Details Modal */}
        <DetailModal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details #${selectedBooking?._id?.slice(-6)?.toUpperCase() || ""}`}
          subtitle={`Placed on ${formatDate(selectedBooking?.createdAt)}`}
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
                  <span className="text-[#737373] text-[11px] block">Status</span>
                  <StatusBadge type="booking" status={selectedBooking.status} />
                </div>
                <div className="text-right">
                  <span className="text-[#737373] text-[11px] block">Payment</span>
                  <StatusBadge type="payment" isPaid={selectedBooking.isPaid} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Customer</span>
                  <span className="font-bold text-[#111111] block mt-0.5">
                    {selectedBooking.user?.name || "Customer"}
                  </span>
                  <span className="text-[#737373] text-[11px] block">
                    {selectedBooking.user?.email}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Assigned Specialist</span>
                  <span className="font-bold text-[#111111] block mt-0.5">
                    {selectedBooking.professional?.name || "Specialist"}
                  </span>
                  <span className="text-[#737373] text-[11px] block">
                    {selectedBooking.professional?.specialization}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Appointment Date</span>
                  <span className="font-bold text-[#111111]">
                    {formatDate(selectedBooking.appointmentDate)}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Time Window</span>
                  <span className="font-bold text-[#111111]">
                    {selectedBooking.timeSlot}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block">Service Location</span>
                <span className="font-medium text-[#111111] block mt-0.5">
                  {selectedBooking.serviceAddress || "Address on File"}
                </span>
              </div>

              {selectedBooking.customerNotes && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Special Instructions</span>
                  <p className="text-[#111111] mt-0.5">{selectedBooking.customerNotes}</p>
                </div>
              )}

              {selectedBooking.razorpayPaymentId && (
                <div className="p-3 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5] text-[11px] text-[#737373] space-y-1">
                  <div>Gateway Payment ID: <span className="font-mono text-[#111111]">{selectedBooking.razorpayPaymentId}</span></div>
                  {selectedBooking.razorpayOrderId && (
                    <div>Gateway Order ID: <span className="font-mono text-[#111111]">{selectedBooking.razorpayOrderId}</span></div>
                  )}
                </div>
              )}
            </div>
          )}
        </DetailModal>

        {/* Status Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(statusUpdateTarget)}
          title={`Update Booking Status to ${statusUpdateTarget?.status?.toUpperCase()}`}
          message={
            statusUpdateTarget?.status === "cancelled"
              ? "Are you sure you want to cancel this booking? If this booking was paid online, cancellation does NOT trigger an automatic refund. FixUp administrators must handle refunds through authorized offline channels."
              : `Confirm status transition to ${statusUpdateTarget?.status}?`
          }
          confirmLabel={`Mark ${statusUpdateTarget?.status}`}
          isDanger={statusUpdateTarget?.status === "cancelled"}
          loading={actionLoading}
          onConfirm={handleConfirmStatusUpdate}
          onCancel={() => setStatusUpdateTarget(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
