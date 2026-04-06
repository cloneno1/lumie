import React, { useState } from 'react';
import api from '../api/axios';

const GoogleButton: React.FC<{ text?: string }> = ({ text = "Đăng nhập với Google" }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/google/url');
      window.location.href = response.data.url;
    } catch (err) {
      console.error('Không thể lấy URL Google:', err);
      alert('Lỗi hệ thống hoặc thiếu cấu hình Google Client ID.');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGoogleLogin}
      disabled={loading}
      className="btn"
      style={{ 
        width: '100%', 
        padding: '12px', 
        marginBottom: '10px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '12px', 
        background: 'white', 
        color: '#334155',
        border: '1px solid #e2e8f0',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? 'Đang chuẩn bị...' : text}
    </button>
  );
};

export default GoogleButton;
