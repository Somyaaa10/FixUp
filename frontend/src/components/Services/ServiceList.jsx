import React from 'react';
import ServiceCard from './ServiceCard';
import useFetchData from '../../hooks/useFetchData';

const ServiceList = () => {
  const {
    data: services,
    loading,
    error,
  } = useFetchData(`${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/v1/services`);

  return (
    <div>
      {loading && <p className="text-center font-semibold text-textColor py-5">Loading services...</p>}
      {error && <p className="text-center text-red-500 font-semibold py-5">Unable to load services. Please try again.</p>}
      {!loading && !error && (!services || services.length === 0) && (
        <p className="text-center text-textColor font-semibold py-5">No services available at the moment.</p>
      )}

      {!loading && !error && services && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-[30px] mt-[30px] lg:mt-[55px]">
          {services.map((item, index) => (
            <ServiceCard item={item} index={index} key={item._id || index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceList;
