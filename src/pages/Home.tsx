import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Users, Trophy, Star } from 'lucide-react';

const Home: React.FC = () => {
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
      <div className="container" style={{ marginBottom: '100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
          {[
            { label: 'Khách hàng', value: '10,000+', icon: <Users size={24} /> },
            { label: 'Đơn hàng thành công', value: '50,000+', icon: <ShieldCheck size={24} /> },
            { label: 'Đối tác tin cậy', value: '100+', icon: <Trophy size={24} /> },
            { label: 'Đánh giá 5 sao', value: '5,000+', icon: <Star size={24} /> }
          ].map((stat, i) => (
            <div key={i} className="glass-card animate-fade-in" style={{ padding: '30px', textAlign: 'center', animationDelay: `${i * 0.1}s` }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
              <h2 style={{ fontSize: '2rem', margin: '0 0 5px' }}>{stat.value}</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section style={{ background: 'rgba(255,255,255,0.02)', padding: '100px 0', marginBottom: '100px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Tại sao chọn Lumie Store?</h2>
            <p style={{ color: 'var(--text-muted)' }}>Chúng tôi cam kết mang lại trải nghiệm tốt nhất cho khách hàng</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Zap size={24} color="#10b981" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Giao Hàng Tự Động</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Hệ thống xử lý đơn hàng hoàn toàn tự động, nhận hàng chỉ sau vài giây thanh toán thành công.</p>
            </div>
            
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <ShieldCheck size={24} color="#3b82f6" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Bảo Mật & Uy Tín</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Mọi thông tin giao dịch đều được mã hóa và bảo mật. Cam kết hoàn tiền nếu sản phẩm gặp lỗi.</p>
            </div>
            
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Sparkles size={24} color="#f59e0b" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Hỗ Trợ 24/7</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Đội ngũ hỗ trợ nhiệt tình, giải đáp mọi thắc mắc và vấn đề của khách hàng nhanh chóng nhất.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        <div className="glass-card" style={{ 
          padding: '60px', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '24px' }}>Sẵn sàng trải nghiệm?</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 32px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Tham gia vào cộng đồng hàng ngàn khách hàng đã và đang tin dùng dịch vụ của chúng tôi mỗi ngày.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 40px' }}>Bắt Đầu Ngay</Link>
            <Link to="/products" className="btn glass-panel" style={{ padding: '14px 40px' }}>Xem Sản Phẩm</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
