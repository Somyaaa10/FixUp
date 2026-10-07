import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const AdminBookings = () => {
  const { user: currentUser, token } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filters state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "pending", "approved", "cancelled"
  const [paymentFilter, setPaymentFilter] = useState(""); // "", "paid", "unpaid"
  const [dateFilter, setDateFilter] = useState(""); // "YYYY-MM-DD"

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState(""); // "approved" or "cancelled"
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${baseUrl}/api/v1/admin/bookings?page=${page}&limit=10`;
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
      setPagination(
        data.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
      );
      setLoading(false);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError("Unable to load bookings. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token, page, statusFilter, paymentFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPaymentFilter("");
    setDateFilter("");
    setPage(1);
  };

  const openViewModal = async (booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);

    // Fetch complete details if needed
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
      const res = await fetch(
        `${baseUrl}/api/v1/admin/bookings/${booking._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setSelectedBooking(data.data);
      }
    } catch (err) {
      console.error("Fetch booking detail error:", err);
    }
  };

  const openStatusModal = (booking, status) => {
    setSelectedBooking(booking);
    setTargetStatus(status);
    setActionFeedback("");
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedBooking || !targetStatus) return;

    setActionLoading(true);
    setActionFeedback("");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";

    try {
      const res = await fetch(
        `${baseUrl}/api/v1/admin/bookings/${selectedBooking._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: targetStatus }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      setActionFeedback(
        data.message || `Booking status updated to ${targetStatus} successfully`
      );
      setTimeout(() => {
        setShowStatusModal(false);
        setSelectedBooking(null);
        setTargetStatus("");
        fetchBookings();
      }, 1200);
    } catch (err) {
      setActionFeedback(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "N/A"
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const activeFilters =
    search.trim() || statusFilter || paymentFilter || dateFilter;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-lg p-2 shadow-sm">
          <Link
            to="/admin"
            className="px-6 py-3 font-semibold text-gray-600 hover:text-blue-600 rounded-md transition-all"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/users"
            className="px-6 py-3 font-semibold text-gray-600 hover:text-blue-600 rounded-md transition-all"
          >
            Users
          </Link>
          <Link
            to="/admin/professionals"
            className="px-6 py-3 font-semibold text-gray-600 hover:text-blue-600 rounded-md transition-all"
          >
            Professionals
          </Link>
          <Link
            to="/admin/bookings"
            className="px-6 py-3 font-semibold text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-md transition-all"
          >
            Bookings
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Booking Management
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor, view, approve, and cancel FixUp service bookings across the platform
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by booking ID, customer, professional..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  🔍
                </span>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition"
              >
                Search
              </button>
            </form>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Payment Filter */}
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payment</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {activeFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg border border-red-200 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchBookings}
              className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p>Loading bookings dataset...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-lg font-bold text-gray-800">
                No Bookings Found
              </h3>
              <p className="text-sm mt-1">
                {activeFilters
                  ? "No bookings match your current filter criteria."
                  : "No service bookings exist in the database yet."}
              </p>
              {activeFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-100 transition"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Professional
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Appointment Date
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Ticket Price
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => {
                    const isPending = booking.status === "pending";
                    const isApproved = booking.status === "approved";
                    const isCancelled = booking.status === "cancelled";

                    return (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-50/80 transition"
                      >
                        {/* Booking ID */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-600">
                          #{booking._id.slice(-8)}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={
                                booking.user?.photo ||
                                "https://via.placeholder.com/150"
                              }
                              alt={booking.user?.name || "Customer"}
                              className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-200"
                            />
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {booking.user?.name || "Unknown User"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {booking.user?.email || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Professional */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={
                                booking.professional?.photo ||
                                "https://via.placeholder.com/150"
                              }
                              alt={booking.professional?.name || "Pro"}
                              className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-200"
                            />
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {booking.professional?.name || "Unassigned"}
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                {booking.professional?.specialization || "General"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Appointment Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(booking.appointmentDate)}
                        </td>

                        {/* Ticket Price */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{booking.ticketPrice || 500}
                        </td>

                        {/* Payment */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.isPaid ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                              Unpaid
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isApproved && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              Approved
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openViewModal(booking)}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-semibold transition"
                          >
                            View
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() =>
                                  openStatusModal(booking, "approved")
                                }
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  openStatusModal(booking, "cancelled")
                                }
                                className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && bookings.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{(page - 1) * 10 + 1}</span> to{" "}
                <span className="font-semibold">
                  {Math.min(page * 10, pagination.total)}
                </span>{" "}
                of <span className="font-semibold">{pagination.total}</span> bookings
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 font-medium px-2">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, pagination.pages))
                  }
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedBooking(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
              Booking Details
            </h2>

            <div className="space-y-6 text-sm text-gray-700">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                  👤 Customer Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block text-xs">Name:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedBooking.user?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Email:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedBooking.user?.email || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Phone:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedBooking.user?.phone || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 text-base mb-3 flex items-center gap-2">
                  🛠️ Professional Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block text-xs">Name:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedBooking.professional?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">
                      Specialization:
                    </span>
                    <span className="font-semibold text-blue-700">
                      {selectedBooking.professional?.specialization || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Email:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedBooking.professional?.email || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
                  📅 Appointment & Pricing
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block text-xs">
                      Booking ID:
                    </span>
                    <span className="font-mono text-xs text-gray-800">
                      {selectedBooking._id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">
                      Appointment Date:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatDate(selectedBooking.appointmentDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">
                      Ticket Price:
                    </span>
                    <span className="font-bold text-emerald-700">
                      ₹{selectedBooking.ticketPrice || 500}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Status:</span>
                    <span className="font-semibold capitalize text-gray-800">
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">
                      Created At:
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDate(selectedBooking.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                <h3 className="font-bold text-emerald-900 text-base mb-3 flex items-center gap-2">
                  💳 Payment Verification
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block text-xs">
                      Payment Status:
                    </span>
                    <span className="font-bold text-emerald-700">
                      {selectedBooking.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBooking(null);
                }}
                className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CONFIRMATION MODAL */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Status Change
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to change the status of booking{" "}
              <span className="font-mono font-semibold">
                #{selectedBooking._id.slice(-8)}
              </span>{" "}
              to{" "}
              <span className="font-bold capitalize text-blue-600">
                {targetStatus}
              </span>
              ?
            </p>

            {actionFeedback && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 ${
                  actionFeedback.toLowerCase().includes("fail") ||
                  actionFeedback.toLowerCase().includes("cannot")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {actionFeedback}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                disabled={actionLoading}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedBooking(null);
                  setTargetStatus("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 text-white font-semibold text-sm rounded-lg transition ${
                  targetStatus === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading
                  ? "Updating..."
                  : `Confirm ${targetStatus === "approved" ? "Approval" : "Cancellation"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
