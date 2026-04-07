import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Zap, ShieldCheck, Headphones, Image as ImageIcon, Loader2, Play } from 'lucide-react';

const RobuxGamepass: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const RATE = 160; // 1 Robux = 160 VNĐ
  const [robuxAmount, setRobuxAmount] = useState<number | string>('');
  const [username, setUsername] = useState('');
  const [gamepassLink, setGamepassLink] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [tutorialLink, setTutorialLink] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        const link = res.data.find((s: any) => s.key === 'robux_tutorial_link')?.value;
        if (link) setTutorialLink(link);
      } catch (err) { console.error('Error fetching settings'); }
    };
    fetchSettings();
  }, []);

  const totalPrice = Number(robuxAmount) > 0 ? Number(robuxAmount) * RATE : 0;
  const quickPackages = [100, 500, 1000, 2000, 5000, 10000];

  const handleBuy = async () => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua hàng!', 'info');
      navigate('/login');
      return;
    }

    if (!robuxAmount || Number(robuxAmount) <= 0) {
      showNotification('Vui lòng nhập số lượng Robux hợp lệ!', 'error');
      return;
    }

    if (!username.trim()) {
      showNotification('Vui lòng nhập Username Roblox!', 'error');
      return;
    }

    if (!gamepassLink.trim()) {
      showNotification('Vui lòng nhập Link Gamepass!', 'error');
      return;
    }

    if (user.balance < totalPrice) {
      showNotification('Số dư không đủ. Vui lòng nạp thêm!', 'error');
      navigate('/nap-tien');
      return;
    }

    if (!window.confirm(`Xác nhận thanh toán ${totalPrice.toLocaleString()}đ cho ${robuxAmount} Robux?`)) return;

    setLoading(true);
    try {
      await api.post('/orders/create', {
        productId: 'robux-gamepass',
        productName: `Mua ${robuxAmount} Robux (Gamepass)`,
        price: totalPrice,
        amount: 1,
        options: {
          robux: robuxAmount,
          username,
          gamepassLink,
          note,
          type: 'gamepass'
        }
      });
      showNotification('Thanh toán thành công! Đơn hàng đang được xử lý.', 'success');
      refreshUser();
      navigate('/profile/orders');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi hệ thống khi thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '1200px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }} className="robux-layout">
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Input Section */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 700 }}>Nhập số lượng Robux</h2>
            <div style={{ position: 'relative' }}>
              <input 
                type="number"
                className="auth-input"
                placeholder="Ví dụ: 1000"
                value={robuxAmount}
                onChange={(e) => setRobuxAmount(e.target.value)}
                style={{ 
                  height: '64px', fontSize: '1.5rem', paddingRight: '60px', fontWeight: 700,
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
                }}
              />
              <span style={{ 
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                color: '#10b981', fontWeight: 800, fontSize: '1.2rem'
              }}>R$</span>
            </div>
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              * Tỷ giá hiện tại: <strong>1 Robux = {RATE} VNĐ</strong>
            </p>
          </div>

          {/* Quick Package Section */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 700 }}>Hoặc chọn gói nhanh</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {quickPackages.map(pkg => (
                <div 
                  key={pkg}
                  onClick={() => setRobuxAmount(pkg)}
                  className="glass-card robux-pkg-card"
                  style={{ 
                    padding: '24px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s', border: robuxAmount === pkg ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                    background: robuxAmount === pkg ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)'
                  }}
                >
                  <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    {pkg.toLocaleString()} <span style={{ fontSize: '1rem' }}>R$</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
                    {(pkg * RATE).toLocaleString()} VNĐ
                  </div>
                </div>
              ))}
            </div>

            {/* Tutorial Section */}
            <a href={tutorialLink} target="_blank" rel="noopener noreferrer" className="glass-card" style={{ 
              display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', 
              textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(16, 185, 129, 0.2)'
            }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '16px', color: '#10b981' }}>
                <Play size={32} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'white' }}>Hướng dẫn tạo Gamepass Roblox</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Xem video hướng dẫn chi tiết cách tạo gamepass để nhận Robux</p>
              </div>
            </a>
          </div>
        </div>

        {/* Right Column - Order Form */}
        <div className="glass-card" style={{ padding: '32px', height: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '32px', fontWeight: 700 }}>Thông tin đơn hàng</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Tên nhân vật Roblox (Username)</label>
              <input 
                className="form-control" 
                placeholder="Nhập chính xác username..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Link Gamepass</label>
              <input 
                className="form-control" 
                placeholder="https://www.roblox.com/game-pass/..." 
                value={gamepassLink}
                onChange={(e) => setGamepassLink(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Ghi chú (Tài khoản/Mật khẩu hoặc yêu cầu khác)</label>
              <textarea 
                className="form-control" 
                placeholder="Nếu mua gamepass cần login thì để lại thông tin tại đây..." 
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', resize: 'none' }}
              />
            </div>

            {/* Photo Upload Placeholder */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Tải ảnh đính kèm (Không bắt buộc)</label>
              <div style={{ 
                border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '30px',
                textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)'
              }}>
                <ImageIcon size={24} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <div style={{ fontSize: '12px' }}>Bấm để chọn ảnh hoặc kéo thả vào đây</div>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ 
              marginTop: '10px', padding: '20px', borderRadius: '16px', 
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số lượng:</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{Number(robuxAmount).toLocaleString()} R$</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#10b981' }}>{totalPrice.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleBuy}
              disabled={loading}
              style={{ 
                height: '56px', borderRadius: '16px', background: '#10b981', 
                border: 'none', fontSize: '1.1rem', fontWeight: 800,
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
              }}
            >
              {loading ? <Loader2 size={24} className="spin" /> : 'Thanh Toán Ngay'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
               <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Zap size={12} fill="#10b981" /> Giao dịch tự động
               </div>
               <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <ShieldCheck size={12} /> An toàn 100%
               </div>
               <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Headphones size={12} /> Hỗ trợ 24/7
               </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Additional Styling for Pkg Card Hover */}
      <style>{`
        .robux-pkg-card:hover {
          transform: translateY(-5px);
          background: rgba(239, 68, 68, 0.05) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }
        @media (max-width: 992px) {
          .robux-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RobuxGamepass;
