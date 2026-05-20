import { MEAL_CFG, calcTotals } from '../constants';
import type { FoodItem, MealKey, MealsState } from '../types';

type MealModalProps = {
  type: MealKey;
  meals: MealsState;
  selectedDate: string;
  onClose: () => void;
  onOpenSearch: (type: MealKey) => void;
  onOpenPhoto: (type: MealKey) => void;
  onRemoveFood: (type: MealKey, index: number) => void;
  onToggleFavorite: (food: FoodItem) => void;
  isFavorite: (foodName: string) => boolean;
};

export default function MealModal({
  type,
  meals,
  selectedDate,
  onClose,
  onOpenSearch,
  onOpenPhoto,
  onRemoveFood,
  onToggleFavorite,
  isFavorite,
}: MealModalProps) {
  const cfg = MEAL_CFG[type];
  const mealTotals = calcTotals(meals[type].items);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm px-0 sm:px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className={`bg-gradient-to-r ${cfg.gradient} px-6 py-5 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3 text-white">
            <span className="text-2xl">{cfg.emoji}</span>
            <div>
              <h3 className="text-lg font-black tracking-tight">{cfg.label} 식사 기록</h3>
              <p className="text-xs text-white/70 font-medium">{selectedDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className={`${cfg.light} px-5 py-4 border-b ${cfg.border} flex-shrink-0`}>
          <div className="grid grid-cols-5 gap-1.5 text-center w-full">
            {[
              { label: '탄수화물', val: mealTotals.carbs, color: 'text-blue-600', bg: 'bg-blue-50/80 border-blue-100', unit: 'g' },
              { label: '단백질', val: mealTotals.protein, color: 'text-green-600', bg: 'bg-green-50/80 border-green-100', unit: 'g' },
              { label: '지방', val: mealTotals.fat, color: 'text-amber-600', bg: 'bg-amber-50/80 border-amber-100', unit: 'g' },
              { label: '칼로리', val: mealTotals.calories, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-150 font-black', unit: 'kcal' },
              { label: '나트륨', val: mealTotals.sodium, color: 'text-red-600', bg: 'bg-red-50/80 border-red-100', unit: 'mg' },
            ].map(({ label, val, color, bg, unit }) => (
              <div key={label} className={`border rounded-xl px-1 py-2.5 flex flex-col justify-center items-center shadow-sm ${bg}`}>
                <p className="text-[10px] font-black text-slate-400 mb-1 leading-none">{label}</p>
                <p className={`text-xs sm:text-sm font-black tracking-tight ${color} leading-none`}>{Math.round(val)}{unit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {meals[type].items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <span className="text-5xl mb-3">🍽️</span>
              <p className="text-sm font-bold text-slate-400">아직 등록된 음식이 없어요</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {meals[type].items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex flex-col sm:flex-row sm:items-center px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 group hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all gap-3">
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      {item.grams && <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">{item.grams}g</span>}
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded-md border border-blue-100">탄 {item.carbs}g</span>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50/80 px-1.5 py-0.5 rounded-md border border-green-100">단 {item.protein}g</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-100">지 {item.fat}g</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto text-right">
                    <span className="w-14 text-sm font-black text-orange-500">{item.calories} kcal</span>
                    <button onClick={() => onToggleFavorite(item)} className={`transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 ${isFavorite(item.name) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} title={isFavorite(item.name) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite(item.name) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <button onClick={() => onRemoveFood(type, idx)} className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { onClose(); onOpenSearch(type); }} className={`flex items-center justify-center gap-2 bg-white border-2 ${cfg.btnBorder} ${cfg.accent} text-sm font-bold py-3.5 rounded-xl ${cfg.btnHover} transition-all shadow-sm active:scale-95`}>
              메뉴 추가
            </button>
            <button onClick={() => { onClose(); onOpenPhoto(type); }} className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-600 text-sm font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
              사진 분석
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
