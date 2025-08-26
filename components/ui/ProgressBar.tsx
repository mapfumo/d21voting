import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  status: string;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
  className = "",
  showPercentage = true,
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-300">{status}</span>
        {showPercentage && (
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface TransactionProgressProps {
  step: number;
  totalSteps: number;
  currentStep: string;
  steps: string[];
}

export const TransactionProgress: React.FC<TransactionProgressProps> = ({
  step,
  totalSteps,
  currentStep,
  steps,
}) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto">
      <ProgressBar progress={progress} status={currentStep} className="mb-4" />
      <div className="space-y-2">
        {steps.map((stepText, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 text-sm ${
              index < step
                ? "text-green-400"
                : index === step
                  ? "text-blue-400"
                  : "text-gray-500"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                index < step
                  ? "bg-green-500"
                  : index === step
                    ? "bg-blue-500"
                    : "bg-gray-600"
              }`}
            >
              {index < step ? "✓" : index === step ? "●" : "○"}
            </div>
            <span>{stepText}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
