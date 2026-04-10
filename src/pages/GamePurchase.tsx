import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Zap, ShieldCheck, Info, Gamepad2, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api/axios';

// Dữ liệu cấu hình các game - Moved outside to prevent re-render loops
const gamesData: Record<string, any> = {
  'lq': {
    name: 'Liên Quân Mobile',
    provider: 'Garena',
    image: '/images/lq-logo.png',
    banner: 'https://cdn.vn.garenanow.com/web/kg/news/uploads/20230113_Banner_1.jpg',
    fields: [
      { label: 'Player UID', name: 'playerid', placeholder: 'Nhập OpenID của bạn...', type: 'text' }
    ],
    packages: [
      { id: 1, amount: 16, unit: 'Quân Huy', price: 10000 },
      { id: 2, amount: 32, unit: 'Quân Huy', price: 20000 },
      { id: 3, amount: 84, unit: 'Quân Huy', price: 50000 },
      { id: 4, amount: 168, unit: 'Quân Huy', price: 100000 },
      { id: 5, amount: 340, unit: 'Quân Huy', price: 200000 },
      { id: 6, amount: 856, unit: 'Quân Huy', price: 500000 },
    ]
  },
  'ff': {
    name: 'Free Fire',
    provider: 'Garena',
    image: '/images/ff-logo.png',
    banner: 'https://dl.dir.freefiremobile.com/freefire/media/items/1652410712627df85848261.jpg',
    fields: [
      { label: 'Player ID (UID)', name: 'playerid', placeholder: 'Nhập UID nhân vật...', type: 'text' }
    ],
    packages: [
      { id: 1, amount: 113, unit: 'Kim Cương', price: 20000 },
      { id: 2, amount: 283, unit: 'Kim Cương', price: 50000 },
      { id: 3, amount: 566, unit: 'Kim Cương', price: 100000 },
      { id: 4, amount: 1132, unit: 'Kim Cương', price: 200000 },
      { id: 5, amount: 2830, unit: 'Kim Cương', price: 500000 },
    ]
  },
  'fo4': {
    name: 'Fifa Online 4',
    provider: 'Garena',
    image: '/images/fo4-logo.png',
    banner: 'https://fo4.garena.vn/wp-content/uploads/2021/04/Banner-FO4-Moi.jpg',
    fields: [
      { label: 'Player UID', name: 'playerid', placeholder: 'Nhập UID của bạn...', type: 'text' }
    ],
    packages: [
      { id: 1, amount: 16, unit: 'FC', price: 10000 },
      { id: 2, amount: 32, unit: 'FC', price: 20000 },
      { id: 3, amount: 84, unit: 'FC', price: 50000 },
      { id: 4, amount: 168, unit: 'FC', price: 100000 },
      { id: 5, amount: 340, unit: 'FC', price: 200000 },
      { id: 6, amount: 856, unit: 'FC', price: 500000 },
    ]
  },
  'hsr': {
    name: 'Honkai: Star Rail',
    provider: 'Hoyoverse',
    image: '/images/hsr-logo.jpg',
    banner: 'https://fastcdn.hoyoverse.com/static-resource-v2/2023/04/26/663c9b7e0234a17924af99bd937d5786_5941584852928509935.jpg',
    fields: [
      { label: 'Player UID', name: 'playerid', placeholder: 'Nhập UID của bạn...', type: 'text' },
      { label: 'Server', name: 'server', type: 'select', options: ['Asia', 'Europe', 'America', 'TW/HK/MO'] }
    ],
    packages: [
      { id: 1, amount: 'Thẻ Tháng', unit: 'Chứng Nhận Tiếp Tế Đội Tàu', price: 109000 },
      { id: 2, amount: 60, unit: 'Mộng Ước Viễn Cổ', price: 22000 },
      { id: 3, amount: 300, unit: 'Mộng Ước Viễn Cổ', price: 109000 },
      { id: 4, amount: 980, unit: 'Mộng Ước Viễn Cổ', price: 329000 },
      { id: 5, amount: 1980, unit: 'Mộng Ước Viễn Cổ', price: 699000 },
      { id: 6, amount: 3280, unit: 'Mộng Ước Viễn Cổ', price: 1099000 },
      { id: 7, amount: 6480, unit: 'Mộng Ước Viễn Cổ', price: 2199000 },
    ]
  },
  'gi': {
    name: 'Genshin Impact',
    provider: 'Hoyoverse',
    image: '/images/gi-logo.png',
    banner: 'https://fastcdn.hoyoverse.com/static-resource-v2/2023/11/08/6c10b7f037803ba9738096f9bd937d57_5941584852928509935.jpg',
    fields: [
      { label: 'Player UID', name: 'playerid', placeholder: 'Nhập UID của bạn...', type: 'text' },
      { label: 'Server', name: 'server', type: 'select', options: ['Asia', 'Europe', 'America', 'TW/HK/MO'] }
    ],
    packages: [
      { id: 1, amount: 'Thẻ Tháng', unit: 'Không Nguyệt Chúc Phúc', price: 109000 },
      { id: 2, amount: 60, unit: 'Đá Sáng Thế', price: 22000 },
      { id: 3, amount: '300 + 30', unit: 'Đá Sáng Thế', price: 109000 },
      { id: 4, amount: '980 + 110', unit: 'Đá Sáng Thế', price: 329000 },
      { id: 5, amount: '1980 + 260', unit: 'Đá Sáng Thế', price: 699000 },
      { id: 6, amount: '3280 + 600', unit: 'Đá Sáng Thế', price: 1099000 },
      { id: 7, amount: '6480 + 1600', unit: 'Đá Sáng Thế', price: 2199000 },
    ]
  },
  'zzz': {
    name: 'Zenless Zone Zero',
    provider: 'Hoyoverse',
    image: '/images/zzz-logo.png',
    banner: 'https://fastcdn.hoyoverse.com/static-resource-v4/2024/07/04/85010672e0ce11667d6052063f966b4c_2527027787346067098.jpg',
    fields: [
      { label: 'Player UID', name: 'playerid', placeholder: 'Nhập UID của bạn...', type: 'text' },
      { label: 'Server', name: 'server', type: 'select', options: ['Asia', 'Europe', 'America', 'TW/HK/MO'] }
    ],
    packages: [
      { id: 1, amount: 'Thẻ Tháng', unit: 'Hội Viên Inter-Knot', price: 109000 },
      { id: 2, amount: 60, unit: 'Film Trắng Đen', price: 22000 },
      { id: 3, amount: '300 + 30', unit: 'Film Trắng Đen', price: 109000 },
      { id: 4, amount: '980 + 110', unit: 'Film Trắng Đen', price: 329000 },
      { id: 5, amount: '1980 + 260', unit: 'Film Trắng Đen', price: 699000 },
      { id: 6, amount: '3280 + 600', unit: 'Film Trắng Đen', price: 1099000 },
      { id: 7, amount: '6480 + 1600', unit: 'Film Trắng Đen', price: 2199000 },
    ]
  },
  'hi3': {
    name: 'Honkai Impact 3rd',
    provider: 'Hoyoverse',
    image: '/images/hi3-logo.png',
    banner: 'https://fastcdn.hoyoverse.com/static-resource-v2/2023/04/26/663c9b7e0234a17924af99bd937d5786_5941584852928509935.jpg',
    fields: [
      { label: 'Player UID', name: 'playerid', placeholder: 'Nhập UID của bạn...', type: 'text' },
      { label: 'Server', name: 'server', type: 'select', options: ['SEA', 'Global', 'Europe', 'Americas'] }
    ],
    packages: [
      { id: 1, amount: 'Thẻ Tháng', unit: 'Monthly Pass', price: 89000 },
      { id: 2, amount: 330, unit: 'Pha Lê / B-chip', price: 89000 },
      { id: 3, amount: 990, unit: 'B-chip', price: 269000 },
      { id: 4, amount: 1320, unit: 'Pha Lê / B-chip', price: 329000 },
      { id: 5, amount: 3300, unit: 'Pha Lê / B-chip', price: 829000 },
      { id: 6, amount: 6600, unit: 'Pha Lê / B-chip', price: 1699000 },
    ]
  }
};

