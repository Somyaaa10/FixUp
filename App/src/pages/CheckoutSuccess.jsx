import React from "react";
import { Link } from "react-router-dom";

const CheckoutSuccess = () => {
  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center">
      <div className="bg-white p-6 md:mx-auto rounded-lg shadow-md max-w-[500px] text-center">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <h3 className="md:text-2xl text-base text-gray-900 font-semibold text-center">
          Payment Done Successfully!
        </h3>
        <p className="text-gray-600 my-2">
          Thank you for completing your online appointment booking with FixUp.
        </p>
        <p className="text-gray-500 text-sm"> Have a great day! </p>
        <div className="py-10 text-center">
          <Link
            to="/home"
            className="px-12 bg-primaryColor hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
          >
            Go back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
