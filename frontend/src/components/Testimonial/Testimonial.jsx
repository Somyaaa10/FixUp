import React from 'react';
import {Pagination} from 'swiper';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import customer1Avatar from './../../assets/images/customer1-avatar.png';
import customer2Avatar from './../../assets/images/customer2-avatar.png';
import customer3Avatar from './../../assets/images/customer3-avatar.png';
import customer4Avatar from './../../assets/images/customer4-avatar.png';
import {HiStar} from 'react-icons/hi';``

const Testimonial = () => {
  return (
    <div className='mt-[30px] lg:mt-[55px]'>
        <Swiper modules={[Pagination]} spaceBetween={30} slidesPerView={1} pagination={{clickable:true}} 
        breakpoints={{
            640:{
                slidesPerView: 1,
                spaceBetween: 0,
            },
            768:{
                slidesPerView: 2,
                spaceBetween: 20,
            },
            1024:{
                slidesPerView: 3,
                spaceBetween: 30,
            },
        }}>
         <SwiperSlide>
            <div className='py-[30px] px-5 rounded-3'>
                <div className='flex items-center gap-[13px]'>
                    <img src={customer1Avatar} alt-="" />
                    <div>
                        <h4 className='text-[18px] leading-[30px] font-semibold text-headingColor'>
                            Muhibur Rahman
                        </h4>
                        <div className='flex items-center gap-[2px]'>
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                        </div>
                    </div>
                </div>
                <p className='text-[16px] leading-7 mt-4 text-textColor font-[400]'>
                    "I have taken home cleaning services from them.They treat their customers so well and they are providing the best services."
                </p>
            </div>
         </SwiperSlide>
         <SwiperSlide>
            <div className='py-[30px] px-5 rounded-3'>
                <div className='flex items-center gap-[13px]'>
                    <img src={customer2Avatar} alt-="" className='rounded-[5px]' />
                    <div>
                        <h4 className='text-[18px] leading-[30px] font-semibold text-headingColor'>
                            Emily Johnson
                        </h4>
                        <div className='flex items-center gap-[2px]'>
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                        </div>
                    </div>
                </div>
                <p className='text-[16px] leading-7 mt-4 text-textColor font-[400]'>
                "FixUp made it so easy to book an electrician when I had an emergency. The process was straightforward, and the electrician was professional and prompt. Highly recommend!"
                </p>
            </div>
         </SwiperSlide>
         <SwiperSlide>
            <div className='py-[30px] px-5 rounded-3'>
                <div className='flex items-center gap-[13px]'>
                    <img src={customer3Avatar} alt-="" className='rounded-[5px]' />
                    <div>
                        <h4 className='text-[18px] leading-[30px] font-semibold text-headingColor'>
                            James Davis
                        </h4>
                        <div className='flex items-center gap-[2px]'>
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                        </div>
                    </div>
                </div>
                <p className='text-[16px] leading-7 mt-4 text-textColor font-[400]'>
                "Finding a reliable driver for my elderly parents was a challenge until I discovered FixUp. The platform is user-friendly, and the driver was courteous and punctual. Great service!"
                </p>
            </div>
         </SwiperSlide>
         <SwiperSlide>
            <div className='py-[30px] px-5 rounded-3'>
                <div className='flex items-center gap-[13px]'>
                    <img src={customer4Avatar} alt-="" className='rounded-[5px]'/>
                    <div>
                        <h4 className='text-[18px] leading-[30px] font-semibold text-headingColor'>
                            Sophia Brown
                        </h4>
                        <div className='flex items-center gap-[2px]'>
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                            <HiStar className='text-yellowColor w-[18px] h-5' />
                        </div>
                    </div>
                </div>
                <p className='text-[16px] leading-7 mt-4 text-textColor font-[400]'>
                "I needed a carpenter to fix some furniture in my home, and FixUp was a lifesaver. The booking process was simple, and the carpenter did an excellent job. Will definitely use this service again."
                </p>
            </div>
         </SwiperSlide>
        </Swiper>
    </div>
  )
}

export default Testimonial