import React from 'react';

const MessageBox = ({ message, isOwnMessage = false }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };
  
  const senderName = message.sender?.name || message.sender?.username || 'Unknown';
  
  return (
    <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <p className="text-xs font-semibold text-gray-600 mb-1 ml-1">
            {senderName}
          </p>
        )}
        <div className={`rounded-lg px-3 py-2 ${
          isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="text-sm">{message.content}</p>
        </div>
        <p className={`text-xs mt-1 ml-1 ${isOwnMessage ? 'text-gray-500 text-right' : 'text-gray-400'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default MessageBox;