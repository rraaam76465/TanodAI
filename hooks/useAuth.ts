import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);

  const login = (email: string, password: string) => {
    // Add your login logic here
    setUser({ email });
  };

  const register = (email: string, password: string) => {
    // Add your registration logic here
    setUser({ email });
  };

  const logout = () => {
    setUser(null);
  };

  return { user, login, register, logout };
} 