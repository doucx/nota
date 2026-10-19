import { Header } from '@/components/Header';
import { Keyboard } from '@/components/Keyboard';
import { OptionsModal } from '@/components/OptionsModal';
import { StaffView } from '@/components/StaffView';
import { StartScreen } from '@/components/StartScreen';
import { StatsBar } from '@/components/StatsBar';
import { SummaryModal } from '@/components/SummaryModal';
import { useTrainer } from '@/hooks/useTrainer';
import type { TrainerOptions } from '@/types';
import type React from 'react';
import { useCallback, useState } from 'react';

type ScreenMode = 'start' | 'training';

const DEFAULT_OPTIONS: TrainerOptions = {
  clefs: ['treble', 'bass'],
  duration: 60,
  naming: 'solfege-ti',
  allowAccidentals: true,
  accidentalsOnly: false,
  sound: true,
};

export const App: React.FC = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>('start');
  const [options, setOptions] = useState<TrainerOptions>(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const handleFinishSession = useCallback(() => {
    setIsSummaryOpen(true);
  }, []);

  // 仅在正式处于训练视图且没有打开任何弹窗时才处于活跃状态
  const isTrainingActive = screenMode === 'training' && !isOptionsOpen && !isSummaryOpen;

  const {
    currentNote,
    ghostNote,
    deviationText,
    accidentalMode,
    score,
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
  };

  const handleRestart = () => {
    setIsSummaryOpen(false);
    resetTrainer();
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <main className="w-full max-w-4xl h-[92vh] min-h-[620px] bg-white rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        <Header onBack={screenMode === 'training' ? handleBackToStart : undefined} />

        {screenMode === 'start' ? (
          <StartScreen onStart={handleStartTraining} onOpenOptions={() => setIsOptionsOpen(true)} />
        ) : (
          <>
            <StatsBar
              timeLeft={timeLeft}
              duration={options.duration}
              score={score}
              attempts={attempts}
            />

            <StaffView
              currentNote={currentNote}
              ghostNote={ghostNote}
              deviationText={deviationText}
            />

            <Keyboard
              naming={options.naming}
              accidentalMode={accidentalMode}
              allowAccidentals={options.allowAccidentals}
              onPress={handleInput}
            />
          </>
        )}

        {/* 弹窗界面 */}
        <OptionsModal
          isOpen={isOptionsOpen}
          options={options}
          onChangeOptions={setOptions}
          onClose={() => setIsOptionsOpen(false)}
        />

        <SummaryModal
          isOpen={isSummaryOpen}
          score={score}
          attempts={attempts}
          onRestart={handleRestart}
          onGoHome={handleBackToStart}
        />
      </main>
    </div>
  );
};
