import { NAMING_TABLES } from '@/constants/notation';
import type { AccidentalMode, NamingScheme } from '@/types';
import type React from 'react';

interface KeyboardProps {
  naming: NamingScheme;
  accidentalMode: AccidentalMode;
  allowAccidentals: boolean;
  onPress: (pc: number) => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({
  naming,
  accidentalMode,
  allowAccidentals,
  onPress,
}) => {
  const scheme = NAMING_TABLES[naming];
  const accList = accidentalMode === 'flat' ? scheme.flat : scheme.sharp;

  return (
    <div className="p-4 pb-8 flex flex-col items-center bg-white border-t border-slate-100">
      <div className="w-full max-w-2xl flex flex-col gap-2.5">
        {/* 半音黑键：er - #do~#re，空隙，yui - #fa~#la */}
        {allowAccidentals && (
          <div className="flex h-14 w-full">
            <div className="flex-[0.5]" />
            <div className="flex-[2] flex gap-2">
              <button
                type="button"
                onClick={() => onPress(1)}
                className="flex-1 bg-slate-300 hover:bg-slate-400/80 active:bg-slate-400 active:scale-[0.98] text-slate-800 rounded-2xl font-bold flex flex-col items-center justify-center shadow-sm transition-all"
              >
                <span className="text-base">{accList[0]}</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-white/60 px-1 rounded mt-0.5">
                  E
                </span>
              </button>
              <button
                type="button"
                onClick={() => onPress(3)}
                className="flex-1 bg-slate-300 hover:bg-slate-400/80 active:bg-slate-400 active:scale-[0.98] text-slate-800 rounded-2xl font-bold flex flex-col items-center justify-center shadow-sm transition-all"
              >
                <span className="text-base">{accList[1]}</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-white/60 px-1 rounded mt-0.5">
                  R
                </span>
              </button>
            </div>

            {/* 模拟键盘在 Mi/Fa 之间的空隙 */}
            <div className="flex-[1]" />

            <div className="flex-[3] flex gap-2">
              <button
                type="button"
                onClick={() => onPress(6)}
                className="flex-1 bg-slate-300 hover:bg-slate-400/80 active:bg-slate-400 active:scale-[0.98] text-slate-800 rounded-2xl font-bold flex flex-col items-center justify-center shadow-sm transition-all"
              >
                <span className="text-base">{accList[2]}</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-white/60 px-1 rounded mt-0.5">
                  Y
                </span>
              </button>
              <button
                type="button"
                onClick={() => onPress(8)}
                className="flex-1 bg-slate-300 hover:bg-slate-400/80 active:bg-slate-400 active:scale-[0.98] text-slate-800 rounded-2xl font-bold flex flex-col items-center justify-center shadow-sm transition-all"
              >
                <span className="text-base">{accList[3]}</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-white/60 px-1 rounded mt-0.5">
                  U
                </span>
              </button>
              <button
                type="button"
                onClick={() => onPress(10)}
                className="flex-1 bg-slate-300 hover:bg-slate-400/80 active:bg-slate-400 active:scale-[0.98] text-slate-800 rounded-2xl font-bold flex flex-col items-center justify-center shadow-sm transition-all"
              >
                <span className="text-base">{accList[4]}</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-white/60 px-1 rounded mt-0.5">
                  I
                </span>
              </button>
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
          ].map((item, idx) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onPress(item.pc)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-[0.98] text-slate-900 rounded-2xl font-bold flex flex-col items-center justify-center shadow-sm transition-all"
            >
              <span className="text-lg">{scheme.natural[idx]}</span>
              <span className="text-[10px] font-semibold text-slate-500 bg-white/70 px-1.5 rounded mt-0.5">
                {item.key}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
