import type React from 'react';

interface SummaryModalProps {
  isOpen: boolean;
  score: number;
  attempts: number;
  onRestart: () => void;
  onGoHome?: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  score,
  attempts,
  onRestart,
  onGoHome,
}) => {
  if (!isOpen) return null;

  const accNum = attempts > 0 ? Math.round((score / attempts) * 100) : 100;
  const points = Math.round(score * (accNum / 100) * 100);

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      <header className="h-14 bg-brand-blue text-white px-6 flex items-center justify-center">
        <h2 className="text-lg font-bold">训练结算</h2>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        <div className="w-full flex justify-between text-xl font-medium mb-3">
          <span className="text-slate-500">得分 (Score)</span>
          <span className="font-bold text-slate-800">{score}</span>
        </div>
        <div className="w-full flex justify-between text-xl font-medium mb-3">
          <span className="text-slate-500">准确率 (Accuracy)</span>
          <span className="font-bold text-slate-800">{accNum}%</span>
        </div>
        <div className="w-full flex justify-between text-xl font-medium mb-3">
          <span className="text-slate-500">积分 (Points)</span>
          <span className="font-bold text-slate-800">{points}</span>
        </div>

        <p className="text-xs text-slate-400 mt-2 mb-6">
          综合得分计算方式为：答对题数乘以准确率百分比。
        </p>

        <div className="w-full h-40 mb-8">
          <svg className="w-full h-full" viewBox="0 0 300 150">
            <title>练习得分走势图</title>
            <line x1="0" y1="30" x2="300" y2="30" stroke="#f1f5f9" strokeWidth="1.5" />
            <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeWidth="1.5" />
            <line x1="0" y1="130" x2="300" y2="130" stroke="#f1f5f9" strokeWidth="1.5" />
            <path
              d="M 20,130 Q 70,20 120,60 T 220,40 T 280,70"
              fill="none"
              stroke="#ff5252"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            再练一次
          </button>
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-8 rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              返回主页
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
