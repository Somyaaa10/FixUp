import React from 'react';
import { Link } from "react-router-dom";
import { FiMapPin, FiStar } from "react-icons/fi";
import avatarImg from '../../assets/images/avatar-img.png';
import electricianImg from '../../assets/images/electrician-img.jpg';
import plumberImg from '../../assets/images/plumber-img.jpg';
import painterImg from '../../assets/images/painter-img.jpg';
import homeCleanImg from '../../assets/images/homeClean-img.jpg';

const tradeFallbacks = [electricianImg, plumberImg, painterImg, homeCleanImg];

const ProfessionalCard = ({ professional, index = 0 }) => {
  const {
    _id,
    id,
    name,
    avgRating,
    averageRating,
    totalRating,
    photo,
    specialization,
    services,
    ticketPrice,
    city,
    location,
  } = professional || {};

  const profId = _id || id;
  const ratingValue = averageRating !== undefined && averageRating !== null && averageRating > 0
    ? averageRating
    : avgRating && avgRating > 0
    ? avgRating
    : 4.8;
  const ratingCount = totalRating && totalRating > 0 ? totalRating : 80 + (index * 12);

  const fallbackPhoto = tradeFallbacks[index % tradeFallbacks.length];
  const displayPhoto = photo && (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:image'))
    ? photo
    : fallbackPhoto;

  const displaySpecialization =
    specialization ||
    (Array.isArray(services) && services.length > 0 && services[0]?.name ? services[0].name : null) ||
    (index === 0 ? "Electrical Services" : index === 1 ? "Plumbing Services" : index === 2 ? "Painting Services" : "Cleaning Services");
  const displayLocation = location || city || "Pune";

  return (
    <div className="bg-white rounded-3xl border border-[#EAE7E3] p-4 sm:p-5 shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Rectangular Image with Floating Rating Badge */}
        <div className="w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-gray-100 relative">
          <img
            src={displayPhoto}
            alt={name ? `${name} - ${displaySpecialization} Professional` : "FixUp Home Service Professional"}
            width={400}
            height={300}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackPhoto || avatarImg;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Floating Rating Badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-soft flex items-center gap-1 border border-[#EAE7E3]/60">
            <FiStar className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[11px] font-bold text-[#202124]">
              {Number(ratingValue).toFixed(1)}
            </span>
            <span className="text-[10px] text-[#6B7280]">
              ({ratingCount})
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          <h4 className="font-heading font-bold text-[#202124] text-base group-hover:text-[#AD7B5D] transition-colors truncate">
            {name || "Verified Professional"}
          </h4>

          <p className="text-xs text-[#6B7280] mt-0.5">
            {displaySpecialization}
          </p>

          <div className="flex items-center gap-1 text-[11px] text-[#6B7280] mt-2">
            <FiMapPin className="w-3 h-3 text-[#AD7B5D] shrink-0" />
            <span>{displayLocation}</span>
          </div>
        </div>
      </div>

      {/* Price & View Details Action */}
      <div className="mt-5 pt-3.5 border-t border-[#EAE7E3] flex items-center justify-between">
        <div className="text-xs text-[#6B7280]">
          <span className="font-heading font-bold text-sm text-[#202124]">
            ₹{ticketPrice || 500}
          </span>
          <span className="text-[11px] text-[#6B7280] font-normal ml-1">
            / visit
          </span>
        </div>

        <Link
          to={`/professionals/${profId}`}
          className="bg-[#AD7B5D] hover:bg-[#8F6248] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-soft transition-colors"
        >
          View details
        </Link>
      </div>
    </div>
  );
};

export default ProfessionalCard;