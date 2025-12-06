import React from 'react';
import { X } from 'lucide-react';
import type { TutorialStep } from '../types';

interface TutorialProps {
  showTutorial: boolean;
  tutorialStep: number;
  tutorialSteps: TutorialStep[];
  isSidebarOpen: boolean;
  onNext: () => void;
  onSkip: () => void;
  onPrevious: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({
  showTutorial,
  tutorialStep,
  tutorialSteps,
  isSidebarOpen,
  onNext,
  onSkip,
  onPrevious
}) => {
  if (!showTutorial) return null;

  const currentStep = tutorialSteps[tutorialStep];

    return (
      <>
        {/* Overlay: blur everything except sidebar when highlighting sidebar */}
        {currentStep.highlight === 'sidebar' && isSidebarOpen ? (
          <>
            {/* Dim and blur everything except sidebar */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" style={{ left: '384px' }} />
            {/* Sidebar highlight, no blur */}
            <div className="fixed left-0 top-0 bottom-0 w-96 z-[101] pointer-events-none">
              <div className="absolute inset-0 ring-4 ring-yellow-400 animate-pulse" />
            </div>
          </>
        ) : currentStep.highlight === 'canvas' ? (
          <>
            {/* Dim and blur everything except canvas controls */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            {/* Canvas controls area: bottom left, unblurred */}
            <div className="fixed bottom-6 left-6 w-[220px] h-[56px] z-[101] pointer-events-none">
              <div className="absolute inset-0 ring-4 ring-green-400 animate-pulse rounded-lg" />
            </div>
          </>
        ) : (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        )}
      
      {currentStep.highlight === 'canvas' && (
        <div className="fixed left-0 top-16 right-0 bottom-0 z-[101] pointer-events-none" style={{ left: isSidebarOpen ? '384px' : '0' }}>
          <div className="absolute inset-4 ring-4 ring-green-400 animate-pulse rounded-lg" />
        </div>
      )}
      
      {currentStep.highlight === 'shortcuts' && (
        <div className="fixed top-4 right-4 z-[101] pointer-events-none">
          <div className="absolute inset-0 -inset-2 ring-4 ring-blue-400 animate-pulse rounded-lg" />
        </div>
      )}
      
      {currentStep.highlight === 'export' && (
        <div className="fixed top-4 right-4 z-[101] pointer-events-none">
          <div className="absolute inset-0 -inset-8 ring-4 ring-orange-400 animate-pulse rounded-lg" />
        </div>
      )}
      
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[102] w-full max-w-lg px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-blue-500 overflow-hidden animate-pop-in">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
                <p className="text-blue-100 text-sm">Step {tutorialStep + 1} of {tutorialSteps.length}</p>
              </div>
              <button onClick={onSkip} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
              {currentStep.content}
            </p>

            <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-between">
            <button onClick={onSkip} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 font-medium">
              Skip Tutorial
            </button>
            <div className="flex gap-2">
              {tutorialStep > 0 && (
                <button onClick={onPrevious} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 rounded-lg font-medium">
                  Previous
                </button>
              )}
              <button onClick={onNext} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                {tutorialStep === tutorialSteps.length - 1 ? "Get Started!" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
