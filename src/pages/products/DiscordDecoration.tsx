import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Zap, ShieldCheck, Headphones, Loader2, Sparkles, User, Gift, Info, Image as ImageIcon } from 'lucide-react';

const DiscordDecoration: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [partnerDiscount, setPartnerDiscount] = useState(20);

  React.useEffect(() => {
    api.get('/settings/public').then(res => {
      if (res.data.partner_discount_percent) {
        setPartnerDiscount(parseInt(res.data.partner_discount_percent));
      }
    }).catch(() => {});
  }, []);

  const [method, setMethod] = useState<'LOGIN' | 'GIFT'>('LOGIN');
  const [selectedPrice, setSelectedPrice] = useState<number>(50000);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pricePackages = [
    { label: '50.000đ', value: 50000 },
    { label: '100.000đ', value: 100000 },
    { label: '200.000đ', value: 200000 },
    { label: '500.000đ', value: 500000 },
    { label: '1.000.000đ', value: 1000000 },
    { label: '2.000.000đ', value: 2000000 },
  ];

  const activePackages = user?.is_partner 
    ? pricePackages.map(pkg => {
        const discountedValue = Math.floor(pkg.value * (1 - partnerDiscount / 100));
        return {
          label: `${discountedValue.toLocaleString()}đ`,
          value: discountedValue
        };
      })
    : pricePackages;

  // Cập nhật giá được chọn nếu bảng giá thay đổi (tránh lỗi giá cũ khi mới fetch xong discount)
  React.useEffect(() => {
    if (activePackages.length > 0) {
      const currentPkg = pricePackages.find(p => p.value === 50000);
      if (currentPkg) {
         const activePrice = user?.is_partner ? Math.floor(currentPkg.value * (1 - partnerDiscount / 100)) : currentPkg.value;
         setSelectedPrice(activePrice);
      }
    }
  }, [partnerDiscount, user?.is_partner]);

  const handleLinkDiscord = async () => {
    try {
      const { data } = await api.get('/auth/discord/url');
      window.location.href = data.url;
    } catch (err) {
      showNotification('Không thể lấy link liên kết Discord.', 'error');
    }
  };

  const handleVerifyPartner = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/discord/verify-partner');
      showNotification(data.message, data.is_partner ? 'success' : 'info');
      await refreshUser();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Có lỗi xảy ra khi xác thực.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        showNotification('File quá lớn! Giới hạn 500MB.', 'error');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleBuy = async () => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua hàng!', 'info');
      navigate('/login');
      return;
    }

    if (method === 'LOGIN') {
      if (!account.trim() || !password.trim()) {
        showNotification('Vui lòng nhập tài khoản và mật khẩu Discord!', 'error');
        return;
      }
    } else {
      if (!account.trim()) {
        showNotification('Vui lòng nhập Username Discord nhận quà!', 'error');
        return;
      }
    }

    if (user.balance < selectedPrice) {
      showNotification('Số dư không đủ. Vui lòng nạp thêm!', 'error');
      navigate('/nap-tien');
      return;
    }

    const confirmed = await confirm({
      title: 'Xác nhận thanh toán',
      message: `Xác nhận mua Decoration Discord (${method === 'LOGIN' ? 'Vào Acc' : 'Quà Tặng'}) với giá ${selectedPrice.toLocaleString()}đ?`
    });

    if (!confirmed) return;

    setLoading(true);
    let finalImageUrl = '';

    try {
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/upload-proof', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
        setUploading(false);
      }

      await api.post('/orders/create', {
        productId: 'discord-decoration',
        productName: `Decoration Discord - ${method === 'LOGIN' ? 'Login' : 'Gift'}`,
        price: selectedPrice,
        amount: 1,
        options: {
          method,
          account,
          password: method === 'LOGIN' ? password : '-',
          backupCodes: method === 'LOGIN' ? backupCodes : '-',
          note,
          price: selectedPrice,
          image: finalImageUrl,
          partner: user?.is_partner || false
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
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
        <div className="glow-blob" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '100px', background: 'var(--accent-primary)', filter: 'blur(80px)', opacity: 0.2, zIndex: -1 }}></div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px' }}>
          Decoration <span className="gradient-text">Discord</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Mua Avatar Decoration và Profile Effects cực chất cho profile Discord của bạn.</p>
        
        {user?.is_partner && (
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            marginTop: '15px', padding: '8px 20px', borderRadius: '30px',
            background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.9rem'
          }}>
            <Sparkles size={16} /> BẢNG GIÁ ƯU ĐÃI CHO PARTNER DISCORD
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }} className="robux-layout">
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Partner Status Check */}
          {!user?.is_partner && (
            <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), transparent)' }}>
               <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                 <div style={{ background: 'rgba(59, 130, 246, 0.14)', padding: '12px', borderRadius: '12px', color: 'var(--accent-blue)' }}>
                   <Sparkles size={24} />
                 </div>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>Ưu đãi cho Partner</div>
                   <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                     Liên kết Discord và đạt Role <strong>partner</strong> trong server <code>1479294548554416268</code> để mở khóa bảng giá VIP.
                   </p>
                 </div>
                 {!user?.discord_id ? (
                   <button onClick={handleLinkDiscord} className="btn" style={{ background: '#5865F2', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>Liên kết ngay</button>
                 ) : (
                   <button onClick={handleVerifyPartner} disabled={loading} className="btn glass-panel" style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>Xác thực Partner</button>
                 )}
               </div>
            </div>
          )}

          {/* Method Selection */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--accent-primary)', padding: '6px', borderRadius: '8px', color: 'black' }}><Info size={18} /></div>
              Chọn hình thức nhận hàng
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div 
                onClick={() => setMethod('LOGIN')}
                className={`glass-card method-card ${method === 'LOGIN' ? 'active-method' : ''}`}
                style={{ 
                  padding: '24px', textAlign: 'center', cursor: 'pointer',
                  border: method === 'LOGIN' ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                  background: method === 'LOGIN' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.3s'
                }}
              >
                <User size={32} style={{ marginBottom: '12px', color: method === 'LOGIN' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Vào Account</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Cần tài khoản/mật khẩu</div>
              </div>
              <div 
                onClick={() => setMethod('GIFT')}
                className={`glass-card method-card ${method === 'GIFT' ? 'active-method' : ''}`}
                style={{ 
                  padding: '24px', textAlign: 'center', cursor: 'pointer',
                  border: method === 'GIFT' ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                  background: method === 'GIFT' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ position: 'relative', width: '32px', height: '32px', margin: '0 auto 12px' }}>
                   <Gift size={32} style={{ color: method === 'GIFT' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                   {user?.is_partner && <Sparkles size={16} style={{ position: 'absolute', top: '-8px', right: '-8px', color: '#eab308' }} />}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Gửi Quà Tặng</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Chỉ cần Username</div>
              </div>
            </div>
          </div>

          {/* Price Selection */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#eab308', padding: '6px', borderRadius: '8px', color: 'black' }}><Sparkles size={18} /></div>
              Chọn mệnh giá cần mua
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {activePackages.map((pkg) => (
                <div 
                  key={pkg.value}
                  onClick={() => setSelectedPrice(pkg.value)}
                  className={`glass-card price-pkg ${selectedPrice === pkg.value ? 'active-price' : ''}`}
                  style={{ 
                    padding: '20px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)'
                  }}
                >
                  <div style={{ color: selectedPrice === pkg.value ? '#eab308' : 'white', fontSize: '1.2rem', fontWeight: 800, transition: 'color 0.3s' }}>
                    {pkg.label}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Info size={14} /> Bạn hãy chọn mệnh giá bằng hoặc cao hơn giá của Decoration bạn muốn mua trong Shop Discord. Tiền thừa sẽ được cộng vào Discord Balance hoặc hoàn lại tùy trường hợp.
            </p>
          </div>
        </div>

        {/* Right Column - Order Form */}
        <div className="glass-card" style={{ padding: '32px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '32px', fontWeight: 700 }}>Thông tin đơn hàng</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {method === 'LOGIN' ? (
              <>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Email hoặc Số điện thoại Discord</label>
                  <input 
                    className="form-control" 
                    placeholder="example@gmail.com" 
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Mật khẩu Discord</label>
                  <input 
                    type="password"
                    className="form-control" 
                    placeholder="********" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Mã dự phòng (Backup Codes)</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Nhập ít nhất 2 mã dự phòng..." 
                    rows={2}
                    value={backupCodes}
                    onChange={(e) => setBackupCodes(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Username Discord nhận quà</label>
                <input 
                  className="form-control" 
                  placeholder="vinhphu_01" 
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Ghi chú sản phẩm muốn mua</label>
              <textarea 
                className="form-control" 
                placeholder="Ví dụ: Lấy bộ Avatar Decoration 'Fantasy'..." 
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            {/* Photo Upload Section */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Tải ảnh đính kèm (Lấy từ Shop Discord)</label>
              <input type="file" id="file-upload" hidden onChange={onFileChange} accept="image/*" />
              <label htmlFor="file-upload" className="glass-card" style={{ 
                display: 'block', border: '2px dashed rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '20px',
                textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
              }}>
                {previewUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                    <div style={{ marginTop: '10px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 600 }}>File: {selectedFile?.name}</div>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={20} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontSize: '12px' }}>Tải ảnh Decoration muốn mua để tránh nhầm lẫn</div>
                  </>
                )}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Loader2 className="spin" size={24} />
                  </div>
                )}
              </label>
            </div>

            {/* Order Summary */}
            <div style={{ 
              marginTop: '10px', padding: '20px', borderRadius: '16px', 
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hình thức:</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{method === 'LOGIN' ? 'Vào Acc' : 'Gửi Quà'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent-primary)' }}>{selectedPrice.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-glow" 
              onClick={handleBuy}
              disabled={loading}
              style={{ 
                height: '56px', borderRadius: '16px', 
                fontSize: '1.1rem', fontWeight: 800
              }}
            >
              {loading ? <Loader2 size={24} className="spin" /> : 'Thanh Toán Ngay'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
               <div style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Zap size={12} fill="var(--accent-primary)" /> Tự động
               </div>
               <div style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <ShieldCheck size={12} /> An toàn
               </div>
               <div style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Headphones size={12} /> Hỗ trợ
               </div>
            </div>
          </div>
        </div>

      </div>
      
      <style>{`
        .active-method {
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3) !important;
          border: 2px solid var(--accent-primary) !important;
          background: linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05)) !important;
          transform: translateY(-8px);
        }
        .active-price {
          box-shadow: 0 10px 30px rgba(234, 179, 8, 0.3) !important;
          border: 2px solid #eab308 !important;
          background: linear-gradient(145deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05)) !important;
          transform: translateY(-8px);
        }
        .price-pkg:hover:not(.active-price) {
          transform: translateY(-5px);
          border-color: rgba(234, 179, 8, 0.5) !important;
          background: rgba(234, 179, 8, 0.05) !important;
          box-shadow: 0 5px 15px rgba(234, 179, 8, 0.1);
        }
        .method-card:hover:not(.active-method) {
          transform: translateY(-5px);
          border-color: rgba(16, 185, 129, 0.5) !important;
          background: rgba(16, 185, 129, 0.05) !important;
          box-shadow: 0 5px 15px rgba(16, 185, 129, 0.1);
        }
        .btn-glow {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
        }
        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .glow-blob {
          animation: pulse-glow 4s ease-in-out infinite alternate;
        }
        @keyframes pulse-glow {
          0% { opacity: 0.15; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.1); }
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

export default DiscordDecoration;
