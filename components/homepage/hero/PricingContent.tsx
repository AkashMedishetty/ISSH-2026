'use client';

import Link from 'next/link';

const pricingCategories = [
  { title: 'ISSH Member', earlyBird: 'TBD', regular: 'TBD' },
  { title: 'Delegate (Non-ISSH)', earlyBird: 'TBD', regular: 'TBD' },
  { title: 'Spouse / Accompanying', earlyBird: 'TBD', regular: 'TBD' },
  { title: 'PG Trainee', earlyBird: 'TBD', regular: 'TBD' },
  { title: 'Individual Workshops', earlyBird: 'TBD', regular: 'TBD' },
];

export function PricingContent() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] mb-3 text-[#852016]">
          Registration
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#25406b] mb-4">
          Conference Pricing
        </h2>
        <p className="text-base md:text-lg text-[#25406b]/70">
          April 25-26, 2026 • HICC Novotel, Hyderabad
        </p>
      </div>

      {/* Pricing Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/50">
        {/* Table Header */}
        <div className="grid grid-cols-3 bg-[#852016] text-white">
          <div className="p-3 md:p-5 font-semibold text-xs md:text-sm border-r border-white/20">
            Category
          </div>
          <div className="p-3 md:p-5 text-center border-r border-white/20">
            <div className="font-bold text-xs md:text-base">Early Bird</div>
            <div className="text-[10px] md:text-xs opacity-80">Till 31st March 2026</div>
          </div>
          <div className="p-3 md:p-5 text-center">
            <div className="font-bold text-xs md:text-base">Regular & Spot</div>
            <div className="text-[10px] md:text-xs opacity-80">After 1st April 2026</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#25406b]/10">
          {pricingCategories.map((category, index) => (
            <div
              key={category.title}
              className={`grid grid-cols-3 transition-colors hover:bg-[#ebc975]/20 ${
                index % 2 === 0 ? 'bg-white/40' : 'bg-white/20'
              }`}
            >
              <div className="p-3 md:p-5 flex items-center border-r border-[#25406b]/10">
                <span className="font-medium text-xs md:text-sm text-[#25406b]">
                  {category.title}
                </span>
              </div>
              <div className="p-3 md:p-5 flex items-center justify-center border-r border-[#25406b]/10">
                <span className="text-base md:text-xl font-bold text-[#852016]">
                  {category.earlyBird}
                </span>
              </div>
              <div className="p-3 md:p-5 flex items-center justify-center">
                <span className="text-base md:text-xl font-bold text-[#25406b]">
                  {category.regular}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note & CTA */}
      <div className="mt-6 md:mt-8 text-center">
        <p className="text-sm text-[#25406b]/60 mb-6">
          * All prices include 18% GST. Prices will be announced soon.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#852016] text-white text-base md:text-lg font-bold rounded-full hover:bg-[#25406b] transition-all duration-300 hover:scale-105 shadow-lg"
        >
          Register Now
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
