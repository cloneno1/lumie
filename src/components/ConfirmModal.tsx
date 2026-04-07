import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, 
  confirmLabel = 'OK', cancelLabel = 'Huỷ' 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          </div>
          <button onClick={onCancel} style={{ 
            background: 'none', border: 'none', color: 'var(--text-muted)', 
            cursor: 'pointer', padding: '4px' 
          }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#fff', fontSize: '1.05rem', lineHeight: 1.5 }}>{message}</p>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 20px', display: 'flex', gap: '12px', 
          justifyContent: 'center', background: 'rgba(0,0,0,0.2)' 
        }}>
          <button 
            onClick={onCancel} 
            className="btn" 
            style={{ 
              flex: 1, background: 'rgba(255,255,255,0.05)', 
              color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
              padding: '12px'
            }}
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className="btn btn-primary" 
            style={{ flex: 1, padding: '12px' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}} />
    </div>
  );
};

export default ConfirmModal;
