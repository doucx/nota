import { Header } from '@/components/Header';
import { Keyboard } from '@/components/Keyboard';
import { OptionsModal } from '@/components/OptionsModal';
import { ProfileModal } from '@/components/ProfileModal';
import { StaffView } from '@/components/StaffView';
import { StartScreen } from '@/components/StartScreen';
import { StatsBar } from '@/components/StatsBar';
import { SummaryModal } from '@/components/SummaryModal';
import { DEFAULT_OPTIONS, loadSavedOptions, saveOptions } from '@/constants/options';
import { initStorage } from '@/db/storage';
import { useTrainer } from '@/hooks/useTrainer';
import type { TrainerOptions } from '@/types';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

type ScreenMode = 'start' | 'training';

export const App: React.FC = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>('start');
  const [options, setOptions] = useState<TrainerOptions>(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
    screenMode === 'training' && !isOptionsOpen && !isSummaryOpen && !isProfileOpen;

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
  } = useTrainer(options, isTrainingActive, handleFinishSession);

  const handleStartTraining = () => {
    setScreenMode('training');
  };

  const handleBackToStart = () => {
    setScreenMode('start');
    setIsSummaryOpen(false);
    setIsProfileOpen(false);
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

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
      <main className="w-full max-w-4xl h-full max-h-[920px] bg-white rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        <Header onBack={screenMode === 'training' ? handleBackToStart : undefined} />

        {screenMode === 'start' ? (
          <StartScreen
            onStart={handleStartTraining}
            onOpenOptions={() => setIsOptionsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        ) : (
          <>
            <StatsBar
              timeLeft={timeLeft}
              duration={options.duration}
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
              naming={options.naming}
              accidentalMode={accidentalMode}
              allowAccidentals={options.allowAccidentals}
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

        <SummaryModal
          isOpen={isSummaryOpen}
          correct={score}
          attempts={attempts}
          onRestart={handleRestart}
          onGoHome={handleBackToStart}
          onOpenProfile={() => setIsProfileOpen(true)}
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
