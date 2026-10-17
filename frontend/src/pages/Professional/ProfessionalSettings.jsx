import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import ProfessionalLayout from "./ProfessionalLayout";
import {
  FiSettings,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";

const ProfessionalSettings = () => {
  const { token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setProfile(result.data);
        setIsActive(result.data.isActive !== false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleToggleActive = async () => {
    setSavingStatus(true);
    const newStatus = !isActive;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update availability");
      }

      setIsActive(newStatus);
      setProfile((prev) => ({ ...prev, isActive: newStatus }));
      setFeedback({
        type: "success",
        text: newStatus
          ? "Your account is now active and live in the directory (subject to admin approval)."
          : "Your account is now paused. You will not appear in customer searches or receive new bookings.",
      });
      setTimeout(() => setFeedback({ type: "", text: "" }), 5000);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Error updating availability status",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  const isApproved = profile?.isApproved === "approved";

  return (
    <ProfessionalLayout profileData={profile}>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md inline-block mb-1.5">
            Account Preferences
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
            Professional Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] mt-0.5">
            Configure your directory visibility and marketplace availability
          </p>
        </div>

        {feedback.text && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
              feedback.type === "success"
                ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30"
                : "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
            }`}
          >
            {feedback.type === "success" ? (
              <FiCheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
            ) : (
              <FiAlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Directory Visibility Toggle Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111111]">
                Directory Visibility & Live Status
              </h3>
              <p className="text-xs text-[#525252] mt-1 leading-relaxed">
                When enabled, your profile can appear in the FixUp public marketplace search
                (provided your profile has been approved by administrators).
                Turn this off if you are taking time off or not currently taking new customer bookings.
              </p>
            </div>

            <button
              onClick={handleToggleActive}
              disabled={savingStatus || loading}
              aria-label="Toggle directory availability"
              className="text-3xl text-[#111111] hover:opacity-80 transition-opacity shrink-0"
            >
              {isActive ? (
                <FiToggleRight className="text-[#111111]" />
              ) : (
                <FiToggleLeft className="text-[#737373]" />
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#737373] block text-[11px]">Current Visibility State</span>
              <span className="font-bold text-[#111111]">
                {isActive ? "Active (Receiving Bookings)" : "Paused (Hidden from Directory)"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#737373] block text-[11px]">Approval State</span>
              <span
                className={`font-semibold ${
                  isApproved ? "text-[#16A34A]" : "text-[#D97706]"
                }`}
              >
                {isApproved ? "Admin Approved" : "Pending Review"}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Verification Policy Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 text-[#111111] font-bold text-sm">
            <FiShield className="w-4 h-4" />
            <span>Platform Trust & Safety Guidelines</span>
          </div>

          <p className="text-xs text-[#525252] leading-relaxed">
            FixUp requires all professionals to maintain up-to-date credential documentation and verified trade specializations.
            Pricing and service fee changes are monitored by administrator audit logs to protect customer confidence.
          </p>
        </div>
      </div>
    </ProfessionalLayout>
  );
};

export default ProfessionalSettings;
