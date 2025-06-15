export interface Language {
  value: string;
  label: string;
  nativeName: string; // 用于API调用时的语言名称
}

// 核心支持的语言（完全支持，包括prompt模板）
export const CORE_LANGUAGES: Language[] = [
  { value: 'zh', label: '中文', nativeName: '中文' },
  { value: 'en', label: 'English', nativeName: 'English' },
  { value: 'ja', label: '日本語', nativeName: '日本語' },
  { value: 'ko', label: '한국어', nativeName: '한국어' },
];

// 扩展支持的语言（UI显示，但API调用时使用英文prompt）
export const EXTENDED_LANGUAGES: Language[] = [
  ...CORE_LANGUAGES,
  { value: 'es', label: 'Español', nativeName: 'Español' },
  { value: 'fr', label: 'Français', nativeName: 'Français' },
  { value: 'de', label: 'Deutsch', nativeName: 'Deutsch' },
  { value: 'pt', label: 'Português', nativeName: 'Português' },
];

// API prompt模板支持的语言代码
export const SUPPORTED_PROMPT_LANGUAGES = CORE_LANGUAGES.map(lang => lang.value);

// 根据语言代码获取原生名称（用于API指令）
export function getLanguageNativeName(languageCode: string): string {
  const language = EXTENDED_LANGUAGES.find(lang => lang.value === languageCode);
  return language?.nativeName ?? '中文';
}

// 根据语言代码获取显示标签
export function getLanguageLabel(languageCode: string): string {
  const language = EXTENDED_LANGUAGES.find(lang => lang.value === languageCode);
  return language?.label ?? '中文';
}

// 检查是否为核心支持的语言
export function isCoreLanguage(languageCode: string): boolean {
  return SUPPORTED_PROMPT_LANGUAGES.includes(languageCode);
} 