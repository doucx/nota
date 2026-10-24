import { getAllNoteStats } from '@/db/storage';
import type { LearningState, NamingScheme } from '@/types';
import { formatStep } from '@/utils/pitch';
import { TARGET_MS, median } from '@/utils/scheduler';
import { ArrowLeft } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  naming: NamingScheme;
  onClose: () => void;
}

const STATE_LABELS: Record<LearningState, string> = {
  new: '新',
  learning: '学习中',
  review: '已掌握',
  lapsed: '需加强',
};

const STATE_STYLES: Record<LearningState, string> = {
  new: 'bg-slate-100 text-slate-500',
  learning: 'bg-amber-50 text-amber-600',
  review: 'bg-emerald-50 text-emerald-600',
  lapsed: 'bg-rose-50 text-rose-600',
};

const CLEF_LABELS: Record<string, string> = {
  treble: '高音',
  bass: '低音',
  alto: '中音',
};

interface Row {
  key: string;
  label: string;
  clefLabel: string;
  medianMs: number;
  accuracy: number;
  attempts: number;
  state: LearningState;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, naming, onClose }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);
    getAllNoteStats().then((map) => {
      if (!alive) return;
      const next: Row[] = [];
      for (const [key, stats] of Object.entries(map)) {
        if (stats.attempts === 0) continue;
        next.push({
          key,
          label: `${formatStep(stats.step, naming)}${stats.accidental ?? ''}`,
          clefLabel: CLEF_LABELS[stats.clef] ?? stats.clef,
          medianMs: median(stats.reactionTimes),
          accuracy: stats.attempts > 0 ? stats.correct / stats.attempts : 0,
          attempts: stats.attempts,
          state: stats.state,
        });
      }
      next.sort((a, b) => b.medianMs - a.medianMs);
      setRows(next);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, naming]);

  if (!isOpen) return null;

  const masteredCount = rows.filter((r) => r.state === 'review').length;
  const weakCount = rows.filter((r) => r.state === 'learning' || r.state === 'lapsed').length;

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
        <h2 className="text-lg font-bold">训练档案</h2>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl w-full mx-auto flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="text-xs text-slate-400">已掌握</div>
            <div className="text-xl font-bold text-emerald-600">{masteredCount}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="text-xs text-slate-400">需加强</div>
            <div className="text-xl font-bold text-rose-500">{weakCount}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="text-xs text-slate-400">已练习</div>
            <div className="text-xl font-bold text-slate-700">{rows.length}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-sm text-slate-400 py-10">加载中…</div>
        ) : rows.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-10">
            暂无训练数据，先去练几轮吧。
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center text-xs text-slate-400 px-3">
              <span className="flex-1">音符</span>
              <span className="w-20 text-right">中位反应</span>
              <span className="w-16 text-right">正确率</span>
              <span className="w-16 text-right">状态</span>
            </div>
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center px-3 py-2.5 bg-white border border-slate-200 rounded-xl"
              >
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-bold text-slate-800">{row.label}</span>
                  <span className="text-[11px] text-slate-400">{row.clefLabel}</span>
                </div>
                <span
                  className={`w-20 text-right font-mono text-sm ${
                    row.medianMs > TARGET_MS ? 'text-rose-500' : 'text-emerald-600'
                  }`}
                >
                  {(row.medianMs / 1000).toFixed(2)}s
                </span>
                <span className="w-16 text-right font-mono text-sm text-slate-600">
                  {Math.round(row.accuracy * 100)}%
                </span>
                <span className="w-16 flex justify-end">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATE_STYLES[row.state]}`}
                  >
                    {STATE_LABELS[row.state]}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-400 leading-relaxed">
          中位反应时间为首次按键耗时，目标在 {TARGET_MS} ms 以内，红字表示偏慢。
          系统会依据错误率与反应速度，自动提高薄弱音符的出现频率。
        </p>
      </div>
    </div>
  );
};
