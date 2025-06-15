"use client"

import { useEffect } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToastNotificationProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export default function ToastNotification({ message, type, onClose }: ToastNotificationProps) {
  // 自动关闭逻辑
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000) // 4秒后自动关闭

    // 清理函数，防止内存泄漏
    return () => {
      clearTimeout(timer)
    }
  }, [onClose])

  // 根据类型获取样式和图标
  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-500",
          textColor: "text-white",
          icon: <CheckCircle className="w-5 h-5" />,
        }
      case "error":
        return {
          bgColor: "bg-red-500",
          textColor: "text-white",
          icon: <XCircle className="w-5 h-5" />,
        }
      default:
        return {
          bgColor: "bg-gray-500",
          textColor: "text-white",
          icon: <CheckCircle className="w-5 h-5" />,
        }
    }
  }

  const { bgColor, textColor, icon } = getToastStyles()

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        ${bgColor} ${textColor}
        px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3
        min-w-80 max-w-96
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
      `}
      role="alert"
      aria-live="polite"
    >
      {/* 图标 */}
      <div className="flex-shrink-0">{icon}</div>

      {/* 消息内容 */}
      <div className="flex-1">
        <p className="text-sm font-medium leading-relaxed">{message}</p>
      </div>

      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className={`
          ${textColor} hover:bg-white/20 
          p-1 h-auto w-auto
          flex-shrink-0
        `}
        aria-label="关闭通知"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
