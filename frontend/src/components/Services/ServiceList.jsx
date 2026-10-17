import React from 'react';
import ServiceCard from './ServiceCard';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';

const sixServices = [
  {
    name: 'Cleaning & Sanitization',
    desc: 'Regular upkeep, deep cleaning, and sanitizing services to keep your home spotless.'
  },
  {
    name: 'Plumbing & Repairs',
    desc: 'Fast leak fixes, pipe installations, and bathroom repairs by certified experts.'
  },
  {
    name: 'Electrical & Lighting',
    desc: 'Wiring, fixture installation, and appliance setup to keep your home powered safely.'
  },
  {
    name: 'Painting & Renovation',
    desc: 'Transform your space with professional interior and exterior painting solutions.'
  },
  {
    name: 'Handyman Services',
    desc: 'Small repairs, furniture assembly, and odd jobs — done quickly and reliably.'
  },
  {
    name: 'Landscaping & Gardening',
    desc: 'Lawn care, garden maintenance, and landscape design for a beautiful outdoor space.'
  },
];

const ServiceList = () => {
  const {
    data: apiServices,
    loading,
    error,
  } = useFetchData(`${BASE_URL}/api/v1/services`);

  // If apiServices is available and non-empty, render the real catalog services
  // Otherwise fallback to default showcase categories
  const servicesToRender =
    Array.isArray(apiServices) && apiServices.length > 0
      ? apiServices.map((svc) => ({
          ...svc,
          name: svc.name,
          desc:
            svc.desc ||
            "FixUp verified trade service specialists providing expert home repair and maintenance.",
        }))
      : sixServices;

  return (
    <div>
      {loading && !apiServices?.length && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-[#EAE7E3] p-7 text-center animate-pulse">
              <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto mb-5" />
              <div className="h-5 bg-gray-100 rounded w-2/3 mx-auto mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mx-auto mb-6" />
              <div className="h-9 bg-gray-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      )}

      {(!loading || apiServices?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesToRender.map((item, index) => (
            <ServiceCard item={item} key={item._id || item.name || index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceList;
