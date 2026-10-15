import { useEffect, useState, useRef } from 'react';
import { get, post } from '../services/api';
import { getStoredUser } from '../services/authService';

export interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  receiverPhone?: string;
  loadTitle?: string;
  threadId?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  thread_id: string;
  content: string;
  created_at: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  receiverPhone,
  loadTitle,
  threadId: initialThreadId,
}: ChatModalProps) {
  const currentUser = getStoredUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [computedThreadId, setComputedThreadId] = useState<string>(initialThreadId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (tId?: string) => {
    if (!receiverId) return;
    try {
      // First check existing conversations to find active thread_id if not passed
      let activeThread = tId || computedThreadId;

      if (!activeThread) {
        const convRes: any = await get('/messages/conversations');
        const convList: any[] = convRes?.data ?? convRes ?? [];
        const existing = convList.find(
          (c) => c.other_user?.id === receiverId || c.thread_id.includes(receiverId)
        );
        if (existing) {
          activeThread = existing.thread_id;
          setComputedThreadId(existing.thread_id);
        }
      }

      if (activeThread) {
        const msgRes: any = await get(`/messages/thread/${activeThread}`);
        const list: ChatMessage[] = msgRes?.data ?? msgRes ?? [];
        setMessages(list);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn('Error loading chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchMessages(initialThreadId);

    // Poll every 3 seconds for live message updates
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, receiverId, initialThreadId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !receiverId) return;

    setSending(true);
    try {
      const payload: any = {
        receiver_id: receiverId,
        content: content,
      };
      if (computedThreadId) {
        payload.thread_id = computedThreadId;
      }

      const res: any = await post('/messages/send', payload);
      const newMsg = res?.data ?? res;
      if (newMsg?.thread_id && !computedThreadId) {
        setComputedThreadId(newMsg.thread_id);
      }

      setInputText('');
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          width: '520px',
          maxWidth: '95vw',
          height: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {receiverName ? receiverName.slice(0, 2).toUpperCase() : 'SH'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#F8FAFC' }}>
                {receiverName || 'Shipper Contact'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: '#22C55E' }}>● Online</span>
                {loadTitle && <span>· {loadTitle}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {receiverPhone && (
              <a
                href={`tel:${receiverPhone}`}
                title="Call Shipper"
                style={{
                  backgroundColor: '#1E293B',
                  color: '#38BDF8',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                📞 Call
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.4rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div
          style={{
            flex: 1,
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {loading && messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.9rem' }}>
              Loading message thread...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Start a Conversation with {receiverName}
              </div>
              <div style={{ fontSize: '0.825rem' }}>
                Inquire about shipment details, pickup schedules, or bid terms directly.
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
              const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '78%',
                      backgroundColor: isMe ? '#2563EB' : '#FFFFFF',
                      color: isMe ? '#FFFFFF' : '#0F172A',
                      padding: '0.75rem 1rem',
                      borderRadius: isMe ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      border: isMe ? 'none' : '1px solid #E2E8F0',
                      fontSize: '0.925rem',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                    {formattedTime}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder={`Message ${receiverName || 'shipper'}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.6rem',
              border: '1px solid #CBD5E1',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            style={{
              backgroundColor: inputText.trim() ? '#2563EB' : '#94A3B8',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.6rem',
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: inputText.trim() ? 'pointer' : 'default',
              transition: 'background-color 0.2s',
            }}
          >
            {sending ? 'Sending...' : 'Send 📤'}
          </button>
        </form>
      </div>
    </div>
  );
}
