"use client"

import { useState, useEffect } from "react"
import { AlertCircle, BookOpen, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import SkeletonLoader from "./skeleton-loader"

interface InsightCardProps {
  keyword: string
}

type FetchState = "idle" | "loading" | "loaded" | "error"
type ActiveTab = "definition" | "culture"

interface InsightData {
  keyword: string
  definition: {
    meaning: string
    etymology: string
    usage: string[]
  }
  culture: {
    origin: string
    significance: string
    modernUsage: string
    relatedTerms: string[]
  }
  timestamp: number
}

// 模拟 IndexedDB 缓存
class InsightCache {
  private static CACHE_KEY = "lexitrend_insights"
  private static CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

  static async get(keyword: string): Promise<InsightData | null> {
    try {
      const cached = localStorage.getItem(`${this.CACHE_KEY}_${keyword}`)
      if (!cached) return null

      const data: InsightData = JSON.parse(cached)
      const now = Date.now()

      // 检查缓存是否过期
      if (now - data.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(`${this.CACHE_KEY}_${keyword}`)
        return null
      }

      return data
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  static async set(keyword: string, data: InsightData): Promise<void> {
    try {
      localStorage.setItem(`${this.CACHE_KEY}_${keyword}`, JSON.stringify(data))
    } catch (error) {
      console.error("Cache set error:", error)
    }
  }
}

// 模拟 Gemini API 调用
const fetchInsightFromAPI = async (keyword: string): Promise<InsightData> => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // 模拟 API 响应数据
  const mockData: InsightData = {
    keyword,
    definition: {
      meaning: `"${keyword}" 是一个具有深层含义的词汇，在现代语境中被广泛使用。它代表了特定的概念或现象，具有重要的语言学价值。`,
      etymology: `该词汇的词源可以追溯到古代语言系统，经过历史演变形成了现在的形式。其构词方式体现了语言的发展规律。`,
      usage: [
        `在学术文献中，"${keyword}" 常用于描述特定现象`,
        `日常对话中，人们用它来表达相关概念`,
        `媒体报道中经常出现这个词汇`,
        `专业领域将其作为术语使用`,
      ],
    },
    culture: {
      origin: `"${keyword}" 这个概念起源于特定的文化背景，反映了当时社会的价值观和思维方式。`,
      significance: `在文化层面上，这个词汇承载着丰富的内涵，代表了人们对某种现象的集体认知和情感态度。`,
      modernUsage: `在当代社会中，"${keyword}" 的使用已经超越了原始含义，成为了表达复杂概念的重要工具。`,
      relatedTerms: [`相关概念A`, `相关概念B`, `相关概念C`, `相关概念D`],
    },
    timestamp: Date.now(),
  }

  return mockData
}

function ErrorView({ keyword, onRetry }: { keyword: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8 space-y-4">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
      <div>
        <h3 className="text-lg font-semibold text-gray-900">获取洞察失败</h3>
        <p className="text-gray-600">无法获取关键词 "{keyword}" 的分析结果</p>
      </div>
      <Button onClick={onRetry} variant="outline">
        重试
      </Button>
    </div>
  )
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
  data: InsightData
  activeTab: ActiveTab
}) {
  if (activeTab === "definition") {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">含义</h4>
          <p className="text-gray-700 leading-relaxed">{data.definition.meaning}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">词源</h4>
          <p className="text-gray-700 leading-relaxed">{data.definition.etymology}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">使用场景</h4>
          <ul className="space-y-1">
            {data.definition.usage.map((usage, index) => (
              <li key={index} className="text-gray-700 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{usage}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">起源</h4>
        <p className="text-gray-700 leading-relaxed">{data.culture.origin}</p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">文化意义</h4>
        <p className="text-gray-700 leading-relaxed">{data.culture.significance}</p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">现代用法</h4>
        <p className="text-gray-700 leading-relaxed">{data.culture.modernUsage}</p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">相关概念</h4>
        <div className="flex flex-wrap gap-2">
          {data.culture.relatedTerms.map((term, index) => (
            <Badge key={index} variant="secondary">
              {term}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function InsightCard({ keyword }: InsightCardProps) {
  const [fetchState, setFetchState] = useState<FetchState>("idle")
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("definition")

  const fetchInsight = async (keyword: string) => {
    if (!keyword.trim()) return

    setFetchState("loading")

    try {
      // 首先检查缓存
      const cachedData = await InsightCache.get(keyword)

      if (cachedData) {
        setInsightData(cachedData)
        setFetchState("loaded")
        return
      }

      // 缓存未命中，调用 API
      const data = await fetchInsightFromAPI(keyword)

      // 保存到缓存
      await InsightCache.set(keyword, data)

      setInsightData(data)
      setFetchState("loaded")
    } catch (error) {
      console.error("Failed to fetch insight:", error)
      setFetchState("error")
    }
  }

  useEffect(() => {
    if (keyword) {
      fetchInsight(keyword)
    }
  }, [keyword])

  const handleRetry = () => {
    fetchInsight(keyword)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>关键词洞察</span>
          {keyword && (
            <Badge variant="outline" className="text-sm">
              {keyword}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {fetchState === "loading" && <SkeletonLoader />}

        {fetchState === "error" && <ErrorView keyword={keyword} onRetry={handleRetry} />}

        {fetchState === "loaded" && insightData && (
          <>
            <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
            <ContentView data={insightData} activeTab={activeTab} />
          </>
        )}

        {fetchState === "idle" && <div className="text-center py-8 text-gray-500">请输入关键词以获取洞察分析</div>}
      </CardContent>
    </Card>
  )
}
