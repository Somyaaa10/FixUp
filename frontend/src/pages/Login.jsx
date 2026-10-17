import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { BASE_URL } from "../config";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, role, dispatch } = useContext(AuthContext);

  // If already logged in, redirect to the user's appropriate dashboard
  useEffect(() => {
    if (token && role) {
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "professional") {
        navigate("/professional/dashboard", { replace: true });
      } else {
        navigate("/users/profile/me", { replace: true });
      }
    }
  }, [token, role, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage("");
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const result = await response.json();
      setLoading(false);

      if (!response.ok) {
        setErrorMessage(result.message || "Invalid email or password");
        return;
      }

      // Store in auth context
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: result.data,
          token: result.token,
          role: result.role,
        },
      });

      // Role-based redirection using authoritative backend role
      const authenticatedRole = result.role;
      if (authenticatedRole === "admin") {
        navigate("/admin", { replace: true });
      } else if (authenticatedRole === "professional") {
        navigate("/professional/dashboard", { replace: true });
      } else {
        // Customer or default
        navigate("/users/profile/me", { replace: true });
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage("Network error: " + err.message);
    }
  };

  return (
    <div className="bg-[#F7F7F6] min-h-[calc(100vh-80px)] py-12 sm:py-16 flex items-center">
      <div className="container max-w-md mx-auto px-4">
        <div className="bg-white border border-[#EAE7E3] rounded-3xl p-8 sm:p-10 shadow-soft">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#AD7B5D] bg-[#AD7B5D]/10 px-3 py-1 rounded-full inline-block mb-2">
              Welcome Back
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#202124]">
              Sign in to Fix<span className="text-[#AD7B5D]">Up</span>
            </h2>
            <p className="text-[#6B7280] text-xs mt-1.5">
              Access your bookings, profile, or professional dashboard
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={submitHandler}>
            <div>
              <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                Account Role
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="professional">Professional</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                Email Address
              </label>
              <div className="relative">
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
            </div>

            <div>
              <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#EAE7E3] text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D]"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#202124] hover:bg-black text-white font-heading font-semibold text-xs sm:text-sm py-3 rounded-full shadow-soft transition disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <p className="mt-5 text-xs text-[#6B7280] text-center">
              Don&apos;t have an account?
              <Link to="/register" className="text-[#AD7B5D] font-semibold ml-1 hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
