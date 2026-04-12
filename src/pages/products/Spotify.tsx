import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Music, ShieldCheck, ShoppingCart, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';

const Spotify: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [publicSettings, setPublicSettings] = useState<any>(null);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

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
    const baseKey = `price_spotify_${duration}`;
    const basePrice = parseInt(publicSettings[baseKey]) || 0;
    
    if (user?.is_partner) {
      const partnerKey = `partner_${baseKey}`;
      const partnerPrice = parseInt(publicSettings[partnerKey]);
      if (partnerPrice) return partnerPrice;
      
      if (publicSettings.partner_discount_percent) {
        const discount = parseInt(publicSettings.partner_discount_percent);
        return Math.floor(basePrice * (1 - discount / 100));
      }
    }
    return basePrice;
  };

  const handleBuy = async (product: any) => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua hàng!', 'info');
      navigate('/login');
      return;
    }

    if (!account.trim() || !password.trim()) {
      showNotification('Vui lòng nhập tài khoản và mật khẩu Spotify!', 'error');
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
          account: account.trim(),
          password: password.trim(),
          type: 'spotify'
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
    { id: 'spot-1m', title: 'Spotify Premium - 1 Tháng', duration: '1m', desc: 'Nghe nhạc offline, không quảng cáo, chất lượng cao.' },
    { id: 'spot-3m', title: 'Spotify Premium - 3 Tháng', duration: '3m', desc: 'Gói 3 tháng âm nhạc không giới hạn.' },
    { id: 'spot-6m', title: 'Spotify Premium - 6 Tháng', duration: '6m', desc: 'Tận hưởng âm nhạc suốt 6 tháng liên tục.' },
    { id: 'spot-1y', title: 'Spotify Premium - 1 Năm', duration: '1y', desc: 'Gói năm tiết kiệm, ổn định cho người yêu nhạc.' },
  ];

  return (
    <div className="container" style={{ padding: '60px 20px 100px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(29,185,84,0.15) 0%, transparent 70%)',
          zIndex: -1, pointerEvents: 'none'
        }} />
        <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-2px' }}>
          Spotify <span style={{ color: '#1db954', filter: 'drop-shadow(0 0 10px rgba(29,185,84,0.3))' }}>Premium</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
          Thế giới âm nhạc trong tầm tay bạn. Tận hưởng chất lượng âm thanh tuyệt hảo, nghe nhạc không giới hạn và không quảng cáo.
        </p>
      </div>

      {/* Input Section */}
      <div style={{ 
        maxWidth: '800px', margin: '0 auto 60px', padding: '40px', 
        borderRadius: '24px', border: '1px solid var(--glass-border)', 
        background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(29,185,84,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1db954' }}>
            <Music size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Thông tin tài khoản</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Vui lòng cung cấp thông tin để chúng tôi kích hoạt gói Premium</p>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tài khoản / Email</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Username hoặc Email"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              style={{ 
                background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '2px solid var(--glass-border)', 
                color: 'white', padding: '18px 24px', transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1db954'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mật khẩu</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '2px solid var(--glass-border)', 
                color: 'white', padding: '18px 24px', transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1db954'}
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
                <div style={{ background: 'rgba(29,185,84,0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1db954' }}>
                  <Music size={28} />
                </div>
                <div style={{ opacity: 0.2 }}><ShieldCheck size={20} /></div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', minHeight: '44px' }}>{item.desc}</p>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#1db954', fontSize: '14px', fontWeight: 600 }}>
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
                    className="btn" 
                    style={{ 
                      flexGrow: 1, fontWeight: 900, borderRadius: '16px', fontSize: '1rem', 
                      background: '#1db954', color: 'black',
                      boxShadow: '0 10px 20px -5px rgba(29,185,84,0.4)',
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

export default Spotify;
