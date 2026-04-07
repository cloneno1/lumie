import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Users, ShoppingBag, CreditCard, Search, Edit3, Check, X, Eye, EyeOff, Settings as SettingsIcon, RefreshCw } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'topups' | 'settings'>('users');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedUserIds, setRevealedUserIds] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      // Security: Constructing secret paths to avoid simple string scrapers
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      
      const fetchSafe = async (url: string) => {
        try {
          const res = await api.get(url, adminHeaders);
          return res.data;
        } catch (err) {
          console.error(`Fetch error for ${url}:`, err);
          return [];
        }
      };

      const [usersData, ordersData, transData, settingsData] = await Promise.all([
        fetchSafe(`${a_b}/u-list-s`),
        fetchSafe(`${a_b}/o-list-s`),
        fetchSafe(`${a_b}/t-list-s`),
        fetchSafe(`${a_b}/settings`)
      ]);

      setUsers(usersData || []);
      setOrders(ordersData || []);
      setTransactions(transData || []);
      setSettings(settingsData || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateBalance = async (userId: string) => {
    const amountStr = prompt('Nhập số tiền muốn thay đổi (vd: 50000 hoặc -50000):');
    if (amountStr === null) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount)) return showNotification('Số tiền không hợp lệ.', 'error');

    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/b-up-s`, {
        userId,
        amount,
        action: 'add'
      }, adminHeaders);
      showNotification('Cập nhật số dư thành công!', 'success');
      fetchData();
    } catch (err) {
      showNotification('Lỗi cập nhật số dư.', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/o-stat-s`, {
        orderId,
        status
      }, adminHeaders);
      fetchData();
    } catch (err) {
      showNotification('Lỗi cập nhật trạng thái đơn hàng.', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case '1': return '#10b981';
      case '99': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handleBanUser = async (userId: string, currentBannedStatus: boolean) => {
    const confirmed = await confirm({
      title: currentBannedStatus ? 'Mở khóa' : 'Khóa tài khoản',
      message: currentBannedStatus ? 'Mở khóa người dùng này?' : 'Khóa người dùng này?'
    });
    if (!confirmed) return;
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/ban-u-s`, { userId, banned: !currentBannedStatus }, adminHeaders);
      fetchData();
    } catch (err) {
      showNotification('Lỗi khi khóa/mở khóa người dùng.', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmed = await confirm({
      title: 'Đổi vai trò',
      message: `Chuyển người dùng này sang vai trò: ${newRole.toUpperCase()}?`
    });
    if (!confirmed) return;
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/u-role-s`, { userId, role: newRole }, adminHeaders);
      fetchData();
    } catch (err) {
      showNotification('Lỗi cập nhật vai trò.', 'error');
    }
  };

  const handleUpdateSetting = async (key: string, currentValue: string) => {
    const newValue = prompt(`Nhập giá trị mới cho ${key}:`, currentValue);
    if (newValue === null || newValue === currentValue) return;
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/settings/update`, { key, value: newValue }, adminHeaders);
      showNotification('Cập nhật cài đặt thành công!', 'success');
      fetchData();
    } catch (err) { showNotification('Lỗi cập nhật cài đặt.', 'error'); }
  };

  const activeUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrders = orders.filter(o => o.username.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm));
  
  const togglePassword = (userId: string) => {
    setRevealedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (currentUser?.role !== 'admin') {
    return <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}><h2>Access Denied</h2></div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Quản Trị Hệ Thống</h1>
          <p style={{ color: 'var(--text-muted)' }}>Chào mừng {currentUser.username}, hãy quản lý hệ thống của bạn.</p>
        </div>
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Tìm kiếm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Stats Overview Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {[
          { 
            label: 'Tổng số người dùng', 
            value: users.length.toLocaleString(), 
            icon: <Users size={20} />, 
            color: '#3b82f6' 
          },
          { 
            label: 'Tổng nạp (Thẻ + Bank)', 
            value: transactions.filter(t => t.status === '1').reduce((s, t) => s + (t.amount || 0), 0).toLocaleString() + 'đ', 
            icon: <CreditCard size={20} />, 
            color: '#10b981' 
          },
          { 
            label: 'Doanh thu đơn hàng', 
            value: orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0).toLocaleString() + 'đ', 
            icon: <ShoppingBag size={20} />, 
            color: '#f59e0b' 
          },
          { 
            label: 'Đơn hàng đang chờ', 
            value: orders.filter(o => o.status === 'pending').length.toLocaleString(), 
            icon: <Search size={20} />, 
            color: '#ef4444' 
          }
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ 
            padding: '24px', display: 'flex', alignItems: 'center', gap: '20px',
            border: `1px solid ${stat.color}20`, background: `${stat.color}05`
          }}>
            <div style={{ 
              background: `${stat.color}20`, padding: '12px', borderRadius: '12px', color: stat.color 
            }}>{stat.icon}</div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { id: 'users', label: 'Người dùng', icon: <Users size={18} /> },
          { id: 'orders', label: 'Đơn hàng', icon: <ShoppingBag size={18} /> },
          { id: 'topups', label: 'Nạp thẻ', icon: <CreditCard size={18} /> },
          { id: 'settings', label: 'Cấu hình', icon: <SettingsIcon size={18} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'glass-panel'}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '14px 24px', 
              borderRadius: '14px',
              border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === tab.id ? undefined : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              opacity: 1
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>
        ) : activeTab === 'settings' ? (
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Cấu hình hệ thống</h3>
              <button 
                onClick={fetchData} 
                className="btn glass-panel" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                title="Refresh dữ liệu"
              >
                <RefreshCw size={16} /> Làm mới
              </button>
            </div>
            
            {settings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                <div style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Chưa có cấu hình nào trong cơ sở dữ liệu.</div>
                <button 
                  className="btn btn-primary" 
                  onClick={async () => {
                    const a_b = '/internal' + '-sys-' + 'mz9';
                    const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
                    await api.get(`${a_b}/settings`, adminHeaders);
                    fetchData();
                  }}
                >
                  Khởi tạo link Group & YouTube
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ padding: '16px', background: '#10b98110', border: '1px solid #10b98130', borderRadius: '12px', color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <SettingsIcon size={16} /> Thay đổi link tại đây sẽ cập nhật trực tiếp cho trang mua Robux của khách hàng.
                </div>
                {settings.map(s => (
                  <div key={s.key} className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Tên khóa cài đặt</div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--accent-primary)' }}>{s.key}</div>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '10px 24px' }}
                        onClick={() => handleUpdateSetting(s.key, s.value)}
                      >
                        Chỉnh sửa link
                      </button>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Link hiện tại</div>
                      <div style={{ 
                        background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '10px', 
                        fontFamily: 'monospace', fontSize: '13px', color: '#10b981', wordBreak: 'break-all',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {s.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '20px' }}>Username</th>
                  <th style={{ padding: '20px' }}>Email/Mật khẩu</th>
                  <th style={{ padding: '20px' }}>Số dư</th>
                  <th style={{ padding: '20px' }}>Vai trò</th>
                  <th style={{ padding: '20px' }}>Trạng thái</th>
                  <th style={{ padding: '20px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)', background: user.banned ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '700' }}>{user.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(user.created_at).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontSize: '13px' }}>{user.email || '-'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        <span style={{ color: (user.plain_password || user.password) ? 'inherit' : '#ef4444' }}>
                          Pass: {(user.plain_password || user.password) ? (revealedUserIds.has(user.id) ? (user.plain_password || 'Hệ thống (Mã hóa)') : '******') : 'None'}
                        </span>
                        {(user.plain_password || user.password) && (
                          <button 
                            onClick={() => togglePassword(user.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                            title={revealedUserIds.has(user.id) ? "Ẩn mật khẩu" : "Xem mật khẩu"}
                          >
                            {revealedUserIds.has(user.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>{user.balance.toLocaleString()}đ</td>
                    <td style={{ padding: '20px' }}>
                      <span 
                        onClick={() => handleUpdateRole(user.id, user.role)}
                        style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                          background: user.role === 'admin' ? '#f59e0b20' : 'rgba(255,255,255,0.05)',
                          color: user.role === 'admin' ? '#f59e0b' : 'var(--text-muted)',
                          border: `1px solid ${user.role === 'admin' ? '#f59e0b30' : 'var(--glass-border)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      {user.banned ? (
                        <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>Bị khóa</span>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600 }}>Hoạt động</span>
                      )}
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleUpdateBalance(user.id)}
                          className="btn-icon" style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }} title="Cộng tiền">
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleBanUser(user.id, !!user.banned)}
                          className="btn-icon" style={{ borderColor: user.banned ? '#10b981' : '#ef4444', color: user.banned ? '#10b981' : '#ef4444' }} title={user.banned ? 'Mở khóa' : 'Khóa tài khoản'}>
                          {user.banned ? <Check size={14} /> : <X size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'orders' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '20px' }}>User</th>
                  <th style={{ padding: '20px' }}>Sản phẩm</th>
                  <th style={{ padding: '20px' }}>Tổng tiền</th>
                  <th style={{ padding: '20px' }}>Trạng thái</th>
                  <th style={{ padding: '20px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '600' }}>{order.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {order.userId.slice(0,6)}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{order.productName}</div>
                      <div style={{ fontSize: '12px', marginBottom: '8px' }}>SL: {order.amount} - {order.price.toLocaleString()}đ</div>
                      {order.options && (
                        <div style={{ 
                          fontSize: '11px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px'
                        }}>
                          {Object.entries(order.options).map(([k, v]) => (
                            <div key={k}>
                              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}: </span>
                              {typeof v === 'string' && v.startsWith('http') ? (
                                <a href={v} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'underline' }}>
                                  [Xem đính kèm]
                                </a>
                              ) : (
                                <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{String(v)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '20px', fontWeight: '700', color: 'var(--primary-color)' }}>{order.total.toLocaleString()}đ</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status),
                        border: `1px solid ${getStatusColor(order.status)}30`
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleUpdateOrderStatus(order.id, 'completed')} className="btn" style={{ padding: '6px', background: '#10b98120', color: '#10b981', border: '1px solid #10b98130' }} title="Hoàn thành"><Check size={16} /></button>
                          <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="btn" style={{ padding: '6px', background: '#ef444420', color: '#ef4444', border: '1px solid #ef444430' }} title="Hủy bỏ"><X size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '20px' }}>Mã GD / ID</th>
                  <th style={{ padding: '20px' }}>User</th>
                  <th style={{ padding: '20px' }}>Loại / Nhà mạng</th>
                  <th style={{ padding: '20px' }}>Số tiền</th>
                  <th style={{ padding: '20px' }}>Trạng thái</th>
                  <th style={{ padding: '20px' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.request_id || tx.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>{tx.request_id || 'GIAO DICH BANK'}</td>
                    <td style={{ padding: '20px', fontWeight: '600' }}>{tx.username || (tx.user_id || tx.userId || '').slice(0,8)}</td>
                    <td style={{ padding: '20px' }}>{tx.telco}</td>
                    <td style={{ padding: '20px', fontWeight: '700' }}>{tx.amount.toLocaleString()}đ</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        background: `${getStatusColor(tx.status)}20`, color: getStatusColor(tx.status),
                        border: `1px solid ${getStatusColor(tx.status)}30`
                      }}>
                        {tx.status === '1' ? 'Thành công' : tx.status === '99' ? 'Chờ xử lý' : 'Thất bại'}
                      </span>
                    </td>
                    <td style={{ padding: '20px', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
