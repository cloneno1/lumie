import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Users, Trophy, Star, Heart, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [feedbackCount, setFeedbackCount] = React.useState('5,000+');
  const [topRechargers, setTopRechargers] = React.useState<any[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loadingStats, setLoadingStats] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, topRes, activityRes] = await Promise.all([
          api.get('/stats'),
          api.get('/stats/top-rechargers'),
          api.get('/stats/recent-activity')
        ]);
        
        if (statsRes.data.totalFeedbacks) {
          setFeedbackCount(statsRes.data.totalFeedbacks.toLocaleString() + '+');
        }
        setTopRechargers(topRes.data);
        setRecentActivity(activityRes.data);
      } catch (err) {
        console.error('Lỗi tải thống kê:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#f59e0b20', padding: '10px', borderRadius: '12px' }}>
              <Trophy size={24} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Đua TOP Nạp Thẻ</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Vinh danh các đại gia trong tháng</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingStats ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '12px' }}></div>)
            ) : topRechargers.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Chưa có dữ liệu tháng này</p>
            ) : (
              topRechargers.slice(0, 5).map((u, idx) => (
                <div key={u.id} style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)', 
                  borderRadius: '16px', border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{u.username}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{u.total.toLocaleString()}đ</div>
                  </div>
                  {idx === 0 && <Sparkles size={20} color="#f59e0b" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity (Orders & Reviews) */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Activity size={24} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Hoạt động mới nhất</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Giao dịch và đánh giá thời gian thực</p>
            </div>
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
                      {new Date(act.created_at).toLocaleTimeString('vi-VN')} - {new Date(act.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section style={{ background: 'rgba(255,255,255,0.02)', padding: '100px 0', marginBottom: '80px', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Tại sao chọn Lumie Store?</h2>
            <p style={{ color: 'var(--text-muted)' }}>Chúng tôi cam kết mang lại trải nghiệm tốt nhất cho khách hàng</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            {[
              { icon: <Zap size={24} color="#10b981" />, title: 'Giao Hàng Tự Động', desc: 'Hệ thống xử lý đơn hàng hoàn toàn tự động, nhận hàng chỉ sau vài giây thanh toán thành công.', color: 'rgba(16, 185, 129, 0.1)' },
              { icon: <ShieldCheck size={24} color="#3b82f6" />, title: 'Bảo Mật & Uy Tín', desc: 'Mọi thông tin giao dịch đều được mã hóa và bảo mật. Cam kết hoàn tiền nếu sản phẩm gặp lỗi.', color: 'rgba(59, 130, 246, 0.1)' },
              { icon: <Sparkles size={24} color="#f59e0b" />, title: 'Hỗ Trợ 24/7', desc: 'Đội ngũ hỗ trợ nhiệt tình, giải đáp mọi thắc mắc và vấn đề của khách hàng nhanh chóng nhất.', color: 'rgba(245, 158, 11, 0.1)' }
            ].map((feature, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '32px' }}>
                <div style={{ background: feature.color, width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ marginBottom: '12px', fontSize: '1.3rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donate & QR Section */}
      <section className="container" style={{ marginBottom: '100px' }}>
        <div className="glass-panel donate-grid" style={{ 
          display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', padding: '60px', borderRadius: '40px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px' }}>
                <Heart size={28} color="#ef4444" fill="#ef4444" />
              </div>
              <h2 style={{ fontSize: '2rem', margin: 0 }}>Ủng hộ Lumie Store</h2>
            </div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '32px' }}>
              Nếu bạn yêu thích dịch vụ của chúng tôi, hãy ủng hộ web để có thêm động lực và phát triển. 
              Mọi sự đóng góp của bạn đều giúp chúng tôi duy trì hệ thống và cải thiện trải nghiệm người dùng.
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '4px', color: '#3b82f6' }}>BIDV (Ngân hàng Đầu tư & Phát triển)</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '1px' }}>8835052912</div>
              </div>
              <div style={{ flex: '1 1 100%' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Chủ Tài Khoản</div>
                <div style={{ color: 'var(--text-muted)' }}>PHAM VINH PHU</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'white', padding: '16px', borderRadius: '32px', display: 'inline-block',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '6px solid rgba(255,255,255,0.05)'
            }}>
              <img 
                src="https://img.vietqr.io/image/BIDV-8835052912-compact2.png?amount=20000&addInfo=LUMIE DONATE&accountName=PHAM VINH PHU" 
                alt="Donate QR BIDV" 
                style={{ width: '100%', maxWidth: '280px', borderRadius: '16px', display: 'block' }}
              />
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Quét mã QR để ủng hộ Lumie Store</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        <div className="glass-card" style={{ 
          padding: '80px 40px', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: '40px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '24px', fontWeight: 800 }}>Sẵn sàng trải nghiệm?</h2>
          <p style={{ maxWidth: '700px', margin: '0 auto 40px', color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: 1.6 }}>
            Tham gia vào cộng đồng hàng ngàn khách hàng đã và đang tin dùng dịch vụ của chúng tôi mỗi ngày. 
            Nhận ưu đãi đặc biệt cho lượt mua hàng đầu tiên của bạn!
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link to={user ? "/products" : "/register"} className="btn btn-primary" style={{ padding: '18px 50px', fontSize: '1.1rem' }}>
              {user ? "Mua Sắm Ngay" : "Bắt Đầu Ngay"}
            </Link>
            <Link to="/products" className="btn glass-panel" style={{ padding: '18px 50px', fontSize: '1.1rem' }}>Xem Sản Phẩm</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
