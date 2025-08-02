import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const isIOS = () => {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // Also check for iPad on iOS 13+
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

export const usePWA = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSafariInstallPrompt, setShowSafariInstallPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle Safari install prompt
  useEffect(() => {
    if (isIOS() && !window.navigator.standalone) {
      const hasDismissed = localStorage.getItem('safari-install-prompt-dismissed');
      if (!hasDismissed) {
        setShowSafariInstallPrompt(true);
      }
    }
  }, []);

  // Show update prompt when needed
  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
      return true;
    }
    
    return false;
  };

  const updateApp = () => {
    updateServiceWorker(true);
    setShowUpdatePrompt(false);
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  const dismissOfflineReady = () => {
    setOfflineReady(false);
  };

  const dismissSafariInstallPrompt = useCallback(() => {
    localStorage.setItem('safari-install-prompt-dismissed', 'true');
    setShowSafariInstallPrompt(false);
  }, []);

  return {
    // Update functionality
    showUpdatePrompt,
    updateApp,
    dismissUpdate,
    
    // Install functionality
    isInstallable,
    installApp,
    
    // Offline functionality
    offlineReady,
    dismissOfflineReady,

    // Safari specific
    showSafariInstallPrompt,
    dismissSafariInstallPrompt,
  };
};
