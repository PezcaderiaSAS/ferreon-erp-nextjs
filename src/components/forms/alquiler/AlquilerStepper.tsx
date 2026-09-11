import React from 'react';
import { ALQUILER_STEPS } from './types';

interface AlquilerStepperProps {
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export const AlquilerStepper: React.FC<AlquilerStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs">
      <div className="grid grid-cols-3 gap-2">
        {ALQUILER_STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={`flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2.5 p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white shadow-sm border border-teal-600/30 text-teal-800'
                  : isCompleted
                  ? 'text-emerald-700 hover:bg-white/70'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-600/20'
                    : isCompleted
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isCompleted ? '✓' : step.id}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold tracking-tight truncate">{step.title}</div>
                <div className="text-[10px] text-slate-400 hidden sm:block truncate mt-0.5">{step.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
