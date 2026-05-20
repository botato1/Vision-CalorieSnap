'use client';

import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react';
const API_BASE = 'http://localhost:5260/api';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type FoodItem = {
  mealFoodId?: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodium?: number;
  grams?: number;
};

type MealSlot = {
  items: FoodItem[];
  imgUrl: string | null;
  mealId?: number;
};

type Meals = Record<MealType, MealSlot>;

type ApiFoodSearchResult = {
  foodName?: string;
  FoodName?: string;
  calories?: number;
  Calories?: number;
  carbohydrate?: number;
  Carbohydrate?: number;
  protein?: number;
  Protein?: number;
  fat?: number;
  Fat?: number;
  sodium?: number;
  Sodium?: number;
};

type UserInfo = Record<'name' | 'gender' | 'age' | 'height' | 'weight' | 'job', string>;
type GraphPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type AnalysisStatus = 'idle' | 'analyzing' | 'done' | 'error';

type ApiMealRecord = {
  mealID?: number;
  MealID?: number;
  mealType?: number | string;
  MealType?: number | string;
};

type ApiMealDetail = ApiMealRecord & {
  foods?: ApiMealFood[];
  Foods?: ApiMealFood[];
};

type ApiMealFood = {
  mealFoodID?: number;
  MealFoodID?: number;
  foodName?: string;
  FoodName?: string;
  intakeAmount?: number;
  IntakeAmount?: number;
  calories?: number;
  Calories?: number;
  protein?: number;
  Protein?: number;
  carbohydrate?: number;
  Carbohydrate?: number;
  fat?: number;
  Fat?: number;
  sodium?: number;
  Sodium?: number;
};

type ApiUserProfile = {
  profileID?: string;
  ProfileID?: string;
  name?: string;
  Name?: string;
  male?: boolean;
  Male?: boolean;
  height?: number;
  Height?: number;
  weight?: number;
  Weight?: number;
  age?: number | null;
  Age?: number | null;
  targetCalories?: number;
  TargetCalories?: number;
};

type AnalyzeFoodResult = FoodItem & {
  servingSize?: string;
};

type GeminiAnalyzeResult = {
  foods?: Array<{
    name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    carbohydrate?: number;
    fat?: number;
    sodium?: number;
    serving_size?: string;
    servingSize?: string;
  }>;
};

const createEmptyMeals = (): Meals => ({
  breakfast: { items: [], imgUrl: null },
  lunch: { items: [], imgUrl: null },
  dinner: { items: [], imgUrl: null },
  snack: { items: [], imgUrl: null },
});

const normalizeFoodSearchResult = (food: ApiFoodSearchResult): FoodItem => ({
  name: food.foodName ?? food.FoodName ?? '',
  calories: Math.round(Number(food.calories ?? food.Calories ?? 0)),
  carbs: Math.round(Number(food.carbohydrate ?? food.Carbohydrate ?? 0)),
  protein: Math.round(Number(food.protein ?? food.Protein ?? 0)),
  fat: Math.round(Number(food.fat ?? food.Fat ?? 0)),
  sodium: Math.round(Number(food.sodium ?? food.Sodium ?? 0)),
});

const mealTypeToApi: Record<MealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

const apiMealTypeToMealType = (value: number | string | undefined): MealType | null => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : value;
  if (normalized === 0 || normalized === '0' || normalized === 'breakfast') return 'breakfast';
  if (normalized === 1 || normalized === '1' || normalized === 'lunch') return 'lunch';
  if (normalized === 2 || normalized === '2' || normalized === 'dinner') return 'dinner';
  if (normalized === 3 || normalized === '3' || normalized === 'snack') return 'snack';
  return null;
};

const normalizeMealFood = (food: ApiMealFood): FoodItem => ({
  mealFoodId: Number(food.mealFoodID ?? food.MealFoodID) || undefined,
  name: food.foodName ?? food.FoodName ?? '',
  grams: Math.round(Number(food.intakeAmount ?? food.IntakeAmount ?? 0)),
  calories: Math.round(Number(food.calories ?? food.Calories ?? 0)),
  carbs: Math.round(Number(food.carbohydrate ?? food.Carbohydrate ?? 0)),
  protein: Math.round(Number(food.protein ?? food.Protein ?? 0)),
  fat: Math.round(Number(food.fat ?? food.Fat ?? 0)),
  sodium: Math.round(Number(food.sodium ?? food.Sodium ?? 0)),
});

const parseAnalyzeResult = (result: string): AnalyzeFoodResult | null => {
  try {
    const jsonText = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonText) as GeminiAnalyzeResult;
    const food = parsed.foods?.[0];
    if (!food?.name) return null;

    return {
      name: food.name,
      calories: Math.round(Number(food.calories ?? 0)),
      protein: Math.round(Number(food.protein ?? 0)),
      carbs: Math.round(Number(food.carbs ?? food.carbohydrate ?? 0)),
      fat: Math.round(Number(food.fat ?? 0)),
      sodium: Math.round(Number(food.sodium ?? 0)),
      grams: 100,
      servingSize: food.serving_size ?? food.servingSize,
    };
  } catch {
    return null;
  }
};

const normalizeUserProfile = (profile: ApiUserProfile): Partial<UserInfo> => {
  const age = profile.age ?? profile.Age;
  const height = profile.height ?? profile.Height;
  const weight = profile.weight ?? profile.Weight;
  const male = profile.male ?? profile.Male;

  return {
    name: String(profile.name ?? profile.Name ?? ''),
    gender: male === false ? 'female' : 'male',
    age: age ? String(age) : '',
    height: height ? String(height) : '',
    weight: weight ? String(weight) : '',
  };
};

const RECOMMEND_MENU_DB = [
  { name: '🍗 숯불 구이 치킨 도시락', tag: '🔥 고단백 추천', tagColor: 'bg-green-50 text-green-600 border-green-100', calories: 450, carbs: 35, protein: 38, fat: 8, desc: '부족한 단백질을 38g이나 채워줄 수 있는 저지방 고단백 한 끼입니다.' },
  { name: '🥑 연어 아보카도 샐러드 랩', tag: '⚖️ 영양 균형식', tagColor: 'bg-blue-50 text-blue-600 border-blue-100', calories: 380, carbs: 42, protein: 22, fat: 12, desc: '탄수화물과 지방의 밸런스가 뛰어나며 오메가3가 풍부합니다.' },
];

