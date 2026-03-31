import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

const OrdersHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/user/orders');
        setOrders(response.data);
      } catch (err) {
        console.error('Lỗi tải đơn hàng:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Thành công</span>;
      case 'pending': return <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Đang chờ</span>;
      case 'cancelled': return <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Đã hủy</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--primary-gradient)', padding: '12px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
            <Package size={24} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Lịch sử đơn hàng</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Bạn chưa có đơn hàng nào.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Sản phẩm</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Số lượng</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Tổng tiền</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Trạng thái</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Ngày mua</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{order.productName}</td>
                    <td style={{ padding: '16px' }}>{order.amount}</td>
                    <td style={{ padding: '16px', color: 'var(--accent-primary)', fontWeight: 700 }}>{order.total.toLocaleString()}đ</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(order.status)}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(order.created_at).toLocaleString('vi-VN')}
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

export default OrdersHistory;
