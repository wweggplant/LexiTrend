import React, { useState, useCallback, useEffect } from 'react';
import { storageService, apiService as apiServicePromise } from '../../services';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CORE_LANGUAGES } from '../../constants/languages';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import type { ApiService } from '../../services/api';

export interface ApiKeyFormProps {
  onComplete: () => void;
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onComplete }) => {
  const [apiService, setApiService] = useState<ApiService | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [tavilyApiKey, setTavilyApiKey] = useState('');
  const [language, setLanguage] = useState('zh');
  const [searchEnabled, setSearchEnabled] = useState(false);

  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [geminiErrorMessage, setGeminiErrorMessage] = useState('');

  const [tavilyStatus, setTavilyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [tavilyErrorMessage, setTavilyErrorMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const resolvedApiService = await apiServicePromise;
      setApiService(resolvedApiService);

      const [geminiKey, tavilyKey, lang, searchStatus] = await Promise.all([
        storageService.getApiKey(),
        storageService.getTavilyApiKey(),
        storageService.getLanguage(),
        storageService.getSearchEnabled(),
      ]);
      if (geminiKey) {
        setGeminiApiKey(geminiKey);
        setGeminiStatus('success');
      }
      if (tavilyKey) {
        setTavilyApiKey(tavilyKey);
        // We assume a stored key is valid to avoid re-validation on every open.
        // User can re-validate if they suspect an issue.
        setTavilyStatus('success');
      }
      setLanguage(lang);
      setSearchEnabled(searchStatus);
    };
    loadSettings();
  }, []);

  const handleLanguageChange = useCallback(async (newLang: string) => {
    setLanguage(newLang);
    await storageService.setLanguage(newLang);
  }, []);
  
  const handleSearchEnabledChange = useCallback(async (enabled: boolean) => {
    setSearchEnabled(enabled);
    await storageService.setSearchEnabled(enabled);
  }, []);

  const validateAndSaveGemini = useCallback(async () => {
    if (!geminiApiKey.trim() || !apiService) return;
    
    setGeminiStatus('loading');
    setGeminiErrorMessage('');
    
    try {
      const isValid = await apiService.validateApiKey(geminiApiKey);
      
      if (isValid) {
        await storageService.setApiKey(geminiApiKey);
        setGeminiStatus('success');
      } else {
        setGeminiStatus('error');
        setGeminiErrorMessage('无效的 Gemini API 密钥，请检查后重试。');
      }
    } catch (error) {
      setGeminiStatus('error');
      const message = error instanceof Error ? error.message : '验证过程中发生未知网络错误。';
      setGeminiErrorMessage(message);
    }
  }, [geminiApiKey, apiService]);

  const validateAndSaveTavily = useCallback(async () => {
    if (!apiService) return;

    if (!tavilyApiKey.trim()) {
        await storageService.setTavilyApiKey('');
        setTavilyStatus('idle');
        setTavilyErrorMessage('');
        return;
    };
    
    setTavilyStatus('loading');
    setTavilyErrorMessage('');
    
    try {
      // This method needs to be implemented in ApiService and background script
      const isValid = await apiService.validateTavilyApiKey(tavilyApiKey);
      
      if (isValid) {
        await storageService.setTavilyApiKey(tavilyApiKey);
        setTavilyStatus('success');
      } else {
        setTavilyStatus('error');
        setTavilyErrorMessage('无效的 Tavily API 密钥，请检查后重试。');
      }
    } catch (error) {
      setTavilyStatus('error');
      const message = error instanceof Error ? error.message : '验证过程中发生未知网络错误。';
      setTavilyErrorMessage(message);
    }
  }, [tavilyApiKey, apiService]);


  const getStatusIndicator = (status: 'idle' | 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-gray-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const handleFinish = useCallback(async () => {
    await storageService.setOnboardingComplete(true);
    onComplete();
  }, [onComplete]);

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">配置 Gemini API</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="language-select" className="text-sm font-medium text-gray-700">
            结果语言
          </Label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select" className="w-full mt-1">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              {CORE_LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="gemini-api-key-input" className="text-sm font-medium text-gray-700">
            Gemini API 密钥
          </Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              id="gemini-api-key-input"
              type="password"
              value={geminiApiKey}
              onChange={(e) => {
                setGeminiApiKey(e.target.value);
                if (geminiStatus !== 'loading') setGeminiStatus('idle');
              }}
              className="flex-grow"
              placeholder="必需，用于核心分析功能"
              disabled={geminiStatus === 'loading'}
            />
            <Button onClick={validateAndSaveGemini} disabled={!geminiApiKey.trim() || geminiStatus === 'loading'}>
              {geminiStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证'}
            </Button>
            <div className="w-5 h-5 flex items-center justify-center">{getStatusIndicator(geminiStatus)}</div>
          </div>
          {geminiErrorMessage && (
            <p className="text-sm text-red-600 mt-1">{geminiErrorMessage}</p>
          )}
        </div>
      </div>
      
      <Separator className="my-6" />

      <h2 className="text-xl font-semibold mb-4 text-gray-800">配置实时搜索 (可选)</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="search-enabled-switch" className="text-sm font-medium text-gray-700">
              启用实时搜索
            </Label>
            <p className="text-xs text-gray-500">提升对新词汇的分析准确性。</p>
          </div>
          <Switch
            id="search-enabled-switch"
            checked={searchEnabled}
            onCheckedChange={handleSearchEnabledChange}
            disabled={!tavilyApiKey.trim() || tavilyStatus !== 'success'}
          />
        </div>

        <div>
          <Label htmlFor="tavily-api-key-input" className="text-sm font-medium text-gray-700">
            Tavily API 密钥
          </Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              id="tavily-api-key-input"
              type="password"
              value={tavilyApiKey}
              onChange={(e) => {
                setTavilyApiKey(e.target.value);
                if (tavilyStatus !== 'loading') setTavilyStatus('idle');
              }}
              className="flex-grow"
              placeholder="可选，用于实时网络搜索"
              disabled={tavilyStatus === 'loading'}
            />
             <Button onClick={validateAndSaveTavily} disabled={tavilyStatus === 'loading'}>
              {tavilyStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证'}
            </Button>
            <div className="w-5 h-5 flex items-center justify-center">{getStatusIndicator(tavilyStatus)}</div>
          </div>
           {tavilyErrorMessage && (
            <p className="text-sm text-red-600 mt-1">{tavilyErrorMessage}</p>
          )}
        </div>
      </div>
      
      <Separator className="my-6" />

      <Button
        onClick={handleFinish}
        disabled={geminiStatus !== 'success' || !apiService}
        className="w-full"
      >
        完成并开始使用
      </Button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        您的 API 密钥将安全地存储在您的本地浏览器中，不会上传到任何服务器。
      </p>
    </div>
  ); 
}; 