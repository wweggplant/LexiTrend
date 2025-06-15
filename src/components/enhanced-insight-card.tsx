"use client"

import { useState } from "react"
import { BookOpen, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { EnhancedInsightResponse } from "../types/tavily"
import { ConfidenceIndicator } from "./confidence-indicator"
import { SearchStatusIndicator } from "./search-status-indicator"
import { SourcesSection } from "./sources-section"
import { SearchErrorIndicator } from "./search-error-indicator"
import { InsightCardSkeleton } from "./search-progress-indicator"
import type { InsightResponse } from "@/types/api"

export interface EnhancedInsightCardProps {
  keyword: string;
  insight: InsightResponse | EnhancedInsightResponse;
  onBack?: () => void;
  isLoading?: boolean;
  searchError?: string;
  onRetrySearch?: () => void;
}

type ActiveTab = "definition" | "culture"

// 类型守卫函数
function isEnhancedInsight(insight: InsightResponse | EnhancedInsightResponse): insight is EnhancedInsightResponse {
  return 'searchMetadata' in insight;
}

function TabSwitcher({
  activeTab,
  onTabChange,
}: {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
}) {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={activeTab === "definition" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTabChange("definition")}
        className="flex-1"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        定义
      </Button>
      <Button
        variant={activeTab === "culture" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTabChange("culture")}
        className="flex-1"
      >
        <Globe className="w-4 h-4 mr-2" />
        文化背景
      </Button>
    </div>
  )
}

function ContentView({
  data,
  activeTab,
}: {
  data: InsightResponse | EnhancedInsightResponse
  activeTab: ActiveTab
}) {
  if (activeTab === "definition") {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">含义</h4>
          <p className="text-gray-700 leading-relaxed">{data.definition}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">文化意义</h4>
        <p className="text-gray-700 leading-relaxed">{data.culturalContext}</p>
      </div>
    </div>
  )
}

function EnhancedMetadata({ insight }: { insight: EnhancedInsightResponse }) {
  const { searchMetadata } = insight;
  
  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      {/* 置信度和搜索状态 */}
      <div className="flex items-center justify-between">
        <ConfidenceIndicator confidence={insight.confidence} />
        <SearchStatusIndicator 
          searchPerformed={searchMetadata.searchPerformed}
          lastUpdated={searchMetadata.lastUpdated}
        />
      </div>

      {/* 信息来源 */}
      {searchMetadata.sources && searchMetadata.sources.length > 0 && (
        <SourcesSection sources={searchMetadata.sources} />
      )}
    </div>
  );
}

export default function EnhancedInsightCard({ 
  keyword, 
  insight, 
  onBack, 
  isLoading,
  searchError,
  onRetrySearch
}: EnhancedInsightCardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("definition")

  if (isLoading) {
    return <InsightCardSkeleton />;
  }

  const isEnhanced = isEnhancedInsight(insight);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <button onClick={onBack} className="text-sm text-blue-500 hover:underline mb-2">
              &larr; 返回
            </button>
            <CardTitle className="text-2xl font-bold">{keyword}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{insight.language}</Badge>
            {isEnhanced && (
              <Badge variant={insight.searchMetadata.searchPerformed ? "default" : "outline"}>
                {insight.searchMetadata.searchPerformed ? "增强分析" : "基础分析"}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 pt-2">
          分析于: {new Date(insight.timestamp).toLocaleString()}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="mt-4 flex-1">
          <ContentView data={insight} activeTab={activeTab} />
        </div>

        {/* 增强功能区域 */}
        {isEnhanced && (
          <EnhancedMetadata insight={insight} />
        )}

        {/* 搜索错误提示 */}
        {searchError && (
          <SearchErrorIndicator 
            error={searchError} 
            onRetry={onRetrySearch}
          />
        )}
      </CardContent>
    </Card>
  )
} 