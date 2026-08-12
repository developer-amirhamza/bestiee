"use client"

import { youarenotalone } from '@/config/page'

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// import './styles.css';

// import required modules
import { Navigation, Pagination } from 'swiper/modules';
import { useEffect, useRef, useState } from 'react'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";
import { MdArrowRightAlt } from 'react-icons/md';
import { LuMoveRight } from 'react-icons/lu';

const YouAreNotAlone = () => {
    const [currentId, setCurrentId] = useState(0)

    const {badge, heading, intro,stats, carousel,cta} = youarenotalone;
    const {subtitle, cardCtaLabel, cardSuggestLabel, slides} = carousel;
     const prevRef = useRef<any>(null);
  const nextRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-secondary grid gap-5 rounded-2xl my-10 py-10 px-14 text-white ">
        <span className='bg-primary/20 px-5 max-w-max rounded-full py-2.5' >{badge}</span>
        <h2 className="text-5xl max-w-xl font-medium ">{heading}</h2>
        <p className="max-w-xl text-xl">{intro} </p>
        {/* stats */}
        <div className="grid grid-cols-1 gap-8  sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {stats.map((item,id)=>(
                <div key={id} className="bg-primary/20 p-7 rounded-2xl grid gap-2  ">
                    <h3 className="text-5xl">{item.value}</h3>
                    <p className=""> {item.description}</p>
                </div>
            ))}
        </div>
        {/* section bottom */}
        <div className="grid w-full  ">
            <div className="py-5">
                {/* left side */}
                <div className="grid gap-2">
                    <h4 className="text-4xl font-secondary font-medium">{carousel.heading} </h4>
                    <p className="font-medium text-base">{subtitle} </p>
                </div>
                {/* right side */}
                <div className=" "></div>
            </div>
            {/* carousel */}
            <Swiper
                // spaceBetween={30}
                pagination={{
                clickable: true,
                type: 'fraction',
                }}
                navigation={mounted ? {
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          } : false}
          style={{
            '--swiper-navigation-color': '#f59e0b',
            '--swiper-pagination-color': '#f59e0b',
          } as React.CSSProperties}
                cssMode={true}
                modules={[Pagination, Navigation]}
                className="mySwiper "
            >
                {slides.map((slide,index)=>(
                <SwiperSlide>
                <div className="bg-primary/10 p-7 rounded-2xl">
                {/* slides */}
                <div className="flex justify-between items-center ">
                    {/* content */}
                    <div className=" grid gap-3">
                        <span className="bg-primary/20 px-4 py-1.5 rounded-full font-medium text-sm max-w-max tracking-wider ">{slides[0].tag}</span>
                        <h2 className="font-medium text-3xl">{slide.title} </h2>
                        <p className="max-w-2xl">{slide.body} </p>
                    </div>
                    {/* card */}
                    <div className="bg-background grid p-4 max-w-sm overflow-hidden rounded-xl gap-2">
                        <img src="https://placehold.co/200x120" className='rounded' alt="place" />
                        <span className="text-foreground text-sm  uppercase">{cardSuggestLabel} </span>
                        <h3 className="text-title text-base line-clamp-1 font-medium">{slide.suggestedProduct} </h3>
                        <button className="text-secondary text-sm font-semibold text-start "> {cardCtaLabel}</button>
                    </div>
                </div>
            </div></SwiperSlide>
                ))}
                <div className="flex justify-between items-center absolute top-2/5 z-100   w-full">
            <button ref={prevRef} className=" text-white text-2xl px-1 border border-white py-1 mr-5 rounded-full cursor-pointer  bg-transparent "><HiOutlineArrowNarrowLeft /> </button>
            <button ref={nextRef} className=" text-secondary text-2xl px-1 border border-white py-1 rounded-full cursor-pointer  bg-white "><LuMoveRight  /> </button>
          </div>
            </Swiper>
        </div>
    </div>
  )
}

export default YouAreNotAlone