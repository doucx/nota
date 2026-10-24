import { ArrowLeft, Sliders } from 'lucide-react';
import type React from 'react';

interface HeaderProps {
  onBack?: () => void;
  onSandbox?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onBack, onSandbox, title }) => {
  return (
    <header className="h-14 bg-brand-blue text-white px-6 flex items-center justify-between shadow-sm">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          title="返回主页"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      ) : (
        <div className="w-10" />
      )}
      <h1 className="text-lg font-bold tracking-wide">{title ?? '音符识别视奏训练'}</h1>
      {onSandbox ? (
        <button
          type="button"
          onClick={onSandbox}
          title="沙盒调试配置"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none"
        >
          <Sliders className="w-5 h-5" />
        </button>
      ) : (
        <div className="w-10" />
      )}
    </header>
  );
};
