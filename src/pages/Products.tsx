import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Sparkles, Gamepad2, Play, Music, Film, CircleDollarSign, ShoppingCart } from 'lucide-react';

const Products: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get category from URL query if exists
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'All';
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  React.useEffect(() => {
    setActiveCategory(queryParams.get('category') || 'All');
  }, [location.search]);

  const categories = ['All', 'Discord', 'Robux', 'YouTube', 'Spotify', 'Netflix'];

  const products = [
    // --- DISCORD ---
    {
      id: 1,
      title: 'Discord Nitro Premium (Boost) - 1 Tháng',
      category: 'Discord',
      desc: '1 Tháng Full Nitro. Nâng cấp server nhanh chóng.',
      price: 199000,
      displayPrice: '199.000đ',
      duration: '/tháng',
      icon: <Sparkles className="w-8 h-8" />,
      theme: 'discord',
      highlight: true
    },
    {
      id: 11,
      title: 'Discord Nitro Premium (Boost) - 1 Năm',
      category: 'Discord',
      desc: '1 Năm Full Nitro + Server Boosts. Tiết kiệm hơn.',
      price: 1890000,
      displayPrice: '1.890.000đ',
      duration: '/năm',
      icon: <Sparkles className="w-8 h-8" />,
      theme: 'discord',
      highlight: true
    },
    {
      id: 2,
      title: 'Discord Basic Nitro - 1 Tháng',
      category: 'Discord',
      desc: '1 Tháng Basic Nitro. Avatar động và tải lên file lớn.',
      price: 89000,
      displayPrice: '89.000đ',
      duration: '/tháng',
      icon: <Sparkles className="w-8 h-8" />,
      theme: 'discord',
      highlight: false
    },
    {
      id: 21,
      title: 'Discord Basic Nitro - 1 Năm',
      category: 'Discord',
      desc: '1 Năm Basic Nitro. Tiết kiệm đáng kể.',
      price: 850000,
      displayPrice: '850.000đ',
      duration: '/năm',
      icon: <Sparkles className="w-8 h-8" />,
      theme: 'discord',
      highlight: false
    },

    // --- ROBUX ---
    {
      id: 3,
      title: 'Robux 120H Pending',
      category: 'Robux',
      desc: 'Nạp Robux thông qua thẻ Gamepass an toàn, bảo mật 120H nhận.',
      price: 120000,
      displayPrice: '120.000đ',
      duration: '/1k',
      icon: <Gamepad2 className="w-8 h-8" />,
      theme: 'robux',
      highlight: true
    },

    // --- YOUTUBE ---
    {
      id: 4,
      title: 'YouTube Premium - 1 Tháng',
      category: 'YouTube',
      desc: 'Xem YouTube không quảng cáo, YouTube Music 1 tháng.',
      price: 55000,
      displayPrice: '55.000đ',
      duration: '/tháng',
      icon: <Play className="w-8 h-8" />,
      theme: 'youtube',
      highlight: false
    },
    {
      id: 41,
      title: 'YouTube Premium - 3 Tháng',
      category: 'YouTube',
      desc: 'Xem YouTube không quảng cáo, YouTube Music 3 tháng.',
      price: 150000,
      displayPrice: '150.000đ',
      duration: '/3 tháng',
      icon: <Play className="w-8 h-8" />,
      theme: 'youtube',
      highlight: false
    },
    {
      id: 42,
      title: 'YouTube Premium - 6 Tháng',
      category: 'YouTube',
      desc: 'Giải trí không giới hạn với YouTube Music 6 tháng.',
      price: 280000,
      displayPrice: '280.000đ',
      duration: '/6 tháng',
      icon: <Play className="w-8 h-8" />,
      theme: 'youtube',
      highlight: false
    },
    {
      id: 43,
      title: 'YouTube Premium - 1 Năm',
      category: 'YouTube',
      desc: 'Gói YouTube Premium 1 năm tiết kiệm nhất.',
      price: 520000,
      displayPrice: '520.000đ',
      duration: '/năm',
      icon: <Play className="w-8 h-8" />,
      theme: 'youtube',
      highlight: true
    },

    // --- SPOTIFY ---
    {
      id: 5,
      title: 'Spotify Premium - 1 Tháng',
      category: 'Spotify',
      desc: 'Nâng cấp Premium trực tiếp trên tài khoản cá nhân 1 tháng.',
      price: 45000,
      displayPrice: '45.000đ',
      duration: '/tháng',
      icon: <Music className="w-8 h-8" />,
      theme: 'spotify',
      highlight: false
    },
    {
      id: 51,
      title: 'Spotify Premium - 3 Tháng',
      category: 'Spotify',
      desc: 'Tận hưởng âm nhạc không quảng cáo trong 3 tháng.',
      price: 130000,
      displayPrice: '130.000đ',
      duration: '/3 tháng',
      icon: <Music className="w-8 h-8" />,
      theme: 'spotify',
      highlight: false
    },
    {
      id: 52,
      title: 'Spotify Premium - 6 Tháng',
      category: 'Spotify',
      desc: 'Tài khoản Premium chính chủ cho 6 tháng trải nghiệm.',
      price: 250000,
      displayPrice: '250.000đ',
      duration: '/6 tháng',
      icon: <Music className="w-8 h-8" />,
      theme: 'spotify',
      highlight: false
    },
    {
      id: 53,
      title: 'Spotify Premium - 1 Năm',
      category: 'Spotify',
      desc: 'Gói 1 năm Premium Spotify ổn định, uy tín.',
      price: 450000,
      displayPrice: '450.000đ',
      duration: '/năm',
      icon: <Music className="w-8 h-8" />,
      theme: 'spotify',
      highlight: true
    },

    // --- NETFLIX ---
    {
      id: 6,
      title: 'Netflix Premium 4K - 1 Tháng',
      category: 'Netflix',
      desc: 'Tài khoản shared 1 profile hoặc tạo profile riêng biệt.',
      price: 80000,
      displayPrice: '80.000đ',
      duration: '/tháng',
      icon: <Film className="w-8 h-8" />,
      theme: 'netflix',
      highlight: true
    },
    {
      id: 61,
      title: 'Netflix Premium 4K - 3 Tháng',
      category: 'Netflix',
      desc: 'Thoải mái xem phim 4K trong 3 tháng liên tục.',
      price: 225000,
      displayPrice: '225.000đ',
      duration: '/3 tháng',
      icon: <Film className="w-8 h-8" />,
      theme: 'netflix',
      highlight: false
    },
    {
      id: 62,
      title: 'Netflix Premium 4K - 6 Tháng',
      category: 'Netflix',
      desc: 'Xem phim không giới hạn 4K bản quyền 6 tháng.',
      price: 430000,
      displayPrice: '430.000đ',
      duration: '/6 tháng',
      icon: <Film className="w-8 h-8" />,
      theme: 'netflix',
      highlight: false
    },
    {
      id: 63,
      title: 'Netflix Premium 4K - 1 Năm',
      category: 'Netflix',
      desc: 'Gói Netflix Premium 1 năm tiện lợi, giá rẻ.',
      price: 800000,
      displayPrice: '800.000đ',
      duration: '/năm',
      icon: <Film className="w-8 h-8" />,
      theme: 'netflix',
      highlight: true
    }
  ];

  const handleBuy = async (product: any) => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua hàng!');
      navigate('/login');
      return;
    }

    if (user.balance < product.price) {
      alert('Số dư tài khoản không đủ. Vui lòng nạp thêm tiền!');
      navigate('/nap-tien');
      return;
    }

    if (!confirm(`Xác nhận mua ${product.title} với giá ${product.displayPrice}?`)) return;

    try {
      await api.post('/orders/create', {
        productId: product.id.toString(),
        productName: product.title,
        price: product.price,
        amount: 1
      });
      alert('Mua hàng thành công! Vui lòng kiểm tra lịch sử đơn hàng.');
      refreshUser();
      navigate('/profile/orders');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi mua hàng.');
    }
  };

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <section className="animate-fade-in">
        <h1 style={{ marginBottom: '32px' }}>Sản Phẩm <span className="gradient-text">{activeCategory !== 'All' ? activeCategory : 'Của Chúng Tôi'}</span></h1>
        
        <div className="categories" style={{ marginBottom: '40px' }}>
          {categories.map(category => (
            <button 
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : 'glass-panel'}`}
              onClick={() => {
                setActiveCategory(category);
                navigate(`/products?category=${category}`);
              }}
            >
              {category === 'Discord' && <Sparkles size={16} />}
              {category === 'Robux' && <CircleDollarSign size={16} />}
              {category === 'YouTube' && <Play size={16} />}
              {category === 'Spotify' && <Music size={16} />}
              {category === 'Netflix' && <Film size={16} />}
              {category}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className={`glass-panel product-card animate-fade-in delay-${(index % 3) + 1} ${product.highlight ? 'premium-highlight' : ''}`}
            >
              <div className={`product-icon ${product.theme}`}>
                {product.icon}
              </div>
              <h3 className="product-title">{product.title}</h3>
              <p className="product-desc">{product.desc}</p>
              <div className="product-footer">
                <div className="product-price">
                  {product.displayPrice}
                  <span>{product.duration}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-buy" 
                    style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px' }}
                    onClick={() => {
                      addToCart(product);
                    }}
                  >
                    <ShoppingCart size={18} />
                  </button>
                  <button className="btn-buy" onClick={() => handleBuy(product)}>Mua Ngay</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Products;
