import { AlertCircle, ShieldCheck } from 'lucide-react';

export default function NoticeBox() {
  return (
    <div className="px-6 py-4">
      <div className="bg-[#FAF9F6] border-l-4 border-[#D4AF37] rounded-r-xl p-4 md:p-5 shadow-sm">
        <div className="flex gap-3 items-start">
          <div className="p-1 rounded-full bg-[#D4AF37]/10 text-[#C5A028] mt-0.5 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-[#0A1E3F] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-4 w-4 text-[#C5A028]" />
              안심 안내 및 유의사항
            </h4>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium">
              “신청서 작성만으로 <span className="text-red-600 font-bold underline decoration-red-200">예약이 확정되거나 결제가 진행되는 것은 아닙니다.</span> 담당자 상담 후 예약 가능 여부와 세부 조건을 직접 유선 및 문자로 상세히 안내드립니다.”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
