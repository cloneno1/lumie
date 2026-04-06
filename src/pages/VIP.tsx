import { useState, useEffect } from 'react';
import { Crown, TrendingUp, Trophy, Info, Gift, Zap, Ticket, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface VipLevel {
  level: number;
  minPoints: number;
  label: string;
  perk: string;
}

interface VipStatus {
  vipLevel: number;
  vipPoints: number;
  totalTopup: number;
  gachaTickets: number;
  nextLevel: VipLevel | null;
  currentLevelData: VipLevel;
  allLevels: VipLevel[];
  claimedMilestones: number[];
}

interface RankingUser {
  id: string;
  username: string;
  amount: number;
  avatar?: string;
}

interface Rankings {
  total: RankingUser[];
  weekly: RankingUser[];
  monthly: RankingUser[];
}

function VIP() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState<VipStatus | null>(null);
  const [rankings, setRankings] = useState<Rankings | null>(null);
  const [activeRankTab, setActiveRankTab] = useState<'weekly' | 'monthly' | 'total'>('weekly');
  const [loading, setLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [gachaResult, setGachaResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [statusRes, rankRes] = await Promise.all([
        api.get('/user/vip-status'),
        api.get('/stats/vip-rankings')
      ]);
      setStatus(statusRes.data);
      setRankings(rankRes.data);
    } catch (err) {
      console.error('Error fetching VIP data:', err);
      showNotification('Không thể tải dữ liệu VIP. Vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRollGacha = async () => {
    if (isRolling) return;
    setIsRolling(true);
    setGachaResult(null);

    try {
      const res = await api.post('/gacha/roll');
      // Simulate spinning effect for 2 seconds
      setTimeout(() => {
        setGachaResult(res.data.reward);
        setStatus(prev => prev ? { ...prev, gachaTickets: res.data.ticketsLeft } : null);
        showNotification(res.data.message, 'success');
        setIsRolling(false);
      }, 2000);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi khi quay Gacha', 'error');
      setIsRolling(false);
    }
  };

  const handleClaimMilestone = async (milestone: number) => {
    try {
      const res = await api.post('/user/claim-vip-milestone', { milestone });
      setStatus(prev => prev ? { ...prev, claimedMilestones: res.data.claimedMilestones } : null);
      showNotification(res.data.message, 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi khi nhận quà mốc VIP', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div className="loader" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Đang tải dữ liệu VIP...</p>
      </div>
    );
  }

  const currentLevel = status?.vipLevel || 0;
  const currentPoints = status?.vipPoints || 0;
  const nextMin = status?.nextLevel?.minPoints || 0;
  const progress = nextMin > 0 ? Math.min(100, (currentPoints / nextMin) * 100) : 100;

  const milestoneRewards = [
    { level: 5, threshold: 5000000, reward: 'Gói YouTube 3 tháng' },
    { level: 6, threshold: 9000000, reward: '3 Deco 66 cá' },
    { level: 7, threshold: 15000000, reward: '1 Deco 79 + 1 Deco 131' },
    { level: 8, threshold: 21000000, reward: '4 Tháng Spotify Premium' },
    { level: 9, threshold: 28000000, reward: '4 Tháng Netflix Premium' },
    { level: 10, threshold: 40000000, reward: '6 Tháng Gói bất kỳ (Shop)' }
  ];

  const gachaOdds = [
    { name: 'Netflix 1 tháng', prob: '0.5%', color: '#e50914' },
    { name: 'Spotify 1 tháng', prob: '1.0%', color: '#1db954' },
    { name: 'Deco 66 cá', prob: '1.5%', color: '#3b82f6' },
    { name: '20.000 VNĐ', prob: '5.0%', color: '#f59e0b' },
    { name: 'YouTube 1 tháng', prob: '12.0%', color: '#ff0000' },
    { name: '10.000 VNĐ', prob: '25.0%', color: '#10b981' },
    { name: '5.000 VNĐ', prob: '55.0%', color: '#6366f1' }
  ];

  const getRankData = () => {
    if (!rankings) return [];
    return rankings[activeRankTab];
  };

  return (
    <div className="container" style={{ padding: '60px 24px', maxWidth: '1200px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }} className="animate-fade-in">
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '12px', 
          background: 'rgba(234, 179, 8, 0.1)', 
          padding: '8px 20px', 
          borderRadius: '50px',
          color: '#eab308',
          marginBottom: '20px',
          border: '1px solid rgba(234, 179, 8, 0.2)'
        }}>
          <Crown size={20} />
          <span style={{ fontWeight: 700, letterSpacing: '1px', fontSize: '0.9rem' }}>HỆ THỐNG ĐẶC QUYỀN VIP & GACHA</span>
        </div>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', fontWeight: 800 }}>
          Trải Nghiệm <span className="gradient-text">Thượng Lưu</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Tích lũy VIP để nhận vé Gacha hàng tháng và quà tặng theo mốc nạp. 
          Cấp VIP càng cao, tỉ lệ trúng quà hiếm càng lớn!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }} className="vip-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* My VIP Status Card */}
          <div className="glass-panel" style={{ 
            padding: '40px', 
            borderRadius: '40px',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15 }}>
              <Crown size={150} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ 
                  width: '70px', height: '70px', borderRadius: '22px', 
                  background: 'var(--gradient-primary)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
                }}>
                  <Crown size={36} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.6rem', margin: '0 0 4px', fontWeight: 700 }}>{status?.currentLevelData?.label || 'Thành viên'}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Sở hữu bởi <span style={{ color: 'white', fontWeight: 600 }}>{user?.username}</span></p>
                </div>
              </div>
              
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '18px',
                border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Vé Gacha tháng này</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Ticket size={24} /> {status?.gachaTickets || 0}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cấp độ tiếp theo: <strong style={{ color: 'white' }}>{status?.nextLevel?.label || 'Tối đa'}</strong></span>
                <span style={{ fontWeight: 700 }}>{currentPoints.toLocaleString()} / {nextMin.toLocaleString()} XP</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', padding: '1px' }}>
                <div style={{ 
                  width: `${progress}%`, height: '100%', 
                  background: 'linear-gradient(90deg, #eab308, #10b981)',
                  borderRadius: '10px', boxShadow: '0 0 15px rgba(234, 179, 8, 0.5)',
                  transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Tổng nạp</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{status?.totalTopup.toLocaleString()}đ</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Ưu đãi chiết khấu</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#eab308' }}>Giảm {(status as any)?.currentLevelData?.discount || 0}%</div>
              </div>
            </div>
          </div>

          {/* Gacha Wheel Section */}
          <div className="glass-panel" style={{ padding: '40px', borderRadius: '40px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Ticket size={28} style={{ color: '#6366f1' }} /> Vòng Quay Gacha May Mắn
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>Cấp vé hàng tháng</div>
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>VIP càng cao - Tỉ lệ càng dễ</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px', alignItems: 'center' }} className="gacha-grid">
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div className={`gacha-display ${isRolling ? 'rolling' : ''}`} style={{ 
                  width: '100%', height: '240px', background: 'rgba(0,0,0,0.3)', borderRadius: '30px', 
                  border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '24px', flexDirection: 'column', gap: '16px', overflow: 'hidden'
                }}>
                  {isRolling ? (
                    <div style={{ textAlign: 'center' }}>
                      <Sparkles size={60} className="spin-slow" color="#eab308" />
                      <p style={{ marginTop: '20px', fontWeight: 700, color: '#eab308' }}>Đang quay...</p>
                    </div>
                  ) : gachaResult ? (
                    <div className="animate-pop-in" style={{ textAlign: 'center' }}>
                      <Trophy size={60} color={gachaResult.color || '#eab308'} />
                      <h4 style={{ fontSize: '1.5rem', margin: '16px 0 8px' }}>{gachaResult.name}</h4>
                      <p style={{ color: 'var(--text-muted)' }}>Món quà đã được gửi tới hòm thư!</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                      <Ticket size={60} />
                      <p style={{ marginTop: '16px' }}>Nhấn nút bên dưới để quay</p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleRollGacha}
                  disabled={isRolling || (status?.gachaTickets || 0) <= 0}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '18px', fontSize: '1.1rem', borderRadius: '20px' }}
                >
                  {isRolling ? 'Đang quay...' : (status?.gachaTickets || 0) > 0 ? `QUAY NGAY (CÒN ${status?.gachaTickets} VÉ)` : 'HẾT VÉ THÁNG NÀY'}
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} /> Tỉ lệ trúng thưởng
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {gachaOdds.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }}></div>
                        {item.name}
                      </span>
                      <span style={{ color: item.color, fontWeight: 700 }}>{item.prob}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Milestone Rewards Section */}
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Gift size={28} style={{ color: '#f59e0b' }} /> Phần Thưởng Mốc VIP Nạp
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {milestoneRewards.map((ms) => {
                const isReached = currentLevel >= ms.level;
                const isClaimed = status?.claimedMilestones.includes(ms.level);
                
                return (
                  <div key={ms.level} className="glass-panel" style={{ 
                    padding: '24px', borderRadius: '30px', border: `1px solid ${isReached ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                    background: isReached ? 'rgba(245, 158, 11, 0.03)' : 'rgba(255,255,255,0.01)',
                    opacity: isReached ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ 
                        background: isReached ? '#f59e0b' : 'rgba(255,255,255,0.1)', 
                        color: isReached ? 'black' : 'white',
                        padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800
                      }}>
                        VIP {ms.level}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mốc: {ms.threshold.toLocaleString()}đ</div>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', margin: '0 0 8px', color: isReached ? 'white' : 'var(--text-muted)' }}>{ms.reward}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Quà tặng đặc biệt khi đạt mốc nạp tích lũy {ms.threshold.toLocaleString()}đ</p>
                    
                    <button 
                      onClick={() => handleClaimMilestone(ms.level)}
                      disabled={!isReached || isClaimed}
                      className={`btn ${isClaimed ? 'btn-secondary' : isReached ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '12px' }}
                    >
                      {isClaimed ? 'Đã nhận' : isReached ? 'Nhận ngay' : `Đạt VIP ${ms.level} để nhận`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Rankings & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Rankings Card */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '40px', border: '1px solid rgba(234, 179, 8, 0.1)' }}>
             <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <Trophy size={26} style={{ color: '#f59e0b' }} /> Bảng Xếp Hạng
             </h3>

             <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', marginBottom: '24px' }}>
               {(['weekly', 'monthly', 'total'] as const).map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveRankTab(tab)}
                   style={{ 
                     flex: 1, padding: '10px', borderRadius: '12px',
                     background: activeRankTab === tab ? 'var(--gradient-primary)' : 'transparent',
                     color: activeRankTab === tab ? 'white' : 'var(--text-muted)',
                     fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                   }}
                 >
                   {tab === 'weekly' ? 'Tuần' : tab === 'monthly' ? 'Tháng' : 'Tổng'}
                 </button>
               ))}
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {getRankData().length > 0 ? getRankData().map((rank, index) => (
                 <div key={rank.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                   <div style={{ 
                     width: '30px', height: '30px', borderRadius: '50%', display: 'flex', 
                     alignItems: 'center', justifyContent: 'center',
                     background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.05)',
                     color: index < 3 ? 'black' : 'white', fontWeight: 800, fontSize: '0.8rem'
                   }}>
                     {index + 1}
                   </div>
                   <div style={{ width: '42px', height: '42px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                     <img src={rank.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rank.username}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rank.username}</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{rank.amount.toLocaleString()}đ</div>
                   </div>
                   {index === 0 && <Crown size={16} color="#f59e0b" />}
                 </div>
               )) : (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', padding: '20px' }}>Chưa có dữ liệu xếp hạng.</p>
               )}
             </div>
          </div>

          {/* Rules Card */}
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.1rem' }}>
              <Info size={20} color="#3b82f6" /> Quy tắc VIP & Gacha
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Zap size={18} style={{ flexShrink: 0, color: 'var(--accent-primary)' }} />
                <p>Nạp 1,000đ = 1,000 XP. Điểm XP dùng để nâng cấp VIP vĩnh viễn.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Ticket size={18} style={{ flexShrink: 0, color: '#6366f1' }} />
                <p>Mỗi tháng bạn nhận được số vé Gacha tương ứng với cấp VIP. Vé sẽ được reset vào ngày 1 hàng tháng.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Gift size={18} style={{ flexShrink: 0, color: '#f59e0b' }} />
                <p>Quà trúng thưởng từ Gacha (Sản phẩm/Deco) vui lòng liên hệ Admin qua Ticket Discord để nhận.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <TrendingUp size={18} style={{ flexShrink: 0, color: '#eab308' }} />
                <p>Có thể quy đổi phần thưởng mốc VIP sang tiền mặt tương ứng (liên hệ hỗ trợ).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VIP;
