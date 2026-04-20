import { createContext, useContext, useState, useEffect } from 'react';
import api, { deviceId } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Only the JWT token lives in localStorage — no user object cached there.
  // User info is fetched fresh from /auth/me on every page load.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password, deviceId });
    localStorage.setItem('token', res.data.token); // only token — no user object
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
