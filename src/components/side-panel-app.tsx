"use client"

import { useState, useEffect } from "react"
import { Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import InsightCard from "./insight-card"
import EnhancedInsightCard from "./enhanced-insight-card"
import { useToast } from "./toast-provider"
import { ApiKeyForm } from './onboarding/ApiKeyForm'
import { storageService, apiService as apiServicePromise } from '../services'
import type { ApiService } from '../services/api'
import type { InsightResponse } from '../types/api'
import type { EnhancedInsightResponse } from '../types/tavily'
import { Skeleton } from "@/components/ui/skeleton"
import { SettingsDrawer } from "./onboarding/SettingsDrawer"

// --- Re-integrated Layout Components to resolve import issue ---
const AppHeader: React.FC<{ onOnboardingComplete: () => void }> = ({ onOnboardingComplete }) => (
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
  );
  
const AppFooter: React.FC = () => (
    <footer className="p-2 border-t text-xs text-center text-gray-500 bg-white">
        LexiTrend v1.0.0
    </footer>
);
// --- End of Layout Components ---

const WelcomeScreen: React.FC = () => (
    <Card className="w-full">
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">请选择关键词</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            请在 Google Trends 页面上选择一个关键词来开始分析。
          </p>
        </div>
      </CardContent>
    </Card>
);
  
const LoadingSkeleton: React.FC = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-4 space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
);

export default function SidePanelApp() {
    const [currentKeyword, setCurrentKeyword] = useState<string | null>(null)
    const [insight, setInsight] = useState<InsightResponse | EnhancedInsightResponse | null>(null)
    const { showToast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchError, setSearchError] = useState<string | undefined>(undefined)
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
    const [useEnhancedAnalysis] = useState(true)
    const [apiService, setApiService] = useState<ApiService | null>(null);
  
    const handleOnboardingComplete = () => {
      setIsOnboardingComplete(true);
    };

    const fetchInsight = async (keyword: string) => {
        if (!isOnboardingComplete || !apiService) return;
  
        setIsLoading(true);
        setError(null);
        setSearchError(undefined);
        setInsight(null);
  
        try {
          const userSettings = await storageService.getSettings();
          
          // 始终使用增强分析，不再有回退
          const response = await apiService.analyzeKeywordEnhanced(keyword, userSettings.language);
          setInsight(response);
          showToast("增强分析成功！", "success");
          
        } catch (e: unknown) {
          const err = e as Error;
          const errorMessage = err.message || "分析时发生未知错误。";
          console.error('Analysis failed:', err);
          setError(errorMessage);
          showToast(errorMessage, "error");
        } finally {
          setIsLoading(false);
        }
    };

    const handleRetrySearch = async () => {
      if (currentKeyword) {
        setSearchError(undefined);
        await fetchInsight(currentKeyword);
      }
    };
  
    useEffect(() => {
      const initializeApp = async () => {
        const resolvedApiService = await apiServicePromise;
        setApiService(resolvedApiService);

        const complete = await storageService.isOnboardingComplete();
        setIsOnboardingComplete(complete);
      };
      initializeApp();
    }, []);

    useEffect(() => {
      if (!apiService) return; // Guard: wait for apiService to be ready

      // This listener handles subsequent keyword analyses when the panel is already open.
      const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local' && changes.analyzingKeyword) {
          const newKeyword = changes.analyzingKeyword.newValue;
          if (newKeyword) {
            setCurrentKeyword(newKeyword);
            // Clear the storage immediately to prevent re-triggering.
            chrome.storage.local.remove('analyzingKeyword');
          }
        }
      };
      
      chrome.storage.onChanged.addListener(storageListener);

      // This handles the case where the panel is opened for the first time.
      chrome.storage.local.get(['analyzingKeyword'], (result) => {
        if (result.analyzingKeyword) {
          setCurrentKeyword(result.analyzingKeyword);
          chrome.storage.local.remove(['analyzingKeyword']);
        }
      });
  
      return () => {
        chrome.storage.onChanged.removeListener(storageListener);
      };
    }, [apiService]); // This effect now runs when apiService is initialized
  
    useEffect(() => {
      if (currentKeyword && isOnboardingComplete && apiService) {
        fetchInsight(currentKeyword);
      }
    }, [currentKeyword, isOnboardingComplete, apiService]);
  
  
    if (!isOnboardingComplete) {
      return (
        <div className="flex flex-col h-screen bg-gray-50">
          <AppHeader onOnboardingComplete={handleOnboardingComplete} />
          <div className="flex-grow flex items-center justify-center p-6">
            <ApiKeyForm onComplete={handleOnboardingComplete} />
          </div>
          <AppFooter />
        </div>
      )
    }
  
    const renderContent = () => {
      if (isLoading) {
        return <LoadingSkeleton />;
      }
  
      if (error) {
        return (
          <Card className="w-full bg-red-50 border-red-200">
            <CardContent className="p-6 text-center text-red-700 space-y-4">
              <h2 className="text-xl font-semibold">分析失败</h2>
              <p>{error}</p>
              <Button variant="destructive" onClick={() => currentKeyword && fetchInsight(currentKeyword)}>
                重试
              </Button>
            </CardContent>
          </Card>
        );
      }
  
      if (insight && currentKeyword) {
        // 检查是否是增强的洞察响应
        const isEnhanced = 'searchMetadata' in insight;
        
        if (isEnhanced || useEnhancedAnalysis) {
          return (
            <EnhancedInsightCard
              insight={insight}
              keyword={currentKeyword}
              isLoading={isLoading}
              searchError={searchError}
              onRetrySearch={handleRetrySearch}
              onBack={() => {
                setCurrentKeyword(null);
                setInsight(null);
                setSearchError(undefined);
              }}
            />
          );
        } else {
          return (
            <InsightCard
              insight={insight as InsightResponse}
              keyword={currentKeyword}
              onBack={() => {
                setCurrentKeyword(null);
                setInsight(null);
              }}
            />
          );
        }
      }
      
      return <WelcomeScreen />;
    };
  
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <AppHeader onOnboardingComplete={handleOnboardingComplete} />
        <main className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </main>
        <AppFooter />
      </div>
    )
}
