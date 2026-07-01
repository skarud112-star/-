import { Ship, Compass, ShieldCheck } from 'lucide-react';
import heroImage from '../assets/images/cruise_ship_luxury_1782742606045.jpg';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-[#0A1E3F] text-white">
      {/* Background Image with elegant overlay */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <img 
          src={heroImage} 
          alt="Luxury Cruise Ship" 
          className="h-full w-full object-cover object-center transform scale-105 hover:scale-100 transition-transform duration-7000 ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1E3F] via-[#0A1E3F]/60 to-transparent" />
        
        {/* Upper Accent Gold Badge */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="flex items-center gap-1.5 bg-[#0A1E3F]/80 backdrop-blur-sm border border-[#D4AF37]/40 px-3 py-1.5 rounded-full shadow-lg">
            <Ship className="h-4 w-4 text-[#D4AF37] animate-pulse" />
            <span className="text-[11px] md:text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">ON GUK MIN CRUISE</span>
          </div>
          
          <div className="flex items-center gap-1 bg-[#D4AF37] text-[#0A1E3F] px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold shadow-md">
            <ShieldCheck className="h-3 w-3" />
            <span>상담안내원 100% 매칭</span>
          </div>
        </div>
      </div>

      {/* Hero Headings Area */}
      <div className="px-6 pb-8 pt-2 text-center">
        <div className="flex justify-center mb-3">
          <div className="h-1 w-12 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-full" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
          온국민크루즈 <span className="text-[#D4AF37] block mt-1.5 sm:inline sm:mt-0">예약 상담 신청</span>
        </h1>
        
        <p className="text-sm md:text-base text-slate-300 font-medium tracking-wide flex items-center justify-center gap-2 mb-5">
          <Compass className="h-4 w-4 text-[#D4AF37]" />
          크루즈 여행 상담 · 상품 안내 · 예약 절차 안내
        </p>

        {/* Informative Guidance Text inside elegant subtle gold border */}
        <div className="bg-[#112A4F] border border-[#D4AF37]/20 rounded-xl p-4 md:p-5 text-left shadow-inner">
          <p className="text-sm md:text-base text-slate-100 leading-relaxed font-normal">
            “크루즈 여행이 처음이신 분들도 어렵지 않게 상담받으실 수 있도록 <span className="text-[#D4AF37] font-semibold">상품 안내, 출발 일정, 예상 비용, 예약 절차</span>를 순서대로 친절하게 안내해드립니다.”
          </p>
        </div>
      </div>
    </div>
  );
}
