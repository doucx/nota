import type { ClefType, NamingScheme, TrainerOptions } from '@/types';
import { ArrowLeft } from 'lucide-react';
import type React from 'react';

interface OptionsModalProps {
  isOpen: boolean;
  options: TrainerOptions;
  onChangeOptions: (opts: TrainerOptions) => void;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  options,
  onChangeOptions,
  onClose,
}) => {
  if (!isOpen) return null;

  const toggleClef = (clef: ClefType) => {
    let nextClefs = options.clefs.includes(clef)
      ? options.clefs.filter((c) => c !== clef)
      : [...options.clefs, clef];
    if (nextClefs.length === 0) nextClefs = ['treble'];
    onChangeOptions({ ...options, clefs: nextClefs });
  };

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
        <h2 className="text-lg font-bold">选项设置</h2>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-xl w-full mx-auto flex flex-col gap-6">
        {/* 谱号选择 */}
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">
            谱号与音域选择
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { id: 'treble', label: '高音谱表 (Treble)' },
              { id: 'bass', label: '低音谱表 (Bass)' },
              { id: 'alto', label: '中音谱表 (Alto)' },
            ].map((item) => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.clefs.includes(item.id as ClefType)}
                  onChange={() => toggleClef(item.id as ClefType)}
                  className="w-5 h-5 accent-brand-blue cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 练习时长 */}
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">训练时长</h3>
          <div className="flex flex-col gap-3">
            {[
              { val: 60, label: '1 分钟' },
              { val: 300, label: '5 分钟' },
              { val: 600, label: '10 分钟' },
              { val: 0, label: '∞ (不限时)' },
            ].map((item) => (
              <label key={item.val} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={item.val}
                  checked={options.duration === item.val}
                  onChange={() => onChangeOptions({ ...options, duration: item.val })}
                  className="w-5 h-5 accent-brand-blue cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 记谱偏好 */}
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">
            音名与唱名偏好
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { val: 'letters', label: '音名 (C, D, E, F, G, A, B)' },
              { val: 'german', label: '德式音名 (C, D, E, F, G, A, H)' },
              { val: 'solfege-si', label: '固定/首调唱名 - Si (Do, Re, Mi, Fa, Sol, La, Si)' },
              { val: 'solfege-ti', label: '固定/首调唱名 - Ti (Do, Re, Mi, Fa, Sol, La, Ti)' },
            ].map((item) => (
              <label key={item.val} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="naming"
                  value={item.val}
                  checked={options.naming === item.val}
                  onChange={() => onChangeOptions({ ...options, naming: item.val as NamingScheme })}
                  className="w-5 h-5 accent-brand-blue cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 开关选项 */}
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">
            其他高级选项
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  纯黑键模式 (Black Keys Only)
                </div>
                <div className="text-xs text-slate-400">仅出升/降半音，强化黑键识别</div>
              </div>
              <input
                type="checkbox"
                checked={options.accidentalsOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onChangeOptions({
                    ...options,
                    accidentalsOnly: checked,
                    allowAccidentals: checked ? true : options.allowAccidentals,
                  });
                }}
                className="w-5 h-5 accent-brand-blue cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                包含升降半音 (Sharp / Flat)
              </span>
              <input
                type="checkbox"
                disabled={options.accidentalsOnly}
                checked={options.allowAccidentals}
                onChange={(e) =>
                  onChangeOptions({ ...options, allowAccidentals: e.target.checked })
                }
                className="w-5 h-5 accent-brand-blue cursor-pointer disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">播放钢琴音效 (Sound)</span>
              <input
                type="checkbox"
                checked={options.sound}
                onChange={(e) => onChangeOptions({ ...options, sound: e.target.checked })}
                className="w-5 h-5 accent-brand-blue cursor-pointer"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
