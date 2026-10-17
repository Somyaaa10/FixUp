import React, { useEffect } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        className="bg-white border border-[#E5E5E5] rounded-2xl w-full max-w-md p-6 shadow-xl relative"
      >
        <button
          onClick={onCancel}
          disabled={loading}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20"
                : "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
            }`}
          >
            <FiAlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3
              id="modal-headline"
              className="text-base font-bold text-[#111111]"
            >
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#525252] mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-2 ${
              isDanger
                ? "bg-[#DC2626] hover:bg-red-700"
                : "bg-[#111111] hover:bg-black"
            } disabled:opacity-50`}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
