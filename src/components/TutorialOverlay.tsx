import React, { useEffect, useState } from 'react';
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
      {/* SVG Spotlight Mask - Hide on mobile */}
      {highlightPos && !isMobile && (
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
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>
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
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-t-2xl md:rounded-2xl shadow-2xl p-4 md:p-8 max-w-md text-white text-center w-full md:w-auto">
            <div className="text-5xl md:text-6xl mb-3 md:mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3">{currentStep.title}</h2>
            <p className="text-base md:text-lg mb-4 md:mb-6 leading-relaxed">{currentStep.description}</p>

            <div className="flex gap-3 md:gap-4 justify-center mt-4 md:mt-6">
              <button
                onClick={onSkip}
                className="px-4 md:px-6 py-2 md:py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all text-sm md:text-base"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Regular Step */
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-2xl p-4 md:p-6 max-w-md w-full md:w-auto border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[70vh] md:max-h-none">
            {/* Header with Step Number */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 md:w-8 h-7 md:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0">
                  {stepNumber}
                </div>
                <span className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {stepNumber}/{totalSteps}
                </span>
              </div>
              <button
                onClick={onSkip}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title="Skip tutorial"
              >
                <X size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-3 md:mb-4 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            {/* Title */}
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {currentStep.title}
            </h3>

            {/* Description */}
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 md:mb-4 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Action Hint */}
            {currentStep.action && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded">
                <p className="text-xs md:text-sm font-semibold text-blue-900 dark:text-blue-300">
                  👉 {currentStep.action}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2 md:gap-3 justify-between">
              <button
                onClick={onPrevious}
                disabled={stepNumber === 1}
                className="flex items-center gap-1 px-2 md:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs md:text-sm"
              >
                <ChevronLeft size={16} className="hidden md:block" />
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">←</span>
              </button>

              <button
                onClick={onSkip}
                className="flex items-center gap-1 px-2 md:px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-xs md:text-sm"
              >
                <SkipForward size={14} className="hidden md:block" />
                <span className="hidden sm:inline">Skip</span>
                <span className="sm:hidden">⊗</span>
              </button>

              <button
                onClick={onNext}
                className="flex items-center gap-1 px-2 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-xs md:text-sm"
              >
                <span className="hidden sm:inline">{isLastStep ? 'Finish' : 'Next'}</span>
                <span className="sm:hidden">{isLastStep ? '✓' : '→'}</span>
                <ChevronRight size={16} className="hidden md:block" />
              </button>
            </div>

            {/* Keyboard Hint */}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 md:mt-3 text-center">
              💡 <span className="hidden md:inline">Use ← → to navigate, Esc to skip</span><span className="md:hidden">Tap to navigate</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
