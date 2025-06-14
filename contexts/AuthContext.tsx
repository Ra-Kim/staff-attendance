import { IUser } from "@/types";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUser | null;
  login: (userData:IUser) => void;
  logout: () => void;
  toggleAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<IUser | null>(null);

  // Simulate loading (e.g. checking async storage or some token)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // simulate 1s delay

    return () => clearTimeout(timeout);
  }, []);

  const login = (userData: IUser) => {
    console.log("🔐 User logged in");
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    console.log("🚪 User logged out");
    setIsAuthenticated(false);
  };

  const toggleAuth = () => {
    console.log(
      "🔄 Toggling auth state from",
      isAuthenticated,
      "to",
      !isAuthenticated
    );
    setIsAuthenticated(!isAuthenticated);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, login, user, logout, toggleAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};
