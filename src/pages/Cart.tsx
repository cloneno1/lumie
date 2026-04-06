import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Trash2, Plus, Minus, ShoppingBag, CreditCard, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thanh toán!');
      navigate('/login');
      return;
    }

    if (user.balance < totalPrice) {
      alert('Số dư tài khoản không đủ. Vui lòng nạp thêm tiền!');
      navigate('/nap-tien');
      return;
    }

    if (!confirm(`Xác nhận thanh toán ${totalItems} mặt hàng với tổng giá ${totalPrice.toLocaleString()}đ?`)) return;

    setLoading(true);
    try {
      // Process each item in cart
      for (const item of cart) {
        await api.post('/orders/create', {
          productId: item.id.toString(),
          productName: item.title,
          price: item.price,
          amount: item.quantity
        });
      }
      
      setSuccess(true);
      clearCart();
      refreshUser();
      
      setTimeout(() => {
        navigate('/profile/orders');
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card animate-fade-in" style={{ padding: '60px', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={48} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Thanh toán thành công!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Đơn hàng của bạn đang được xử lý. Bạn sẽ được chuyển đến trang lịch sử đơn hàng trong giây lát.</p>
          <div className="loader" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ padding: '10px', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
            <ShoppingBag size={24} />
          </div>
          <h1 style={{ margin: 0 }}>Giỏ Hàng <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>({totalItems} sản phẩm)</span></h1>
        </div>

        {cart.length === 0 ? (
          <div className="glass-card" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ opacity: 0.3, marginBottom: '24px' }}>
              <ShoppingBag size={80} style={{ margin: '0 auto' }} />
            </div>
            <h3>Giỏ hàng của bạn đang trống</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi và thêm chúng vào giỏ hàng.</p>
            <Link to="/products" className="btn btn-primary" style={{ padding: '12px 32px' }}>
              Khám Phá Sản Phẩm
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }} className="cart-layout-mobile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.map(item => (
                <div key={item.id} className="glass-card" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    {item.theme === 'discord' && '💎'}
                    {item.theme === 'netflix' && '🎬'}
                    {item.theme === 'youtube' && '📺'}
                    {item.theme === 'spotify' && '🎧'}
                    {item.theme === 'robux' && '🪙'}
                    {!item.theme && '📦'}
                  </div>
                  
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{item.title}</h4>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{item.displayPrice}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{(item.price * item.quantity).toLocaleString()}đ</div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={clearCart} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Trash2 size={18} /> Làm trống giỏ hàng
                </button>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="cart-summary-sidebar">
              <div className="glass-card" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Tổng đơn hàng</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Số lượng:</span>
                    <span>{totalItems} sản phẩm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Tạm tính:</span>
                    <span>{totalPrice.toLocaleString()}đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Giảm giá:</span>
                    <span style={{ color: '#10b981' }}>-0đ</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tổng cộng:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{totalPrice.toLocaleString()}đ</span>
                  </div>
                </div>

                {user && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span color="var(--text-muted)">Số dư của bạn:</span>
                      <span style={{ fontWeight: 700, color: user.balance < totalPrice ? '#ef4444' : '#10b981' }}>{user.balance.toLocaleString()}đ</span>
                    </div>
                    {user.balance < totalPrice && (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                        <AlertCircle size={12} /> Không đủ số dư
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? (
                    'Đang xử lý...'
                  ) : (
                    <>
                      <CreditCard size={20} /> Thanh Toán Ngay <ChevronRight size={18} />
                    </>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                  Bằng việc nhấn đặt hàng, bạn đồng ý với các điều khoản của chúng tôi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
