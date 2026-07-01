import { CheckSquare, PhoneCall, CreditCard, Compass } from 'lucide-react';

export default function ProcessGuide() {
  const steps = [
    {
      number: '01',
      title: '상담 신청 접수',
      description: '관심 노선과 연락처 등 간단한 기본 정보를 선택하여 상담서를 제출합니다.',
      icon: CheckSquare,
      color: 'bg-[#0A1E3F] text-[#D4AF37]'
    },
    {
      number: '02',
      title: '1:1 맞춤 전화 상담',
      description: '배정된 베테랑 전담 상담원이 연락을 드려 예산, 기항지, 기내 선실 등 맞춤 일정을 자세하게 소개해 드립니다.',
      icon: PhoneCall,
      color: 'bg-[#D4AF37] text-[#0A1E3F]'
    },
    {
      number: '03',
      title: '상세 일정 확정 및 가예약',
      description: '원하시는 조건이 충족되면 선실 가예약이 진행되며, 세부 조건과 최종 계약서 초안을 카카오톡 또는 문자로 보내드립니다.',
      icon: CreditCard,
      color: 'bg-[#0A1E3F] text-[#D4AF37]'
    },
    {
      number: '04',
      title: '본 계약 및 출발 준비',
      description: '출발 일정에 맞는 서류(여권 등) 제출 및 잔금 수납이 순차적으로 안내되며, 즐겁고 품격 있는 크루즈 여행길에 오르시게 됩니다.',
      icon: Compass,
      color: 'bg-[#D4AF37] text-[#0A1E3F]'
    }
  ];

  return (
    <div className="px-6 py-6 bg-[#F9F6F0] border-t border-b border-slate-200/60">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center bg-[#0A1E3F] text-[#D4AF37] text-sm font-bold w-6 h-6 rounded-full">3</span>
        <h3 className="text-lg md:text-xl font-bold text-[#0A1E3F]">안전하고 투명한 예약 절차</h3>
      </div>
      
      <p className="text-xs md:text-sm text-slate-500 mb-5 leading-normal">
        * 복잡한 대형 크루즈 예약도 온국민크루즈에서는 1단계부터 4단계까지 차근차근 안전하게 밀착 케어해 드립니다.
      </p>

      <div className="relative border-l-2 border-[#D4AF37]/30 pl-5 ml-4 space-y-6">
        {steps.map((step, idx) => {
          const IconComponent = step.icon;
          return (
            <div key={idx} className="relative" id={`process-step-${idx + 1}`}>
              {/* Number Dot */}
              <div className={`absolute -left-[37px] top-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs shadow-md ${step.color}`}>
                {step.number}
              </div>

              {/* Step Detail */}
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <IconComponent className="h-4.5 w-4.5 text-[#C5A028] shrink-0" />
                  <h4 className="text-sm md:text-base font-bold text-[#0A1E3F]">{step.title}</h4>
                </div>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
