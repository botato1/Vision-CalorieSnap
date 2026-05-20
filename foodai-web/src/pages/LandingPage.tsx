import type { FormEvent, MouseEvent } from 'react';
import LoginModal from '../components/LoginModal';

type LandingPageProps = {
  isLoginModalOpen: boolean;
  loginId: string;
  loginPw: string;
  loginError: string;
  onOpenLogin: () => void;
  onCloseLogin: () => void;
  onLoginIdChange: (value: string) => void;
  onLoginPwChange: (value: string) => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGoToRegister: (event: MouseEvent<HTMLButtonElement>) => void;
};

export default function LandingPage({
  isLoginModalOpen,
  loginId,
  loginPw,
  loginError,
  onOpenLogin,
  onCloseLogin,
  onLoginIdChange,
  onLoginPwChange,
  onLoginSubmit,
  onGoToRegister,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      <div className="relative z-10 flex flex-col items-center text-center p-6">
        <div className="text-[120px] leading-none mb-6 drop-shadow-xl">👹</div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent pb-2">먹깨비</h1>
        <p className="text-lg text-slate-500 font-bold mb-12">AI 기반 배달음식 영양 관리 시스템</p>
        <button onClick={onOpenLogin} className="group px-10 py-5 font-bold text-white text-xl rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-xl shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300">
          먹깨비 시작하기
          <svg className="inline-block w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
      {isLoginModalOpen && (
        <LoginModal
          loginId={loginId}
          loginPw={loginPw}
          loginError={loginError}
          onLoginIdChange={onLoginIdChange}
          onLoginPwChange={onLoginPwChange}
          onSubmit={onLoginSubmit}
          onRegister={onGoToRegister}
          onClose={onCloseLogin}
        />
      )}
    </div>
  );
}
