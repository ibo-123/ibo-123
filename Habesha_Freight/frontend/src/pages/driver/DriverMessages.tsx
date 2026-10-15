import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { get, post } from '../../services/api';
import { getStoredUser } from '../../services/authService';

interface Conversation {
  thread_id: string;
  other_user: {
    id: string;
    full_name: string;
    phone_number?: string;
    profile_photo_url?: string;
    role?: string;
  };
  latest_message: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  unread_count: number;
  updated_at: string;
}

interface MessageItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  thread_id: string;
  content: string;
  created_at: string;
}

export default function DriverMessages() {
  const currentUser = getStoredUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res: any = await get('/messages/conversations');
      const list: Conversation[] = res?.data ?? res ?? [];
      setConversations(list);
      if (list.length > 0 && !activeThreadId) {
        setActiveThreadId(list[0].thread_id);
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchThreadMessages = async (threadId: string) => {
    try {
      setLoadingMsgs(true);
      const res: any = await get(`/messages/thread/${threadId}`);
      const msgs: MessageItem[] = res?.data ?? res ?? [];
      setActiveMessages(msgs);
    } catch (err) {
      console.warn(`Failed to load messages for thread ${threadId}:`, err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeThreadId) {
        get(`/messages/thread/${activeThreadId}`)
          .then((res: any) => {
            const msgs: MessageItem[] = res?.data ?? res ?? [];
            setActiveMessages(msgs);
          })
          .catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeThreadId]);

  useEffect(() => {
    if (activeThreadId) {
      fetchThreadMessages(activeThreadId);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const activeConv = conversations.find((c) => c.thread_id === activeThreadId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    setSending(true);
    try {
      const res: any = await post('/messages/send', {
        receiver_id: activeConv.other_user.id,
        content: inputMessage.trim(),
        thread_id: activeConv.thread_id,
      });

      const newMsg = res?.data ?? res;
      setInputMessage('');
      setActiveMessages((prev) => [...prev, newMsg]);
      fetchConversations();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 w-full">
      <PageHeader
        title="Driver Messages &amp; Shipper Communications"
        subtitle="Chat directly with shippers regarding load requests, bids, and active deliveries"
      />

      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] overflow-hidden mt-6">
        {/* Left Conversations Sidebar */}
        <div className="border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-5 border-b border-slate-200 bg-white">
            <h3 className="m-0 text-base font-bold text-slate-900">Conversations</h3>
            <span className="text-xs text-slate-500">{conversations.length} Active Threads</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConv ? (
              <div className="p-4 sm:p-5 text-center text-slate-500 text-sm">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 px-5 text-center text-slate-500">
                <div className="text-3xl mb-2">📦</div>
                <div className="font-semibold text-sm text-slate-700 mb-1">
                  No Active Conversations
                </div>
                <div className="text-xs text-slate-500 mb-4">
                  Browse available load requests and message shippers directly.
                </div>
                <Link
                  to="/driver/requests"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  View Available Loads →
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.thread_id === activeThreadId;
                return (
                  <div
                    key={conv.thread_id}
                    onClick={() => setActiveThreadId(conv.thread_id)}
                    className={`p-4 px-5 border-b border-slate-100 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : 'bg-transparent border-l-4 border-l-transparent hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <strong className="text-sm font-semibold text-slate-900">
                        {conv.other_user.full_name || 'Shipper Partner'}
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="m-0 text-xs text-slate-500 truncate max-w-[200px]">
                        {conv.latest_message.content}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Panel */}
        {activeConv ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {activeConv.other_user.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="m-0 text-base font-bold text-slate-900">
                    {activeConv.other_user.full_name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {activeConv.other_user.role || 'SHIPPER'} {activeConv.other_user.phone_number ? `· ${activeConv.other_user.phone_number}` : ''}
                  </span>
                </div>
              </div>

              {activeConv.other_user.phone_number && (
                <a
                  href={`tel:${activeConv.other_user.phone_number}`}
                  className="bg-slate-100 hover:bg-slate-200 text-blue-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  📞 Direct Call
                </a>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 flex flex-col gap-3">
              {loadingMsgs && activeMessages.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-sm">Loading messages...</div>
              ) : activeMessages.length === 0 ? (
                <div className="text-center p-12 text-slate-500 text-sm">
                  No messages yet. Send a message below to start chatting.
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 px-4 text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {time}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 px-6 bg-white border-t border-slate-200 flex gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={sending}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xs ${
                  inputMessage.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {sending ? 'Sending...' : 'Send Message 📤'}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-center text-slate-500 text-sm p-12">
            Select a conversation thread to view messages
          </div>
        )}
      </div>
    </div>
  );
}
