"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsDrawer } from './onboarding/SettingsDrawer'

export const AppHeader: React.FC<{ onOnboardingComplete: () => void }> = ({ onOnboardingComplete }) => (
  <header className="flex items-center justify-between p-4 border-b bg-white">
    <div className="flex items-center space-x-2">
      <img src="/web-app-manifest-192x192.png" alt="LexiTrend Logo" className="w-6 h-6" />
      <h1 className="text-lg font-semibold">LexiTrend</h1>
    </div>
    <SettingsDrawer onOnboardingComplete={onOnboardingComplete}>
      <Button variant="ghost" size="icon">
        <Settings className="h-5 w-5" />
      </Button>
    </SettingsDrawer>
  </header>
)

export const AppFooter: React.FC = () => (
    <footer className="p-2 border-t text-xs text-center text-gray-500 bg-white">
        LexiTrend v1.0.0
    </footer>
) 