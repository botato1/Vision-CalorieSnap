import type { ApiMealRecord, FoodItem, MealConfig, MealKey, MealsState, NutritionTotals } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5260';
export const MEAL_KEYS: MealKey[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const JOB_OPTIONS = [
  { value: 0, label: '💼 사무직/학생', desc: '주로 앉아서 생활하는 직업', multiplier: 1.2 },
  { value: 1, label: '🎓 대학생', desc: '통학 중심, 가벼운 이동', multiplier: 1.3 },
  { value: 2, label: '🏃 가벼운 활동직', desc: '하루 종일 몸을 쓰는 직업', multiplier: 1.375 },
  { value: 3, label: '🛎️ 서비스/판매직', desc: '이동과 활동이 많은 직업', multiplier: 1.55 },
  { value: 4, label: '🏋️ 현장/프리랜서', desc: '집이나 개인 작업 공간에서 주로 근무하는 형태', multiplier: 1.725 },
  { value: 5, label: '🏃 운동선수/트레이너', desc: '고강도 훈련이 일상인 직업', multiplier: 1.9 },
];

export const MEAL_CFG: Record<MealKey, MealConfig> = {
  breakfast: { label: '아침', emoji: '🌅', gradient: 'from-sky-400 to-blue-500', light: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-600', pill: 'bg-sky-100 text-sky-700', btnBorder: 'border-sky-300', btnHover: 'hover:bg-sky-50' },
  lunch: { label: '점심', emoji: '☀️', gradient: 'from-orange-400 to-amber-500', light: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-600', pill: 'bg-orange-100 text-orange-700', btnBorder: 'border-orange-300', btnHover: 'hover:bg-orange-50' },
  dinner: { label: '저녁', emoji: '🌙', gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-600', pill: 'bg-violet-100 text-violet-700', btnBorder: 'border-violet-300', btnHover: 'hover:bg-violet-50' },
  snack: { label: '간식', emoji: '🍩', gradient: 'from-pink-400 to-rose-500', light: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-600', pill: 'bg-pink-100 text-pink-700', btnBorder: 'border-pink-300', btnHover: 'hover:bg-pink-50' },
};

export const createEmptyMeals = (): MealsState => ({
  breakfast: { items: [], imgUrl: null },
  lunch: { items: [], imgUrl: null },
  dinner: { items: [], imgUrl: null },
  snack: { items: [], imgUrl: null },
});

export const mealTypeFromApi = (value: ApiMealRecord['mealType']): MealKey | null => {
  if (value === 0 || value === '0' || value === 'breakfast' || value === 'Breakfast') return 'breakfast';
  if (value === 1 || value === '1' || value === 'lunch' || value === 'Lunch') return 'lunch';
  if (value === 2 || value === '2' || value === 'dinner' || value === 'Dinner') return 'dinner';
  if (value === 3 || value === '3' || value === 'snack' || value === 'Snack') return 'snack';
  return null;
};

export const parseAiJson = (raw: unknown) => {
  if (typeof raw !== 'string') return raw;
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  const start = Math.min(
    ...[cleaned.indexOf('['), cleaned.indexOf('{')].filter((idx) => idx >= 0),
  );
  const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonText);
};

export function calcTotals(items: FoodItem[]): NutritionTotals {
  return items.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    carbs: acc.carbs + item.carbs,
    protein: acc.protein + item.protein,
    fat: acc.fat + item.fat,
    sodium: acc.sodium + (item.sodium || 0),
  }), { calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 });
}
