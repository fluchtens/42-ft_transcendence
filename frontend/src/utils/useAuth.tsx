import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getUserApi } from "../services/user.api";
import { User } from "../types/user.interface";

interface AuthContextProps {
  user: User | null;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  refreshUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    const data = await getUserApi();
    if (!data) return;
    setUser(data);
    return data;
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  return useContext(AuthContext);
};
