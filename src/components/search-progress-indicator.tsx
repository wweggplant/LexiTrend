import React from 'react';

export const SearchProgressIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-blue-600 py-2">
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
      <span className="text-xs font-medium">正在搜索最新信息...</span>
    </div>
  );
};

export const InsightCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 animate-pulse">
      {/* 主要内容骨架 */}
      <div className="space-y-3">
        <div>
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
        
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      {/* 状态指示器骨架 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>

      {/* 搜索进度指示器 */}
      <SearchProgressIndicator />
    </div>
  );
}; 