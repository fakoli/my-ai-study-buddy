import { Check, Sparkles } from 'lucide-react';
import type { StepConfig, CourseStep } from '../../hooks/useCourseSteps';

export interface CourseStepperProps {
  steps: StepConfig[];
  currentStep: CourseStep;
  currentStepIndex: number;
  onStepClick: (step: CourseStep) => void;
}

export function CourseStepper({
  steps,
  currentStep,
  currentStepIndex,
  onStepClick,
}: CourseStepperProps) {
  return (
    <nav aria-label="Progress" className="px-4 py-6 bg-white rounded-xl shadow-sm">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = step.key === currentStep;
          const isClickable = isCompleted || isCurrent;

          return (
            <li
              key={step.key}
              className={`relative flex items-center ${
                index !== steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              {/* Step indicator and label */}
              <button
                onClick={() => {
                  if (isClickable) {
                    onStepClick(step.key);
                  }
                }}
                disabled={!isClickable}
                className={`group flex items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    isCompleted
                      ? 'bg-indigo-600 shadow-md shadow-indigo-200'
                      : isCurrent
                        ? 'border-2 border-indigo-600 bg-indigo-50'
                        : 'border-2 border-gray-200 bg-gray-50'
                  } ${isClickable && !isCurrent ? 'group-hover:scale-105' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>
                <span
                  className={`ml-3 text-sm font-medium hidden sm:block ${
                    isCurrent
                      ? 'text-indigo-700'
                      : isCompleted
                        ? 'text-gray-700'
                        : 'text-gray-400'
                  }`}
                >
                  {step.label}
                  {step.aiOnly && (
                    <Sparkles className="w-3 h-3 inline ml-1 text-amber-500" />
                  )}
                </span>
              </button>

              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div className="flex-1 mx-4 hidden sm:block">
                  <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-indigo-600 w-full' : 'bg-gray-200 w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
