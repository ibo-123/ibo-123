import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api/axios';
import MessageBox from '../components/MessageBox';
import LoadingSpinner from '../components/LoadingSpinner';

const Messaging = () => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId) => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [scrollToBottom]);

  // Search users
  const searchUsers = useCallback(async () => {
    if (searchTerm.length < 2) return;
    try {
      const res = await api.get(`/users/search?q=${searchTerm}`);
      setUsers(res.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }, [searchTerm]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId) => {
    try {
      await api.put(`/messages/conversation/${conversationId}/read`);
      fetchConversations(); // Refresh conversations to update unread counts
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      // Mark messages as read
      markAsRead(selectedConversation._id);
    }
  }, [selectedConversation, fetchMessages, markAsRead]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm) searchUsers();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm, searchUsers]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSending(true);
    try {
      await api.post('/messages', {
        receiverId: selectedConversation?.participants.find(p => p._id !== user._id)?._id,
        content: content.trim()
      });
      
      setContent('');
      await fetchMessages(selectedConversation._id);
      await fetchConversations(); // Refresh conversations
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Start new conversation
  const startNewConversation = async (userId) => {
    try {
      const res = await api.post('/messages/conversation', { userId });
      setSelectedConversation(res.data);
      setShowUserSearch(false);
      setSearchTerm('');
      await fetchConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation');
    }
  };

  // Format last message time
  const formatLastMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else if (diffHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get other participant name
  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== user?._id);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please login to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-8rem)]">
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <h1 className="text-xl font-bold text-white">Messages</h1>
                <p className="text-sm text-blue-100 mt-1">
                  {conversations.length} conversations
                </p>
              </div>

              {/* New Message Button */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowUserSearch(!showUserSearch)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Message
                </button>
              </div>

              {/* User Search */}
              {showUserSearch && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  {users.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto">
                      {users.map(user => (
                        <button
                          key={user._id}
                          onClick={() => startNewConversation(user._id)}
                          className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-2 text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400">Start a new conversation</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    const lastMessage = conversation.lastMessage;
                    const unreadCount = conversation.unreadCount || 0;
                    
                    return (
                      <button
                        key={conversation._id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                          selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {otherParticipant?.name?.charAt(0) || 'U'}
                            </div>
                            {conversation.isOnline && (
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className="font-semibold text-gray-900 truncate">
                                {otherParticipant?.name || 'Unknown User'}
                              </p>
                              {lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatLastMessageTime(lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {lastMessage && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {lastMessage.sender?._id === user._id ? 'You: ' : ''}
                                {lastMessage.content}
                              </p>
                            )}
                            {unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center mt-1 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {getOtherParticipant(selectedConversation)?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {getOtherParticipant(selectedConversation)?.name || 'Unknown User'}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {selectedConversation.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="mt-2 text-gray-500">No messages yet</p>
                        <p className="text-sm text-gray-400">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <MessageBox
                          key={message._id}
                          message={message}
                          isOwnMessage={message.sender?._id === user._id}
                          showAvatar={true}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="2"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sending || !content.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Sending</span>
                          </div>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Press Enter to send, Shift + Enter for new line
                    </p>
                  </form>
                </>
              ) : (
                // No conversation selected
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No conversation selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose a conversation from the sidebar or start a new one
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messaging;