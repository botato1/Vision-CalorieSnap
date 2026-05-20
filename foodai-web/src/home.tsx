'use client';

import { useState, useRef, useEffect } from 'react';

// DB의 영양성분은 '100g'을 기준으로 한다고 가정합니다.
const DUMMY_FOOD_DB = [
    { name: '마라탕', calories: 620, carbs: 68, protein: 28, fat: 22, sodium: 2500 },
    { name: '후라이드 치킨', calories: 650, carbs: 25, protein: 45, fat: 35, sodium: 850 },
    { name: '연어 샐러드', calories: 320, carbs: 18, protein: 32, fat: 14, sodium: 320 },
    { name: '페퍼로니 피자', calories: 540, carbs: 58, protein: 22, fat: 24, sodium: 980 },
    { name: '김치찌개', calories: 280, carbs: 12, protein: 18, fat: 12, sodium: 1200 },
    { name: '제육볶음', calories: 480, carbs: 22, protein: 34, fat: 20, sodium: 890 },
    { name: '아메리카노', calories: 10, carbs: 1, protein: 0, fat: 0, sodium: 5 },
    { name: '떡볶이', calories: 380, carbs: 72, protein: 8, fat: 6, sodium: 1100 },
    { name: '현미밥', calories: 210, carbs: 44, protein: 5, fat: 2, sodium: 10 },
    { name: '닭가슴살', calories: 165, carbs: 0, protein: 31, fat: 3, sodium: 150 },
    { name: '프로틴 바', calories: 190, carbs: 20, protein: 21, fat: 6, sodium: 110 },
    { name: '그릭 요거트', calories: 110, carbs: 6, protein: 10, fat: 4, sodium: 40 },
];

const RECOMMEND_MENU_DB = [
    { name: '🍗 숯불 구이 치킨 도시락', tag: '🔥 고단백 추천', tagColor: 'bg-green-50 text-green-600 border-green-100', calories: 450, carbs: 35, protein: 38, fat: 8, desc: '부족한 단백질을 38g이나 채워줄 수 있는 저지방 고단백 한 끼입니다.' },
    { name: '🥑 연어 아보카도 샐러드 랩', tag: '⚖️ 영양 균형식', tagColor: 'bg-blue-50 text-blue-600 border-blue-100', calories: 380, carbs: 42, protein: 22, fat: 12, desc: '탄수화물과 지방의 밸런스가 뛰어나며 오메가3가 풍부합니다.' },
];

// 활동 배수(multiplier)는 미플린-세인트 지어 공식의 PAL 계수 기준
const JOB_OPTIONS = [
    { value: 'sedentary', label: '💼 사무직/재택', desc: '주로 앉아서 생활하는 직업', multiplier: 1.2 },
    { value: 'student', label: '📚 학생', desc: '학교 중심, 가끔 이동', multiplier: 1.3 },
    { value: 'service', label: '🛎️ 서비스/판매직', desc: '서서 이동이 많은 직업', multiplier: 1.375 },
    { value: 'field', label: '🚶 현장직/교사', desc: '이동과 활동이 많은 직업', multiplier: 1.55 },
    { value: 'physical', label: '🔨 육체노동직', desc: '하루 종일 몸을 쓰는 직업', multiplier: 1.725 },
    { value: 'athlete', label: '🏃 운동선수/트레이너', desc: '고강도 훈련이 일상인 직업', multiplier: 1.9 },
];

