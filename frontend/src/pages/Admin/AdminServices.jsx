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
import {
  FiTool,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiTag,
  FiCalendar,
} from "react-icons/fi";

const AdminServices = () => {
  const { token } = useContext(AuthContext);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filter state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" (All), "active", "inactive"

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [serviceToToggle, setServiceToToggle] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    isActive: true,
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 4000);
  };

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${BASE_URL}/api/v1/admin/services?page=${page}&limit=10`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    try {
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch services");
      }

      setServices(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (err) {
      console.error("Fetch services error:", err);
      setError(err.message || "Unable to load service catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchServices();
    }
  }, [token, page, statusFilter]);

  // Create Service
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create service");
      }

      showToast("success", `Service "${formData.name}" created successfully`);
      setShowAddModal(false);
      setFormData({ name: "", desc: "", isActive: true });
      fetchServices();
    } catch (err) {
      showToast("error", err.message || "Error creating service");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Service
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!serviceToEdit) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${serviceToEdit._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update service");
      }

      showToast("success", `Service updated successfully`);
      setServiceToEdit(null);
      fetchServices();
    } catch (err) {
      showToast("error", err.message || "Error updating service");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active State
  const handleToggleStatus = async () => {
    if (!serviceToToggle) return;
    setActionLoading(true);
    const newActive = serviceToToggle.isActive === false ? true : false;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${serviceToToggle._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newActive }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update service status");
      }

      showToast("success", `Service ${newActive ? "activated" : "deactivated"}`);
      setServiceToToggle(null);
      fetchServices();
    } catch (err) {
      showToast("error", err.message || "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Service Safeguard
  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${serviceToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete service");
      }

      showToast("success", `Service deleted successfully`);
      setServiceToDelete(null);
      fetchServices();
    } catch (err) {
      showToast("error", err.message || "Failed to delete service");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (s) => {
    setServiceToEdit(s);
    setFormData({
      name: s.name || "",
      desc: s.desc || "",
      isActive: s.isActive !== false,
    });
  };

  return (
    <AdminLayout
      title="Service Catalog Management"
      subtitle="Define home-service offerings, categories, descriptions, and catalog availability"
      actionButton={
        <button
          onClick={() => {
            setFormData({ name: "", desc: "", isActive: true });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          <span>Create Service</span>
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
            fetchServices();
          }}
          placeholder="Search services by title or description..."
          filters={[
            { label: "All Services", value: "" },
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
          <ErrorState title="Failed to load catalog" message={error} onRetry={fetchServices} />
        )}

        {!loading && !error && services.length === 0 && (
          <EmptyState
            icon={FiTool}
            title="No services found"
            description={
              search || statusFilter
                ? "No catalog items matched your query."
                : "No trade services registered in the catalog yet."
            }
            actionLabel={search || statusFilter ? "Reset Filters" : "Create Service"}
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

        {!loading && !error && services.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Service Name</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Linked Bookings</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {services.map((s) => {
                      const active = s.isActive !== false;
                      const hasBookings = (s.bookingCount || 0) > 0;

                      return (
                        <tr key={s._id} className="hover:bg-[#F5F5F5] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#111111]">
                            {s.name}
                          </td>

                          <td className="py-3.5 px-4 text-[#525252] max-w-sm truncate">
                            {s.desc || <span className="text-[#737373] italic">No description</span>}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#111111]">
                              {s.bookingCount ?? 0}
                            </span>
                            <span className="text-[11px] text-[#737373] ml-1">
                              orders
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge type="active" status={active} />
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(s)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title="Edit Service"
                                aria-label="Edit Service"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setServiceToToggle(s)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title={active ? "Deactivate Service" : "Activate Service"}
                                aria-label="Toggle active status"
                              >
                                <FiCheckCircle
                                  className={`w-3.5 h-3.5 ${
                                    active ? "text-[#16A34A]" : "text-[#737373]"
                                  }`}
                                />
                              </button>

                              <button
                                onClick={() => setServiceToDelete(s)}
                                className="p-1.5 rounded-lg border border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                                title={
                                  hasBookings
                                    ? `Referenced by ${s.bookingCount} bookings (will be blocked)`
                                    : "Delete Service"
                                }
                                aria-label="Delete Service"
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

        {/* Add Service Modal */}
        <DetailModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create Service Catalog Entry"
          subtitle="Add a new home service specialization"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#111111] mb-1">Service Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Solar Panel Installation"
                className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#111111] mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                placeholder="Detailed scope of service, typical fixtures, and diagnostics..."
                className="w-full p-3 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
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
                <span>Save Service</span>
              </button>
            </div>
          </form>
        </DetailModal>

        {/* Edit Service Modal */}
        <DetailModal
          isOpen={Boolean(serviceToEdit)}
          onClose={() => setServiceToEdit(null)}
          title={`Edit ${serviceToEdit?.name || "Service"}`}
          subtitle="Modify service catalog attributes"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#111111] mb-1">Service Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#111111] mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                className="w-full p-3 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setServiceToEdit(null)}
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
                <span>Update Service</span>
              </button>
            </div>
          </form>
        </DetailModal>

        {/* Toggle Status Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(serviceToToggle)}
          title={serviceToToggle?.isActive === false ? "Activate Service" : "Deactivate Service"}
          message={`Are you sure you want to ${
            serviceToToggle?.isActive === false ? "activate" : "deactivate"
          } "${serviceToToggle?.name || "this service"}"? Deactivated services are hidden from public browse views.`}
          confirmLabel={serviceToToggle?.isActive === false ? "Activate" : "Deactivate"}
          isDanger={serviceToToggle?.isActive !== false}
          loading={actionLoading}
          onConfirm={handleToggleStatus}
          onCancel={() => setServiceToToggle(null)}
        />

        {/* Delete Safeguard Modal */}
        <ConfirmModal
          isOpen={Boolean(serviceToDelete)}
          title="Delete Catalog Service"
          message={
            serviceToDelete?.bookingCount > 0
              ? `Warning: This service is currently referenced by ${serviceToDelete.bookingCount} historical customer booking(s). The server will reject deletion with a 409 Conflict error to safeguard customer history. Please deactivate the service instead.`
              : `Are you sure you want to delete "${serviceToDelete?.name || "this service"}"? This operation cannot be reversed.`
          }
          confirmLabel="Delete Service"
          isDanger={true}
          loading={actionLoading}
          onConfirm={handleDeleteService}
          onCancel={() => setServiceToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
