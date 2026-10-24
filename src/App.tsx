import { Header } from '@/components/Header';
import { Keyboard } from '@/components/Keyboard';
import { OptionsModal } from '@/components/OptionsModal';
import { ProfileModal } from '@/components/ProfileModal';
import { SandboxModal } from '@/components/SandboxModal';
import { StaffView } from '@/components/StaffView';
import { StartScreen } from '@/components/StartScreen';
import { StatsBar } from '@/components/StatsBar';
import { SummaryModal } from '@/components/SummaryModal';
import { DEFAULT_OPTIONS, loadSavedOptions, saveOptions } from '@/constants/options';
import { initStorage } from '@/db/storage';
import { useTrainer } from '@/hooks/useTrainer';
import type { SandboxNoteSpec, TrainerOptions } from '@/types';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

type ScreenMode = 'start' | 'training';

// 沙盒专用选项：不限时、覆盖全部谱号，且不持久化
const SANDBOX_OPTIONS: TrainerOptions = {
  ...DEFAULT_OPTIONS,
  clefs: ['treble', 'bass', 'alto'],
  duration: 0,
};

export const App: React.FC = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>('start');
  const [options, setOptions] = useState<TrainerOptions>(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isSandbox, setIsSandbox] = useState(false);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [sandboxPinnedNote, setSandboxPinnedNote] = useState<SandboxNoteSpec | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initStorage();
      } catch {
        // 忽略存储初始化失败，训练功能仍可用
      }
      const saved = await loadSavedOptions();
      if (alive) {
        setOptions(saved);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleFinishSession = useCallback(() => {
    setIsSummaryOpen(true);
  }, []);

  const isTrainingActive =
    screenMode === 'training' &&
    !isOptionsOpen &&
    !isSummaryOpen &&
    !isProfileOpen &&
    !isSandboxModalOpen;

  const activeOptions = isSandbox ? SANDBOX_OPTIONS : options;

  const {
    currentNote,
    ghostNote,
    keyFeedback,
    isSuccess,
    deviationText,
    accidentalMode,
    score,
    wrongCount,
    attempts,
    timeLeft,
    handleInput,
    resetTrainer,
  } = useTrainer(
    activeOptions,
    isTrainingActive,
    handleFinishSession,
    isSandbox,
    isSandbox ? sandboxPinnedNote : null,
  );

  const handleStartTraining = () => {
    setIsSandbox(false);
    setScreenMode('training');
  };

  const handleStartSandbox = () => {
    setIsSandbox(true);
    setSandboxPinnedNote(null);
    setScreenMode('training');
  };

  const handleBackToStart = () => {
    setScreenMode('start');
    setIsSandbox(false);
    setIsSummaryOpen(false);
    setIsProfileOpen(false);
    setIsSandboxModalOpen(false);
  };

  const handleRestart = () => {
    setIsSummaryOpen(false);
    resetTrainer();
  };

  const handleChangeOptions = (newOptions: TrainerOptions) => {
    setOptions(newOptions);
    saveOptions(newOptions).catch(() => {});
  };

  const handleResetOptions = () => {
    setOptions(DEFAULT_OPTIONS);
    saveOptions(DEFAULT_OPTIONS).catch(() => {});
  };

  const handleSandboxNoteChange = (note: SandboxNoteSpec | null) => {
    setSandboxPinnedNote(note);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
      <main className="w-full max-w-4xl h-full max-h-[920px] bg-white rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        <Header
          onBack={screenMode === 'training' ? handleBackToStart : undefined}
          onSandbox={isSandbox ? () => setIsSandboxModalOpen(true) : undefined}
          title={isSandbox ? '沙盒调试' : undefined}
        />

        {screenMode === 'start' ? (
          <StartScreen
            onStart={handleStartTraining}
            onOpenOptions={() => setIsOptionsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onStartSandbox={handleStartSandbox}
          />
        ) : (
          <>
            <StatsBar
              timeLeft={timeLeft}
              duration={activeOptions.duration}
              correct={score}
              wrong={wrongCount}
            />

            <StaffView
              currentNote={currentNote}
              ghostNote={ghostNote}
              deviationText={deviationText}
              isSuccess={isSuccess}
            />

            <Keyboard
              naming={activeOptions.naming}
              accidentalMode={accidentalMode}
              allowAccidentals={activeOptions.allowAccidentals}
              keyFeedback={keyFeedback}
              onPress={handleInput}
            />
          </>
        )}

        <OptionsModal
          isOpen={isOptionsOpen}
          options={options}
          onChangeOptions={handleChangeOptions}
          onResetOptions={handleResetOptions}
          onClose={() => setIsOptionsOpen(false)}
        />

        <SandboxModal
          isOpen={isSandboxModalOpen}
          pinnedNote={sandboxPinnedNote}
          onChange={handleSandboxNoteChange}
          onClose={() => setIsSandboxModalOpen(false)}
        />

        <SummaryModal
          isOpen={isSummaryOpen}
          correct={score}
          attempts={attempts}
          onRestart={handleRestart}
          onGoHome={handleBackToStart}
          onOpenProfile={isSandbox ? undefined : () => setIsProfileOpen(true)}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          naming={options.naming}
          onClose={() => setIsProfileOpen(false)}
        />
      </main>
    </div>
  );
};
