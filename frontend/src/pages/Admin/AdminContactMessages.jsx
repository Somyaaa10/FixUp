import React, { useState, useEffect, useContext } from "react";
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
  FiMail,
  FiEye,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiUser,
  FiCalendar,
  FiArchive,
  FiCheck,
} from "react-icons/fi";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminContactMessages = () => {
  const { token } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState({ type: "", text: "" });

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    unread: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // Modal States
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage({ type: "", text: "" }), 4000);
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    const headers = { Authorization: `Bearer ${token}` };

    let url = `${BASE_URL}/api/v1/admin/contact-messages?page=${page}&limit=15`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

    try {
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load contact inquiries");
      }

      setMessages(data.data || []);
      setPagination(data.pagination || { total: 0, unread: 0, page: 1, limit: 15, totalPages: 1 });
    } catch (err) {
      console.error("Fetch contact error:", err);
      setError(err.message || "Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMessages();
    }
  }, [token, page, statusFilter]);

  // Open Message Detail (Auto marks unread -> read on backend)
  const handleOpenDetail = async (msg) => {
    setSelectedMessage(msg);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages/${msg._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setSelectedMessage(data.data);
        // If status changed to read, update list state locally
        if (msg.status === "unread") {
          setMessages((prev) =>
            prev.map((m) => (m._id === msg._id ? { ...m, status: "read" } : m))
          );
          setPagination((prev) => ({
            ...prev,
            unread: Math.max(0, (prev.unread || 1) - 1),
          }));
        }
      }
    } catch (e) {
      console.error("Error reading single contact message:", e);
    }
  };

  // Update Status
  const handleUpdateStatus = async (msgId, newStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages/${msgId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, status: newStatus } : m))
      );
      if (selectedMessage && selectedMessage._id === msgId) {
        setSelectedMessage((prev) => ({ ...prev, status: newStatus }));
      }

      showToast("success", `Inquiry marked as ${newStatus}`);
    } catch (err) {
      showToast("error", err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Inquiry
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages/${messageToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete inquiry");
      }

      showToast("success", "Inquiry deleted successfully");
      setMessageToDelete(null);
      fetchMessages();
    } catch (err) {
      showToast("error", err.message || "Failed to delete message");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Contact Inquiry Inbox"
      subtitle="Customer support inquiries, trade partnership requests, and website feedback"
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

        {/* Search & Filters Toolbar */}
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={() => {
            setPage(1);
            fetchMessages();
          }}
          placeholder="Search by sender, email, subject, or message body..."
          filters={[
            { label: "All Inquiries", value: "", count: pagination.total },
            { label: "Unread", value: "unread", count: pagination.unread },
            { label: "Read", value: "read" },
            { label: "Resolved", value: "resolved" },
            { label: "Archived", value: "archived" },
          ]}
          activeFilter={statusFilter}
          onFilterChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />

        {loading && <LoadingSkeleton type="table" count={5} />}

        {!loading && error && (
          <ErrorState title="Failed to load inbox" message={error} onRetry={fetchMessages} />
        )}

        {!loading && !error && messages.length === 0 && (
          <EmptyState
            icon={FiMail}
            title="No inquiries found"
            description={
              search || statusFilter
                ? "No contact submissions matched your current filter."
                : "No inquiries currently in the contact message inbox."
            }
            actionLabel={search || statusFilter ? "Reset Filters" : null}
            onAction={() => {
              setSearch("");
              setStatusFilter("");
              setPage(1);
            }}
          />
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F5F5] text-[#525252] font-semibold border-b border-[#E5E5E5] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Sender Info</th>
                      <th className="py-3 px-4">Subject & Excerpt</th>
                      <th className="py-3 px-4">Received On</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {messages.map((m) => {
                      const isUnread = m.status === "unread";

                      return (
                        <tr
                          key={m._id}
                          className={`hover:bg-[#F5F5F5] transition-colors ${
                            isUnread ? "bg-[#F5F5F5]/60 font-semibold" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#111111] block">
                              {m.name}
                            </span>
                            <span className="text-[11px] text-[#737373] block truncate max-w-[150px]">
                              {m.email}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-sm">
                            <span className="font-bold text-[#111111] block truncate">
                              {m.subject}
                            </span>
                            <span className="text-[11px] text-[#525252] truncate block font-normal">
                              {m.message}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[#737373] text-[11px] whitespace-nowrap">
                            {formatDate(m.createdAt)}
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge type="inquiry" status={m.status} />
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDetail(m)}
                                className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#111111] hover:bg-[#E5E5E5] transition-colors"
                                title="Read Inquiry"
                                aria-label="Read Inquiry"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setMessageToDelete(m)}
                                className="p-1.5 rounded-lg border border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                                title="Delete Inquiry"
                                aria-label="Delete Inquiry"
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
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}

        {/* Read Message Detail Modal */}
        <DetailModal
          isOpen={Boolean(selectedMessage)}
          onClose={() => setSelectedMessage(null)}
          title={selectedMessage?.subject || "Contact Inquiry"}
          subtitle={`From: ${selectedMessage?.name || "Customer"} (${selectedMessage?.email || ""})`}
          footer={
            <div className="flex items-center justify-between w-full">
              {/* Quick Status Toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#737373] mr-1">Mark as:</span>
                {selectedMessage?.status !== "resolved" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage._id, "resolved")}
                    disabled={actionLoading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#16A34A] text-white hover:bg-emerald-700"
                  >
                    Resolved
                  </button>
                )}
                {selectedMessage?.status !== "archived" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage._id, "archived")}
                    disabled={actionLoading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
                  >
                    Archive
                  </button>
                )}
                {selectedMessage?.status !== "unread" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage._id, "unread")}
                    disabled={actionLoading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5]"
                  >
                    Unread
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-1.5 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          }
        >
          {selectedMessage && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="text-[#737373] text-[11px] block">Sender Name</span>
                  <span className="font-bold text-[#111111] text-sm">{selectedMessage.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#737373] text-[11px] block">Status</span>
                  <StatusBadge type="inquiry" status={selectedMessage.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Reply Email Address</span>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                    className="font-semibold text-[#111111] hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-[#737373] text-[11px] block">Timestamp</span>
                  <span className="font-semibold text-[#111111]">
                    {formatDate(selectedMessage.createdAt)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white border border-[#E5E5E5] rounded-lg">
                <span className="text-[#737373] text-[11px] block font-semibold mb-2">Message Body</span>
                <p className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
          )}
        </DetailModal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(messageToDelete)}
          title="Delete Contact Inquiry"
          message={`Are you sure you want to permanently delete the inquiry from ${messageToDelete?.name || "this user"} regarding "${messageToDelete?.subject || ""}"?`}
          confirmLabel="Delete Inquiry"
          isDanger={true}
          loading={actionLoading}
          onConfirm={handleDeleteMessage}
          onCancel={() => setMessageToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminContactMessages;
