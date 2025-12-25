import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
   user: User | null;
     setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
};
type User = {
  email: string;
  name?: string;
  picture?: string;
  // add other fields you need
};
const AuthContext = createContext<AuthContextType | null>(null);
const apiUrl = process.env.REACT_APP_API_DOMAIN || '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // Check login on app load
  useEffect(() => {
    fetch(`${apiUrl}/api/auth/checkLogin`, {
      method: "POST",
      credentials: "include",
    }).then(async res => {
      if(res.ok){
        setIsLoggedIn(true);
        const data = await res.json();
        const filterData={
          email:data.email,
          name:data.name,
          picture:data.picture,
        }
        setUser(filterData);
      }else{
          setIsLoggedIn(false);
          setUser(null);
        }
    });
  }, []);
  const clearUser = () => {
    setUser(null);
    setIsLoggedIn(false);
  };
  const fetchUser = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/checkLogin`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error(err);
      setUser(null);
      setIsLoggedIn(false);
    }
  };
  return (
   <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, user, fetchUser,clearUser,setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
