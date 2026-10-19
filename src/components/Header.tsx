import { ArrowLeft } from 'lucide-react';
import type React from 'react';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => {
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
      <h1 className="text-lg font-bold tracking-wide">音符识别视奏训练</h1>
      <div className="w-10" />
    </header>
  );
};