const GamePurchase: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const DISCOUNT_RATE = 0.05; // 5% Discount

  const game = gameId ? gamesData[gameId] : null;

  useEffect(() => {
    if (!game) {
      navigate('/nap-game');
      return;
    }

    // Set default values for select fields iff not already set
    if (game.fields) {
      const defaults: any = {};
      game.fields.forEach((f: any) => {
        if (f.type === 'select' && f.options) {
          defaults[f.name] = f.options[0];
        }
      });
      setFormData((prev: any) => ({ ...defaults, ...prev }));
    }
  }, [gameId, navigate]); // gameId is stable, navigate is stable

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const calculateDiscountedPrice = (price: number) => {
    return Math.floor(price * (1 - DISCOUNT_RATE));
  };

  const handlePurchase = async () => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua!', 'error');
      navigate('/login');
      return;
    }

    if (!selectedPackage) {
      showNotification('Vui lòng chọn gói nạp!', 'error');
      return;
    }

    // Kiểm tra fields
    if (game) {
      for (const field of game.fields) {
        if (!formData[field.name]) {
          showNotification(`Vui lòng nhập ${field.label}!`, 'error');
          return;
        }
      }
    }

    const discountedPrice = calculateDiscountedPrice(selectedPackage.price);

    if (user.balance < discountedPrice) {
      showNotification('Số dư không đủ! Vui lòng nạp thêm.', 'error');
      return;
    }

    const confirmed = await confirm({
      title: 'Xác nhận mua hàng',
      message: `Bạn có chắc muốn nạp ${selectedPackage.amount} ${selectedPackage.unit} cho tài khoản ${formData.playerid}?`,
      confirmLabel: 'Mua ngay',
      cancelLabel: 'Hủy'
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await api.post('/orders/game-topup', {
        gameId,
        gameName: game.name,
        packageId: selectedPackage.id,
        amount: selectedPackage.amount,
        unit: selectedPackage.unit,
        price: selectedPackage.price,
        formData
      });

      if (res.data.success) {
        showNotification('Đơn hàng đã được ghi nhận và đang chờ xử lý!', 'success');
        refreshUser();
        navigate('/profile/orders');
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Có lỗi xảy ra!', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!game) return null;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px', position: 'relative' }}>

      {/* Back button */}
      <Link
        to="/nap-game"
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', marginBottom: '30px', fontWeight: 600,
          textDecoration: 'none'
        }}
        className="hover-opacity"
      >
        <ChevronLeft size={20} /> Quay lại danh sách game
      </Link>

      <div className="purchase-grid">

        {/* Left Column: Form & Info */}
        <div>
          {/* Game Header */}
          <div className="glass-card" style={{ padding: '30px', borderRadius: '24px', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url("${game.banner}")`,
              backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
            }}></div>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '25px', alignItems: 'center' }}>
              <img
                src={game.image}
                alt={game.name}
                style={{ width: '100px', height: '100px', borderRadius: '20px', border: '3px solid var(--accent-primary)', objectFit: 'cover' }}
              />
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>{game.name}</h1>
                <p style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>NHÀ PHÁT HÀNH: {game.provider}</p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={14} color="#10b981" /> Bảo mật 100%
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Zap size={14} color="var(--accent-primary)" /> Xử lý 3-5m
                  </span>
                </div>
              </div>
            </div>

            {/* Promo Badge */}
            <div style={{
              position: 'absolute', top: '20px', right: '-35px',
              background: '#ff4757', color: 'white',
              padding: '5px 40px', transform: 'rotate(45deg)',
              fontWeight: 900, fontSize: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              zIndex: 2
            }}>
              GIẢM 5%
            </div>
          </div>

          {/* Form */}
          <div className="glass-card" style={{ padding: '30px', borderRadius: '24px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={20} color="var(--accent-primary)" /> THÔNG TIN TÀI KHOẢN
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {game.fields.map((field: any) => (
                <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      style={{
                        padding: '12px 15px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', outline: 'none'
                      }}
                    >
                      {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      style={{
                        padding: '12px 15px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', outline: 'none'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Package Selection */}
          <div className="glass-card" style={{ padding: '30px', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Gamepad2 size={20} color="var(--accent-primary)" /> CHỌN GÓI NẠP
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
              {game.packages.filter((p: any) => p.price >= 20000).map((pkg: any) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: selectedPackage?.id === pkg.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: selectedPackage?.id === pkg.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  className="package-card"
                >
                    <>
                      <p style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '5px' }}>{pkg.amount}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>{pkg.unit}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through', marginBottom: '2px' }}>
                          {pkg.price.toLocaleString()}đ
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                          {calculateDiscountedPrice(pkg.price).toLocaleString()}đ
                        </span>
                      </div>
                    </>

                  {selectedPackage?.id === pkg.id && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
                      <Zap size={14} fill="var(--accent-primary)" stroke="none" />
                    </div>
                  )}

                  <div style={{
                    position: 'absolute', top: '0', left: '0',
                    background: '#ff4757', color: 'white',
                    padding: '2px 8px', fontSize: '9px', fontWeight: 900,
                    borderRadius: '0 0 8px 0'
                  }}>
                    -5%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div style={{ position: 'sticky', top: '120px' }} className="sidebar-sticky">
          <div className="glass-card" style={{ padding: '25px', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
              CHI TIẾT ĐƠN HÀNG
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sản phẩm:</span>
                <span style={{ fontWeight: 700 }}>{game.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gói nạp:</span>
                <span style={{ fontWeight: 700 }}>{selectedPackage ? `${selectedPackage.amount} ${selectedPackage.unit}` : 'Chưa chọn'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Thanh toán:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>Ví Lumie Store</span>
              </div>

              {selectedPackage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Giảm giá (5%):</span>
                  <span style={{ fontWeight: 700, color: '#ff4757' }}>-{(selectedPackage.price * DISCOUNT_RATE).toLocaleString()}đ</span>
                </div>
              )}

              <div style={{ margin: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900 }}>
                <span>Tổng tiền:</span>
                <span style={{ color: 'var(--accent-primary)' }}>
                  {selectedPackage ? calculateDiscountedPrice(selectedPackage.price).toLocaleString() : 0}đ
                </span>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '15px', borderRadius: '12px',
                    background: 'var(--accent-primary)', color: 'black',
                    fontWeight: 800, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'all 0.3s'
                  }}
                  className="btn-purchase"
                >
                  {loading ? 'ĐANG XỬ LÝ...' : (
                    <>
                      XÁC NHẬN THANH TOÁN <ChevronRight size={18} />
                    </>
                  )}
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>
                  Bằng cách nhấn xác nhận, bạn đồng ý với <span style={{ color: 'var(--accent-primary)' }}>Điều khoản dịch vụ</span> của chúng tôi.
                </div>
              </div>
            </div>
          </div>

          {/* balance info */}
          <div className="glass-card" style={{ marginTop: '15px', padding: '15px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '10px' }}>
                <CreditCard size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Số dư hiện tại:</p>
                <p style={{ fontSize: '14px', fontWeight: 800 }}>{user ? user.balance.toLocaleString() : 0}đ</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/nap-tien')}
              style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              NẠP THÊM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePurchase;
