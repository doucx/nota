import { CLEF_RANGE_DEFINITIONS, DEFAULT_CLEF_RANGES } from '@/constants/clefs';
import type { ClefType, NamingScheme, TrainerOptions } from '@/types';
import { formatStep } from '@/utils/pitch';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface DoubleRangeSliderProps {
  minStep: number;
  maxStep: number;
  limitMin: number;
  limitMax: number;
  disabled?: boolean;
  onChange: (min: number, max: number) => void;
}

const DoubleRangeSlider: React.FC<DoubleRangeSliderProps> = ({
  minStep,
  maxStep,
  limitMin,
  limitMax,
  disabled = false,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const minThumbRef = useRef<HTMLButtonElement>(null);
  const maxThumbRef = useRef<HTMLButtonElement>(null);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const isKeyboardNavRef = useRef<boolean>(false);
  const releaseTimerRef = useRef<number | null>(null);

  const dragStateRef = useRef<{
    mode: 'min' | 'max' | 'pending';
    startX: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current !== null) {
        clearTimeout(releaseTimerRef.current);
      }
    };
  }, []);

  const total = limitMax - limitMin;
  const leftPercent = total > 0 ? ((minStep - limitMin) / total) * 100 : 0;
  const rightPercent = total > 0 ? ((maxStep - limitMin) / total) * 100 : 100;
  const widthPercent = Math.max(0, rightPercent - leftPercent);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (releaseTimerRef.current !== null) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
    isKeyboardNavRef.current = false;

    e.currentTarget.setPointerCapture(e.pointerId);

    const clientX = e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const clickedStep = Math.round(limitMin + ratio * total);

    if (minStep === maxStep) {
      dragStateRef.current = {
        mode: 'pending',
        startX: clientX,
      };
      setActiveThumb(null);
    } else {
      const distMin = Math.abs(clickedStep - minStep);
      const distMax = Math.abs(clickedStep - maxStep);

      if (distMin < distMax) {
        dragStateRef.current = { mode: 'min', startX: clientX };
        setActiveThumb('min');
        onChange(Math.min(clickedStep, maxStep), maxStep);
      } else {
        dragStateRef.current = { mode: 'max', startX: clientX };
        setActiveThumb('max');
        onChange(minStep, Math.max(clickedStep, minStep));
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const currentStep = Math.round(limitMin + ratio * total);

    if (state.mode === 'pending') {
      const deltaX = e.clientX - state.startX;
      if (Math.abs(deltaX) < 2) return;
      if (deltaX < 0) {
        state.mode = 'min';
        setActiveThumb('min');
      } else {
        state.mode = 'max';
        setActiveThumb('max');
      }
    }

    if (state.mode === 'min') {
      const newMin = Math.max(limitMin, Math.min(currentStep, maxStep));
      onChange(newMin, maxStep);
    } else if (state.mode === 'max') {
      const newMax = Math.min(limitMax, Math.max(currentStep, minStep));
      onChange(minStep, newMax);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current) {
      dragStateRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      // 松开手势后，延迟 1000ms 自动取消高亮（除非处于键盘导航）
      if (releaseTimerRef.current !== null) {
        clearTimeout(releaseTimerRef.current);
      }
      releaseTimerRef.current = window.setTimeout(() => {
        if (!isKeyboardNavRef.current) {
          setActiveThumb(null);
        }
      }, 1000);
    }
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-8 flex items-center select-none touch-none cursor-pointer ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* 背景灰底轨道 */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-slate-200 rounded-lg pointer-events-none" />

      {/* 双圆之间的高亮轨道 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-2 bg-brand-blue rounded-lg pointer-events-none"
        style={{
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
        }}
      />

      {/* 左圆滑块 (最低音) */}
      <button
        ref={minThumbRef}
        type="button"
        aria-label="最低音"
        aria-valuenow={minStep}
        aria-valuemin={limitMin}
        aria-valuemax={maxStep}
        onFocus={() => {
          if (isKeyboardNavRef.current) {
            setActiveThumb('min');
          }
        }}
        onBlur={() => {
          isKeyboardNavRef.current = false;
          setActiveThumb((prev) => (prev === 'min' ? null : prev));
        }}
        onKeyDown={(e) => {
          isKeyboardNavRef.current = true;
          if (releaseTimerRef.current !== null) {
            clearTimeout(releaseTimerRef.current);
            releaseTimerRef.current = null;
          }
          setActiveThumb('min');
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(limitMin, minStep - 1), maxStep);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(maxStep, minStep + 1), maxStep);
          }
        }}
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-blue border-2 border-white cursor-pointer outline-none ${
          activeThumb === 'min'
            ? 'z-20 scale-110 shadow-lg ring-4 ring-brand-blue/30'
            : 'z-10 scale-100 shadow-md focus-visible:z-20 focus-visible:scale-110 focus-visible:ring-4 focus-visible:ring-brand-blue/30'
        }`}
        style={{ left: `calc(${leftPercent}% - 10px)` }}
      />

      {/* 右圆滑块 (最高音) */}
      <button
        ref={maxThumbRef}
        type="button"
        aria-label="最高音"
        aria-valuenow={maxStep}
        aria-valuemin={minStep}
        aria-valuemax={limitMax}
        onFocus={() => {
          if (isKeyboardNavRef.current) {
            setActiveThumb('max');
          }
        }}
        onBlur={() => {
          isKeyboardNavRef.current = false;
          setActiveThumb((prev) => (prev === 'max' ? null : prev));
        }}
        onKeyDown={(e) => {
          isKeyboardNavRef.current = true;
          if (releaseTimerRef.current !== null) {
            clearTimeout(releaseTimerRef.current);
            releaseTimerRef.current = null;
          }
          setActiveThumb('max');
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(minStep, Math.max(minStep, maxStep - 1));
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(minStep, Math.min(limitMax, maxStep + 1));
          }
        }}
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-blue border-2 border-white cursor-pointer outline-none ${
          activeThumb === 'max'
            ? 'z-20 scale-110 shadow-lg ring-4 ring-brand-blue/30'
            : 'z-10 scale-100 shadow-md focus-visible:z-20 focus-visible:scale-110 focus-visible:ring-4 focus-visible:ring-brand-blue/30'
        }`}
        style={{ left: `calc(${rightPercent}% - 10px)` }}
      />
    </div>
  );
};

interface OptionsModalProps {
  isOpen: boolean;
  options: TrainerOptions;
  onChangeOptions: (opts: TrainerOptions) => void;
  onResetOptions: () => void;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  options,
  onChangeOptions,
  onResetOptions,
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
   * 单轨道双圆点滑块：支持重叠时向左/向右分别拖开
   */
  const renderDoubleSlider = (
    clef: ClefType,
    minStep: number,
    maxStep: number,
    limitMin: number,
    limitMax: number,
    disabled: boolean,
  ) => {
    return (
      <DoubleRangeSlider
        minStep={minStep}
        maxStep={maxStep}
        limitMin={limitMin}
        limitMax={limitMax}
        disabled={disabled}
        onChange={(min, max) => handleRangeChange(clef, min, max)}
      />
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
        <button
          type="button"
          onClick={onResetOptions}
          title="恢复默认设置"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors flex items-center gap-1 text-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置</span>
        </button>
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
