import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to recover session during temporary reloads
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role, rememberMe) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        role
      });

      const { token: jwtToken, user: fetchedUser } = response.data;

      setUser(fetchedUser);
      setToken(jwtToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

      // Store in sessionStorage to retain authentication across refreshes (in-memory per tab)
      sessionStorage.setItem('token', jwtToken);
      sessionStorage.setItem('user', JSON.stringify(fetchedUser));

      // Handle "Remember Me" credentials persistence locally
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedRole', role);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedRole');
        localStorage.removeItem('rememberMe');
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        error: err.response?.data?.error || 'Connection failed or incorrect credentials'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
