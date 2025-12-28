'use client';

import { useEffect } from 'react';
import { HandHeroSection } from '@/components/homepage/HandHeroSection';
import { CTASection } from '@/components/homepage/CTASection';
import { FooterSection } from '@/components/homepage/FooterSection';

export default function Home() {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="relative overflow-x-hidden">
      <HandHeroSection />
      {/* CTA and Footer combined = 100vh */}
      <div className="relative z-[20] bg-[#f5f0e6] min-h-screen flex flex-col">
        <CTASection />
        <FooterSection />
      </div>
    </main>
  );
}
