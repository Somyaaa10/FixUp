import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import userImg from "../../assets/images/avatar-img.png";

const AdminProfessionals = () => {
  const { token } = useContext(AuthContext);

  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search/Filter state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" (All), "active", "inactive"

  // Modal states
  const [selectedProf, setSelectedProf] = useState(null);
  const [profDetails, setProfDetails] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialization: "Electrician",
    ticketPrice: 500,
    photo: "",
    bio: "",
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const fetchProfessionals = async () => {
    setLoading(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${baseUrl}/api/v1/admin/professionals?page=${page}&limit=10`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    try {
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch professionals");
      }

      setProfessionals(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      setLoading(false);
    } catch (err) {
      console.error("Fetch professionals error:", err);
      setError("Unable to load professionals. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfessionals();
    }
  }, [token, page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProfessionals();
  };

  // Fetch detailed info including booking stats for view modal
  const handleOpenViewModal = async (prof) => {
    setSelectedProf(prof);
    setProfDetails(null);
    setShowViewModal(true);
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";

    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/professionals/${prof._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfDetails(data.data);
      }
    } catch (err) {
      console.error("Fetch professional details error:", err);
    }
  };

  const handleOpenEditModal = (prof) => {
    setSelectedProf(prof);
    setFormData({
      name: prof.name || "",
      email: prof.email || "",
      specialization: prof.specialization || "Electrician",
      ticketPrice: prof.ticketPrice || 500,
      photo: prof.photo || "",
      bio: prof.bio || "",
    });
    setActionFeedback("");
    setShowEditModal(true);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      email: "",
      specialization: "Electrician",
      ticketPrice: 500,
      photo: "",
      bio: "",
    });
    setActionFeedback("");
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionFeedback("");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";

    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/professionals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create professional");
      }

      setShowAddModal(false);
      fetchProfessionals();
    } catch (err) {
      setActionFeedback(err.message || "Error creating professional");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProf) return;
    setActionLoading(true);
    setActionFeedback("");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";

    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/professionals/${selectedProf._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update professional");
      }

      setShowEditModal(false);
      setSelectedProf(null);
      fetchProfessionals();
    } catch (err) {
      setActionFeedback(err.message || "Error updating professional");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedProf) return;
    setActionLoading(true);
    setActionFeedback("");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
    const newStatus = selectedProf.isActive === false ? true : false;

    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/professionals/${selectedProf._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      setShowStatusModal(false);
      setSelectedProf(null);
      fetchProfessionals();
    } catch (err) {
      setActionFeedback(err.message || "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProfessional = async () => {
    if (!selectedProf) return;
    setActionLoading(true);
    setActionFeedback("");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";

    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/professionals/${selectedProf._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete professional");
      }

      setShowDeleteModal(false);
      setSelectedProf(null);
      fetchProfessionals();
    } catch (err) {
      setActionFeedback(err.message || "Error deleting professional");
    } finally {
      setActionLoading(false);
    }
  };

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
            className="py-2 px-5 rounded-md font-semibold text-[15px] text-textColor hover:text-headingColor bg-white border"
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
            className="py-2 px-5 rounded-md font-semibold text-[15px] text-white bg-primaryColor shadow-sm"
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


        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] leading-9 font-bold text-headingColor">
              Professional Management
            </h1>
            <p className="text-textColor text-[15px] mt-1">
              Manage FixUp service professionals, prices, profiles, and account status.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-primaryColor text-white px-5 py-2.5 rounded-lg font-bold text-[14px] shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2 self-start md:self-auto"
          >
            + Add Professional
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Search by name, email, specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-[400px] px-4 py-2 border rounded-md focus:outline-none focus:border-primaryColor text-[14px]"
            />
            <button
              type="submit"
              className="bg-primaryColor text-white px-4 py-2 rounded-md font-semibold text-[14px] hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <span className="text-[14px] text-textColor font-medium">Status:</span>
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-[13px] font-bold ${
                statusFilter === "" ? "bg-primaryColor text-white" : "bg-gray-100 text-textColor hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setStatusFilter("active"); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-[13px] font-bold ${
                statusFilter === "active" ? "bg-green-600 text-white" : "bg-gray-100 text-textColor hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => { setStatusFilter("inactive"); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-[13px] font-bold ${
                statusFilter === "inactive" ? "bg-red-600 text-white" : "bg-gray-100 text-textColor hover:bg-gray-200"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-10 text-center bg-white rounded-xl shadow-sm border">
            <p className="text-[16px] font-semibold text-primaryColor animate-pulse">
              Loading professionals...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center font-semibold">
            {error}
          </div>
        )}

        {/* Professionals Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {professionals.length === 0 ? (
              <div className="p-10 text-center text-textColor font-semibold">
                No professionals found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-gray-50 text-textColor text-[12px] uppercase font-bold border-b">
                    <tr>
                      <th className="p-4">Photo</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Specialization</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {professionals.map((p) => {
                      const isActive = p.isActive !== false;
                      const rating = p.averageRating || p.avgRating || 4.8;

                      return (
                        <tr key={p._id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <figure className="w-10 h-10 rounded-full overflow-hidden border border-primaryColor">
                              <img
                                src={p.photo || userImg}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </figure>
                          </td>
                          <td className="p-4 font-semibold text-headingColor">{p.name}</td>
                          <td className="p-4">
                            <span className="bg-[#CCF0F3] text-irisBlueColor px-2.5 py-1 rounded text-[12px] font-bold">
                              {p.specialization}
                            </span>
                          </td>
                          <td className="p-4 text-textColor">{p.email}</td>
                          <td className="p-4 font-bold text-headingColor">₹{p.ticketPrice || 500}</td>
                          <td className="p-4 font-bold text-yellow-500">★ {rating}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${
                                isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenViewModal(p)}
                              className="px-3 py-1 bg-gray-100 text-headingColor rounded text-[12px] font-semibold hover:bg-gray-200"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-[12px] font-semibold hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setSelectedProf(p); setActionFeedback(""); setShowStatusModal(true); }}
                              className={`px-3 py-1 rounded text-[12px] font-semibold ${
                                isActive
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                              }`}
                            >
                              {isActive ? "Disable" : "Activate"}
                            </button>
                            <button
                              onClick={() => { setSelectedProf(p); setActionFeedback(""); setShowDeleteModal(true); }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-[12px] font-semibold hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                <span className="text-[13px] text-textColor font-medium">
                  Showing Page {pagination.page} of {pagination.pages} ({pagination.total} Total Professionals)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded bg-white border text-[13px] font-bold disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 text-[13px] font-bold">{page}</span>
                  <button
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                    className="px-3 py-1.5 rounded bg-white border text-[13px] font-bold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal 1: View Professional Details */}
        {showViewModal && selectedProf && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[550px] w-full p-6 space-y-4 shadow-xl border">
              <div className="flex items-center gap-4 border-b pb-3">
                <figure className="w-16 h-16 rounded-full overflow-hidden border border-primaryColor">
                  <img src={selectedProf.photo || userImg} alt={selectedProf.name} className="w-full h-full object-cover" />
                </figure>
                <div>
                  <h3 className="text-[20px] font-bold text-headingColor">{selectedProf.name}</h3>
                  <span className="bg-[#CCF0F3] text-irisBlueColor px-2.5 py-0.5 rounded text-[12px] font-bold">
                    {selectedProf.specialization}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-[14px]">
                <p><strong>Email:</strong> {selectedProf.email}</p>
                <p><strong>Ticket Price:</strong> ₹{selectedProf.ticketPrice || 500} INR</p>
                <p><strong>Rating:</strong> ★ {selectedProf.averageRating || selectedProf.avgRating || 4.8} ({selectedProf.totalRating || 0} reviews)</p>
                <p><strong>Account Status:</strong> {selectedProf.isActive !== false ? "Active" : "Inactive"}</p>
                <p><strong>Joined Date:</strong> {formatDate(selectedProf.createdAt)}</p>
                {selectedProf.bio && <p><strong>Bio:</strong> {selectedProf.bio}</p>}
              </div>

              {/* Statistics Section */}
              {profDetails?.statistics && (
                <div className="bg-gray-50 p-4 rounded-lg border space-y-1 text-[13px]">
                  <p className="font-bold text-headingColor mb-2">Booking Performance Stats:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <p>Total Bookings: <strong>{profDetails.statistics.totalBookings}</strong></p>
                    <p>Approved: <strong className="text-green-600">{profDetails.statistics.approvedBookings}</strong></p>
                    <p>Pending: <strong className="text-yellow-600">{profDetails.statistics.pendingBookings}</strong></p>
                    <p>Cancelled: <strong className="text-red-600">{profDetails.statistics.cancelledBookings}</strong></p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t text-right">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2 bg-primaryColor text-white font-semibold rounded-md text-[14px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Add Professional */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[500px] w-full p-6 space-y-4 shadow-xl border">
              <h3 className="text-[20px] font-bold text-headingColor border-b pb-2">
                Add New Professional
              </h3>

              {actionFeedback && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-semibold">
                  {actionFeedback}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-3 text-[14px]">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Specialization *</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Driver">Driver</option>
                    <option value="Painter">Painter</option>
                    <option value="House Cleaning">House Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ticket Price (₹ INR)</label>
                  <input
                    type="number"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Photo Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bio</label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-100 text-headingColor font-semibold rounded-md text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-primaryColor text-white font-semibold rounded-md text-[13px] hover:bg-blue-700"
                  >
                    {actionLoading ? "Creating..." : "Save Professional"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Edit Professional */}
        {showEditModal && selectedProf && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[500px] w-full p-6 space-y-4 shadow-xl border">
              <h3 className="text-[20px] font-bold text-headingColor border-b pb-2">
                Edit Professional
              </h3>

              {actionFeedback && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-semibold">
                  {actionFeedback}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-3 text-[14px]">
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Specialization</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Driver">Driver</option>
                    <option value="Painter">Painter</option>
                    <option value="House Cleaning">House Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ticket Price (₹ INR)</label>
                  <input
                    type="number"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Photo Image URL</label>
                  <input
                    type="text"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bio</label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-100 text-headingColor font-semibold rounded-md text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-primaryColor text-white font-semibold rounded-md text-[13px] hover:bg-blue-700"
                  >
                    {actionLoading ? "Updating..." : "Update Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Toggle Status Confirmation */}
        {showStatusModal && selectedProf && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[450px] w-full p-6 space-y-4 shadow-xl border">
              <h3 className="text-[18px] font-bold text-headingColor">
                Confirm Status Change
              </h3>
              <p className="text-[14px] text-textColor">
                Are you sure you want to{" "}
                <strong className="text-headingColor">
                  {selectedProf.isActive !== false ? "deactivate" : "activate"}
                </strong>{" "}
                the account for <strong className="text-headingColor">{selectedProf.name}</strong>?
              </p>

              {actionFeedback && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-semibold">
                  {actionFeedback}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  disabled={actionLoading}
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-gray-100 text-headingColor font-semibold rounded-md text-[13px]"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 text-white font-semibold rounded-md text-[13px] ${
                    selectedProf.isActive !== false ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {actionLoading ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 5: Delete Confirmation */}
        {showDeleteModal && selectedProf && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[450px] w-full p-6 space-y-4 shadow-xl border">
              <h3 className="text-[18px] font-bold text-red-600">
                Confirm Deletion
              </h3>
              <p className="text-[14px] text-textColor">
                Are you sure you want to delete professional <strong className="text-headingColor">{selectedProf.name}</strong>?
              </p>

              {actionFeedback && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-semibold">
                  {actionFeedback}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  disabled={actionLoading}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-headingColor font-semibold rounded-md text-[13px]"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleDeleteProfessional}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md text-[13px] hover:bg-red-700"
                >
                  {actionLoading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminProfessionals;
