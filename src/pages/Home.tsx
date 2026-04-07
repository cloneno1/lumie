import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Users, Trophy, Star, Heart, Activity, Crown, Headset } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [feedbackCount, setFeedbackCount] = useState('5,000+');
  const [topRechargers, setTopRechargers] = useState<any[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<'monthly' | 'total'>('monthly');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const [statsRes, rankRes, activityRes] = await Promise.all([
        api.get('/stats'),
        api.get('/stats/vip-rankings'),
        api.get('/stats/recent-activity')
      ]);
      
      if (statsRes.data.totalFeedbacks) {
        setFeedbackCount(statsRes.data.totalFeedbacks.toLocaleString() + '+');
      }
      
      // Select rankings based on type
      const rankings = rankRes.data[leaderboardType] || [];
      setTopRechargers(rankings);
      setRecentActivity(activityRes.data);
    } catch (err) {
      console.error('Lỗi tải thống kê:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [leaderboardType]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero container animate-fade-in" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '24px' }}>
          Dịch vụ Digital <br/> 
          <span className="gradient-text">Uy Tín & Chất Lượng.</span>
        </h1>
        <p style={{ maxWidth: '700px', margin: '0 auto 40px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          Lumie Store cung cấp các dịch vụ Discord Nitro, Robux, YouTube Premium... với giá cả cạnh tranh, 
          hệ thống giao dịch tự động 24/7 và hỗ trợ khách hàng chuyên nghiệp.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            Mua Hàng Ngay
          </Link>
          <Link to="/nap-tien" className="btn glass-panel" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            Nạp Tiền Tài Khoản
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <div className="container" style={{ marginBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
          {[
            { label: 'Khách hàng', value: '10,000+', icon: <Users size={24} /> },
            { label: 'Đơn hàng thành công', value: '50,000+', icon: <ShieldCheck size={24} /> },
            { label: 'Đối tác tin cậy', value: '100+', icon: <Trophy size={24} /> },
            { label: 'Đánh giá 5 sao', value: feedbackCount, icon: <Star size={24} /> }
          ].map((stat, i) => (
            <div key={i} className="glass-card animate-fade-in" style={{ padding: '30px', textAlign: 'center', animationDelay: `${i * 0.1}s` }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
              <h2 style={{ fontSize: '2rem', margin: '0 0 5px' }}>{stat.value}</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', marginBottom: '100px' }}>
        {/* Top Rechargers Leaderboard */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f59e0b20', padding: '10px', borderRadius: '12px' }}>
                <Trophy size={24} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Đua TOP Nạp Thẻ</h2>
            </div>
            
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                onClick={() => setLeaderboardType('monthly')}
                style={{ 
                  padding: '4px 12px', fontSize: '12px', borderRadius: '6px', border: 'none',
                  background: leaderboardType === 'monthly' ? 'var(--accent-primary)' : 'transparent',
                  color: leaderboardType === 'monthly' ? '#000' : '#fff', cursor: 'pointer'
                }}
              >Tháng này</button>
              <button 
                onClick={() => setLeaderboardType('total')}
                style={{ 
                  padding: '4px 12px', fontSize: '12px', borderRadius: '6px', border: 'none',
                  background: leaderboardType === 'total' ? 'var(--accent-primary)' : 'transparent',
                  color: leaderboardType === 'total' ? '#000' : '#fff', cursor: 'pointer'
                }}
              >Tổng nạp</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingStats ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '12px' }}></div>)
            ) : topRechargers.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Chưa có dữ liệu</p>
            ) : (
              topRechargers.map((u, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', 
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)', 
                  borderRadius: '16px', border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ 
                    width: '28px', height: '28px', borderRadius: '6px', 
                    background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {u.username}
                      {u.amount >= 2500000 && <Crown size={14} color="#f59e0b" />}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{u.amount.toLocaleString()}đ</div>
                  </div>
                  {idx === 0 && <Sparkles size={18} color="#f59e0b" />}
                </div>
              ))
            )}
            
            <div style={{ 
              marginTop: '12px', padding: '12px', borderRadius: '12px', 
              background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)',
              fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center'
            }}>
              Mốc nạp <strong>2.5m</strong> & <strong>3.5m</strong>: Nhận quà Spotify Premium! 
              <Link to="/nap-tien" style={{ marginLeft: '6px', color: '#60a5fa', fontWeight: 600 }}>Chi tiết</Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Activity size={24} color="var(--accent-primary)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Hoạt động mới nhất</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loadingStats ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px' }}></div>)
            ) : recentActivity.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Chưa có hoạt động nào</p>
            ) : (
              recentActivity.map((act, i) => (
                <div key={i} style={{ 
                  display: 'flex', gap: '16px', padding: '12px', 
                  borderLeft: `3px solid ${act.type === 'order' ? 'var(--accent-primary)' : '#f59e0b'}`,
                  background: 'rgba(255,255,255,0.01)', borderRadius: '0 12px 12px 0'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700 }}>{act.username || 'Khách hàng'}</span> 
                      {act.type === 'order' ? ' vừa mua ' : ' đã đánh giá '}
                      <span style={{ color: act.type === 'order' ? 'var(--accent-primary)' : '#f59e0b', fontWeight: 600 }}>{act.productName}</span>
                    </div>
                    {act.type === 'feedback' && (
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                        {[...Array(act.rating)].map((_, i) => <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />)}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(act.created_at).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section style={{ background: 'rgba(255,255,255,0.01)', padding: '80px 0', marginBottom: '80px', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Tại sao chọn Lumie Store?</h2>
            <p style={{ color: 'var(--text-muted)' }}>Chúng tôi cam kết mang lại trải nghiệm tốt nhất cho khách hàng</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            {[
              { icon: <Zap size={24} color="#10b981" />, title: 'Giao Hàng Tự Động', desc: 'Hệ thống xử lý đơn hàng hoàn toàn tự động, nhận hàng chỉ sau vài giây thanh toán.', color: 'rgba(16, 185, 129, 0.1)' },
              { icon: <ShieldCheck size={24} color="#3b82f6" />, title: 'Bảo Mật & Uy Tín', desc: 'Mọi thông tin giao dịch đều được mã hóa. Cam kết hoàn tiền nếu sản phẩm gặp lỗi (đối với khách hàng đã đánh giá sản phẩm đó).', color: 'rgba(59, 130, 246, 0.1)' },
              { icon: <Sparkles size={24} color="#f59e0b" />, title: 'Hỗ Trợ 24/7', desc: 'Đội ngũ hỗ trợ nhiệt tình, giải đáp mọi thắc mắc của khách hàng nhanh chóng nhất.', color: 'rgba(245, 158, 11, 0.1)' }
            ].map((f, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '32px' }}>
                <div style={{ background: f.color, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>{f.icon}</div>
                <h3 style={{ marginBottom: '12px', fontSize: '1.2rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donate Section */}
      <section className="container" style={{ marginBottom: '100px' }}>
        <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', padding: '60px', borderRadius: '40px', background: 'rgba(59,130,246,0.03)', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Heart size={32} color="#ef4444" fill="#ef4444" />
              <h2 style={{ fontSize: '2rem', margin: 0 }}>Ủng hộ Lumie Store</h2>
            </div>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '32px' }}>
              Nếu bạn yêu thích dịch vụ, hãy ủng hộ web để có thêm động lực phát triển. 
              Mọi sự đóng góp đều giúp chúng tôi duy trì hệ thống và nâng cấp hạ tầng.
            </p>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#3b82f6' }}>BIDV (Ngân hàng Đầu tư & Phát triển)</div>
              <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 800, margin: '8px 0' }}>8835052912</div>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>PHAM VINH PHU</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '24px', display: 'inline-block' }}>
              <img src="https://img.vietqr.io/image/BIDV-8835052912-compact2.png?amount=20000&addInfo=LUMIE DONATE&accountName=PHAM VINH PHU" alt="QR" style={{ width: '220px' }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        <div className="glass-card" style={{ padding: '80px 40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))', borderRadius: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Sẵn sàng trải nghiệm?</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 40px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Tham gia vào cộng đồng khách hàng tin dùng dịch vụ của chúng tôi mỗi ngày. 
            Nhận ưu đãi ưu đãi ngay hôm nay!
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user ? (
              <Link to="/register" className="btn btn-primary" style={{ padding: '14px 40px' }}>Bắt Đầu Ngay</Link>
            ) : (
              <Link to="/nap-tien" className="btn btn-primary" style={{ padding: '14px 40px' }}>Nạp Tiền Ngay</Link>
            )}
            <Link to="/products" className="btn glass-panel" style={{ padding: '14px 40px' }}>Xem Sản Phẩm</Link>
            <a href="https://discord.gg/lumie" target="_blank" rel="noreferrer" className="btn glass-panel" style={{ padding: '14px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Headset size={18} /> Hỗ Trợ 24/7
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
