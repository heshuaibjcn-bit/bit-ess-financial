/**
 * PWA Utilities and Hooks
 */

import { useState, useEffect } from 'react';

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}

/**
 * Hook for PWA install prompt
 */
export function usePWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isPWAInstalled());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    return true;
  };

  return {
    canShowPrompt: !!deferredPrompt && !isInstalled,
    promptInstall,
    isInstalled,
  };
}

/**
 * Hook for background sync
 */
export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const syncData = async (tag: string, data: any) => {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      setSyncStatus('syncing');

      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);

        // Store data for when sync happens
        const cache = await caches.open('background-sync-data');
        await cache.put(`${tag}-${Date.now()}`, new Response(JSON.stringify(data)));

        setSyncStatus('success');
      } catch (error) {
        console.error('Background sync failed:', error);
        setSyncStatus('error');
      }
    }
  };

  return {
    syncStatus,
    syncData,
  };
}

/**
 * Hook for app update
 */
export function useAppUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdateReady, setIsUpdateReady] = useState(false);

  useEffect(() => {
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          type: 'module',
        });

        // Check for updates
        registration.addEventListener('updatefound', (event) => {
          console.log('[PWA] New content is downloading; please refresh...');
        });

        registration.addEventListener('controllerchange', () => {
          console.log('[PWA] Content is now available for use!');
        });

        // Check for waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setIsUpdateReady(true);
        }
      }
    };

    registerSW();
  }, []);

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setWaitingWorker(null);
      setIsUpdateReady(false);
      window.location.reload();
    }
  };

  return {
    isUpdateReady,
    updateApp,
  };
}

/**
 * Hook for media query (responsive design)
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook for viewport size
 */
export function useViewport() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}

/**
 * Hook for touch detection
 */
export function useTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => {
      window.removeEventListener('touchstart', checkTouch);
    };
  }, []);

  return isTouch;
}

/**
 * PWA Install Component
 */
export function PWAInstallPrompt() {
  const { canShowPrompt, promptInstall, isInstalled } = usePWAPrompt();

  if (!canShowPrompt || isInstalled) {
    return null;
  }

  return (
    <button
      onClick={promptInstall}
      className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8-4-4 4 4 4-4m4 4v4" />
      </svg>
      <span>安装应用</span>
    </button>
  );
}

/**
 * Offline Status Component
 */
export function OfflineStatus() {
  const { isOnline, isOffline } = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-sm font-medium z-50 flex items-center justify-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m-5.464 5.464l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0m-9 9v-9m0 9a9 9 0 019-9m0 9v9m0 9a9 9 0 019-9" />
      </svg>
      <span>离线模式 - 部分功能可能受限</span>
    </div>
  );
}

/**
 * App Update Component
 */
export function AppUpdatePrompt() {
  const { isUpdateReady, updateApp } = useAppUpdate();

  if (!isUpdateReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 15m-15.356 2A8.001 8.001 0 004.582 15m0 0V9m0 0v9" />
        </svg>
        <span className="font-medium">新版本可用</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={updateApp}
          className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-green-50 transition-colors"
        >
          更新
        </button>
        <button
          onClick={() => {
            const el = document.querySelector('[data-update-prompt]') as HTMLElement;
            if (el) el.style.display = 'none';
          }}
          className="text-green-100 hover:text-white transition-colors"
        >
          忽略
        </button>
      </div>
    </div>
  );
}