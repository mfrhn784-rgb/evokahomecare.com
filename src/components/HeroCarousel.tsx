"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface Slide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  bgClass: string;
  accentText: string;
  images: Array<{ src: string; alt: string; sizeClass: string }>;
}

const SLIDES: Slide[] = [
  {
    id: "laundry",
    badge: "Trivandrum's Home Care Range",
    title: "Everyday Clean,\nElevated.",
    subtitle:
      "Matic liquid detergents, washing powders, fabric conditioners, and dish wash liquids in 500ml to 5L pack sizes.",
    ctaLabel: "Shop All Products",
    ctaHref: "/shop",
    secondaryLabel: "Build Custom Box (-20%)",
    secondaryHref: "/bundles",
    bgClass: "from-[#154734] via-[#1B5E44] to-[#0F3526]",
    accentText: "text-[#E5A91A]",
    images: [
      {
        src: "/images/detergent-matic-royal-rose-1l.jpg",
        alt: "EVOKA Matic Liquid Detergent Royal Rose 1L",
        sizeClass: "h-44 sm:h-64 lg:h-72 -rotate-3 translate-y-2",
      },
      {
        src: "/images/detergent-matic-lavender-2l.jpg",
        alt: "EVOKA Matic Liquid Detergent Lavender 2L",
        sizeClass: "h-52 sm:h-72 lg:h-80 z-10 scale-105",
      },
      {
        src: "/images/washingpowder-evokaplus-2kg.jpg",
        alt: "Evoka+ Washing Powder 2kg",
        sizeClass: "h-40 sm:h-60 lg:h-68 rotate-3 translate-y-3",
      },
    ],
  },
  {
    id: "kitchen-floor",
    badge: "Kitchen & Surface Care",
    title: "Sparkling Dishes &\nFresh Floors",
    subtitle:
      "Lemon, orange & green apple dish wash liquids paired with rose, lavender & jasmine floor cleaners.",
    ctaLabel: "Shop Kitchen Care",
    ctaHref: "/shop?category=kitchen-care",
    secondaryLabel: "Shop Floor & Surface",
    secondaryHref: "/shop?category=floor-surface-care",
    bgClass: "from-[#1A3F32] via-[#225442] to-[#123025]",
    accentText: "text-[#F4C430]",
    images: [
      {
        src: "/images/dishwash-lemon-500ml.jpg",
        alt: "EVOKA Lemon Dish Wash 500ml",
        sizeClass: "h-44 sm:h-64 lg:h-72 -rotate-3 translate-y-2",
      },
      {
        src: "/images/floorcleaner-rose-1l.jpg",
        alt: "EVOKA Rose Floor Cleaner 1L",
        sizeClass: "h-52 sm:h-72 lg:h-80 z-10 scale-105",
      },
      {
        src: "/images/dishwash-orange-1l.jpg",
        alt: "EVOKA Orange Dish Wash 1L",
        sizeClass: "h-44 sm:h-64 lg:h-72 rotate-3 translate-y-2",
      },
    ],
  },
  {
    id: "bundles",
    badge: "Build Your Own Box",
    title: "Pick Any 5 Items &\nSave 20%",
    subtitle:
      "Mix detergents, hand wash pumps, toilet cleaners, face wash & bath soaps in one doorstep order with Free Delivery.",
    ctaLabel: "Build Your Box",
    ctaHref: "/bundles",
    secondaryLabel: "Explore Personal Care",
    secondaryHref: "/shop?category=personal-care",
    bgClass: "from-[#0F3829] via-[#1B533D] to-[#23664C]",
    accentText: "text-[#4ADE80]",
    images: [
      {
        src: "/images/handwash-orange-500ml-pump.jpg",
        alt: "EVOKA Orange Hand Wash Pump 500ml",
        sizeClass: "h-44 sm:h-64 lg:h-72 -rotate-3 translate-y-2",
      },
      {
        src: "/images/facewash-sandal-200ml.jpg",
        alt: "EVOKA Sandal Face Wash 200ml",
        sizeClass: "h-48 sm:h-68 lg:h-76 z-10 scale-105",
      },
      {
        src: "/images/origin-soap-redsandal-box.jpg",
        alt: "Origin Special Bath Soap Red Sandal",
        sizeClass: "h-40 sm:h-56 lg:h-64 rotate-3 translate-y-4",
      },
    ],
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[active];

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${slide.bgClass} text-white shadow-lg transition-colors duration-700`}
      >
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-6 py-10 sm:px-12 sm:py-14 lg:py-16 relative z-10">
          {/* Left Copy */}
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider ${slide.accentText}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{slide.badge}</span>
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold leading-[1.08] tracking-tight whitespace-pre-line">
              {slide.title}
            </h1>

            <p className="text-sm sm:text-base text-white/85 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {slide.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <Link
                href={slide.ctaHref}
                className="px-6 py-3.5 rounded-xl bg-[#E5A91A] hover:bg-[#f0b72b] text-[#1A1D1B] font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>{slide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={slide.secondaryHref}
                className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
              >
                {slide.secondaryLabel}
              </Link>
            </div>
          </div>

          {/* Right Uncropped Product Trio Studio Showcase */}
          <div className="lg:col-span-6 flex items-end justify-center gap-2 sm:gap-4 pt-2">
            {slide.images.map((item) => (
              <div
                key={item.src}
                className={`bg-white rounded-2xl p-2 sm:p-3 shadow-2xl border border-white/60 flex items-center justify-center transition-all duration-500 ${item.sizeClass}`}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="h-full w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Left / Right Arrows */}
        <button
          type="button"
          onClick={() => setActive((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          aria-label="Previous slide"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 hover:bg-black/45 text-white items-center justify-center transition-colors cursor-pointer z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setActive((prev) => (prev + 1) % SLIDES.length)}
          aria-label="Next slide"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 hover:bg-black/45 text-white items-center justify-center transition-colors cursor-pointer z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === active ? "w-7 bg-[#E5A91A]" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
