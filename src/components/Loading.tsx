import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Đang xử lý...', fullScreen = false }) => {
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '40px'
    }}>
      <Loader2 className="spinner" size={32} color="var(--accent-primary)" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
