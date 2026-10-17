import { useEffect, useRef, useState, useContext } from 'react';
import userImg from '../../assets/images/avatar-img.png';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { BiMenu, BiX } from "react-icons/bi";
import { FiTool } from "react-icons/fi";
import { AuthContext } from '../../context/AuthContext';

const navLinks = [
  { path: '/home', display: 'Home' },
  { path: '/services', display: 'Services' },
  { path: '/professionals', display: 'Professionals' },
  { path: '/contact', display: 'Contact' },
];

const Header = () => {
  const headerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, token, role, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleStickyHeader = () => {
    if (window.scrollY > 30) {
      if (headerRef.current) {
        headerRef.current.classList.add('shadow-soft');
      }
    } else {
      if (headerRef.current) {
        headerRef.current.classList.remove('shadow-soft');
      }
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleStickyHeader);
    return () => window.removeEventListener('scroll', handleStickyHeader);
  }, []);

  const profilePath =
    role === "admin"
      ? "/admin"
      : role === "professional"
      ? "/professional/dashboard"
      : "/users/profile/me";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 bg-[#F7F7F6]/95 backdrop-blur-md border-b border-[#EAE7E3] transition-all duration-200"
    >
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo matching reference */}
          <Link to="/home" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-[#202124] flex items-center justify-center text-white">
              <FiTool className="w-4 h-4 text-[#AD7B5D]" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight text-[#202124]">
              Fix<span className="text-[#AD7B5D]">Up</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  isActive
                    ? "font-heading text-sm font-semibold text-[#202124] transition-all"
                    : "font-heading text-sm font-medium text-[#6B7280] hover:text-[#202124] transition-all"
                }
              >
                {link.display}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Auth Buttons */}
            {token && user ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to={profilePath}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white border border-[#EAE7E3] hover:border-gray-300 shadow-soft transition"
                  title="My Account"
                >
                  <img
                    src={user?.photo || userImg}
                    alt={user?.name || "User"}
                    className="w-7 h-7 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = userImg; }}
                  />
                  <span className="font-heading text-xs font-semibold text-[#202124] max-w-[100px] truncate">
                    {user?.name || "Account"}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#D84A4A] border border-[#EAE7E3] rounded-full hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link to="/login">
                  <button className="text-[#202124] hover:text-[#AD7B5D] font-heading font-medium text-xs px-3.5 py-2 transition">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="border border-[#EAE7E3] hover:border-gray-400 bg-white text-[#202124] font-heading font-medium text-xs px-4 py-2 rounded-full transition shadow-soft">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}


            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden w-10 h-10 rounded-full border border-[#EAE7E3] bg-white flex items-center justify-center text-[#202124] hover:bg-gray-50"
            >
              {isMenuOpen ? <BiX className="w-5 h-5" /> : <BiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#EAE7E3] bg-[#F7F7F6] shadow-card animate-in fade-in duration-150">
          <div className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleNavClick}
                className="font-heading text-sm font-medium text-[#202124] hover:bg-white px-4 py-2.5 rounded-xl transition"
              >
                {link.display}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-[#EAE7E3] flex flex-col gap-2">
              {token && user ? (
                <>
                  <Link
                    to={profilePath}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-[#EAE7E3]"
                  >
                    <img
                      src={user?.photo || userImg}
                      alt={user?.name || "User"}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.src = userImg; }}
                    />
                    <div>
                      <p className="font-heading text-sm font-semibold text-[#202124]">{user?.name || "My Account"}</p>
                      <p className="text-xs text-[#6B7280] capitalize">{role || "User"}</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left font-heading text-xs font-semibold text-[#D84A4A] hover:bg-red-50 px-4 py-2 rounded-xl transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center bg-white border border-[#EAE7E3] text-[#202124] font-heading font-medium text-xs py-2.5 rounded-full"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center bg-[#AD7B5D] text-white font-heading font-medium text-xs py-2.5 rounded-full shadow-soft"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
