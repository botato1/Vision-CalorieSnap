import { MEAL_CFG } from '../constants';
import type { FoodItem, MealKey, SearchFoodResponse } from '../types';

type SearchModalProps = {
  searchMealType: MealKey | null;
  searchQuery: string;
  searchResults: SearchFoodResponse[];
  isSearchLoading: boolean;
  favorites: FoodItem[];
  onClose: () => void;
  onSearchQueryChange: (value: string) => void;
  onSearchFood: (query: string) => void;
  onSelectFood: (food: FoodItem) => void;
  onToggleFavorite: (food: FoodItem) => void;
  isFavorite: (foodName: string) => boolean;
};

export default function SearchModal({
  searchMealType,
  searchQuery,
  searchResults,
  isSearchLoading,
  favorites,
  onClose,
  onSearchQueryChange,
  onSearchFood,
  onSelectFood,
  onToggleFavorite,
  isFavorite,
}: SearchModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">{searchMealType ? MEAL_CFG[searchMealType].emoji : ''} {searchMealType ? MEAL_CFG[searchMealType].label : ''} 메뉴 검색</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6">
          <div className="relative mb-4">
            <input type="text" value={searchQuery} onChange={(e) => { onSearchQueryChange(e.target.value); onSearchFood(e.target.value); }} placeholder="음식명을 입력하세요 (예: 마라탕, 치킨)" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white transition-all text-slate-800 font-bold" autoFocus />
            <svg className="w-4 h-4 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {!searchQuery && (
            <div className="mb-4">
              <p className="text-[10px] font-extrabold text-amber-500 mb-2 flex items-center gap-1">★ 즐겨찾기</p>
              {favorites.length === 0 ? (
                <div className="text-center py-3 text-slate-400 text-xs font-bold bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                  검색 후 별 버튼을 눌러 즐겨찾기에 추가하세요
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {favorites.map((food, idx) => (
                    <div key={`${food.name}-${idx}`} className="flex items-center px-4 py-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-all">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectFood(food)}>
                        <span className="text-sm font-bold text-slate-700">{food.name}</span>
                        <span className="text-xs font-bold text-amber-500 ml-2">{food.calories} kcal</span>
                      </div>
                      <button onClick={() => onToggleFavorite(food)} className="ml-2 text-amber-400 hover:text-slate-400 transition-colors flex-shrink-0" title="즐겨찾기 해제">★</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-slate-100 mt-3 mb-1" />
            </div>
          )}

          <div className="h-52 overflow-y-auto space-y-1.5 pr-1">
            {isSearchLoading ? (
              <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" /></div>
            ) : searchResults.length > 0 ? (
              searchResults.map((food, idx) => {
                const foodObj: FoodItem = {
                  name: food.makerName ? `[${food.makerName}] ${food.foodName}` : food.foodName,
                  calories: food.calories,
                  carbs: food.carbohydrate,
                  protein: food.protein,
                  fat: food.fat,
                  sodium: food.sodium || 0,
                };
                return (
                  <div key={`${food.foodName}-${idx}`} className="flex items-center px-4 py-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectFood(foodObj)}>
                      {food.makerName && <span className="text-[10px] font-bold text-slate-400">{food.makerName} · </span>}
                      <span className="text-sm font-bold text-slate-700">{food.foodName}</span>
                      <span className="text-sm font-black text-orange-500 ml-2">{Math.round(food.calories)} kcal</span>
                    </div>
                    <button onClick={() => onToggleFavorite(foodObj)} className={`ml-2 flex-shrink-0 transition-all ${isFavorite(foodObj.name) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} title={isFavorite(foodObj.name) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>★</button>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <p className="text-sm">{searchQuery ? '검색 결과가 없습니다.' : '음식명을 입력하세요.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
