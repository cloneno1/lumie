import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Zap, Sparkles } from 'lucide-react';

const Discord: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleBuy = async (product: any) => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua hàng!');
      navigate('/login');
      return;
    }
    if (user.balance < product.price) {
      alert('Số dư không đủ. Vui lòng nạp thêm!');
      navigate('/nap-tien');
      return;
    }
    if (!confirm(`Xác nhận mua ${product.title}?`)) return;

    try {
      await api.post('/orders/create', {
        productId: product.id,
        productName: product.title,
        price: product.price,
        amount: 1
      });
      alert('Mua hàng thành công!');
      refreshUser();
      navigate('/profile/orders');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi hệ thống');
    }
  };

  const nitroItems = [
    { id: 'nitro-b-1m', title: 'Discord Nitro Boost - 1 Month', price: 99000, img: 'https://images2.alphacoders.com/114/1148675.png', badge: '6% Cashback', region: 'GLOBAL' },
    { id: 'nitro-b-1y', title: 'Discord Nitro Boost - 1 Year', price: 950000, img: 'https://wallpaperaccess.com/full/5736411.png', badge: '10% Cashback', region: 'GLOBAL' },
    { id: 'nitro-c-1m', title: 'Discord Nitro Classic - 1 Month', price: 55000, img: 'https://images.wallpapersden.com/image/download/discord-logo-dark_bGhmZ2aUmZqaraWkpJRmbmdlrWZlbWU.jpg', badge: '5% Cashback', region: 'GLOBAL' },
    { id: 'nitro-c-1y', title: 'Discord Nitro Classic - 1 Year', price: 530000, img: 'https://wallpapercave.com/wp/wp8524458.png', badge: '8% Cashback', region: 'GLOBAL' },
  ];

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
         <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Discord <span className="gradient-text">Nitro Services</span></h1>
         <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Cung cấp các gói Nitro Boost và Nitro Classic tự động, bảo hành 100%.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px' }}>
        <Sparkles size={28} style={{ color: 'var(--accent-primary)' }} />
        <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Gói dịch vụ Nitro</h2>
        <div style={{ flexGrow: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {nitroItems.map((nitro) => (
          <div key={nitro.id} className="modern-product-card">
            <div className="card-image-container">
              <img src={nitro.img} alt={nitro.title} className="card-image" />
              <div className="card-badge"><Zap size={10} fill="black" /> {nitro.badge}</div>
            </div>
            <div className="card-content">
              <img src="https://cdn.worldvectorlogo.com/logos/discord-6.svg" alt="logo" className="card-platform-icon" />
              <div className="card-title">{nitro.title}</div>
              <div className="card-subtitle">{nitro.region}</div>
              <div className="card-footer">
                <div className="card-price"><span className="currency">đ</span>{nitro.price.toLocaleString()}</div>
                <button className="btn-buy" style={{ width: '100%', marginTop: '10px' }} onClick={() => handleBuy(nitro)}>Mua ngay</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Discord;
