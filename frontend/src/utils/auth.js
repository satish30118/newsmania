import React, { createContext, useContext, useState } from 'react';
const AuthContext = createContext();
export function AuthProvider({ children }){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const save = (t)=>{ localStorage.setItem('token', t); setToken(t); };
  const logout = ()=>{ localStorage.removeItem('token'); setToken(null); };
  return <AuthContext.Provider value={{ token, save, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = ()=> useContext(AuthContext);
