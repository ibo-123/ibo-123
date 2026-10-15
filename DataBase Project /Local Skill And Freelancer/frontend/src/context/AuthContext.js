import React, { createContext, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const login = (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const authContextValue = useMemo(() => ({ user, token, login, logout, loading, setLoading }), [user, token, loading]);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};
