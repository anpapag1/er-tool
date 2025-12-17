import { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, X, SkipForward } from 'lucide-react';
import type { TutorialStep } from '../hooks/useTutorial';

interface TutorialOverlayProps {
  isActive: boolean;
  currentStep: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export function TutorialOverlay({
  isActive,
  currentStep,
  stepNumber,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  progress,
}: TutorialOverlayProps) {
  const [highlightPos, setHighlightPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Update spotlight position when target element changes
  useEffect(() => {
    if (!isActive || !currentStep.targetSelector) {
      setHighlightPos(null);
      return;
    }

    const updatePosition = () => {
      if (currentStep.targetSelector === 'body') {
        setHighlightPos(null);
        return;
      }

      const target = document.querySelector(currentStep.targetSelector!);
      if (target) {
        const rect = target.getBoundingClientRect();
        setHighlightPos({
          x: rect.left - 8,
          y: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });
      }
    };

    updatePosition();
    const resizeObserver = new ResizeObserver(updatePosition);
    const targetElement = document.querySelector(currentStep.targetSelector!);
    if (targetElement) resizeObserver.observe(targetElement);

    window.addEventListener('resize', updatePosition);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStep.targetSelector]);

  if (!isActive) return null;

  const isLastStep = stepNumber === totalSteps;
  const isCelebration = currentStep.id === 'celebration';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* SVG Spotlight Mask with Glow - Hide on mobile */}
      {highlightPos && !isMobile && (
        <>
          {/* Animated glow ring */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 0 9999px rgba(0, 0, 0, 0.7))' }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={highlightPos.x}
                  y={highlightPos.y}
                  width={highlightPos.width}
                  height={highlightPos.height}
                  rx="12"
                  fill="black"
                />
              </mask>
              <style>{`
                @keyframes glow-pulse {
                  0%, 100% {
                    stroke: rgba(96, 165, 250, 0.5);
                    filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.4));
                  }
                  50% {
                    stroke: rgba(168, 85, 247, 0.8);
                    filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.6));
                  }
                }
                .spotlight-ring {
                  animation: glow-pulse 2s ease-in-out infinite;
                }
              `}</style>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#spotlight-mask)"
            />
            {/* Glowing border ring */}
            <rect
              className="spotlight-ring"
              x={highlightPos.x}
              y={highlightPos.y}
              width={highlightPos.width}
              height={highlightPos.height}
              rx="12"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}

      {/* Dark Overlay */}
      {(!highlightPos || isMobile) && <div className="absolute inset-0 bg-black/70" />}

      {/* Tooltip Container - Responsive positioning */}
      <div className={`fixed pointer-events-auto ${
        isMobile 
          ? 'bottom-0 left-0 right-0 max-h-[70vh]' 
          : 'bottom-12 left-1/2 transform -translate-x-1/2'
      }`}>
        {isCelebration ? (
          /* Celebration Screen */
          <div className="relative bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-blue-500/90 dark:from-blue-700/90 dark:via-purple-700/90 dark:to-blue-600/90 backdrop-blur-3xl rounded-t-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 max-w-md text-white text-center w-full md:w-auto border border-blue-400/50 dark:border-white/10 overflow-hidden animate-pop-in">
            {/* Animated background orbs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-300/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
            
            {/* Content */}
            <div className="relative">
              <div className="text-6xl md:text-7xl mb-4 md:mb-6 animate-bounce inline-block">🎉</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 drop-shadow-lg">{currentStep.title}</h2>
              <p className="text-base md:text-lg mb-6 md:mb-8 leading-relaxed font-medium drop-shadow-md">{currentStep.description}</p>

              <div className="flex gap-3 md:gap-4 justify-center mt-6 md:mt-8">
                <button
                  onClick={onSkip}
                  className="px-6 md:px-8 py-2.5 md:py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all backdrop-blur-sm border border-white/30 hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Regular Step */
          <div className="bg-black/40 dark:bg-black/40 backdrop-blur-3xl rounded-t-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 max-w-md w-full md:w-auto border border-blue-500/30 dark:border-white/10 overflow-y-auto max-h-[70vh] md:max-h-none animate-pop-in">
            {/* Animated glow background */}
            <div className="absolute inset-0 -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl animate-tutorial-glow -z-10" />
            
            {/* Header with Step Number and animated background */}
            <div className="flex items-center justify-between mb-4 md:mb-6 gap-2 relative">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 shadow-lg shadow-blue-500/50 glow-blue">
                  {stepNumber}
                </div>
                <span className="text-xs md:text-sm font-semibold text-gray-300 dark:text-gray-400 whitespace-nowrap">
                  {stepNumber}/{totalSteps}
                </span>
              </div>
              <button
                onClick={onSkip}
                className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all duration-200 flex-shrink-0 hover:scale-110"
                title="Skip tutorial"
              >
                <X size={20} className="text-gray-300 dark:text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Progress Bar - Enhanced */}
            <div className="mb-5 md:mb-6 space-y-2">
              <div className="h-3 bg-white/5 dark:bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400 transition-all duration-500 shadow-lg shadow-blue-500/50 animate-tutorial-shine"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{stepNumber}</span>
                <span>{totalSteps}</span>
              </div>
            </div>

            {/* Title - Enhanced */}
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg glow-blue">
              {currentStep.title}
            </h3>

            {/* Description */}
            <p className="text-sm md:text-base text-gray-100 mb-4 md:mb-6 leading-relaxed font-medium">
              {currentStep.description}
            </p>

            {/* Action Hint - Enhanced */}
            {currentStep.action && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-500/20 dark:bg-blue-500/10 backdrop-blur-sm border border-blue-400/50 dark:border-blue-500/30 rounded-xl">
                <p className="text-xs md:text-sm font-semibold text-blue-200 dark:text-blue-300">
                  👉 {currentStep.action}
                </p>
              </div>
            )}

            {/* Navigation Buttons - Enhanced */}
            <div className="flex gap-2 md:gap-3 justify-between mt-6 md:mt-8">
              <button
                onClick={onPrevious}
                disabled={stepNumber === 1}
                className="flex items-center gap-1 px-3 md:px-5 py-2.5 md:py-3 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-gray-200 dark:text-gray-300 hover:text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-xs md:text-sm backdrop-blur-sm border border-white/20 dark:border-white/10"
              >
                <ChevronLeft size={16} className="hidden md:block" />
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">←</span>
              </button>

              <button
                onClick={onSkip}
                className="flex items-center gap-1 px-3 md:px-4 py-2.5 md:py-3 text-gray-300 dark:text-gray-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/10 transition-all text-xs md:text-sm rounded-xl font-medium"
              >
                <SkipForward size={14} className="hidden md:block" />
                <span className="hidden sm:inline">Skip</span>
                <span className="sm:hidden">⊗</span>
              </button>

              <button
                onClick={onNext}
                className="flex items-center gap-1 px-3 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 hover:from-blue-700 hover:via-purple-700 hover:to-blue-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all font-semibold text-xs md:text-sm shadow-lg backdrop-blur-sm border border-blue-400/50 hover:border-blue-300/70 glow-blue"
              >
                <span className="hidden sm:inline">{isLastStep ? '🚀 Finish' : 'Next'}</span>
                <span className="sm:hidden">{isLastStep ? '✓' : '→'}</span>
                <ChevronRight size={16} className="hidden md:block" />
              </button>
            </div>

            {/* Keyboard Hint */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 md:mt-6 text-center font-medium">
              💡 <span className="hidden md:inline">Use ← → to navigate, Esc to skip</span><span className="md:hidden">Tap to navigate</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
