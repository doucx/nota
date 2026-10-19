import { CLEF_RANGE_DEFINITIONS, DEFAULT_CLEF_RANGES } from '@/constants/clefs';
import type { ClefType, NamingScheme, TrainerOptions } from '@/types';
import { formatStep } from '@/utils/pitch';
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

  const currentRanges = options.ranges ?? DEFAULT_CLEF_RANGES;

  const handleRangeChange = (clef: ClefType, min: number, max: number) => {
    onChangeOptions({
      ...options,
      ranges: {
        ...currentRanges,
        [clef]: [min, max],
      },
    });
  };

  /**
   * 单轨道双圆点滑块：在同一根轨道上呈现两个圆，两圆之间高亮填充
   */
  const renderDoubleSlider = (
    clef: ClefType,
    minStep: number,
    maxStep: number,
    limitMin: number,
    limitMax: number,
    disabled: boolean,
  ) => {
    const total = limitMax - limitMin;
    const leftPercent = total > 0 ? ((minStep - limitMin) / total) * 100 : 0;
    const rightPercent = total > 0 ? ((maxStep - limitMin) / total) * 100 : 100;
    const widthPercent = Math.max(0, rightPercent - leftPercent);

    return (
      <div
        className={`relative w-full h-8 flex items-center select-none ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        {/* 背景灰底轨道 */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-slate-200 rounded-lg pointer-events-none" />

        {/* 双圆之间的高亮轨道 (零动画延迟，百分百实时跟手) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 bg-brand-blue rounded-lg pointer-events-none"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
          }}
        />

        {/* 左圆滑块 (最低音) */}
        <input
          type="range"
          min={limitMin}
          max={limitMax}
          step={1}
          value={minStep}
          aria-label="最低音"
          onChange={(e) => {
            const val = Math.min(Number(e.target.value), maxStep);
            handleRangeChange(clef, val, maxStep);
          }}
          className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-5 appearance-none bg-transparent pointer-events-none m-0 z-20 outline-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-brand-blue
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-brand-blue
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* 右圆滑块 (最高音) */}
        <input
          type="range"
          min={limitMin}
          max={limitMax}
          step={1}
          value={maxStep}
          aria-label="最高音"
          onChange={(e) => {
            const val = Math.max(Number(e.target.value), minStep);
            handleRangeChange(clef, minStep, val);
          }}
          className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-5 appearance-none bg-transparent pointer-events-none m-0 z-20 outline-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-brand-blue
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-brand-blue
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    );
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
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">谱号选择</h3>
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

        {/* 音域范围设置 (Set Range) */}
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 pb-2 mb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">音域范围设置 (Set Range)</h3>
            <span className="text-xs text-slate-400">滑动调节最低与最高音</span>
          </div>

          <div className="flex flex-col gap-4">
            {(['treble', 'bass', 'alto'] as ClefType[]).map((clef) => {
              const def = CLEF_RANGE_DEFINITIONS[clef];
              const range = currentRanges[clef] ?? def.defaultRange;
              const [minStep, maxStep] = range;
              const [limitMin, limitMax] = def.limit;
              const isEnabled = options.clefs.includes(clef);

              return (
                <div
                  key={clef}
                  className={`bg-white p-4 rounded-xl border transition-all ${
                    isEnabled ? 'border-slate-300 shadow-sm' : 'border-slate-200 opacity-55'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      {def.label}
                      {!isEnabled && (
                        <span className="text-[11px] font-normal text-slate-400">(未启用)</span>
                      )}
                    </span>
                    <span className="font-bold text-sm text-brand-blue font-mono bg-brand-blue/10 px-2 py-0.5 rounded">
                      {formatStep(minStep, options.naming)} ～ {formatStep(maxStep, options.naming)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-11 text-xs font-mono font-bold text-slate-700 text-left shrink-0">
                      {formatStep(minStep, options.naming)}
                    </span>
                    <div className="flex-1 px-1">
                      {renderDoubleSlider(clef, minStep, maxStep, limitMin, limitMax, !isEnabled)}
                    </div>
                    <span className="w-11 text-xs font-mono font-bold text-slate-700 text-right shrink-0">
                      {formatStep(maxStep, options.naming)}
                    </span>
                  </div>
                </div>
              );
            })}
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

            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">出错等待时长</span>
                <span className="text-xs font-bold text-brand-blue font-mono">
                  {options.errorDelay ?? 500} ms
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2000}
                step={100}
                value={options.errorDelay ?? 500}
                onChange={(e) =>
                  onChangeOptions({ ...options, errorDelay: Number(e.target.value) })
                }
                className="w-full accent-brand-blue cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0ms (即时切换)</span>
                <span>1000ms</span>
                <span>2000ms</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
