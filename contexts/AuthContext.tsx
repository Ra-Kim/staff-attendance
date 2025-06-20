import { IUser } from "@/types";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUser | null;
  login: (userData: IUser) => void;
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
  const router = useRouter();

  const login = async (userData: IUser) => {
    setUser(userData);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
    await AsyncStorage.setItem("is_authenticated", "true");
    router.replace("/(tabs)");
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem("auth_user");
    await AsyncStorage.removeItem("is_authenticated");
  };

  // Load from AsyncStorage on initial mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("auth_user");
        const storedAuth = await AsyncStorage.getItem("is_authenticated");

        if (storedUser && storedAuth === "true") {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          logout();
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const toggleAuth = () => {
    const newState = !isAuthenticated;
    setIsAuthenticated(newState);
    AsyncStorage.setItem("is_authenticated", newState ? "true" : "false");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, login, user, logout, toggleAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};
