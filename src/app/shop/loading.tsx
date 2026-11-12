import React from "react";

export default function ShopLoading() {
  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 animate-pulse">
        <div className="h-8 w-56 bg-[#E5E8E3] rounded-lg mb-3" />
        <div className="h-4 w-40 bg-[#E5E8E3] rounded mb-8" />
        <div className="flex gap-2 mb-6 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-[#E5E8E3] rounded-lg shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E5E8E3] p-4 space-y-3"
            >
              <div className="aspect-square w-full bg-[#F6F7F4] rounded-lg" />
              <div className="h-3 w-20 bg-[#E5E8E3] rounded" />
              <div className="h-4 w-3/4 bg-[#E5E8E3] rounded" />
              <div className="h-9 w-full bg-[#E5E8E3] rounded-lg mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
