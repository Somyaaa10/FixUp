import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const AdminUsers = () => {
  const { user: currentUser, token } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search/Filter state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" (All), "active", "inactive"

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${baseUrl}/api/v1/admin/users?page=${page}&limit=10`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    try {
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      setLoading(false);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError("Unable to load users. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionFeedback("");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
    const newStatus = selectedUser.isActive === false ? true : false;

    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/${selectedUser._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update user status");
      }

      setShowStatusModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setActionFeedback(err.message || "Error updating user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionFeedback("");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";

    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/${selectedUser._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user");
      }

      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setActionFeedback(err.message || "Error deleting user");
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
            className="py-2 px-5 rounded-md font-semibold text-[15px] text-white bg-primaryColor shadow-sm"
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


        {/* Page Header */}
        <div>
          <h1 className="text-[28px] leading-9 font-bold text-headingColor">
            User Management
          </h1>
          <p className="text-textColor text-[15px] mt-1">
            Manage registered customer accounts, view profile details, toggle active access, or delete users.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
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
              Loading users...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center font-semibold">
            {error}
          </div>
        )}

        {/* User Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {users.length === 0 ? (
              <div className="p-10 text-center text-textColor font-semibold">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-gray-50 text-textColor text-[12px] uppercase font-bold border-b">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => {
                      const isSelf = currentUser?._id === u._id;
                      const isActive = u.isActive !== false;

                      return (
                        <tr key={u._id} className="hover:bg-gray-50">
                          <td className="p-4 font-semibold text-headingColor">{u.name}</td>
                          <td className="p-4 text-textColor">{u.email}</td>
                          <td className="p-4">
                            <span className="capitalize px-2.5 py-0.5 rounded text-[12px] font-bold bg-gray-100 text-headingColor">
                              {u.role || "customer"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${
                                isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4 text-textColor">{formatDate(u.createdAt)}</td>
                          <td className="p-4 text-right space-x-2">
                            {/* View Button */}
                            <button
                              onClick={() => { setSelectedUser(u); setShowViewModal(true); }}
                              className="px-3 py-1 bg-gray-100 text-headingColor rounded text-[12px] font-semibold hover:bg-gray-200"
                            >
                              View
                            </button>

                            {/* Toggle Status Button */}
                            {!isSelf ? (
                              <button
                                onClick={() => { setSelectedUser(u); setActionFeedback(""); setShowStatusModal(true); }}
                                className={`px-3 py-1 rounded text-[12px] font-semibold ${
                                  isActive
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    : "bg-green-100 text-green-800 hover:bg-green-200"
                                }`}
                              >
                                {isActive ? "Disable" : "Activate"}
                              </button>
                            ) : null}

                            {/* Delete Button */}
                            {!isSelf ? (
                              <button
                                onClick={() => { setSelectedUser(u); setActionFeedback(""); setShowDeleteModal(true); }}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-[12px] font-semibold hover:bg-red-200"
                              >
                                Delete
                              </button>
                            ) : null}
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
                  Showing Page {pagination.page} of {pagination.pages} ({pagination.total} Total Users)
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

        {/* Modal 1: View User Details */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[500px] w-full p-6 space-y-4 shadow-xl border">
              <h3 className="text-[20px] font-bold text-headingColor border-b pb-2">
                User Details
              </h3>
              <div className="space-y-2 text-[14px]">
                <p><strong>Full Name:</strong> {selectedUser.name}</p>
                <p><strong>Email Address:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> <span className="capitalize">{selectedUser.role}</span></p>
                <p><strong>Status:</strong> {selectedUser.isActive !== false ? "Active" : "Inactive"}</p>
                <p><strong>Gender:</strong> {selectedUser.gender || "Not specified"}</p>
                <p><strong>Blood Type:</strong> {selectedUser.bloodType || "N/A"}</p>
                <p><strong>Joined Date:</strong> {formatDate(selectedUser.createdAt)}</p>
              </div>
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

        {/* Modal 2: Toggle Status Confirmation */}
        {showStatusModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[450px] w-full p-6 space-y-4 shadow-xl border">
              <h3 className="text-[18px] font-bold text-headingColor">
                Confirm Status Change
              </h3>
              <p className="text-[14px] text-textColor">
                Are you sure you want to{" "}
                <strong className="text-headingColor">
                  {selectedUser.isActive !== false ? "deactivate" : "activate"}
                </strong>{" "}
                the account for <strong className="text-headingColor">{selectedUser.name}</strong>?
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
                    selectedUser.isActive !== false ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {actionLoading ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: Delete User Confirmation */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-xl max-w-[450px] w-full p-6 space-y-4 shadow-xl border">
              <h3 className="text-[18px] font-bold text-red-600">
                Confirm Permanent Deletion
              </h3>
              <p className="text-[14px] text-textColor">
                Are you sure you want to permanently delete user account for{" "}
                <strong className="text-headingColor">{selectedUser.name}</strong>? This action cannot be undone.
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
                  onClick={handleDeleteUser}
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

export default AdminUsers;
