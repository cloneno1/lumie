import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Register: React.FC = () => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'discord' | 'google') => {
    setLoadingProvider(provider);
    try {
      const response = await api.get(`/auth/${provider}/url`);
      window.location.href = response.data.url;
    } catch (err) {
      alert(`Lỗi khi kết nối với ${provider}`);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '560px', 
        padding: '60px 40px',
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        borderRadius: '24px'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '900', 
          color: 'white', 
          lineHeight: '1.2',
          marginBottom: '15px'
        }}>
          Bạn muốn có câu trả lời cho câu hỏi của mình?
        </h1>
        
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          color: '#84cc16', 
          marginBottom: '40px'
        }}>
          Hãy tạo tài khoản miễn phí với:
        </h2>

        <div className="auth-choices" style={{ gap: '25px', marginBottom: '40px' }}>
          {/* Discord Choice */}
          <div 
            className={`auth-choice-item ${loadingProvider === 'discord' ? 'active' : ''}`}
            onClick={() => handleSocialLogin('discord')}
            style={{ width: '100px', height: '100px' }}
          >
            <div className="auth-choice-icon" style={{ width: '40px', height: '40px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2914a.077.077 0 01-.0066.1277 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3333-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3333-.946 2.4189-2.1568 2.4189z" />
              </svg>
            </div>
            <span className="auth-choice-label" style={{ fontSize: '14px' }}>Discord</span>
          </div>

          {/* Email / Google Choice */}
          <div 
            className={`auth-choice-item ${loadingProvider === 'google' ? 'active' : ''}`}
            onClick={() => handleSocialLogin('google')}
            style={{ width: '100px', height: '100px' }}
          >
            <div className="auth-choice-icon" style={{ width: '40px', height: '40px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#10b981">
                 <circle cx="12" cy="8" r="4" />
                 <path d="M12 14c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
              </svg>
            </div>
            <span className="auth-choice-label" style={{ fontSize: '14px' }}>Email</span>
          </div>
        </div>

        <div className="auth-footer-text" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Hoặc nếu đã có tài khoản <Link to="/login" style={{ color: '#84cc16', fontWeight: '700', textDecoration: 'underline' }}>Hãy đăng nhập ngay!</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
