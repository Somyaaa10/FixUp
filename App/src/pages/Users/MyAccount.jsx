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
  } = useFetchData(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/users/profile/me`);

  const {
    data: appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
  } = useFetchData(
    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/users/appointments/my-appointments`
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
                    {appointments.map((prof) => (
                      <ProfessionalCard key={prof._id} professional={prof} />
                    ))}
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
