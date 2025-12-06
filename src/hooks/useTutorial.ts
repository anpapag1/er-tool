import { useState, useCallback, useEffect } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for spotlight
  action?: string; // What user should do
  allowedInteractions?: string[]; // Which elements can be clicked
  onComplete?: () => void; // Callback when step completes
}

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  steps: TutorialStep[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to ER Diagram Tool!',
    description: 'This interactive tour will show you how to create amazing entity-relationship diagrams. Click "Next" to begin!',
    targetSelector: 'body',
  },
  {
    id: 'create_entity',
    title: '📦 Create Your First Entity',
    description: 'Entities represent the main objects in your database. Let\'s create a "Student" entity. Type "Student" in the entity name field and click "Save Entity".',
    targetSelector: '[data-tutorial="entity-input"]',
    action: 'Create an entity named "Student"',
  },
  {
    id: 'add_attributes',
    title: '📋 Add Attributes to Student',
    description: 'Attributes describe properties of entities. Let\'s add some attributes to Student like "StudentID" (primary key), "Name", and "Email". Mark StudentID as a primary key by checking the checkbox.',
    targetSelector: '[data-tutorial="attributes-section"]',
    action: 'Add at least 2 attributes',
  },
  {
    id: 'create_entity_2',
    title: '📚 Create Second Entity',
    description: 'Now let\'s create another entity called "Course". This will represent courses in your system.',
    targetSelector: '[data-tutorial="entity-input"]',
    action: 'Create an entity named "Course"',
  },
  {
    id: 'create_relationship',
    title: '🔗 Create a Relationship',
    description: 'Relationships connect entities. Let\'s create an "Enrolls" relationship between Student and Course with cardinality 1:N.',
    targetSelector: '[data-tutorial="relationship-tab"]',
    action: 'Switch to Relationship tab and create "Enrolls"',
  },
  {
    id: 'canvas_controls',
    title: '🎮 Canvas Navigation',
    description: 'Now let\'s explore the canvas! Try panning with Space+Drag and zooming with your mouse wheel. Click "Zoom to Fit" button to see everything.',
    targetSelector: '[data-tutorial="zoom-controls"]',
    action: 'Explore the canvas - pan and zoom around',
  },
  {
    id: 'physics_demo',
    title: '⚡ Physics Engine',
    description: 'Watch the magic! Attributes automatically arrange themselves around their entities using physics simulation. Try toggling physics on/off to see the difference.',
    targetSelector: '[data-tutorial="physics-toggle"]',
    action: 'Toggle the physics engine to see it in action',
  },
  {
    id: 'export_options',
    title: '💾 Save & Export',
    description: 'You can save your diagrams as JSON, or export as PNG, SVG, PDF and more! Share diagrams using the share link feature. Try the export menu in the header.',
    targetSelector: '[data-tutorial="export-button"]',
    action: 'Open the export menu to see all options',
  },
  {
    id: 'celebration',
    title: '🎉 Congratulations!',
    description: 'You\'ve completed the tutorial! You now know how to create ER diagrams. Happy designing! You can restart this tutorial anytime from the settings.',
    targetSelector: 'body',
  },
];

export function useTutorial() {
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    isCompleted: false,
    steps: TUTORIAL_STEPS,
  });

  // Load completion status from localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem('tutorialCompleted') === 'true';
    const hasVisited = localStorage.getItem('tutorialStarted') === 'true';
    
    // Start tutorial automatically for first-time users
    if (!hasVisited && !completed) {
      setTutorialState(prev => ({ ...prev, isActive: true }));
      localStorage.setItem('tutorialStarted', 'true');
    }
  }, []);

  const startTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      isCompleted: false,
    }));
  }, []);

  const restartTutorial = useCallback(() => {
    localStorage.removeItem('tutorialCompleted');
    startTutorial();
  }, [startTutorial]);

  const nextStep = useCallback(() => {
    setTutorialState(prev => {
      const nextStep = prev.currentStep + 1;
      if (nextStep >= prev.steps.length) {
        // Tutorial complete
        localStorage.setItem('tutorialCompleted', 'true');
        return {
          ...prev,
          isCompleted: true,
          isActive: false,
        };
      }
      return { ...prev, currentStep: nextStep };
    });
  }, []);

  const previousStep = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    localStorage.setItem('tutorialCompleted', 'true');
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true,
    }));
  }, []);

  const getCurrentStep = useCallback(() => {
    return tutorialState.steps[tutorialState.currentStep];
  }, [tutorialState]);

  const getProgress = useCallback(() => {
    return {
      current: tutorialState.currentStep + 1,
      total: tutorialState.steps.length,
      percentage: ((tutorialState.currentStep + 1) / tutorialState.steps.length) * 100,
    };
  }, [tutorialState]);

  return {
    ...tutorialState,
    startTutorial,
    restartTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    getCurrentStep,
    getProgress,
  };
}
