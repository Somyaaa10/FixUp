import React, { useState } from "react";
import avatarImg from "../assets/images/avatar-img.png";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";
import { FiUpload } from "react-icons/fi";

const Signup = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: "",
    gender: "",
    role: "customer",
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setFormData({ ...formData, photo: file?.name || "" });
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const result = await response.json();
      setLoading(false);
      if (!response.ok) {
        window.alert(result.message || "Registration failed");
        return;
      }
      window.alert(result.message || "Account created successfully");
      navigate("/login");
    } catch (err) {
      setLoading(false);
      window.alert("Registration error: " + err.message);
    }
  };

  return (
    <div className="bg-[#F7F7F6] min-h-[calc(100vh-80px)] py-12 sm:py-16 flex items-center">
      <div className="container max-w-xl mx-auto px-4">
        <div className="bg-white border border-[#EAE7E3] rounded-3xl p-8 sm:p-10 shadow-soft">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#AD7B5D] bg-[#AD7B5D]/10 px-3 py-1 rounded-full inline-block mb-2">
              Join FixUp
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#202124]">
              Create an Account
            </h2>
            <p className="text-[#6B7280] text-xs mt-1.5">
              Book services or register as a certified trade professional
            </p>
          </div>

          <form onSubmit={submitHandler} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a strong password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                  Are you a:
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] cursor-pointer"
                >
                  <option value="customer">Customer / Homeowner</option>
                  <option value="professional">Professional / Specialist</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                  Gender:
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] cursor-pointer"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-11 h-11 rounded-full border border-[#EAE7E3] overflow-hidden bg-gray-50 shrink-0">
                <img
                  src={avatarImg}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative">
                <input
                  type="file"
                  name="photo"
                  id="customFile"
                  accept=".jpg, .png"
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileInputChange}
                />
                <label
                  htmlFor="customFile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F7F6] hover:bg-gray-200 border border-[#EAE7E3] text-xs font-semibold text-[#202124] rounded-xl cursor-pointer transition"
                >
                  <FiUpload className="w-3.5 h-3.5 text-[#AD7B5D]" />
                  <span>{selectedFile ? selectedFile.name : "Upload Profile Photo"}</span>
                </label>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#202124] hover:bg-black text-white font-heading font-semibold text-xs sm:text-sm py-3 rounded-full shadow-soft transition disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            <p className="mt-5 text-xs text-[#6B7280] text-center">
              Already have an account?
              <Link to="/login" className="text-[#AD7B5D] font-semibold ml-1 hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
