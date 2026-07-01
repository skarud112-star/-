import { CheckCircle2, ShieldCheck, PhoneCall, Sparkles, RefreshCw } from 'lucide-react';
import { ConsultationRequest } from '../types';

interface SuccessStateProps {
  requestData: ConsultationRequest;
  onReset: () => void;
}

export default function SuccessState({ requestData, onReset }: SuccessStateProps) {
  return (
    <div className="px-6 py-12 text-center bg-white rounded-3xl space-y-6 animate-in fade-in duration-300">
      
      {/* Glowing check circle icon with Navy and Gold aura */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 blur-xl animate-pulse scale-125" />
          <div className="relative bg-[#0A1E3F] text-[#D4AF37] p-5 rounded-full shadow-lg border-2 border-[#D4AF37]">
            <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-[#0A1E3F]">
          예약 상담 신청이 <br />
          <span className="text-[#C5A028]">성공적으로 접수</span>되었습니다!
        </h2>
        <p className="text-sm md:text-base text-slate-500 font-semibold tracking-wide flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4.5 w-4.5 text-[#C5A028]" />
          온국민크루즈의 소중한 예비 탑승객으로 등록되었습니다.
        </p>
      </div>

      {/* Box containing submitted info recap */}
      <div className="bg-[#FAF9F6] border-2 border-[#D4AF37]/20 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3 shadow-inner">
        <h4 className="text-sm font-extrabold text-[#0A1E3F] border-b border-dashed border-slate-200 pb-2 mb-1 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          접수 상세 내역 확인
        </h4>
        
        <div className="space-y-1.5 text-sm md:text-base text-slate-700 font-semibold">
          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">신청 고객명</span>
            <span className="text-[#0A1E3F]">{requestData.name} 고객님</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">안내 연락처</span>
            <span className="text-[#0A1E3F]">{requestData.contact}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">선택하신 코스</span>
            <span className="text-[#0A1E3F] font-bold">{requestData.selectedProduct}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">희망 출발 시기</span>
            <span className="text-[#0A1E3F]">{requestData.desiredPeriod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">여행 예정 인원</span>
            <span className="text-[#0A1E3F]">{requestData.travelerCount}명</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">통화 편한 시간</span>
            <span className="text-[#0A1E3F]">{requestData.availableTime}</span>
          </div>
        </div>
      </div>

      {/* Encouraging guide banner */}
      <div className="max-w-md mx-auto bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 rounded-xl p-4 text-slate-700 text-sm md:text-base leading-relaxed font-medium">
        <div className="flex gap-2 items-start text-left">
          <PhoneCall className="h-5 w-5 text-[#C5A028] shrink-0 mt-0.5" />
          <p>
            온국민크루즈 전문 카운셀러가 기재해 주신 상담 희망 시기에 맞춰 <strong>24시간 이내(주말/공휴일 제외)에 순차적으로 개별 연락</strong>을 드리겠습니다. 잠시만 기다려 주시기 바랍니다.
          </p>
        </div>
      </div>

      {/* Back button */}
      <div className="pt-4 max-w-xs mx-auto">
        <button
          type="button"
          id="btn-back-to-home"
          onClick={onReset}
          className="w-full bg-[#0A1E3F] hover:bg-blue-950 text-[#D4AF37] font-extrabold text-base py-3.5 px-6 rounded-xl border border-[#D4AF37] flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
          <span>새로운 상담 신청하기</span>
        </button>
      </div>

    </div>
  );
}
