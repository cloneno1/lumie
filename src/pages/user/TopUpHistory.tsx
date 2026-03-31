import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { History } from 'lucide-react';

const TopUpHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/user/transactions');
        setTransactions(response.data);
      } catch (err) {
        console.error('Lỗi tải giao dịch:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchTransactions();
  }, [user]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Thành công</span>;
      case 99: return <span style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Đang duyệt</span>;
      case 2: case 3: return <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Thất bại</span>;
      default: return <span style={{ color: 'var(--text-muted)' }}>Mã: {status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--primary-gradient)', padding: '12px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
            <History size={24} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Lịch sử nạp tiền</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Bạn chưa có giao dịch nào.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Mã nạp</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Nhà mạng</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Mệnh giá</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Số dư nhận</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Trạng thái</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Ngày nạp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>{tx.request_id}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{tx.telco}</td>
                    <td style={{ padding: '16px' }}>{tx.amount.toLocaleString()}đ</td>
                    <td style={{ padding: '16px', color: 'var(--accent-primary)', fontWeight: 700 }}>+{tx.amount.toLocaleString()}đ</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(tx.status)}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(tx.created_at).toLocaleString('vi-VN')}
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

export default TopUpHistory;
