import { useState, useEffect } from 'react';
import { Crown, Star, TrendingUp, Trophy, Calendar, Info, Gift, Zap } from 'lucide-react';
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
  lastTopupAt: string;
  nextLevel: VipLevel | null;
  currentLevelData: VipLevel;
  allLevels: VipLevel[];
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

  useEffect(() => {
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
    fetchData();
  }, []);

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
  const nextMin = status?.nextLevel?.minPoints || 3000000;
  const progress = Math.min(100, (currentPoints / nextMin) * 100);

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
          <span style={{ fontWeight: 700, letterSpacing: '1px', fontSize: '0.9rem' }}>HỆ THỐNG ĐẶC QUYỀN VIP</span>
        </div>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>
          Đẳng Cấp <span className="gradient-text">Lumie Store</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Tích lũy điểm VIP thông qua nạp thẻ và giao dịch để nhận những ưu đãi độc quyền, giảm giá sâu và hỗ trợ ưu tiên.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }} className="vip-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* My VIP Status Card */}
          <div className="glass-panel" style={{ 
            padding: '40px', 
            borderRadius: '32px',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <Crown size={200} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '24px', 
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
              }}>
                <Crown size={40} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{status?.currentLevelData?.label || 'Thành viên'}</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Chào mừng, <span style={{ color: 'white', fontWeight: 600 }}>{user?.username}</span></p>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiến trình lên {status?.nextLevel?.label || 'Max'}</span>
                <span style={{ fontWeight: 700 }}>{currentPoints.toLocaleString()} / {nextMin.toLocaleString()} XP</span>
              </div>
              <div style={{ 
                height: '14px', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '10px', 
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #eab308, #10b981)',
                  borderRadius: '10px',
                  boxShadow: '0 0 15px rgba(234, 179, 8, 0.4)',
                  transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Tổng nạp</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{status?.totalTopup.toLocaleString()}đ</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Đặc quyền hiện tại</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{status?.currentLevelData?.perk}</div>
              </div>
            </div>
          </div>

          {/* Perks Grid */}
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Gift size={24} style={{ color: 'var(--accent-primary)' }} />
              Bảng Quyền Lợi VIP
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {status?.allLevels.map((lvl) => (
                <div key={lvl.level} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 1fr 200px', 
                  alignItems: 'center',
                  padding: '20px 24px',
                  background: lvl.level <= currentLevel ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '20px',
                  border: `1px solid ${lvl.level <= currentLevel ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: lvl.level > currentLevel ? 0.6 : 1,
                  transition: 'transform 0.3s'
                }} className="hover-lift">
                   <div style={{ fontWeight: 800, color: lvl.level === 0 ? 'var(--text-muted)' : lvl.level === 10 ? '#f59e0b' : 'var(--accent-primary)', fontSize: '1.1rem' }}>
                     {lvl.label}
                   </div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                     {lvl.perk}
                   </div>
                   <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>
                     {lvl.minPoints.toLocaleString()} XP
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Rankings & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Rankings Card */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px' }}>
             <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <Trophy size={24} style={{ color: '#eab308' }} />
               Bảng Xếp Hạng
             </h3>

             <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', marginBottom: '24px' }}>
               {(['weekly', 'monthly', 'total'] as const).map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveRankTab(tab)}
                   style={{ 
                     flex: 1, 
                     padding: '10px', 
                     borderRadius: '10px',
                     background: activeRankTab === tab ? 'var(--gradient-primary)' : 'transparent',
                     color: activeRankTab === tab ? 'white' : 'var(--text-muted)',
                     fontSize: '0.85rem',
                     fontWeight: 600,
                     border: 'none',
                     cursor: 'pointer',
                     transition: 'all 0.2s'
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
                     width: '28px', 
                     height: '28px', 
                     borderRadius: '50%', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     background: index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.05)',
                     color: index < 3 ? 'black' : 'white',
                     fontWeight: 800,
                     fontSize: '0.75rem'
                   }}>
                     {index + 1}
                   </div>
                   <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden' }}>
                     <img src={rank.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rank.username}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rank.username}</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{rank.amount.toLocaleString()}đ</div>
                   </div>
                   {index === 0 && <Crown size={16} color="#eab308" />}
                 </div>
               )) : (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px' }}>Chưa có dữ liệu xếp hạng.</p>
               )}
             </div>
          </div>

          {/* Info Card */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Info size={18} />
              Quy tắc VIP
            </h4>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li style={{ display: 'flex', gap: '8px' }}>
                <Zap size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
                <span>Nạp 1,000đ = 1,000 XP Điểm VIP.</span>
              </li>
              <li style={{ display: 'flex', gap: '8px' }}>
                <Calendar size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-blue)' }} />
                <span>Không nạp tiền trong 14 ngày sẽ bị trừ điểm XP mỗi ngày (1% số điểm dư).</span>
              </li>
              <li style={{ display: 'flex', gap: '8px' }}>
                <TrendingUp size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#eab308' }} />
                <span>Đạt mốc 2,500,000đ nạp tích lũy để nhận 1 tháng miễn phí dịch vụ bạn yêu thích nhất.</span>
              </li>
              <li style={{ display: 'flex', gap: '8px' }}>
                <Star size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
                <span>VIP 9 và 10 có thể đổi mã quà tặng hoặc vé tham gia các sự kiện đặc biệt hàng tuần.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VIP;
