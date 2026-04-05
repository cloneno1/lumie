import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Package, Star, X, Check } from 'lucide-react';

const OrdersHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const handleOpenFeedback = (order: any) => {
    setSelectedOrder(order);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await api.post(`/orders/${selectedOrder.id}/feedback`, {
        rating,
        comment,
        productName: selectedOrder.productName
      });
      alert('Cảm ơn bạn đã đánh giá! Đơn hàng của bạn đã được kích hoạt bảo hành.');
      setShowFeedbackModal(false);
      setComment('');
      setRating(5);
      // Refresh orders or mark as feedbacked
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="glass-card" style={{ padding: '32px', position: 'relative' }}>
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
                  <th style={{ textAlign: 'left', padding: '16px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{order.productName}</td>
                    <td style={{ padding: '16px' }}>{order.amount}</td>
                    <td style={{ padding: '16px', color: 'var(--accent-primary)', fontWeight: 700 }}>{order.total.toLocaleString()}đ</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(order.status)}</td>
                    <td style={{ padding: '16px' }}>
                      {order.status === 'completed' && (
                        <button 
                          onClick={() => handleOpenFeedback(order)}
                          className="btn glass-panel" 
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Star size={14} fill={order.feedback_id ? "currentColor" : "none"} /> 
                          {order.feedback_id ? 'Đã đánh giá' : 'Đánh giá ngay'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="modal-overlay" style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '20px', backdropFilter: 'blur(10px)'
          }}>
            <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '450px', padding: '32px', position: 'relative' }}>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <h2 style={{ marginBottom: '8px' }}>Đánh giá sản phẩm</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ và xác nhận bảo hành cho sản phẩm: <strong>{selectedOrder?.productName}</strong>
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Chất lượng dịch vụ:</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setRating(star)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Star 
                        size={32} 
                        fill={star <= rating ? "#f59e0b" : "none"} 
                        color={star <= rating ? "#f59e0b" : "rgba(255,255,255,0.3)"} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Nội dung đánh giá:</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                  style={{ 
                    width: '100%', minHeight: '120px', padding: '16px', 
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                    borderRadius: '12px', color: 'white', resize: 'vertical'
                  }}
                />
              </div>

              <button 
                disabled={submitting}
                onClick={handleSubmitFeedback}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {submitting ? 'Đang gửi...' : <><Check size={20} /> Gửi đánh giá</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersHistory;
