import { storageService } from "@/services/storage";
import { useCallback, useState } from "react";
import { AppFooter, AppHeader } from "@/components/layout";
import { SettingsDrawer } from "@/components/onboarding/SettingsDrawer";

export default function SidePanelApp() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)

  const handleOnboardingComplete = useCallback(async () => {
    await storageService.setOnboardingComplete(true);
    setIsOnboardingComplete(true);
  }, []);

  if (!isOnboardingComplete) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <AppHeader onOnboardingComplete={handleOnboardingComplete} />
        <div className="flex-grow flex items-center justify-center p-6">
          <SettingsDrawer onOnboardingComplete={handleOnboardingComplete} />
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AppHeader onOnboardingComplete={handleOnboardingComplete} />
      <div className="flex-grow flex items-center justify-center p-6">
        <p>Onboarding is complete! Main app content goes here.</p>
      </div>
      <AppFooter />
    </div>
  )
} 