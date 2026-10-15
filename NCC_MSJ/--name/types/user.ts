// types/user.ts
export interface User {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: string;
  role: "admin" | "member";
  status: "Active" | "Inactive" | "Suspended";
  activeness?: number;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}