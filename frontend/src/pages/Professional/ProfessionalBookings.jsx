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
  FiCalendar,
  FiEye,
  FiClock,
  FiMapPin,
  FiUser,
  FiCreditCard,
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

const ProfessionalBookings = () => {
  const { token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
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
        throw new Error(data.message || "Failed to load bookings");
      }
      setProfile(data.data);
      setAppointments(data.data?.appointments || []);
    } catch (err) {
      setError(err.message || "Unable to retrieve booking history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  const filtered = appointments.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const cName = (b.user?.name || "").toLowerCase();
    const sName = (b.serviceName || "").toLowerCase();
    const id = String(b._id || "").toLowerCase();
    return cName.includes(q) || sName.includes(q) || id.includes(q);
  });

  return (
    <ProfessionalLayout profileData={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md inline-block mb-1.5">
              Service Records
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
              Booking History & Archival
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-0.5">
              Historical ledger of all service engagements and receipts ({appointments.length} total)
            </p>
          </div>

          <Link
            to="/professional/jobs"
            className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Active Work Orders</span>
          </Link>
        </div>

        {/* Search */}
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search booking history by customer, service or ID..."
        />

        {loading && <LoadingSkeleton type="table" count={5} />}

        {!loading && error && (
          <ErrorState title="Failed to load booking history" message={error} onRetry={fetchBookings} />
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={FiCalendar}
            title="No booking history found"
            description={
              search
                ? `No booking records matched "${search}".`
                : "No customer service bookings have been recorded yet."
            }
            actionLabel={search ? "Clear Search" : null}
            onAction={() => setSearch("")}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Job Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-[#F5F5F5] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                        #{b._id.slice(-6).toUpperCase()}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#111111]">
                        {b.user?.name || "Customer"}
                      </td>

                      <td className="py-3.5 px-4 text-[#111111]">
                        <span className="font-medium block">{formatDate(b.appointmentDate)}</span>
                        <span className="text-[11px] text-[#737373]">{b.timeSlot}</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#111111]">
                        {formatCurrency(Number(b.ticketPrice) || 500)}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge type="booking" status={b.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge type="payment" isPaid={b.isPaid} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        <DetailModal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Archive #${selectedBooking?._id?.slice(-6)?.toUpperCase() || ""}`}
          subtitle={`Client: ${selectedBooking?.user?.name || "Customer"}`}
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
                  <span className="text-[#737373] text-[11px] block">Date</span>
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

              <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block">Customer Contact</span>
                <span className="font-bold text-[#111111] block mt-0.5">
                  {selectedBooking.user?.name || "Customer"}
                </span>
                <span className="text-[#737373] text-[11px]">
                  {selectedBooking.user?.email} {selectedBooking.user?.phone ? `• ${selectedBooking.user?.phone}` : ""}
                </span>
              </div>

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
      </div>
    </ProfessionalLayout>
  );
};

export default ProfessionalBookings;
