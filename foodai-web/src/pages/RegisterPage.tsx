import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { JOB_OPTIONS } from '../constants';
import type { Gender, UserInfo } from '../types';

type RegisterPageProps = {
  registerId: string;
  registerPw: string;
  registerError: string;
  userInfo: UserInfo;
  onRegisterIdChange: (value: string) => void;
  onRegisterPwChange: (value: string) => void;
  setUserInfo: Dispatch<SetStateAction<UserInfo>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

export default function RegisterPage({
  registerId,
  registerPw,
  registerError,
  userInfo,
  onRegisterIdChange,
  onRegisterPwChange,
  setUserInfo,
  onSubmit,
  onBack,
}: RegisterPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans py-10 px-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 p-8 text-center">
        <span className="text-5xl block mb-4">📝</span>
        <h3 className="text-2xl font-black text-slate-800 mb-2">회원가입</h3>
        <p className="text-xs text-slate-400 font-medium mb-8">계정 정보와 신체 정보를 입력해 주세요.</p>
        <form onSubmit={onSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">아이디</label>
            <input type="text" value={registerId} onChange={(e) => onRegisterIdChange(e.target.value)} placeholder="사용할 아이디" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required autoFocus />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">비밀번호</label>
            <input type="password" value={registerPw} onChange={(e) => onRegisterPwChange(e.target.value)} placeholder="4자 이상 비밀번호" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required minLength={4} />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">이름</label>
            <input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} placeholder="예: 홍길동" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">성별</label>
            <div className="flex gap-2">
              {(['male', 'female'] as Gender[]).map((gender) => (
                <button key={gender} type="button" onClick={() => setUserInfo({ ...userInfo, gender })} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${userInfo.gender === gender ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}>
                  {gender === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([{ key: 'age', label: '나이 (세)', ph: '예: 24' }, { key: 'height', label: '신장 (cm)', ph: '예: 175' }] as Array<{ key: 'age' | 'height'; label: string; ph: string }>).map(({ key, label, ph }) => (
              <div key={key}>
                <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">{label}</label>
                <input type="number" value={userInfo[key]} onChange={(e) => setUserInfo({ ...userInfo, [key]: e.target.value })} placeholder={ph} className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">체중 (kg)</label>
            <input type="number" value={userInfo.weight} onChange={(e) => setUserInfo({ ...userInfo, weight: e.target.value })} placeholder="예: 70" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-black mb-2 pl-1">직업 / 활동 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {JOB_OPTIONS.map((job) => (
                <button key={job.value} type="button" onClick={() => setUserInfo({ ...userInfo, job: job.value })} className={`flex flex-col items-start px-3 py-3 rounded-xl border text-left transition-all ${userInfo.job === job.value ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <span className={`text-sm font-bold ${userInfo.job === job.value ? 'text-orange-600' : 'text-slate-700'}`}>{job.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{job.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {registerError && <div className="text-xs font-bold text-red-500 bg-red-50 py-2 rounded-lg text-center">{registerError}</div>}
          <div className="pt-2">
            <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-xl shadow-md text-base hover:opacity-95 transition-all">저장하고 시작하기</button>
            <button type="button" onClick={onBack} className="w-full mt-3 text-slate-400 font-bold text-sm py-2 hover:text-slate-600">처음으로 돌아가기</button>
          </div>
        </form>
      </div>
    </div>
  );
}
