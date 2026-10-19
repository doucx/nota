import { STAFF_LINES } from '@/constants/clefs';
import type { GhostNoteItem, NoteItem } from '@/types';
import { getStaffY } from '@/utils/pitch';
import type React from 'react';

interface StaffViewProps {
  currentNote: NoteItem | null;
  ghostNote: GhostNoteItem | null;
  deviationText: string;
}

export const StaffView: React.FC<StaffViewProps> = ({ currentNote, ghostNote, deviationText }) => {
  if (!currentNote) return null;

  const clef = currentNote.clef;
  const targetY = getStaffY(clef, currentNote.step);

  const renderLedgerLines = (y: number, x: number, color: string) => {
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
            stroke={color}
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
            stroke={color}
            strokeWidth="1.8"
          />,
        );
      }
    }
    return lines;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <svg className="w-full max-w-[640px] h-[190px]" viewBox="0 0 600 150">
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
        {renderLedgerLines(targetY, 330, '#0f172a')}
        {currentNote.accidental && (
          <text x={330 - 32} y={targetY + 7} fontSize="26px" fontWeight="bold" fill="#0f172a">
            {currentNote.accidental}
          </text>
        )}
        <ellipse
          cx="330"
          cy={targetY}
          rx="12"
          ry="8.5"
          transform={`rotate(-20 330 ${targetY})`}
          fill="#0f172a"
        />

        {/* 错误按键音符 (x=410, 红色) */}
        {ghostNote &&
          (() => {
            const ghostY = getStaffY(clef, ghostNote.step);
            return (
              <g>
                {renderLedgerLines(ghostY, 410, '#ef4444')}
                {ghostNote.accidental && (
                  <text
                    x={410 - 32}
                    y={ghostY + 7}
                    fontSize="26px"
                    fontWeight="bold"
                    fill="#ef4444"
                  >
                    {ghostNote.accidental}
                  </text>
                )}
                <ellipse
                  cx="410"
                  cy={ghostY}
                  rx="12"
                  ry="8.5"
                  transform={`rotate(-20 410 ${ghostY})`}
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
