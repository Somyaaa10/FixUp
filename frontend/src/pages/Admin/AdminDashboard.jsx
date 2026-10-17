import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import AdminLayout from "./AdminLayout";
import StatCard from "../../components/Dashboard/StatCard";
import StatusBadge from "../../components/Dashboard/StatusBadge";
import ErrorState from "../../components/Dashboard/ErrorState";
import LoadingSkeleton from "../../components/Dashboard/LoadingSkeleton";
import userImg from "../../assets/images/avatar-img.png";
import {
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiTool,
  FiEye,
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

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProfessionals, setRecentProfessionals] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, bookingsRes, usersRes, profsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/admin/dashboard`, { headers }),
        fetch(`${BASE_URL}/api/v1/admin/recent-bookings`, { headers }),
        fetch(`${BASE_URL}/api/v1/admin/recent-users`, { headers }),
        fetch(`${BASE_URL}/api/v1/admin/recent-professionals`, { headers }),
      ]);

      const [statsData, bookingsData, usersData, profsData] = await Promise.all([
        statsRes.json(),
        bookingsRes.json(),
        usersRes.json(),
        profsRes.json(),
      ]);

      if (!statsRes.ok || !statsData.success) {
        throw new Error(statsData.message || "Failed to load dashboard statistics");
      }

      setStats(statsData.data);
      if (bookingsData.success) setRecentBookings(bookingsData.data || []);
      if (usersData.success) setRecentUsers(usersData.data || []);
      if (profsData.success) setRecentProfessionals(profsData.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  return (
    <AdminLayout
      title="Platform Operations Overview"
      subtitle="Real-time key performance indicators, user registrations, and platform metrics"
    >
      <div className="space-y-6">
        {error && (
          <ErrorState
            title="Failed to retrieve overview"
            message={error}
            onRetry={fetchDashboardData}
          />
        )}

        {/* ========================================================
            SUPPORTED PLATFORM METRICS (KPI Cards)
            Strictly derived from actual stored database records.
            ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Users"
            value={loading ? "..." : stats?.users?.total ?? 0}
            subtitle="Registered platform customers"
            icon={FiUsers}
          />

          <StatCard
            title="Total Professionals"
            value={loading ? "..." : stats?.professionals?.total ?? 0}
            subtitle={
              stats?.professionals?.pending > 0
                ? `${stats.professionals.pending} pending verification`
                : "All registered specialists"
            }
            icon={FiBriefcase}
            badgeText={
              stats?.professionals?.pending > 0
                ? `${stats.professionals.pending} Pending`
                : null
            }
            badgeType={stats?.professionals?.pending > 0 ? "warning" : "neutral"}
          />

          <StatCard
            title="Pending Approvals"
            value={loading ? "..." : stats?.professionals?.pending ?? 0}
            subtitle="Specialists awaiting audit"
            icon={FiClock}
            badgeText={stats?.professionals?.pending > 0 ? "Action Required" : "Cleared"}
            badgeType={stats?.professionals?.pending > 0 ? "warning" : "success"}
          />

          <StatCard
            title="Total Bookings"
            value={loading ? "..." : stats?.bookings?.total ?? 0}
            subtitle={`${stats?.bookings?.pending ?? 0} pending, ${stats?.bookings?.approved ?? 0} confirmed`}
            icon={FiCalendar}
          />

          <StatCard
            title="Completed Bookings"
            value={loading ? "..." : stats?.bookings?.completed ?? 0}
            subtitle="Successfully fulfilled service appointments"
            icon={FiCheckCircle}
            badgeText="Fulfilled"
            badgeType="success"
          />

          <StatCard
            title="Verified Platform Revenue"
            value={loading ? "..." : formatCurrency(stats?.revenue?.total ?? 0)}
            subtitle="Total value of online verified paid bookings"
            icon={FiCreditCard}
          />
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/users"
            className="p-3 bg-white border border-[#E5E5E5] hover:border-[#111111] rounded-xl flex items-center justify-between transition-colors"
          >
            <span className="text-xs font-semibold text-[#111111]">Users</span>
            <FiArrowRight className="w-3.5 h-3.5 text-[#737373]" />
          </Link>
          <Link
            to="/admin/professionals"
            className="p-3 bg-white border border-[#E5E5E5] hover:border-[#111111] rounded-xl flex items-center justify-between transition-colors"
          >
            <span className="text-xs font-semibold text-[#111111]">Professionals</span>
            <FiArrowRight className="w-3.5 h-3.5 text-[#737373]" />
          </Link>
          <Link
            to="/admin/bookings"
            className="p-3 bg-white border border-[#E5E5E5] hover:border-[#111111] rounded-xl flex items-center justify-between transition-colors"
          >
            <span className="text-xs font-semibold text-[#111111]">Bookings</span>
            <FiArrowRight className="w-3.5 h-3.5 text-[#737373]" />
          </Link>
          <Link
            to="/admin/contact-messages"
            className="p-3 bg-white border border-[#E5E5E5] hover:border-[#111111] rounded-xl flex items-center justify-between transition-colors"
          >
            <span className="text-xs font-semibold text-[#111111]">Inquiries</span>
            <FiArrowRight className="w-3.5 h-3.5 text-[#737373]" />
          </Link>
        </div>

        {/* Recent Platform Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Bookings Table */}
          <div className="lg:col-span-8 bg-white border border-[#E5E5E5] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Recent Bookings</h3>
                <p className="text-xs text-[#737373]">Latest 10 orders placed across FixUp</p>
              </div>
              <Link
                to="/admin/bookings"
                className="text-xs font-semibold text-[#111111] hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <LoadingSkeleton type="table" count={4} />
            ) : recentBookings.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#737373]">
                No recent bookings recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F5F5] text-[#525252] font-semibold text-[11px] uppercase tracking-wider border-b border-[#E5E5E5]">
                    <tr>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Professional</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {recentBookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-[#F5F5F5] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#111111] block">
                            {b.user?.name || "Customer"}
                          </span>
                          <span className="text-[11px] text-[#737373]">
                            {b.user?.email || "No email"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#111111] block">
                            {b.professional?.name || "Professional"}
                          </span>
                          <span className="text-[11px] text-[#737373]">
                            {b.professional?.specialization || "Specialist"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#111111]">
                          {formatDate(b.appointmentDate)}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#111111]">
                          {formatCurrency(Number(b.ticketPrice) || 500)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge type="booking" status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Registrations Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Recent Users */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  New Customers
                </h4>
                <Link to="/admin/users" className="text-[11px] font-semibold text-[#111111] hover:underline">
                  View All
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-9 bg-[#F5F5F5] rounded" />
                  <div className="h-9 bg-[#F5F5F5] rounded" />
                </div>
              ) : recentUsers.length === 0 ? (
                <p className="text-xs text-[#737373]">No users registered recently.</p>
              ) : (
                <div className="divide-y divide-[#E5E5E5]">
                  {recentUsers.slice(0, 4).map((u) => (
                    <div key={u._id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold text-[#111111] block truncate">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-[#737373] block truncate">
                          {u.email}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#737373] shrink-0 font-medium">
                        {formatDate(u.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Professionals */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  New Professionals
                </h4>
                <Link to="/admin/professionals" className="text-[11px] font-semibold text-[#111111] hover:underline">
                  View All
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-9 bg-[#F5F5F5] rounded" />
                  <div className="h-9 bg-[#F5F5F5] rounded" />
                </div>
              ) : recentProfessionals.length === 0 ? (
                <p className="text-xs text-[#737373]">No professionals registered recently.</p>
              ) : (
                <div className="divide-y divide-[#E5E5E5]">
                  {recentProfessionals.slice(0, 4).map((p) => (
                    <div key={p._id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold text-[#111111] block truncate">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-[#737373] block truncate">
                          {p.specialization}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#737373] shrink-0 font-medium">
                        {formatDate(p.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
