import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Package, Star, X, Check, AlertTriangle, Calendar, CreditCard, Loader2, Image as ImageIcon } from 'lucide-react';
import Loading from '../../components/Loading';
import { useNavigate } from 'react-router-dom';

const OrdersHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      setShowFeedbackModal(false);
      setComment('');
      setRating(5);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { 
        label: 'Thành công', 
        color: '#10b981', 
        bg: 'rgba(16,185,129,0.1)', 
        icon: <Check size={14} /> 
      };
      case 'pending': return { 
        label: 'Đang xử lý', 
        color: '#f59e0b', 
        bg: 'rgba(245,158,11,0.1)', 
        icon: <Loader2 size={14} className="spin" /> 
      };
      case 'cancelled': return { 
        label: 'Đã hủy', 
        color: '#ef4444', 
        bg: 'rgba(239,68,68,0.1)', 
        icon: <X size={14} /> 
      };
      default: return { 
        label: status, 
        color: '#6b7280', 
        bg: 'rgba(107,114,128,0.1)', 
        icon: null 
      };
    }
  };

  return (
    <div className="container" style={{ padding: '60px 20px 100px' }}>
      {/* Header with Glowing Background */}
      <div style={{ position: 'relative', marginBottom: '50px' }}>
        <div style={{ 
          position: 'absolute', top: '-50px', left: '0', width: '200px', height: '200px', 
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', zIndex: -1 
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            background: 'var(--primary-gradient)', padding: '16px', borderRadius: '18px', 
            boxShadow: '0 10px 20px rgba(16,185,129,0.2)', color: 'white' 
          }}>
            <Package size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Lịch sử <span className="gradient-text">Giao dịch</span></h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Quản lý và theo dõi các đơn hàng sản phẩm số của bạn.</p>
          </div>
        </div>
      </div>

      {/* Modern Warning Banner */}
      <div style={{ 
        background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', 
        padding: '20px 24px', borderRadius: '20px', marginBottom: '40px',
        display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '4px solid var(--accent-red)'
      }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '12px', color: 'var(--accent-red)' }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#fca5a5' }}>Chính sách Hậu mãi & Bảo hành</h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
            Quý khách có <strong>3 ngày</strong> để đánh giá đơn hàng. Sau 3 ngày, hệ thống sẽ tự động đóng mục đánh giá và 
            shop sẽ không hỗ trợ hoàn tiền trong trường hợp có khiếu nại.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px 0' }}><Loading message="Đang truy xuất lịch sử đơn hàng..." /></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed var(--glass-border)' }}>
          <Package size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Chưa có đơn hàng nào</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi ngay hôm nay.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '14px 32px', borderRadius: '14px' }}>Khám phá ngay</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.map((order) => {
            const orderDate = new Date(order.created_at);
            const isExpired = Date.now() - orderDate.getTime() > 3 * 24 * 60 * 60 * 1000;
            const status = getStatusConfig(order.status);
            
            return (
              <div 
                key={order.id} 
                className="glass-card hover-scale" 
                style={{ 
                  padding: '30px', display: 'grid', 
                  gridTemplateColumns: 'auto 1fr auto', gap: '24px', 
                  alignItems: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}
              >
                {/* Product Icon & Info */}
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '16px', 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                }}>
                  <Package size={28} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.productName}</h3>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>#{String(order.id).slice(-6).toUpperCase()}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <Calendar size={14} /> {orderDate.toLocaleDateString('vi-VN')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <CreditCard size={14} /> {order.total.toLocaleString()}đ
                    </div>
                  </div>

                  {order.status === 'cancelled' && order.note && (
                    <div style={{ 
                      marginTop: '12px', padding: '10px 16px', borderRadius: '12px', 
                      background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444',
                      fontSize: '13px', color: '#fca5a5'
                    }}>
                      <strong style={{ color: '#ef4444' }}>Lý do hủy:</strong> {order.note}
                    </div>
                  )}

                  {order.options && (order.options.image || order.options.previewImage) && (
                    <div style={{ marginTop: '10px' }}>
                      <a 
                        href={order.options.image || order.options.previewImage} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          fontSize: '12px', color: 'var(--accent-primary)', 
                          display: 'flex', alignItems: 'center', gap: '6px',
                          textDecoration: 'none', fontWeight: 600
                        }}
                      >
                        <ImageIcon size={14} /> Xem ảnh đính kèm
                      </a>
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px', minWidth: '150px' }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: '8px 16px', borderRadius: '20px', 
                    background: status.bg, color: status.color, 
                    fontSize: '13px', fontWeight: 700 
                  }}>
                    {status.icon} {status.label}
                  </div>

                  {order.status === 'completed' && (
                    <button 
                      onClick={() => !order.feedback_id && !isExpired && handleOpenFeedback(order)}
                      className="btn"
                      style={{ 
                        padding: '10px 20px', fontSize: '13px', fontWeight: 700,
                        borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                        background: order.feedback_id ? 'rgba(255,255,255,0.05)' : (isExpired ? 'rgba(239,68,68,0.05)' : 'var(--accent-primary)'),
                        color: order.feedback_id ? 'rgba(255,255,255,0.3)' : (isExpired ? 'var(--accent-red)' : 'black'),
                        border: 'none', cursor: (order.feedback_id || isExpired) ? 'default' : 'pointer',
                        opacity: (order.feedback_id || isExpired) ? 0.6 : 1
                      }}
                      disabled={!!order.feedback_id || isExpired}
                    >
                      <Star size={16} fill={order.feedback_id ? "currentColor" : "none"} /> 
                      {order.feedback_id ? 'Đã đánh giá' : isExpired ? 'Đã quá hạn' : 'Đánh giá ngay'}
                    </button>
                  )}
                  
                  {order.status === 'pending' && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', maxWidth: '180px' }}>
                      Đang xử lý kích hoạt. Vui lòng chờ trong giây lát...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Improved Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative' }}>
            <button 
              onClick={() => setShowFeedbackModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
            >
              <X size={28} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', margin: '0 auto 20px' 
              }}>
                <Star size={40} fill="#f59e0b" />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Đánh giá sản phẩm</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Xác nhận bảo hành cho: <br/><strong>{selectedOrder?.productName}</strong></p>
            </div>

            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Bạn đánh giá mấy sao?</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    className="hover-scale"
                  >
                    <Star 
                      size={40} 
                      fill={star <= rating ? "#f59e0b" : "none"} 
                      color={star <= rating ? "#f59e0b" : "rgba(255,255,255,0.1)"} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Cảm nhận của bạn</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ví dụ: Giao hàng nhanh, uy tín, gói dùng rất ổn định..."
                style={{ 
                  width: '100%', minHeight: '140px', padding: '20px', 
                  background: 'rgba(255,255,255,0.03)', border: '2px solid var(--glass-border)',
                  borderRadius: '20px', color: 'white', resize: 'none', fontSize: '15px', transition: 'all 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              />
            </div>

            <button 
              disabled={submitting}
              onClick={handleSubmitFeedback}
              className="btn btn-primary" 
              style={{ 
                width: '100%', padding: '18px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 900,
                boxShadow: '0 10px 20px -5px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
              }}
            >
              {submitting ? 'ĐANG GỬI...' : <><Check size={22} strokeWidth={3} /> GỬI ĐÁNH GIÁ</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersHistory;
