import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Headset, Clock } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const CustomerSupport = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const fetchMessages = async () => {
    if (!user || !isChatOpen) return;
    try {
      const res = await api.get('/chat/messages');
      setMessages(res.data);
    } catch (err) {
      console.error('Chat fetch error');
    }
  };

  // Initial fetch on open
  useEffect(() => {
    if (isChatOpen && user) {
      fetchMessages();
      scrollToBottom('auto');
      const interval = setInterval(fetchMessages, 4000); // Polling 4s
      return () => clearInterval(interval);
    }
  }, [isChatOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    if (!user) {
      showNotification('Vui lòng đăng nhập để chat với hỗ trợ.', 'info');
      return;
    }
    
    const textToSend = message;
    setMessage('');
    setIsSending(true);

    // Optimistic Update: Add to UI immediately
    const optimisticMsg = {
      message: textToSend,
      sender_role: 'user',
      created_at: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await api.post('/chat/send', { message: textToSend });
      fetchMessages();
    } catch (err) {
      showNotification('Không thể gửi tin nhắn.', 'error');
      // Remove the optimistic message if it failed
      setMessages(prev => prev.filter(m => !m.optimistic));
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
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
      {/* Premium Web Chat Modal */}
      {isChatOpen && (
        <div className="glass-panel animate-fade-in" style={{
          width: '360px',
          height: '520px',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '12px',
          background: 'rgba(13, 17, 23, 0.95)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Enhanced Header */}
          <div style={{
            padding: '20px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="chat-pulse-staff" style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.1)'
              }}>
                <Headset size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.3px' }}>Lumie Support</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></span>
                  <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase' }}>Sẵn sàng hỗ trợ</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="hover-scale"
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
            >
              <X size={20} />
            </button>
          </div>

          {!user ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px', background: 'rgba(10, 10, 15, 0.4)' }}>
              <div className="animate-fade-in">
                <div style={{ 
                  width: '80px', height: '80px', background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <User size={40} style={{ opacity: 0.3 }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Chưa đăng nhập</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Vui lòng đăng nhập tài khoản để chat trực tiếp với nhân viên hỗ trợ.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Ultra-Smooth Messages Area */}
              <div className="chat-scroll-hide" style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'linear-gradient(to bottom, rgba(13, 17, 23, 0.4), rgba(7, 7, 10, 0.6))'
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.5 }}>
                    <div style={{ marginBottom: '15px' }}>✨</div>
                    <p style={{ fontSize: '13px', fontStyle: 'italic' }}>Xin chào <strong>{user.username}</strong>! Hãy chat tại đây nếu bạn cần giúp đỡ về đơn hàng nhé.</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isUser = msg.sender_role === 'user';
                  return (
                    <div key={idx} className="chat-message-pop" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '100%'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '10px',
                        maxWidth: '90%'
                      }}>
                        {!isUser && (
                          <div style={{ 
                            width: '28px', height: '28px', borderRadius: '10px', 
                            background: 'var(--primary-gradient)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', color: '#000', 
                            flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' 
                          }}>
                            <User size={16} />
                          </div>
                        )}
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isUser ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.06)',
                          color: isUser ? '#000' : '#fff',
                          fontSize: '14px',
                          fontWeight: isUser ? 600 : 400,
                          lineHeight: '1.5',
                          boxShadow: isUser ? '0 4px 15px rgba(0, 242, 254, 0.2)' : 'none',
                          border: !isUser ? '1px solid rgba(255,255,255,0.1)' : 'none',
                          wordBreak: 'break-word',
                          opacity: msg.optimistic ? 0.7 : 1
                        }}>
                          {msg.message}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: 'var(--text-muted)', 
                        marginTop: '4px',
                        marginLeft: isUser ? '0' : '38px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={10} /> {formatTime(msg.created_at)}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Input Area */}
              <form onSubmit={handleSend} style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                gap: '12px',
                background: 'rgba(13, 17, 23, 0.98)',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="text" 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="Viết tin nhắn..." 
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1.5px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '12px 18px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    className={isInputFocused ? 'chat-input-focus' : ''}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className="hover-scale"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    background: message.trim() ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: message.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: message.trim() ? '0 4px 15px rgba(0, 242, 254, 0.3)' : 'none'
                  }}
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Modern Floating Control Center */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Support Badge (Social) */}
        {!isChatOpen && (
          <div className="animate-fade-in" style={{
            background: 'rgba(13, 17, 23, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '12px',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></span>
            Nhân viên đang trực
          </div>
        )}

        {/* Discord Quick Link */}
        <a 
          href="https://discord.gg/lumie" 
          target="_blank" 
          rel="noreferrer"
          className="hover-scale"
          title="Hỗ trợ qua Discord"
          style={{
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(88, 101, 242, 0.1)',
            backdropFilter: 'blur(10px)',
            color: '#5865F2',
            borderRadius: '16px',
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,0,0,0-.09C129.96,52.43,122.28,28.23,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
        </a>

        {/* Main Chat Action Button */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="hover-scale"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: isChatOpen ? 'rgba(255, 255, 255, 0.05)' : 'var(--primary-gradient)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: isChatOpen ? 'white' : 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isChatOpen ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0, 242, 254, 0.3)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {isChatOpen ? <X size={32} /> : <MessageCircle size={32} />}
        </button>

      </div>
    </div>
  );
};

export default CustomerSupport;
