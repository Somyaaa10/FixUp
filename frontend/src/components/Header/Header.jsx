import { useEffect, useRef, useState, useContext } from 'react';
import logo from '../../assets/images/Fixup-1.svg';
import userImg from '../../assets/images/avatar-img.png';
import { NavLink, Link } from 'react-router-dom';
import { BiMenu, BiMoon, BiSun } from "react-icons/bi";
import { AuthContext } from '../../context/AuthContext';

const navLinks = [
  {
    path: '/home',
    display: 'Home'
  },
  {
    path: '/professionals',
    display: 'Find a Professional'
  },
  {
    path: '/services',
    display: 'Services'
  },
  {
    path: '/contact',
    display: 'Contact Us'
  }
];

const Header = () => {
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const [theme, setTheme] = useState('light');
  const { user, token, role, dispatch } = useContext(AuthContext);

  const handleStickyHeader = () => {
    window.addEventListener('scroll', () => {
      if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
        if (headerRef.current) headerRef.current.classList.add('sticky_header');
      } else {
        if (headerRef.current) headerRef.current.classList.remove('sticky_header');
      }
    });
  };

  const toggleMenu = () => menuRef.current.classList.toggle('show_menu');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
    if (headerRef.current) headerRef.current.classList.toggle('dark-theme', newTheme === 'dark');
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  useEffect(() => {
    handleStickyHeader();
    return () => window.removeEventListener('scroll', handleStickyHeader);
  });

  return (
    <header className="header flex items-center" ref={headerRef}>
      <div className="container">
        <div className="flex items-center justify-between">
          {/*=========== logo ============== */}
          <div>
            <Link to="/home">
              <img src={logo} alt="FixUp Logo" />
            </Link>
          </div>

          {/* ======= menu ========= */}
          <div className="navigation" ref={menuRef} onClick={toggleMenu}>
            <ul className="menu flex items-center gap-[2.7rem]">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <NavLink
                    to={link.path}
                    className={navClass =>
                      navClass.isActive
                        ? "text-primaryColor text-[16px] leading-7 font-[600]"
                        : " text-[16px] leading-7 font-[500] hover:text-primaryColor"
                    }
                  >
                    {link.display}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ========== nav right =========== */}
          <div className="flex items-center gap-4">
            {token && user ? (
              <div className="flex items-center gap-3">
                <Link to={role === 'professional' ? '/professionals/profile/me' : '/users/profile/me'}>
                  <figure className="w-[35px] h-[35px] rounded-full">
                    <img src={user?.photo || userImg} className="w-full h-full rounded-full object-cover" alt={user?.name || "User"} />
                  </figure>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 py-1 px-3 text-white text-[14px] font-[500] rounded-md hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="bg-primaryColor py-2 px-6 text-white font-[600] h-[44px] flex items-center justify-center rounded-[50px]">
                  LogIn
                </button>
              </Link>
            )}

            <button onClick={toggleTheme} className="bg-transparent text-[20px]">
              {theme === 'light' ? <BiMoon /> : <BiSun />}
            </button>

            <span className="md:hidden" onClick={toggleMenu}>
              <BiMenu className="w-6 h-6 cursor-pointer" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
