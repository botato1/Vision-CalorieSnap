import type { FormEvent, MouseEvent } from 'react';

type LoginModalProps = {
  loginId: string;
  loginPw: string;
  loginError: string;
  onLoginIdChange: (value: string) => void;
  onLoginPwChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRegister: (event: MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
};

export default function LoginModal({
  loginId,
  loginPw,
  loginError,
  onLoginIdChange,
  onLoginPwChange,
  onSubmit,
  onRegister,
  onClose,
}: LoginModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100">
        <div className="px-8 py-8 text-center">
          <span className="text-5xl block mb-4">🔐</span>
          <h3 className="text-2xl font-black text-slate-800 mb-2">로그인</h3>
          <p className="text-xs text-slate-400 font-medium mb-8">테스트: 아이디 123 / 비밀번호 123</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">아이디</label>
              <input type="text" value={loginId} onChange={(e) => onLoginIdChange(e.target.value)} placeholder="아이디를 입력하세요" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" autoFocus />
            </div>
            <div className="text-left">
              <label className="block text-xs font-extrabold text-black mb-1.5 pl-1">비밀번호</label>
              <input type="password" value={loginPw} onChange={(e) => onLoginPwChange(e.target.value)} placeholder="비밀번호를 입력하세요" className="w-full text-black bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" />
            </div>
            {loginError && <div className="text-xs font-bold text-red-500 bg-red-50 py-2 rounded-lg">{loginError}</div>}
            <div className="pt-4">
              <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-xl text-base hover:bg-slate-900 transition-all">로그인</button>
              <button type="button" onClick={onRegister} className="w-full mt-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-xl text-base hover:opacity-95 transition-all">회원가입</button>
              <button type="button" onClick={onClose} className="w-full mt-3 text-slate-400 font-bold text-sm py-2 hover:text-slate-600">취소</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
