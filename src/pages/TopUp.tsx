import { useState } from 'react';
import { CreditCard, Wallet, Landmark, Copy, CheckCircle2, Ticket, Loader2, AlertTriangle } from 'lucide-react';

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

function TopUp() {
  const [amount, setAmount] = useState('100000');
  const [method, setMethod] = useState('card');
  const [copied, setCopied] = useState(false);

  // Card form state
  const [telco, setTelco] = useState('VIETTEL');
  const [serial, setSerial] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{type: 'success' | 'error' | 'pending', text: string, requestId?: string} | null>(null);

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
      const response = await fetch('http://localhost:3001/api/topup-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telco,
          amount,
          serial: serial.trim(),
          code: code.trim()
        })
      });

      const data = await response.json();
      
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
          Giao dịch hoàn toàn tự động 24/7. Hỗ trợ nạp thẻ cào và chuyển khoản ngân hàng.
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
            Ngân hàng
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
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Nạp Thẻ Cào Tự Động</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Xử lý nhanh chóng từ 1-5 phút</p>
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
              <label className="form-label">Nhà mạng</label>
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
                placeholder="Nhập số seri..." 
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
                placeholder="Nhập mã thẻ..." 
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
            <label className="form-label">Chọn mệnh giá</label>
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
              <strong style={{ color: 'white', display: 'block', marginBottom: '2px' }}>Lưu ý quan trọng:</strong> 
              Bạn phải chọn <strong>ĐÚNG MỆNH GIÁ</strong> của thẻ. Nếu chọn sai mệnh giá hệ thống sẽ không cộng tiền và bạn sẽ mất thẻ.
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
                Đang xử lý giao dịch...
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
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={24} style={{ color: 'var(--accent-primary)' }} />
            Chuyển khoản Ngân hàng
          </h2>
          
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.05)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            borderRadius: '12px', 
            padding: '24px' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngân hàng</span>
                <strong>MB Bank (Quân Đội)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chủ tài khoản</span>
                <strong>PHAM VINH PHU</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số tài khoản</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '1.15rem', letterSpacing: '1px' }}>0013519933</strong>
                  <button onClick={() => handleCopy('0013519933')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nội dung CK</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ color: '#f87171', fontSize: '1.15rem' }}>LUMIE username</strong>
                  <button onClick={() => handleCopy('LUMIE username')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '14px 16px', 
              background: 'rgba(239, 68, 68, 0.08)', 
              borderRadius: '8px', 
              color: '#f87171', 
              fontSize: '0.85rem',
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}>
              <strong>Lưu ý:</strong> Bắt buộc điền đúng nội dung chuyển khoản (thay "username" bằng tên tài khoản của bạn) 
              để hệ thống tự động cộng tiền. Tối thiểu 10,000đ.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopUp;
