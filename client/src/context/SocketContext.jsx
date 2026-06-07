import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/axios.js';

const SocketContext = createContext(null);

/**
 * Holds a single Socket.io connection for the authenticated user.
 * Connects when logged in (using the in-memory access token), disconnects on
 * logout. Same-origin in dev via the Vite `/socket.io` ws proxy.
 */
export function SocketProvider({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (loading || !isAuthenticated) return undefined;
    const token = getAccessToken();
    if (!token) return undefined;

    const s = io({
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, loading]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
