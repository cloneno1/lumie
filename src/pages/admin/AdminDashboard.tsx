import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import Loading from '../../components/Loading';
import { Users, MessageCircle, ShoppingBag, CreditCard, Search, Edit3, Check, X, Eye, EyeOff, Settings as SettingsIcon, Send, User, ShieldCheck } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'topups' | 'settings' | 'chats'>('users');
  
  useEffect(() => {
    if (currentUser?.role === 'supporter') {
      setActiveTab('chats');
    } else if (currentUser?.role === 'moderator' || currentUser?.role === 'admin') {
      setActiveTab('users');
    }
  }, [currentUser]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedUserIds, setRevealedUserIds] = useState<Set<string>>(new Set());
  
  // Chat state
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Modal states
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceTargetUser, setBalanceTargetUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  const isDonation = (order: any) => {
    return order.productId === 'donation' || order.product_id === 'donation' || (order.options && order.options.type === 'donation');
  };

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

      setUsers((usersData || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setOrders((ordersData || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setTransactions((transData || []).sort((a: any, b: any) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime()));
      setSettings(settingsData || []);
      setChatSessions((chatsData || []).sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()));
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

  const handleOpenBalanceModal = (user: any) => {
    setBalanceTargetUser(user);
    setBalanceAmount('');
    setIsBalanceModalOpen(true);
  };

  const handleUpdateBalance = async () => {
    if (!balanceTargetUser || !balanceAmount) return;
    const amount = parseInt(balanceAmount);
    if (isNaN(amount)) return showNotification('Số tiền không hợp lệ.', 'error');

    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/b-up-s`, { userId: balanceTargetUser.id, amount, action: 'add' }, adminHeaders);
      showNotification('Cập nhật số dư thành công!', 'success');
      setIsBalanceModalOpen(false);
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

  const handleUpdateRole = (user: any) => {
    setEditingUser(user);
    setIsRoleModalOpen(true);
  };

  const saveRole = async (newRole: string) => {
    if (!editingUser) return;
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/u-role-s`, { userId: editingUser.id, role: newRole }, adminHeaders);
      showNotification('Cập nhật vai trò thành công!', 'success');
      setIsRoleModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification('Lỗi cập nhật vai trò.', 'error');
    }
  };

  const handleOpenSettingsModal = (setting: any) => {
    setEditingSetting(setting);
    setIsSettingModalOpen(true);
  };

  const handleSaveSetting = async () => {
    if (!editingSetting) return;
    try {
      const a_b = '/internal' + '-sys-' + 'mz9';
      const adminHeaders = { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_PATH_SECRET || 'lumie_adm_2024' } };
      await api.post(`${a_b}/settings/update`, { key: editingSetting.key, value: editingSetting.value }, adminHeaders);
      showNotification('Cập nhật cài đặt thành công!', 'success');
      setIsSettingModalOpen(false);
      fetchData();
    } catch (err) { showNotification('Lỗi cập nhật cài đặt.', 'error'); }
  };

  const activeUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
  const purchasesOnly = orders.filter(o => !isDonation(o));
  const filteredOrders = purchasesOnly.filter(o => {
    const searchLow = searchTerm.toLowerCase();
    return (o.username || '').toLowerCase().includes(searchLow) || 
           String(o.id || '').includes(searchLow) || 
           (o.product_name || o.productName || '').toLowerCase().includes(searchLow) ||
           (o.options?.playerid || '').toLowerCase().includes(searchLow);
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

  const isAuthorized = currentUser && ['admin', 'moderator', 'supporter'].includes(currentUser.role);

  if (!isAuthorized) {
    return <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}><h2>Access Denied</h2></div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', fontSize: '2.4rem', fontWeight: 900 }} className="gradient-text">QUẢN TRỊ HỆ THỐNG</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Chào mừng {currentUser.username}, hãy quản lý hệ thống của bạn.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={fetchData} 
            className="btn glass-panel" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '12px 20px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'spin' : ''}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
            Làm mới
          </button>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Tìm kiếm mọi thứ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ paddingLeft: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }} 
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {[
          { label: 'Người dùng', value: users.length.toLocaleString(), icon: <Users size={24} />, color: '#3b82f6' },
          { label: 'Tổng nạp', value: transactions.filter(t => String(t.status) === '1').reduce((s, t) => s + (t.amount || 0), 0).toLocaleString() + 'đ', icon: <CreditCard size={24} />, color: '#10b981' },
          { label: 'Doanh thu', value: purchasesOnly.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0).toLocaleString() + 'đ', icon: <ShoppingBag size={24} />, color: '#f59e0b' },
          { label: 'Đang chờ', value: purchasesOnly.filter(o => o.status === 'pending').length.toLocaleString(), icon: <Search size={24} />, color: '#ef4444' }
        ].map((stat, i) => (
          <div 
            key={i} 
            className="glass-card" 
            style={{ 
              padding: '28px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '24px', 
              border: `1.5px solid ${stat.color}40`, 
              background: `linear-gradient(135deg, ${stat.color}15, rgba(20,20,30,0.4))`,
              boxShadow: `0 15px 35px -5px ${stat.color}15`
            }}
          >
            <div style={{ background: `${stat.color}25`, padding: '16px', borderRadius: '18px', color: stat.color, boxShadow: `0 8px 16px ${stat.color}20` }}>{stat.icon}</div>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { id: 'users', label: 'Người dùng', icon: <Users size={18} />, roles: ['admin', 'moderator'] },
          { id: 'orders', label: 'Đơn hàng', icon: <ShoppingBag size={18} />, roles: ['admin', 'moderator'] },
          { id: 'topups', label: 'Nạp thẻ', icon: <CreditCard size={18} />, roles: ['admin', 'moderator'] },
          { id: 'settings', label: 'Cấu hình', icon: <SettingsIcon size={18} />, roles: ['admin'] },
          { id: 'chats', label: 'Hỗ trợ', icon: <MessageCircle size={18} />, roles: ['admin', 'moderator', 'supporter'] }
        ].filter(tab => tab.roles.includes(currentUser.role)).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'nav-tab-inactive'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', borderRadius: '14px' }}>
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
                <div key={s.key} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>{s.key}</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{s.value}</div>
                  </div>
                  <button onClick={() => handleOpenSettingsModal(s)} className="btn-icon" style={{ background: 'var(--accent-primary)', color: 'black', border: 'none' }}><Edit3 size={18} /></button>
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
                        <button onClick={() => handleOpenBalanceModal(user)} className="btn-icon" title="Cập nhật số dư" style={{ color: 'var(--accent-primary)', background: 'rgba(16,185,129,0.1)' }}><CreditCard size={14} /></button>
                        <button onClick={() => handleUpdateRole(user)} className="btn-icon" title="Đổi vai trò" style={{ color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)' }}><User size={14} /></button>
                        <button onClick={() => handleBanUser(user.id, !!user.banned)} className="btn-icon" title={user.banned ? "Mở khóa" : "Khóa người dùng"} style={{ color: user.banned ? 'var(--accent-primary)' : 'var(--accent-red)', background: user.banned ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>{user.banned ? <Check size={14} /> : <X size={14} />}</button>
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
                  <th style={{ padding: '20px' }}>Thông tin (UID/Acc)</th>
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
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {order.options?.playerid || order.options?.player_id || '-'}
                      </div>
                      {order.options?.server && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Server: {order.options.server}</div>
                      )}
                    </td>
                    <td style={{ padding: '20px' }}>{order.total.toLocaleString()}đ</td>
                    <td style={{ padding: '20px' }}><span style={{ color: getStatusColor(order.status), fontWeight: 700 }}>{order.status}</span></td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setSelectedOrderDetails(order)} className="btn-icon" title="Xem chi tiết"><Eye size={14} /></button>
                        {order.status === 'pending' && (
                          <>
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'completed')} className="btn glass-panel" style={{ padding: '6px' }}><Check size={14} /></button>
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="btn glass-panel" style={{ padding: '6px' }}><X size={14} /></button>
                          </>
                        )}
                      </div>
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

      {/* Balance Update Modal */}
      {isBalanceModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Cập nhật số dư</h3>
              <button onClick={() => setIsBalanceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
              Cập nhật số dư cho người dùng <strong>{balanceTargetUser?.username}</strong>. Nhập số dương để cộng, số âm để trừ.
            </p>
            
            <div className="form-group">
              <label className="form-label">Số tiền thay đổi</label>
              <div className="input-icon-wrapper">
                <div className="icon"><CreditCard size={18} /></div>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Ví dụ: 50000 hoặc -50000"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button onClick={handleUpdateBalance} className="btn btn-primary" style={{ flex: 1 }}>Xác nhận</button>
              <button onClick={() => setIsBalanceModalOpen(false)} className="btn glass-panel" style={{ flex: 1 }}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Update Modal */}
      {isSettingModalOpen && editingSetting && (
        <div className="modal-overlay">
          <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Cập nhật cấu hình</h3>
              <button onClick={() => setIsSettingModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Khóa cấu hình: <strong>{editingSetting.key}</strong></label>
              <textarea 
                className="form-control" 
                rows={4}
                value={editingSetting.value}
                onChange={(e) => setEditingSetting({...editingSetting, value: e.target.value})}
                style={{ resize: 'vertical', minHeight: '100px' }}
                autoFocus
              />
            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button onClick={handleSaveSetting} className="btn btn-primary" style={{ flex: 1 }}>Lưu thay đổi</button>
              <button onClick={() => setIsSettingModalOpen(false)} className="btn glass-panel" style={{ flex: 1 }}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {isRoleModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Chỉnh sửa vai trò</h3>
              <button onClick={() => setIsRoleModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Thay đổi vai trò cho tài khoản <strong>{editingUser?.username}</strong>
            </p>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { r: 'user', l: 'Người dùng (User)', icon: <User size={16} />, d: 'Vai trò mặc định cho khách hàng.' },
                { r: 'admin', l: 'Quản trị viên (Admin)', icon: <ShieldCheck size={16} />, d: 'Toàn quyền sử dụng hệ thống.' },
                { r: 'moderator', l: 'Điều hành (Moderator)', icon: <ShieldCheck size={16} />, d: 'Quản lý người dùng, đơn hàng & nạp thẻ.' },
                { r: 'supporter', l: 'Hỗ trợ (Supporter)', icon: <MessageCircle size={16} />, d: 'Chỉ truy cập được trang hỗ trợ chat.' }
              ].map(roleItem => (
                <button 
                  key={roleItem.r}
                  onClick={() => saveRole(roleItem.r)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                    borderRadius: '16px', border: editingUser?.role === roleItem.r ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    background: editingUser?.role === roleItem.r ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                    color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  className="hover-scale"
                >
                  <div style={{ 
                    padding: '10px', borderRadius: '12px', 
                    background: editingUser?.role === roleItem.r ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: editingUser?.role === roleItem.r ? 'black' : 'white'
                  }}>
                    {roleItem.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{roleItem.l}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{roleItem.d}</div>
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsRoleModalOpen(false)}
              className="btn glass-panel" 
              style={{ width: '100%', marginTop: '24px', padding: '12px' }}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
      {/* Details Modal */}
      {selectedOrderDetails && (
        <div className="modal-overlay">
          <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Chi tiết đơn hàng #{selectedOrderDetails.id}</h3>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--accent-primary)', fontWeight: 800 }}>THÔNG TIN CHUNG</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tài khoản:</span> <strong>{selectedOrderDetails.username}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Sản phẩm:</span> <strong>{selectedOrderDetails.product_name || selectedOrderDetails.productName}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tổng tiền:</span> <strong>{selectedOrderDetails.total.toLocaleString()}đ</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Trạng thái:</span> <strong style={{ color: getStatusColor(selectedOrderDetails.status) }}>{selectedOrderDetails.status}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Ngày tạo:</span> <strong>{new Date(selectedOrderDetails.created_at).toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--accent-primary)', fontWeight: 800 }}>DỮ LIỆU NGƯỜI DÙNG</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedOrderDetails.options ? (
                    Object.entries(selectedOrderDetails.options).map(([key, value]: [string, any]) => {
                      if (['type', 'discount', 'originalPrice', 'packageId', 'gameId'].includes(key)) return null;
                      
                      let label = key;
                      if (key === 'playerid') label = 'UID / Tài khoản Garena';
                      else if (key === 'password') label = 'Mật khẩu';
                      else if (key === 'backupCodes') label = 'Mã dự phòng';
                      else if (key === 'server') label = 'Máy chủ (Server)';
                      
                      return (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{label}:</span>
                          <strong style={{ 
                            color: key === 'password' ? '#ef4444' : (key === 'playerid' ? 'var(--accent-primary)' : 'white'), 
                            wordBreak: 'break-all', 
                            textAlign: 'right' 
                          }}>{String(value)}</strong>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Không có dữ liệu bổ sung.</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
               {selectedOrderDetails.status === 'pending' && (
                 <>
                   <button onClick={() => { handleUpdateOrderStatus(selectedOrderDetails.id, 'completed'); setSelectedOrderDetails(null); }} className="btn btn-primary" style={{ flex: 1 }}>Hoàn tất</button>
                   <button onClick={() => { handleUpdateOrderStatus(selectedOrderDetails.id, 'cancelled'); setSelectedOrderDetails(null); }} className="btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Hủy đơn</button>
                 </>
               )}
               <button onClick={() => setSelectedOrderDetails(null)} className="btn glass-panel" style={{ flex: selectedOrderDetails.status === 'pending' ? 'none' : 1 }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
