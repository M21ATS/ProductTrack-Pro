import React from 'react';
import { ProcessingStatus } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';
import { clsx } from 'clsx';

interface StatusToggleProps {
  status: ProcessingStatus;
  onChange: (newStatus: ProcessingStatus) => void;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ status, onChange }) => {
  const isCompleted = status === ProcessingStatus.COMPLETED;

  return (
    <button
      onClick={() => onChange(isCompleted ? ProcessingStatus.INCOMPLETE : ProcessingStatus.COMPLETED)}
      className={clsx(
        "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
        isCompleted 
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40" 
          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/40"
      )}
    >
      {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      <span>{status}</span>
    </button>
  );
};
