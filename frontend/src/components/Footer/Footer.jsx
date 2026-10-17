import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FiTool, FiMail, FiMapPin } from 'react-icons/fi';
import {
  RiFacebookFill,
  RiInstagramLine,
  RiLinkedinFill,
  RiYoutubeFill
} from 'react-icons/ri';

const quickLinks = [
  { path: '/home', display: 'Home' },
  { path: '/services', display: 'Services' },
  { path: '/professionals', display: 'Professionals' },
  { path: '/contact', display: 'Contact' },
];

const serviceLinks = [
  { path: '/professionals?query=Cleaning', display: 'Cleaning & Sanitization' },
  { path: '/professionals?query=Plumbing', display: 'Plumbing & Repairs' },
  { path: '/professionals?query=Electrical', display: 'Electrical & Lighting' },
  { path: '/professionals?query=Painting', display: 'Painting & Renovation' },
  { path: '/professionals?query=Handyman', display: 'Handyman Services' },
  { path: '/professionals?query=Landscaping', display: 'Landscaping & Gardening' },
];

const Footer = () => {
  const { user, token, role } = useContext(AuthContext);
  const accountPath =
    role === "admin"
      ? "/admin"
      : role === "professional"
      ? "/professional/dashboard"
      : "/users/profile/me";

  return (
    <footer className="bg-white border-t border-[#EAE7E3] pt-16 pb-12 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/home" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#202124] flex items-center justify-center text-white">
                <FiTool className="w-4 h-4 text-[#AD7B5D]" />
              </div>
              <span className="font-heading text-2xl font-bold tracking-tight text-[#202124]">
                Fix<span className="text-[#AD7B5D]">Up</span>
              </span>
            </Link>
            <p className="text-[#6B7280] text-xs sm:text-sm leading-relaxed max-w-sm mb-4">
              FixUp is your trusted on-demand home services platform. From quick plumbing fixes to complete home painting, book vetted professionals with guaranteed quality.
            </p>
            <div className="flex items-center gap-2.5 text-[#202124]">
              <a
                href="#social"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-[#F7F7F6] hover:bg-[#202124] hover:text-white flex items-center justify-center transition border border-[#EAE7E3]"
              >
                <RiFacebookFill className="w-4 h-4" />
              </a>
              <a
                href="#social"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-[#F7F7F6] hover:bg-[#202124] hover:text-white flex items-center justify-center transition border border-[#EAE7E3]"
              >
                <RiInstagramLine className="w-4 h-4" />
              </a>
              <a
                href="#social"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-full bg-[#F7F7F6] hover:bg-[#202124] hover:text-white flex items-center justify-center transition border border-[#EAE7E3]"
              >
                <RiLinkedinFill className="w-4 h-4" />
              </a>
              <a
                href="#social"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-[#F7F7F6] hover:bg-[#202124] hover:text-white flex items-center justify-center transition border border-[#EAE7E3]"
              >
                <RiYoutubeFill className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="font-heading text-sm font-bold text-[#202124] mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-[#6B7280]">
              {quickLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="hover:text-[#AD7B5D] transition-colors"
                  >
                    {item.display}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Links */}
          <div className="lg:col-span-3">
            <h4 className="font-heading text-sm font-bold text-[#202124] mb-4">
              Our Services
            </h4>
            <ul className="space-y-2.5 text-xs text-[#6B7280]">
              {serviceLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="hover:text-[#AD7B5D] transition-colors"
                  >
                    {item.display}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account & Contact Column */}
          <div className="lg:col-span-3">
            <h4 className="font-heading text-sm font-bold text-[#202124] mb-4">
              Contact & Account
            </h4>
            <div className="space-y-2.5 text-xs text-[#6B7280] mb-4">
              <div className="flex items-center gap-2">
                <FiMail className="w-3.5 h-3.5 text-[#AD7B5D] shrink-0" />
                <span>support@fixup.com</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5 text-[#AD7B5D] shrink-0" />
                <span>Available across Major Metro Cities</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-[#6B7280] pt-2 border-t border-[#EAE7E3]">
              {token && user ? (
                <>
                  <li>
                    <Link to={accountPath} className="hover:text-[#AD7B5D] font-medium transition-colors">
                      My Profile & Bookings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-[#AD7B5D] transition-colors">
                      Customer & Professional Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-[#AD7B5D] transition-colors">
                      Join as a Professional
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom divider and copyright */}
        <div className="border-t border-[#EAE7E3] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <p>© 2026 FixUp. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="hover:text-[#202124] transition">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-[#202124] transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
