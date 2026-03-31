import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Camera, Calendar, Shield, CreditCard, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="profile-header">
          <div style={{ position: 'relative' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '24px', 
              overflow: 'hidden', 
              background: 'var(--glass-bg)', 
              border: '4px solid #10b981',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
            }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={48} color="white" />
                </div>
              )}
            </div>
          </div>
          <div style={{ flexGrow: 1 }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{user?.username}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 16px' }}>{user?.email || 'Chưa cập nhật email'}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
               <div className="glass-card" style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Số dư</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{user?.balance.toLocaleString()}đ</span>
              </div>
              <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Vai trò</span>
                <span style={{ fontWeight: 700, color: user?.role === 'admin' ? '#f59e0b' : 'inherit' }}>{user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <Link to="/profile/settings" className="glass-card clickable-card" style={{ padding: '24px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Camera size={24} color="#3b82f6" />
          </div>
          <h3 style={{ margin: '0 0 8px' }}>Cài đặt tài khoản</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Thay đổi ảnh đại diện, tên hiển thị và mật khẩu của bạn.</p>
        </Link>

        <Link to="/profile/orders" className="glass-card clickable-card" style={{ padding: '24px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ShoppingBag size={24} color="#10b981" />
          </div>
          <h3 style={{ margin: '0 0 8px' }}>Lịch sử đơn hàng</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Xem lại các dịch vụ và sản phẩm bạn đã mua tại cửa hàng.</p>
        </Link>

        <Link to="/profile/topups" className="glass-card clickable-card" style={{ padding: '24px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <CreditCard size={24} color="#f59e0b" />
          </div>
          <h3 style={{ margin: '0 0 8px' }}>Lịch sử nạp tiền</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Theo dõi lịch sử nạp thẻ và biến động số dư tài khoản.</p>
        </Link>
      </div>
    </div>
  );
};

export default Profile;
