import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import userImg from "../../assets/images/avatar-img.png";

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProfessionals, setRecentProfessionals] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [statsRes, bookingsRes, usersRes, profsRes] = await Promise.all([
          fetch(`${baseUrl}/api/v1/admin/dashboard`, { headers }),
          fetch(`${baseUrl}/api/v1/admin/recent-bookings`, { headers }),
          fetch(`${baseUrl}/api/v1/admin/recent-users`, { headers }),
          fetch(`${baseUrl}/api/v1/admin/recent-professionals`, { headers }),
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

        setLoading(false);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Unable to load dashboard data. Please try again.");
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Format currency helper (INR)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="px-5 xl:px-0 py-10 bg-gray-50 min-h-screen">
      <div className="max-w-[1170px] mx-auto space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-4 border-b pb-4">
          <Link
            to="/admin"
            className="py-2 px-5 rounded-md font-semibold text-[15px] text-white bg-primaryColor shadow-sm"
          >
            Dashboard Overview
          </Link>
          <Link
            to="/admin/users"
            className="py-2 px-5 rounded-md font-semibold text-[15px] text-textColor hover:text-headingColor bg-white border"
          >
            User Management
          </Link>
          <Link
            to="/admin/professionals"
            className="py-2 px-5 rounded-md font-semibold text-[15px] text-textColor hover:text-headingColor bg-white border"
          >
            Professional Management
          </Link>
          <Link
            to="/admin/bookings"
            className="py-2 px-5 rounded-md font-semibold text-[15px] text-textColor hover:text-headingColor bg-white border"
          >
            Booking Management
          </Link>
        </div>


        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5">
          <div>
            <h1 className="text-[28px] leading-9 font-bold text-headingColor">
              Admin Portal
            </h1>
            <p className="text-textColor text-[15px] mt-1">
              Platform overview, financial statistics, and system activity
            </p>
          </div>
          <div className="mt-3 md:mt-0">
            <span className="bg-primaryColor text-white text-[13px] font-bold px-4 py-2 rounded-full shadow-sm">
              Live System Analytics
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-10 text-center bg-white rounded-lg shadow-sm border">
            <p className="text-[18px] font-semibold text-primaryColor animate-pulse">
              Loading dashboard statistics...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200 text-center font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Users KPI */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <p className="text-textColor text-[14px] font-medium uppercase tracking-wider">
                  Total Users
                </p>
                <h3 className="text-[32px] font-bold text-headingColor mt-2">
                  {stats.users?.total || 0}
                </h3>
                <p className="text-[12px] text-gray-500 mt-1">Registered Customers</p>
              </div>

              {/* Professionals KPI */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <p className="text-textColor text-[14px] font-medium uppercase tracking-wider">
                  Professionals
                </p>
                <h3 className="text-[32px] font-bold text-headingColor mt-2">
                  {stats.professionals?.total || 0}
                </h3>
                <p className="text-[12px] text-gray-500 mt-1">Service Providers</p>
              </div>

              {/* Bookings KPI */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <p className="text-textColor text-[14px] font-medium uppercase tracking-wider">
                  Total Bookings
                </p>
                <h3 className="text-[32px] font-bold text-headingColor mt-2">
                  {stats.bookings?.total || 0}
                </h3>
                <p className="text-[12px] text-gray-500 mt-1">Platform Appointments</p>
              </div>

              {/* Revenue KPI */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <p className="text-textColor text-[14px] font-medium uppercase tracking-wider">
                  Total Revenue
                </p>
                <h3 className="text-[30px] font-bold text-primaryColor mt-2">
                  {formatCurrency(stats.revenue?.total)}
                </h3>
                <p className="text-[12px] text-gray-500 mt-1">Verified Paid Appointments</p>
              </div>
            </div>

            {/* Booking & Service Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Booking Status breakdown */}
              <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-[18px] font-bold text-headingColor mb-4">
                  Booking Overview
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <span className="text-[13px] font-bold text-yellow-700 block">Pending</span>
                    <span className="text-[24px] font-bold text-yellow-800 mt-1 block">
                      {stats.bookings?.pending || 0}
                    </span>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-[13px] font-bold text-green-700 block">Approved</span>
                    <span className="text-[24px] font-bold text-green-800 mt-1 block">
                      {stats.bookings?.approved || 0}
                    </span>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-[13px] font-bold text-red-700 block">Cancelled</span>
                    <span className="text-[24px] font-bold text-red-800 mt-1 block">
                      {stats.bookings?.cancelled || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Status breakdown */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-[18px] font-bold text-headingColor mb-4">
                  Services Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-textColor font-medium">Total Categories:</span>
                    <span className="font-bold text-headingColor">{stats.services?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-textColor font-medium">Active Services:</span>
                    <span className="font-bold text-green-600">{stats.services?.active || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-textColor font-medium">Inactive Services:</span>
                    <span className="font-bold text-gray-500">{stats.services?.inactive || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-[18px] font-bold text-headingColor mb-4">
                Recent Bookings
              </h3>

              {recentBookings.length === 0 ? (
                <p className="text-textColor text-sm py-4">No bookings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead className="bg-gray-50 text-textColor text-[12px] uppercase font-bold border-b">
                      <tr>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Professional</th>
                        <th className="p-3">Appointment Date</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentBookings.map((b) => (
                        <tr key={b.bookingId} className="hover:bg-gray-50">
                          <td className="p-3 font-medium text-headingColor">
                            {b.user?.name || "Customer unavailable"}
                          </td>
                          <td className="p-3 font-medium text-headingColor">
                            {b.professional?.name ? (
                              <span>
                                {b.professional.name}{" "}
                                <span className="text-[12px] text-textColor font-normal">
                                  ({b.professional.specialization})
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400">Professional unavailable</span>
                            )}
                          </td>
                          <td className="p-3 text-textColor">{formatDate(b.appointmentDate)}</td>
                          <td className="p-3 font-bold text-headingColor">₹{b.ticketPrice || 500}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[12px] font-bold capitalize ${
                                b.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : b.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {b.status || "pending"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[12px] font-bold ${
                                b.isPaid ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {b.isPaid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Grid for Recent Users & Recent Professionals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Customers */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-[18px] font-bold text-headingColor mb-4">
                  Recent Customers
                </h3>
                {recentUsers.length === 0 ? (
                  <p className="text-textColor text-sm py-4">No users yet.</p>
                ) : (
                  <div className="space-y-3 divide-y">
                    {recentUsers.map((u) => (
                      <div key={u._id} className="pt-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-headingColor text-[15px]">{u.name}</p>
                          <p className="text-textColor text-[13px]">{u.email}</p>
                        </div>
                        <span className="text-[12px] text-gray-400">{formatDate(u.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Professionals */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-[18px] font-bold text-headingColor mb-4">
                  Recent Professionals
                </h3>
                {recentProfessionals.length === 0 ? (
                  <p className="text-textColor text-sm py-4">No professionals yet.</p>
                ) : (
                  <div className="space-y-3 divide-y">
                    {recentProfessionals.map((p) => (
                      <div key={p._id} className="pt-3 flex items-center gap-3">
                        <figure className="w-10 h-10 rounded-full overflow-hidden border border-primaryColor flex-shrink-0">
                          <img
                            src={p.photo || userImg}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </figure>
                        <div className="flex-1">
                          <p className="font-semibold text-headingColor text-[15px]">{p.name}</p>
                          <p className="text-textColor text-[13px]">{p.specialization}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-yellow-500 text-[14px] font-bold">★ {p.rating}</span>
                          <p className="text-[11px] text-gray-400">({p.totalRating} reviews)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminDashboard;
