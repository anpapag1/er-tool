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
              <div className="absolute inset-0 ring-4 ring-blue-400 animate-pulse shadow-lg shadow-blue-400/50" style={{boxShadow: '0 0 20px 4px rgba(96, 165, 250, 0.4), inset 0 0 0 4px rgba(96, 165, 250, 0.6)'}} />
            </div>
          </>
        ) : currentStep.highlight === 'canvas' ? (
          <>
            {/* Dim and blur everything except canvas controls */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            {/* Canvas controls area: bottom left, unblurred */}
            <div className="fixed bottom-6 left-6 w-[220px] h-[56px] z-[101] pointer-events-none">
              <div className="absolute inset-0 ring-4 ring-purple-400 animate-pulse rounded-lg" style={{boxShadow: '0 0 20px 4px rgba(168, 85, 247, 0.4), inset 0 0 0 4px rgba(168, 85, 247, 0.6)'}} />
            </div>
          </>
        ) : (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        )}
      
      {currentStep.highlight === 'canvas' && (
        <div className="fixed left-0 top-16 right-0 bottom-0 z-[101] pointer-events-none" style={{ left: isSidebarOpen ? '384px' : '0' }}>
          <div className="absolute inset-4 ring-4 ring-purple-400 animate-pulse rounded-lg" style={{boxShadow: '0 0 20px 4px rgba(168, 85, 247, 0.4)'}} />
        </div>
      )}
      
      {currentStep.highlight === 'shortcuts' && (
        <div className="fixed top-4 right-4 z-[101] pointer-events-none">
          <div className="absolute inset-0 -inset-2 ring-4 ring-cyan-400 animate-pulse rounded-lg" style={{boxShadow: '0 0 20px 4px rgba(34, 211, 238, 0.4)'}} />
        </div>
      )}
      
      {currentStep.highlight === 'export' && (
        <div className="fixed top-4 right-4 z-[101] pointer-events-none">
          <div className="absolute inset-0 -inset-8 ring-4 ring-amber-400 animate-pulse rounded-lg" style={{boxShadow: '0 0 20px 4px rgba(251, 146, 60, 0.4)'}} />
        </div>
      )}
      
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[102] w-full max-w-lg px-4 animate-float-up">
        {/* Animated glow background */}
        <div className="absolute inset-0 -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl animate-tutorial-glow" />
        
        <div className="relative bg-black/40 backdrop-blur-3xl rounded-3xl shadow-2xl border border-blue-500/30 dark:border-white/10 overflow-hidden animate-pop-in">
          {/* Animated gradient header */}
          <div className="relative bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-blue-500/90 backdrop-blur-xl px-6 py-6 overflow-hidden">
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-tutorial-shine" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg glow-blue">{currentStep.title}</h2>
                <p className="text-blue-100 text-sm font-medium mt-1">Step {tutorialStep + 1} of {tutorialSteps.length}</p>
              </div>
              <button onClick={onSkip} className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110">
                <X size={28} />
              </button>
            </div>
          </div>

          <div className="relative px-8 py-10 bg-gradient-to-b from-white/[0.03] to-white/[0.01]">
            {/* Subtle animated background orbs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
            
            <p className="relative text-gray-100 text-lg leading-relaxed font-medium">
              {currentStep.content}
            </p>

            {/* Enhanced progress bar */}
            <div className="mt-8 space-y-2">
              <div className="h-3 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400 transition-all duration-500 shadow-lg shadow-blue-500/50 animate-tutorial-shine"
                  style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{tutorialStep + 1}</span>
                <span>{tutorialSteps.length}</span>
              </div>
            </div>
          </div>

          <div className="relative px-8 py-5 bg-gradient-to-r from-white/[0.05] to-white/[0.02] border-t border-white/10 dark:border-white/5 flex justify-between backdrop-blur-sm">
            <button 
              onClick={onSkip} 
              className="px-5 py-2 text-gray-300 hover:text-white font-medium transition-all duration-200 hover:bg-white/5 rounded-lg"
            >
              Skip
            </button>
            <div className="flex gap-3">
              {tutorialStep > 0 && (
                <button 
                  onClick={onPrevious} 
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white rounded-xl font-semibold backdrop-blur-sm border border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  ← Previous
                </button>
              )}
              <button 
                onClick={onNext} 
                className="px-7 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 hover:from-blue-700 hover:via-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-200 backdrop-blur-sm border border-blue-400/50 hover:border-blue-300/70 glow-blue"
              >
                {tutorialStep === tutorialSteps.length - 1 ? "🚀 Get Started!" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
