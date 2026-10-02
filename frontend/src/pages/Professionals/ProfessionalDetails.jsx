import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import avatarImg from "../../assets/images/avatar-img.png";
import starIcon from "../../assets/images/Star.png";
import useFetchData from "../../hooks/useFetchData";
import { AuthContext } from "../../context/AuthContext";

const ProfessionalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("about");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const { token, user } = useContext(AuthContext);

  const {
    data: professional,
    loading,
    error,
  } = useFetchData(
    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/professionals/${id}`
  );

  // Load Razorpay Checkout SDK Script
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (document.getElementById("razorpay-sdk")) return;
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpayScript();
  }, []);

  // Fallback data if backend is offline/mocking
  const prof = professional?._id
    ? professional
    : {
        _id: id || "01",
        name: professional?.name || "William Herbert",
        specialization: professional?.specialization || "Electrician",
        averageRating: professional?.averageRating || 4.8,
        totalRating: professional?.totalRating || 272,
        photo: professional?.photo || avatarImg,
        bio: professional?.bio || "Expert in residential wiring, appliance fixing & smart home setup.",
        about:
          professional?.about ||
          "Over 8 years of experience delivering top-tier electrical repair, panel upgrades, and safety inspections across residential and commercial buildings.",
        ticketPrice: professional?.ticketPrice || 500,
        qualifications: professional?.qualifications || [
          { degree: "Certified Electrician", institute: "National Tech Institute" },
        ],
        experiences: professional?.experiences || [
          { role: "Senior Electrician", hospital: "Sunset Electric Services" },
        ],
        timeSlots: professional?.timeSlots || [
          { day: "Monday", time: "09:00 AM - 05:00 PM" },
          { day: "Wednesday", time: "09:00 AM - 05:00 PM" },
        ],
        reviews: professional?.reviews || [],
      };

  const handleBooking = async () => {
    try {
      if (!token) {
        window.alert("Please login to book an appointment");
        navigate("/login");
        return;
      }

      // Step 1: Create Razorpay Order on Backend
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bookings/razorpay-order/${prof._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not initiate Razorpay order");
      }

      const { order, key } = data;

      // Step 2: Open Razorpay Payment Modal
      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock_key",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "FixUp Household Services",
        description: `Booking appointment for ${prof.name} (${prof.specialization})`,
        image: prof.photo || avatarImg,
        order_id: order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#0066ff",
        },
        handler: async function (response) {
          // Step 3: Verify Payment Signature on Backend
          try {
            const verifyRes = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bookings/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  professionalId: prof._id,
                  ticketPrice: prof.ticketPrice,
                }),
              }
            );

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              navigate("/checkout-success");
            } else {
              window.alert(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            window.alert("Verification error: " + err.message);
          }
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        window.alert("Razorpay SDK loading... Please try again in a few seconds.");
      }
    } catch (err) {
      window.alert(err.message || "Failed to process Razorpay booking");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      window.alert("Please login to submit a review");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/professionals/${id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, reviewText }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }

      window.alert("Review submitted successfully!");
      setReviewText("");
    } catch (err) {
      window.alert(err.message || "Failed to submit review");
    }
  };

  return (
    <section>
      <div className="max-w-[1170px] px-5 mx-auto">
        {loading && <p className="text-center font-semibold py-10">Loading professional details...</p>}
        {error && <p className="text-center text-red-500 font-semibold py-10">{error}</p>}

        {!loading && (
          <div className="grid md:grid-cols-3 gap-[50px]">
            {/* Left Content Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-5">
                <figure className="max-w-[200px] max-h-[200px] rounded-lg overflow-hidden">
                  <img src={prof.photo} alt={prof.name} className="w-full h-full object-cover" />
                </figure>

                <div>
                  <span className="bg-[#CCF0F3] text-irisBlueColor py-1 px-6 lg:py-2 lg:px-6 text-[12px] leading-4 lg:text-[16px] lg:leading-7 font-semibold rounded">
                    {prof.specialization}
                  </span>
                  <h3 className="text-headingColor text-[22px] leading-9 mt-3 font-bold">
                    {prof.name}
                  </h3>

                  <div className="flex items-center gap-[6px] mt-2">
                    <span className="flex items-center gap-[6px] text-[14px] leading-5 lg:text-[16px] lg:leading-7 font-semibold text-headingColor">
                      <img src={starIcon} alt="star" className="w-4 h-4" /> {prof.averageRating}
                    </span>
                    <span className="text-[14px] leading-5 lg:text-[16px] lg:leading-7 font-[400] text-textColor">
                      ({prof.totalRating})
                    </span>
                  </div>

                  <p className="text__para text-[14px] leading-6 md:text-[15px] max-w-[390px] mt-2">
                    {prof.bio}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-[50px] border-b border-solid border-[#0066ff34]">
                <button
                  onClick={() => setTab("about")}
                  className={`${
                    tab === "about" && "border-b border-solid border-primaryColor text-primaryColor"
                  } py-2 px-5 mr-5 text-[16px] leading-7 text-headingColor font-semibold`}
                >
                  About
                </button>
                <button
                  onClick={() => setTab("feedback")}
                  className={`${
                    tab === "feedback" && "border-b border-solid border-primaryColor text-primaryColor"
                  } py-2 px-5 text-[16px] leading-7 text-headingColor font-semibold`}
                >
                  Feedback
                </button>
              </div>

              {/* Tab 1: About */}
              {tab === "about" && (
                <div className="mt-6">
                  <h3 className="text-[20px] leading-[30px] text-headingColor font-bold flex items-center gap-2">
                    About <span className="text-primaryColor font-bold">{prof.name}</span>
                  </h3>
                  <p className="text__para mt-3 text-textColor">{prof.about}</p>
                </div>
              )}

              {/* Tab 2: Feedback & Reviews */}
              {tab === "feedback" && (
                <div className="mt-6">
                  <h4 className="text-[20px] leading-[30px] font-bold text-headingColor mb-[30px]">
                    All Reviews ({prof.reviews?.length || 0})
                  </h4>

                  {prof.reviews?.map((rev, index) => (
                    <div key={index} className="flex justify-between gap-10 mb-6 border-b pb-4">
                      <div>
                        <h5 className="text-[16px] font-bold">{rev.user?.name || "Customer"}</h5>
                        <p className="text-[14px] text-textColor mt-1">{rev.reviewText}</p>
                      </div>
                      <div className="flex text-yellow-500 font-bold">
                        ★ {rev.rating}
                      </div>
                    </div>
                  ))}

                  {/* Review Form */}
                  <form onSubmit={handleReviewSubmit} className="mt-8 bg-[#f8f9fa] p-5 rounded-lg">
                    <h5 className="text-[16px] font-bold mb-3">Leave a Review</h5>
                    <div className="mb-3">
                      <label className="block text-[14px] font-semibold mb-1">Rating (1 to 5):</label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="p-2 border rounded-md"
                      >
                        <option value={5}>5 Stars (Excellent)</option>
                        <option value={4}>4 Stars (Good)</option>
                        <option value={3}>3 Stars (Average)</option>
                        <option value={2}>2 Stars (Poor)</option>
                        <option value={1}>1 Star (Terrible)</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share feedback on your service experience..."
                      className="w-full p-3 border rounded-md focus:outline-none"
                      required
                    ></textarea>
                    <button type="submit" className="btn mt-3 py-2 px-4 text-[14px]">
                      Submit Review
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Side: Booking Box */}
            <div>
              <div className="shadow-lg p-5 lg:p-7 rounded-md bg-white border">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] leading-7 lg:text-[22px] lg:leading-8 text-headingColor font-bold">
                    Booking Price
                  </span>
                  <span className="text-[16px] leading-7 lg:text-[22px] lg:leading-8 text-headingColor font-bold">
                    ₹{prof.ticketPrice || 500} INR
                  </span>
                </div>

                <div className="mt-[30px]">
                  <p className="text__para mt-0 font-semibold text-headingColor">
                    Available Time Slots:
                  </p>

                  <ul className="mt-3">
                    {prof.timeSlots?.map((slot, index) => (
                      <li key={index} className="flex items-center justify-between mb-2">
                        <p className="text-[15px] leading-6 text-textColor font-semibold">
                          {slot.day}
                        </p>
                        <p className="text-[15px] leading-6 text-textColor font-semibold">
                          {slot.time}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <button onClick={handleBooking} className="btn w-full rounded-md mt-6 bg-primaryColor text-white font-bold py-3 flex items-center justify-center gap-2">
                  <span>Pay with Razorpay</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfessionalDetails;