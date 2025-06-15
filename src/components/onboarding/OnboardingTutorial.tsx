import React from 'react';
import { Button } from '../ui/button';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">快速入门</h2>
      <div className="mb-4 bg-gray-200 rounded-lg flex items-center justify-center h-64">
        {/* GIF 占位图 */}
        <p className="text-gray-500">教程 GIF 动画</p>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        观看上面的动画，快速了解如何在 Google Trends 页面上使用 LexiTrend。
      </p>
      <Button onClick={onComplete} className="w-full">
        完成并开始使用
      </Button>
    </div>
  );
}; 