const MEAL_CFG = {
    breakfast: { label: '아침', emoji: '🌅', gradient: 'from-sky-400 to-blue-500', light: 'bg-sky-50', border: 'border-sky-200', accent: 'text-sky-600', pill: 'bg-sky-100 text-sky-700', btnBorder: 'border-sky-300', btnHover: 'hover:bg-sky-50' },
    lunch: { label: '점심', emoji: '☀️', gradient: 'from-orange-400 to-amber-500', light: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-600', pill: 'bg-orange-100 text-orange-700', btnBorder: 'border-orange-300', btnHover: 'hover:bg-orange-50' },
    dinner: { label: '저녁', emoji: '🌙', gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200', accent: 'text-violet-600', pill: 'bg-violet-100 text-violet-700', btnBorder: 'border-violet-300', btnHover: 'hover:bg-violet-50' },
    snack: { label: '간식', emoji: '🍩', gradient: 'from-pink-400 to-rose-500', light: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-600', pill: 'bg-pink-100 text-pink-700', btnBorder: 'border-pink-300', btnHover: 'hover:bg-pink-50' },
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

export default function Home() {
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedFoods, setSelectedFoods] = useState<number[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInitialSetupDone, setIsInitialSetupDone] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginId, setLoginId] = useState('');
    const [loginPw, setLoginPw] = useState('');
    const [loginError, setLoginError] = useState('');
    const [userInfo, setUserInfo] = useState({ name: '', gender: 'male', age: '', height: '', weight: '', job: '' });
    const [isSaved, setIsSaved] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const calcTargetCalories = () => {
        const weight = parseFloat(userInfo.weight);
        const height = parseFloat(userInfo.height);
        const age = parseFloat(userInfo.age);
        if (!weight || !height || !age) return 2000;
        const bmr = userInfo.gender === 'male'
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;
        const job = JOB_OPTIONS.find(j => j.value === userInfo.job);
        return Math.round(bmr * (job?.multiplier ?? 1.2));
    };
    const TARGET_CALORIES = calcTargetCalories();
    const TARGET = {
        carbs: Math.round(TARGET_CALORIES * 0.5 / 4),
        protein: Math.round(TARGET_CALORIES * 0.2 / 4),
        fat: Math.round(TARGET_CALORIES * 0.3 / 9),
        sodium: 2000,
    };
    const [mealsByDate, setMealsByDate] = useState({});

    const currentMeals = mealsByDate[selectedDate] ||
    {
        breakfast: { items: [], imgUrl: null },
        lunch: { items: [], imgUrl: null },
        dinner: { items: [], imgUrl: null },
        snack: { items: [], imgUrl: null },
    };
    const meals = currentMeals;

    const setMeals = (updater) => {
        setMealsByDate(prev => {
            const current = prev[selectedDate] || {
                breakfast: { items: [], imgUrl: null },
                lunch: { items: [], imgUrl: null },
                dinner: { items: [], imgUrl: null },
                snack: { items: [], imgUrl: null },
            };
            const updated = typeof updater === 'function' ? updater(current) : updater;
            return { ...prev, [selectedDate]: updated };
        });
    };

    const [mealModalType, setMealModalType] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchMealType, setSearchMealType] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFoodForDetail, setSelectedFoodForDetail] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
    const [isRecommendLoading, setIsRecommendLoading] = useState(false);
    const [recommendError, setRecommendError] = useState<string | null>(null);
    const [foodGrams, setFoodGrams] = useState(100);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);
    const [photoMealType, setPhotoMealType] = useState(null);
    const [modalPhotoUrl, setModalPhotoUrl] = useState(null);
    const [analysisStatus, setAnalysisStatus] = useState('idle');
    const fileInputRef = useRef(null);

    const [favorites, setFavorites] = useState<any[]>([]);
    const [graphPeriod, setGraphPeriod] = useState('daily');
    const allItems = [...meals.breakfast.items, ...meals.lunch.items, ...meals.dinner.items, ...meals.snack.items];
    const totalConsumed = calcTotals(allItems);
    const pct = Math.min(100, Math.round((totalConsumed.calories / TARGET_CALORIES) * 100));

    useEffect(() => {
        const controller = new AbortController();
        const hasMeal = meals.breakfast.items.length > 0 || meals.lunch.items.length > 0 || meals.dinner.items.length > 0;
        if (!hasMeal) { setAiRecommendations([]); setRecommendError(null); return; }
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
                const res = await fetch('http://localhost:5260/api/meals/recommend', {
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
                    const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
                    setAiRecommendations(Array.isArray(parsed) ? parsed : []);
                } else {
                    const errData = await res.json().catch(() => ({}));
                    setRecommendError(errData.message || `AI 추천 서비스 오류 (${res.status})`);
                    setAiRecommendations([]);
                }
            } catch (e: any) {
                if (e?.name !== 'AbortError') {
                    setRecommendError('네트워크 오류로 AI 추천을 불러올 수 없습니다.');
                    setAiRecommendations([]);
                }
            } finally {
                if (!controller.signal.aborted) setIsRecommendLoading(false);
            }
        };

        const timer = setTimeout(fetchRecommendations, 3000);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [meals.breakfast.items.length, meals.lunch.items.length, meals.dinner.items.length, selectedDate]);

    // ★ 수정 포인트 1: 잘못된 날짜값으로 인한 앱 크래시 방지 안전장치 추가
    const changeDate = (days) => {
        if (!selectedDate) return;
        const d = new Date(selectedDate);
        if (isNaN(d.getTime())) return;
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const closeLoginModal = () => { setIsLoginModalOpen(false); setLoginId(''); setLoginPw(''); setLoginError(''); };
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5260/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileID: loginId, profilePW: loginPw }),
            });
            if (res.ok) {
                const data = await res.json();
                setIsLoggedIn(true);
                setUserInfo(prev => ({ ...prev, name: data.name }));
                closeLoginModal();
            } else {
                setLoginError('아이디 또는 비밀번호가 틀렸습니다.');
            }
        } catch {
            setLoginError('서버 연결 실패');
        }
    };
    const handleInitialSetupSubmit = (e) => {
        e.preventDefault();
        if (!userInfo.job) { alert('직업을 선택해주세요.'); return; } setIsInitialSetupDone(true);
    };
    const handleSaveUser = (e) => {
        e.preventDefault(); setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };
    const handleLogout = () => { setIsLoggedIn(false); setIsInitialSetupDone(false); setMealModalType(null); };

    const openMealModal = (type) => setMealModalType(type);
    const closeMealModal = () => setMealModalType(null);

    const openSearch = (type) => { setSearchMealType(type); setSearchQuery(''); setSearchResults([]); setIsSearchOpen(true); setSelectedFoodForDetail(null); };
    const closeSearch = () => { setIsSearchOpen(false); setSearchMealType(null); setSelectedFoodForDetail(null); setSearchResults([]); };
    const handleSearchFood = async (query: string) => {
        if (!query.trim()) { setSearchResults([]); return; }
        setIsSearchLoading(true);
        try {
            const res = await fetch('http://localhost:5260/api/meals/search-food', {
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
    const handleSelectFoodItem = (food) => {
        setSelectedFoodForDetail(food);
        setFoodGrams(100);
    };
    const confirmAddFood = () => {
        if (!searchMealType || !selectedFoodForDetail) return;
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
        setMeals(prev => ({
            ...prev,
            [searchMealType]: {
                ...prev[searchMealType],
                items: [...prev[searchMealType].items, finalFood]
            }
        }));
        closeSearch();
        setTimeout(() => openMealModal(searchMealType), 80);
    };

    const handleRemoveFood = (type, idx) => {
        setMeals(prev => ({ ...prev, [type]: { ...prev[type], items: prev[type].items.filter((_, i) => i !== idx) } }));
    };

    const toggleFavorite = (food: any) => {
        setFavorites(prev =>
            prev.some(f => f.name === food.name)
                ? prev.filter(f => f.name !== food.name)
                : [...prev, food]
        );
    };
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
            const res = await fetch('http://localhost:5260/api/meals/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64,
                    profileId: 'admin',
                    mealType: photoMealType,
                    mealDate: selectedDate,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const foods = JSON.parse(data.result).foods;
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
        const newItems = (analysisResult as any[]).filter((_, idx) => selectedFoods.includes(idx)).map((food: any) => ({
            name: food.name,
            grams: 100,
            calories: food.calories,
            carbs: food.carbs,
            protein: food.protein,
            fat: food.fat,
            sodium: food.sodium || 0,
        }));
        setMeals(prev => ({ ...prev, [photoMealType]: { imgUrl: modalPhotoUrl, items: [...prev[photoMealType].items, ...newItems] } }));
        closePhoto();
        setTimeout(() => openMealModal(photoMealType), 80);
    };
    const removeImage = (type) => setMeals(prev => ({ ...prev, [type]: { ...prev[type], imgUrl: null } }));
    const getDayCalories = (dateStr: string) => {
        const day = mealsByDate[dateStr];
        if (!day) return 0;
        return ['breakfast', 'lunch', 'dinner', 'snack'].reduce((sum, type) =>
            sum + (day[type]?.items || []).reduce((s, item) => s + item.calories, 0), 0);
    };

    // ★ 수정 포인트 2: 잘못된 날짜값으로 인한 앱 크래시 방지 안전장치 추가
    const getDateStr = (offset: number) => {
        if (!selectedDate) return '';
        const d = new Date(selectedDate);
        if (isNaN(d.getTime())) return '';
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
    };

    const getGraphData = (period: string) => {
        switch (period) {
            case 'daily': {
                const b = meals.breakfast.items.reduce((a, c) => a + c.calories, 0);
                const l = meals.lunch.items.reduce((a, c) => a + c.calories, 0);
                const d = meals.dinner.items.reduce((a, c) => a + c.calories, 0);
                const s = meals.snack.items.reduce((a, c) => a + c.calories, 0);
                return {
                    labels: ['아침', '점심', '저녁', '간식'],
                    intake: [b, l, d, s],
                    target: Array(4).fill(TARGET_CALORIES / 4),
                };
            }
            case 'weekly': {
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                const labels = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 6 + i);
                    const day = d.getDay();
                    return `${dayNames[day]}요일\n(${d.getMonth() + 1}/${d.getDate()})`;
                });
                const intake = Array.from({ length: 7 }, (_, i) => getDayCalories(getDateStr(-6 + i)));
                return { labels, intake, target: Array(7).fill(TARGET_CALORIES) };
            }
            case 'monthly': {
                const labels = Array.from({ length: 4 }, (_, w) => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 27 + w * 7);
                    const month = d.getMonth() + 1;
                    const week = Math.ceil(d.getDate() / 7);
                    return `${month}월\n${week}주차`;
                });
                const intake = Array.from({ length: 4 }, (_, w) => {
                    const weekTotal = Array.from({ length: 7 }, (_, d) => getDayCalories(getDateStr(-27 + w * 7 + d)))
                        .reduce((a, b) => a + b, 0);
                    return Math.round(weekTotal / 7);
                });
                return {
                    labels,
                    intake,
                    target: Array(4).fill(TARGET_CALORIES),
                };
            }
            case 'yearly': {
                const intake = Array.from({ length: 4 }, (_, q) => {
                    const qTotal = Array.from({ length: 91 }, (_, d) => getDayCalories(getDateStr(-364 + q * 91 + d)))
                        .reduce((a, b) => a + b, 0);
                    return Math.round(qTotal / 91);
                });
                return {
                    labels: ['1분기', '2분기', '3분기', '4분기'],
                    intake,
                    target: Array(4).fill(TARGET_CALORIES),
                };
            }
            default:
                return { labels: [], intake: [], target: [] };
        }
    };

    const graphData = getGraphData(graphPeriod);
    const safeIntake = graphData.intake.map(v => (isNaN(v) || !isFinite(v)) ? 0 : v);
    const maxCal = 5000;

    const graphWidth = 420;
    const graphHeight = 130;
    const startX = 50;
    const endY = 150;
    const _n = graphData.labels.length;
    const points = _n < 2 ? [] : safeIntake.map((val, i) => ({ x: startX + (i / (_n - 1)) * graphWidth, y: endY - (val / maxCal) * graphHeight, val, label: graphData.labels[i] }));
    const targetPoints = _n < 2 ? [] : graphData.target.map((val, i) => ({ x: startX + (i / (_n - 1)) * graphWidth, y: endY - ((isNaN(val) ? 0 : val) / maxCal) * graphHeight }));
    const intakeLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const intakeAreaPath = points.length > 0 ? `${intakeLinePath} L ${points[points.length - 1].x} ${endY} L ${points[0].x} ${endY} Z` : '';
    const targetLinePath = targetPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center relative overflow-hidden font-sans">
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
            <div className="min-h-screen bg-slate-100 flex items-center justify-center relative overflow-hidden font-sans py-10 px-4">
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
                            {[{ key: 'age', label: '나이 (세)', ph: '예: 24' }, { key: 'height', label: '신장 (cm)', ph: '예: 175' }].map(({ key, label, ph }) => (
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
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative animate-fade-in overflow-hidden">

            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 pointer-events-none z-0" />

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen">

                <header className="bg-gradient-to-r from-orange-500 to-amber-500 shadow-md sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl drop-shadow-sm">👹</span>
                            <h1 className="text-xl font-extrabold tracking-tight text-white drop-shadow-sm">
                                먹깨비
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 border-l pl-4 border-orange-300/50">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-orange-600 font-black shadow-sm text-sm">
                                {userInfo.name ? userInfo.name.charAt(0) : '먹'}
                            </div>
                            <span className="text-sm font-semibold text-white hidden sm:inline">
                                {userInfo.name ? `${userInfo.name} 님` : '사용자 님'}
                            </span>
                            <button onClick={handleLogout} className="ml-2 text-xs font-bold text-orange-100 hover:text-white underline underline-offset-2 transition-colors">
                                로그아웃
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-6">

                            {/* 식사 기록 대시보드 및 달력 UI */}
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-100/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">📅 식사 기록 대시보드</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">날짜별로 데이터가 개별 관리됩니다. 자유롭게 날짜를 이동해 보세요.</p>
                                    </div>

                                    {/* ★ 수정 포인트 3: 읽기 전용으로 막아 크래시 방지 및 확실한 달력 팝업 기능 추가 */}
                                    <div className="flex items-center bg-white border border-slate-200 rounded-full shadow-sm p-1 flex-shrink-0">
                                        <button type="button" onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-orange-500 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                        </button>

                                        <div className="relative flex items-center justify-center px-4 cursor-pointer group">
                                            <span className="text-sm font-black text-slate-700 group-hover:text-orange-600 transition-colors whitespace-nowrap">
                                                {selectedDate ? (() => {
                                                    const parts = selectedDate.split('-');
                                                    return parts.length === 3 ? `${parts[0]}년 ${parts[1]}월 ${parts[2]}일` : selectedDate;
                                                })() : ''}
                                            </span>
                                            {/* 실제 input은 투명하게 겹쳐둠으로써 못생긴 달력 아이콘을 가리고 기능만 유지함 */}
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => {
                                                    if (e.target.value) setSelectedDate(e.target.value);
                                                }}
                                                onKeyDown={(e) => e.preventDefault()}
                                                onClick={(e) => {
                                                    if ('showPicker' in e.currentTarget) {
                                                        try { e.currentTarget.showPicker(); } catch (err) { }
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>

                                        <button type="button" onClick={() => changeDate(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-orange-500 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* 끼니 카드 영역 */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
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
                          ${mealItems.length > 0 ? `${cfg.light} ${cfg.border}` : 'bg-slate-50/80 border-slate-200 border-dashed hover:border-slate-300'}
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
                                                            <img src={meals[type].imgUrl as string} alt="" className="w-full h-full object-cover" />
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
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-100/50">
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
                                            <div key={key} className="flex flex-col items-center bg-slate-50/70 py-4 px-2 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-md transition-all">
                                                <span className="text-[10px] font-extrabold text-slate-500 mb-2 truncate w-full">{label}</span>
                                                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                        <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                        <path className={`${color} transition-all duration-1000`} strokeDasharray={`${nPct}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-xs sm:text-sm font-black text-slate-700">{current}{key === 'sodium' ? 'mg' : 'g'}</span>
                                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">/ {target}{key === 'sodium' ? 'mg' : 'g'}</span>
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
                                            <svg key={`${graphPeriod}-${safeIntake.join(',')}`} viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                                                <defs>
                                                    <linearGradient id="intakeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                                                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
                                                    </linearGradient>
                                                </defs>

                                                {graphPeriod === 'yearly' && (
                                                    <text x="250" y="15" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="900" opacity="0.8">
                                                        {new Date(selectedDate).getFullYear()}년
                                                    </text>
                                                )}

                                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                                    const val = Math.round(5000 * ratio); // maxCal 5000 고정
                                                    const y = endY - ratio * graphHeight;
                                                    return (
                                                        <g key={`y${i}`}>
                                                            <line x1="50" y1={y} x2="480" y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray={ratio === 0.75 ? "0" : "3 3"} opacity="0.5" />
                                                            <text x="42" y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="bold" opacity="0.7">{val}</text>
                                                        </g>
                                                    );
                                                })}
                                                {intakeAreaPath && <path d={intakeAreaPath} fill="url(#intakeAreaGrad)" />}
                                                {targetLinePath && <path d={targetLinePath} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 4" />}
                                                {intakeLinePath && <path d={intakeLinePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                                                {points.map((p) => {
                                                    const lines = p.label.split('\n');
                                                    return (
                                                        <g key={`pt-${p.label}`}>
                                                            <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="#f97316" strokeWidth="2.5" />
                                                            {p.val > 0 && (
                                                                <text x={p.x} y={p.y - 9} textAnchor="middle" fill="#ea580c" fontSize="10" fontWeight="bold">{p.val} kcal</text>
                                                            )}
                                                            {lines.map((line, lIdx) => (
                                                                <text key={lIdx} x={p.x} y={168 + lIdx * 12} textAnchor="middle" fill={lIdx === 0 ? "#64748b" : "#94a3b8"} fontSize={lIdx === 0 ? "11" : "9"} fontWeight="bold">
                                                                    {line}
                                                                </text>
                                                            ))}
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ════ 사이드바 영역 ════ */}
                        <div className="space-y-6 lg:sticky lg:top-24">
                            {/* 1. 신체 정보 & 진척도 컴포넌트 */}
                            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl shadow-sm border border-slate-100/50">
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
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 pl-0.5">직업</label>
                                        <div className="grid grid-cols-2 gap-1">
                                            {JOB_OPTIONS.map(job => (
                                                <button key={job.value} type="button" onClick={() => setUserInfo(prev => ({ ...prev, job: job.value }))}
                                                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold text-left transition-all ${userInfo.job === job.value ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                                    {job.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {isSaved && <div className="text-center text-[10px] font-bold text-green-600 bg-green-50 py-1.5 rounded-lg">✅ 정보 업데이트 완료!</div>}
                                    <button type="submit" className="w-full bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs hover:bg-slate-900 transition-all">내 정보 업데이트</button>
                                </form>
                            </div>

                            {/* 2. AI 맞춤 추천 - Gemini API 실시간 추천 */}
                            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl shadow-sm border border-slate-100/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xl">🤖</span>
                                    <h4 className="text-sm font-black text-slate-800">AI 맞춤 추천</h4>
                                </div>
                                {isRecommendLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                                        <p className="text-xs font-bold text-slate-400">AI가 맞춤 메뉴를 분석 중...</p>
                                    </div>
                                ) : recommendError ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                                        <span className="text-3xl">⚠️</span>
                                        <p className="text-xs font-bold text-red-500">AI 추천 일시 오류</p>
                                        <p className="text-[10px] text-slate-400 leading-snug break-keep">{recommendError}</p>
                                        <p className="text-[10px] text-slate-400">잠시 후 음식을 추가하면 재시도합니다.</p>
                                    </div>
                                ) : aiRecommendations.length > 0 ? (
                                    <div className="space-y-3">
                                        {aiRecommendations.map((menu, idx) => (
                                            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/80 hover:bg-white hover:border-orange-200 hover:shadow-md transition-all group">
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
                                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                        <span className="text-3xl mb-2">🍽️</span>
                                        <p className="text-xs font-bold text-center">아침, 점심, 저녁 중 하나를 입력하면<br />AI가 맞춤 메뉴를 추천해드려요.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </main>
            </div>

            {/* ════ 끼니 상세 기록 모달 ════ */}
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
                                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); handleSearchFood(e.target.value); }} placeholder="음식명을 입력하세요 (예: 마라탕, 치킨)" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white transition-all text-slate-800 font-bold" autoFocus />
                                <svg className="w-4 h-4 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>

                            {/* 즐겨찾기 섹션 - 검색어 없을 때 항상 표시 */}
                            {!searchQuery && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-extrabold text-amber-500 mb-2 flex items-center gap-1">
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
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
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
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
                                            name: food.makerName ? `[${food.makerName}] ${food.foodName}` : food.foodName,
                                            calories: food.calories,
                                            carbs: food.carbohydrate,
                                            protein: food.protein,
                                            fat: food.fat,
                                            sodium: food.sodium,
                                        };
                                        return (
                                            <div key={idx} className="flex items-center px-4 py-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all">
                                                {/* 음식 정보 클릭 → 용량 선택 */}
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelectFoodItem(foodObj)}>
                                                    {food.makerName && <span className="text-[10px] font-bold text-slate-400">{food.makerName} · </span>}
                                                    <span className="text-sm font-bold text-slate-700">{food.foodName}</span>
                                                    <span className="text-sm font-black text-orange-500 ml-2">{Math.round(food.calories)} kcal</span>
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
                                        {(analysisResult as any[]).map((food, idx) => (
                                            <div key={idx}
                                                onClick={() => setSelectedFoods(prev =>
                                                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                                                )}
                                                className={`rounded-xl p-3 border cursor-pointer transition-all ${selectedFoods.includes(idx) ? 'border-green-400 bg-green-50' : 'bg-white border-slate-100'
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
                                    <>
                                        <button onClick={() => setAnalysisStatus('idle')} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-xl text-sm hover:bg-slate-200 transition-colors">다시 분석하기</button>
                                        <button onClick={confirmPhoto} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-4 rounded-xl shadow-md text-sm hover:opacity-95 transition-all">식단 등록</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}