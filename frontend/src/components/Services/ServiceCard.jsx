import React from 'react';
import { Link } from "react-router-dom";
import {
  FiZap,
  FiDroplet,
  FiTool,
  FiHome,
  FiEdit3,
  FiSun
} from "react-icons/fi";

const getCategoryMeta = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("clean") || lower.includes("sanit")) {
    return {
      icon: <FiHome className="w-5 h-5 text-amber-700" />,
      bg: "bg-[#FEF3C7]",
    };
  }
  if (lower.includes("plumb") || lower.includes("repair")) {
    return {
      icon: <FiDroplet className="w-5 h-5 text-rose-700" />,
      bg: "bg-[#FEE2E2]",
    };
  }
  if (lower.includes("electr") || lower.includes("light")) {
    return {
      icon: <FiZap className="w-5 h-5 text-indigo-700" />,
      bg: "bg-[#E0E7FF]",
    };
  }
  if (lower.includes("paint") || lower.includes("renov")) {
    return {
      icon: <FiEdit3 className="w-5 h-5 text-pink-700" />,
      bg: "bg-[#FCE7F3]",
    };
  }
  if (lower.includes("handy") || lower.includes("carpent")) {
    return {
      icon: <FiTool className="w-5 h-5 text-emerald-700" />,
      bg: "bg-[#D1FAE5]",
    };
  }
  return {
    icon: <FiSun className="w-5 h-5 text-teal-700" />,
    bg: "bg-[#CCFBF1]",
  };
};

const ServiceCard = ({ item }) => {
  const { name, desc } = item || {};
  const queryParam = encodeURIComponent(name || "");
  const meta = getCategoryMeta(name);

  return (
    <div className="bg-white rounded-3xl border border-[#EAE7E3] p-7 text-center shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-between group">
      <div className="flex flex-col items-center">
        {/* Pastel Icon Circle */}
        <div className={`w-14 h-14 rounded-full ${meta.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
          {meta.icon}
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-base sm:text-lg text-[#202124] mb-2.5">
          {name}
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-[13px] text-[#6B7280] leading-relaxed line-clamp-3">
          {desc}
        </p>
      </div>

      {/* Button */}
      <div className="mt-6 w-full">
        <Link
          to={`/professionals?category=${queryParam}`}
          className="w-full inline-block"
        >
          <button
            type="button"
            className="w-full py-2.5 px-5 bg-white hover:bg-gray-50 border border-[#EAE7E3] hover:border-gray-400 text-[#202124] font-heading font-medium text-xs rounded-full shadow-soft transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#202124] focus-visible:ring-offset-2"
          >
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
