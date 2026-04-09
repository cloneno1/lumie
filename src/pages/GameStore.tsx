import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Gamepad2, Sparkles, Zap, ChevronRight } from 'lucide-react';

const GameStore: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const categories = ['Tất cả', 'Hot Games', 'Hoyoverse', 'Zing Games', 'Khác'];

  const gameList = [
    // Hot Games
    { id: 'lq', name: 'Liên Quân Mobile', category: 'Hot Games', image: 'https://cdn.vn.garenanow.com/web/kg/branding/logo.png', type: 'UID/Login' },
    { id: 'ff', name: 'Free Fire', category: 'Hot Games', image: 'https://dl.dir.freefiremobile.com/freefire/media/items/1628153472610d9400ee2eb.png', type: 'UID' },
    { id: 'fo4', name: 'Fifa Online 4', category: 'Hot Games', image: 'https://fo4.garena.vn/wp-content/uploads/2018/06/fo4-logo.png', type: 'Login' },
    { id: 'pubgm', name: 'PUBG Mobile VN', category: 'Hot Games', image: 'https://pubgm.zing.vn/images/logo.png', type: 'UID' },
    { id: 'val', name: 'Valorant', category: 'Hot Games', image: 'https://images.contentstack.io/v3/assets/blt731c57907297a731/blt8074902cad8bf53d/5ebad8487739504820173e33/VALORANT_Logo_V.png', type: 'Riot ID' },
    
    // Hoyoverse
    { id: 'hsr', name: 'Honkai: Star Rail', category: 'Hoyoverse', image: 'https://fastcdn.hoyoverse.com/static-resource-v2/2023/04/26/894957e80234a17924af99bd937d5786_5941584852928509935.png', type: 'UID' },
    { id: 'zzz', name: 'Zenless Zone Zero', category: 'Hoyoverse', image: 'https://fastcdn.hoyoverse.com/static-resource-v2/2024/05/13/888de51f893116541f5a5e3e2615467e_5941584852928509935.png', type: 'UID' },
    { id: 'gi', name: 'Genshin Impact', category: 'Hoyoverse', image: 'https://fastcdn.hoyoverse.com/static-resource-v2/2023/11/08/96f5b33037803ba9738096f9bd937d57_5941584852928509935.png', type: 'UID' },
    { id: 'hi3', name: 'Honkai Impact 3rd', category: 'Hoyoverse', image: 'https://fastcdn.hoyoverse.com/static-resource-v2/2023/04/26/5d16564e96843ba9738096f9bd937d57_5941584852928509935.png', type: 'UID' },
    
    // Zing Games
    { id: 'vltk1m', name: 'Võ Lâm Truyền Kỳ 1 Mobile', category: 'Zing Games', image: 'https://image.vltk1m.zing.vn/images/loading.png', type: 'Zing ID' },
    { id: 'vltk2', name: 'Võ Lâm Truyền Kỳ 2', category: 'Zing Games', image: 'https://volam2.zing.vn/images/logo-vltk2.png', type: 'Zing ID' },
    { id: 'gunnypc', name: 'Gunny PC', category: 'Zing Games', image: 'https://gunnypc.zing.vn/images/logo.png', type: 'Zing ID' },
    { id: 'gunnyo', name: 'Gunny Origin', category: 'Zing Games', image: 'https://gunny.zing.vn/images/logo.png', type: 'Zing ID' },
    { id: 'ktm', name: 'Kiếm Thế Origin', category: 'Zing Games', image: 'https://ktm.zing.vn/images/logo.png', type: 'Zing ID' },
    { id: 'tlb2', name: 'Thiên Long Bát Bộ 2', category: 'Zing Games', image: 'https://tlbb2.zing.vn/images/logo.png', type: 'Zing ID' },
    { id: 'omg3q', name: 'OMG 3Q', category: 'Zing Games', image: 'https://omg3q.zing.vn/images/logo.png', type: 'Zing ID' },
  ];

  const filteredGames = gameList.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Tất cả' || game.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '1200px' }}>
      
      {/* Hero Section */}
      <div style={{ 
        position: 'relative', 
        borderRadius: '32px', 
        overflow: 'hidden', 
        marginBottom: '50px',
        height: '350px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("/images/game-banner.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ position: 'relative', zIndex: 2, padding: '0 20px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '15px', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
            NẠP <span className="gradient-text">GAME GIÁ RẺ</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', maxWidth: '600px', margin: '0 auto 30px' }}>
            Hỗ trợ hơn 100+ tựa game hot nhất hiện nay. Nạp nhanh, an toàn, chiết khấu lên đến 20%.
          </p>
          
          {/* Search Bar */}
          <div style={{ 
            maxWidth: '500px', 
            margin: '0 auto', 
            position: 'relative',
          }}>
            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm game bạn muốn nạp..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '18px 20px 18px 55px', 
                borderRadius: '50px', 
                background: 'rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '10px 25px', 
              borderRadius: '50px', 
              border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: activeCategory === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? 'black' : 'white',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s'
            }}
            className="category-pill"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '24px' 
      }}>
        {filteredGames.map(game => (
          <div 
            key={game.id}
            className="glass-card game-card"
            style={{ 
              borderRadius: '24px', 
              overflow: 'hidden', 
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative'
            }}
            onClick={() => navigate(`/nap-game/${game.id}`)}
          >
            <div style={{ width: '100%', height: '220px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
              <img 
                src={game.image} 
                alt={game.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                className="game-image"
                onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=' + game.name;
                }}
              />
            </div>
            <div style={{ padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
                {game.category}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {game.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={14} fill="var(--accent-primary)" stroke="none" /> Nạp {game.type}
                </span>
                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px' }}>
                  GIÁ RẺ
                </span>
              </div>
            </div>
            
            {/* Hover Overlay */}
            <div className="game-overlay" style={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(16, 185, 129, 0.2)', 
              opacity: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'opacity 0.3s'
            }}>
               <div style={{ 
                 width: '50px', height: '50px', 
                 borderRadius: '50%', background: 'var(--accent-primary)', 
                 display: 'flex', alignItems: 'center', justifyContent: 'center', 
                 color: 'black', boxShadow: '0 0 20px rgba(16,185,129,0.5)',
                 transform: 'scale(0.8)', transition: 'transform 0.3s'
               }} className="overlay-btn">
                 <ChevronRight size={30} />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="glass-card" style={{ marginTop: '60px', padding: '40px', borderRadius: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: 900 }}>Tại sao chọn nạp game tại <span className="gradient-text">Lumie Store?</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
          <div>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-primary)' }}>
              <Zap size={30} />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>Tốc độ xử lý nhanh</h4>
            <p style={{ color: 'var(--text-muted)' }}>Đơn hàng được xử lý tự động hoặc bởi đội ngũ supporter chỉ trong 3-5 phút.</p>
          </div>
          <div>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-primary)' }}>
              <Gamepad2 size={30} />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>Uy tín & Bảo mật</h4>
            <p style={{ color: 'var(--text-muted)' }}>Mọi giao dịch đều được bảo vệ và cam kết an toàn tuyệt đối cho tài khoản game của bạn.</p>
          </div>
          <div>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-primary)' }}>
              <Sparkles size={30} />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>Giá tốt nhất thị trường</h4>
            <p style={{ color: 'var(--text-muted)' }}>Chiết khấu cực cao giúp bạn tiết kiệm tối đa ngân sách nạp game hàng tháng.</p>
          </div>
        </div>
      </div>

      <style>{`
        .game-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(16,185,129,0.2);
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        .game-card:hover .game-image {
          transform: scale(1.1);
        }
        .game-card:hover .game-overlay {
          opacity: 1;
        }
        .game-card:hover .overlay-btn {
          transform: scale(1);
        }
        .category-pill:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        @media (max-width: 768px) {
          h1 { fontSize: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default GameStore;
