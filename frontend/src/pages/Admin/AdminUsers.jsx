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
  FiUsers,
  FiEye,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
} from "react-icons/fi";

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
  const [userToToggle, setUserToToggle] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${BASE_URL}/api/v1/admin/users?page=${page}&limit=10`;
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
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, page, statusFilter]);

  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    setActionLoading(true);
    const newStatus = userToToggle.isActive === false ? true : false;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/users/${userToToggle._id}/status`, {
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

      showToast(
        "success",
        `User ${userToToggle.name} ${newStatus ? "activated" : "deactivated"} successfully`
      );
      setUserToToggle(null);
      fetchUsers();
    } catch (err) {
      showToast("error", err.message || "Error updating user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user");
      }

      showToast("success", `User ${userToDelete.name} has been deleted`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      showToast("error", err.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage registered customer accounts, authentication status, and access permissions"
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
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={() => {
            setPage(1);
            fetchUsers();
          }}
          placeholder="Search by name or email address..."
          filters={[
            { label: "All Users", value: "" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          activeFilter={statusFilter}
          onFilterChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />

        {loading && <LoadingSkeleton type="table" count={5} />}

        {!loading && error && (
          <ErrorState title="Failed to retrieve users" message={error} onRetry={fetchUsers} />
        )}

        {!loading && !error && users.length === 0 && (
          <EmptyState
            icon={FiUsers}
            title="No users found"
            description={
              search
                ? `No user records matching "${search}".`
                : statusFilter
                ? `No users matching the "${statusFilter}" status filter.`
                : "No customer accounts registered yet."
            }
            actionLabel={search || statusFilter ? "Reset Filters" : null}
            onAction={() => {
              setSearch("");
              setStatusFilter("");
              setPage(1);
            }}
          />
        )}

        {!loading && !error && users.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4">Registered On</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {users.map((u) => {
                      const isSelf = currentUser?._id === u._id;
                      const active = u.isActive !== false;

                      return (
                        <tr key={u._id} className="hover:bg-[#F5F5F5] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.photo || userImg}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#E5E5E5]"
                                onError={(e) => {
                                  e.currentTarget.src = userImg;
                                }}
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-[#111111] block">
                                  {u.name}
                                  {isSelf && (
                                    <span className="ml-2 text-[10px] font-semibold bg-[#111111] text-white px-1.5 py-0.2 rounded">
                                      You
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-[#737373] truncate block">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[#111111]">
                            {u.phone || <span className="text-[#737373]">—</span>}
                          </td>

                          <td className="py-3.5 px-4 capitalize text-[#525252]">
                            {u.gender || "—"}
                          </td>

                          <td className="py-3.5 px-4 text-[#111111]">
                            {formatDate(u.createdAt)}
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge type="active" status={active} />
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title="View User"
                                aria-label="View User Details"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                              </button>

                              {!isSelf && (
                                <>
                                  <button
                                    onClick={() => setUserToToggle(u)}
                                    className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                    title={active ? "Deactivate User" : "Activate User"}
                                    aria-label="Toggle user active status"
                                  >
                                    {active ? (
                                      <FiToggleRight className="w-3.5 h-3.5 text-[#16A34A]" />
                                    ) : (
                                      <FiToggleLeft className="w-3.5 h-3.5 text-[#737373]" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="p-1.5 rounded-lg border border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                                    title="Delete User"
                                    aria-label="Delete User"
                                  >
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
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

            <Pagination
              page={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}

        {/* View User Modal */}
        <DetailModal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={selectedUser?.name || "Customer Account Details"}
          subtitle={`Account ID: ${selectedUser?._id || ""}`}
          footer={
            <button
              onClick={() => setSelectedUser(null)}
              className="px-4 py-1.5 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
            >
              Close
            </button>
          }
        >
          {selectedUser && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]">
                <img
                  src={selectedUser.photo || userImg}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#E5E5E5]"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#111111]">{selectedUser.name}</h4>
                  <p className="text-[11px] text-[#737373]">{selectedUser.email}</p>
                  <div className="mt-1">
                    <StatusBadge type="active" status={selectedUser.isActive !== false} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Role</span>
                  <span className="font-bold text-[#111111] uppercase tracking-wider text-[11px]">
                    {selectedUser.role || "customer"}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Contact Phone</span>
                  <span className="font-semibold text-[#111111]">
                    {selectedUser.phone || "Not provided"}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Gender</span>
                  <span className="font-semibold text-[#111111] capitalize">
                    {selectedUser.gender || "Not specified"}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Joined Date</span>
                  <span className="font-semibold text-[#111111]">
                    {formatDate(selectedUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DetailModal>

        {/* Toggle Status Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(userToToggle)}
          title={userToToggle?.isActive === false ? "Activate User Account" : "Deactivate User Account"}
          message={`Are you sure you want to ${
            userToToggle?.isActive === false ? "activate" : "deactivate"
          } ${userToToggle?.name || "this user"}? ${
            userToToggle?.isActive === false
              ? "The customer will regain platform access."
              : "The customer will be blocked from accessing protected services."
          }`}
          confirmLabel={userToToggle?.isActive === false ? "Activate" : "Deactivate"}
          isDanger={userToToggle?.isActive !== false}
          loading={actionLoading}
          onConfirm={handleToggleStatus}
          onCancel={() => setUserToToggle(null)}
        />

        {/* Delete User Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(userToDelete)}
          title="Delete Customer Account"
          message={`Are you sure you want to permanently delete account for ${userToDelete?.name || "this user"}? This action cannot be undone.`}
          confirmLabel="Delete Account"
          isDanger={true}
          loading={actionLoading}
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
