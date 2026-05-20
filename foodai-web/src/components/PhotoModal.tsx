import type { ChangeEvent, RefObject } from 'react';
import type { AnalysisStatus, FoodItem } from '../types';

type PhotoModalProps = {
  modalPhotoUrl: string | null;
  analysisStatus: AnalysisStatus;
  analysisResult: FoodItem[] | null;
  selectedFoods: number[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onImageSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onStartAnalysis: () => void;
  onConfirm: () => void;
  onResetAnalysis: () => void;
  onToggleFoodSelection: (index: number) => void;
};

export default function PhotoModal({
  modalPhotoUrl,
  analysisStatus,
  analysisResult,
  selectedFoods,
  fileInputRef,
  onClose,
  onImageSelect,
  onStartAnalysis,
  onConfirm,
  onResetAnalysis,
  onToggleFoodSelection,
}: PhotoModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5 text-white"><span className="text-xl">📸</span><h3 className="text-lg font-black">AI 사진 영양 분석</h3></div>
          <button onClick={onClose} className="text-orange-100 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-7">
          <div className="relative border-4 border-dashed border-slate-200 rounded-3xl h-52 flex flex-col items-center justify-center bg-slate-50 overflow-hidden group mb-6 hover:border-orange-300 transition-colors cursor-pointer" onClick={!modalPhotoUrl ? () => fileInputRef.current?.click() : undefined}>
            {modalPhotoUrl ? (
              <>
                <img src={modalPhotoUrl} alt="분석 대상 식단 사진" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white/90 text-slate-700 text-xs font-bold px-4 py-2 rounded-full shadow-md">사진 변경</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <svg className="w-12 h-12 text-slate-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm font-bold text-slate-500">배달 음식 사진 업로드</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={onImageSelect} />
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 shadow-inner min-h-[110px] flex items-center justify-center">
            {analysisStatus === 'idle' && <div className="text-center text-slate-400"><p className="text-xs font-medium">사진을 등록한 후 분석 시작 버튼을 누르세요.</p></div>}
            {analysisStatus === 'analyzing' && <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3" /><p className="text-xs font-bold text-orange-600">AI 푸드 렌즈 가동 중...</p></div>}
            {analysisStatus === 'done' && analysisResult && (
              <div className="w-full space-y-2">
                <h4 className="text-sm font-black text-slate-800 mb-2">분석 완료 ✅</h4>
                {analysisResult.map((food, idx) => (
                  <div key={`${food.name}-${idx}`} onClick={() => onToggleFoodSelection(idx)} className={`rounded-xl p-3 border cursor-pointer transition-all ${selectedFoods.includes(idx) ? 'border-green-400 bg-green-50' : 'bg-white border-slate-100'}`}>
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
              <button onClick={onStartAnalysis} disabled={!modalPhotoUrl || analysisStatus === 'analyzing'} className="col-span-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 rounded-xl shadow-md text-sm hover:opacity-95 transition-all disabled:opacity-50">분석 시작</button>
            ) : (
              <>
                <button onClick={onResetAnalysis} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-xl text-sm hover:bg-slate-200 transition-colors">다시 분석하기</button>
                <button onClick={onConfirm} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-4 rounded-xl shadow-md text-sm hover:opacity-95 transition-all">식단 등록</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
