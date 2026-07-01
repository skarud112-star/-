import { useState } from 'react';
import Hero from './components/Hero';
import NoticeBox from './components/NoticeBox';
import ProductSelector from './components/ProductSelector';
import ConsultationForm from './components/ConsultationForm';
import ProcessGuide from './components/ProcessGuide';
import FAQ from './components/FAQ';
import SuccessState from './components/SuccessState';
import AdminDashboard from './components/AdminDashboard';
import { ConsultationRequest } from './types';
import { Ship, Phone, Award, ShieldAlert } from 'lucide-react';

export default function App() {
  const [selectedProductId, setSelectedProductId] = useState('southeast-asia');
  const [submittedData, setSubmittedData] = useState<ConsultationRequest | null>(null);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    // Smooth scroll down to form section slightly to keep the user guided
    const formSec = document.getElementById('select-product');
    if (formSec) {
      formSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFormChangeProduct = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleSubmitSuccess = (data: ConsultationRequest) => {
    setSubmittedData(data);
    // Dispatch custom event to notify Admin Dashboard to reload immediately!
    window.dispatchEvent(new Event('consultation_submitted'));
    // Scroll to top of the screen to show the success message cleanly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSubmittedData(null);
    setSelectedProductId('southeast-asia');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#030D1A] py-0 md:py-8 flex items-center justify-center font-sans selection:bg-[#D4AF37]/30 selection:text-[#0A1E3F]">
      
      {/* Centered Mobile-oriented Vertical Container with Navy/Gold high-end style */}
      <div className="w-full max-w-2xl bg-white shadow-2xl md:rounded-3xl overflow-hidden border-x-0 md:border-2 md:border-[#D4AF37]/30 flex flex-col min-h-screen md:min-h-0">
        
        {/* Superior Luxury Header bar */}
        <header className="bg-[#0A1E3F] text-[#D4AF37] px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2">
            <Ship className="h-6 w-6" />
            <span className="text-lg font-black tracking-wider text-white">
              온국민<span className="text-[#D4AF37]">크루즈</span>
            </span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-[#D4AF37]/30 py-1 px-3 rounded-full">
            <Phone className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-xs font-bold text-white tracking-tight">상담안내: 1544-0000</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-white">
          {window.location.pathname === '/admin' || 
          window.location.pathname.startsWith('/admin') || 
          new URLSearchParams(window.location.search).get('admin') === 'true' ? (
            /* Dedicated Admin page view */
            <div className="py-4">
              <AdminDashboard />
            </div>
          ) : !submittedData ? (
            <div className="space-y-2 animate-in fade-in duration-300">
              {/* 1. Brand Banner Hero */}
              <Hero />

              {/* 2. Urgent Disclaimer NoticeBox */}
              <NoticeBox />

              {/* 3. High-Quality Multi-select Product Cards */}
              <ProductSelector 
                selectedProductId={selectedProductId}
                onSelectProduct={handleProductSelect}
              />

              {/* 4. Sequential Process Map */}
              <ProcessGuide />

              {/* 5. In-depth Detailed Consultation Input Fields */}
              <ConsultationForm 
                selectedProductId={selectedProductId}
                onProductChange={handleFormChangeProduct}
                onSubmitSuccess={handleSubmitSuccess}
              />

              {/* 6. High-Trust Senior Accordion FAQ */}
              <FAQ />
            </div>
          ) : (
            /* Elegant state toggle on successful submission */
            <SuccessState 
              requestData={submittedData}
              onReset={handleReset}
            />
          )}
        </main>

        {/* Trust Badges above footer */}
        {!(window.location.pathname === '/admin' || 
          window.location.pathname.startsWith('/admin') || 
          new URLSearchParams(window.location.search).get('admin') === 'true') && (
          <section className="bg-slate-50 border-t border-slate-100 px-6 py-6 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-slate-200/50 text-[#0A1E3F] mb-1">
                <Award className="h-5 w-5 text-[#C5A028]" />
              </div>
              <span className="text-xs font-bold text-slate-700">소비자 브랜드 대상</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-slate-200/50 text-[#0A1E3F] mb-1">
                <Phone className="h-5 w-5 text-[#C5A028]" />
              </div>
              <span className="text-xs font-bold text-slate-700">해피콜 피드백 1위</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-slate-200/50 text-[#0A1E3F] mb-1">
                <Ship className="h-5 w-5 text-[#C5A028]" />
              </div>
              <span className="text-xs font-bold text-slate-700">10만톤급 대형 선박</span>
            </div>
          </section>
        )}

        {/* Safe Demo Admin panel inside localStorage */}
        {!(window.location.pathname === '/admin' || 
          window.location.pathname.startsWith('/admin') || 
          new URLSearchParams(window.location.search).get('admin') === 'true') && (
          <AdminDashboard />
        )}

        {/* Brand Legal Footer */}
        <footer className="bg-[#0A1E3F] text-slate-400 text-xs px-6 py-8 border-t border-[#D4AF37]/20 space-y-4">
          <div className="space-y-1.5 leading-relaxed">
            <p className="font-extrabold text-slate-200 text-sm">온국민크루즈 (주)</p>
            <p>공동대표이사: 홍길동, 김철수 | 서울특별시 중구 태평로 1가 84</p>
            <p>고객센터: 1544-0000 | 이메일: cs@ongukmincruise.co.kr</p>
            <p>사업자등록번호: 120-81-00000 | 통신판매업신고: 제 2026-서울중구-0123호</p>
            <p>기획여행 배상책임보험 및 기획여행보증보험 5억원 가입 완료</p>
          </div>
          
          <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>© 2026 온국민크루즈 주식회사. All rights reserved.</span>
              <button
                type="button"
                id="btn-footer-hidden-admin"
                onClick={() => window.dispatchEvent(new Event('toggle_admin_dashboard'))}
                className="text-[9px] text-slate-700 hover:text-slate-500 transition-colors duration-150 cursor-pointer select-none font-semibold px-1 bg-transparent border-0"
                title="System Administration"
              >
                [관리]
              </button>
            </div>
            <div className="flex gap-2.5 font-semibold">
              <span className="text-slate-400">개인정보처리방침</span>
              <span>|</span>
              <span>여행약관</span>
              <span>|</span>
              <span>이용약관</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
