import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/globals.css';

const PopupApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const openSidePanel = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // 获取当前活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (!activeTab?.id) {
        setMessage('无法获取当前标签页');
        return;
      }

      // 发送消息给background script打开侧边栏
      const response = await chrome.runtime.sendMessage({
        type: 'OPEN_SIDE_PANEL'
      });

      if (response.success) {
        setMessage('侧边栏已打开！');
        // 关闭popup
        setTimeout(() => window.close(), 1000);
      } else {
        setMessage(`打开失败: ${response.error}`);
      }
    } catch (error) {
      setMessage(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 p-4 space-y-4">
      
      <div className="space-y-3">
        <button
          onClick={openSidePanel}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? '正在打开...' : '打开侧边栏'}
        </button>
        
        {message && (
          <div className={`text-sm p-2 rounded ${
            message.includes('错误') || message.includes('失败') 
              ? 'bg-red-50 text-red-600' 
              : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 border-t pt-3">
        💡 提示：也可以右键点击扩展图标 → "在侧边栏中打开"
      </div>
    </div>
  );
};

const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
} 