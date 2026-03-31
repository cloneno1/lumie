import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import api from './api/axios';
import { User, LogOut, ShieldCheck, LogIn, UserPlus, Bell, ChevronDown, Sparkles, CircleDollarSign, Play, Music, Film, ChevronRight, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import TopUp from './pages/TopUp';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/user/Profile';
import OrdersHistory from './pages/user/OrdersHistory';
import TopUpHistory from './pages/user/TopUpHistory';
import AccountSettings from './pages/user/AccountSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import Products from './pages/Products';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Discord from './pages/products/Discord';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/user/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async () => {
    try {
      await api.post('/user/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
    setShowProductsMenu(false);
    if (!showNotifications && unreadCount > 0) {
      handleMarkRead();
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
    setShowProductsMenu(false);
  };

  const toggleProductsMenu = () => {
    setShowProductsMenu(!showProductsMenu);
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  useEffect(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowProductsMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container nav-content">
          <Link to="/" className="logo" onClick={() => { setShowUserMenu(false); setShowNotifications(false); setShowMobileMenu(false); }}>
            <span className="gradient-text">Lumie</span>Store
          </Link>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <ul className={`nav-links ${showMobileMenu ? 'open' : ''}`}>
            <li>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                Trang Chủ
              </Link>
            </li>
            <li style={{ position: 'relative' }}>
              <button 
                onClick={toggleProductsMenu} 
                className={`nav-link ${location.pathname.startsWith('/products') ? 'active' : ''}`}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'space-between' }}
              >
                Sản Phẩm <ChevronDown size={14} style={{ transform: showProductsMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </button>

              {showProductsMenu && (
                <div className="glass-card user-dropdown product-dropdown-mobile" style={{ 
                  position: 'absolute', top: '120%', left: '0', width: '220px', zIndex: 1000, padding: '8px 0', 
                  animation: 'slideInTop 0.3s', background: 'rgba(13, 17, 23, 0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                }}>
                  {[
                    { name: 'Discord Nitro', path: '/products/discord', icon: <Sparkles size={16} /> },
                    { name: 'Robux (Gamepass)', path: '/products/robux', icon: <CircleDollarSign size={16} /> },
                    { name: 'YouTube Premium', path: '/products/youtube', icon: <Play size={16} /> },
                    { name: 'Spotify Music', path: '/products/spotify', icon: <Music size={16} /> },
                    { name: 'Netflix 4K', path: '/products/netflix', icon: <Film size={16} /> }
                  ].map((item, idx) => (
                    <Link key={idx} to={item.path} className="dropdown-item" onClick={() => { setShowProductsMenu(false); setShowMobileMenu(false); }}>
                      {item.icon} <span>{item.name}</span> <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                    </Link>
                  ))}
                </div>
              )}
            </li>
            <li>
              <Link to="/nap-tien" className={`nav-link ${location.pathname === '/nap-tien' ? 'active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                Nạp Tiền
              </Link>
            </li>
          </ul>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {user ? (
              <div className="user-nav-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Notification Bell */}
                <div style={{ position: 'relative' }} className="hide-mobile">
                  <div 
                    onClick={toggleNotifications}
                    style={{ 
                      padding: '8px', 
                      borderRadius: '50%', 
                      border: '1px solid var(--glass-border)', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: unreadCount > 0 ? 'var(--accent-primary)' : '#4a90a4',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    className={unreadCount > 0 ? 'pulse' : ''}
                  >
                    <Bell size={20} />
                  </div>
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff5722', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0a0f' }}>
                      {unreadCount}
                    </span>
                  )}

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="glass-card notification-dropdown" style={{ 
                      position: 'absolute', 
                      top: '120%', 
                      right: '0', 
                      width: '320px', 
                      maxHeight: '400px', 
                      zIndex: 1000, 
                      padding: '0',
                      overflow: 'hidden',
                      animation: 'slideInTop 0.3s',
                      background: 'rgba(13, 17, 23, 0.98)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                    }}>
                      <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700 }}>Thông báo</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{notifications.length} tin mới</span>
                      </div>
                      <div style={{ overflowY: 'auto', maxHeight: '330px' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có thông báo mới</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: n.read ? 'transparent' : 'rgba(255,255,255,0.02)', position: 'relative' }}>
                              {!n.read && <div style={{ position: 'absolute', left: '6px', top: '22px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>}
                              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px', paddingLeft: '8px' }}>{n.title}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', paddingLeft: '8px' }}>{n.content}</div>
                              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', paddingLeft: '8px' }}>{new Date(n.created_at).toLocaleString('vi-VN')}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div style={{ position: 'relative' }}>
                  <div onClick={toggleUserMenu} className="user-profile-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '10px', 
                      overflow: 'hidden', 
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={20} color="white" />
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }} className="hide-mobile">
                        <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '-0.2px' }}>{user.username}</span>
                        <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600' }}>{user.balance.toLocaleString()}đ</span>
                      </div>
                      <svg 
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                        style={{ marginTop: '2px', transition: 'transform 0.3s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }}
                      >
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </div>
                  </div>

                  {showUserMenu && (
                    <div className="glass-card user-dropdown" style={{ 
                      position: 'absolute', 
                      top: '120%', 
                      right: '0', 
                      width: '240px', 
                      zIndex: 1000, 
                      padding: '8px 0',
                      animation: 'slideInTop 0.3s',
                      background: 'rgba(13, 17, 23, 0.98)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                    }}>
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <User size={18} /> <span>Trang cá nhân</span>
                      </Link>
                      <Link to="/profile/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>
                        <span>Lịch sử đơn hàng</span>
                      </Link>
                      <Link to="/profile/topups" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        <span>Lịch sử nạp tiền</span>
                      </Link>
                      <Link to="/profile/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        <span>Cài đặt tài khoản</span>
                      </Link>
                      
                      <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}></div>
                      
                      {user.role === 'admin' && (
                        <Link to="/admin" className="dropdown-item" style={{ color: '#f59e0b' }} onClick={() => setShowUserMenu(false)}>
                          <ShieldCheck size={18} /> <span>Trang quản trị</span>
                        </Link>
                      )}

                      <button onClick={handleLogout} className="dropdown-item" style={{ width: '100%', color: '#ef4444', border: 'none', background: 'transparent' }}>
                        <LogOut size={18} /> <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link to="/login" className="btn glass-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                  <LogIn size={18} /> Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                  <UserPlus size={18} /> Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/discord" element={<Discord />} />
          <Route path="/nap-tien" element={<TopUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/orders" element={<OrdersHistory />} />
          <Route path="/profile/topups" element={<TopUpHistory />} />
          <Route path="/profile/settings" element={<AccountSettings />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>

      {/* Simple Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '40px 0', marginTop: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="container">
          <p>© 2026 Lumie Store. All rights reserved. Giao dịch an toàn & tự động 24/7.</p>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
