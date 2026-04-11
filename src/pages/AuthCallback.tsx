import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC<{ provider: 'discord' | 'google' }> = ({ provider }) => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = React.useRef(false);
  const { login } = useAuth();

  useEffect(() => {
    if (hasRun.current) return;
    const handleCallback = async () => {
      hasRun.current = true;
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (!code) {
        setError('Không tìm thấy mã xác thực.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const endpoint = provider === 'discord' ? '/auth/discord/callback' : '/auth/google/callback';
        const response = await api.post(endpoint, { code });
        login(response.data.token, response.data.user);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.message || `Lỗi khi xác thực với ${provider}.`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [location, login, navigate, provider]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center' 
    }}>
      <div className="glass-card" style={{ padding: '40px', maxWidth: '400px' }}>
        {error ? (
          <>
            <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '1.2rem' }}>❌ Lỗi đăng nhập</div>
            <p>{error}</p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '10px' }}>Đang quay lại trang đăng nhập...</p>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-primary)', marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Đang xác thực...</h2>
            <p style={{ color: '#94a3b8' }}>Vui lòng đợi giây lát trong khi chúng tôi kết nối với {provider === 'discord' ? 'Discord' : 'Google'}.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
