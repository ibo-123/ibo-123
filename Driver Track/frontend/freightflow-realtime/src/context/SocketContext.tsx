import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { getSocketUrl, TOKEN_STORAGE_KEY } from "@/lib/config";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  socketUrl: string;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  socketUrl: "",
});

/**
 * ONE Socket.IO connection for the whole app. The instance lives in a ref so
 * re-renders never create a new connection.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketUrl, setSocketUrl] = useState("");

  useEffect(() => {
    const url = getSocketUrl();
    setSocketUrl(url);

    const socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      auth: {
        token: window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? undefined,
      },
      // Allow sending cookies during the Socket.IO handshake so the server
      // can support httpOnly cookie-based auth as an alternative to
      // Bearer tokens stored in localStorage.
      withCredentials: true,
    });
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({ socket: socketRef.current, connected, socketUrl }),
    [connected, socketUrl],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
