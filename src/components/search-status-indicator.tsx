import React from 'react';
import { SearchIcon, ClockIcon } from 'lucide-react';

interface SearchStatusIndicatorProps {
  searchPerformed: boolean;
  lastUpdated?: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return '刚刚';
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
  return `${Math.floor(diffInMinutes / 1440)}天前`;
}

export const SearchStatusIndicator: React.FC<SearchStatusIndicatorProps> = ({ 
  searchPerformed, 
  lastUpdated 
}) => {
  if (searchPerformed) {
    return (
      <div className="flex items-center space-x-1 text-green-600">
        <SearchIcon className="w-3 h-3" />
        <span className="text-xs font-medium">已获取最新信息</span>
        {lastUpdated && (
          <span className="text-xs text-gray-500">
            {formatRelativeTime(lastUpdated)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-gray-500">
      <ClockIcon className="w-3 h-3" />
      <span className="text-xs">基于训练数据</span>
    </div>
  );
}; 