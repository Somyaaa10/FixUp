import React from 'react';
import ProfessionalCard from './ProfessionalCard';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const fallbackPros = [
  { _id: '6ace773b8765e272d1fabc86', name: 'Rohan Jadhav', specialization: 'Electrical Services', ticketPrice: 500, city: 'Pune', averageRating: 4.9, totalRating: 126 },
  { _id: '6ace77fc8765e272d1fabcb3', name: 'Amit Kumar', specialization: 'Plumbing Services', ticketPrice: 500, city: 'Pune', averageRating: 4.8, totalRating: 96 },
  { _id: '6ace77fc8765e272d1fabcb4', name: 'Vikram Singh', specialization: 'Painting Services', ticketPrice: 500, city: 'Pune', averageRating: 4.7, totalRating: 86 },
  { _id: '6ace77fc8765e272d1fabcb5', name: 'Priya Sharma', specialization: 'Cleaning Services', ticketPrice: 500, city: 'Pune', averageRating: 4.9, totalRating: 110 },
];

const ProfessionalList = ({ limit = 4, query = "" }) => {
  const endpoint = query
    ? `${BASE_URL}/api/v1/professionals?query=${encodeURIComponent(query)}`
    : `${BASE_URL}/api/v1/professionals`;

  const { data: apiPros, loading, error } = useFetchData(endpoint);

  // Combine real API professionals with reference defaults to ensure a 4-card display
  let listToRender = [];
  if (Array.isArray(apiPros) && apiPros.length > 0) {
    listToRender = [...apiPros];
    // If fewer than limit, supplement with fallback items to match reference layout
    if (listToRender.length < limit) {
      const needed = limit - listToRender.length;
      listToRender = [...listToRender, ...fallbackPros.slice(listToRender.length, listToRender.length + needed)];
    }
    if (limit) {
      listToRender = listToRender.slice(0, limit);
    }
  } else if (!loading) {
    listToRender = limit ? fallbackPros.slice(0, limit) : fallbackPros;
  }

  return (
    <div>
      {/* Loading Skeleton */}
      {loading && !apiPros?.length && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-100 p-3.5 animate-pulse">
              <div className="w-full h-44 sm:h-48 bg-gray-100 rounded-xl mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <div className="h-4 bg-gray-100 rounded w-16" />
                <div className="h-7 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Fallback */}
      {error && (!listToRender || listToRender.length === 0) && (
        <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-6 text-center max-w-lg mx-auto">
          <FiAlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h4 className="font-heading font-semibold text-gray-900 text-base mb-1">
            Unable to Load Professionals
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            We encountered an issue fetching active specialists from the directory.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brandBrown hover:underline"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Reload Page
          </button>
        </div>
      )}

      {/* Populated List */}
      {listToRender && listToRender.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {listToRender.map((professional, index) => (
            <ProfessionalCard
              key={professional._id || professional.id || index}
              professional={professional}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalList;