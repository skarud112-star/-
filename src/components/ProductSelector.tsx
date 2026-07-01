import { CRUISE_PRODUCTS } from '../data/products';
import { Ship, Clock, Calendar, Check } from 'lucide-react';
import { CruiseProduct } from '../types';

interface ProductSelectorProps {
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
}

export default function ProductSelector({ selectedProductId, onSelectProduct }: ProductSelectorProps) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center bg-[#0A1E3F] text-[#D4AF37] text-sm font-bold w-6 h-6 rounded-full">1</span>
        <h3 className="text-lg md:text-xl font-bold text-[#0A1E3F]">희망하시는 크루즈 상품을 선택해 주세요</h3>
      </div>
      
      <p className="text-xs md:text-sm text-slate-500 mb-4 tracking-wide">
        * 여러 기항지 중에서 가장 관심 있는 코스를 하나 클릭해 주세요. 중복 고민 시 &apos;아직 미정&apos;을 선택해 주시면 맞춤 추천해 드립니다.
      </p>

      <div className="space-y-3.5">
        {CRUISE_PRODUCTS.map((product: CruiseProduct) => {
          const isSelected = selectedProductId === product.id;
          return (
            <button
              key={product.id}
              type="button"
              id={`product-card-${product.id}`}
              onClick={() => onSelectProduct(product.id)}
              className={`w-full text-left rounded-xl border-2 p-4 md:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#D4AF37] bg-[#F9F6F0] shadow-md ring-2 ring-[#D4AF37]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start w-full gap-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#0A1E3F] text-[#D4AF37]' : 'bg-slate-100 text-slate-500'}`}>
                    <Ship className="h-5 w-5" />
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-[#0A1E3F]">
                    {product.name}
                  </h4>
                </div>
                
                {/* Custom Large Checkbox */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                  isSelected ? 'border-[#0A1E3F] bg-[#0A1E3F] text-[#D4AF37]' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                </div>
              </div>

              {/* Tagline & Description */}
              <div className="mt-2.5">
                <p className="text-xs md:text-sm font-semibold text-[#C5A028] mb-1.5">
                  {product.tagline}
                </p>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                  {product.description}
                </p>
              </div>

              {/* Specs (Duration & Season) */}
              <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200/80 flex flex-wrap gap-x-5 gap-y-1 text-xs md:text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>소요 일정: <strong className="text-slate-700">{product.duration}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>추천 시즌: <strong className="text-slate-700">{product.season}</strong></span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
