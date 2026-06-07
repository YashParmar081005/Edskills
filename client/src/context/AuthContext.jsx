import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { setAccessToken } from '../api/axios.js';
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  refreshRequest,
} from '../api/auth.js';

const AuthContext = createContext(null);

/** Default landing route for each role after login. */
export const DASHBOARD_BY_ROLE = {
  admin: '/admin',
  instructor: '/instructor',
  student: '/student',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // On first load, try to restore the session from the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await refreshRequest();
        if (active) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore network errors on logout
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
