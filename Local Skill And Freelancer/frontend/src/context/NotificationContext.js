import React, { createContext, useMemo, useState } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    }, 4000);
  };

  const value = useMemo(() => ({ notifications, notify }), [notifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
