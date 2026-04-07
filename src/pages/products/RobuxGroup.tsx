import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Zap, ShieldCheck, Headphones, Image as ImageIcon, Loader2, ExternalLink, Users } from 'lucide-react';

const RobuxGroup: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const RATE = 200; // 1 Robux = 200 VNĐ
  const [robuxAmount, setRobuxAmount] = useState<number | string>('');
  const [username, setUsername] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [groupLink, setGroupLink] = useState('https://www.roblox.com/groups/33719487');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        if (res.data.roblox_group_link) setGroupLink(res.data.roblox_group_link);
      } catch (err) { console.error('Error fetching settings'); }
    };
    fetchSettings();
  }, []);

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

  const totalPrice = Number(robuxAmount) > 0 ? Number(robuxAmount) * RATE : 0;
  const quickPackages = [100, 500, 1000, 2000, 5000, 10000];

  const handleBuy = async () => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để mua hàng!', 'info');
      navigate('/login');
      return;
    }

    if (!robuxAmount || Number(robuxAmount) <= 0) {
      showNotification('Vui lòng nhập số lượng Robux hợp lệ!', 'error');
      return;
    }

    if (!username.trim()) {
      showNotification('Vui lòng nhập Username Roblox!', 'error');
      return;
    }

    if (user.balance < totalPrice) {
      showNotification('Số dư không đủ. Vui lòng nạp thêm!', 'error');
      navigate('/nap-tien');
      return;
    }

    if (!window.confirm(`Xác nhận thanh toán ${totalPrice.toLocaleString()}đ cho ${robuxAmount} Robux?`)) return;

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
        productId: 'robux-group',
        productName: `Mua ${robuxAmount} Robux (Group)`,
        price: totalPrice,
        amount: 1,
        options: {
          robux: robuxAmount,
          username,
          note,
          previewImage: finalImageUrl,
          type: 'group'
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }} className="robux-layout">
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Input Section */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
               <Zap size={20} fill="#10b981" color="#10b981" />
               <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>Nhập số lượng Robux Group</h2>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="number"
                className="auth-input"
                placeholder="Ví dụ: 1000"
                value={robuxAmount}
                onChange={(e) => setRobuxAmount(e.target.value)}
                style={{ 
                  height: '64px', fontSize: '1.5rem', paddingRight: '60px', fontWeight: 700,
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
                }}
              />
              <span style={{ 
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                color: '#10b981', fontWeight: 800, fontSize: '1.2rem'
              }}>R$</span>
            </div>
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              * Tỷ giá hiện tại: <strong>1 Robux = {RATE} VNĐ</strong>
            </p>
          </div>

          {/* Quick Package Section */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 700 }}>Gói đề xuất cho bạn</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {quickPackages.map(pkg => (
                <div 
                  key={pkg}
                  onClick={() => setRobuxAmount(pkg)}
                  className="glass-card robux-pkg-card"
                  style={{ 
                    padding: '24px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s', border: robuxAmount === pkg ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                    background: robuxAmount === pkg ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)'
                  }}
                >
                  <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    {pkg.toLocaleString()} <span style={{ fontSize: '1rem' }}>R$</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
                    {(pkg * RATE).toLocaleString()} VNĐ
                  </div>
                </div>
              ))}
            </div>

            {/* Link Group Section */}
            <a href={groupLink} target="_blank" rel="noopener noreferrer" className="glass-card" style={{ 
              display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', 
              textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(16, 185, 129, 0.2)'
            }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '16px', color: '#10b981' }}>
                <Users size={32} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'white' }}>Link Roblox Group (Cần vào Group)</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Bạn bắt buộc phải vào group trước khi mua hàng</p>
              </div>
              <ExternalLink size={20} color="var(--text-muted)" />
            </a>
          </div>
        </div>

        {/* Right Column - Order Form */}
        <div className="glass-card" style={{ padding: '32px', height: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '32px', fontWeight: 700 }}>Thông tin giao hàng</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Tên nhân vật Roblox (Username)</label>
              <input 
                className="form-control" 
                placeholder="Nhập chính xác username..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Ghi chú (Tài khoản/Mật khẩu hoặc yêu cầu khác)</label>
              <textarea 
                className="form-control" 
                placeholder="Để lại lưu ý cho cửa hàng tại đây..." 
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', resize: 'none' }}
              />
            </div>

            {/* Photo Upload Functionality */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '14px' }}>Tải ảnh đính kèm (Lên đến 500MB)</label>
              <input type="file" id="file-upload" hidden onChange={onFileChange} accept="image/*,video/*" />
              <label htmlFor="file-upload" className="glass-card" style={{ 
                display: 'block', border: '2px dashed rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '30px',
                textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
              }}>
                {previewUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                    <div style={{ marginTop: '10px', color: '#10b981', fontWeight: 600 }}>File: {selectedFile?.name}</div>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={24} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <div style={{ fontSize: '12px' }}>Bấm để chọn ảnh/video hoặc kéo thả vào đây</div>
                  </>
                )}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Loader2 className="spin" size={32} />
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
                <span style={{ color: 'var(--text-muted)' }}>Số lượng Robux:</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{Number(robuxAmount).toLocaleString()} R$</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Thành tiền:</span>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#10b981' }}>{totalPrice.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleBuy}
              disabled={loading}
              style={{ 
                height: '56px', borderRadius: '16px', background: '#10b981', 
                border: 'none', fontSize: '1.1rem', fontWeight: 800,
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
              }}
            >
              {loading ? <Loader2 size={24} className="spin" /> : 'Thanh Toán Ngay'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
               <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Zap size={12} fill="#10b981" /> Group 24h
               </div>
               <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <ShieldCheck size={12} /> An toàn 100%
               </div>
               <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Headphones size={12} /> Hỗ trợ 24/7
               </div>
            </div>
          </div>
        </div>

      </div>
      
      <style>{`
        .robux-pkg-card:hover {
          transform: translateY(-5px);
          background: rgba(239, 68, 68, 0.05) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
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

export default RobuxGroup;
