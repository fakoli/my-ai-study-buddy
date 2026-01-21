import { useState, useCallback, useMemo } from 'react';

export type CourseStep = 'info' | 'instructions' | 'modules';

export interface StepConfig {
  key: CourseStep;
  label: string;
  aiOnly?: boolean;
}

const STEPS: StepConfig[] = [
  { key: 'info', label: 'Basic Info' },
  { key: 'instructions', label: 'AI Instructions', aiOnly: true },
  { key: 'modules', label: 'Modules' },
];

export interface CourseStepsReturn {
  currentStep: CourseStep;
  setCurrentStep: (step: CourseStep) => void;
  visibleSteps: StepConfig[];
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToNext: () => void;
  goBack: () => void;
}

export function useCourseSteps(aiEnabled: boolean): CourseStepsReturn {
  const [currentStep, setCurrentStep] = useState<CourseStep>('info');

  const visibleSteps = useMemo(
    () => STEPS.filter((step) => !step.aiOnly || aiEnabled),
    [aiEnabled]
  );

  const currentStepIndex = visibleSteps.findIndex((s) => s.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  const goToNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < visibleSteps.length) {
      setCurrentStep(visibleSteps[nextIndex].key);
    }
  }, [currentStepIndex, visibleSteps]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(visibleSteps[prevIndex].key);
    }
  }, [currentStepIndex, visibleSteps]);

  return {
    currentStep,
    setCurrentStep,
    visibleSteps,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    goToNext,
    goBack,
  };
}
