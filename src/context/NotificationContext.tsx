import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import api from '../api/axios';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
  requestPermission: () => Promise<boolean>;
  isPushSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') subscribeToPush();
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      subscribeToPush();
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Try to subscribe to push
          subscribeToPush();
        }
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }, []);

  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from server
      const { data } = await api.get('/notifications/vapid-key');
      const publicVapidKey = data.publicKey;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      
      // Send subscription to server
      await api.post('/notifications/subscribe', subscription);
      console.log('Push subscription successful');
    } catch (err) {
      console.error('Push subscription error:', err);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const showNativeNotification = useCallback((message: string, type: NotificationType) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = type === 'success' ? '/success-icon.png' : type === 'error' ? '/error-icon.png' : '/info-icon.png';
      new Notification('Lumie Store', {
        body: message,
        icon: icon,
        badge: '/favicon.svg',
        tag: 'lumie-notification' // Prevent overlapping
      });
    }
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Also show native browser notification if permitted
    if (Notification.permission === 'granted') {
      showNativeNotification(message, type);
    } else if (Notification.permission !== 'denied') {
      requestPermission().then(granted => {
        if (granted) showNativeNotification(message, type);
      });
    }

    // Auto remove after 5 seconds
    setTimeout(() => removeNotification(id), 5000);
  }, [removeNotification, showNativeNotification, requestPermission]);

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      requestPermission, 
      isPushSupported: 'serviceWorker' in navigator && 'PushManager' in window 
    }}>
      {children}
      
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px'
      }}>
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="animate-slide-in-right"
            style={{
              background: 'rgba(20, 20, 30, 0.75)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${
                n.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : n.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'
              }`,
              padding: '16px',
              borderRadius: '20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: `0 20px 40px ${n.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : n.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'}`,
              animation: 'slideInRight 0.3s forwards'
            }}
          >
            <div style={{ color: n.type === 'success' ? '#10b981' : n.type === 'error' ? '#ef4444' : '#3b82f6' }}>
              {n.type === 'success' && <CheckCircle2 size={24} />}
              {n.type === 'error' && <AlertCircle size={24} />}
              {n.type === 'info' && <Info size={24} />}
            </div>
            
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
              {n.message}
            </div>
            
            <button 
              onClick={() => removeNotification(n.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
