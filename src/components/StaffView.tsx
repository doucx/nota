import { STAFF_LINES } from '@/constants/clefs';
import type { GhostNoteItem, NoteItem } from '@/types';
import { getStaffY } from '@/utils/pitch';
import type React from 'react';

interface StaffViewProps {
  currentNote: NoteItem | null;
  ghostNote: GhostNoteItem | null;
  deviationText: string;
  isSuccess?: boolean;
}

export const StaffView: React.FC<StaffViewProps> = ({
  currentNote,
  ghostNote,
  deviationText,
  isSuccess = false,
}) => {
  if (!currentNote) return null;

  const clef = currentNote.clef;
  const targetY = getStaffY(clef, currentNote.step);
  const targetNoteColor = isSuccess ? '#10b981' : '#0f172a';

  const renderLedgerLines = (y: number, x: number) => {
    const lines = [];
    if (y >= 114) {
      for (let ly = 114; ly <= y + 1; ly += 16) {
        lines.push(
          <line
            key={`ledger-${ly}`}
            x1={x - 18}
            x2={x + 18}
            y1={ly}
            y2={ly}
            stroke="#334155"
            strokeWidth="1.8"
          />,
        );
      }
    } else if (y <= 18) {
      for (let ly = 18; ly >= y - 1; ly -= 16) {
        lines.push(
          <line
            key={`ledger-${ly}`}
            x1={x - 18}
            x2={x + 18}
            y1={ly}
            y2={ly}
            stroke="#334155"
            strokeWidth="1.8"
          />,
        );
      }
    }
    return lines;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 min-h-0">
      <svg
        className="w-full max-w-[640px] max-h-full h-auto"
        style={{ aspectRatio: '600 / 280' }}
        viewBox="0 -80 600 280"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>五线谱视奏画板</title>
        {/* 5 根五线谱横线 */}
        {STAFF_LINES.map((lineY) => (
          <line
            key={`line-${lineY}`}
            x1="25"
            x2="575"
            y1={lineY}
            y2={lineY}
            stroke="#334155"
            strokeWidth="1.8"
          />
        ))}

        {/* 精确对齐的谱号 */}
        <text x={clef.x} y={clef.y} fontSize={`${clef.size}px`} fontFamily="serif" fill="#0f172a">
          {clef.symbol}
        </text>

        {/* 目标音符 (x=330) */}
        {renderLedgerLines(targetY, 330)}
        {currentNote.accidental && (
          <text
            x={330 - 32}
            y={targetY + 7}
            fontSize="26px"
            fontWeight="bold"
            fill={targetNoteColor}
          >
            {currentNote.accidental}
          </text>
        )}
        <ellipse
          cx="330"
          cy={targetY}
          rx="12"
          ry="8.5"
          transform={`rotate(-20 330 ${targetY})`}
          fill={targetNoteColor}
        />

        {/* 错误按键音符 (x=330, 正上方/正下方红色) */}
        {ghostNote &&
          (() => {
            const ghostY = getStaffY(clef, ghostNote.step);
            return (
              <g>
                {renderLedgerLines(ghostY, 330)}
                {ghostNote.accidental && (
                  <text
                    x={330 - 32}
                    y={ghostY + 7}
                    fontSize="26px"
                    fontWeight="bold"
                    fill="#ef4444"
                  >
                    {ghostNote.accidental}
                  </text>
                )}
                <ellipse
                  cx="330"
                  cy={ghostY}
                  rx="12"
                  ry="8.5"
                  transform={`rotate(-20 330 ${ghostY})`}
                  fill="#ef4444"
                  opacity="0.9"
                />
              </g>
            );
          })()}
      </svg>

      <div className="h-6 text-sm font-bold text-red-500 text-center">{deviationText}</div>
    </div>
  );
};
