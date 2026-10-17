import React, { useState, useContext, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import userImg from "../../assets/images/avatar-img.png";
import {
  FiGrid,
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiTool,
  FiMail,
  FiLogOut,
  FiMenu,
  FiX,
  FiHome,
  FiShield,
} from "react-icons/fi";

const adminNavItems = [
  { path: "/admin", label: "Overview", icon: FiGrid, exact: true },
  { path: "/admin/users", label: "User Management", icon: FiUsers },
  { path: "/admin/professionals", label: "Professionals", icon: FiBriefcase },
  { path: "/admin/bookings", label: "Bookings", icon: FiCalendar },
  { path: "/admin/services", label: "Services Catalog", icon: FiTool },
  { path: "/admin/contact-messages", label: "Contact Inbox", icon: FiMail },
];

const AdminLayout = ({ children, title, subtitle, actionButton }) => {
  const { user, token, dispatch } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingProfsCount, setPendingProfsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch quick notification counts for badges (non-blocking)
  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      if (!token) return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [msgRes, statsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/v1/admin/contact-messages?limit=1`, { headers }),
          fetch(`${BASE_URL}/api/v1/admin/dashboard`, { headers }),
        ]);

        if (isMounted && msgRes.ok) {
          const msgData = await msgRes.json();
          if (msgData?.pagination?.unread !== undefined) {
            setUnreadCount(msgData.pagination.unread);
          }
        }

        if (isMounted && statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData?.data?.professionals?.pending !== undefined) {
            setPendingProfsCount(statsData.data.professionals.pending);
          }
        }
      } catch (e) {
        // Silently catch badge errors
      }
    };

    fetchBadges();
    return () => {
      isMounted = false;
    };
  }, [token, location.pathname]);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login", { replace: true });
  };

  const displayName = user?.name || "Administrator";
  const displayEmail = user?.email || "admin@fixup.com";
  const displayPhoto = user?.photo || userImg;

  return (
    <div className="bg-[#F5F5F5] min-h-screen text-[#111111] flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-white border-b border-[#E5E5E5] px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white">
            <FiShield className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-[#111111]">
            FixUp <span className="text-xs font-semibold px-2 py-0.5 bg-[#111111] text-white rounded-full ml-1">Admin</span>
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
          {/* Brand Header */}
          <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#111111] flex items-center justify-center text-white shadow-xs">
                <FiShield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-heading text-xl font-bold tracking-tight text-[#111111]">
                  Fix<span className="text-[#525252]">Up</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#737373]">
                  Admin Console
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

          {/* Admin Profile Badge */}
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
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span className="text-[10px] font-medium text-[#111111]">
                    Super Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 py-1 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActiveRoute = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActiveRoute
                      ? "bg-[#111111] text-white font-semibold"
                      : "text-[#525252] hover:bg-[#F5F5F5] hover:text-[#111111]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {/* Badges for pending / unread */}
                  {item.path === "/admin/contact-messages" && unreadCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActiveRoute
                          ? "bg-white text-[#111111]"
                          : "bg-[#111111] text-white"
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                  {item.path === "/admin/professionals" && pendingProfsCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActiveRoute
                          ? "bg-white text-[#111111]"
                          : "bg-[#D97706] text-white"
                      }`}
                    >
                      {pendingProfsCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
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

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {(title || actionButton) && (
          <div className="mb-6 pb-5 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] bg-white border border-[#E5E5E5] px-2.5 py-0.5 rounded-md inline-block mb-1.5">
                Admin Console
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-[#737373] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            {actionButton && <div>{actionButton}</div>}
          </div>
        )}

        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
