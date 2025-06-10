"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"

interface LanguageSelectorProps {
  onSave?: () => void
}

interface Language {
  value: string
  label: string
}

const LANGUAGES: Language[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ko", label: "한국어" },
  { value: "pt", label: "Português" },
]

export default function LanguageSelector({ onSave }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isSaved, setIsSaved] = useState<boolean>(false)

  // 模拟从 chrome.storage.local 加载已保存的语言设置
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        // 在实际 Chrome 扩展中，这里会使用 chrome.storage.local.get
        const saved = localStorage.getItem("defaultLanguage")
        if (saved) {
          setSelectedLanguage(saved)
          setIsSaved(true)
        } else {
          // 默认选择英语
          setSelectedLanguage("en")
        }
      } catch (error) {
        console.error("Failed to load saved language:", error)
        setSelectedLanguage("en")
      }
    }

    loadSavedLanguage()
  }, [])

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
    setIsSaved(false)
  }

  const handleSave = async () => {
    if (!selectedLanguage) return

    setIsSaving(true)

    try {
      // 模拟保存延迟
      await new Promise((resolve) => setTimeout(resolve, 800))

      // 在实际 Chrome 扩展中，这里会使用 chrome.storage.local.set
      localStorage.setItem("defaultLanguage", selectedLanguage)

      setIsSaved(true)
      onSave?.()
    } catch (error) {
      console.error("Failed to save language setting:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedLanguageLabel = LANGUAGES.find((lang) => lang.value === selectedLanguage)?.label || ""

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">语言设置</h2>
        <p className="text-gray-600">选择您希望用于分析结果的默认语言</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language-select" className="text-sm font-medium text-gray-700">
            请选择分析结果的默认语言 (Select default language for analysis)
          </Label>

          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择语言 / Select Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  <div className="flex items-center gap-2">
                    <span>{language.label}</span>
                    {selectedLanguage === language.value && isSaved && <Check className="w-4 h-4 text-green-600" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLanguage && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">已选择:</span> {selectedLanguageLabel}
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={!selectedLanguage || isSaving || isSaved}
          className={`w-full ${isSaved ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>保存中...</span>
            </div>
          ) : isSaved ? (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>已保存</span>
            </div>
          ) : (
            "保存设置"
          )}
        </Button>
      </div>

      {isSaved && (
        <div className="text-center">
          <p className="text-sm text-green-600 font-medium">✓ 语言设置已成功保存</p>
        </div>
      )}
    </div>
  )
}
