import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { JOB_OPTIONS, MEAL_CFG, MEAL_KEYS, calcTotals } from '../constants';
import type { FoodItem, Gender, GraphPeriod, GraphView, MealKey, MealsState, NutritionTotals, UserInfo } from '../types';

type DashboardPageProps = {
  userInfo: UserInfo;
  setUserInfo: Dispatch<SetStateAction<UserInfo>>;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  meals: MealsState;
  totalConsumed: NutritionTotals;
  targetCalories: number;
  target: Omit<NutritionTotals, 'calories'>;
  pct: number;
  graphView: GraphView;
  graphPeriod: GraphPeriod;
  setGraphPeriod: Dispatch<SetStateAction<GraphPeriod>>;
  aiRecommendations: FoodItem[];
  isRecommendLoading: boolean;
  recommendError: string | null;
  isSaved: boolean;
  onSaveUser: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  onChangeDate: (days: number) => void;
  onOpenMealModal: (type: MealKey) => void;
};

export default function DashboardPage({
  userInfo,
  setUserInfo,
  selectedDate,
  setSelectedDate,
  meals,
  totalConsumed,
  targetCalories,
  target,
  pct,
  graphView,
  graphPeriod,
  setGraphPeriod,
  aiRecommendations,
  isRecommendLoading,
  recommendError,
  isSaved,
  onSaveUser,
  onLogout,
  onChangeDate,
  onOpenMealModal,
}: DashboardPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2"><span className="text-2xl">👹</span><h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">먹깨비</h1></div>
          <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shadow-sm text-sm">{userInfo.name ? userInfo.name.charAt(0) : '먹'}</div>
            <span className="text-sm font-semibold text-slate-600 hidden sm:inline">{userInfo.name ? `${userInfo.name} 님` : '사용자 님'}</span>
            <button onClick={onLogout} className="ml-2 text-xs font-bold text-slate-400 hover:text-red-500 underline underline-offset-2">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">📅 식사 기록 대시보드</h3>
                  <p className="text-xs text-slate-400 mt-0.5">날짜별로 데이터가 개별 관리됩니다. 자유롭게 날짜를 이동해 보세요.</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner flex-shrink-0">
                  <button type="button" onClick={() => onChangeDate(-1)} className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all text-xs font-black text-slate-600 active:scale-95">◀</button>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-xs">📅</span>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-xs font-black bg-transparent outline-none text-orange-600 cursor-pointer" />
                  </div>
                  <button type="button" onClick={() => onChangeDate(1)} className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all text-xs font-black text-slate-600 active:scale-95">▶</button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {MEAL_KEYS.map((type) => {
                  const cfg = MEAL_CFG[type];
                  const mealItems = meals[type].items;
                  const mealTotals = calcTotals(mealItems);
                  const totalGrams = mealTotals.carbs + mealTotals.protein + mealTotals.fat;
                  const carbsPct = totalGrams > 0 ? (mealTotals.carbs / totalGrams) * 100 : 0;
                  const proteinPct = totalGrams > 0 ? (mealTotals.protein / totalGrams) * 100 : 0;
                  const fatPct = totalGrams > 0 ? (mealTotals.fat / totalGrams) * 100 : 0;

                  return (
                    <button key={type} onClick={() => onOpenMealModal(type)} className={`relative flex flex-col items-center p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] group overflow-hidden w-full ${type === 'snack' ? 'scale-95 opacity-95' : ''} ${mealItems.length > 0 ? `${cfg.light} ${cfg.border}` : 'bg-slate-50 border-slate-200 border-dashed hover:border-slate-300'}`}>
                      <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${cfg.gradient}`} />
                      <span className={`relative z-10 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${cfg.gradient} shadow-sm mb-3 sm:mb-4`}>{cfg.emoji} {cfg.label}</span>
                      {mealItems.length > 0 && <span className={`absolute top-3 right-3 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-full bg-white/90 backdrop-blur shadow-sm ${cfg.accent}`}>{mealItems.length}가지</span>}
                      <div className="relative z-10 w-full bg-white/90 backdrop-blur rounded-2xl py-2.5 sm:py-3 px-2 sm:px-3 border border-white shadow-inner">
                        {mealTotals.calories > 0 ? (
                          <div className="text-center"><h4 className="text-xl sm:text-3xl font-black text-slate-800 leading-none">{mealTotals.calories}</h4><span className="text-[9px] sm:text-[10px] font-bold text-slate-400">kcal</span></div>
                        ) : (
                          <div className="text-center py-2"><span className="text-xs sm:text-sm font-bold text-slate-400">입력 대기중</span></div>
                        )}
                      </div>
                      {mealTotals.calories > 0 && (
                        <div className="relative z-10 w-full mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                          <div className="w-full bg-slate-200/70 h-1.5 sm:h-2 rounded-full overflow-hidden flex shadow-inner">
                            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${carbsPct}%` }} />
                            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${proteinPct}%` }} />
                            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${fatPct}%` }} />
                          </div>
                          <div className="flex flex-wrap gap-1 justify-center">
                            <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-bold">탄 {Math.round(mealTotals.carbs)}g</span>
                            <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 text-[9px] sm:text-[10px] font-bold">단 {Math.round(mealTotals.protein)}g</span>
                            <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[9px] sm:text-[10px] font-bold">지 {Math.round(mealTotals.fat)}g</span>
                          </div>
                        </div>
                      )}
                      {meals[type].imgUrl && <div className="relative z-10 w-full mt-3"><div className="h-10 sm:h-14 rounded-xl overflow-hidden border border-white shadow-md"><img src={meals[type].imgUrl} alt="" className="w-full h-full object-cover" /></div></div>}
                      <div className="relative z-10 mt-3 sm:mt-4"><span className={`text-[10px] sm:text-[11px] font-extrabold ${cfg.accent} group-hover:underline underline-offset-4`}>상세 보기 →</span></div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Intake Progress</p><h4 className="text-lg font-black text-slate-800">오늘의 권장 섭취량 달성도</h4></div>
                <div className="text-right"><span className="text-2xl font-black text-orange-500">{totalConsumed.calories}</span><span className="text-slate-400 font-medium text-sm"> / {targetCalories} kcal</span></div>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-6"><div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} /></div>

              <div className="grid grid-cols-4 gap-4 text-center mb-6">
                {[
                  { key: 'carbs', label: '🍚 탄수화물', color: 'text-blue-500', current: totalConsumed.carbs, target: target.carbs },
                  { key: 'protein', label: '🥩 단백질', color: 'text-green-500', current: totalConsumed.protein, target: target.protein },
                  { key: 'fat', label: '🧈 지방', color: 'text-amber-500', current: totalConsumed.fat, target: target.fat },
                  { key: 'sodium', label: '🧂 나트륨', color: 'text-red-500', current: totalConsumed.sodium, target: target.sodium },
                ].map(({ key, label, color, current, target: nutrientTarget }) => {
                  const nPct = Math.min(100, (current / nutrientTarget) * 100);
                  return (
                    <div key={key} className="flex flex-col items-center bg-slate-50/70 py-4 px-2 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                      <span className="text-[10px] font-extrabold text-slate-500 mb-2 truncate w-full">{label}</span>
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className={`${color} transition-all duration-1000`} strokeDasharray={`${nPct}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs sm:text-sm font-black text-slate-700">{current}{key === 'sodium' ? 'mg' : 'g'}</span>
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">/ {nutrientTarget}{key === 'sodium' ? 'mg' : 'g'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">📈 총 칼로리 vs 권장 칼로리 추이</h4>
                    <p className="text-[11px] text-slate-400 font-semibold">데이터 입력 및 날짜 이동 시 그래프가 입체적으로 자동 갱신됩니다.</p>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as GraphPeriod[]).map((period) => (
                      <button key={period} onClick={() => setGraphPeriod(period)} className={`text-[10px] font-black px-2 py-1 rounded-md transition-all ${graphPeriod === period ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : period === 'monthly' ? '월간' : '년간'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-4 overflow-x-auto">
                  <div className="min-w-[450px]">
                    <svg key={`${graphView.graphPeriod}-${graphView.safeIntake.join(',')}`} viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                      <defs><linearGradient id="intakeAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity="0.25" /><stop offset="100%" stopColor="#f97316" stopOpacity="0.00" /></linearGradient></defs>
                      {[0, 0.33, 0.66, 1].map((ratio, i) => {
                        const val = Math.round(graphView.maxCal * ratio);
                        const y = graphView.endY - ratio * graphView.graphHeight;
                        return <g key={`y${i}`}><line x1="50" y1={y} x2="480" y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray={ratio === 0.66 ? '0' : '3 3'} opacity="0.5" /><text x="42" y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="bold" opacity="0.7">{val}</text></g>;
                      })}
                      {graphView.intakeAreaPath && <path d={graphView.intakeAreaPath} fill="url(#intakeAreaGrad)" />}
                      {graphView.targetLinePath && <path d={graphView.targetLinePath} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 4" />}
                      {graphView.intakeLinePath && <path d={graphView.intakeLinePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                      {graphView.points.map((p) => (
                        <g key={`pt-${p.label}`}>
                          <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="#f97316" strokeWidth="2.5" />
                          {p.val > 0 && <text x={p.x} y={p.y - 9} textAnchor="middle" fill="#ea580c" fontSize="10" fontWeight="bold">{p.val} kcal</text>}
                          <text x={p.x} y="168" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">{p.label}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <form onSubmit={onSaveUser} className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">이름</label><input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full text-black bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:bg-white focus:border-orange-400 text-center" required /></div>
                  <div className="flex-[1.2]"><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">성별</label><div className="flex w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-[30px]">{(['male', 'female'] as Gender[]).map((gender) => <button key={gender} type="button" onClick={() => setUserInfo({ ...userInfo, gender })} className={`flex-1 text-[10px] font-bold transition-all ${userInfo.gender === gender ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{gender === 'male' ? '남성' : '여성'}</button>)}</div></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([{ key: 'age', label: '나이(세)' }, { key: 'height', label: '신장(cm)' }, { key: 'weight', label: '체중(kg)' }] as Array<{ key: 'age' | 'height' | 'weight'; label: string }>).map(({ key, label }) => (
                    <div key={key}><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">{label}</label><input type="number" value={userInfo[key]} onChange={(e) => setUserInfo((prev) => ({ ...prev, [key]: e.target.value }))} className="w-full text-black bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:bg-white focus:border-orange-400 text-center" required /></div>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">직업</label>
                  <div className="grid grid-cols-2 gap-1">
                    {JOB_OPTIONS.map((job) => <button key={job.value} type="button" onClick={() => setUserInfo((prev) => ({ ...prev, job: job.value }))} className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold text-left transition-all ${userInfo.job === job.value ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>{job.label}</button>)}
                  </div>
                </div>
                {isSaved && <div className="text-center text-[10px] font-bold text-green-600 bg-green-50 py-1.5 rounded-lg">✅ 정보 업데이트 완료!</div>}
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-2.5 rounded-xl text-xs hover:opacity-95 transition-all">내 정보 업데이트</button>
              </form>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4"><span className="text-xl">🤖</span><h4 className="text-sm font-black text-slate-800">AI 맞춤 추천</h4></div>
              {isRecommendLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" /><p className="text-xs font-bold text-slate-400">AI가 맞춤 메뉴를 분석 중...</p></div>
              ) : recommendError ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2"><span className="text-3xl">⚠️</span><p className="text-xs font-bold text-red-500">AI 추천 일시 오류</p><p className="text-[10px] text-slate-400 leading-snug break-keep">{recommendError}</p></div>
              ) : aiRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {aiRecommendations.map((menu, idx) => (
                    <div key={`${menu.name}-${idx}`} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white hover:border-orange-200 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-2"><span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-600 border-orange-100">🤖 AI 추천</span><span className="text-xs font-black text-orange-600">{menu.calories} kcal</span></div>
                      <h5 className="text-sm font-black text-slate-800 mb-1.5">{menu.name}</h5>
                      <p className="text-[10px] text-slate-500 leading-tight mb-3 break-keep">{menu.desc}</p>
                      <div className="flex gap-1.5"><span className="text-[10px] font-bold text-blue-600 bg-blue-50/70 border border-blue-100 px-1.5 py-0.5 rounded-md">탄 {menu.carbs}g</span><span className="text-[10px] font-bold text-green-600 bg-green-50/70 border border-green-100 px-1.5 py-0.5 rounded-md">단 {menu.protein}g</span><span className="text-[10px] font-bold text-amber-600 bg-amber-50/70 border border-amber-100 px-1.5 py-0.5 rounded-md">지 {menu.fat}g</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400"><span className="text-3xl mb-2">🍽️</span><p className="text-xs font-bold text-center">아침, 점심, 저녁 중 하나를 입력하면<br />AI가 맞춤 메뉴를 추천해드려요.</p></div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
