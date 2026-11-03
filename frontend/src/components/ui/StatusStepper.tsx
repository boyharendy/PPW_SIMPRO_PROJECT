import React from 'react';
import { Check } from 'lucide-react';
import { getStatusLabel } from '@/lib/utils';

export interface Step {
  id?: string;
  key?: string;
  label?: string;
  description?: string;
}

export interface StatusStepperProps {
  steps?: Step[];
  stages?: Step[];
  currentStepId?: string;
  currentStageKey?: string;
  isRejected?: boolean;
}

export function StatusStepper({
  steps,
  stages,
  currentStepId,
  currentStageKey,
  isRejected = false,
}: StatusStepperProps) {
  const activeList = steps || stages || [];
  const activeKey = currentStepId || currentStageKey || '';
  const currentIndex = activeList.findIndex((s) => (s.id || s.key) === activeKey);

  return (
    <div className="w-full py-4 overflow-x-auto">
      <div className="flex items-center min-w-[500px]">
        {activeList.map((step, idx) => {
          const stepId = step.id || step.key || String(idx);
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isLast = idx === activeList.length - 1;

          let circleClass = 'bg-slate-100 text-slate-400 border border-slate-200';
          let lineClass = 'bg-slate-200';

          if (isCompleted) {
            circleClass = 'bg-emerald-600 text-white border border-emerald-600';
            lineClass = 'bg-emerald-600';
          } else if (isCurrent) {
            if (isRejected) {
              circleClass = 'bg-rose-600 text-white border-2 border-rose-600';
            } else {
              circleClass = 'bg-blue-600 text-white border-2 border-blue-600';
            }
          }

          return (
            <React.Fragment key={stepId}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${circleClass}`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium text-center max-w-[90px] leading-tight ${
                    isCurrent
                      ? isRejected
                        ? 'text-rose-600 font-bold'
                        : 'text-blue-600 font-bold'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label || getStatusLabel(stepId)}
                </span>
                {step.description && (
                  <span className="text-[10px] text-slate-400 text-center max-w-[80px] mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>

              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 -mt-5 transition-colors duration-300">
                  <div className={`h-full w-full ${lineClass}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default StatusStepper;
