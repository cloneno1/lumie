import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Film, ShieldCheck, ShoppingCart, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';

const Netflix: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [publicSettings, setPublicSettings] = useState<any>(null);

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
    const basePrice = parseInt(publicSettings[`price_netflix_${duration}`]) || 0;
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
        amount: 1
      });
      showNotification('Mua hàng thành công!', 'success');
      refreshUser();
      navigate('/profile/orders');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi hệ thống', 'error');
    }
  };

  const items = [
    { id: 'net-1m', title: 'Netflix Premium 4K - 1 Tháng', duration: '1m', desc: 'Chất lượng 4K HDR, xem trên mọi thiết bị, 1 profile riêng.' },
    { id: 'net-3m', title: 'Netflix Premium 4K - 3 Tháng', duration: '3m', desc: 'Gói 3 tháng xem phim không giới hạn.' },
    { id: 'net-6m', title: 'Netflix Premium 4K - 6 Tháng', duration: '6m', desc: 'Nửa năm giải trí đỉnh cao cùng Netflix.' },
    { id: 'net-1y', title: 'Netflix Premium 4K - 1 Năm', duration: '1y', desc: 'Gói năm tiết kiệm, bảo hành trọn đời thời gian sử dụng.' },
  ];

  return (
    <div className="container" style={{ padding: '60px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
         <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Netflix <span style={{ color: '#e50914' }}>Premium 4K</span></h1>
         <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Phim điện ảnh, chương trình truyền hình và nhiều hơn thế nữa.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {items.map((item) => {
          const price = getPrice(item.duration);
          return (
            <div key={item.id} className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ background: 'rgba(229,9,20,0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e50914' }}>
                <Film size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.desc}</p>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e50914' }}>
                   <Clock size={16} /> <span style={{ fontSize: '13px', fontWeight: 600 }}>Thời hạn: {item.duration === '1y' ? '1 Năm' : `${item.duration.replace('m', '')} Tháng`}</span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '20px', color: 'white' }}>
                  {price.toLocaleString()}đ
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '12px' }}
                    onClick={() => addToCart({...item, price})}
                  >
                    <ShoppingCart size={20} />
                  </button>
                  <button 
                    className="btn" 
                    style={{ flexGrow: 1, fontWeight: 800, background: '#e50914', color: 'white' }} 
                    onClick={() => handleBuy({...item, price})}
                  >
                    MUA NGAY
                  </button>
                </div>
              </div>
              
              <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>
                <ShieldCheck size={14} /> 
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Netflix;
