import React from "react";
import { FiInbox } from "react-icons/fi";

const EmptyState = ({
  icon: Icon = FiInbox,
  title = "No data found",
  description = "There are no records matching your criteria.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="py-12 sm:py-16 px-4 text-center bg-white border border-[#E5E5E5] rounded-xl my-4">
      <div className="w-12 h-12 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center mx-auto mb-3.5 text-[#111111]">
        <Icon className="w-6 h-6 text-[#111111]" />
      </div>
      <h3 className="text-base font-semibold text-[#111111]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#737373] mt-1 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
