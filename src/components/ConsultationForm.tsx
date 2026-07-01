import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  CalendarRange, 
  Users, 
  Tag, 
  Clock, 
  MessageSquare, 
  CheckSquare, 
  Square,
  Shield,
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { CRUISE_PRODUCTS } from '../data/products';
import { ConsultationRequest } from '../types';

interface ConsultationFormProps {
  selectedProductId: string;
  onProductChange: (productId: string) => void;
  onSubmitSuccess: (requestData: ConsultationRequest) => void;
}

export default function ConsultationForm({ 
  selectedProductId, 
  onProductChange, 
  onSubmitSuccess 
}: ConsultationFormProps) {
  // Form States
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('서울/경기/인천');
  const [customLocation, setCustomLocation] = useState('');
  const [desiredPeriod, setDesiredPeriod] = useState('3개월 이내');
  const [customPeriod, setCustomPeriod] = useState('');
  const [travelerCount, setTravelerCount] = useState(2);
  const [availableTime, setAvailableTime] = useState('아무 때나 괜찮습니다 (오전 9시 ~ 오후 6시)');
  const [customTime, setCustomTime] = useState('');
  const [message, setMessage] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Field Option Arrays for quick buttons (easy for 50-70s to select instead of typing)
  const LOCATION_OPTIONS = ['서울/경기/인천', '부산/경남/울산', '대구/경북', '광주/전라', '대전/세종/충청', '강원', '제도/기타'];
  const PERIOD_OPTIONS = ['3개월 이내', '6개월 이내', '올해 안으로', '내년 상반기', '일정 직접 입력'];
  const TIME_OPTIONS = [
    '아무 때나 괜찮습니다 (오전 9시 ~ 오후 6시)',
    '오전 시간 (오전 9시 ~ 12시)',
    '오후 시간 (오후 12시 ~ 5시)',
    '늦은 오후 (오후 5시 ~ 6시)',
    '직접 기재'
  ];

  // Auto-format phone number with dashes (e.g., 010-1234-5678)
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    let formattedVal = rawVal;
    
    if (rawVal.length > 3 && rawVal.length <= 7) {
      formattedVal = `${rawVal.slice(0, 3)}-${rawVal.slice(3)}`;
    } else if (rawVal.length > 7) {
      formattedVal = `${rawVal.slice(0, 3)}-${rawVal.slice(3, 7)}-${rawVal.slice(7, 11)}`;
    }
    
    setContact(formattedVal);
  };

  // Error States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Synchronize internal select with outer choice
  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onProductChange(e.target.value);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력해 주세요.';
    } else if (name.trim().length < 2) {
      newErrors.name = '이름은 최소 2글자 이상 입력해 주세요.';
    }

    if (!contact.trim()) {
      newErrors.contact = '연락처를 입력해 주세요.';
    } else {
      const cleaned = contact.replace(/[^0-9]/g, '');
      if (cleaned.length < 9) {
        newErrors.contact = '올바른 전화번호 형식이 아닙니다.';
      }
    }

    if (desiredPeriod === '일정 직접 입력' && !customPeriod.trim()) {
      newErrors.desiredPeriod = '출발 희망 시기를 직접 적어주세요.';
    }

    if (availableTime === '직접 기재' && !customTime.trim()) {
      newErrors.availableTime = '상담 전화를 받으실 수 있는 편한 시간을 기재해 주세요.';
    }

    if (travelerCount < 1) {
      newErrors.travelerCount = '희망 인원은 최소 1명 이상이어야 합니다.';
    }

    if (!agreePrivacy) {
      newErrors.agreePrivacy = '개인정보 수집 및 이용 동의가 필요합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Find the first error and scroll to it gently
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        const firstErrorElement = document.getElementById(`field-${errorKeys[0]}`);
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // Prepare consultation data
    const selectedProductName = CRUISE_PRODUCTS.find(p => p.id === selectedProductId)?.name || '기타';
    
    const finalLocation = location === '제도/기타' && customLocation ? `${location} (${customLocation})` : location;
    const finalPeriod = desiredPeriod === '일정 직접 입력' ? customPeriod : desiredPeriod;
    const finalTime = availableTime === '직접 기재' ? customTime : availableTime;

    // Build client-side submitMeta
    const ua = navigator.userAgent;
    let deviceType = "PC";
    if (/iPad|Tablet/i.test(ua)) {
      deviceType = "태블릿";
    } else if (/Mobile|Android|iPhone/i.test(ua)) {
      deviceType = "모바일";
    }

    let os = "기타 OS";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    let browser = "기타 브라우저";
    if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
    else if (/Edge|Edg/i.test(ua)) browser = "Edge";
    else if (/Chrome/i.test(ua)) {
      if (/CriOS/i.test(ua)) browser = "Chrome (iOS)";
      else browser = "Chrome";
    }
    else if (/Safari/i.test(ua)) browser = "Safari";
    else if (/Firefox/i.test(ua)) browser = "Firefox";

    const submitMeta = {
      ipAddress: "",
      deviceType,
      os,
      browser,
      userAgent: ua,
      pageUrl: window.location.href,
      submittedAt: new Date().toLocaleString('ko-KR', { hour12: false })
    };

    const requestData: ConsultationRequest = {
      id: `REQ-${Date.now()}`,
      name: name.trim(),
      contact: contact,
      location: finalLocation,
      desiredPeriod: finalPeriod,
      travelerCount: travelerCount,
      selectedProduct: selectedProductName,
      availableTime: finalTime,
      message: message.trim(),
      submittedAt: new Date().toLocaleString('ko-KR', { hour12: false }),
      status: 'pending',
      submitMeta
    };

    // Submit to Backend Server API
    const submitToServer = async () => {
      try {
        const response = await fetch('/api/consultations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });
        if (response.ok) {
          const resData = await response.json();
          const serverSavedData = resData.data || requestData;

          alert('접수가 완료되었습니다.');
          // Callback on parent
          onSubmitSuccess(serverSavedData);
        } else {
          alert('접수 저장에 실패했습니다. 다시 시도해 주세요.');
        }
      } catch (err) {
        console.error('Error submitting consultation to backend:', err);
        alert('접수 저장에 실패했습니다. 다시 시도해 주세요.');
      }
    };

    submitToServer();
  };

  return (
    <div className="px-6 py-4 bg-white" id="consultation-form-section">
      <div className="flex items-center gap-2 mb-6">
        <span className="flex items-center justify-center bg-[#0A1E3F] text-[#D4AF37] text-sm font-bold w-6 h-6 rounded-full">2</span>
        <h3 className="text-lg md:text-xl font-bold text-[#0A1E3F]">상담 받으실 상세 정보를 입력해 주세요</h3>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* 1. Name Input */}
        <div id="field-name" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="h-5 w-5 text-[#0A1E3F]" />
            성함 <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            id="input-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="성함을 입력해 주세요 (예: 홍길동)"
            className={`w-full text-base md:text-lg px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 transition-all ${
              errors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-300 bg-slate-50/50'
            }`}
          />
          {errors.name && <p className="text-sm font-semibold text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 2. Contact Input */}
        <div id="field-contact" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#0A1E3F]" />
            연락처 <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            id="input-contact"
            type="tel"
            maxLength={13}
            value={contact}
            onChange={handleContactChange}
            placeholder="휴대폰 번호를 입력해 주세요 (예: 010-1234-5678)"
            className={`w-full text-base md:text-lg px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 transition-all ${
              errors.contact ? 'border-red-500 bg-red-50/50' : 'border-slate-300 bg-slate-50/50'
            }`}
          />
          {errors.contact && <p className="text-sm font-semibold text-red-500 mt-1">{errors.contact}</p>}
          <p className="text-xs text-slate-400 font-medium">※ 입력해 주신 번호로 담당 크루즈 플래너가 1차 문자 안내 및 전화를 드립니다.</p>
        </div>

        {/* 3. Location Selector (Radio Button style with clean responsive buttons) */}
        <div id="field-location" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0A1E3F]" />
            거주 지역
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LOCATION_OPTIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                id={`btn-location-${loc}`}
                onClick={() => setLocation(loc)}
                className={`py-2.5 px-3 border-2 rounded-xl text-sm md:text-base font-bold text-center transition-all ${
                  location === loc
                    ? 'border-[#0A1E3F] bg-[#0A1E3F] text-[#D4AF37] shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
          {location === '제도/기타' && (
            <input
              type="text"
              id="input-custom-location"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="상세 지역을 입력해 주세요 (예: 제주도 제주시)"
              className="w-full text-base px-4 py-3 mt-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 bg-slate-50/50"
            />
          )}
        </div>

        {/* 4. Desired Period Selector */}
        <div id="field-desiredPeriod" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-[#0A1E3F]" />
            희망 출발 시기 <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERIOD_OPTIONS.map((period) => (
              <button
                key={period}
                type="button"
                id={`btn-period-${period}`}
                onClick={() => setDesiredPeriod(period)}
                className={`py-2.5 px-3 border-2 rounded-xl text-sm md:text-base font-bold text-center transition-all ${
                  desiredPeriod === period
                    ? 'border-[#0A1E3F] bg-[#0A1E3F] text-[#D4AF37] shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          {desiredPeriod === '일정 직접 입력' && (
            <input
              id="input-custom-period"
              type="text"
              value={customPeriod}
              onChange={(e) => setCustomPeriod(e.target.value)}
              placeholder="예: 2026년 10월 중순 또는 추석 명절 연휴"
              className={`w-full text-base px-4 py-3 mt-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 transition-all ${
                errors.desiredPeriod ? 'border-red-500 bg-red-50/50' : 'border-slate-300 bg-slate-50/50'
              }`}
            />
          )}
          {errors.desiredPeriod && <p className="text-sm font-semibold text-red-500 mt-1">{errors.desiredPeriod}</p>}
        </div>

        {/* 5. Desired Passenger Count (Counter buttons for easy touch interaction!) */}
        <div id="field-travelerCount" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0A1E3F]" />
            희망 인원 <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="flex items-center gap-4 bg-slate-100 p-2.5 rounded-xl max-w-sm">
            <button
              type="button"
              id="btn-count-minus"
              onClick={() => setTravelerCount(prev => Math.max(1, prev - 1))}
              className="w-12 h-12 bg-white rounded-lg border border-slate-300 flex items-center justify-center text-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-xl md:text-2xl font-extrabold text-[#0A1E3F]">{travelerCount}</span>
              <span className="text-base font-bold text-slate-600 ml-1">명</span>
            </div>
            <button
              type="button"
              id="btn-count-plus"
              onClick={() => setTravelerCount(prev => Math.min(99, prev + 1))}
              className="w-12 h-12 bg-white rounded-lg border border-slate-300 flex items-center justify-center text-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium">※ 본인을 포함한 전체 여행 예정 인원을 지정해 주세요.</p>
        </div>

        {/* 6. Product Link Sync with dropdown */}
        <div id="field-selectedProduct" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#0A1E3F]" />
            관심 상품 <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            id="select-product"
            value={selectedProductId}
            onChange={handleProductSelectChange}
            className="w-full text-base md:text-lg px-4 py-3 border border-slate-300 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 cursor-pointer"
          >
            {CRUISE_PRODUCTS.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#C5A028] font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            상단 (1번 영역) 카드 선택과 자동으로 동기화됩니다.
          </p>
        </div>

        {/* 7. Available Consultation Time */}
        <div id="field-availableTime" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#0A1E3F]" />
            상담 가능 시간
          </label>
          <div className="space-y-2">
            {TIME_OPTIONS.map((timeOpt) => {
              const isSelected = availableTime === timeOpt;
              return (
                <button
                  key={timeOpt}
                  type="button"
                  id={`btn-time-${timeOpt}`}
                  onClick={() => setAvailableTime(timeOpt)}
                  className={`w-full text-left py-3 px-4 border rounded-xl flex items-center justify-between text-sm md:text-base font-semibold transition-all ${
                    isSelected 
                      ? 'border-[#D4AF37] bg-[#F9F6F0] text-[#0A1E3F]' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{timeOpt}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-[#0A1E3F] bg-[#0A1E3F]' : 'border-slate-300'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />}
                  </div>
                </button>
              );
            })}
          </div>
          {availableTime === '직접 기재' && (
            <input
              id="input-custom-time"
              type="text"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder="예: 월요일 오후 2시이후 또는 저녁 6시 직전"
              className={`w-full text-base px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 transition-all ${
                errors.availableTime ? 'border-red-500 bg-red-50/50' : 'border-slate-300 bg-slate-50/50'
              }`}
            />
          )}
          {errors.availableTime && <p className="text-sm font-semibold text-red-500 mt-1">{errors.availableTime}</p>}
        </div>

        {/* 8. Inquiry Message */}
        <div id="field-message" className="space-y-2">
          <label className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#0A1E3F]" />
            문의 내용 (선택)
          </label>
          <textarea
            id="textarea-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="상담 시 미리 여쭤보고 싶거나, 특별히 요청하시는 세부 기항지 및 예산 계획 등이 있다면 자유롭게 기재해 주세요."
            className="w-full text-base px-4 py-3 border border-slate-300 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40"
          />
        </div>

        {/* 9. Privacy Policy Agreement */}
        <div id="field-agreePrivacy" className="bg-[#FAF9F6] border border-slate-200 rounded-xl p-4 md:p-5 space-y-3.5">
          <div className="flex items-start gap-3">
            <button
              type="button"
              id="btn-agree-privacy-checkbox"
              onClick={() => setAgreePrivacy(!agreePrivacy)}
              className="text-[#0A1E3F] shrink-0 mt-0.5 cursor-pointer"
            >
              {agreePrivacy ? (
                <CheckSquare className="h-6 w-6 text-[#0A1E3F]" />
              ) : (
                <Square className="h-6 w-6 text-slate-400" />
              )}
            </button>
            <div className="flex-1">
              <label 
                htmlFor="btn-agree-privacy-checkbox"
                className="text-sm md:text-base font-bold text-slate-800 cursor-pointer"
              >
                개인정보 수집 및 제3자 제공 동의 <span className="text-red-500 font-bold">*</span>
              </label>
              <p className="text-xs md:text-sm text-slate-500 leading-normal mt-1">
                상담 진행 및 크루즈 상품 예약을 위해 관계 법령에 따라 필수 동의가 요구됩니다.
              </p>
              <p className="text-[11px] md:text-xs text-slate-400 leading-normal mt-2 border-t border-dashed border-slate-200 pt-2 font-medium">
                ※ 원활한 상담 접수 확인 및 부정 접수 방지를 위해 접수 시 IP 주소, 접속 기기, 브라우저 정보 등 최소한의 접속 정보가 함께 저장될 수 있습니다.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-3 flex justify-between items-center">
            <button
              type="button"
              id="btn-open-terms"
              onClick={() => setShowTermsModal(true)}
              className="text-xs md:text-sm font-bold text-[#0A1E3F] underline flex items-center gap-1 cursor-pointer hover:text-blue-900"
            >
              <Shield className="h-3.5 w-3.5 text-[#C5A028]" />
              개인정보 약관 전체 보기
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">필수사항</span>
          </div>
          {errors.agreePrivacy && <p className="text-sm font-semibold text-red-500 mt-1">{errors.agreePrivacy}</p>}
        </div>

        {/* 10. Submission Button (Enormous, Easy to Click, Elegant Navy/Gold styling!) */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-submit-consultation"
            className="w-full bg-[#0A1E3F] hover:bg-[#112A4F] active:scale-[0.98] text-[#D4AF37] hover:text-white py-5 px-6 rounded-2xl font-extrabold text-xl md:text-2xl shadow-xl hover:shadow-2xl transition-all border-2 border-[#D4AF37] flex items-center justify-center gap-3.5 cursor-pointer"
          >
            <Sparkles className="h-6 w-6 animate-spin text-[#D4AF37]" style={{ animationDuration: '3s' }} />
            예약 상담 신청하기
          </button>
        </div>

        {/* Bottom Guideline Subtitle */}
        <p className="text-center text-sm md:text-base font-bold text-slate-500 py-1.5 flex items-center justify-center gap-1.5">
          <HelpCircle className="h-4.5 w-4.5 text-[#C5A028]" />
          접수된 내용은 담당자가 확인 후 순차적으로 연락드립니다.
        </p>

      </form>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#D4AF37]">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-lg font-bold">개인정보 수집 및 이용 동의 약관</h3>
              </div>
              <button
                type="button"
                id="btn-close-terms-top"
                onClick={() => setShowTermsModal(false)}
                className="text-slate-300 hover:text-white font-extrabold text-xl w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-96 space-y-4 text-sm text-slate-600 font-normal leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 text-base mb-1">1. 개인정보의 수집·이용 목적</h4>
                <p>온국민크루즈 상담 대행 부서는 제공받은 정보를 다음 목적에만 제한적으로 사용합니다.</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                  <li>상담 신청자의 본인 확인 및 연령대 조율</li>
                  <li>희망하시는 일정, 예산 범위, 기항지 노선 안내 피드백</li>
                  <li>크루즈 선실 잔여 수량 파악 및 비행 편 좌석 상태 조율 후 통보</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base mb-1">2. 수집하는 개인정보 항목</h4>
                <p>성함, 연락처, 거주지역 대항군, 출발 예정시기, 탑승 예정인원, 관심 노선, 통화 편한 시간 등 일체 상담 유입 필요 데이터</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base mb-1">3. 개인정보의 보유 및 이용 기간</h4>
                <p>상담이 최종 완료되거나 취소 신청된 후, 통계 분석 및 분쟁 해결을 위해 관련 법령에 명시된 법정 보유 기한인 최대 1년까지 보관된 후 지체 없이 영구 파기 처리됩니다.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base mb-1">4. 동의를 거부할 권리 및 불이익</h4>
                <p>고객님께서는 개인정보 수집 동의를 거부하실 권리가 있으나, 거부 시 정상적인 크루즈 예약 상담 및 맞춤형 혜택 안내 서비스 제공이 불가합니다.</p>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                id="btn-accept-terms"
                onClick={() => {
                  setAgreePrivacy(true);
                  setShowTermsModal(false);
                }}
                className="flex-1 bg-[#0A1E3F] text-white py-3.5 rounded-xl font-bold hover:bg-blue-900 transition-colors cursor-pointer"
              >
                동의하고 닫기
              </button>
              <button
                type="button"
                id="btn-close-terms-bottom"
                onClick={() => setShowTermsModal(false)}
                className="px-5 bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
