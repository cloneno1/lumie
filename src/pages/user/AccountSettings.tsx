import React, { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Settings, User, Package, Camera, Lock, Save, Loader2, XCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const AccountSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const response = await api.post('/user/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatar(response.data.avatar);
      showNotification('Tải ảnh lên thành công!', 'success');
      await refreshUser();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi tải ảnh';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!username.trim()) return showNotification('Tên hiển thị không được để trống', 'error');
    if (!validateEmail(email)) return showNotification('Định dạng email không hợp lệ', 'error');
    
    if (user?.has_password && !currentPassword) {
      return showNotification('Vui lòng nhập mật khẩu hiện tại để xác thực', 'error');
    }
    
    if (newPassword) {
      if (newPassword.length < 6) return showNotification('Mật khẩu mới phải từ 6 ký tự trở lên', 'error');
      if (newPassword !== confirmPassword) return showNotification('Mật khẩu xác nhận không khớp', 'error');
    }

    setLoading(true);

    try {
      await api.post('/user/update-profile', {
        username,
        email,
        currentPassword: user?.has_password ? currentPassword : undefined,
        newPassword: newPassword || undefined
      });
      
      showNotification('Cập nhật tài khoản thành công! Trang sẽ tải lại sau 2 giây...', 'success');
      
      // Auto reload after 2s
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('VUI LÒNG NHẬP MẬT KHẨU ĐỂ XÁC NHẬN XÓA TÀI KHOẢN VĨNH VIỄN:');
    if (!password) return;

    if (!confirm('HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn muốn xóa tài khoản?')) return;

    setLoading(true);
    try {
      await api.post('/user/delete-account', { password });
      showNotification('Tài khoản của bạn đã được xóa thành công.', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi khi xóa tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-gradient)', padding: '12px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
              <Settings size={24} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Cài đặt tài khoản</h1>
          </div>
          
          <button 
            type="button"
            onClick={handleDeleteAccount}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <XCircle size={16} /> Xóa tài khoản
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }} className="settings-grid">
          {/* Avatar Section */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 20px' }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                background: 'var(--glass-bg)', 
                border: '4px solid #10b981',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
              }} className="avatar-hover">
                {avatar ? (
                  <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={80} color="white" />
                  </div>
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                style={{ 
                  position: 'absolute', bottom: '-10px', right: '-10px', 
                  background: 'var(--accent-primary)', padding: '10px', 
                  borderRadius: '12px', cursor: 'pointer', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '2px solid #0a0a0f' 
                }}
              >
                <Camera size={20} color="white" />
              </label>
              <input type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Nhấn vào biểu tượng máy ảnh để đổi ảnh đại diện</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleUpdateProfile}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Tên hiển thị</label>
                <div className="input-icon-wrapper">
                  <div className="icon"><User size={18} /></div>
                  <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email tài khoản</label>
                <div className="input-icon-wrapper">
                  <div className="icon"><Package size={18} /></div>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                {user?.has_password ? 'Thay đổi mật khẩu' : 'Cài đặt mật khẩu đầu tiên'}
              </h3>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">
                  {user?.has_password ? 'Mật khẩu hiện tại (Bắt buộc để lưu thay đổi)' : 'Mật khẩu hiện tại (Chưa có mật khẩu - Bỏ qua)'}
                </label>
                <div className="input-icon-wrapper">
                  <div className="icon"><Lock size={18} /></div>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    placeholder={user?.has_password ? "Nhập mật khẩu hiện tại của bạn..." : "Bỏ qua nếu bạn là thành viên mới chưa cài pass..."}
                    disabled={!user?.has_password}
                    style={!user?.has_password ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <div className="input-icon-wrapper">
                    <div className="icon"><Lock size={18} /></div>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Ít nhất 6 ký tự..."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu mới</label>
                  <div className="input-icon-wrapper">
                    <div className="icon"><Lock size={18} /></div>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Nhập lại mật khẩu mới..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700 }} disabled={loading}>
              {loading ? <Loader2 className="spin" size={20} /> : <><Save size={20} /> Lưu thay đổi</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
