import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { UserPlus, User, Lock, Mail, ArrowRight } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        username,
        email,
        password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-icon-box">
            <UserPlus size={32} />
          </div>
          <h2 className="auth-title">Tham gia ngay</h2>
          <p className="auth-subtitle">Tạo tài khoản để bắt đầu mua sắm</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: '#ef4444', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            color: 'var(--accent-primary)', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            Đăng ký thành công! Đang chuyển hướng...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <div className="input-icon-wrapper">
              <div className="icon"><User size={20} /></div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nhập tên đăng nhập" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email (tùy chọn)</label>
            <div className="input-icon-wrapper">
              <div className="icon"><Mail size={20} /></div>
              <input 
                type="email" 
                className="form-control" 
                placeholder="email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-icon-wrapper">
              <div className="icon"><Lock size={20} /></div>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Mật khẩu ít nhất 6 ký tự" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu</label>
            <div className="input-icon-wrapper">
              <div className="icon"><Lock size={20} /></div>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Nhập lại mật khẩu" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.05rem' }}
            disabled={loading || success}
          >
            {loading ? 'Đang tạo tài khoản...' : (
              <>Tạo tài khoản <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
