import React from "react";

/**
 * Shared Monochrome KPI / Statistics Card.
 * Uses #111111 primary, #525252 secondary, #FFFFFF card background, and #E5E5E5 border.
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = "neutral",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E5E5E5] rounded-xl p-5 sm:p-6 transition-all duration-150 ${
        onClick
          ? "cursor-pointer hover:border-[#111111] hover:shadow-sm"
          : "hover:border-[#D4D4D4]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-[#737373]">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              {value}
            </span>
            {badgeText && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  badgeType === "success"
                    ? "bg-[#16A34A]/10 text-[#16A34A]"
                    : badgeType === "warning"
                    ? "bg-[#D97706]/10 text-[#D97706]"
                    : badgeType === "danger"
                    ? "bg-[#DC2626]/10 text-[#DC2626]"
                    : "bg-[#F5F5F5] text-[#525252]"
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#525252] mt-1.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] shrink-0">
            <Icon className="w-5 h-5 text-[#111111]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
