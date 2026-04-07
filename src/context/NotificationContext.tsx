import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => removeNotification(id), 5000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
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
