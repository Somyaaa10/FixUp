import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiStar, FiArrowRight } from 'react-icons/fi';
import { BiCheckShield, BiSolidStar, BiCalendarCheck } from 'react-icons/bi';

// Assets
import heroBgImg from '../assets/images/hero-sink-plumber.webp';
import cleaningWorkerImg from '../assets/images/homeClean-img.jpg';
import plumbersWorkingImg from '../assets/images/plumber-img.jpg';
import customer1Avatar from '../assets/images/customer1-avatar.png';
import customer2Avatar from '../assets/images/customer2-avatar.png';
import customer3Avatar from '../assets/images/customer3-avatar.png';

// Components
import ServiceList from '../components/Services/ServiceList';

const testimonials = [
  {
    name: 'Daniel K.',
    avatar: customer1Avatar,
    rating: 5,
    text: 'Quick, reliable, and professional! I booked an AC repair online and within 30 minutes the technician arrived, identified the issue, and fixed it right away.'
  },
  {
    name: 'Sarah M.',
    avatar: customer2Avatar,
    rating: 5,
    text: 'The cleaning team exceeded my expectations. They arrived on time, worked with attention to detail, and left my entire home sparkling clean. It honestly feels like I\'m living in a brand-new house.'
  },
  {
    name: 'Priya S.',
    avatar: customer3Avatar,
    rating: 5,
    text: 'What I appreciate most is the combination of affordable pricing and trustworthy professionals. They explained everything clearly, charged exactly what was promised.'
  }
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/professionals?query=${encodeURIComponent(query)}`);
    } else {
      navigate('/professionals');
    }
  };

  return (
    <div className="bg-[#F7F7F6]">
      {/* ========================================================
          1. HERO SECTION: FULL-WIDTH BACKGROUND HERO
          ======================================================== */}
      <section
        className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center bg-cover bg-no-repeat bg-[78%_center] sm:bg-center overflow-hidden py-16 sm:py-20 lg:py-28"
        style={{ backgroundImage: `url(${heroBgImg})` }}
      >
        {/* Dark Gradient Overlay: Strongest on the left, fading toward the right */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(20, 20, 20, 0.92) 0%, rgba(20, 20, 20, 0.76) 42%, rgba(20, 20, 20, 0.35) 80%, rgba(20, 20, 20, 0.18) 100%)',
          }}
        />
        {/* Mobile Contrast Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-black/25 sm:bg-transparent"
        />

        <div className="container relative z-10">
          <div className="max-w-xl lg:max-w-2xl text-left">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[58px] xl:text-[64px] font-bold text-white tracking-tight leading-[1.12]">
              Reliable Home <br />
              Services, Right at <br />
              <span className="text-[#C48B69]">your doorstep</span>
            </h1>

            <p className="text-gray-200/90 text-sm sm:text-base lg:text-[17px] mt-5 max-w-xl leading-relaxed">
              From Cleaning And Repairs To Expert Maintenance — Book Trusted Professionals With Just A Click.
            </p>

            {/* Service Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 bg-white rounded-full p-1.5 pl-5 shadow-2xl flex items-center gap-2 max-w-md sm:max-w-lg w-full focus-within:ring-2 focus-within:ring-[#AD7B5D]/40 transition"
            >
              <FiSearch className="w-5 h-5 text-[#6B7280] shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a service"
                aria-label="Search for a service"
                className="w-full text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/70 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#AD7B5D] hover:bg-[#8F6248] text-white font-heading font-medium text-xs sm:text-sm px-6 sm:px-8 py-3 rounded-full transition-all duration-200 shadow-soft shrink-0"
              >
                Search
              </button>
            </form>

            {/* Trust and Rating Badges */}
            <div className="mt-8 sm:mt-10 flex items-center flex-wrap gap-6 sm:gap-9 text-white select-none">
              <div className="flex items-center gap-2.5">
                <BiCheckShield className="w-7 h-7 text-white/90 shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-[13px] font-medium leading-snug text-white/95">
                  Verified <br /> Professionals
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <BiSolidStar className="w-6 h-6 text-white/90 shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-[13px] font-medium leading-snug text-white/95">
                  4.9+ <br /> Average Rating
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <BiCalendarCheck className="w-6 h-6 text-white/90 shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-[13px] font-medium leading-snug text-white/95">
                  Easy <br /> Online Booking
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. STATISTICS BENTO GRID: TRUSTED BY THOUSANDS
          ======================================================== */}
      <section className="py-14 sm:py-18 bg-white border-y border-[#EAE7E3]">
        <div className="container">
          {/* Header row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
            <div className="lg:col-span-6">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124] tracking-tight">
                Trusted By Thousands <br />
                Of Homeowners.
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p className="text-[#6B7280] text-xs sm:text-sm leading-relaxed max-w-xl">
                For Years, We've Been Helping Families Take Care Of Their Homes By Providing Reliable, Professional Services That Make Life Easier And More Convenient. Our Mission Is To Simplify Home Maintenance.
              </p>
            </div>
          </div>

          {/* 6-Item Bento Grid matching reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Pastel Yellow (Homes Served) */}
            <div className="bg-[#FEF9E7] border border-[#FDE68A]/50 rounded-3xl p-7 flex flex-col justify-between min-h-[190px] shadow-soft">
              <div>
                <h3 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
                  15k+
                </h3>
                <p className="text-xs font-semibold text-[#202124] mt-1">
                  Homes Served
                </p>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Across Multiple Cities And Neighborhoods
              </p>
            </div>

            {/* Card 2: Pastel Peach (On-Time Service) */}
            <div className="bg-[#FDF2F0] border border-[#FECDD3]/50 rounded-3xl p-7 flex flex-col justify-between min-h-[190px] shadow-soft">
              <div>
                <h3 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
                  95%
                </h3>
                <p className="text-xs font-semibold text-[#202124] mt-1">
                  On-Time Service
                </p>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                We Value Your Time And Deliver As Promised
              </p>
            </div>

            {/* Card 3: Photo Card 1 */}
            <div className="rounded-3xl overflow-hidden bg-gray-100 border border-[#EAE7E3] h-[190px] shadow-soft">
              <img
                src={cleaningWorkerImg}
                alt="FixUp verified home cleaning technicians on task"
                width={1200}
                height={801}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Card 4: Photo Card 2 */}
            <div className="rounded-3xl overflow-hidden bg-gray-100 border border-[#EAE7E3] h-[190px] shadow-soft">
              <img
                src={plumbersWorkingImg}
                alt="FixUp certified plumbing specialists repairing household fixtures"
                width={1200}
                height={828}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Card 5: Pastel Mint (Certified Professionals) */}
            <div className="bg-[#EFFBF5] border border-[#A7F3D0]/50 rounded-3xl p-7 flex flex-col justify-between min-h-[190px] shadow-soft">
              <div>
                <h3 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
                  500+
                </h3>
                <p className="text-xs font-semibold text-[#202124] mt-1">
                  Certified Professionals
                </p>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Skilled, Trained, And Background-Checked
              </p>
            </div>

            {/* Card 6: Pastel Sky Blue (Customer Rating) */}
            <div className="bg-[#F0F8FF] border border-[#BAE6FD]/50 rounded-3xl p-7 flex flex-col justify-between min-h-[190px] shadow-soft">
              <div>
                <h3 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
                  4.9/5
                </h3>
                <p className="text-xs font-semibold text-[#202124] mt-1">
                  Customer Rating
                </p>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Based On Thousands Of Verified Reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SERVICES SECTION (6 CARDS WITH PASTEL ICON CIRCLES)
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-[#F7F7F6]">
        <div className="container">
          <div className="max-w-xl mx-auto text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
              What do you need help with?
            </h2>
            <p className="text-[#6B7280] text-sm mt-2.5">
              Choose from our popular categories of home maintenance, repairs, and sanitization services.
            </p>
          </div>

          <ServiceList />
        </div>
      </section>



      {/* ========================================================
          5. TESTIMONIALS: LOVED BY THOUSANDS OF HAPPY HOMEOWNERS
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-[#F7F7F6]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
            <div className="lg:col-span-6">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124] tracking-tight">
                Loved By Thousands Of <br />
                Happy Homeowners
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p className="text-[#6B7280] text-xs sm:text-sm leading-relaxed max-w-xl">
                "Every day, families rely on us to handle their cleaning, repairs, and home maintenance needs with care and professionalism — that's why thousands of homeowners continue to choose and recommend our services."
              </p>
            </div>
          </div>

          {/* 3 Review Cards matching reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((review, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#EAE7E3] p-7 shadow-soft flex flex-col justify-between"
              >
                <p className="text-xs sm:text-sm text-[#202124] leading-relaxed">
                  "{review.text}"
                </p>

                <div className="mt-6 pt-4 border-t border-[#EAE7E3] flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={`${review.name}'s customer profile avatar`}
                    width={36}
                    height={36}
                    loading="lazy"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h5 className="font-heading text-xs font-bold text-[#202124]">
                      {review.name}
                    </h5>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(review.rating)].map((_, idx) => (
                        <FiStar key={idx} className="w-3 h-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FINAL CTA: NEED HELP TODAY?
          ======================================================== */}
      <section className="py-12 sm:py-16 bg-[#F7F7F6]">
        <div className="container max-w-4xl">
          <div className="bg-[#EBF3EF]/60 border border-[#D1FAE5]/60 rounded-3xl p-10 sm:p-14 text-center shadow-soft">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#202124]">
              Need Help Today? We're Just <br className="hidden sm:inline" />
              A Click Away.
            </h2>
            <p className="text-[#6B7280] text-xs sm:text-sm mt-3 max-w-md mx-auto leading-relaxed">
              Order Now And Experience Delivery The Way It Should Be - Fast, Safe, And Simple.
            </p>
            <div className="mt-7">
              <Link to="/professionals">
                <button className="bg-[#202124] hover:bg-black text-white font-heading font-medium text-xs sm:text-sm px-8 py-3.5 rounded-full transition shadow-soft inline-flex items-center gap-2">
                  <span>Book A Service Now</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;