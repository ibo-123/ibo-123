import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const saveToken = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };


  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };


  return (
    <AuthContext.Provider
      value={{
        token,
        saveToken,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth(){
  return useContext(AuthContext);
}