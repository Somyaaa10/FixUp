import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProfessionalCard from "./../../components/Professional/ProfessionalCard";
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../config';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';

const Professionals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';
  const urlCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);

  useEffect(() => {
    const currentQ = searchParams.get('query') || '';
    const currentCat = searchParams.get('category') || '';
    setSearchQuery(currentQ);
    setQuery(currentQ);
    setSelectedCategory(currentCat);
  }, [searchParams]);

  // Fetch available services for category filtering pills
  const { data: servicesData } = useFetchData(`${BASE_URL}/api/v1/services`);

  // Build query URL combining search and category filters
  const urlParams = [];
  if (query.trim()) urlParams.push(`query=${encodeURIComponent(query.trim())}`);
  if (selectedCategory.trim()) urlParams.push(`category=${encodeURIComponent(selectedCategory.trim())}`);
  const fetchUrl = urlParams.length > 0
    ? `${BASE_URL}/api/v1/professionals?${urlParams.join('&')}`
    : `${BASE_URL}/api/v1/professionals`;

  const {
    data: professionals,
    loading,
    error,
  } = useFetchData(fetchUrl);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setQuery(trimmed);
    const newParams = {};
    if (trimmed) newParams.query = trimmed;
    if (selectedCategory) newParams.category = selectedCategory;
    setSearchParams(newParams);
  };

  const handleSelectCategory = (catName) => {
    const newCat = catName === "All" || catName === selectedCategory ? "" : catName;
    setSelectedCategory(newCat);
    const newParams = {};
    if (query) newParams.query = query;
    if (newCat) newParams.category = newCat;
    setSearchParams(newParams);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setQuery('');
    setSelectedCategory('');
    setSearchParams({});
  };

  const handleClearQuery = () => {
    setSearchQuery('');
    setQuery('');
    const newParams = {};
    if (selectedCategory) newParams.category = selectedCategory;
    setSearchParams(newParams);
  };

  const handleClearCategory = () => {
    setSelectedCategory('');
    const newParams = {};
    if (query) newParams.query = query;
    setSearchParams(newParams);
  };

  return (
    <div className="bg-[#F7F7F6] min-h-screen">
      {/* Header Search Section */}
      <section className="bg-[#F7F7F6] border-b border-[#EAE7E3] py-14">
        <div className="container text-center max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#AD7B5D] bg-[#AD7B5D]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Verified Directory
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
            Find Skilled Professionals
          </h1>
          <p className="text-[#6B7280] text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Browse verified experts across plumbing, electrical, carpentry, cleaning, and more.
          </p>

          {/* Search Input Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 bg-white border border-[#EAE7E3] rounded-full p-1.5 pl-5 shadow-soft flex items-center gap-2 max-w-xl mx-auto focus-within:ring-2 focus-within:ring-[#AD7B5D]/20 focus-within:border-[#AD7B5D] transition"
          >
            <FiSearch className="w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              className="py-2.5 px-2 bg-transparent w-full focus:outline-none text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60"
              placeholder="Search by name, trade or skill (e.g. Rohan, Wiring, Leak)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="text-[#6B7280] hover:text-[#202124] p-1"
                aria-label="Clear search text"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="bg-[#202124] hover:bg-black text-white font-heading font-medium text-xs sm:text-sm px-6 py-2.5 rounded-full transition-colors"
            >
              Search
            </button>
          </form>

          {/* Category Filter Pills */}
          <div className="mt-6 flex items-center justify-center flex-wrap gap-2 max-w-2xl mx-auto">
            <button
              onClick={() => handleSelectCategory("All")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !selectedCategory
                  ? "bg-[#202124] text-white shadow-soft"
                  : "bg-white text-[#6B7280] border border-[#EAE7E3] hover:text-[#202124] hover:border-gray-400"
              }`}
            >
              All Categories
            </button>
            {Array.isArray(servicesData) &&
              servicesData.map((svc) => (
                <button
                  key={svc._id || svc.name}
                  onClick={() => handleSelectCategory(svc.name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory && selectedCategory.toLowerCase() === svc.name.toLowerCase()
                      ? "bg-[#AD7B5D] text-white shadow-soft"
                      : "bg-white text-[#6B7280] border border-[#EAE7E3] hover:text-[#202124] hover:border-gray-400"
                  }`}
                >
                  {svc.name}
                </button>
              ))}
          </div>

          {/* Active Filter Tags Strip */}
          {(query || selectedCategory) && (
            <div className="mt-5 flex items-center justify-center flex-wrap gap-2 text-xs text-[#6B7280]">
              <span className="font-medium">Active Filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#AD7B5D]/10 text-[#AD7B5D] font-semibold border border-[#AD7B5D]/20">
                  <span>Category: {selectedCategory}</span>
                  <button onClick={handleClearCategory} className="hover:text-black" title="Remove category filter">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {query && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-semibold border border-gray-200">
                  <span>Search: "{query}"</span>
                  <button onClick={handleClearQuery} className="hover:text-black" title="Remove search filter">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearAll}
                className="text-[#AD7B5D] hover:underline font-semibold text-xs ml-1"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Directory Grid */}
      <section className="py-14 bg-white">
        <div className="container">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-3xl border border-[#EAE7E3] p-5 animate-pulse">
                  <div className="w-full h-48 bg-gray-100 rounded-2xl mb-4" />
                  <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="pt-4 border-t border-[#EAE7E3] flex justify-between items-center">
                    <div className="h-5 bg-gray-100 rounded w-16" />
                    <div className="h-8 bg-gray-100 rounded-full w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12 max-w-md mx-auto">
              <p className="text-[#D84A4A] font-medium text-sm mb-2">
                Unable to load professionals. Please try again.
              </p>
              <button
                onClick={() => setQuery(searchQuery)}
                className="text-[#AD7B5D] text-xs font-semibold hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (!professionals || professionals.length === 0) && (
            <div className="text-center py-16 max-w-md mx-auto">
              <h3 className="font-heading text-lg font-bold text-[#202124]">
                No active professionals found
              </h3>
              <p className="text-[#6B7280] text-xs sm:text-sm mt-1.5 leading-relaxed">
                We couldn't find any verified professionals matching{" "}
                {selectedCategory ? `category "${selectedCategory}"` : ""}
                {selectedCategory && query ? " and " : ""}
                {query ? `search "${query}"` : ""}. Try adjusting your filters or selecting another trade category.
              </p>
              {(query || selectedCategory) && (
                <button
                  onClick={handleClearAll}
                  className="mt-5 bg-[#202124] hover:bg-black text-white font-heading text-xs font-semibold px-6 py-2.5 rounded-full transition shadow-soft"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}

          {!loading && !error && professionals && professionals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {professionals.map((professional, idx) => (
                <ProfessionalCard
                  key={professional._id || professional.id || idx}
                  professional={professional}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Professionals;
