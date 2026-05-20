import type { FoodItem } from '../types';

type AmountModalProps = {
  food: FoodItem;
  foodGrams: number;
  onFoodGramsChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  onToggleFavorite: (food: FoodItem) => void;
  isFavorite: (foodName: string) => boolean;
};

export default function AmountModal({
  food,
  foodGrams,
  onFoodGramsChange,
  onClose,
  onConfirm,
  onToggleFavorite,
  isFavorite,
}: AmountModalProps) {
  const ratio = foodGrams / 100;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-orange-400 to-amber-500 px-6 py-5 flex justify-between items-center text-white">
          <h3 className="text-lg font-black tracking-tight">섭취 용량 설정</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => onToggleFavorite(food)} className={`transition-all ${isFavorite(food.name) ? 'text-amber-300' : 'text-white/50 hover:text-amber-200'}`} title={isFavorite(food.name) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>★</button>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <h4 className="text-2xl font-black text-slate-800 mb-1">{food.name}</h4>
            <p className="text-xs font-bold text-slate-400">기본 제공량: 100g 기준</p>
          </div>
          <div className="flex flex-col items-center mb-6">
            <label className="text-xs font-extrabold text-slate-500 mb-2 block">실제 섭취한 양(g)</label>
            <div className="relative flex items-center max-w-[150px]">
              <input type="number" min="1" value={foodGrams} onChange={(e) => onFoodGramsChange(Number(e.target.value) || 0)} className="w-full text-center text-3xl font-black text-orange-500 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pr-8 focus:outline-none focus:border-orange-400 focus:bg-white transition-all" />
              <span className="absolute right-4 text-lg font-bold text-slate-400">g</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 shadow-inner">
            <p className="text-center text-[10px] font-extrabold text-slate-400 mb-3 tracking-wide">예상 섭취 영양 성분</p>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[
                { label: '탄수화물', val: Math.round(food.carbs * ratio), color: 'text-blue-600' },
                { label: '단백질', val: Math.round(food.protein * ratio), color: 'text-green-600' },
                { label: '지방', val: Math.round(food.fat * ratio), color: 'text-amber-600' },
                { label: '칼로리', val: Math.round(food.calories * ratio), color: 'text-orange-500' },
                { label: '나트륨', val: Math.round((food.sodium || 0) * ratio), color: 'text-red-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white rounded-xl py-2 px-1 border border-slate-100">
                  <span className="block text-[9px] font-bold text-slate-400 mb-1">{label}</span>
                  <span className={`block text-xs sm:text-sm font-black ${color}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl text-sm hover:bg-slate-200 transition-colors">취소</button>
            <button onClick={onConfirm} disabled={foodGrams <= 0} className="flex-[2] bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold py-3.5 rounded-xl shadow-md text-sm hover:opacity-95 transition-all disabled:opacity-50">식단에 추가하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
