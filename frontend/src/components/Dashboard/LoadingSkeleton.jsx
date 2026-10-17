import React from "react";

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden animate-pulse">
      <div className="h-11 bg-[#F5F5F5] border-b border-[#E5E5E5]" />
      <div className="divide-y divide-[#E5E5E5]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-[#E5E5E5] rounded"
                style={{ width: `${Math.max(40, 100 - cIdx * 15)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E5E5E5] rounded-xl p-5 sm:p-6"
        >
          <div className="h-3 bg-[#E5E5E5] rounded w-1/2 mb-3" />
          <div className="h-8 bg-[#E5E5E5] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#E5E5E5] rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};

const LoadingSkeleton = ({ type = "table", count = 5 }) => {
  if (type === "card") return <CardSkeleton count={count} />;
  return <TableSkeleton rows={count} />;
};

export default LoadingSkeleton;
