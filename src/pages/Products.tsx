import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Gamepad2, Play, Music, Film, CircleDollarSign } from 'lucide-react';

const Products: React.FC = () => {
  const { user, refreshUser } = useAuth();
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
    {
      id: 1,
      title: 'Discord Nitro Premium',
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
      id: 2,
      title: 'Discord Basic Nitro',
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
    {
      id: 4,
      title: 'YouTube Premium',
      category: 'YouTube',
      desc: 'Xem YouTube không quảng cáo, YouTube Music bản quyền 1 tháng.',
      price: 55000,
      displayPrice: '55.000đ',
      duration: '/tháng',
      icon: <Play className="w-8 h-8" />,
      theme: 'youtube',
      highlight: false
    },
    {
      id: 5,
      title: 'Spotify Premium Upgrade',
      category: 'Spotify',
      desc: 'Nâng cấp Premium trực tiếp trên tài khoản cá nhân của bạn.',
      price: 45000,
      displayPrice: '45.000đ',
      duration: '/tháng',
      icon: <Music className="w-8 h-8" />,
      theme: 'spotify',
      highlight: false
    },
    {
      id: 6,
      title: 'Netflix Premium 4K',
      category: 'Netflix',
      desc: 'Tài khoản góc share 1 profile hoặc tạo profile riêng biệt.',
      price: 80000,
      displayPrice: '80.000đ',
      duration: '/tháng',
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
      await axios.post('http://localhost:3001/api/orders/create', {
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
                <button className="btn-buy" onClick={() => handleBuy(product)}>Mua Ngay</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Products;
