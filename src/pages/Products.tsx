import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Sparkles, Gamepad2, Play, Music, Film, CircleDollarSign, ShoppingCart } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';

const Products: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  
  // Get category from URL query if exists
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'All';
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const [publicSettings, setPublicSettings] = useState<any>(null);

  React.useEffect(() => {
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

  const getPrice = (id: any, defaultPrice: number): number => {
    if (!publicSettings) return defaultPrice;
    
    switch (id) {
      case 4: return parseInt(publicSettings.price_youtube_1m) || defaultPrice;
      case 5: return parseInt(publicSettings.price_spotify_1m) || defaultPrice;
      case 6: return parseInt(publicSettings.price_netflix_1m) || defaultPrice;
      case 1: return parseInt(publicSettings.price_discord_nitro_1m) || defaultPrice;
      case 2: return parseInt(publicSettings.price_discord_basic_1m) || defaultPrice;
      case 'robux-gp': return parseInt(publicSettings.robux_rate_gamepass) || 160;
      case 'robux-gr': return parseInt(publicSettings.robux_rate_group) || 200;
      default:
        // Handle variations (3m, 6m, 1y) - rough scaling for now if not explicitly in settings
        if (id === 41) return getPrice(4, 55000) * 3 * 0.9; // 10% disc for 3m
        if (id === 42) return getPrice(4, 55000) * 6 * 0.85; // 15% disc for 6m
        if (id === 43) return getPrice(4, 55000) * 12 * 0.8; // 20% disc for 1y
        
        if (id === 51) return getPrice(5, 45000) * 3 * 0.9;
        if (id === 52) return getPrice(5, 45000) * 6 * 0.85;
        if (id === 53) return getPrice(5, 45000) * 12 * 0.8;
        
        if (id === 61) return getPrice(6, 80000) * 3 * 0.9;
        if (id === 62) return getPrice(6, 80000) * 6 * 0.85;
        if (id === 63) return getPrice(6, 80000) * 12 * 0.8;

        if (id === 11) return getPrice(1, 199000) * 12 * 0.8;
        if (id === 21) return getPrice(2, 89000) * 12 * 0.8;
        
        return defaultPrice;
    }
  };

  const categories = ['All', 'Discord', 'Robux', 'YouTube', 'Spotify', 'Netflix'];

  const products = [
    // --- DISCORD ---
    {
      id: 1,
      title: 'Discord Nitro Boost - 1 Tháng',
      category: 'Discord',
      desc: '1 Tháng Full Nitro. Nâng cấp server nhanh chóng.',
      price: getPrice(1, 199000),
      displayPrice: Math.floor(getPrice(1, 199000)).toLocaleString() + 'đ',
      duration: '/tháng',
      icon: <Sparkles className="w-8 h-8" />,
      theme: 'discord',
      highlight: true
    },
    {
      id: 11,
      title: 'Discord Nitro Boost - 1 Năm',
      category: 'Discord',
      desc: '1 Năm Full Nitro + Server Boosts. Tiết kiệm hơn.',
      price: getPrice(11, 1890000),
      displayPrice: Math.floor(getPrice(11, 1890000)).toLocaleString() + 'đ',
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
      price: getPrice(2, 89000),
      displayPrice: Math.floor(getPrice(2, 89000)).toLocaleString() + 'đ',
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
      price: getPrice(21, 850000),
      displayPrice: Math.floor(getPrice(21, 850000)).toLocaleString() + 'đ',
      duration: '/năm',
      icon: <Sparkles className="w-8 h-8" />,
      theme: 'discord',
      highlight: false
    },
    {
      id: 22,
      title: 'Decoration Discord',
      category: 'Discord',
      desc: 'Mua Avatar Decoration và Profile Effects cực chất. Hỗ trợ Login & Gift.',
      price: 50000,
      displayPrice: '50.000đ',
      duration: '/gói',
      icon: <Sparkles className="w-8 h-8" />,
      theme: 'discord',
      highlight: true,
      url: '/products/discord-decoration'
    },

    // --- ROBUX ---
    {
      id: 'robux-gp',
      title: 'Robux - Gamepass (120H)',
      category: 'Robux',
      desc: `Nạp Robux thông qua Gamepass. Tỷ giá 1:${publicSettings?.robux_rate_gamepass || 160}. An toàn & Bảo mật.`,
      price: getPrice('robux-gp', 16000),
      displayPrice: Math.floor(getPrice('robux-gp', 16000)).toLocaleString() + 'đ',
      duration: '/100 R$',
      icon: <Gamepad2 className="w-8 h-8" />,
      theme: 'robux',
      highlight: true,
      url: '/products/robux-gamepass'
    },
    {
      id: 'robux-gr',
      title: 'Robux - Group (24H)',
      category: 'Robux',
      desc: `Nạp Robux thông qua Group. Tỷ giá 1:${publicSettings?.robux_rate_group || 200}. Nhanh chóng & Uy tín.`,
      price: getPrice('robux-gr', 20000),
      displayPrice: Math.floor(getPrice('robux-gr', 20000)).toLocaleString() + 'đ',
      duration: '/100 R$',
      icon: <CircleDollarSign className="w-8 h-8" />,
      theme: 'robux',
      highlight: true,
      url: '/products/robux-group'
    },

    // --- YOUTUBE ---
    {
      id: 4,
      title: 'YouTube Premium - 1 Tháng',
      category: 'YouTube',
      desc: 'Xem YouTube không quảng cáo, YouTube Music 1 tháng.',
      price: getPrice(4, 55000),
      displayPrice: Math.floor(getPrice(4, 55000)).toLocaleString() + 'đ',
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
      price: getPrice(41, 150000),
      displayPrice: Math.floor(getPrice(41, 150000)).toLocaleString() + 'đ',
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
      price: getPrice(42, 280000),
      displayPrice: Math.floor(getPrice(42, 280000)).toLocaleString() + 'đ',
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
      price: getPrice(43, 520000),
      displayPrice: Math.floor(getPrice(43, 520000)).toLocaleString() + 'đ',
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
      price: getPrice(5, 45000),
      displayPrice: Math.floor(getPrice(5, 45000)).toLocaleString() + 'đ',
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
      price: getPrice(51, 130000),
      displayPrice: Math.floor(getPrice(51, 130000)).toLocaleString() + 'đ',
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
      price: getPrice(52, 250000),
      displayPrice: Math.floor(getPrice(52, 250000)).toLocaleString() + 'đ',
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
      price: getPrice(53, 450000),
      displayPrice: Math.floor(getPrice(53, 450000)).toLocaleString() + 'đ',
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
      price: getPrice(6, 80000),
      displayPrice: Math.floor(getPrice(6, 80000)).toLocaleString() + 'đ',
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
      price: getPrice(61, 225000),
      displayPrice: Math.floor(getPrice(61, 225000)).toLocaleString() + 'đ',
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
      price: getPrice(62, 430000),
      displayPrice: Math.floor(getPrice(62, 430000)).toLocaleString() + 'đ',
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
      price: getPrice(63, 800000),
      displayPrice: Math.floor(getPrice(63, 800000)).toLocaleString() + 'đ',
      duration: '/năm',
      icon: <Film className="w-8 h-8" />,
      theme: 'netflix',
      highlight: true
    }
  ];

  const handleBuy = async (product: any) => {
    if (product.url) {
      navigate(product.url);
      return;
    }
    
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua hàng!', 'info');
      navigate('/login');
      return;
    }

    if (user.balance < product.price) {
      showNotification('Số dư tài khoản không đủ. Vui lòng nạp thêm tiền!', 'error');
      navigate('/nap-tien');
      return;
    }

    const confirmed = await confirm({
      title: 'Xác nhận mua hàng',
      message: `Xác nhận mua ${product.title} với giá ${product.displayPrice}?`
    });

    if (!confirmed) return;

    try {
      await api.post('/orders/create', {
        productId: product.id.toString(),
        productName: product.title,
        price: product.price,
        amount: 1
      });
      showNotification('Mua hàng thành công! Vui lòng kiểm tra lịch sử đơn hàng.', 'success');
      refreshUser();
      navigate('/profile/orders');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Có lỗi xảy ra khi mua hàng.', 'error');
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
                      if (product.url) {
                        navigate(product.url);
                      } else {
                        addToCart(product);
                      }
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
