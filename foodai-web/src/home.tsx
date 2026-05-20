// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
const API_BASE = 'http://localhost:5260/api';

type MealTypeKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// 활동 배수(multiplier)는 미플린-세인트 지어 공식의 PAL 계수 기준
const JOB_OPTIONS = [
  { value: 0, label: '💼 사무직/재택', desc: '주로 앉아서 생활하는 직업', multiplier: 1.2 },
  { value: 1, label: '📚 학생', desc: '학교 중심, 가끔 이동', multiplier: 1.3 },
  { value: 2, label: '🔨 육체노동직', desc: '하루 종일 몸을 쓰는 직업', multiplier: 1.375 },
  { value: 3, label: '🛎️ 서비스/판매직', desc: '이동과 활동이 많은 직업', multiplier: 1.55 },
  { value: 4, label: '💻 재택/프리랜서', desc: '집이나 개인 작업 공간에서 주로 근무하는 형태', multiplier: 1.725 },
  { value: 5, label: '🏃 운동선수/트레이너', desc: '고강도 훈련이 일상인 직업', multiplier: 1.9 },
];

const MEAL_CFG = {
  breakfast: { label: '아침', emoji: '🌅', gradient: 'from-sky-400 to-blue-500', light: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-600', pill: 'bg-sky-100 text-sky-700', btnBorder: 'border-sky-300', btnHover: 'hover:bg-sky-50' },
  lunch:     { label: '점심', emoji: '☀️', gradient: 'from-orange-400 to-amber-500', light: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-600', pill: 'bg-orange-100 text-orange-700', btnBorder: 'border-orange-300', btnHover: 'hover:bg-orange-50' },
  dinner:    { label: '저녁', emoji: '🌙', gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-600', pill: 'bg-violet-100 text-violet-700', btnBorder: 'border-violet-300', btnHover: 'hover:bg-violet-50' },
  snack:     { label: '간식', emoji: '🍩', gradient: 'from-pink-400 to-rose-500', light: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-600', pill: 'bg-pink-100 text-pink-700', btnBorder: 'border-pink-300', btnHover: 'hover:bg-pink-50' },
};

function calcTotals(items) {
  return items.reduce((acc, item) => ({ 
    calories: acc.calories + item.calories, 
    carbs: acc.carbs + item.carbs, 
    protein: acc.protein + item.protein, 
    fat: acc.fat + item.fat,
    sodium: acc.sodium + (item.sodium || 0)
  }), { calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 });
}

const createEmptyMeals = () => ({
  breakfast: { items: [], imgUrl: null, mealId: null },
  lunch: { items: [], imgUrl: null, mealId: null },
  dinner: { items: [], imgUrl: null, mealId: null },
  snack: { items: [], imgUrl: null, mealId: null },
});

const normalizeProfile = (payload: any) => {
  const profile = payload?.profile ?? payload;
  return {
    name: profile?.name ?? profile?.Name ?? '',
    gender: (profile?.male ?? profile?.Male) === false ? 'female' : 'male',
    age: String(profile?.age ?? profile?.Age ?? ''),
    height: String(profile?.height ?? profile?.Height ?? ''),
    weight: String(profile?.weight ?? profile?.Weight ?? ''),
    job: String(profile?.job ?? profile?.Job ?? 0),
  };
};

const normalizeFoodSearch = (food: any) => ({
  name: food.makerName ? `[${food.makerName}] ${food.foodName}` : (food.foodName ?? food.FoodName ?? ''),
  rawName: food.foodName ?? food.FoodName ?? '',
  makerName: food.makerName ?? food.MakerName ?? '',
  calories: Number(food.calories ?? food.Calories ?? 0),
  carbs: Number(food.carbohydrate ?? food.Carbohydrate ?? 0),
  protein: Number(food.protein ?? food.Protein ?? 0),
  fat: Number(food.fat ?? food.Fat ?? 0),
  sodium: Number(food.sodium ?? food.Sodium ?? 0),
});

const mealTypeToApi = (type: MealTypeKey) => ({
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}[type]);

const apiMealTypeToKey = (type: string): MealTypeKey | null => {
  const value = String(type).toLowerCase();
  if (value === 'breakfast' || value === '0') return 'breakfast';
  if (value === 'lunch' || value === '1') return 'lunch';
  if (value === 'dinner' || value === '2') return 'dinner';
  if (value === 'snack' || value === '3') return 'snack';
  return null;
};

export default function Home() {
    const [analysisResult, setAnalysisResult] = useState(null); // AI VISION 분석 결과를 저장하는 변수
  // 분석된 음식 중 사용자가 선택(체크)한 항목의 인덱스 번호 목록
  const [selectedFoods, setSelectedFoods] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialSetupDone, setIsInitialSetupDone] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [profileId, setProfileId] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', gender: 'male', age: '', height: '', weight: '', job: '' });
  const [isSaved, setIsSaved] = useState(false);
  
  // 1. 캘린더 날짜 상태 관리
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 미플린-세인트 지어 공식으로 기초대사량(BMR) 계산 후 직업 활동 배수 적용
  const calcTargetCalories = () => {
    const weight = parseFloat(userInfo.weight);
    const height = parseFloat(userInfo.height);
    const age = parseFloat(userInfo.age);
    if (!weight || !height || !age) return 2000;
    const bmr = userInfo.gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    const job = JOB_OPTIONS.find(j => String(j.value) === String(userInfo.job));
    return Math.round(bmr * (job?.multiplier ?? 1.2));
  };
  const TARGET_CALORIES = calcTargetCalories();
  // 탄수화물 50% / 단백질 20% / 지방 30% 비율로 목표 영양소 자동 계산
  const TARGET = {
    carbs: Math.round(TARGET_CALORIES * 0.5 / 4),
    protein: Math.round(TARGET_CALORIES * 0.2 / 4),
    fat: Math.round(TARGET_CALORIES * 0.3 / 9),
    sodium: 2000,
  };
  
  // 2. 날짜별 고유 식단 기록 저장 - 하드코드 제거, 모든 끼니 빈 배열로 시작
  const [mealsByDate, setMealsByDate] = useState({});

  // 현재 선택된 날짜의 식단 가져오기
  const currentMeals = mealsByDate[selectedDate] || createEmptyMeals();

  const meals = currentMeals;

  // 상태 업데이트 헬퍼 함수
  const setMeals = (updater) => {
    setMealsByDate(prev => {
      const current = prev[selectedDate] || createEmptyMeals();
      const updated = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        [selectedDate]: updated
      };
    });
  };

  const [mealModalType, setMealModalType] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMealType, setSearchMealType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState(null);
  // 실제 API에서 받아온 음식 검색 결과
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  // Gemini AI 메뉴 추천 결과 + 에러 상태
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [foodGrams, setFoodGrams] = useState(100);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [photoMealType, setPhotoMealType] = useState(null);
  const [modalPhotoUrl, setModalPhotoUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const fileInputRef = useRef(null);
  const searchCacheRef = useRef<Record<string, any[]>>({});

  // 즐겨찾기: 음식 이름만 저장하던 것 → 영양 데이터 전체 저장
  const [favorites, setFavorites] = useState<any[]>([]);
  const [graphPeriod, setGraphPeriod] = useState('daily');

  const allItems = [...meals.breakfast.items, ...meals.lunch.items, ...meals.dinner.items, ...meals.snack.items];
  const totalConsumed = calcTotals(allItems);
  const pct = Math.min(100, Math.round((totalConsumed.calories / TARGET_CALORIES) * 100));

  const loadMealsForDate = async (id = profileId, date = selectedDate) => {
    if (!id) return;
    const res = await fetch(`${API_BASE}/meals/profile/${encodeURIComponent(id)}/date/${date}`);
    if (!res.ok) throw new Error('식사 기록 조회 실패');
    const records = await res.json();
    const nextMeals = createEmptyMeals();

    await Promise.all((Array.isArray(records) ? records : []).map(async (record: any) => {
      const mealId = record.mealId ?? record.MealID;
      if (!mealId) return;
      const detailRes = await fetch(`${API_BASE}/meals/detail/${mealId}`);
      if (!detailRes.ok) return;
      const detail = await detailRes.json();
      const type = apiMealTypeToKey(detail.mealType ?? detail.MealType ?? record.mealType ?? record.MealType);
      if (!type) return;

      nextMeals[type] = {
        ...nextMeals[type],
        mealId,
        items: (detail.foods ?? detail.Foods ?? []).map((food: any) => ({
          mealFoodId: food.mealFoodId ?? food.MealFoodID,
          name: food.foodName ?? food.FoodName,
          grams: food.intakeAmount ?? food.IntakeAmount ?? food.grams ?? food.Grams ?? 100,
          calories: Math.round(Number(food.calories ?? food.Calories ?? 0)),
          carbs: Math.round(Number(food.carbohydrate ?? food.Carbohydrate ?? 0)),
          protein: Math.round(Number(food.protein ?? food.Protein ?? 0)),
          fat: Math.round(Number(food.fat ?? food.Fat ?? 0)),
          sodium: Math.round(Number(food.sodium ?? food.Sodium ?? 0)),
        })),
      };
    }));

    setMealsByDate(prev => ({ ...prev, [date]: nextMeals }));
  };

  useEffect(() => {
    if (!isLoggedIn || !isInitialSetupDone || !profileId) return;
    loadMealsForDate().catch(() => {
      setMealsByDate(prev => ({ ...prev, [selectedDate]: createEmptyMeals() }));
    });
  }, [isLoggedIn, isInitialSetupDone, profileId, selectedDate]);

  // 아침/점심/저녁 중 하나라도 음식이 추가되면 Gemini AI 추천 자동 호출
  // 3초 디바운스 + AbortController → 연속 식단 추가 시 API 과호출 방지 (Gemini 할당량 보호)
  useEffect(() => {
    const controller = new AbortController();

    const hasMeal = meals.breakfast.items.length > 0 || meals.lunch.items.length > 0 || meals.dinner.items.length > 0;
    if (!hasMeal) { setAiRecommendations([]); setRecommendError(null); return; }
    // 디바운스 대기 시작 시 로딩 상태로 전환 (3초 후 실제 API 호출)
    setIsRecommendLoading(true);

    const remaining = {
      calories: Math.max(0, TARGET_CALORIES - totalConsumed.calories),
      protein: Math.max(0, TARGET.protein - totalConsumed.protein),
      carbs: Math.max(0, TARGET.carbs - totalConsumed.carbs),
      fat: Math.max(0, TARGET.fat - totalConsumed.fat),
    };

    const fetchRecommendations = async () => {
      setIsRecommendLoading(true);
      setRecommendError(null);
      try {
        const res = await fetch(`${API_BASE}/meals/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remainingCalories: remaining.calories,
            remainingProtein: remaining.protein,
            remainingCarbs: remaining.carbs,
            remainingFat: remaining.fat,
          }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          // Gemini가 JSON 문자열로 반환하는 경우 파싱
          const raw = typeof data.result === 'string' ? data.result.replace(/```json|```/g, '').trim() : data.result;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const menus = Array.isArray(parsed) ? parsed : parsed?.menus ?? parsed?.recommendations ?? [];
          setAiRecommendations(Array.isArray(menus) ? menus : []);
        } else {
          // 503/500 등 서버 오류 시 에러 메시지 표시
          const errData = await res.json().catch(() => ({}));
          setRecommendError(errData.message || `AI 추천 서비스 오류 (${res.status})`);
          setAiRecommendations([]);
        }
      } catch (e: any) {
        // AbortError(요청 취소)는 무시, 네트워크 오류는 에러 표시
        if (e?.name !== 'AbortError') {
          setRecommendError('네트워크 오류로 AI 추천을 불러올 수 없습니다.');
          setAiRecommendations([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsRecommendLoading(false);
      }
    };

    // 3초 디바운스: 마지막 식단 변경 후 3초 뒤에 API 1회만 호출
    const timer = setTimeout(fetchRecommendations, 3000);

    // cleanup: 타이머 취소 + 진행 중인 요청 abort
    return () => { clearTimeout(timer); controller.abort(); };
  }, [meals.breakfast.items.length, meals.lunch.items.length, meals.dinner.items.length, selectedDate]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const closeLoginModal = () => { setIsLoginModalOpen(false); setLoginError(''); };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProfileID: loginId, ProfilePW: loginPw }),
 
      });
      if (res.ok) {
        const data = await res.json();
        const nextProfileId = data.profileId ?? data.ProfileID ?? loginId;
        const profileRes = await fetch(`${API_BASE}/auth/${encodeURIComponent(nextProfileId)}`);
        const profileData = profileRes.ok ? await profileRes.json() : null;
        setIsLoggedIn(true);
        setIsInitialSetupDone(true);
        setIsRegisterMode(false);
        setProfileId(nextProfileId);
        setUserInfo(prev => ({ ...prev, ...normalizeProfile(profileData), name: profileData ? normalizeProfile(profileData).name : data.name }));
        closeLoginModal();
      } else {
        setLoginError('아이디 또는 비밀번호가 틀렸습니다.');
      }
    } catch {
      setLoginError('서버 연결 실패');
    }
  };
  const handleGoToRegister = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsRegisterMode(true);
    setIsLoggedIn(true);
    setIsInitialSetupDone(false);
    closeLoginModal();
  };

  const handleInitialSetupSubmit = async (e) => { 
  e.preventDefault();
  if (userInfo.job === '') { alert('직업을 선택해주세요.'); return; } 

  try {
    // 백엔드의 CreateUserProfileRequest DTO 스펙에 정확히 맞추어 보냅니다.
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ProfileID: loginId,
        ProfilePW: loginPw,
        Name: userInfo.name,
        Male: userInfo.gender === 'male',
        Height: parseFloat(userInfo.height),
        Weight: parseFloat(userInfo.weight),
        Age: parseInt(userInfo.age),
        TargetCalories: TARGET_CALORIES,
        Job: parseInt(String(userInfo.job))
      })
    });

    if (response.ok) { // 👈 상태 코드가 201이면 response.ok는 자동으로 true가 됩니다!
      
      // 1. 백엔드가 보낸 JSON 데이터(StatusCode 201의 알맹이)를 꺼냅니다.
      const data = await response.json(); 
      
      // 2. 백엔드에서 보낸 message("회원가입 성공")와 name을 조합해서 알림창을 띄웁니다.
      alert(`${data.name}님, ${data.message} 환영합니다!`); 
      setProfileId(data.profileId ?? data.ProfileID ?? loginId);
      setIsRegisterMode(false);
      setIsInitialSetupDone(true); // 메인 화면으로 이동
      
    } else {
      const errData = await response.json();
      alert(`회원가입 실패: ${errData.message}`);
      setIsLoggedIn(false); 
    }
  } catch (error) {
    console.error(error);
    alert('서버 연결에 실패했습니다.');
  }
};
  const handleSaveUser = async (e) => { 
    e.preventDefault();
    try {
      if (profileId) {
        const res = await fetch(`${API_BASE}/auth/${encodeURIComponent(profileId)}/body`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Height: parseFloat(userInfo.height),
            Weight: parseFloat(userInfo.weight),
            TargetCalories: TARGET_CALORIES,
            Job: parseInt(String(userInfo.job)),
          }),
        });
        if (!res.ok) throw new Error('저장 실패');
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      alert('정보 업데이트에 실패했습니다.');
    }
  };
  const handleLogout = () => { setIsLoggedIn(false); setIsInitialSetupDone(false); setMealModalType(null); setProfileId(''); setIsRegisterMode(false); };
  
  const openMealModal = (type) => setMealModalType(type);
  const closeMealModal = () => setMealModalType(null);

  const openSearch = (type) => { setSearchMealType(type); setSearchQuery(''); setSearchResults([]); setIsSearchOpen(true); setSelectedFoodForDetail(null); };
  const closeSearch = () => { setIsSearchOpen(false); setSearchMealType(null); setSelectedFoodForDetail(null); setSearchResults([]); };

  // 음식 이름으로 검색: 공공 API + AI 병렬 호출, AI 결과 항상 최상단 표시
  const handleSearchFood = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    const trimmed = query.trim();
    if (searchCacheRef.current[trimmed]) {
      setSearchResults(searchCacheRef.current[trimmed]);
      return;
    }
    setIsSearchLoading(true);
    try {
      // 공공 API + AI 동시 병렬 호출
      const [apiResult, aiResult] = await Promise.allSettled([
        fetch(`${API_BASE}/meals/search-food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ FoodName: trimmed }),
        }),
        fetch(`${API_BASE}/meals/ai-search-food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ FoodName: trimmed }),
        }),
      ]);

      let apiFoods: any[] = [];
      let aiFoods: any[] = [];

      if (apiResult.status === 'fulfilled' && apiResult.value.ok) {
        const data = await apiResult.value.json();
        apiFoods = Array.isArray(data) ? data.map(normalizeFoodSearch).filter((f) => f.name) : [];
      }
      if (aiResult.status === 'fulfilled' && aiResult.value.ok) {
        const data = await aiResult.value.json();
        aiFoods = Array.isArray(data) ? data.map((f) => ({ ...normalizeFoodSearch(f), isAi: true })).filter((f) => f.name) : [];
      }

      // AI 결과 최상단 배치 + 공공 API 결과에서 AI와 중복 이름 제거
      const aiNames = new Set(aiFoods.map((f) => (f.rawName || f.name).toLowerCase()));
      const uniqueApi = apiFoods.filter((f) => !aiNames.has((f.rawName || f.name).toLowerCase()));
      const merged = [...aiFoods, ...uniqueApi];

      searchCacheRef.current[trimmed] = merged;
      setSearchResults(merged);
    } finally {
      setIsSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!isSearchOpen) return;
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      handleSearchFood(query);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [isSearchOpen, searchQuery]);
  
  const handleSelectFoodItem = (food) => {
    setSelectedFoodForDetail(food);
    setFoodGrams(100);
  };

  const confirmAddFood = async () => {
    if (!searchMealType || !selectedFoodForDetail) return;
    const targetMealType = searchMealType as MealTypeKey;
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
    let mealFoodId = null;

    try {
      if (profileId) {
        if (!mealId) {
          const mealRes = await fetch(`${API_BASE}/meals/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ProfileId: profileId,
              MealType: mealTypeToApi(targetMealType),
              MealDate: selectedDate,
            }),
          });
          if (!mealRes.ok) throw new Error('식사 생성 실패');
          const mealData = await mealRes.json();
          mealId = mealData.mealId ?? mealData.MealId;
        }

        const addRes = await fetch(`${API_BASE}/meals/add-food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            MealId: mealId,
            FoodName: finalFood.name,
            Calories: finalFood.calories,
            Carbohydrate: finalFood.carbs,
            Protein: finalFood.protein,
            Fat: finalFood.fat,
            Sodium: finalFood.sodium,
            Grams: finalFood.grams,
          }),
        });
        if (!addRes.ok) throw new Error('음식 추가 실패');
        const addData = await addRes.json();
        mealFoodId = addData.mealFoodId ?? addData.MealFoodId ?? null;
      }
    } catch {
      alert('음식 저장에 실패했습니다.');
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

  const handleRemoveFood = async (type, idx) => {
    const targetFood = meals[type].items[idx];
    if (targetFood?.mealFoodId) {
      try {
        const res = await fetch(`${API_BASE}/meals/food/${targetFood.mealFoodId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      } catch {
        alert('음식 삭제에 실패했습니다.');
        return;
      }
    }
    setMeals(prev => ({ ...prev, [type]: { ...prev[type], items: prev[type].items.filter((_, i) => i !== idx) } }));
  };

  // 즐겨찾기 토글 - 전체 음식 데이터를 저장
  const toggleFavorite = (food: any) => {
    setFavorites(prev =>
      prev.some(f => f.name === food.name)
        ? prev.filter(f => f.name !== food.name)
        : [...prev, food]
    );
  };
  // 즐겨찾기 여부 확인
  const isFavorite = (foodName: string) => favorites.some(f => f.name === foodName);

  const openPhoto = (type) => { setPhotoMealType(type); setModalPhotoUrl(null); setAnalysisStatus('idle'); setIsPhotoOpen(true); };
  const closePhoto = () => { setIsPhotoOpen(false); setPhotoMealType(null); };
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => { setModalPhotoUrl(reader.result); setAnalysisStatus('idle'); }; reader.readAsDataURL(file); }
  };
  const startAnalysis = async () => {
    if (!modalPhotoUrl) return;
    setAnalysisStatus('analyzing');
    try {
      const base64 = modalPhotoUrl.split(',')[1];
      const res = await fetch(`${API_BASE}/meals/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ImageBase64: base64,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = String(data.result ?? '').replace(/```json|```/g, '').trim();
        const foods = JSON.parse(raw).foods ?? [];
        setAnalysisResult(foods);
        // 분석 완료 시 모든 음식을 기본으로 선택된 상태로 초기화
        setSelectedFoods(foods.map((_, idx) => idx));
        setAnalysisStatus('done');
      } else {
        setAnalysisStatus('idle');
        alert('분석 실패');
      }
    } catch {
      setAnalysisStatus('idle');
      alert('서버 연결 실패');
    }
  };
  const confirmPhoto = async () => {
    if (!photoMealType || !modalPhotoUrl || analysisStatus !== 'done' || !analysisResult) return;
    const targetMealType = photoMealType as MealTypeKey;
    // selectedFoods에 있는 인덱스만 필터링해서 선택된 음식만 식단에 추가
    const newItems = (analysisResult as any[]).filter((_, idx) => selectedFoods.includes(idx)).map((food: any) => ({
      name: food.name,
      grams: 100,
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      sodium: food.sodium || 0,
    }));
    let mealId = meals[targetMealType].mealId;
    const savedItems = [];

    try {
      if (profileId) {
        if (!mealId) {
          const mealRes = await fetch(`${API_BASE}/meals/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ProfileId: profileId,
              MealType: mealTypeToApi(targetMealType),
              MealDate: selectedDate,
            }),
          });
          if (!mealRes.ok) throw new Error();
          const mealData = await mealRes.json();
          mealId = mealData.mealId ?? mealData.MealId;
        }

        for (const item of newItems) {
          const addRes = await fetch(`${API_BASE}/meals/add-food`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              MealId: mealId,
              FoodName: item.name,
              Calories: item.calories,
              Carbohydrate: item.carbs,
              Protein: item.protein,
              Fat: item.fat,
              Sodium: item.sodium,
              Grams: item.grams,
            }),
          });
          if (!addRes.ok) throw new Error();
          const addData = await addRes.json();
          savedItems.push({ ...item, mealFoodId: addData.mealFoodId ?? addData.MealFoodId ?? null });
        }
      } else {
        savedItems.push(...newItems);
      }
    } catch {
      alert('분석 음식 저장에 실패했습니다.');
      return;
    }

    setMeals(prev => ({ ...prev, [targetMealType]: { ...prev[targetMealType], mealId, imgUrl: modalPhotoUrl, items: [...prev[targetMealType].items, ...savedItems] } }));
    closePhoto();
    setTimeout(() => openMealModal(targetMealType), 80);
  };
  const removeImage = (type) => setMeals(prev => ({ ...prev, [type]: { ...prev[type], imgUrl: null } }));

  // 특정 날짜의 총 칼로리를 mealsByDate에서 계산
  const getDayCalories = (dateStr: string) => {
    const day = mealsByDate[dateStr];
    if (!day) return 0;
    return ['breakfast','lunch','dinner','snack'].reduce((sum, type) =>
      sum + (day[type]?.items || []).reduce((s, item) => s + item.calories, 0), 0);
  };

  // 날짜 문자열(YYYY-MM-DD) 생성 헬퍼
  const getDateStr = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  // 실제 mealsByDate 데이터와 TARGET_CALORIES 목표선으로 그래프 데이터 생성
  const getGraphData = (period: string) => {
    const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
    switch (period) {
      case 'daily': {
        const b = meals.breakfast.items.reduce((a, c) => a + c.calories, 0);
        const l = meals.lunch.items.reduce((a, c) => a + c.calories, 0);
        const d = meals.dinner.items.reduce((a, c) => a + c.calories, 0);
        const s = meals.snack.items.reduce((a, c) => a + c.calories, 0);
        return {
          labels:    ['아침', '점심', '저녁', '간식'],
          sublabels: null as string[] | null,
          intake:    [b, l, d, s],
          target:    Array(4).fill(TARGET_CALORIES / 4), // 일간: 끼니당 권장선
        };
      }
      case 'weekly': {
        const items = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 6 + i);
          return {
            label:    DAY_KO[d.getDay()],
            sublabel: `${d.getMonth() + 1}/${d.getDate()}`,
            dateStr:  d.toISOString().split('T')[0],
          };
        });
        return {
          labels:    items.map(x => x.label),
          sublabels: items.map(x => x.sublabel),
          intake:    items.map(x => getDayCalories(x.dateStr)),
          target:    Array(7).fill(TARGET_CALORIES), // 주간: 일일 권장선
        };
      }
      case 'monthly': {
        // 식사 데이터가 있는 날만 평균 — 비어있는 날은 제외
        const items = Array.from({ length: 4 }, (_, w) => {
          const start = new Date(selectedDate);
          start.setDate(start.getDate() - 27 + w * 7);
          const end = new Date(selectedDate);
          end.setDate(end.getDate() - 27 + w * 7 + 6);
          const dayCals = Array.from({ length: 7 }, (_, d) =>
            getDayCalories(getDateStr(-27 + w * 7 + d))
          );
          const activeDays = dayCals.filter(c => c > 0);
          return {
            label:    `${w + 1}주차`,
            sublabel: `${start.getMonth()+1}/${start.getDate()}~${end.getMonth()+1}/${end.getDate()}`,
            intake:   activeDays.length > 0
              ? Math.round(activeDays.reduce((a, b) => a + b, 0) / activeDays.length)
              : 0,
          };
        });
        return {
          labels:    items.map(x => x.label),
          sublabels: items.map(x => x.sublabel),
          intake:    items.map(x => x.intake),
          target:    Array(4).fill(TARGET_CALORIES), // 월간: 일일 권장선
        };
      }
      case 'yearly': {
        // 식사 데이터가 있는 날만 평균 — 비어있는 날은 제외
        // 오프셋 범위: -363 ~ 0 (오늘 포함 364일)
        // q=0: -363~-273  q=1: -272~-182  q=2: -181~-91  q=3: -90~0(오늘)
        const Q_MONTHS = ['1~3월', '4~6월', '7~9월', '10~12월'];
        const items = Array.from({ length: 4 }, (_, q) => {
          const dayCals = Array.from({ length: 91 }, (_, d) =>
            getDayCalories(getDateStr(-363 + q * 91 + d))
          );
          const activeDays = dayCals.filter(c => c > 0);
          return {
            label:    `${q + 1}분기`,
            sublabel: Q_MONTHS[q],
            intake:   activeDays.length > 0
              ? Math.round(activeDays.reduce((a, b) => a + b, 0) / activeDays.length)
              : 0,
          };
        });
        return {
          labels:    items.map(x => x.label),
          sublabels: items.map(x => x.sublabel),
          intake:    items.map(x => x.intake),
          target:    Array(4).fill(TARGET_CALORIES), // 년간: 일일 권장선
        };
      }
      default:
        return { labels: [], sublabels: null as string[] | null, intake: [], target: [] };
    }
  };

  const graphData = getGraphData(graphPeriod);
  const safeIntake = graphData.intake.map(v => (isNaN(v) || !isFinite(v)) ? 0 : v);
  // 일간: 끼니당 칼로리 기준 → 1500 고정 (권장선 TARGET/4가 약 33~42% 위치로 가독성 확보)
  // 주간/월간/년간: 하루 전체 칼로리 기준 → 3500 고정
  const maxCal = graphPeriod === 'daily' ? 1500 : 3500;
  // 권장선 기준값: 일간=끼니당(TARGET/4), 나머지=하루 전체 TARGET
  const periodTargetUnit = graphPeriod === 'daily' ? TARGET_CALORIES / 4 : TARGET_CALORIES;
  const graphWidth = 420;
  const graphHeight = 130;
  const startX = 50;
  const endY = 150;

  // 라벨 2개 미만이면 빈 배열 (division by zero → NaN 좌표 방지)
  const _n = graphData.labels.length;
  // y 좌표는 maxCal(3500)로 clamp → 초과 값이 그래프 밖으로 뚫고 나가지 않음
  // 실제 값(val)은 그대로 유지하여 라벨에 정확한 수치 표시
  const topY = endY - graphHeight; // 그래프 최상단 y좌표 (= 3500 위치)
  const points = _n < 2 ? [] : safeIntake.map((val, i) => ({
    x: startX + (i / (_n - 1)) * graphWidth,
    y: Math.max(topY, endY - (val / maxCal) * graphHeight), // 3500 이상이면 topY에 고정
    val,
    label: graphData.labels[i],
    sublabel: graphData.sublabels?.[i] ?? null,
  }));
  const targetPoints = _n < 2 ? [] : graphData.target.map((val, i) => ({ x: startX + (i / (_n - 1)) * graphWidth, y: endY - (Math.min(isNaN(val) ? 0 : val, maxCal) / maxCal) * graphHeight }));

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
                <p className="text-xs text-slate-400 font-medium mb-8">로그인하거나 새 계정을 만들어 시작하세요.</p>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-left"><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">아이디</label><input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디를 입력하세요" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" autoFocus /></div>
                  <div className="text-left"><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">비밀번호</label><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="비밀번호를 입력하세요" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" /></div>
                  {loginError && <div className="text-xs font-bold text-red-500 bg-red-50 py-2 rounded-lg">{loginError}</div>}
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-xl text-base hover:bg-slate-900 transition-all">로그인</button>
                    <button type="button" onClick={handleGoToRegister} className="w-full mt-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-xl text-base hover:opacity-95 transition-all">이 정보로 회원가입</button>
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
            {isRegisterMode && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">아이디</label><input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="가입 아이디" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required /></div>
                <div><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">비밀번호</label><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="4자 이상" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required minLength={4} /></div>
              </div>
            )}
            <div><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">이름</label><input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} placeholder="예: 홍길동" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required autoFocus /></div>
            <div>
              <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">성별</label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (<button key={g} type="button" onClick={() => setUserInfo({ ...userInfo, gender: g })} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.gender === g ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}>{g === 'male' ? '남성' : '여성'}</button>))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ key: 'age', label: '나이 (세)', ph: '예: 24' }, { key: 'height', label: '신장 (cm)', ph: '예: 175' }].map(({ key, label, ph }) => (
                <div key={key}><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">{label}</label><input type="number" value={userInfo[key]} onChange={(e) => setUserInfo({ ...userInfo, [key]: e.target.value })} placeholder={ph} className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required /></div>
              ))}
            </div>
            <div><label className="block text-xs font-extrabold text-black mb-1.5 pl-1">체중 (kg)</label><input type="number" value={userInfo.weight} onChange={(e) => setUserInfo({ ...userInfo, weight: e.target.value })} placeholder="예: 70" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required /></div>
            <div>
              <label className="block text-xs font-extrabold text-black mb-2 pl-1">직업 / 활동 유형</label>
              <div className="grid grid-cols-2 gap-2">
                {JOB_OPTIONS.map(job => (
                  <button key={job.value} type="button" onClick={() => setUserInfo({ ...userInfo, job: String(job.value) })} className={`flex flex-col items-start px-3 py-3 rounded-xl border text-left transition-all ${String(userInfo.job) === String(job.value) ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <span className={`text-sm font-bold ${String(userInfo.job) === String(job.value) ? 'text-orange-600' : 'text-slate-700'}`}>{job.label}</span>
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

  const selectedJob = JOB_OPTIONS.find(j => String(j.value) === String(userInfo.job));
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/25">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-sm select-none">👹</span>
            <div className="leading-tight">
              <h1 className="text-xl font-black text-white tracking-tight">먹깨비</h1>
              <p className="text-[10px] font-semibold text-orange-100 leading-none hidden sm:block">AI 배달음식 영양 관리</p>
            </div>
          </div>
          {/* 유저 정보 + 로그아웃 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-white/15 hover:bg-white/20 transition-colors rounded-full px-3 py-1.5 border border-white/25 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-full bg-white/25 border-2 border-white/50 flex items-center justify-center text-white font-black text-sm shadow-inner">
                {userInfo.name ? userInfo.name.charAt(0) : '먹'}
              </div>
              <span className="text-sm font-bold text-white hidden sm:inline">
                {userInfo.name ? `${userInfo.name} 님` : '사용자 님'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/25 active:bg-white/30 px-3 py-1.5 rounded-full border border-white/25 transition-all duration-150"
            >
              로그아웃
            </button>
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
                {(['breakfast', 'lunch', 'dinner', 'snack']).map((type) => {
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
                      {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
                        <button key={period} onClick={() => setGraphPeriod(period)} className={`text-[10px] font-black px-2 py-1 rounded-md transition-all ${graphPeriod === period ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                          {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : period === 'monthly' ? '월간' : '년간'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-4 overflow-x-auto">
                  <div className="min-w-[450px]">
                    {/*
                      key에 기간+섭취량을 모두 포함 → 데이터 변경 시 SVG 완전 재마운트
                      SVG 내부 요소는 className 대신 SVG 속성 직접 사용 (CSS transition 제거)
                      → React의 removeChild DOM 충돌 완전 차단
                    */}
                    <svg key={`${graphPeriod}-${safeIntake.join(',')}`} viewBox="0 0 500 200" className="w-full h-auto overflow-visible">
                      <defs>
                        <linearGradient id="intakeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>

                      {/* Y축 그리드 — 3칸 고정 눈금 (maxCal 기준 3등분) */}
                      {Array.from({ length: 4 }, (_, i) => Math.round(maxCal * i / 3)).map((val) => {
                        const y = endY - (val / maxCal) * graphHeight;
                        const isTarget = val === Math.round(periodTargetUnit);
                        return (
                          <g key={`y-${val}`}>
                            <line x1="50" y1={y} x2="480" y2={y}
                              stroke={isTarget ? "#f43f5e" : "#cbd5e1"}
                              strokeWidth="1"
                              strokeDasharray={isTarget ? "0" : "3 3"}
                              opacity={isTarget ? "0.6" : "0.5"} />
                            <text x="42" y={y + 3} textAnchor="end"
                              fill={isTarget ? "#f43f5e" : "#94a3b8"}
                              fontSize="9" fontWeight="bold">{val}</text>
                          </g>
                        );
                      })}

                      {/* 일간 모드: 그래프 우상단에 날짜 표시 */}
                      {graphPeriod === 'daily' && (() => {
                        const [yr, mo, dy] = selectedDate.split('-').map(Number);
                        const dow = new Date(selectedDate).getDay();
                        const DOW = ['일','월','화','수','목','금','토'];
                        return (
                          <text x="478" y="22" textAnchor="end"
                            fill="#64748b" fontSize="11" fontWeight="bold">
                            {`${yr}년 ${mo}월 ${dy}일 (${DOW[dow]})`}
                          </text>
                        );
                      })()}

                      {intakeAreaPath && <path d={intakeAreaPath} fill="url(#intakeAreaGrad)" />}
                      {targetLinePath && <path d={targetLinePath} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 4" />}
                      {intakeLinePath && <path d={intakeLinePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                      {/* 권장선 끝 라벨 */}
                      {targetPoints.length > 0 && (() => {
                        const ty = targetPoints[0].y;
                        return (
                          <g>
                            <rect x="482" y={ty - 8} width="18" height="13" rx="3" fill="#fff1f2" />
                            <text x="491" y={ty + 2} textAnchor="middle" fill="#f43f5e" fontSize="8" fontWeight="bold">권장</text>
                          </g>
                        );
                      })()}

                      {/* 데이터 포인트 + X축 라벨 + 날짜 서브라벨 */}
                      {points.map((p) => (
                        <g key={`pt-${p.label}-${p.x}`}>
                          <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="#f97316" strokeWidth="2.5" />
                          {p.val > 0 && (
                            <text x={p.x} y={p.y - 9} textAnchor="middle" fill="#ea580c" fontSize="10" fontWeight="bold">{p.val}</text>
                          )}
                          <text x={p.x} y="168" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="bold">{p.label}</text>
                          {p.sublabel && (
                            <text x={p.x} y="183" textAnchor="middle" fill="#94a3b8" fontSize="9">{p.sublabel}</text>
                          )}
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
                  {[{ key: 'age', label: '나이(세)' }, { key: 'height', label: '신장(cm)' }, { key: 'weight', label: '체중(kg)' }].map(({ key, label }) => (
                    <div key={key}><label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">{label}</label><input type="number" value={userInfo[key]} onChange={(e) => setUserInfo(prev => ({ ...prev, [key]: e.target.value }))} className="w-full text-black bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:bg-white focus:border-orange-400 text-center" required /></div>
                  ))}
                </div>
                {/* 직업 선택 - 클릭해서 변경 가능 */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">직업</label>
                  <div className="grid grid-cols-2 gap-1">
                    {JOB_OPTIONS.map(job => (
                      <button key={job.value} type="button" onClick={() => setUserInfo(prev => ({ ...prev, job: String(job.value) }))}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold text-left transition-all ${String(userInfo.job) === String(job.value) ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        {job.label}
                      </button>
                    ))}
                  </div>
                </div>
                {isSaved && <div className="text-center text-[10px] font-bold text-green-600 bg-green-50 py-1.5 rounded-lg">✅ 정보 업데이트 완료!</div>}
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-2.5 rounded-xl text-xs hover:opacity-95 transition-all">내 정보 업데이트</button>
              </form>
            </div>

            {/* 2. AI 맞춤 추천 - Gemini API 실시간 추천 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h4 className="text-sm font-black text-slate-800">AI 맞춤 추천</h4>
              </div>
              {isRecommendLoading ? (
                // Gemini 응답 대기 중 로딩 표시
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                  <p className="text-xs font-bold text-slate-400">AI가 맞춤 메뉴를 분석 중...</p>
                </div>
              ) : recommendError ? (
                // API 오류 시 에러 메시지 + 재시도 안내
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-xs font-bold text-red-500">AI 추천 일시 오류</p>
                  <p className="text-[10px] text-slate-400 leading-snug break-keep">{recommendError}</p>
                  <p className="text-[10px] text-slate-400">잠시 후 음식을 추가하면 재시도합니다.</p>
                </div>
              ) : aiRecommendations.length > 0 ? (
                // Gemini가 추천한 메뉴 표시
                <div className="space-y-3">
                  {aiRecommendations.map((menu, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white hover:border-orange-200 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-600 border-orange-100">🤖 AI 추천</span>
                        <span className="text-xs font-black text-orange-600">{menu.calories} kcal</span>
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
              ) : (
                // 식단 미입력 시 안내 메시지
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <span className="text-3xl mb-2">🍽️</span>
                  <p className="text-xs font-bold text-center">아침, 점심, 저녁 중 하나를 입력하면<br/>AI가 맞춤 메뉴를 추천해드려요.</p>
                </div>
              )}
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
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto text-right">
                          <span className="w-14 text-sm font-black text-orange-500">{item.calories} kcal</span>
                          {/* 식단 상세에서 바로 즐겨찾기 토글 */}
                          <button onClick={() => toggleFavorite(item)} className={`transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 ${isFavorite(item.name) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} title={isFavorite(item.name) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite(item.name) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          </button>
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

      {/* ════ 메뉴 검색 모달 ════ */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{MEAL_CFG[searchMealType]?.emoji} {MEAL_CFG[searchMealType]?.label} 메뉴 검색</h3>
              <button onClick={closeSearch} className="text-slate-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="음식명을 입력하세요 (예: 마라탕, 치킨)" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white transition-all text-slate-800 font-bold" autoFocus />
                <svg className="w-4 h-4 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              {/* 즐겨찾기 섹션 - 검색어 없을 때 항상 표시 */}
              {!searchQuery && (
                <div className="mb-4">
                  <p className="text-[10px] font-extrabold text-amber-500 mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                    즐겨찾기
                  </p>
                  {favorites.length === 0 ? (
                    <div className="text-center py-3 text-slate-400 text-xs font-bold bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                      검색 후 ★ 버튼을 눌러 즐겨찾기에 추가하세요
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {favorites.map((food, idx) => (
                        <div key={idx} className="flex items-center px-4 py-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-all">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelectFoodItem(food)}>
                            <span className="text-sm font-bold text-slate-700">{food.name}</span>
                            <span className="text-xs font-bold text-amber-500 ml-2">{food.calories} kcal</span>
                          </div>
                          {/* 별 눌러서 즐겨찾기 해제 */}
                          <button onClick={() => toggleFavorite(food)} className="ml-2 text-amber-400 hover:text-slate-400 transition-colors flex-shrink-0" title="즐겨찾기 해제">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                          </button>
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
                  // 검색 결과 - 각 항목에 ⭐ 즐겨찾기 버튼 추가
                  (searchResults as any[]).map((food, idx) => {
                    const foodObj = {
                      name: food.name,
                      calories: food.calories,
                      carbs: food.carbs,
                      protein: food.protein,
                      fat: food.fat,
                      sodium: food.sodium,
                    };
                    return (
                      <div key={idx} className="flex items-center px-4 py-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all">
                        {/* 음식 정보 클릭 → 용량 선택 */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelectFoodItem(foodObj)}>
                          <div className="flex items-center gap-1 flex-wrap">
                            {food.isAi && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600 text-[9px] font-black tracking-wide">
                                ✦ AI추정
                              </span>
                            )}
                            {food.makerName && !food.isAi && <span className="text-[10px] font-bold text-slate-400">{food.makerName} · </span>}
                            <span className="text-sm font-bold text-slate-700">{food.rawName || food.name}</span>
                            <span className="text-sm font-black text-orange-500">{Math.round(food.calories)} kcal</span>
                          </div>
                        </div>
                        {/* 즐겨찾기 토글 버튼 */}
                        <button onClick={() => toggleFavorite(foodObj)} className={`ml-2 flex-shrink-0 transition-all ${isFavorite(foodObj.name) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} title={isFavorite(foodObj.name) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite(foodObj.name) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                    <p className="text-sm">{searchQuery ? '검색 결과가 없습니다.' : favorites.length === 0 ? '음식명을 입력하세요.' : '음식명을 입력하세요.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ 용량 조절 모달 ════ */}
      {selectedFoodForDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedFoodForDetail(null); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-black tracking-tight">섭취 용량 설정</h3>
              <div className="flex items-center gap-2">
                {/* 용량 설정 화면에서 바로 즐겨찾기 토글 */}
                <button onClick={() => toggleFavorite(selectedFoodForDetail)} className={`transition-all ${isFavorite(selectedFoodForDetail.name) ? 'text-amber-300' : 'text-white/50 hover:text-amber-200'}`} title={isFavorite(selectedFoodForDetail.name) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isFavorite(selectedFoodForDetail.name) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </button>
                <button onClick={() => setSelectedFoodForDetail(null)} className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
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
                 
                {analysisStatus === 'done' && analysisResult && (
  <div className="w-full space-y-2">
    <h4 className="text-sm font-black text-slate-800 mb-2">분석 완료 ✅</h4>
    {/* 각 음식 카드를 클릭하면 체크/언체크 토글, 선택된 항목은 초록 테두리로 표시 */}
    {analysisResult.map((food, idx) => (
      <div key={idx}
        onClick={() => setSelectedFoods(prev =>
          prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        )}
        className={`rounded-xl p-3 border cursor-pointer transition-all ${
          selectedFoods.includes(idx) ? 'border-green-400 bg-green-50' : 'bg-white border-slate-100'
        }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{selectedFoods.includes(idx) ? '✅' : '⬜'}</span>
          <p className="text-sm font-black text-slate-800">{food.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap pl-6">
          <span className="text-[10px] font-bold text-blue-600">탄 {food.carbs}g</span>
          <span className="text-[10px] font-bold text-green-600">단 {food.protein}g</span>
          <span className="text-[10px] font-bold text-amber-600">지 {food.fat}g</span>
          <span className="text-[10px] font-bold text-orange-500">{food.calories}kcal</span>
        </div>
      </div>
    ))}
  </div>
)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {analysisStatus !== 'done' ? (
                  <button onClick={startAnalysis} disabled={!modalPhotoUrl || analysisStatus === 'analyzing'} className="col-span-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 rounded-xl shadow-md text-sm hover:opacity-95 transition-all disabled:opacity-50">분석 시작</button>
                ) : (
                  <><button onClick={() => setAnalysisStatus('idle')} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-xl text-sm hover:bg-slate-200 transition-colors">다시 분석하기</button><button onClick={confirmPhoto} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-4 rounded-xl shadow-md text-sm hover:opacity-95 transition-all">식단 등록</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
