import type React from 'react';

interface StatsBarProps {
  timeLeft: number;
  duration: number;
  correct: number;
  wrong: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ timeLeft, duration, correct, wrong }) => {
  const formatTime = () => {
    if (duration === 0) return '∞';
    const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex justify-around max-w-xl mx-auto w-full pt-4 pb-1 text-center">
      <div>
        <div className="text-xs font-medium text-slate-400 mb-0.5">时间</div>
        <div className="text-2xl font-bold text-slate-800 font-mono">{formatTime()}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-400 mb-0.5">本轮正确</div>
        <div className="text-2xl font-bold text-emerald-600 font-mono">{correct}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-400 mb-0.5">本轮失误</div>
        <div className="text-2xl font-bold text-rose-500 font-mono">{wrong}</div>
      </div>
    </div>
  );
};
