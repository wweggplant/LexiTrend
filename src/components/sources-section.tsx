import React, { useState } from 'react';
import { ExternalLinkIcon, CheckCircleIcon } from 'lucide-react';

interface Source {
  title: string;
  url: string;
  relevance: string;
}

interface SourcesSectionProps {
  sources: Source[];
}

const SourceItem: React.FC<{ source: Source }> = ({ source }) => {
  const handleClick = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: source.url });
    } else {
      // 在开发环境或非Chrome扩展环境中打开新窗口
      window.open(source.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="group">
      <button
        onClick={handleClick}
        className="w-full text-left p-2 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        aria-label={`打开链接: ${source.title}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-600 group-hover:text-blue-800 truncate">
              {source.title}
            </p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {source.relevance}
            </p>
          </div>
          <ExternalLinkIcon className="w-3 h-3 text-gray-400 group-hover:text-gray-600 ml-2 flex-shrink-0" />
        </div>
      </button>
    </div>
  );
};

export const SourcesSection: React.FC<SourcesSectionProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displaySources = isExpanded ? sources : sources.slice(0, 2);

  return (
    <div className="pt-3 border-t border-gray-100" role="region" aria-label="信息来源">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-700 flex items-center">
          <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500" />
          信息来源
        </h4>
        {sources.length > 2 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            aria-expanded={isExpanded}
            aria-controls="sources-list"
          >
            {isExpanded ? '收起' : `查看全部 ${sources.length} 个来源`}
          </button>
        )}
      </div>
      
      <div id="sources-list" className="space-y-2">
        {displaySources.map((source, index) => (
          <SourceItem key={index} source={source} />
        ))}
      </div>
    </div>
  );
}; 