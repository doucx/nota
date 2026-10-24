import { CLEF_RANGE_DEFINITIONS } from '@/constants/clefs';
import type { ClefType, SandboxNoteSpec } from '@/types';
import { formatStep } from '@/utils/pitch';
import { ArrowLeft, Shuffle } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface SandboxModalProps {
  isOpen: boolean;
  pinnedNote: SandboxNoteSpec | null;
  onChange: (note: SandboxNoteSpec | null) => void;
  onClose: () => void;
}

const CLEF_LABELS: Record<ClefType, string> = {
  treble: '高音谱表',
  alto: '中音谱表',
  bass: '低音谱表',
};

const ACCIDENTAL_OPTIONS: { value: '♯' | '♭' | null; label: string }[] = [
  { value: null, label: '♮ 自然' },
  { value: '♯', label: '♯ 升' },
  { value: '♭', label: '♭ 降' },
];

export const SandboxModal: React.FC<SandboxModalProps> = ({
  isOpen,
  pinnedNote,
  onChange,
  onClose,
}) => {
  const [clef, setClef] = useState<ClefType>('treble');
  const [step, setStep] = useState<number>(0);
  const [accidental, setAccidental] = useState<'♯' | '♭' | null>(null);

  useEffect(() => {
    if (isOpen && pinnedNote) {
      setClef(pinnedNote.clef);
      setStep(pinnedNote.step);
      setAccidental(pinnedNote.accidental);
    }
  }, [isOpen, pinnedNote]);

  if (!isOpen) return null;

  const def = CLEF_RANGE_DEFINITIONS[clef];
  const [sliderMin, sliderMax] = def.limit;

  const handleClef = (next: ClefType) => {
    setClef(next);
    const nextDef = CLEF_RANGE_DEFINITIONS[next];
    const [nextMin, nextMax] = nextDef.limit;
    if (step < nextMin || step > nextMax) {
      const [dMin, dMax] = nextDef.defaultRange;
      setStep(Math.round((dMin + dMax) / 2));
    }
  };

  const handleApply = () => {
    onChange({ clef, step, accidental });
    onClose();
  };

  const handleRandom = () => {
    onChange(null);
    onClose();
  };

  const previewName = formatStep(step, 'letters');
  const previewAccidental = accidental ? ` (${accidental})` : '';

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      <header className="h-14 bg-brand-blue text-white px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          title="返回"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">沙盒调试</h2>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-xl w-full mx-auto flex flex-col gap-6">
        <p className="text-xs text-slate-400 leading-relaxed">
          沙盒模式不会向本地数据库写入任何统计数据，也不会记录本次练习会话。可在此固定题目答案以便逐音检查。
        </p>

        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">目标谱号</h3>
          <div className="flex gap-2">
            {(['treble', 'alto', 'bass'] as ClefType[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleClef(item)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  clef === item
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {CLEF_LABELS[item]}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 pb-2 mb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">目标音级</h3>
            <span className="text-xs font-bold text-brand-blue font-mono bg-brand-blue/10 px-2 py-0.5 rounded">
              {previewName}
              {previewAccidental}
            </span>
          </div>
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={1}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-full accent-brand-blue cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>{formatStep(sliderMin, 'letters')}</span>
            <span>{formatStep(sliderMax, 'letters')}</span>
          </div>
        </section>

        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">升降记号</h3>
          <div className="flex gap-2">
            {ACCIDENTAL_OPTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setAccidental(item.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  accidental === item.value
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRandom}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            <span>随机出题</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 rounded-2xl transition-colors"
          >
            应用固定答案
          </button>
        </div>
      </div>
    </div>
  );
};
