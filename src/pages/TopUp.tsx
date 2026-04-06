import { useState, useEffect } from 'react';
import { CreditCard, Landmark, Copy, CheckCircle2, Ticket, Loader2, AlertTriangle, History, RefreshCcw } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const VALID_AMOUNTS = [
  { value: '10000', label: '10,000đ' },
  { value: '20000', label: '20,000đ' },
  { value: '30000', label: '30,000đ' },
  { value: '50000', label: '50,000đ' },
  { value: '100000', label: '100,000đ' },
  { value: '200000', label: '200,000đ' },
  { value: '300000', label: '300,000đ' },
  { value: '500000', label: '500,000đ' },
  { value: '1000000', label: '1,000,000đ' },
];

const BANKS = {
  VCB: { name: 'Vietcombank (Ngân hàng Ngoại thương Việt Nam)', number: '9344559968', bin: 'VCB', accountName: 'PHAM VINH PHU' }
};

function TopUp() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('100000');
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [copied, setCopied] = useState(false);

  // Card form state
  const [telco, setTelco] = useState('VIETTEL');
  const [serial, setSerial] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{type: 'success' | 'error' | 'pending', text: string, requestId?: string} | null>(null);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  // Fetch History
  const fetchTxHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await api.get('/user/transactions');
      setTxHistory(res.data.slice(0, 5)); // Only show top 5
    } catch {
      // Fail silently
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTxHistory();
      // Auto refresh every 15s to check for bank sync
      const interval = setInterval(fetchTxHistory, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim() || !code.trim()) {
      setResult({ type: 'error', text: 'Vui lòng nhập đầy đủ Số Serial và Mã thẻ.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/topup-card', {
        telco,
        amount,
        serial: serial.trim(),
        code: code.trim()
      });

      const data = response.data;
      
      if (data.status === 99) {
        setResult({ 
          type: 'pending', 
          text: data.message || 'Thẻ đang được xử lý, vui lòng chờ 1-5 phút...',
          requestId: data.request_id
        });
        setSerial('');
        setCode('');
      } else if (data.status === 1) {
        setResult({ 
          type: 'success', 
          text: data.message || 'Nạp thẻ thành công!',
          requestId: data.request_id
        });
        setSerial('');
        setCode('');
      } else {
        setResult({ 
          type: 'error', 
          text: data.message || 'Lỗi nạp thẻ, vui lòng thử lại.',
          requestId: data.request_id
        });
      }
    } catch {
      setResult({ type: 'error', text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container" style={{ padding: '60px 24px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-fade-in">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
          Nạp Tiền Vào <span className="gradient-text">Tài Khoản</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Hệ thống nạp tiền tự động 24/7. Bạn có thể chọn nạp qua Thẻ cào hoặc Chuyển khoản ngân hàng.
        </p>
      </div>

      {/* Payment Method Selector */}
      <div className="glass-panel animate-fade-in delay-1" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={24} style={{ color: 'var(--accent-primary)' }} />
          Phương thức thanh toán
        </h2>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '0', flexWrap: 'wrap' }}>
          <button 
            className={`category-btn ${method === 'card' ? 'active' : ''}`}
            onClick={() => { setMethod('card'); setResult(null); }}
            style={{ flex: 1, minWidth: '180px', justifyContent: 'center', display: 'flex', gap: '8px' }}
          >
            <Ticket size={20} />
            Thẻ cào (Tự động)
          </button>
          <button 
            className={`category-btn ${method === 'bank' ? 'active' : ''}`}
            onClick={() => { setMethod('bank'); setResult(null); }}
            style={{ flex: 1, minWidth: '180px', justifyContent: 'center', display: 'flex', gap: '8px' }}
          >
            <Landmark size={20} />
            Chuyển khoản (VCB)
          </button>
        </div>
      </div>

      {/* Card Top-up Form */}
      {method === 'card' && (
        <form onSubmit={handleCardSubmit} className="glass-panel animate-fade-in delay-2" style={{ padding: '40px', marginBottom: '32px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Ticket size={28} style={{ color: 'var(--accent-primary)', display: 'block' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Nạp Thẻ Cào</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Hệ thống duyệt thẻ tự động sau 1-5 phút</p>
            </div>
          </div>

          {/* Result message */}
          {result && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '16px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: result.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : result.type === 'pending' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: result.type === 'error' ? 'var(--accent-red)' : result.type === 'pending' ? 'var(--accent-blue)' : 'var(--accent-primary)',
              border: `1.5px solid ${result.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : result.type === 'pending' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
              animation: 'authFadeIn 0.5s ease-out'
            }}>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>
                  {result.type === 'error' ? 'Lỗi giao dịch' : result.type === 'pending' ? 'Đang xử lý thẻ' : 'Thành công'}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{result.text}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chọn nhà mạng</label>
              <select className="form-control" value={telco} onChange={(e) => setTelco(e.target.value)}>
                <option value="VIETTEL">Viettel</option>
                <option value="VINAPHONE">Vinaphone</option>
                <option value="MOBIFONE">Mobifone</option>
                <option value="VNMOBI">Vietnamobile</option>
                <option value="ZING">Zing</option>
                <option value="GARENA">Garena</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Số Serial</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Nhập số seri nằm trên thẻ..." 
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mã thẻ (PIN)</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Nhập mã thẻ sau lớp cào..." 
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chiết khấu</label>
              <div className="form-control" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--accent-primary)', fontWeight: 700, pointerEvents: 'none' }}>
                {telco === 'GARENA' ? '0%' : 'Chỉ 22%'}
              </div>
            </div>
          </div>

          {/* Amount Select */}
          <div className="form-group">
            <label className="form-label">Chọn mệnh giá thẻ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {VALID_AMOUNTS.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={`category-btn ${amount === item.value ? 'active' : ''}`}
                  onClick={() => setAmount(item.value)}
                  style={{ justifyContent: 'center', width: '100%', fontSize: '0.95rem', padding: '12px 10px', borderRadius: '14px' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div style={{ 
            padding: '16px 20px', 
            background: 'rgba(239, 68, 68, 0.05)', 
            borderRadius: '16px', 
            color: '#fca5a5', 
            fontSize: '0.875rem', 
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            border: '1.5px solid rgba(239, 68, 68, 0.1)'
          }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-red)' }} />
            <span style={{ lineHeight: 1.5 }}>
              <strong style={{ color: 'white', display: 'block', marginBottom: '2px' }}>Lưu ý đặc biệt:</strong> 
              Quý khách vui lòng chọn <strong>đúng mệnh giá</strong>. Nếu chọn sai hệ thống sẽ không hỗ trợ hoàn tiền hoặc cộng tiền.
            </span>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '18px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '1.1rem',
              borderRadius: '16px'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                Đang gửi yêu cầu...
              </>
            ) : (
              <>
                <Ticket size={24} />
                Nạp Thẻ Ngay
              </>
            )}
          </button>
        </form>
      )}

      {/* Bank Transfer */}
      {method === 'bank' && (
        <div className="glass-panel animate-fade-in delay-2" style={{ padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Landmark size={28} style={{ color: '#3b82f6', display: 'block' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Chuyển khoản Vietcombank</h2>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 10px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <span className="pulse-dot" style={{ 
                    width: '6px', 
                    height: '6px', 
                    background: '#10b981', 
                    borderRadius: '50%',
                    boxShadow: '0 0 8px #10b981'
                  }}></span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>TỰ ĐỘNG 24/7</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, marginTop: '4px' }}>Hệ thống quét QR và cộng tiền tức thì</p>
            </div>
          </div>
          
          {/* Amount Select for QR */}
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Chọn số tiền muốn nạp</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {VALID_AMOUNTS.slice(0, 7).map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={`category-btn ${amount === item.value ? 'active' : ''}`}
                  onClick={() => setAmount(item.value)}
                  style={{ justifyContent: 'center', fontSize: '0.9rem' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }} className="bank-content-grid">
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '20px', 
              padding: '24px' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ngân hàng</span>
                  <strong style={{ color: '#3b82f6' }}>{BANKS.VCB.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Chủ tài khoản</span>
                  <strong style={{ letterSpacing: '0.5px' }}>{BANKS.VCB.accountName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Số tài khoản</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '1.2rem', letterSpacing: '1px', color: 'var(--accent-primary)' }}>{BANKS.VCB.number}</strong>
                    <button onClick={() => handleCopy(BANKS.VCB.number)} className="btn-icon" style={{ padding: '6px', width: '32px', height: '32px' }}>
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Nội dung chuyển khoản</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ 
                      color: '#f87171', 
                      fontSize: '1.2rem', 
                      textTransform: 'uppercase'
                    }}>
                      LUMIE {user?.topup_id || user?.id}
                    </strong>
                    <button onClick={() => handleCopy(`LUMIE ${user?.topup_id || user?.id}`)} className="btn-icon" style={{ padding: '6px', width: '32px', height: '32px', flexShrink: 0 }}>
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ 
                marginTop: '32px', 
                padding: '16px', 
                background: 'rgba(239, 68, 68, 0.05)', 
                borderRadius: '12px', 
                color: '#f87171', 
                fontSize: '0.9rem',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                lineHeight: 1.6
              }}>
                <strong>Lưu ý quan trọng:</strong> Quý khách phải <strong>GHI ĐÚNG NỘI DUNG</strong> như trên để hệ thống tự động nhận diện và cộng tiền trong vài giây.
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'white', 
                padding: '12px', 
                borderRadius: '24px', 
                display: 'inline-block',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: '4px solid rgba(59, 130, 246, 0.3)',
                marginBottom: '16px'
              }}>
                <img 
                  src={`https://img.vietqr.io/image/VCB-${BANKS.VCB.number}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(`LUMIE ${user?.id}`)}&accountName=${encodeURIComponent(BANKS.VCB.accountName)}`}
                  alt="VietQR Payment VCB"
                  style={{ width: '100%', maxWidth: '240px', borderRadius: '12px', display: 'block' }}
                />
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Quét mã QR để thanh toán nhanh<br/>
                Số tiền: <strong>{parseInt(amount).toLocaleString()}đ</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="glass-panel animate-fade-in delay-3" style={{ padding: '32px', marginTop: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History size={24} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Giao dịch gần đây</h2>
          </div>
          <button 
            onClick={fetchTxHistory} 
            className="btn-icon" 
            style={{ padding: '8px' }}
            title="Làm mới lịch sử"
          >
            <RefreshCcw size={18} className={fetchingHistory ? 'animate-spin' : ''} />
          </button>
        </div>

        {txHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Bạn chưa có giao dịch nào gần đây.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {txHistory.map((tx) => (
              <div 
                key={tx.id || tx.request_id}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                    {tx.telco?.startsWith('BANK') ? 'Nạp tiền BIDV' : `Nạp thẻ ${tx.telco}`}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(tx.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white', marginBottom: '4px' }}>
                    +{parseInt(tx.amount).toLocaleString()}đ
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    padding: '4px 10px', 
                    borderRadius: '20px',
                    display: 'inline-block',
                    background: tx.status === 1 || tx.status === '1' ? 'rgba(16, 185, 129, 0.15)' : tx.status === 99 || tx.status === '99' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: tx.status === 1 || tx.status === '1' ? '#10b981' : tx.status === 99 || tx.status === '99' ? '#3b82f6' : '#ef4444',
                    fontWeight: 600
                  }}>
                    {tx.status === 1 || tx.status === '1' ? 'Thành công' : tx.status === 99 || tx.status === '99' ? 'Đang xử lý' : 'Thất bại'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          * Lịch sử cập nhật tự động mỗi 15 giây.
        </p>
      </div>
    </div>
  );
}

export default TopUp;
