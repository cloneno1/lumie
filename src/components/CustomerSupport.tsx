import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const CustomerSupport = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat/messages');
      setMessages(res.data);
    } catch (err) {
      console.error('Chat fetch error');
    }
  };

  useEffect(() => {
    if (isChatOpen && user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!user) {
      showNotification('Vui lòng đăng nhập để chat với hỗ trợ.', 'info');
      return;
    }
    
    const textToSend = message;
    setMessage('');
    
    try {
      await api.post('/chat/send', { message: textToSend });
      fetchMessages();
    } catch (err) {
      showNotification('Không thể gửi tin nhắn.', 'error');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '16px',
      zIndex: 9999
    }}>
      {/* Web Chat Modal */}
      {isChatOpen && (
        <div className="glass-card" style={{
          width: '320px',
          height: '480px',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInTop 0.3s ease-out',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '8px'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
                <MessageCircle size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Hỗ trợ trực tuyến</span>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>🟢 Đang trực tuyến</span>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>

          {!user ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px', background: 'rgba(10, 10, 15, 0.8)' }}>
              <div>
                <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Vui lòng đăng nhập để bắt đầu trò chuyện với nhân viên hỗ trợ.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(10, 10, 15, 0.6)'
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', opacity: 0.4, fontSize: '12px' }}>
                    Hãy gửi tin nhắn đầu tiên, nhân viên sẽ phản hồi bạn sớm nhất!
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    alignSelf: msg.sender_role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}>
                    {msg.sender_role === 'staff' && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0 }}>
                        <User size={14} />
                      </div>
                    )}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: msg.sender_role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.sender_role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      color: msg.sender_role === 'user' ? '#000' : '#fff',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      border: msg.sender_role === 'staff' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} style={{
                padding: '12px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '8px',
                background: 'rgba(13, 17, 23, 0.9)'
              }}>
                <input 
                  type="text" 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Nhập nội dung cần hỗ trợ..." 
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: message.trim() ? 1 : 0.5
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Discord Button */}
        <a 
          href="https://discord.gg/lumie" 
          target="_blank" 
          rel="noreferrer"
          className="hover-scale"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'var(--accent-primary)',
            padding: '12px 24px',
            borderRadius: '16px',
            textDecoration: 'none',
            fontWeight: '600',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ background: 'var(--accent-primary)', padding: '6px', borderRadius: '10px', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="black">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,0,0,0-.09C129.96,52.43,122.28,28.23,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
          </div>
          <span style={{ fontSize: '13px', letterSpacing: '0.5px' }}>HỖ TRỢ DISCORD</span>
        </a>

        {/* Action Button for Chat */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="hover-scale"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'rgba(16, 185, 129, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>

      </div>
    </div>
  );
};

export default CustomerSupport;
