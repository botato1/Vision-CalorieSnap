import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import AmountModal from './components/AmountModal';
import MealModal from './components/MealModal';
import PhotoModal from './components/PhotoModal';
import SearchModal from './components/SearchModal';
import {
  API_BASE_URL,
  JOB_OPTIONS,
  MEAL_KEYS,
  calcTotals,
  createEmptyMeals,
  mealTypeFromApi,
  parseAiJson,
} from './constants';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import type {
  AnalysisStatus,
  ApiMealRecord,
  FoodItem,
  GraphPeriod,
  MealKey,
  MealsByDate,
  MealsState,
  SearchFoodResponse,
  UserInfo,
  UserProfileResponse,
} from './types';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<FoodItem[] | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialSetupDone, setIsInitialSetupDone] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [registerId, setRegisterId] = useState('');
  const [registerPw, setRegisterPw] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [profileId, setProfileId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', gender: 'male', age: '', height: '', weight: '', job: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealsByDate, setMealsByDate] = useState<MealsByDate>({});
  const [mealModalType, setMealModalType] = useState<MealKey | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMealType, setSearchMealType] = useState<MealKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<FoodItem | null>(null);
  const [searchResults, setSearchResults] = useState<SearchFoodResponse[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<FoodItem[]>([]);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [foodGrams, setFoodGrams] = useState(100);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [photoMealType, setPhotoMealType] = useState<MealKey | null>(null);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [graphPeriod, setGraphPeriod] = useState<GraphPeriod>('daily');

  const meals = mealsByDate[selectedDate] || createEmptyMeals();

  const calcTargetCalories = () => {
    const weight = parseFloat(userInfo.weight);
    const height = parseFloat(userInfo.height);
    const age = parseFloat(userInfo.age);
    if (!weight || !height || !age) return 2000;

    const bmr = userInfo.gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    const job = JOB_OPTIONS.find((item) => item.value === userInfo.job);
    return Math.round(bmr * (job?.multiplier ?? 1.2));
  };

  const TARGET_CALORIES = calcTargetCalories();
  const TARGET = {
    carbs: Math.round(TARGET_CALORIES * 0.5 / 4),
    protein: Math.round(TARGET_CALORIES * 0.2 / 4),
    fat: Math.round(TARGET_CALORIES * 0.3 / 9),
    sodium: 2000,
  };

  const applyUserProfile = (profile: UserProfileResponse) => {
    setUserInfo({
      name: profile.name ?? '',
      gender: profile.male ? 'male' : 'female',
      age: String(profile.age ?? ''),
      height: String(profile.height ?? ''),
      weight: String(profile.weight ?? ''),
      job: Number(profile.job ?? 0),
    });
  };

  const fetchUserProfile = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/${id}`);
    if (!res.ok) throw new Error(`사용자 정보 조회 실패 (${res.status})`);
    const data: { profileId: string; profile: UserProfileResponse } = await res.json();
    applyUserProfile(data.profile);
    return data.profile;
  };

  const setMeals = (updater: MealsState | ((current: MealsState) => MealsState)) => {
    setMealsByDate((prev) => {
      const current = prev[selectedDate] || createEmptyMeals();
      const updated = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [selectedDate]: updated };
    });
  };

  const allItems = [...meals.breakfast.items, ...meals.lunch.items, ...meals.dinner.items, ...meals.snack.items];
  const totalConsumed = calcTotals(allItems);
  const pct = Math.min(100, Math.round((totalConsumed.calories / TARGET_CALORIES) * 100));

  useEffect(() => {
    if (!isLoggedIn || !isInitialSetupDone || !profileId) return;

    const controller = new AbortController();
    const loadMeals = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/meals/profile/${profileId}/date/${selectedDate}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;

        const records: ApiMealRecord[] = await res.json();
        const nextMeals = createEmptyMeals();
        records.forEach((record) => {
          const mealType = mealTypeFromApi(record.mealType);
          if (!mealType) return;

          record.foods?.forEach((food) => {
            nextMeals[mealType].items.push({
              name: food.name ?? food.foodName ?? '',
              grams: food.grams ?? food.intakeAmount ?? 100,
              calories: Math.round(food.calories ?? 0),
              carbs: Math.round(food.carbs ?? food.carbohydrate ?? 0),
              protein: Math.round(food.protein ?? 0),
              fat: Math.round(food.fat ?? 0),
              sodium: Math.round(food.sodium ?? 0),
            });
          });
        });

        setMealsByDate((prev) => ({ ...prev, [selectedDate]: nextMeals }));
      } catch (error: unknown) {
        if ((error as { name?: string })?.name !== 'AbortError') console.warn('식단 API 조회 실패:', error);
      }
    };

    void loadMeals();
    return () => controller.abort();
  }, [isLoggedIn, isInitialSetupDone, profileId, selectedDate]);

  useEffect(() => {
    const controller = new AbortController();
    const hasMeal = meals.breakfast.items.length > 0 || meals.lunch.items.length > 0 || meals.dinner.items.length > 0;
    if (!hasMeal) {
      setAiRecommendations([]);
      setRecommendError(null);
      return;
    }

    setIsRecommendLoading(true);
    const remaining = {
      calories: Math.max(0, TARGET_CALORIES - totalConsumed.calories),
      protein: Math.max(0, TARGET.protein - totalConsumed.protein),
      carbs: Math.max(0, TARGET.carbs - totalConsumed.carbs),
      fat: Math.max(0, TARGET.fat - totalConsumed.fat),
    };

    const fetchRecommendations = async () => {
      setRecommendError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/meals/recommend`, {
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
          const parsed = parseAiJson(data.result);
          setAiRecommendations(Array.isArray(parsed) ? parsed : []);
        } else {
          const errData = await res.json().catch(() => ({}));
          setRecommendError(errData.message || `AI 추천 서비스 오류 (${res.status})`);
          setAiRecommendations([]);
        }
      } catch (error: unknown) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          setRecommendError('네트워크 오류로 AI 추천을 불러올 수 없습니다.');
          setAiRecommendations([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsRecommendLoading(false);
      }
    };

    const timer = setTimeout(fetchRecommendations, 3000);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    meals.breakfast.items.length,
    meals.lunch.items.length,
    meals.dinner.items.length,
    selectedDate,
    TARGET_CALORIES,
    TARGET.carbs,
    TARGET.fat,
    TARGET.protein,
    totalConsumed.calories,
    totalConsumed.carbs,
    totalConsumed.fat,
    totalConsumed.protein,
  ]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginId('');
    setLoginPw('');
    setLoginError('');
  };

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileID: loginId, profilePW: loginPw }),
      });
      if (res.ok) {
        const data = await res.json();
        const nextProfileId = data.profileId ?? loginId;
        await fetchUserProfile(nextProfileId);
        setIsLoggedIn(true);
        setProfileId(nextProfileId);
        setIsInitialSetupDone(true);
        closeLoginModal();
      } else {
        setLoginError('아이디 또는 비밀번호가 틀렸습니다.');
      }
    } catch {
      setLoginError('서버 연결 실패');
    }
  };

  const handleGoToRegister = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setIsInitialSetupDone(false);
    setRegisterId('');
    setRegisterPw('');
    setRegisterError('');
    setIsLoginModalOpen(false);
    setLoginError('');
  };

  const handleInitialSetupSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError('');
    if (!registerId.trim() || !registerPw.trim()) {
      setRegisterError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    if (userInfo.job === '') {
      setRegisterError('직업을 선택해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileID: registerId,
          profilePW: registerPw,
          name: userInfo.name,
          male: userInfo.gender === 'male',
          height: parseFloat(userInfo.height),
          weight: parseFloat(userInfo.weight),
          age: parseInt(userInfo.age),
          targetCalories: TARGET_CALORIES,
          job: Number(userInfo.job),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.name}님, ${data.message} 환영합니다!`);
        setProfileId(data.profileId ?? registerId);
        setLoginId(registerId);
        setLoginPw('');
        setIsInitialSetupDone(true);
      } else {
        const errData = await response.json();
        setRegisterError(errData.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      setRegisterError('서버 연결에 실패했습니다.');
    }
  };

  const handleSaveUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/${profileId}/body`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userInfo.name,
          male: userInfo.gender === 'male',
          height: parseFloat(userInfo.height),
          weight: parseFloat(userInfo.weight),
          age: parseInt(userInfo.age),
          targetCalories: TARGET_CALORIES,
          job: Number(userInfo.job || 0),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`정보 업데이트 실패: ${errData.message || res.status}`);
        return;
      }

      const data: { profile: UserProfileResponse } = await res.json();
      applyUserProfile(data.profile);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error(error);
      alert('서버 연결에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsInitialSetupDone(false);
    setMealModalType(null);
    setProfileId('');
    setRegisterId('');
    setRegisterPw('');
  };

  const openSearch = (type: MealKey) => {
    setSearchMealType(type);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(true);
    setSelectedFoodForDetail(null);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchMealType(null);
    setSelectedFoodForDetail(null);
    setSearchResults([]);
  };

  const handleSearchFood = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/meals/search-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: query }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleSelectFoodItem = (food: FoodItem) => {
    setSelectedFoodForDetail(food);
    setFoodGrams(100);
  };

  const syncFoodsToApi = async (mealType: MealKey, foods: FoodItem[]) => {
    const ownerProfileId = profileId || loginId;
    if (!ownerProfileId || foods.length === 0) return;

    try {
      const mealRes = await fetch(`${API_BASE_URL}/api/meals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: ownerProfileId,
          mealType,
          mealDate: selectedDate,
        }),
      });

      if (!mealRes.ok) throw new Error(`식사 생성 실패 (${mealRes.status})`);
      const { mealId } = await mealRes.json();
      if (!mealId) throw new Error('식사 ID가 없습니다.');

      await Promise.all(foods.map((food) => fetch(`${API_BASE_URL}/api/meals/add-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId,
          foodName: food.name,
          calories: food.calories,
          carbohydrate: food.carbs,
          protein: food.protein,
          fat: food.fat,
          sodium: food.sodium || 0,
          grams: food.grams || 100,
        }),
      })));
    } catch (error) {
      console.warn('식단 API 저장 실패:', error);
    }
  };

  const confirmAddFood = () => {
    if (!searchMealType || !selectedFoodForDetail) return;
    const mealType = searchMealType;
    const multiplier = foodGrams / 100;
    const finalFood: FoodItem = {
      name: selectedFoodForDetail.name,
      grams: foodGrams,
      calories: Math.round(selectedFoodForDetail.calories * multiplier),
      carbs: Math.round(selectedFoodForDetail.carbs * multiplier),
      protein: Math.round(selectedFoodForDetail.protein * multiplier),
      fat: Math.round(selectedFoodForDetail.fat * multiplier),
      sodium: Math.round((selectedFoodForDetail.sodium || 0) * multiplier),
    };

    setMeals((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        items: [...prev[mealType].items, finalFood],
      },
    }));
    void syncFoodsToApi(mealType, [finalFood]);
    closeSearch();
    setTimeout(() => setMealModalType(mealType), 80);
  };

  const handleRemoveFood = (type: MealKey, idx: number) => {
    setMeals((prev) => ({ ...prev, [type]: { ...prev[type], items: prev[type].items.filter((_, i) => i !== idx) } }));
  };

  const toggleFavorite = (food: FoodItem) => {
    setFavorites((prev) => (
      prev.some((item) => item.name === food.name)
        ? prev.filter((item) => item.name !== food.name)
        : [...prev, food]
    ));
  };

  const isFavorite = (foodName: string) => favorites.some((food) => food.name === foodName);

  const openPhoto = (type: MealKey) => {
    setPhotoMealType(type);
    setModalPhotoUrl(null);
    setAnalysisResult(null);
    setAnalysisStatus('idle');
    setIsPhotoOpen(true);
  };

  const closePhoto = () => {
    setIsPhotoOpen(false);
    setPhotoMealType(null);
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setModalPhotoUrl(reader.result);
        setAnalysisResult(null);
        setAnalysisStatus('idle');
      }
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async () => {
    if (!modalPhotoUrl) return;
    setAnalysisStatus('analyzing');

    try {
      const base64 = modalPhotoUrl.split(',')[1];
      const res = await fetch(`${API_BASE_URL}/api/meals/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          profileId: profileId || loginId,
          mealType: photoMealType,
          mealDate: selectedDate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = parseAiJson(data.result);
        const foods: FoodItem[] = Array.isArray(parsed) ? parsed : parsed.foods;
        setAnalysisResult(foods);
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

  const confirmPhoto = () => {
    if (!photoMealType || !modalPhotoUrl || analysisStatus !== 'done' || !analysisResult) return;
    const mealType = photoMealType;
    const newItems: FoodItem[] = analysisResult.filter((_, idx) => selectedFoods.includes(idx)).map((food) => ({
      name: food.name,
      grams: 100,
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      sodium: food.sodium || 0,
    }));

    setMeals((prev) => ({ ...prev, [mealType]: { imgUrl: modalPhotoUrl, items: [...prev[mealType].items, ...newItems] } }));
    void syncFoodsToApi(mealType, newItems);
    closePhoto();
    setTimeout(() => setMealModalType(mealType), 80);
  };

  const getDayCalories = (dateStr: string) => {
    const day = mealsByDate[dateStr];
    if (!day) return 0;
    return MEAL_KEYS.reduce((sum, type) =>
      sum + (day[type]?.items || []).reduce((itemSum, item) => itemSum + item.calories, 0), 0);
  };

  const getDateStr = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const getGraphData = (period: GraphPeriod) => {
    switch (period) {
      case 'daily': {
        return {
          labels: ['아침', '점심', '저녁', '간식'],
          intake: MEAL_KEYS.map((type) => meals[type].items.reduce((sum, item) => sum + item.calories, 0)),
          target: Array(4).fill(TARGET_CALORIES / 4),
        };
      }
      case 'weekly': {
        const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
        const labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 6 + i);
          const day = d.getDay();
          return dayNames[day === 0 ? 6 : day - 1];
        });
        const intake = Array.from({ length: 7 }, (_, i) => getDayCalories(getDateStr(-6 + i)));
        return { labels, intake, target: Array(7).fill(TARGET_CALORIES) };
      }
      case 'monthly': {
        const intake = Array.from({ length: 4 }, (_, w) => {
          const weekTotal = Array.from({ length: 7 }, (_, d) => getDayCalories(getDateStr(-27 + w * 7 + d)))
            .reduce((a, b) => a + b, 0);
          return Math.round(weekTotal / 7);
        });
        return { labels: ['1주차', '2주차', '3주차', '4주차'], intake, target: Array(4).fill(TARGET_CALORIES) };
      }
      case 'yearly': {
        const intake = Array.from({ length: 4 }, (_, q) => {
          const qTotal = Array.from({ length: 91 }, (_, d) => getDayCalories(getDateStr(-364 + q * 91 + d)))
            .reduce((a, b) => a + b, 0);
          return Math.round(qTotal / 91);
        });
        return { labels: ['1분기', '2분기', '3분기', '4분기'], intake, target: Array(4).fill(TARGET_CALORIES) };
      }
      default:
        return { labels: [], intake: [], target: [] };
    }
  };

  const graphData = getGraphData(graphPeriod);
  const safeIntake = graphData.intake.map((v) => (isNaN(v) || !isFinite(v)) ? 0 : v);
  const maxCal = Math.max(TARGET_CALORIES * 1.5, ...safeIntake, 1);
  const graphWidth = 420;
  const graphHeight = 130;
  const startX = 50;
  const endY = 150;
  const pointCount = graphData.labels.length;
  const points = pointCount < 2 ? [] : safeIntake.map((val, i) => ({ x: startX + (i / (pointCount - 1)) * graphWidth, y: endY - (val / maxCal) * graphHeight, val, label: graphData.labels[i] }));
  const targetPoints = pointCount < 2 ? [] : graphData.target.map((val, i) => ({ x: startX + (i / (pointCount - 1)) * graphWidth, y: endY - ((isNaN(val) ? 0 : val) / maxCal) * graphHeight }));
  const intakeLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const intakeAreaPath = points.length > 0 ? `${intakeLinePath} L ${points[points.length - 1].x} ${endY} L ${points[0].x} ${endY} Z` : '';
  const targetLinePath = targetPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const graphView = { graphPeriod, safeIntake, maxCal, endY, graphHeight, points, intakeAreaPath, intakeLinePath, targetLinePath };

  if (!isLoggedIn) {
    return (
      <LandingPage
        isLoginModalOpen={isLoginModalOpen}
        loginId={loginId}
        loginPw={loginPw}
        loginError={loginError}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onCloseLogin={closeLoginModal}
        onLoginIdChange={setLoginId}
        onLoginPwChange={setLoginPw}
        onLoginSubmit={handleLoginSubmit}
        onGoToRegister={handleGoToRegister}
      />
    );
  }

  if (!isInitialSetupDone) {
    return (
      <RegisterPage
        registerId={registerId}
        registerPw={registerPw}
        registerError={registerError}
        userInfo={userInfo}
        onRegisterIdChange={setRegisterId}
        onRegisterPwChange={setRegisterPw}
        setUserInfo={setUserInfo}
        onSubmit={handleInitialSetupSubmit}
        onBack={() => {
          setIsLoggedIn(false);
          setRegisterError('');
        }}
      />
    );
  }

  return (
    <>
      <DashboardPage
        userInfo={userInfo}
        setUserInfo={setUserInfo}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        meals={meals}
        totalConsumed={totalConsumed}
        targetCalories={TARGET_CALORIES}
        target={TARGET}
        pct={pct}
        graphView={graphView}
        graphPeriod={graphPeriod}
        setGraphPeriod={setGraphPeriod}
        aiRecommendations={aiRecommendations}
        isRecommendLoading={isRecommendLoading}
        recommendError={recommendError}
        isSaved={isSaved}
        onSaveUser={handleSaveUser}
        onLogout={handleLogout}
        onChangeDate={changeDate}
        onOpenMealModal={setMealModalType}
      />

      {mealModalType && (
        <MealModal
          type={mealModalType}
          meals={meals}
          selectedDate={selectedDate}
          onClose={() => setMealModalType(null)}
          onOpenSearch={openSearch}
          onOpenPhoto={openPhoto}
          onRemoveFood={handleRemoveFood}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {isSearchOpen && (
        <SearchModal
          searchMealType={searchMealType}
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearchLoading={isSearchLoading}
          favorites={favorites}
          onClose={closeSearch}
          onSearchQueryChange={setSearchQuery}
          onSearchFood={handleSearchFood}
          onSelectFood={handleSelectFoodItem}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {selectedFoodForDetail && (
        <AmountModal
          food={selectedFoodForDetail}
          foodGrams={foodGrams}
          onFoodGramsChange={setFoodGrams}
          onClose={() => setSelectedFoodForDetail(null)}
          onConfirm={confirmAddFood}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {isPhotoOpen && (
        <PhotoModal
          modalPhotoUrl={modalPhotoUrl}
          analysisStatus={analysisStatus}
          analysisResult={analysisResult}
          selectedFoods={selectedFoods}
          fileInputRef={fileInputRef}
          onClose={closePhoto}
          onImageSelect={handleImageSelect}
          onStartAnalysis={startAnalysis}
          onConfirm={confirmPhoto}
          onResetAnalysis={() => setAnalysisStatus('idle')}
          onToggleFoodSelection={(idx) => setSelectedFoods((prev) => (
            prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
          ))}
        />
      )}
    </>
  );
}
