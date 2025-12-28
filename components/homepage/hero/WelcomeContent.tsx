'use client';

export function WelcomeContent() {
  return (
    <div className="w-full md:ml-auto md:max-w-xl lg:max-w-2xl lg:mr-12">
      {/* Mobile: Add top padding for point cloud space */}
      <div className="pt-8 md:pt-0">
        <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] mb-3 text-[#852016]">
          Dear Esteemed Colleagues
        </p>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 text-[#25406b] leading-tight">
          Welcome to
          <br />
          ISSH Midterm CME 2026
        </h2>

        <div className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-[#25406b]/80 leading-relaxed">
          <p>
            It is our privilege to invite you to the{' '}
            <span className="font-semibold text-[#25406b]">
              12th ISSH Midterm CME Hyderabad 2026
            </span>
            . This prestigious gathering brings together leading hand surgeons, clinicians, and
            innovators shaping the future of hand surgery.
          </p>
          <p className="hidden sm:block">
            Our scientific program explores{' '}
            <span className="font-semibold text-[#852016]">
              "Inappropriate, Appropriate and Most Appropriate ways to do Hand Surgery"
            </span>
            . CME Symposiums will address cutting-edge topics in hand surgery techniques.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mt-6 md:mt-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-center min-w-[60px] sm:min-w-[80px]">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">50+</p>
            <p className="text-[10px] sm:text-xs text-[#25406b]">Speakers</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-center min-w-[60px] sm:min-w-[80px]">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">300+</p>
            <p className="text-[10px] sm:text-xs text-[#25406b]">Attendees</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-center min-w-[60px] sm:min-w-[80px]">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">10+</p>
            <p className="text-[10px] sm:text-xs text-[#25406b]">Sessions</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-center min-w-[60px] sm:min-w-[80px]">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">2</p>
            <p className="text-[10px] sm:text-xs text-[#25406b]">Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
