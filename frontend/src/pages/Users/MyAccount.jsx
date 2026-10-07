import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import useFetchData from "../../hooks/useFetchData";
import userImg from "../../assets/images/avatar-img.png";
import ProfessionalCard from "../../components/Professional/ProfessionalCard";

const MyAccount = () => {
  const { user, token, dispatch } = useContext(AuthContext);
  const [tab, setTab] = useState("bookings");

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useFetchData(`${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/v1/users/profile/me`);

  const {
    data: appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
  } = useFetchData(
    `${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/v1/users/appointments/my-appointments`
  );

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };

  return (
    <section>
      <div className="max-w-[1170px] px-5 mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Profile Sidebar */}
          <div className="pb-[50px] px-30px rounded-md border p-5">
            <div className="flex items-center justify-center">
              <figure className="w-[100px] h-[100px] rounded-full border-2 border-solid border-primaryColor overflow-hidden">
                <img
                  src={userData?.photo || user?.photo || userImg}
                  alt={userData?.name || "User"}
                  className="w-full h-full object-cover"
                />
              </figure>
            </div>

            <div className="text-center mt-4">
              <h3 className="text-[18px] leading-[30px] text-headingColor font-bold">
                {userData?.name || user?.name || "User Profile"}
              </h3>
              <p className="text-textColor text-[15px] leading-6 font-medium">
                {userData?.email || user?.email}
              </p>
              <p className="text-textColor text-[15px] leading-6 font-medium">
                Role: <span className="font-semibold text-headingColor">{userData?.role || user?.role || "Customer"}</span>
              </p>
            </div>

            <div className="mt-50px md:mt-[100px]">
              <button
                onClick={handleLogout}
                className="w-full bg-[#181A1E] p-3 text-[16px] leading-7 rounded-md text-white font-semibold"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Account Tabs Content */}
          <div className="md:col-span-2">
            <div>
              <button
                onClick={() => setTab("bookings")}
                className={`${
                  tab === "bookings" && "bg-primaryColor text-white font-normal"
                } p-2 mr-5 px-5 rounded-md text-headingColor font-semibold text-[16px] leading-7 border border-solid border-primaryColor`}
              >
                My Bookings
              </button>
              <button
                onClick={() => setTab("settings")}
                className={`${
                  tab === "settings" && "bg-primaryColor text-white font-normal"
                } py-2 px-5 rounded-md text-headingColor font-semibold text-[16px] leading-7 border border-solid border-primaryColor`}
              >
                Profile Settings
              </button>
            </div>

            {tab === "bookings" && (
              <div className="mt-8">
                {appointmentsLoading && <p className="font-semibold">Loading appointments...</p>}
                {appointmentsError && <p className="text-red-500">{appointmentsError}</p>}
                {!appointmentsLoading && (!appointments || appointments.length === 0) && (
                  <h2 className="mt-5 text-center leading-7 text-[20px] font-semibold text-primaryColor">
                    You have not booked any professional yet!
                  </h2>
                )}

                {!appointmentsLoading && appointments && appointments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                    {appointments.map((item, index) => {
                      // Support both new combined response and direct professional document
                      const prof = item.professional || (item._id ? item : null);
                      const bookingId = item.bookingId || item._id;

                      return (
                        <div key={bookingId || index} className="border border-solid border-[#0066ff34] p-4 lg:p-5 rounded-lg shadow-sm bg-white hover:shadow-md transition flex flex-col justify-between">
                          {prof ? (
                            <ProfessionalCard professional={prof} />
                          ) : (
                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm font-semibold mb-3">
                              Professional details are currently unavailable.
                            </div>
                          )}

                          {/* Appointment Metadata Details */}
                          <div className="mt-4 pt-4 border-t border-gray-100 text-[14px] space-y-2">
                            <div className="flex justify-between items-center text-textColor font-medium">
                              <span>Booking ID:</span>
                              <span className="font-mono text-[12px] bg-gray-100 px-2 py-0.5 rounded text-headingColor font-bold">
                                {bookingId ? String(bookingId).slice(-8).toUpperCase() : "N/A"}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-textColor font-medium">
                              <span>Appointment Date:</span>
                              <span className="font-semibold text-headingColor">
                                {item.appointmentDate
                                  ? new Date(item.appointmentDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Scheduled"}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-textColor font-medium">
                              <span>Ticket Price:</span>
                              <span className="font-bold text-headingColor">
                                ₹{item.ticketPrice || prof?.ticketPrice || 500} INR
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-textColor font-medium">
                              <span>Status:</span>
                              <span
                                className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize ${
                                  item.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : item.status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {item.status || "Approved"}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-textColor font-medium">
                              <span>Payment Status:</span>
                              <span
                                className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                                  item.isPaid !== false
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {item.isPaid !== false ? "Paid" : "Unpaid"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "settings" && (
              <div className="mt-8 bg-gray-50 p-5 rounded-md">
                <h3 className="text-headingColor text-[20px] font-bold mb-4">
                  Account Overview
                </h3>
                <div className="space-y-3">
                  <p><strong>Full Name:</strong> {userData?.name || user?.name || "N/A"}</p>
                  <p><strong>Email Address:</strong> {userData?.email || user?.email || "N/A"}</p>
                  <p><strong>Gender:</strong> {userData?.gender || "Not specified"}</p>
                  <p><strong>Blood Type:</strong> {userData?.bloodType || "N/A"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyAccount;
