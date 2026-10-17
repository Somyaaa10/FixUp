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
  FiBriefcase,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiPlus,
  FiStar,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
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

const AdminProfessionals = () => {
  const { token } = useContext(AuthContext);

  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Search/Filter state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "pending", "approved", "active", "inactive"

  // Modals
  const [selectedProf, setSelectedProf] = useState(null);
  const [profDetails, setProfDetails] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [profToEdit, setProfToEdit] = useState(null);
  const [profToToggle, setProfToToggle] = useState(null);
  const [profToDelete, setProfToDelete] = useState(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialization: "Electrician",
    ticketPrice: 500,
    photo: "",
    bio: "",
    password: "",
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 4000);
  };

  const fetchProfessionals = async () => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${BASE_URL}/api/v1/admin/professionals?page=${page}&limit=10`;
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
    } catch (err) {
      console.error("Fetch professionals error:", err);
      setError(err.message || "Unable to load professionals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfessionals();
    }
  }, [token, page, statusFilter]);

  // View Details with Booking Stats
  const handleViewDetails = async (prof) => {
    setSelectedProf(prof);
    setProfDetails(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/professionals/${prof._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfDetails(data.data);
      }
    } catch (err) {
      console.error("Error fetching prof stats:", err);
    }
  };

  // Quick Approve & Activate Workflow
  const handleApproveProfessional = async (prof) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/professionals/${prof._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isApproved: "approved", isActive: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to approve professional");
      }

      showToast("success", `${prof.name} has been approved and activated for marketplace visibility`);
      fetchProfessionals();
    } catch (err) {
      showToast("error", err.message || "Error approving professional");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active State
  const handleToggleStatus = async () => {
    if (!profToToggle) return;
    setActionLoading(true);
    const newActive = profToToggle.isActive === false ? true : false;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/professionals/${profToToggle._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newActive }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      showToast("success", `${profToToggle.name} ${newActive ? "activated" : "deactivated"}`);
      setProfToToggle(null);
      fetchProfessionals();
    } catch (err) {
      showToast("error", err.message || "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Safeguard
  const handleDeleteProfessional = async () => {
    if (!profToDelete) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/professionals/${profToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete professional");
      }

      showToast("success", `${profToDelete.name} deleted successfully`);
      setProfToDelete(null);
      fetchProfessionals();
    } catch (err) {
      showToast("error", err.message || "Failed to delete professional");
    } finally {
      setActionLoading(false);
    }
  };

  // Create Professional Form Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/professionals`, {
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

      showToast("success", `Professional ${formData.name} added successfully`);
      setShowAddModal(false);
      setFormData({
        name: "",
        email: "",
        specialization: "Electrician",
        ticketPrice: 500,
        photo: "",
        bio: "",
        password: "",
      });
      fetchProfessionals();
    } catch (err) {
      showToast("error", err.message || "Error creating professional");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Professional Form Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!profToEdit) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/professionals/${profToEdit._id}`, {
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

      showToast("success", `Professional details updated`);
      setProfToEdit(null);
      fetchProfessionals();
    } catch (err) {
      showToast("error", err.message || "Error updating professional");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (p) => {
    setProfToEdit(p);
    setFormData({
      name: p.name || "",
      email: p.email || "",
      specialization: p.specialization || "Electrician",
      ticketPrice: p.ticketPrice || 500,
      photo: p.photo || "",
      bio: p.bio || "",
      password: "",
    });
  };

  return (
    <AdminLayout
      title="Professional Management"
      subtitle="Manage home-service trades, approve specialists, and monitor marketplace directory visibility"
      actionButton={
        <button
          onClick={() => {
            setFormData({
              name: "",
              email: "",
              specialization: "Electrician",
              ticketPrice: 500,
              photo: "",
              bio: "",
              password: "",
            });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Professional</span>
        </button>
      }
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

        {/* Search & Filters */}
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={() => {
            setPage(1);
            fetchProfessionals();
          }}
          placeholder="Search by name, email, or trade..."
          filters={[
            { label: "All", value: "" },
            { label: "Pending Approvals", value: "pending" },
            { label: "Approved", value: "approved" },
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
          <ErrorState
            title="Failed to retrieve professionals"
            message={error}
            onRetry={fetchProfessionals}
          />
        )}

        {!loading && !error && professionals.length === 0 && (
          <EmptyState
            icon={FiBriefcase}
            title="No professionals found"
            description={
              search
                ? `No specialist records matching "${search}".`
                : statusFilter
                ? `No professionals matching filter "${statusFilter}".`
                : "No trade professionals registered yet."
            }
            actionLabel={search || statusFilter ? "Reset Filters" : "Add Professional"}
            onAction={() => {
              if (search || statusFilter) {
                setSearch("");
                setStatusFilter("");
                setPage(1);
              } else {
                setShowAddModal(true);
              }
            }}
          />
        )}

        {!loading && !error && professionals.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Professional</th>
                      <th className="py-3 px-4">Specialization</th>
                      <th className="py-3 px-4">Base Rate</th>
                      <th className="py-3 px-4">Approval</th>
                      <th className="py-3 px-4">Visibility</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {professionals.map((p) => {
                      const isPending = p.isApproved === "pending" || !p.isApproved;
                      const isApproved = p.isApproved === "approved";
                      const isActive = p.isActive !== false;

                      return (
                        <tr key={p._id} className="hover:bg-[#F5F5F5] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.photo || userImg}
                                alt={p.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#E5E5E5]"
                                onError={(e) => {
                                  e.currentTarget.src = userImg;
                                }}
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-[#111111] block">
                                  {p.name}
                                </span>
                                <span className="text-[11px] text-[#737373] truncate block">
                                  {p.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#111111] block">
                              {p.specialization || "Home Service"}
                            </span>
                            <span className="text-[10px] text-[#737373] flex items-center gap-1">
                              <FiStar className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{p.averageRating ? p.averageRating.toFixed(1) : "5.0"}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#111111]">
                            {formatCurrency(p.ticketPrice || 500)}
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge type="approval" status={p.isApproved} />
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge type="active" status={isActive} />
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Approve Action */}
                              {isPending && (
                                <button
                                  onClick={() => handleApproveProfessional(p)}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white transition-colors inline-flex items-center gap-1"
                                  title="Approve & Activate"
                                >
                                  <FiCheck className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleViewDetails(p)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title="View Details"
                                aria-label="View Details"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title="Edit Professional"
                                aria-label="Edit Professional"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setProfToToggle(p)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title={isActive ? "Deactivate Professional" : "Activate Professional"}
                                aria-label="Toggle active status"
                              >
                                <FiCheckCircle
                                  className={`w-3.5 h-3.5 ${
                                    isActive ? "text-[#16A34A]" : "text-[#737373]"
                                  }`}
                                />
                              </button>

                              <button
                                onClick={() => setProfToDelete(p)}
                                className="p-1.5 rounded-lg border border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                                title="Delete Professional"
                                aria-label="Delete Professional"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
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

        {/* View Details Modal with Statistics */}
        <DetailModal
          isOpen={Boolean(selectedProf)}
          onClose={() => {
            setSelectedProf(null);
            setProfDetails(null);
          }}
          title={selectedProf?.name || "Professional Profile"}
          subtitle={`Trade: ${selectedProf?.specialization || "Specialist"}`}
          footer={
            <div className="flex items-center justify-between w-full">
              {selectedProf?.isApproved === "pending" && (
                <button
                  onClick={() => {
                    handleApproveProfessional(selectedProf);
                    setSelectedProf(null);
                  }}
                  className="px-3 py-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>Approve & Make Live</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedProf(null);
                  setProfDetails(null);
                }}
                className="px-4 py-1.5 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          }
        >
          {selectedProf && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProf.photo || userImg}
                    alt={selectedProf.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#E5E5E5]"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#111111]">{selectedProf.name}</h4>
                    <p className="text-[11px] text-[#737373]">{selectedProf.email}</p>
                    <p className="text-[11px] text-[#525252] mt-0.5">
                      Base Fee: <span className="font-bold">{formatCurrency(selectedProf.ticketPrice || 500)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <StatusBadge type="approval" status={selectedProf.isApproved} />
                  <div>
                    <StatusBadge type="active" status={selectedProf.isActive !== false} />
                  </div>
                </div>
              </div>

              {/* Statistics Breakdown */}
              {profDetails?.statistics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-center">
                    <span className="text-[10px] text-[#737373] block uppercase">Total Jobs</span>
                    <span className="text-base font-bold text-[#111111]">
                      {profDetails.statistics.totalBookings ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-center">
                    <span className="text-[10px] text-[#737373] block uppercase">Confirmed</span>
                    <span className="text-base font-bold text-[#111111]">
                      {profDetails.statistics.approvedBookings ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-center">
                    <span className="text-[10px] text-[#737373] block uppercase">Completed</span>
                    <span className="text-base font-bold text-[#16A34A]">
                      {profDetails.statistics.completedBookings ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-center">
                    <span className="text-[10px] text-[#737373] block uppercase">Cancelled</span>
                    <span className="text-base font-bold text-[#DC2626]">
                      {profDetails.statistics.cancelledBookings ?? 0}
                    </span>
                  </div>
                </div>
              )}

              {selectedProf.bio && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[11px] text-[#737373] block font-semibold">Bio</span>
                  <p className="text-[#111111] mt-0.5">{selectedProf.bio}</p>
                </div>
              )}

              {selectedProf.about && (
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[11px] text-[#737373] block font-semibold">About</span>
                  <p className="text-[#525252] mt-0.5 leading-relaxed">{selectedProf.about}</p>
                </div>
              )}
            </div>
          )}
        </DetailModal>

        {/* Add Professional Modal */}
        <DetailModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Professional"
          subtitle="Register an authorized home service specialist"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@example.com"
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Electrician, Plumber"
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">Base Price (INR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.ticketPrice}
                  onChange={(e) => setFormData({ ...formData, ticketPrice: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#111111] mb-1">Temporary Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Defaults to FixUpPass123! if blank"
                className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#111111] mb-1">Bio Tagline</label>
              <input
                type="text"
                maxLength={50}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Certified expert with residential experience"
                className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-[#525252] hover:bg-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white font-semibold rounded-lg flex items-center gap-2"
              >
                {actionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Save Professional</span>
              </button>
            </div>
          </form>
        </DetailModal>

        {/* Edit Professional Modal */}
        <DetailModal
          isOpen={Boolean(profToEdit)}
          onClose={() => setProfToEdit(null)}
          title={`Edit ${profToEdit?.name || "Professional"}`}
          subtitle="Update service fee and trade details"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">Base Price (INR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.ticketPrice}
                  onChange={(e) => setFormData({ ...formData, ticketPrice: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#111111] mb-1">Bio Tagline</label>
              <input
                type="text"
                maxLength={50}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProfToEdit(null)}
                className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-[#525252] hover:bg-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white font-semibold rounded-lg flex items-center gap-2"
              >
                {actionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Update Details</span>
              </button>
            </div>
          </form>
        </DetailModal>

        {/* Toggle Active Status Modal */}
        <ConfirmModal
          isOpen={Boolean(profToToggle)}
          title={profToToggle?.isActive === false ? "Activate Professional" : "Deactivate Professional"}
          message={`Are you sure you want to ${
            profToToggle?.isActive === false ? "activate" : "deactivate"
          } ${profToToggle?.name || "this professional"}? ${
            profToToggle?.isActive === false
              ? "The professional will become visible in the directory if approved."
              : "The professional will be hidden from public searches."
          }`}
          confirmLabel={profToToggle?.isActive === false ? "Activate" : "Deactivate"}
          isDanger={profToToggle?.isActive !== false}
          loading={actionLoading}
          onConfirm={handleToggleStatus}
          onCancel={() => setProfToToggle(null)}
        />

        {/* Delete Safeguard Modal */}
        <ConfirmModal
          isOpen={Boolean(profToDelete)}
          title="Delete Professional"
          message={`Are you sure you want to delete ${profToDelete?.name || "this professional"}? Note: Deletion will be rejected by the server if existing customer bookings reference this account.`}
          confirmLabel="Delete Professional"
          isDanger={true}
          loading={actionLoading}
          onConfirm={handleDeleteProfessional}
          onCancel={() => setProfToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProfessionals;
