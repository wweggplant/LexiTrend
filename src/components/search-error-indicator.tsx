import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SearchErrorIndicatorProps {
  error: string;
  onRetry?: () => void;
}

export const SearchErrorIndicator: React.FC<SearchErrorIndicatorProps> = ({ 
  onRetry 
}) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
        </div>
        <div className="ml-2 flex-1">
          <p className="text-xs text-yellow-800">
            搜索服务暂时不可用，显示基于训练数据的分析结果
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 text-xs text-yellow-600 hover:text-yellow-800 underline focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded"
            >
              重试搜索
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 