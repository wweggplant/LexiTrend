import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { ApiKeyForm } from './ApiKeyForm';
import { OnboardingTutorial } from './OnboardingTutorial';
import { Button } from '../ui/button';
import { storageService } from '../../services';

interface SettingsDrawerProps {
  children?: React.ReactNode;
  onOnboardingComplete: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ children, onOnboardingComplete }) => {
  const [step, setStep] = useState<'config' | 'tutorial'>('config');
  const [open, setOpen] = useState(false);

  const handleConfigComplete = () => {
    console.log('handleConfigComplete');
    setStep('tutorial');
  };

  const handleTutorialComplete = () => {
    onOnboardingComplete();
    setOpen(false);
  };

  const handleReset = async () => {
    await storageService.clearAll();
    window.location.reload();
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>应用设置</DrawerTitle>
            <DrawerDescription>在这里配置您的应用和 API 设置。</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            {step === 'config' ? (
              <ApiKeyForm onComplete={handleConfigComplete} />
            ) : (
              <OnboardingTutorial onComplete={handleTutorialComplete} />
            )}
          </div>
          <div className="p-4">
            <Button variant="destructive" onClick={handleReset} className="w-full">
              重置应用 (仅开发模式)
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}; 