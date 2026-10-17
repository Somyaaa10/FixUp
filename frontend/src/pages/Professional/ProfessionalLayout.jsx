import React, { useState, useContext } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import userImg from "../../assets/images/avatar-img.png";
import {
  FiGrid,
  FiBriefcase,
  FiCalendar,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiTool,
  FiHome,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const navItems = [
  { path: "/professional/dashboard", label: "Dashboard", icon: FiGrid },
  { path: "/professional/jobs", label: "My Jobs", icon: FiBriefcase },
  { path: "/professional/bookings", label: "Booking History", icon: FiCalendar },
  { path: "/professional/profile", label: "My Profile", icon: FiUser },
  { path: "/professional/settings", label: "Settings", icon: FiSettings },
];

const ProfessionalLayout = ({ children, profileData }) => {
  const { user, dispatch } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login", { replace: true });
  };

  const displayName = profileData?.name || user?.name || "Professional";
  const displayEmail = profileData?.email || user?.email || "";
  const displayPhoto = profileData?.photo || user?.photo || userImg;
  const isApproved = profileData?.isApproved === "approved";
  const isCancelled = profileData?.isApproved === "cancelled";
  const isPending = !isApproved && !isCancelled;
  const isActive = profileData?.isActive !== false;

  return (
    <div className="bg-[#F5F5F5] min-h-screen text-[#111111] flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-white border-b border-[#E5E5E5] px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <Link to="/professional/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white">
            <FiTool className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-[#111111]">
            FixUp <span className="text-xs font-semibold px-2 py-0.5 bg-[#111111] text-white rounded-full ml-1">Pro</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="w-9 h-9 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:bg-[#F5F5F5] transition-colors"
        >
          {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5E5E5] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:min-h-screen flex flex-col justify-between ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Logo */}
          <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
            <Link to="/professional/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#111111] flex items-center justify-center text-white shadow-xs">
                <FiTool className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-heading text-xl font-bold tracking-tight text-[#111111]">
                  Fix<span className="text-[#525252]">Up</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#737373]">
                  Professional Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-[#737373] hover:text-[#111111] p-1"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Professional Status Pill */}
          <div className="p-4 mx-4 my-4 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <img
                src={displayPhoto}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-[#E5E5E5]"
                onError={(e) => {
                  e.currentTarget.src = userImg;
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[#111111] truncate">
                  {displayName}
                </h4>
                <p className="text-[11px] text-[#737373] truncate">{displayEmail}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      !isActive
                        ? "bg-[#737373]"
                        : isApproved
                        ? "bg-[#16A34A]"
                        : isCancelled
                        ? "bg-[#DC2626]"
                        : "bg-[#D97706] animate-pulse"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-[#111111]">
                    {!isActive
                      ? "Account Inactive"
                      : isApproved
                      ? "Verified & Live"
                      : isCancelled
                      ? "Verification Rejected"
                      : "Pending Approval"}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval explanation notice */}
            {isPending && isActive && (
              <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] text-[11px] text-[#737373] flex items-start gap-1.5 leading-relaxed">
                <FiAlertCircle className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                <span>Under review by FixUp admin. Your profile will be public once approved.</span>
              </div>
            )}
            {!isActive && (
              <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] text-[11px] text-[#737373] flex items-start gap-1.5 leading-relaxed">
                <FiAlertCircle className="w-3.5 h-3.5 text-[#737373] shrink-0 mt-0.5" />
                <span>Account is currently hidden. Reactivate in Settings to receive bookings.</span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActiveRoute = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActiveRoute
                      ? "bg-[#111111] text-white font-semibold shadow-xs"
                      : "text-[#525252] hover:bg-[#F5F5F5] hover:text-[#111111]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Logout */}
        <div className="p-4 border-t border-[#E5E5E5] space-y-2">
          <Link
            to="/home"
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#525252] hover:text-[#111111] rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <FiHome className="w-4 h-4" />
            <span>FixUp Homepage</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default ProfessionalLayout;
