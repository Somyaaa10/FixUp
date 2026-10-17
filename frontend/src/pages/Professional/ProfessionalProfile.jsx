import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import ProfessionalLayout from "./ProfessionalLayout";
import userImg from "../../assets/images/avatar-img.png";
import LoadingSkeleton from "../../components/Dashboard/LoadingSkeleton";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiTool,
  FiFileText,
  FiCheckCircle,
  FiSave,
  FiAlertCircle,
  FiShield,
  FiCheck,
} from "react-icons/fi";

const ProfessionalProfile = () => {
  const { token, user, dispatch } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [catalogServices, setCatalogServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    specialization: "",
    bio: "",
    about: "",
    photo: "",
  });

  const fetchCatalogServices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/services`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setCatalogServices(data.data);
      }
    } catch (err) {
      console.error("Fetch catalog services error:", err);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setFeedback({ type: "", text: "" });
    try {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to load profile details");
      }

      setProfile(result.data);
      setFormData({
        name: String(result.data?.name ?? "").trim(),
        phone: String(result.data?.phone ?? "").trim(),
        specialization: String(result.data?.specialization ?? "").trim(),
        bio: String(result.data?.bio ?? "").trim(),
        about: String(result.data?.about ?? "").trim(),
        photo: String(result.data?.photo ?? "").trim(),
      });

      if (result.data?.services && result.data.services.length > 0) {
        const primary = result.data.services[0];
        setSelectedServiceId(primary._id || primary);
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Error loading profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchCatalogServices();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: "", text: "" });

    try {
      const payload = {
        name: String(formData.name ?? "").trim(),
        phone: String(formData.phone ?? "").trim(),
        specialization: String(formData.specialization ?? "").trim(),
        bio: String(formData.bio ?? "").trim(),
        about: String(formData.about ?? "").trim(),
        photo: String(formData.photo ?? "").trim(),
      };

      if (selectedServiceId) {
        payload.services = [selectedServiceId];
        payload.serviceId = selectedServiceId;
      }

      const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      setProfile(result.data);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: {
            ...user,
            name: result.data?.name || formData.name,
            photo: result.data?.photo || formData.photo,
          },
          token,
          role: "professional",
        },
      });

      setFeedback({
        type: "success",
        text: "Profile updated successfully! Information has been synced with database.",
      });
      setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to save profile changes",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfessionalLayout profileData={profile}>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md inline-block mb-1.5">
            Public Profile & Credentials
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
            Manage Professional Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] mt-0.5">
            Your public listing information displayed to customers seeking home service professionals
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

        {loading ? (
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 space-y-4">
            <div className="h-6 bg-[#F5F5F5] rounded w-1/3 animate-pulse" />
            <div className="h-10 bg-[#F5F5F5] rounded animate-pulse" />
            <div className="h-10 bg-[#F5F5F5] rounded animate-pulse" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 space-y-5"
          >
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>
            </div>

            {/* Specialization & Catalog Service Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Primary Specialization / Trade
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  placeholder="e.g. Master Plumber, Electrician"
                  required
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Link Catalog Service (Platform Search)
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
                >
                  <option value="">-- Choose Catalog Service --</option>
                  {catalogServices.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bio (Short) */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Short Tagline / Bio (Max 50 chars)
              </label>
              <input
                type="text"
                maxLength={50}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="e.g. Certified expert with 10+ years residential experience"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              />
              <span className="text-[11px] text-[#737373] mt-0.5 block text-right">
                {formData.bio.length} / 50 characters
              </span>
            </div>

            {/* About (Extended) */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                About Your Services & Experience
              </label>
              <textarea
                rows={4}
                value={formData.about}
                onChange={(e) =>
                  setFormData({ ...formData, about: e.target.value })
                }
                placeholder="Describe your qualifications, typical repairs handled, warranty commitments, and tools..."
                className="w-full p-3 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              />
            </div>

            {/* Avatar Photo */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Avatar Photo URL
              </label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) =>
                  setFormData({ ...formData, photo: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111] transition-all"
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSave className="w-3.5 h-3.5" />
                )}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </ProfessionalLayout>
  );
};

export default ProfessionalProfile;
