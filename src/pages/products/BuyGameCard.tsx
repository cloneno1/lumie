import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Gamepad2, ShieldCheck, Zap, CreditCard, ChevronRight, Copy, Check } from 'lucide-react';
import Loading from '../../components/Loading';

const BuyGameCard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [telco, setTelco] = useState('ZING');
  const [amount, setAmount] = useState<number>(50000);
  const [qty, setQty] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [purchasedCards, setPurchasedCards] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const cardTypes = [
    { value: 'ZING', label: 'Zing', icon: '💎', color: '#f59e0b', discount: '5%' },
    { value: 'GARENA', label: 'Garena', icon: '🎮', color: '#ef4444', discount: '3%' },
    { value: 'VCOIN', label: 'Vcoin', icon: '🪙', color: '#3b82f6', discount: '4%' },
    { value: 'GATE', label: 'Gate', icon: '🏛️', color: '#10b981', discount: '4%' },
  ];

  const amounts = [10000, 20000, 50000, 100000, 200000, 500000];

  const totalCost = amount * qty;

  const handleBuy = async () => {
    if (!user) {
      showNotification('Vui lòng đăng nhập để thực hiện!', 'info');
      navigate('/login');
      return;
    }

    if (user.balance < totalCost) {
      showNotification('Số dư của bạn không đủ! Vui lòng nạp thêm.', 'error');
      navigate('/nap-tien');
      return;
    }

    const telcoObj = cardTypes.find(t => t.value === telco);
    
    const isConfirmed = await confirm({
      title: 'Xác nhận mua thẻ',
      message: `Bạn đang mua ${qty} thẻ ${telcoObj?.label} mệnh giá ${amount.toLocaleString()}đ. Tổng thanh toán: ${totalCost.toLocaleString()}đ. Tiếp tục?`
    });

    if (!isConfirmed) return;

    setLoading(true);
    try {
      const response = await api.post('/buy-game-card', { telco, amount, qty });
      showNotification(response.data.message || 'Mua thẻ thành công!', 'success');
      setPurchasedCards(response.data.cards || []);
      refreshUser();
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý mua thẻ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    showNotification('Đã sao chép vào bộ nhớ tạm', 'info');
  };

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '1000px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px', position: 'relative' }}>
        <div className="glow-blob" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '100px', background: 'var(--accent-primary)', filter: 'blur(100px)', opacity: 0.15, zIndex: -1 }}></div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '12px' }}>
          Mua Thẻ <span className="gradient-text">Game Tự Động</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Hệ thống tự động trả thẻ 24/7 trực tiếp từ nhà phát hành với chiết khấu cực tốt.</p>
      </div>

      {!purchasedCards.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
          <div className="glass-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
            {/* Telco Selection */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '16px', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gamepad2 size={24} style={{ color: 'var(--accent-primary)' }} /> Chọn loại thẻ game
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                {cardTypes.map((type) => (
                  <div 
                    key={type.value}
                    onClick={() => setTelco(type.value)}
                    className="telco-card"
                    style={{ 
                      padding: '20px', borderRadius: '16px', cursor: 'pointer',
                      border: telco === type.value ? `2px solid ${type.color}` : '1px solid rgba(255,255,255,0.05)',
                      background: telco === type.value ? `${type.color}15` : 'rgba(255,255,255,0.02)',
                      textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: telco === type.value ? `0 10px 25px ${type.color}30` : 'none',
                      transform: telco === type.value ? 'translateY(-5px)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{type.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>{type.label}</div>
                    <div style={{ fontSize: '12px', color: type.color, fontWeight: 600 }}>Chiết khấu {type.discount}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Selection */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '16px', fontWeight: 700, fontSize: '1.1rem' }}>Mệnh giá thẻ</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                {amounts.map((amt) => (
                  <div 
                    key={amt}
                    onClick={() => setAmount(amt)}
                    style={{ 
                      padding: '16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                      border: amount === amt ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                      background: amount === amt ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                      color: amount === amt ? '#10b981' : 'white', fontWeight: 700,
                      transition: 'all 0.2s'
                    }}
                    className="hover-scale"
                  >
                    {amt.toLocaleString()}đ
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', marginBottom: '16px', fontWeight: 700, fontSize: '1.1rem' }}>Số lượng</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                 <input 
                   type="range" min="1" max="10" 
                   value={qty} onChange={(e) => setQty(parseInt(e.target.value))} 
                   style={{ flex: 1, accentColor: 'var(--accent-primary)' }} 
                 />
                 <span style={{ fontSize: '1.5rem', fontWeight: 900, minWidth: '40px', textAlign: 'center' }}>{qty}</span>
              </div>
            </div>

            {/* Checkout Area */}
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '20px', 
              border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '20px'
            }}>
               <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Tổng thanh toán ({qty} thẻ {cardTypes.find(t => t.value === telco)?.label}):</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {totalCost.toLocaleString()}đ
                    <span style={{ fontSize: '14px', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Đã trừ chiết khấu</span>
                  </div>
               </div>

               <button 
                 onClick={handleBuy}
                 disabled={loading}
                 className="btn btn-primary btn-glow"
                 style={{ padding: '16px 40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}
               >
                 {loading ? <Loading size={24} /> : (
                   <>Thanh Toán <ChevronRight size={20} /></>
                 )}
               </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '30px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}><Zap size={16} color="var(--accent-primary)"/> Trả thẻ 2-3s</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}><ShieldCheck size={16} color="var(--accent-primary)"/> Thẻ sạch 100%</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}><CreditCard size={16} color="var(--accent-primary)"/> Giao dịch an toàn</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card animate-slide-in" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ 
            width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', color: '#10b981'
          }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#10b981' }}>Giao Dịch Thành Công!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
            Bạn đã mua thành công {qty} thẻ {cardTypes.find(t => t.value === telco)?.label}. Vui lòng lưu lại thông tin thẻ bên dưới.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {purchasedCards.map((card, i) => (
              <div key={i} style={{ 
                background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--glass-border)', 
                borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'
              }}>
                 <div>
                   <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Mã thẻ (PIN)</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '2px' }}>{card.code || card.pin}</span>
                     <button onClick={() => handleCopy(card.code || card.pin, i)} className="btn-icon">
                       {copiedIndex === i ? <Check size={16} color="#10b981"/> : <Copy size={16}/>}
                     </button>
                   </div>
                 </div>
                 <div>
                   <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Số Serial</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{card.serial}</span>
                     <button onClick={() => handleCopy(card.serial, i + 100)} className="btn-icon">
                       {copiedIndex === i + 100 ? <Check size={16} color="#10b981"/> : <Copy size={16}/>}
                     </button>
                   </div>
                 </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setPurchasedCards([])}>Mua thêm thẻ</button>
            <button className="btn glass-panel" onClick={() => navigate('/profile/orders')}>Lịch sử mua</button>
          </div>
        </div>
      )}

      <style>{`
        .telco-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.05);
        }
        .btn-glow {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          transition: transform 0.3s, box-shadow 0.3s;
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
          0% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default BuyGameCard;
