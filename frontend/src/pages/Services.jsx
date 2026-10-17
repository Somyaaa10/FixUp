import React from 'react';
import ServiceList from "../components/Services/ServiceList";

const Services = () => {
  return (
    <div className="bg-[#F7F7F6] min-h-screen">
      <section className="bg-[#F7F7F6] border-b border-[#EAE7E3] py-14">
        <div className="container text-center max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#AD7B5D] bg-[#AD7B5D]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Service Catalog
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
            Professional Home Services
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-2">
            Explore our comprehensive range of home maintenance, installation, and repair services provided by verified trade specialists.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container">
          <ServiceList />
        </div>
      </section>
    </div>
  );
};

export default Services;