import { BarChart3, Bug, Play, Settings } from 'lucide-react';
import type React from 'react';

interface StartScreenProps {
  onStart: () => void;
  onOpenOptions: () => void;
  onOpenProfile: () => void;
  onStartSandbox: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onOpenOptions,
  onOpenProfile,
  onStartSandbox,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="w-20 h-20 rounded-3xl bg-brand-blue/10 text-brand-blue flex items-center justify-center text-4xl mb-6 shadow-inner">
        🎵
      </div>
      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
        音符识别视奏训练
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-10">
        提升五线谱读谱反应速度，支持多种谱号、音名唱名系统与半音阶练习。
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          type="button"
          onClick={onStart}
          className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue/90 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand-blue/25 transition-all text-base"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>开始训练</span>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 font-semibold py-3 px-6 rounded-2xl transition-all text-sm"
        >
          <BarChart3 className="w-4 h-4" />
          <span>训练档案</span>
        </button>

        <button
          type="button"
          onClick={onOpenOptions}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-2xl transition-all text-sm"
        >
          <Settings className="w-4 h-4" />
          <span>训练设置</span>
        </button>

        <button
          type="button"
          onClick={onStartSandbox}
          className="flex items-center justify-center gap-2 bg-violet-50 hover:bg-violet-100 active:bg-violet-200 text-violet-700 font-semibold py-3 px-6 rounded-2xl transition-all text-sm"
        >
          <Bug className="w-4 h-4" />
          <span>调试沙盒</span>
        </button>
      </div>
    </div>
  );
};
