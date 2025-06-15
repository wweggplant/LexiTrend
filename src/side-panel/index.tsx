import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanelApp from '@/components/side-panel-app';
import { ToastProvider } from '@/components/toast-provider';
import '@/styles/globals.css';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <SidePanelApp />
    </ToastProvider>
  );
};

const container = document.getElementById('sidepanel-root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} 