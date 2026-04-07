import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import Loading from '../../components/Loading';
import { Users, MessageCircle, ShoppingBag, CreditCard, Search, Edit3, Check, X, Eye, EyeOff, Settings as SettingsIcon, Send, User } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'topups' | 'settings' | 'chats'>('users');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedUserIds, setRevealedUserIds] = useState<Set<string>>(new Set());
  
  // Chat state
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
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

      const [usersData, ordersData, transData, settingsData, chatsData] = await Promise.all([
        fetchSafe(`${a_b}/u-list-s`),
        fetchSafe(`${a_b}/o-list-s`),
        fetchSafe(`${a_b}/t-list-s`),
        fetchSafe(`${a_b}/settings`),
        fetchSafe(`${a_b}/chats`)
      ]);

      setUsers(usersData || []);
      setOrders(ordersData || []);
      setTransactions(transData || []);
      setSettings(settingsData || []);
      setChatSessions(chatsData || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: any;
    if (activeTab === 'chats') {
      interval = setInterval(async () => {
        const a_b = '/internal' + '-sys-' + 'mz9';
        const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
        try {
          const res = await api.get(`${a_b}/chats`, adminHeaders);
          setChatSessions(res.data || []);
          
          if (selectedChatUser) {
             const msgRes = await api.get(`${a_b}/chats/${selectedChatUser.user_id}`, adminHeaders);
             setChatMessages(msgRes.data || []);
          }
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, selectedChatUser]);

  const handleUpdateBalance = async (userId: string) => {
    const amountStr = prompt('Nhập số tiền muốn thay đổi (vd: 50000 hoặc -50000):');
    if (amountStr === null) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount)) return showNotification('Số tiền không hợp lệ.', 'error');

    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/b-up-s`, { userId, amount, action: 'add' }, adminHeaders);
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
      await api.post(`${a_b}/o-stat-s`, { orderId, status }, adminHeaders);
      fetchData();
    } catch (err) {
      showNotification('Lỗi cập nhật trạng thái đơn hàng.', 'error');
    }
  };

  const handleSelectChat = async (session: any) => {
    setSelectedChatUser(session);
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      const res = await api.get(`${a_b}/chats/${session.user_id}`, adminHeaders);
      setChatMessages(res.data);
    } catch (err) {
      showNotification('Không thể tải tin nhắn.', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatUser) return;
    setIsSending(true);
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/chats/${selectedChatUser.user_id}/send`, { message: newMessage }, adminHeaders);
      setNewMessage('');
      const res = await api.get(`${a_b}/chats/${selectedChatUser.user_id}`, adminHeaders);
      setChatMessages(res.data);
    } catch (err) {
      showNotification('Lỗi khi gửi tin nhắn.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'completed': return '#10b981'; // Green
      case 'pending': return '#f59e0b';   // Orange
      case 'cancelled': return '#ef4444';   // Red
      case '1': case 1: return '#10b981';    // Success (Transactions)
      case '99': case 99: return '#f59e0b'; // Pending (Transactions)
      case true: return '#ef4444';          // Banned
      case false: return '#10b981';         // Active
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
  const filteredOrders = orders.filter(o => {
    const searchLow = searchTerm.toLowerCase();
    return (o.username || '').toLowerCase().includes(searchLow) || String(o.id || '').includes(searchLow) || (o.product_name || o.productName || '').toLowerCase().includes(searchLow);
  });
  const filteredTransactions = transactions.filter(t => {
    const searchLow = searchTerm.toLowerCase();
    const uid = t.user_id || t.userId;
    const u = users.find(u => u.id === uid);
    const uname = u ? u.username : String(uid || '').slice(0,8);
    return String(t.request_id || '').toLowerCase().includes(searchLow) || uname.toLowerCase().includes(searchLow) || String(t.telco || '').toLowerCase().includes(searchLow);
  });
  
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
          <input type="text" className="form-control" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '40px', fontSize: '14px' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Người dùng', value: users.length.toLocaleString(), icon: <Users size={20} />, color: '#3b82f6' },
          { label: 'Tổng nạp', value: transactions.filter(t => String(t.status) === '1').reduce((s, t) => s + (t.amount || 0), 0).toLocaleString() + 'đ', icon: <CreditCard size={20} />, color: '#10b981' },
          { label: 'Doanh thu', value: orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0).toLocaleString() + 'đ', icon: <ShoppingBag size={20} />, color: '#f59e0b' },
          { label: 'Đang chờ', value: orders.filter(o => o.status === 'pending').length.toLocaleString(), icon: <Search size={20} />, color: '#ef4444' }
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: `1px solid ${stat.color}20`, background: `${stat.color}05` }}>
            <div style={{ background: `${stat.color}20`, padding: '12px', borderRadius: '12px', color: stat.color }}>{stat.icon}</div>
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
          { id: 'settings', label: 'Cấu hình', icon: <SettingsIcon size={18} /> },
          { id: 'chats', label: 'Hỗ trợ', icon: <MessageCircle size={18} /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'glass-panel'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', borderRadius: '14px' }}>
            {tab.icon} {tab.label}
            {tab.id === 'chats' && chatSessions.length > 0 && <span style={{ marginLeft: '8px', background: 'var(--accent-primary)', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', color: 'black' }}>{chatSessions.length}</span>}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <Loading />
        ) : activeTab === 'settings' ? (
          <div style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><SettingsIcon size={20} /> Cài đặt hệ thống</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {settings.map(s => (
                <div key={s.key} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.key}</div>
                    <div style={{ fontWeight: 600 }}>{s.value}</div>
                  </div>
                  <button onClick={() => handleUpdateSetting(s.key, s.value)} className="btn-icon"><Edit3 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'chats' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: '600px' }}>
            <div style={{ borderRight: '1px solid var(--glass-border)', padding: '20px', overflowY: 'auto' }}>
               <h4 style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>CUỘC TRÒ CHUYỆN</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {chatSessions.length === 0 ? <p style={{ textAlign: 'center', marginTop: '40px' }}>Chưa có tin nhắn</p> : chatSessions.map(session => (
                    <div key={session.user_id} onClick={() => handleSelectChat(session)} style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', background: selectedChatUser?.user_id === session.user_id ? 'rgba(255,255,255,0.05)' : 'transparent', border: selectedChatUser?.user_id === session.user_id ? '1px solid var(--glass-border)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {session.users?.avatar ? <img src={session.users.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <User size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{session.users?.username || 'Khách hàng'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{String(session.user_id).slice(0, 8)}</div>
                      </div>
                    </div>
                 ))}
               </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {selectedChatUser ? (
                <>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontWeight: 700 }}>{selectedChatUser.users?.username}</div>
                  <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {chatMessages.map(m => (
                      <div key={m.id} style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', alignSelf: m.sender_role === 'staff' ? 'flex-end' : 'flex-start', background: m.sender_role === 'staff' ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)', color: 'white' }}>
                        {m.message}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '12px' }}>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Nhập phản hồi..." style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white' }} />
                    <button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} className="btn btn-primary" style={{ width: '48px', height: '48px', padding: 0 }}><Send size={18} /></button>
                  </div>
                </>
              ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}><p>Chọn một cuộc hội thoại</p></div>}
            </div>
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
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: 700 }}>{user.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(user.created_at).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontSize: '13px' }}>{user.email || '-'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                        {revealedUserIds.has(user.id) ? (user.plain_password || 'Encrypted') : '******'}
                        <button onClick={() => togglePassword(user.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          {revealedUserIds.has(user.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>{user.balance.toLocaleString()}đ</td>
                    <td style={{ padding: '20px' }}>{user.role}</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ 
                        color: getStatusColor(!!user.banned), 
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: `${getStatusColor(!!user.banned)}15`
                      }}>
                        {user.banned ? 'Bị khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleUpdateBalance(user.id)} className="btn-icon" title="Cập nhật số dư"><Edit3 size={14} /></button>
                        <button onClick={() => handleUpdateRole(user.id, user.role)} className="btn-icon" title="Đổi vai trò"><User size={14} /></button>
                        <button onClick={() => handleBanUser(user.id, !!user.banned)} className="btn-icon" title={user.banned ? "Mở khóa" : "Khóa người dùng"}>{user.banned ? <Check size={14} /> : <X size={14} />}</button>
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
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '20px' }}>Tên tài khoản</th>
                  <th style={{ padding: '20px' }}>Sản phẩm</th>
                  <th style={{ padding: '20px' }}>Tổng tiền</th>
                  <th style={{ padding: '20px' }}>Trạng thái</th>
                  <th style={{ padding: '20px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '20px' }}>{order.username}</td>
                    <td style={{ padding: '20px' }}>{order.product_name || order.productName}</td>
                    <td style={{ padding: '20px' }}>{order.total.toLocaleString()}đ</td>
                    <td style={{ padding: '20px' }}><span style={{ color: getStatusColor(order.status), fontWeight: 700 }}>{order.status}</span></td>
                    <td style={{ padding: '20px' }}>
                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleUpdateOrderStatus(order.id, 'completed')} className="btn glass-panel"><Check size={16} /></button>
                          <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="btn glass-panel"><X size={16} /></button>
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
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '20px' }}>Mã GD</th>
                  <th style={{ padding: '20px' }}>Tài khoản</th>
                  <th style={{ padding: '20px' }}>Nhà mạng</th>
                  <th style={{ padding: '20px' }}>Số tiền</th>
                  <th style={{ padding: '20px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '20px' }}>{tx.request_id || tx.id}</td>
                    <td style={{ padding: '20px' }}>{users.find(u => u.id === (tx.user_id || tx.userId))?.username || tx.user_id}</td>
                    <td style={{ padding: '20px' }}>{tx.telco}</td>
                    <td style={{ padding: '20px' }}>{tx.amount.toLocaleString()}đ</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ 
                        color: getStatusColor(tx.status), 
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: `${getStatusColor(tx.status)}15`
                      }}>
                        {tx.status == 1 ? 'Thành công' : tx.status == 99 ? 'Đang xử lý' : 'Thất bại'}
                      </span>
                    </td>
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
