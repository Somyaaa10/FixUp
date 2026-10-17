import React from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

const ErrorState = ({
  title = "Failed to load data",
  message = "An error occurred while fetching information.",
  onRetry,
}) => {
  return (
    <div className="p-6 sm:p-8 bg-white border border-[#E5E5E5] rounded-xl text-center my-4">
      <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center mx-auto mb-3">
        <FiAlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#111111]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#737373] mt-1 max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
