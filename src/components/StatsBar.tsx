import type React from 'react';

interface StatsBarProps {
  timeLeft: number;
  duration: number;
  score: number;
  attempts: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ timeLeft, duration, score, attempts }) => {
  const formatTime = () => {
    if (duration === 0) return '∞';
    const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const accuracy = attempts > 0 ? `${Math.round((score / attempts) * 100)}%` : '-';

  return (
    <div className="flex justify-around max-w-xl mx-auto w-full pt-4 pb-1 text-center">
      <div>
        <div className="text-xs font-medium text-slate-400 mb-0.5">时间</div>
        <div className="text-2xl font-bold text-slate-800 font-mono">{formatTime()}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-400 mb-0.5">得分</div>
        <div className="text-2xl font-bold text-slate-800 font-mono">{score}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-400 mb-0.5">准确率</div>
        <div className="text-2xl font-bold text-slate-800 font-mono">{accuracy}</div>
      </div>
    </div>
  );
};