const JOB_OPTIONS = [
  { value: 'office', label: '💼 사무직', desc: '하루 대부분 앉아서 근무' },
  { value: 'student', label: '📚 학생', desc: '학교/학원 중심 생활' },
  { value: 'physical', label: '🔨 육체 노동직', desc: '활동량이 많은 직업' },
  { value: 'service', label: '🛎️ 서비스직', desc: '서서 이동이 많은 직업' },
  { value: 'freelance', label: '🏠 재택/프리랜서', desc: '집에서 주로 작업' },
  { value: 'athlete', label: '🏃 운동선수/트레이너', desc: '고강도 활동 직업' },
];

const MEAL_CFG: Record<MealType, { label: string; emoji: string; gradient: string; light: string; border: string; accent: string; pill: string; btnBorder: string; btnHover: string }> = {
  breakfast: { label: '아침', emoji: '🌅', gradient: 'from-sky-400 to-blue-500', light: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-600', pill: 'bg-sky-100 text-sky-700', btnBorder: 'border-sky-300', btnHover: 'hover:bg-sky-50' },
  lunch:     { label: '점심', emoji: '☀️', gradient: 'from-orange-400 to-amber-500', light: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-600', pill: 'bg-orange-100 text-orange-700', btnBorder: 'border-orange-300', btnHover: 'hover:bg-orange-50' },
  dinner:    { label: '저녁', emoji: '🌙', gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-600', pill: 'bg-violet-100 text-violet-700', btnBorder: 'border-violet-300', btnHover: 'hover:bg-violet-50' },
  snack:     { label: '간식', emoji: '🍩', gradient: 'from-pink-400 to-rose-500', light: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-600', pill: 'bg-pink-100 text-pink-700', btnBorder: 'border-pink-300', btnHover: 'hover:bg-pink-50' },
};

function calcTotals(items: FoodItem[]) {
  return items.reduce((acc, item) => ({ 
    calories: acc.calories + item.calories, 
    carbs: acc.carbs + item.carbs, 
    protein: acc.protein + item.protein, 
    fat: acc.fat + item.fat,
    sodium: acc.sodium + (item.sodium || 0)
  }), { calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 });
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialSetupDone, setIsInitialSetupDone] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [profileId, setProfileId] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', gender: 'male', age: '', height: '', weight: '', job: '' });
  const [isSaved, setIsSaved] = useState(false);
  
  // 1. 캘린더 날짜 상태 관리
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const TARGET_CALORIES = 2000;
  const TARGET = { carbs: 250, protein: 120, fat: 65, sodium: 2000 };
  
  // 2. 날짜별 고유 식단 기록 저장을 위한 Map 형태의 상태 개편
  const [mealsByDate, setMealsByDate] = useState<Record<string, Meals>>({
    [new Date().toISOString().split('T')[0]]: createEmptyMeals()
  });

  // 현재 선택된 날짜의 식단 가져오기
  const currentMeals = mealsByDate[selectedDate] || createEmptyMeals();

  const meals = currentMeals;

  // 상태 업데이트 헬퍼 함수
  const setMeals = (updater: Meals | ((current: Meals) => Meals)) => {
    setMealsByDate(prev => {
      const current = prev[selectedDate] || createEmptyMeals();
      const updated = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        [selectedDate]: updated
      };
    });
  };

  const [mealModalType, setMealModalType] = useState<MealType | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMealType, setSearchMealType] = useState<MealType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearchingFood, setIsSearchingFood] = useState(false);
  const [foodSearchError, setFoodSearchError] = useState('');
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<FoodItem | null>(null);
  const [foodGrams, setFoodGrams] = useState(100);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [photoMealType, setPhotoMealType] = useState<MealType | null>(null);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analyzedFood, setAnalyzedFood] = useState<AnalyzeFoodResult | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [graphPeriod, setGraphPeriod] = useState<GraphPeriod>('daily');

  const allItems = [...meals.breakfast.items, ...meals.lunch.items, ...meals.dinner.items, ...meals.snack.items];
  const totalConsumed = calcTotals(allItems);
  const pct = Math.min(100, Math.round((totalConsumed.calories / TARGET_CALORIES) * 100));

  const loadMealsForDate = async (nextProfileId = profileId, nextDate = selectedDate) => {
    if (!nextProfileId) return;

    const response = await fetch(`${API_BASE}/meals/profile/${encodeURIComponent(nextProfileId)}/date/${nextDate}`);
    if (!response.ok) {
      throw new Error('식사 기록 조회에 실패했습니다.');
    }

    const records = await response.json() as ApiMealRecord[];
    const details = await Promise.all(records.map(async (record) => {
      const mealId = Number(record.mealID ?? record.MealID);
      if (!mealId) return null;

      const detailResponse = await fetch(`${API_BASE}/meals/detail/${mealId}`);
      if (!detailResponse.ok) return null;
      return await detailResponse.json() as ApiMealDetail;
    }));

    const nextMeals = createEmptyMeals();
    details.filter(Boolean).forEach((detail) => {
      const mealType = apiMealTypeToMealType(detail?.mealType ?? detail?.MealType);
      if (!detail || !mealType) return;

      nextMeals[mealType] = {
        ...nextMeals[mealType],
        mealId: Number(detail.mealID ?? detail.MealID),
        items: (detail.foods ?? detail.Foods ?? []).map(normalizeMealFood).filter(food => food.name),
      };
    });

    setMealsByDate(prev => ({
      ...prev,
      [nextDate]: nextMeals,
    }));
  };

  useEffect(() => {
    if (!isLoggedIn || !isInitialSetupDone || !profileId) return;

    loadMealsForDate().catch(() => {
      setMealsByDate(prev => ({
        ...prev,
        [selectedDate]: createEmptyMeals(),
      }));
    });
  }, [isLoggedIn, isInitialSetupDone, profileId, selectedDate]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const closeLoginModal = () => { setIsLoginModalOpen(false); setLoginId(''); setLoginPw(''); setLoginError(''); };
  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProfileID: loginId, ProfilePW: loginPw }),
      });

      if (!response.ok) {
        throw new Error('아이디 또는 비밀번호가 틀렸습니다.');
      }

      const data = await response.json();
      const nextProfileId = String(data.profileId ?? data.ProfileID ?? loginId);
      const nextName = String(data.name ?? data.Name ?? '');
      const profileResponse = await fetch(`${API_BASE}/auth/${encodeURIComponent(nextProfileId)}`);
      const profile = profileResponse.ok ? await profileResponse.json() as ApiUserProfile : null;
      const normalizedProfile = profile ? normalizeUserProfile(profile) : {};

      setProfileId(nextProfileId);
      setUserInfo(prev => ({
        ...prev,
        ...normalizedProfile,
        name: normalizedProfile.name || nextName || prev.name,
        job: prev.job || 'office',
      }));
      setIsLoggedIn(true);
      setIsInitialSetupDone(Boolean((normalizedProfile.height || userInfo.height) && (normalizedProfile.weight || userInfo.weight)));
      closeLoginModal();
    } catch (error) {
      setLoginError(error instanceof TypeError ? 'API 서버에 연결할 수 없습니다. 서버가 http://localhost:5260 에서 실행 중인지 확인해주세요.' : error instanceof Error ? error.message : '로그인 중 문제가 발생했습니다.');
    }
  };
  const handleInitialSetupSubmit = async (e: FormEvent<HTMLFormElement>) => { 
    e.preventDefault();
    if (!userInfo.job) { alert('직업을 선택해주세요.'); return; }

    try {
      if (profileId) {
        const response = await fetch(`${API_BASE}/auth/${encodeURIComponent(profileId)}/body`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Height: Number(userInfo.height),
            Weight: Number(userInfo.weight),
            TargetCalories: TARGET_CALORIES,
          }),
        });

        if (!response.ok) {
          throw new Error('신체 정보 저장에 실패했습니다.');
        }
      }

      setIsInitialSetupDone(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : '신체 정보 저장 중 문제가 발생했습니다.');
    }
  };
  const handleSaveUser = async (e: FormEvent<HTMLFormElement>) => { 
    e.preventDefault();

    try {
      if (profileId) {
        const response = await fetch(`${API_BASE}/auth/${encodeURIComponent(profileId)}/body`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Height: Number(userInfo.height),
            Weight: Number(userInfo.weight),
            TargetCalories: TARGET_CALORIES,
          }),
        });

        if (!response.ok) {
          throw new Error('정보 업데이트에 실패했습니다.');
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      alert(error instanceof Error ? error.message : '정보 업데이트 중 문제가 발생했습니다.');
    }
  };
  const handleLogout = () => { setIsLoggedIn(false); setIsInitialSetupDone(false); setMealModalType(null); setProfileId(''); };
  
  const openMealModal = (type: MealType) => setMealModalType(type);
  const closeMealModal = () => setMealModalType(null);

  const openSearch = (type: MealType) => { setSearchMealType(type); setSearchQuery(''); setSearchResults([]); setFoodSearchError(''); setIsSearchOpen(true); setSelectedFoodForDetail(null); };
  const closeSearch = () => { setIsSearchOpen(false); setSearchMealType(null); setSelectedFoodForDetail(null); setSearchResults([]); setFoodSearchError(''); };
  
  const handleSelectFoodItem = (food: FoodItem) => {
    setSelectedFoodForDetail(food);
    setFoodGrams(100);
  };

  const confirmAddFood = async () => {
    if (!searchMealType || !selectedFoodForDetail) return;
    const targetMealType = searchMealType;
    const multiplier = foodGrams / 100;
    const finalFood = {
      name: selectedFoodForDetail.name,
      grams: foodGrams,
      calories: Math.round(selectedFoodForDetail.calories * multiplier),
      carbs: Math.round(selectedFoodForDetail.carbs * multiplier),
      protein: Math.round(selectedFoodForDetail.protein * multiplier),
      fat: Math.round(selectedFoodForDetail.fat * multiplier),
      sodium: Math.round((selectedFoodForDetail.sodium || 0) * multiplier),
    };

    let mealId = meals[targetMealType].mealId;
    let mealFoodId: number | undefined;

    try {
      if (profileId) {
        if (!mealId) {
          const mealResponse = await fetch(`${API_BASE}/meals/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ProfileID: profileId,
              MealType: mealTypeToApi[targetMealType],
              MealDate: selectedDate,
            }),
          });

          if (!mealResponse.ok) {
            throw new Error('식사 기록 생성에 실패했습니다.');
          }

          const mealData = await mealResponse.json();
          mealId = Number(mealData.mealId ?? mealData.MealID);
        }

        const addFoodResponse = await fetch(`${API_BASE}/meals/add-food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            MealID: mealId,
            FoodName: finalFood.name,
            IntakeAmount: finalFood.grams,
            Calories: finalFood.calories,
            Protein: finalFood.protein,
            Carbohydrate: finalFood.carbs,
            Fat: finalFood.fat,
            Sodium: finalFood.sodium,
            Sugar: 0,
          }),
        });

        if (!addFoodResponse.ok) {
          throw new Error('음식 추가에 실패했습니다.');
        }

        const addFoodData = await addFoodResponse.json();
        mealFoodId = Number(addFoodData.mealFoodId ?? addFoodData.MealFoodID) || undefined;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '음식 추가 중 문제가 발생했습니다.');
      return;
    }

    setMeals(prev => ({ 
      ...prev, 
      [targetMealType]: { 
        ...prev[targetMealType],
        mealId,
        items: [...prev[targetMealType].items, { ...finalFood, mealFoodId }] 
      } 
    }));
    closeSearch();
    setTimeout(() => openMealModal(targetMealType), 80);
  };

  const handleRemoveFood = async (type: MealType, idx: number) => {
    const targetFood = meals[type].items[idx];

    if (targetFood?.mealFoodId) {
      try {
        const response = await fetch(`${API_BASE}/meals/food/${targetFood.mealFoodId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('음식 삭제에 실패했습니다.');
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : '음식 삭제 중 문제가 발생했습니다.');
        return;
      }
    }

    setMeals(prev => ({ ...prev, [type]: { ...prev[type], items: prev[type].items.filter((_, i) => i !== idx) } }));
  };

  const toggleFavorite = (foodName: string) => {
    setFavorites(prev => prev.includes(foodName) ? prev.filter(name => name !== foodName) : [...prev, foodName]);
  };

  useEffect(() => {
    if (!isSearchOpen) return;

    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setFoodSearchError('');
      setIsSearchingFood(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingFood(true);
      setFoodSearchError('');

      try {
        const response = await fetch(`${API_BASE}/meals/search-food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ FoodName: query }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('음식 검색에 실패했습니다.');
        }

        const data = await response.json();
        const foods = Array.isArray(data) ? data.map(normalizeFoodSearchResult).filter(food => food.name) : [];
        setSearchResults(foods);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setSearchResults([]);
        setFoodSearchError('음식 검색 중 문제가 발생했습니다. API 서버 상태를 확인해주세요.');
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingFood(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isSearchOpen, searchQuery]);

  const openPhoto = (type: MealType) => { setPhotoMealType(type); setModalPhotoUrl(null); setPhotoFile(null); setAnalyzedFood(null); setAnalysisError(''); setAnalysisStatus('idle'); setIsPhotoOpen(true); };
  const closePhoto = () => { setIsPhotoOpen(false); setPhotoMealType(null); };
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhotoFile(file); setAnalyzedFood(null); setAnalysisError(''); const reader = new FileReader(); reader.onloadend = () => { if (typeof reader.result === 'string') setModalPhotoUrl(reader.result); setAnalysisStatus('idle'); }; reader.readAsDataURL(file); }
  };
  const startAnalysis = async () => {
    if (!photoFile) return;

    setAnalysisStatus('analyzing');
    setAnalysisError('');

    try {
      const formData = new FormData();
      formData.append('image', photoFile);

      const response = await fetch(`${API_BASE}/meals/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('사진 분석에 실패했습니다.');
      }

      const data = await response.json();
      const food = parseAnalyzeResult(String(data.result ?? data.Result ?? ''));
      if (!food) {
        throw new Error('분석 결과를 읽을 수 없습니다.');
      }

      setAnalyzedFood(food);
      setAnalysisStatus('done');
    } catch (error) {
      setAnalyzedFood(null);
      setAnalysisError(error instanceof Error ? error.message : '사진 분석 중 문제가 발생했습니다.');
      setAnalysisStatus('error');
    }
  };
  const confirmPhoto = async () => {
    if (!photoMealType || !modalPhotoUrl || analysisStatus !== 'done' || !analyzedFood) return;

    const targetMealType = photoMealType;
    let mealId = meals[targetMealType].mealId;
    let mealFoodId: number | undefined;

    try {
      if (profileId) {
        if (!mealId) {
          const mealResponse = await fetch(`${API_BASE}/meals/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ProfileID: profileId,
              MealType: mealTypeToApi[targetMealType],
              MealDate: selectedDate,
            }),
          });

          if (!mealResponse.ok) {
            throw new Error('식사 기록 생성에 실패했습니다.');
          }

          const mealData = await mealResponse.json();
          mealId = Number(mealData.mealId ?? mealData.MealID);
        }

        const addFoodResponse = await fetch(`${API_BASE}/meals/add-food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            MealID: mealId,
            FoodName: analyzedFood.name,
            IntakeAmount: analyzedFood.grams ?? 100,
            Calories: analyzedFood.calories,
            Protein: analyzedFood.protein,
            Carbohydrate: analyzedFood.carbs,
            Fat: analyzedFood.fat,
            Sodium: analyzedFood.sodium ?? 0,
            Sugar: 0,
          }),
        });

        if (!addFoodResponse.ok) {
          throw new Error('분석 음식 등록에 실패했습니다.');
        }

        const addFoodData = await addFoodResponse.json();
        mealFoodId = Number(addFoodData.mealFoodId ?? addFoodData.MealFoodID) || undefined;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '분석 음식 등록 중 문제가 발생했습니다.');
      return;
    }

    setMeals(prev => ({ ...prev, [targetMealType]: { ...prev[targetMealType], mealId, imgUrl: modalPhotoUrl, items: [...prev[targetMealType].items, { ...analyzedFood, mealFoodId }] } }));
    closePhoto();
    setTimeout(() => openMealModal(targetMealType), 80);
  };
  const getGraphData = (period: GraphPeriod) => {
    const currentCal = totalConsumed.calories;
    switch(period) {
      case 'daily':
        return { labels: ['08시', '12시', '16시', '20시', '24시'], intake: [meals.breakfast.items.reduce((a,c)=>a+c.calories,0), meals.breakfast.items.reduce((a,c)=>a+c.calories,0) + meals.lunch.items.reduce((a,c)=>a+c.calories,0), currentCal, currentCal, currentCal], target: [2000, 2000, 2000, 2000, 2000] };
      case 'weekly':
        return { labels: ['월', '화', '수', '목', '금', '토', '일'], intake: [1680, 2150, 1890, 2400, 1720, 2210, currentCal], target: [2000, 2000, 2000, 2000, 2000, 2000, 2000] };
      case 'monthly':
        return { labels: ['1주차', '2주차', '3주차', '4주차', '5주차'], intake: [1920, 2110, 1840, 2250, currentCal], target: [2000, 2000, 2000, 2000, 2000] };
      case 'yearly':
        return { labels: ['1분기', '2분기', '3분기', '4분기'], intake: [1890, 2040, 1950, currentCal], target: [2000, 2000, 2000, 2000] };
      default:
        return { labels: [], intake: [], target: [] };
    }
  };

  const graphData = getGraphData(graphPeriod);
  const maxCal = 3000;
  const graphWidth = 420;
  const graphHeight = 130;
  const startX = 50;
  const endY = 150;

  const points = graphData.intake.map((val, i) => ({ x: startX + (i / (graphData.labels.length - 1)) * graphWidth, y: endY - (val / maxCal) * graphHeight, val, label: graphData.labels[i] }));
  const targetPoints = graphData.target.map((val, i) => ({ x: startX + (i / (graphData.labels.length - 1)) * graphWidth, y: endY - (val / maxCal) * graphHeight }));

  const intakeLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const intakeAreaPath = points.length > 0 ? `${intakeLinePath} L ${points[points.length - 1].x} ${endY} L ${points[0].x} ${endY} Z` : '';
  const targetLinePath = targetPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="relative z-10 flex flex-col items-center text-center p-6">
          <div className="text-[120px] leading-none mb-6 drop-shadow-xl">👹</div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent pb-2">먹깨비</h1>
          <p className="text-lg text-slate-500 font-bold mb-12">AI 기반 배달음식 영양 관리 시스템</p>
          <button onClick={() => setIsLoginModalOpen(true)} className="group px-10 py-5 font-bold text-white text-xl rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-xl shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300">
            먹깨비 시작하기
            <svg className="inline-block w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100">
              <div className="px-8 py-8 text-center">
                <span className="text-5xl block mb-4">🔐</span>
                <h3 className="text-2xl font-black text-slate-800 mb-2">로그인</h3>
                <p className="text-xs text-slate-400 font-medium mb-8">테스트: 아이디 123 / 비밀번호 123</p>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-left"><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">아이디</label><input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디를 입력하세요" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" autoFocus /></div>
                  <div className="text-left"><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">비밀번호</label><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="비밀번호를 입력하세요" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" /></div>
                  {loginError && <div className="text-xs font-bold text-red-500 bg-red-50 py-2 rounded-lg">{loginError}</div>}
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-xl text-base hover:bg-slate-900 transition-all">로그인</button>
                    <button type="button" onClick={closeLoginModal} className="w-full mt-3 text-slate-400 font-bold text-sm py-2 hover:text-slate-600">취소</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isLoggedIn && !isInitialSetupDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans py-10 px-4">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 p-8 text-center">
          <span className="text-5xl block mb-4">📝</span>
          <h3 className="text-2xl font-black text-slate-800 mb-2">신체 정보 등록</h3>
          <p className="text-xs text-slate-400 font-medium mb-8">정확한 AI 맞춤 식단 추천을 위해<br />기본 정보를 입력해 주세요.</p>
          <form onSubmit={handleInitialSetupSubmit} className="space-y-4 text-left">
            <div><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">이름</label><input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} placeholder="예: 홍길동" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required autoFocus /></div>
            <div>
              <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">성별</label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (<button key={g} type="button" onClick={() => setUserInfo({ ...userInfo, gender: g })} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.gender === g ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}>{g === 'male' ? '남성' : '여성'}</button>))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([{ key: 'age', label: '나이 (세)', ph: '예: 24' }, { key: 'height', label: '신장 (cm)', ph: '예: 175' }] as Array<{ key: keyof UserInfo; label: string; ph: string }>).map(({ key, label, ph }) => (
                <div key={key}><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">{label}</label><input type="number" value={userInfo[key]} onChange={(e) => setUserInfo({ ...userInfo, [key]: e.target.value })} placeholder={ph} className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required /></div>
              ))}
            </div>
            <div><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">체중 (kg)</label><input type="number" value={userInfo.weight} onChange={(e) => setUserInfo({ ...userInfo, weight: e.target.value })} placeholder="예: 70" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required /></div>
            <div>
              <label className="block text-xs font-extrabold text-black mb-2 pl-1">직업 / 활동 유형</label>
              <div className="grid grid-cols-2 gap-2">
                {JOB_OPTIONS.map(job => (
                  <button key={job.value} type="button" onClick={() => setUserInfo({ ...userInfo, job: job.value })} className={`flex flex-col items-start px-3 py-3 rounded-xl border text-left transition-all ${userInfo.job === job.value ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <span className={`text-sm font-bold ${userInfo.job === job.value ? 'text-orange-600' : 'text-slate-700'}`}>{job.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{job.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2"><button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-xl shadow-md text-base hover:opacity-95 transition-all">저장하고 시작하기</button></div>
          </form>
        </div>
      </div>
    );
  }

  const selectedJob = JOB_OPTIONS.find(j => j.value === userInfo.job);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2"><span className="text-2xl">👹</span><h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">먹깨비</h1></div>
          <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shadow-sm text-sm">{userInfo.name ? userInfo.name.charAt(0) : '먹'}</div>
            <span className="text-sm font-semibold text-slate-600 hidden sm:inline">{userInfo.name ? `${userInfo.name} 님` : '사용자 님'}</span>
            <button onClick={handleLogout} className="ml-2 text-xs font-bold text-slate-400 hover:text-red-500 underline underline-offset-2">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">

            {/* 식사 기록 대시보드 및 상단 슬라이드형 캘린더 바 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">📅 식사 기록 대시보드</h3>
                  <p className="text-xs text-slate-400 mt-0.5">날짜별로 데이터가 개별 관리됩니다. 자유롭게 날짜를 이동해 보세요.</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner flex-shrink-0">
                  <button type="button" onClick={() => changeDate(-1)} className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all text-xs font-black text-slate-600 active:scale-95">◀</button>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-xs">📅</span>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-xs font-black bg-transparent outline-none text-orange-600 cursor-pointer" />
                  </div>
                  <button type="button" onClick={() => changeDate(1)} className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all text-xs font-black text-slate-600 active:scale-95">▶</button>
                </div>
              </div>

              {/* 끼니 카드 영역 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
                  const cfg = MEAL_CFG[type];
                  const mealItems = meals[type].items;
                  const mealTotals = calcTotals(mealItems);
                  const scaleClass = type === 'snack' ? 'scale-95 opacity-95' : '';

                  return (
                    <button
                      key={type}
                      onClick={() => openMealModal(type)}
                      className={`
                        relative flex flex-col items-center p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300
                        hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] group overflow-hidden w-full ${scaleClass}
                        ${mealItems.length > 0 ? `${cfg.light} ${cfg.border}` : 'bg-slate-50 border-slate-200 border-dashed hover:border-slate-300'}
                      `}
                    >
                      <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${cfg.gradient}`} />
                      <span className={`relative z-10 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${cfg.gradient} shadow-sm mb-3 sm:mb-4`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      {mealItems.length > 0 && (
                        <span className={`absolute top-3 right-3 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-full bg-white/90 backdrop-blur shadow-sm ${cfg.accent}`}>
                          {mealItems.length}가지
                        </span>
                      )}
                      <div className="relative z-10 w-full bg-white/90 backdrop-blur rounded-2xl py-2.5 sm:py-3 px-2 sm:px-3 border border-white shadow-inner">
                        {mealTotals.calories > 0 ? (
                          <div className="text-center">
                            <h4 className="text-xl sm:text-3xl font-black text-slate-800 leading-none">{mealTotals.calories}</h4>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">kcal</span>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-400">입력 대기중</span>
                          </div>
                        )}
                      </div>
                      {mealTotals.calories > 0 && (
                        <div className="relative z-10 w-full mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                          {(() => {
                            const totalGrams = mealTotals.carbs + mealTotals.protein + mealTotals.fat;
                            const carbsPct = totalGrams > 0 ? (mealTotals.carbs / totalGrams) * 100 : 0;
                            const proteinPct = totalGrams > 0 ? (mealTotals.protein / totalGrams) * 100 : 0;
                            const fatPct = totalGrams > 0 ? (mealTotals.fat / totalGrams) * 100 : 0;
                            return (
                              <div className="w-full bg-slate-200/70 h-1.5 sm:h-2 rounded-full overflow-hidden flex shadow-inner">
                                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${carbsPct}%` }} />
                                <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${proteinPct}%` }} />
                                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${fatPct}%` }} />
                              </div>
                            );
                          })()}
                          <div className="flex flex-wrap gap-1 justify-center">
                            <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-bold">탄 {Math.round(mealTotals.carbs)}g</span>
                            <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 text-[9px] sm:text-[10px] font-bold">단 {Math.round(mealTotals.protein)}g</span>
                            <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[9px] sm:text-[10px] font-bold">지 {Math.round(mealTotals.fat)}g</span>
                          </div>
                        </div>
                      )}
                      {meals[type].imgUrl && (
                        <div className="relative z-10 w-full mt-3">
                          <div className="h-10 sm:h-14 rounded-xl overflow-hidden border border-white shadow-md">
                            <img src={meals[type].imgUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                      <div className="relative z-10 mt-3 sm:mt-4">
                        <span className={`text-[10px] sm:text-[11px] font-extrabold ${cfg.accent} group-hover:underline underline-offset-4`}>상세 보기 →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 영양소 달성도 및 그래프 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Intake Progress</p><h4 className="text-lg font-black text-slate-800">오늘의 권장 섭취량 달성도</h4></div>
                <div className="text-right"><span className="text-2xl font-black text-orange-500">{totalConsumed.calories}</span><span className="text-slate-400 font-medium text-sm"> / {TARGET_CALORIES} kcal</span></div>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-6"><div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} /></div>
              
              <div className="grid grid-cols-4 gap-4 text-center mb-6">
                {[
                  { key: 'carbs', label: '🍚 탄수화물', color: 'text-blue-500', current: totalConsumed.carbs, target: TARGET.carbs }, 
                  { key: 'protein', label: '🥩 단백질', color: 'text-green-500', current: totalConsumed.protein, target: TARGET.protein }, 
                  { key: 'fat', label: '🧈 지방', color: 'text-amber-500', current: totalConsumed.fat, target: TARGET.fat },
                  { key: 'sodium', label: '🧂 나트륨', color: 'text-red-500', current: totalConsumed.sodium, target: TARGET.sodium }
                ].map(({ key, label, color, current, target }) => {
                  const nPct = Math.min(100, (current / target) * 100);
                  return (
                    <div key={key} className="flex flex-col items-center bg-slate-50/70 py-4 px-2 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                      <span className="text-[10px] font-extrabold text-slate-500 mb-2 truncate w-full">{label}</span>
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className={`${color} transition-all duration-1000`} strokeDasharray={`${nPct}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs sm:text-sm font-black text-slate-700">{current}{key==='sodium'?'mg':'g'}</span>
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">/ {target}{key==='sodium'?'mg':'g'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 칼로리 추이 그래프 */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">📈 총 칼로리 vs 권장 칼로리 추이</h4>
                    <p className="text-[11px] text-slate-400 font-semibold">데이터 입력 및 날짜 이동 시 그래프가 입체적으로 자동 갱신됩니다.</p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex gap-2.5 text-[10px] font-bold mr-1">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 block" /> <span className="text-slate-500">총 섭취</span></div>
                      <div className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 block" /> <span className="text-slate-500">권장선</span></div>
                    </div>
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                      {(['daily', 'weekly', 'monthly', 'yearly'] as GraphPeriod[]).map(period => (
                        <button key={period} onClick={() => setGraphPeriod(period)} className={`text-[10px] font-black px-2 py-1 rounded-md transition-all ${graphPeriod === period ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                          {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : period === 'monthly' ? '월간' : '년간'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-4 overflow-x-auto">
                  <div className="min-w-[450px]">
                    <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                      <defs>
                        <linearGradient id="intakeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      {[0, 1000, 2000, 3000].map((val) => {
                        const y = endY - (val / maxCal) * graphHeight;
                        return (
                          <g key={val} className="opacity-40">
                            <line x1="50" y1={y} x2="480" y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray={val === 2000 ? "0" : "3 3"} />
                            <text x="42" y={y + 3} textAnchor="end" className="text-[10px] font-bold fill-slate-400">{val}k</text>
                          </g>
                        );
                      })}
                      {intakeAreaPath && <path d={intakeAreaPath} fill="url(#intakeAreaGrad)" />}
                      {targetLinePath && <path d={targetLinePath} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 4" />}
                      {intakeLinePath && <path d={intakeLinePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />}
                      {points.map((p, idx) => (
                        <g key={idx} className="group cursor-pointer">
                          <circle cx={p.x} cy={p.y} r="4.5" className="fill-white stroke-orange-500 stroke-[2.5] group-hover:r-6 transition-all duration-150" />
                          <text x={p.x} y={p.y - 9} textAnchor="middle" className="text-[10px] font-black fill-orange-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 font-sans">{p.val} kcal</text>
                          <text x={p.x} y="168" textAnchor="middle" className="text-[11px] font-extrabold fill-slate-400 group-hover:fill-slate-700 transition-colors">{p.label}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════ 사이드바 영역 ════ */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* 1. 신체 정보 & 진척도 컴포넌트 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col items-center justify-center mb-4 pt-1">
                <div className="relative w-32 h-40 bg-slate-100 rounded-2xl flex items-center justify-center p-2 group overflow-hidden border border-slate-100 shadow-inner">
                  <svg className="w-20 h-28 transition-transform duration-500 group-hover:scale-105" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="bodyGradient" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#f97316" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient>
                      <clipPath id="fillClip"><rect x="0" y={24 - (24 * (pct / 100))} width="24" height="24" /></clipPath>
                    </defs>
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M19 7H15V22H13V16H11V22H9V7H5V5H19V7Z" className="fill-slate-200" />
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M19 7H15V22H13V16H11V22H9V7H5V5H19V7Z" fill="url(#bodyGradient)" clipPath="url(#fillClip)" />
                  </svg>
                  <div className="absolute top-2 right-2 bg-orange-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-md">{pct}%</div>
                </div>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-3 pt-2 border-t border-slate-100/70">
                <div className="flex gap-2">
                  <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">이름</label><input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full text-black bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:bg-white focus:border-orange-400 text-center" required /></div>
                  <div className="flex-[1.2]"><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">성별</label><div className="flex w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-[30px]">{['male', 'female'].map(g => (<button key={g} type="button" onClick={() => setUserInfo({ ...userInfo, gender: g })} className={`flex-1 text-[10px] font-bold transition-all ${userInfo.gender === g ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{g === 'male' ? '남성' : '여성'}</button>))}</div></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([{ key: 'age', label: '나이(세)' }, { key: 'height', label: '신장(cm)' }, { key: 'weight', label: '체중(kg)' }] as Array<{ key: keyof UserInfo; label: string }>).map(({ key, label }) => (
                    <div key={key}><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">{label}</label><input type="number" value={userInfo[key]} onChange={(e) => setUserInfo(prev => ({ ...prev, [key]: e.target.value }))} className="w-full text-black bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:bg-white focus:border-orange-400 text-center" required /></div>
                  ))}
                </div>
                <div><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">직업</label><div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 text-center">{selectedJob ? selectedJob.label : '—'}</div></div>
                {isSaved && <div className="text-center text-[10px] font-bold text-green-600 bg-green-50 py-1.5 rounded-lg">✅ 정보 업데이트 완료!</div>}
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-2.5 rounded-xl text-xs hover:opacity-95 transition-all">내 정보 업데이트</button>
              </form>
            </div>

            {/* 2. AI 맞춤 배달 메뉴 추천 창 복구 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h4 className="text-sm font-black text-slate-800">AI 맞춤 배달 메뉴 추천</h4>
              </div>
              <div className="space-y-3">
                {RECOMMEND_MENU_DB.map((menu, idx) => (
                  <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${menu.tagColor}`}>{menu.tag}</span>
                      <span className="text-xs font-black text-orange-600 group-hover:scale-105 transition-transform">{menu.calories} kcal</span>
                    </div>
                    <h5 className="text-sm font-black text-slate-800 mb-1.5">{menu.name}</h5>
                    <p className="text-[10px] text-slate-500 leading-tight mb-3 break-keep">{menu.desc}</p>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50/70 border border-blue-100 px-1.5 py-0.5 rounded-md">탄 {menu.carbs}g</span>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50/70 border border-green-100 px-1.5 py-0.5 rounded-md">단 {menu.protein}g</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50/70 border border-amber-100 px-1.5 py-0.5 rounded-md">지 {menu.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ════ 끼니 상세 기록 모달 (탄단지 리스트 추가됨) ════ */}
      {mealModalType && (() => {
        const type = mealModalType;
        const cfg = MEAL_CFG[type];
        const mealTotals = calcTotals(meals[type].items);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm px-0 sm:px-4" onClick={(e) => { if (e.target === e.currentTarget) closeMealModal(); }}>
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

              <div className={`bg-gradient-to-r ${cfg.gradient} px-6 py-5 flex items-center justify-between flex-shrink-0`}>
                <div className="flex items-center gap-3 text-white">
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{cfg.label} 식사 기록</h3>
                    <p className="text-xs text-white/70 font-medium">{selectedDate}</p>
                  </div>
                </div>
                <button onClick={closeMealModal} className="text-white/70 hover:text-white transition-colors p-1">
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
                    {/* 음식 리스트 - 탄단지 g수 표기 개선 */}
                    {meals[type].items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 group hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all gap-3">
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
                        <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto text-right">
                          <span className="w-14 text-sm font-black text-orange-500">{item.calories} kcal</span>
                          <button onClick={() => handleRemoveFood(type, idx)} className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 flex-shrink-0">
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
                  <button onClick={() => { closeMealModal(); openSearch(type); }}
                    className={`flex items-center justify-center gap-2 bg-white border-2 ${cfg.btnBorder} ${cfg.accent} text-sm font-bold py-3.5 rounded-xl ${cfg.btnHover} transition-all shadow-sm active:scale-95`}>
                    메뉴 추가
                  </button>
                  <button onClick={() => { closeMealModal(); openPhoto(type); }}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-600 text-sm font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
                    사진 분석
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════ 메뉴 검색 및 즐겨찾기 모달 ════ */}
      {isSearchOpen && (() => {
        const searchCfg = searchMealType ? MEAL_CFG[searchMealType] : null;
        const sortedFoods = [...searchResults].sort((a, b) => {
          const aFav = favorites.includes(a.name);
          const bFav = favorites.includes(b.name);
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          return 0;
        });

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }}>
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">{searchCfg?.emoji} {searchCfg?.label} 메뉴 검색</h3>
                <button onClick={closeSearch} className="text-slate-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-6">
                <div className="relative mb-4">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="음식명을 입력하세요 (예: 마라탕, 치킨)" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white transition-all text-slate-800 font-bold" autoFocus />
                  <svg className="w-4 h-4 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                
                <div className="h-64 overflow-y-auto space-y-1.5 pr-1">
                  {isSearchingFood ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10"><p className="text-sm">검색 중입니다...</p></div>
                  ) : foodSearchError ? (
                    <div className="h-full flex flex-col items-center justify-center text-red-400 py-10 text-center px-4"><p className="text-sm">{foodSearchError}</p></div>
                  ) : sortedFoods.length > 0 ? (
                    sortedFoods.map((food) => (
                      <div key={food.name} onClick={() => handleSelectFoodItem(food)}
                        className="w-full text-left flex items-center px-4 py-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 group transition-all cursor-pointer">
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(food.name); }} className="mr-2 text-lg focus:outline-none transition-transform hover:scale-110">
                          {favorites.includes(food.name) ? '⭐' : '☆'}
                        </button>
                        <span className="flex-1 text-xs sm:text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{food.name}</span>
                        <span className="text-xs sm:text-sm font-black text-orange-500 flex-shrink-0">{food.calories} kcal</span>
                      </div>
                    ))
                  ) : searchQuery.trim() ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10"><p className="text-sm">검색 결과가 없습니다.</p></div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10"><p className="text-sm">음식명을 입력해 검색하세요.</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════ 용량 조절 모달 ════ */}
      {selectedFoodForDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedFoodForDetail(null); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-black tracking-tight">섭취 용량 설정</h3>
              <button onClick={() => setSelectedFoodForDetail(null)} className="text-white/80 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-black text-slate-800 mb-1">{selectedFoodForDetail.name}</h4>
                <p className="text-xs font-bold text-slate-400">기본 제공량: 100g 기준</p>
              </div>
              <div className="flex flex-col items-center mb-6">
                <label className="text-xs font-extrabold text-slate-500 mb-2 block">실제 섭취한 양(g)</label>
                <div className="relative flex items-center max-w-[150px]">
                  <input type="number" min="1" value={foodGrams} onChange={(e) => setFoodGrams(Number(e.target.value) || 0)} className="w-full text-center text-3xl font-black text-orange-500 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pr-8 focus:outline-none focus:border-orange-400 focus:bg-white transition-all" />
                  <span className="absolute right-4 text-lg font-bold text-slate-400">g</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 shadow-inner">
                <p className="text-center text-[10px] font-extrabold text-slate-400 mb-3 tracking-wide">예상 섭취 영양 성분</p>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[
                    { label: '탄수화물', val: Math.round(selectedFoodForDetail.carbs * (foodGrams / 100)), color: 'text-blue-600' },
                    { label: '단백질', val: Math.round(selectedFoodForDetail.protein * (foodGrams / 100)), color: 'text-green-600' },
                    { label: '지방', val: Math.round(selectedFoodForDetail.fat * (foodGrams / 100)), color: 'text-amber-600' },
                    { label: '칼로리', val: Math.round(selectedFoodForDetail.calories * (foodGrams / 100)), color: 'text-orange-500' },
                    { label: '나트륨', val: Math.round((selectedFoodForDetail.sodium || 0) * (foodGrams / 100)), color: 'text-red-600' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white rounded-xl py-2 px-1 border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 mb-1">{label}</span>
                      <span className={`block text-xs sm:text-sm font-black ${color}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedFoodForDetail(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl text-sm hover:bg-slate-200 transition-colors">취소</button>
                <button onClick={confirmAddFood} disabled={foodGrams <= 0} className="flex-[2] bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold py-3.5 rounded-xl shadow-md text-sm hover:opacity-95 transition-all">식단에 추가하기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ 사진 분석 모달 ════ */}
      {isPhotoOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) closePhoto(); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-2.5 text-white"><span className="text-xl">📸</span><h3 className="text-lg font-black">AI 사진 영양 분석</h3></div>
              <button onClick={closePhoto} className="text-orange-100 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-7">
              <div className="relative border-4 border-dashed border-slate-200 rounded-3xl h-52 flex flex-col items-center justify-center bg-slate-50 overflow-hidden group mb-6 hover:border-orange-300 transition-colors cursor-pointer" onClick={!modalPhotoUrl ? () => fileInputRef.current?.click() : undefined}>
                {modalPhotoUrl ? (
                  <><img src={modalPhotoUrl} alt="분석 대상 식단 사진" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={() => fileInputRef.current?.click()} className="bg-white/90 text-slate-700 text-xs font-bold px-4 py-2 rounded-full shadow-md">사진 변경</button></div></>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <svg className="w-12 h-12 text-slate-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm font-bold text-slate-500">배달 음식 사진 업로드</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 shadow-inner min-h-[110px] flex items-center justify-center">
                {analysisStatus === 'idle' && <div className="text-center text-slate-400"><p className="text-xs font-medium">사진을 등록한 후 분석 시작 버튼을 누르세요.</p></div>}
                {analysisStatus === 'analyzing' && <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3" /><p className="text-xs font-bold text-orange-600">AI 푸드 렌즈 가동 중...</p></div>}
                {analysisStatus === 'error' && <div className="text-center text-red-400"><p className="text-xs font-bold">{analysisError}</p></div>}
                {analysisStatus === 'done' && analyzedFood && (
                  <div className="w-full">
                    <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-2.5"><h4 className="text-sm font-black text-slate-800">분석 완료: {analyzedFood.name}</h4></div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[{ label: '탄수화물', val: `${analyzedFood.carbs}g`, color: 'text-blue-600' }, { label: '단백질', val: `${analyzedFood.protein}g`, color: 'text-green-600' }, { label: '지방', val: `${analyzedFood.fat}g`, color: 'text-amber-600' }, { label: '칼로리', val: `${analyzedFood.calories}`, color: 'text-orange-500 font-bold' }, { label: '나트륨', val: `${analyzedFood.sodium || 0}mg`, color: 'text-red-500' }].map(({ label, val, color }) => (
                        <div key={label} className="bg-white p-1.5 rounded-lg border border-slate-100"><span className="block text-[9px] font-bold text-slate-400">{label}</span><span className={`text-[10px] font-black mt-0.5 block ${color}`}>{val}</span></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {analysisStatus !== 'done' ? (
                  <button onClick={startAnalysis} disabled={!photoFile || analysisStatus === 'analyzing'} className="col-span-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 rounded-xl shadow-md text-sm hover:opacity-95 transition-all disabled:opacity-50">분석 시작</button>
                ) : (
                  <><button onClick={() => { setAnalyzedFood(null); setAnalysisError(''); setAnalysisStatus('idle'); }} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-xl text-sm hover:bg-slate-200 transition-colors">다시 분석하기</button><button onClick={confirmPhoto} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-4 rounded-xl shadow-md text-sm hover:opacity-95 transition-all">식단 등록</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
