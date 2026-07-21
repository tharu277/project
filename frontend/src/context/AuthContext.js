
import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => { try { return JSON.parse(localStorage.getItem('sbts_user'))||null; } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem('sbts_token')||null);

  const login = useCallback((userData, jwt) => {
    setUser(userData); setToken(jwt);
    localStorage.setItem('sbts_user', JSON.stringify(userData));
    localStorage.setItem('sbts_token', jwt);
  }, []);

  const logout = useCallback(() => {
    setUser(null); setToken(null);
    localStorage.removeItem('sbts_user');
    localStorage.removeItem('sbts_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuth:!!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};


