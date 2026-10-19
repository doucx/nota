import { NAMING_TABLES } from '@/constants/notation';
import type { AccidentalMode, KeyFeedback, NamingScheme } from '@/types';
import type React from 'react';

interface KeyboardProps {
  naming: NamingScheme;
  accidentalMode: AccidentalMode;
  allowAccidentals: boolean;
  keyFeedback?: KeyFeedback | null;
  onPress: (pc: number) => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({
  naming,
  accidentalMode,
  allowAccidentals,
  keyFeedback,
  onPress,
}) => {
  const scheme = NAMING_TABLES[naming];
  const accList = accidentalMode === 'flat' ? scheme.flat : scheme.sharp;

  const getKeyAppearance = (pc: number, isBlack: boolean) => {
    const isCorrect = keyFeedback?.correctPc === pc;
    const isWrong = keyFeedback?.wrongPc === pc;

    if (isCorrect) {
      return {
        btnClass:
          'bg-emerald-500 text-white ring-4 ring-emerald-300 shadow-md scale-[0.98] transition-all',
        badgeClass: 'text-white bg-black/25',
      };
    }

    if (isWrong) {
      return {
        btnClass:
          'bg-rose-500 text-white ring-4 ring-rose-300 shadow-md scale-[0.98] transition-all',
        badgeClass: 'text-white bg-black/25',
      };
    }

    if (isBlack) {
      return {
        btnClass:
          'bg-slate-300 hover:bg-slate-400/80 active:bg-slate-400 active:scale-[0.98] text-slate-800 shadow-sm transition-all',
        badgeClass: 'text-slate-600 bg-white/60',
      };
    }

    return {
      btnClass:
        'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-[0.98] text-slate-900 shadow-sm transition-all',
      badgeClass: 'text-slate-500 bg-white/70',
    };
  };

  const blackKeys = [
    { pc: 1, key: 'E', label: accList[0] },
    { pc: 3, key: 'R', label: accList[1] },
    { pc: 6, key: 'Y', label: accList[2] },
    { pc: 8, key: 'U', label: accList[3] },
    { pc: 10, key: 'I', label: accList[4] },
  ];

  return (
    <div className="p-4 pb-8 flex flex-col items-center bg-white border-t border-slate-100">
      <div className="w-full max-w-2xl flex flex-col gap-2.5">
        {/* 半音黑键：er - #do~#re，空隙，yui - #fa~#la */}
        {allowAccidentals && (
          <div className="flex h-14 w-full">
            <div className="flex-[0.5]" />
            <div className="flex-[2] flex gap-2">
              {blackKeys.slice(0, 2).map((item) => {
                const { btnClass, badgeClass } = getKeyAppearance(item.pc, true);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onPress(item.pc)}
                    className={`flex-1 rounded-2xl font-bold flex flex-col items-center justify-center ${btnClass}`}
                  >
                    <span className="text-base">{item.label}</span>
                    <span
                      className={`text-[10px] font-semibold px-1 rounded mt-0.5 hidden sm:inline-block ${badgeClass}`}
                    >
                      {item.key}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 模拟键盘在 Mi/Fa 之间的空隙 */}
            <div className="flex-[1]" />

            <div className="flex-[3] flex gap-2">
              {blackKeys.slice(2, 5).map((item) => {
                const { btnClass, badgeClass } = getKeyAppearance(item.pc, true);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onPress(item.pc)}
                    className={`flex-1 rounded-2xl font-bold flex flex-col items-center justify-center ${btnClass}`}
                  >
                    <span className="text-base">{item.label}</span>
                    <span
                      className={`text-[10px] font-semibold px-1 rounded mt-0.5 hidden sm:inline-block ${badgeClass}`}
                    >
                      {item.key}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex-[0.5]" />
          </div>
        )}

        {/* 自然音白键 (sdf ghjk - do~ti) */}
        <div className="flex h-16 w-full gap-2">
          {[
            { pc: 0, key: 'S' },
            { pc: 2, key: 'D' },
            { pc: 4, key: 'F' },
            { pc: 5, key: 'G' },
            { pc: 7, key: 'H' },
            { pc: 9, key: 'J' },
            { pc: 11, key: 'K' },
          ].map((item, idx) => {
            const { btnClass, badgeClass } = getKeyAppearance(item.pc, false);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onPress(item.pc)}
                className={`flex-1 rounded-2xl font-bold flex flex-col items-center justify-center ${btnClass}`}
              >
                <span className="text-lg">{scheme.natural[idx]}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 rounded mt-0.5 hidden sm:inline-block ${badgeClass}`}
                >
                  {item.key}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
