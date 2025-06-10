"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp, Settings } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import InsightCard from "./insight-card"
import { useToast } from "./toast-provider"

interface ChromeMessage {
  type: string
  payload?: any
}

export default function SidePanelApp() {
  const [currentKeyword, setCurrentKeyword] = useState<string | null>(null)
  const { showToast } = useToast()

  // 模拟 Chrome 扩展消息监听
  useEffect(() => {
    // 在实际 Chrome 扩展中，这里会使用 chrome.runtime.onMessage.addListener
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const message: ChromeMessage = event.data

      if (message.type === "NEW_KEYWORD" && message.payload) {
        const keyword = message.payload.trim()
        if (keyword) {
          setCurrentKeyword(keyword)
          showToast(`开始分析关键词: "${keyword}"`, "success")
        }
      }
    }

    // 模拟消息监听（在实际扩展中会是 chrome.runtime.onMessage）
    window.addEventListener("message", messageListener)

    // 模拟接收到关键词的情况（用于演示）
    const simulateKeywordReceived = () => {
      setTimeout(() => {
        const demoKeywords = ["人工智能", "可持续发展", "区块链", "元宇宙", "量子计算"]
        const randomKeyword = demoKeywords[Math.floor(Math.random() * demoKeywords.length)]

        window.postMessage(
          {
            type: "NEW_KEYWORD",
            payload: randomKeyword,
          },
          window.location.origin,
        )
      }, 2000)
    }

    // 仅在演示环境中自动触发
    if (process.env.NODE_ENV === "development") {
      simulateKeywordReceived()
    }

    // 清理函数
    return () => {
      window.removeEventListener("message", messageListener)
    }
  }, [showToast])

  // 手动设置关键词（用于测试）
  const handleManualKeyword = (keyword: string) => {
    setCurrentKeyword(keyword)
    showToast(`手动设置关键词: "${keyword}"`, "success")
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 头部区域 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">LexiTrend</h1>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto p-4">
        {currentKeyword ? (
          <div className="space-y-4">
            {/* 当前分析的关键词显示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">正在分析:</span>
                <span className="text-sm font-semibold">{currentKeyword}</span>
              </div>
            </div>

            {/* 洞察卡片 */}
            <InsightCard keyword={currentKeyword} />
          </div>
        ) : (
          /* 欢迎界面 */
          <div className="h-full flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">欢迎使用 LexiTrend</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    请在 Google Trends 页面上选择一个关键词来开始分析，或者点击下方按钮进行演示。
                  </p>
                </div>

                {/* 演示按钮 */}
                <div className="space-y-2 pt-4">
                  <p className="text-xs text-gray-500">演示关键词:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["人工智能", "可持续发展", "区块链"].map((keyword) => (
                      <Button
                        key={keyword}
                        variant="outline"
                        size="sm"
                        onClick={() => handleManualKeyword(keyword)}
                        className="text-xs"
                      >
                        {keyword}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* 底部状态栏 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>LexiTrend v1.0</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>已连接</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
