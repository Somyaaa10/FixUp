import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Routers from "../routes/Routers";

const Layout = () => {
  const location = useLocation();
  const isDedicatedPortal =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/") ||
    location.pathname.startsWith("/professional/");

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      {!isDedicatedPortal && <Header />}
      <main className="flex-grow flex flex-col">
        <Routers />
      </main>
      {!isDedicatedPortal && <Footer />}
    </div>
  );
};

export default Layout;
