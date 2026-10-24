import type React from 'react';

interface SummaryModalProps {
  isOpen: boolean;
  correct: number;
  attempts: number;
  onRestart: () => void;
  onGoHome?: () => void;
  onOpenProfile?: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  correct,
  attempts,
  onRestart,
  onGoHome,
  onOpenProfile,
}) => {
  if (!isOpen) return null;

  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      <header className="h-14 bg-brand-blue text-white px-6 flex items-center justify-center">
        <h2 className="text-lg font-bold">本轮训练结束</h2>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        <div className="w-full flex justify-between text-xl font-medium mb-3">
          <span className="text-slate-500">本轮作答</span>
          <span className="font-bold text-slate-800">{attempts} 题</span>
        </div>
        <div className="w-full flex justify-between text-xl font-medium mb-3">
          <span className="text-slate-500">答对</span>
          <span className="font-bold text-emerald-600">{correct} 题</span>
        </div>
        <div className="w-full flex justify-between text-xl font-medium mb-3">
          <span className="text-slate-500">本轮准确率</span>
          <span className="font-bold text-slate-800">{accuracy}%</span>
        </div>

        <p className="text-xs text-slate-400 mt-2 mb-8">
          本轮快照仅反映本次练习。跨设置的长期趋势请前往「训练档案」查看各音符的反应速度与掌握状态。
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            再练一次
          </button>
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3.5 px-8 rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              训练档案
            </button>
          )}
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
