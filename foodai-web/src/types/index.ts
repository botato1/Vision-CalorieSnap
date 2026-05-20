export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Gender = 'male' | 'female';
export type AnalysisStatus = 'idle' | 'analyzing' | 'done';
export type GraphPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type NutritionTotals = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodium: number;
};

export type FoodItem = NutritionTotals & {
  name: string;
  grams?: number;
  desc?: string;
};

export type SearchFoodResponse = {
  foodName: string;
  makerName?: string;
  calories: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  sodium?: number;
};

export type MealSlot = {
  items: FoodItem[];
  imgUrl: string | null;
};

export type MealsState = Record<MealKey, MealSlot>;
export type MealsByDate = Record<string, MealsState>;

export type UserInfo = {
  name: string;
  gender: Gender;
  age: string;
  height: string;
  weight: string;
  job: number | '';
};

export type UserProfileResponse = {
  profileID?: string;
  profileId?: string;
  name: string;
  male: boolean;
  height: number;
  weight: number;
  age: number;
  targetCalories: number;
  job: number;
};

export type ApiMealRecord = {
  mealType: MealKey | number | string;
  foods?: Array<{
    name?: string;
    foodName?: string;
    grams?: number;
    intakeAmount?: number;
    calories?: number;
    carbs?: number;
    carbohydrate?: number;
    protein?: number;
    fat?: number;
    sodium?: number;
  }>;
};

export type MealConfig = {
  label: string;
  emoji: string;
  gradient: string;
  light: string;
  border: string;
  accent: string;
  pill: string;
  btnBorder: string;
  btnHover: string;
};

export type GraphData = {
  labels: string[];
  intake: number[];
  target: number[];
};

export type GraphView = {
  graphPeriod: GraphPeriod;
  safeIntake: number[];
  maxCal: number;
  endY: number;
  graphHeight: number;
  points: Array<{ x: number; y: number; val: number; label: string }>;
  intakeAreaPath: string;
  intakeLinePath: string;
  targetLinePath: string;
};
