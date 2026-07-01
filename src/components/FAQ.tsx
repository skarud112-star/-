import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems: FAQItem[] = [
    {
      question: '크루즈 안에서 흔들림이나 배멀미가 심하지 않나요?',
      answer: '온국민크루즈가 추천해 드리는 선박은 대개 10만 톤에서 17만 톤급에 달하는 초대형 호화 유람선입니다. 최첨단 흔들림 보정 장치(Stabilizer)가 양옆에 장착되어 있어 파도가 쳐도 일반 배와 달리 거의 요동이 없고 흔들림이 전혀 느껴지지 않아 멀미 우려가 매우 적습니다. 또한 의무실에 상시 멀미약이 준비되어 있으니 편안히 탑승하셔도 좋습니다.'
    },
    {
      question: '영어를 한마디도 못 하는데 자유롭게 여행할 수 있을까요?',
      answer: '물론입니다! 연세가 있으신 고객분들도 어렵지 않게 즐기실 수 있도록, 전문 한국인 가이드 또는 한국인 인솔자가 전 일정 동행하는 크루즈 패키지 상품을 맞춤 추천해 드립니다. 선내에서도 한국어로 번역된 선상 뉴스레터(일정표)와 한국어 식단 대조 표 등이 정성껏 제공되므로 언어 장벽 걱정 없이 안전하고 행복하게 즐기실 수 있습니다.'
    },
    {
      question: '여권은 언제까지 유효해야 하나요?',
      answer: '크루즈 승선 및 해외 출입국 안전을 위해, 가입하신 크루즈 상품의 출발 당일 일정을 기준으로 여권 유효기간이 최소 6개월 이상 남아 있어야 정상 탑승이 가능합니다. 단수 여권은 탑승이 어려울 수 있으므로 복수 여권을 적극 권장합니다. 상담 접수 시 여권 상태도 친절하게 체크해 드립니다.'
    },
    {
      question: '기내 식사와 부대시설 이용 비용은 매번 별도로 내야 하나요?',
      answer: '크루즈 여행의 가장 큰 매력은 최고의 선상 미식 뷔페, 정찬 코스 요리가 예약 시점에 요금에 모두 기본 포함(무료)되어 있다는 점입니다! 24시간 피자바, 대형 극장의 환상적인 라이브 쇼, 실내외 온수 수영장 등 대부분의 엔터테인먼트 시설도 무료로 이용 가능합니다. (일부 유료 시그니처 레스토랑, 스파 마사지, 카지노, 유료 주류 등만 별도 청구됩니다.)'
    },
    {
      question: '휠체어나 거동이 조금 불편한 어르신도 예약 가능한가요?',
      answer: '크루즈 내부는 모든 문턱이 제거되어 있고 승강기가 완벽히 배치된 무장애(Barrier-Free) 환경입니다. 휠체어로 탑승 가능한 전용 선실(장애인실)도 선박마다 선착순 한정 배치되어 있습니다. 다만 특정 기항지에서 육지로 이동할 때 작은 텐더 보트로 승하선해야 하는 일부 코스가 있을 수 있으므로 상담 시 꼭 알려주시면 무장애 안성맞춤 코스로 엄선해 드리겠습니다.'
    }
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="px-6 py-6 bg-white border-b border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center bg-[#0A1E3F] text-[#D4AF37] text-sm font-bold w-6 h-6 rounded-full">4</span>
        <h3 className="text-lg md:text-xl font-bold text-[#0A1E3F]">자주 묻는 질문 (궁금증 해결)</h3>
      </div>
      
      <p className="text-xs md:text-sm text-slate-500 mb-5 leading-normal">
        * 크루즈 여행이 처음이신 분들이 가장 많이 여쭤보시는 핵심 질문들을 골라 상세히 답변해 드립니다.
      </p>

      <div className="space-y-3">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              id={`faq-item-${index}`}
              className={`border rounded-2xl overflow-hidden transition-all ${
                isOpen ? 'border-[#D4AF37] bg-[#FAF9F6]/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                id={`btn-faq-toggle-${index}`}
                onClick={() => handleToggle(index)}
                className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="text-sm md:text-base font-bold text-slate-800 flex items-start gap-2">
                  <span className="text-[#C5A028] text-base font-extrabold shrink-0">Q.</span>
                  <span>{item.question}</span>
                </span>
                <span className="text-slate-400 shrink-0">
                  {isOpen ? <ChevronUp className="h-5 w-5 text-[#C5A028]" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-dashed border-slate-200">
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal whitespace-pre-line pl-5 relative">
                    <span className="absolute left-0 top-0 text-[#0A1E3F] font-extrabold text-base">A.</span>
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
