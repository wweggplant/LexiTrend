import React from 'react';

interface ConfidenceIndicatorProps {
  confidence: number;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ confidence }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return '高置信度';
    if (score >= 0.6) return '中等置信度';
    return '低置信度';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidence)}`}>
        {getConfidenceLabel(confidence)}
      </div>
      <span className="text-xs text-gray-500">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}; 