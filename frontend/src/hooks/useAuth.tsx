import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getUserApi } from "../services/user.api";
import { User } from "../types/user.interface";

interface AuthContextProps {
  user: User | null | undefined;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: undefined,
  refreshUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const refreshUser = async () => {
    const data = await getUserApi();
    if (!data) {
      setUser(null);
      return;
    }
    setUser(data);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return <AuthContext.Provider value={{ user, refreshUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => useContext(AuthContext);
