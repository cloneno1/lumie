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
    
    let basePrice = defaultPrice;
    let settingKey = '';
    
    switch (id) {
      case 4: settingKey = 'price_youtube_1m'; basePrice = parseInt(publicSettings[settingKey]) || defaultPrice; break;
      case 5: settingKey = 'price_spotify_1m'; basePrice = parseInt(publicSettings[settingKey]) || defaultPrice; break;
      case 6: settingKey = 'price_netflix_1m'; basePrice = parseInt(publicSettings[settingKey]) || defaultPrice; break;
      case 1: settingKey = 'price_discord_nitro_1m'; basePrice = parseInt(publicSettings[settingKey]) || defaultPrice; break;
      case 2: settingKey = 'price_discord_basic_1m'; basePrice = parseInt(publicSettings[settingKey]) || defaultPrice; break;
      case 'robux-gp': settingKey = 'robux_rate_gamepass'; basePrice = parseInt(publicSettings[settingKey]) || 160; break;
      case 'robux-gr': settingKey = 'robux_rate_group'; basePrice = parseInt(publicSettings[settingKey]) || 200; break;
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

        if (id === 11) { settingKey = 'price_discord_nitro_1y'; basePrice = parseInt(publicSettings[settingKey]) || getPrice(1, 199000) * 12 * 0.8; }
        else if (id === 21) { settingKey = 'price_discord_basic_1y'; basePrice = parseInt(publicSettings[settingKey]) || getPrice(2, 89000) * 12 * 0.8; }
        else return defaultPrice;
    }

    if (user?.is_partner) {
      if (id === 'robux-gp' && publicSettings.partner_robux_rate_gamepass) {
        return parseInt(publicSettings.partner_robux_rate_gamepass);
      }
      if (id === 'robux-gr' && publicSettings.partner_robux_rate_group) {
        return parseInt(publicSettings.partner_robux_rate_group);
      }
      if (settingKey) {
        const partnerKey = `partner_${settingKey}`;
        if (publicSettings[partnerKey]) {
          return parseInt(publicSettings[partnerKey]);
        }
      }
      
      if (id !== 'robux-gp' && id !== 'robux-gr' && publicSettings.partner_discount_percent) {
        const discount = parseInt(publicSettings.partner_discount_percent);
        return Math.floor(basePrice * (1 - discount / 100));
      }
    }

    return basePrice;
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
      id: 'youtube-main',
      title: 'YouTube Premium',
      category: 'YouTube',
      desc: 'Xem YouTube không quảng cáo, YouTube Music. Đầy đủ các gói 1m - 1y.',
      price: getPrice(4, 55000),
      displayPrice: 'Từ ' + Math.floor(getPrice(4, 55000)).toLocaleString() + 'đ',
      duration: '/tháng',
      icon: <Play className="w-8 h-8" />,
      theme: 'youtube',
      highlight: true,
      url: '/products/youtube'
    },

    // --- SPOTIFY ---
    {
      id: 'spotify-main',
      title: 'Spotify Premium',
      category: 'Spotify',
      desc: 'Nâng cấp Premium trực tiếp trên tài khoản cá nhân. Các gói 1m - 1y.',
      price: getPrice(5, 45000),
      displayPrice: 'Từ ' + Math.floor(getPrice(5, 45000)).toLocaleString() + 'đ',
      duration: '/tháng',
      icon: <Music className="w-8 h-8" />,
      theme: 'spotify',
      highlight: true,
      url: '/products/spotify'
    },

    // --- NETFLIX ---
    {
      id: 'netflix-main',
      title: 'Netflix Premium 4K',
      category: 'Netflix',
      desc: 'Tài khoản shared 1 profile hoặc tạo profile riêng biệt. Các gói 1m - 1y.',
      price: getPrice(6, 80000),
      displayPrice: 'Từ ' + Math.floor(getPrice(6, 80000)).toLocaleString() + 'đ',
      duration: '/tháng',
      icon: <Film className="w-8 h-8" />,
      theme: 'netflix',
      highlight: true,
      url: '/products/netflix'
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
