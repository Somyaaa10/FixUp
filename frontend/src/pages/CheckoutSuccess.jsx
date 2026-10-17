import React from "react";
import { Link } from "react-router-dom";
import { FiCheck } from "react-icons/fi";

const CheckoutSuccess = () => {
  return (
    <div className="bg-[#F7F7F6] min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
      <div className="bg-white border border-[#EAE7E3] p-8 sm:p-10 rounded-3xl shadow-soft max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#EFFBF5] text-[#27865B] border border-[#A7F3D0]/60 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl text-[#202124] font-heading font-bold">
          Payment Done Successfully!
        </h3>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-2 leading-relaxed">
          Thank you for completing your online appointment booking with FixUp.
        </p>
        <p className="text-[#6B7280] text-xs mt-1">
          Your service provider has been notified.
        </p>
        <div className="pt-8 text-center flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/users/profile/me"
            className="w-full sm:w-auto px-6 bg-[#202124] hover:bg-black text-white font-heading font-semibold text-xs py-3 rounded-full shadow-soft transition"
          >
            View My Bookings
          </Link>
          <Link
            to="/home"
            className="w-full sm:w-auto px-6 bg-white border border-[#EAE7E3] hover:border-gray-400 text-[#202124] font-heading font-semibold text-xs py-3 rounded-full transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
