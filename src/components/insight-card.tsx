"use client"

import { useState } from "react"
import { BookOpen, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { InsightResponse } from "@/types/api"

export interface InsightCardProps {
  keyword: string;
  insight: InsightResponse;
  onBack?: () => void;
}

type ActiveTab = "definition" | "culture"

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
  data: InsightResponse
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

export default function InsightCard({ keyword, insight, onBack }: InsightCardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("definition")

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
            <Badge variant="secondary">{insight.language}</Badge>
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
      </CardContent>
    </Card>
  )
}
