export interface User {
  id: string;
  email: string;
  name: string;
  role: 'shipper' | 'carrier' | 'admin';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}