import React from "react";
import { FiSearch, FiX } from "react-icons/fi";

const SearchToolbar = ({
  search = "",
  onSearchChange,
  onSearchSubmit,
  placeholder = "Search...",
  filters = [],
  activeFilter = "",
  onFilterChange,
  actionButton,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      {/* Search Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onSearchSubmit) onSearchSubmit();
        }}
        className="relative flex-1 max-w-md flex items-center"
      >
        <FiSearch className="absolute left-3 w-4 h-4 text-[#737373] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] placeholder-[#737373] focus:outline-none focus:border-[#111111] focus:bg-white transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 p-0.5 text-[#737373] hover:text-[#111111]"
            aria-label="Clear search"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Filters & Actions */}
      <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
        {filters.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg overflow-x-auto">
            {filters.map((f) => {
              const isActive = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => onFilterChange(f.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#111111] text-white shadow-xs"
                      : "text-[#525252] hover:text-[#111111] hover:bg-white/60"
                  }`}
                >
                  {f.label}
                  {typeof f.count === "number" && (
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#E5E5E5] text-[#525252]"
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {actionButton}
      </div>
    </div>
  );
};

export default SearchToolbar;
