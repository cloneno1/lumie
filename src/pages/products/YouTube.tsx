import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Play, ShieldCheck, ShoppingCart, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';

const YouTube: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [publicSettings, setPublicSettings] = useState<any>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        setPublicSettings(res.data);
      } catch (err) {
        console.error('Lỗi tải cấu hình:', err);
      }
    };
    fetchSettings();
  }, []);

  const getPrice = (duration: string) => {
    if (!publicSettings) return 0;
    const basePrice = parseInt(publicSettings[`price_youtube_${duration}`]) || 0;
    if (user?.is_partner && publicSettings.partner_discount_percent) {
      const discount = parseInt(publicSettings.partner_discount_percent);
      return Math.floor(basePrice * (1 - discount / 100));
    }
    return basePrice;
  };

  const handleBuy = async (product: any) => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua hàng!', 'info');
      navigate('/login');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showNotification('Vui lòng nhập Gmail YouTube hợp lệ!', 'error');
      return;
    }

    if (user.balance < product.price) {
      showNotification('Số dư không đủ. Vui lòng nạp thêm!', 'error');
      navigate('/nap-tien');
      return;
    }
    
    const confirmed = await confirm({
      title: 'Xác nhận mua hàng',
      message: `Bạn có chắc chắn muốn mua ${product.title} không?`
    });
    
    if (!confirmed) return;

    try {
      await api.post('/orders/create', {
        productId: product.id,
        productName: product.title,
        price: product.price,
        amount: 1,
        options: {
          email: email.trim(),
          type: 'youtube'
        }
      });
      showNotification('Mua hàng thành công!', 'success');
      refreshUser();
      navigate('/profile/orders');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi hệ thống', 'error');
    }
  };

  const items = [
    { id: 'yt-1m', title: 'YouTube Premium - 1 Tháng', duration: '1m', desc: 'Xem không quảng cáo, YouTube Music, chạy nền.' },
    { id: 'yt-3m', title: 'YouTube Premium - 3 Tháng', duration: '3m', desc: 'Tiết kiệm hơn với gói 3 tháng giải trí.' },
    { id: 'yt-6m', title: 'YouTube Premium - 6 Tháng', duration: '6m', desc: 'Trải nghiệm không gián đoạn suốt nửa năm.' },
    { id: 'yt-1y', title: 'YouTube Premium - 1 Năm', duration: '1y', desc: 'Gói năm tiết kiệm nhất, ổn định nhất.' },
  ];

  return (
    <div className="container" style={{ padding: '60px 20px 100px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,0,0,0.15) 0%, transparent 70%)',
          zIndex: -1, pointerEvents: 'none'
        }} />
        <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-2px' }}>
          YouTube <span className="gradient-text" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.3))' }}>Premium</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
          Tận hưởng giải trí không giới hạn. Xem phim không quảng cáo, nghe nhạc chất lượng cao ngay cả khi màn hình tắt.
        </p>
      </div>

      {/* Input Section */}
      <div style={{ 
        maxWidth: '700px', margin: '0 auto 60px', padding: '40px', 
        borderRadius: '24px', border: '1px solid var(--glass-border)', 
        background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4444' }}>
            <Play size={20} fill="#ff4444" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Thông tin đăng ký</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Vui lòng nhập chính xác Gmail bạn đang dùng YouTube</p>
          </div>
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Địa chỉ Gmail nhận Premium</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="email" 
              className="form-control" 
              placeholder="ten-cua-ban@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '2px solid var(--glass-border)', 
                color: 'white', padding: '18px 24px', fontSize: '1.1rem', transition: 'all 0.3s',
                width: '100%'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ff4444'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {items.map((item) => {
          const price = getPrice(item.duration);
          return (
            <div key={item.id} className="glass-card hover-scale" style={{ padding: '35px', display: 'flex', flexDirection: 'column', gap: '25px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(255,0,0,0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4444' }}>
                  <Play size={28} fill="#ff4444" />
                </div>
                <div style={{ opacity: 0.2 }}><ShieldCheck size={20} /></div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', minHeight: '44px' }}>{item.desc}</p>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#ff4444', fontSize: '14px', fontWeight: 600 }}>
                  <Clock size={16} /> <span>Thời hạn: {item.duration === '1y' ? '1 Năm' : `${item.duration.replace('m', '')} Tháng`}</span>
                </div>
                
                <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '30px', color: 'white', letterSpacing: '-1px' }}>
                  {price.toLocaleString()}đ
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn glass-panel" 
                    style={{ width: '60px', height: '60px', padding: 0, borderRadius: '16px' }}
                    onClick={() => addToCart({...item, price})}
                  >
                    <ShoppingCart size={22} />
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ 
                      flexGrow: 1, fontWeight: 900, borderRadius: '16px', fontSize: '1rem', 
                      background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                      boxShadow: '0 10px 20px -5px rgba(255,0,0,0.4)',
                      border: 'none'
                    }} 
                    onClick={() => handleBuy({...item, price})}
                  >
                    MUA NGAY
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YouTube;
