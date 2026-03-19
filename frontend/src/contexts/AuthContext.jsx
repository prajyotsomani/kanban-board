import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);

  // Setup axios default
  axios.defaults.baseURL = 'http://localhost:5000/api';

  useMemo(() => {
    axios.interceptors.request.use(config => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const rt = localStorage.getItem('refreshToken');
            if (rt) {
              const res = await axios.post('/auth/refresh', { refreshToken: rt });
              const { token: newToken, refreshToken: newRt } = res.data;
              setToken(newToken);
              setRefreshToken(newRt);
              localStorage.setItem('token', newToken);
              localStorage.setItem('refreshToken', newRt);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            setToken(null);
            setRefreshToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        }
        return Promise.reject(error);
      }
    );
  }, []); // run once to setup interceptor

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      
      axios.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          // Handled by interceptor or failed ultimately
        })
        .finally(() => setLoading(false));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setLoading(false);
    }
  }, [token, refreshToken]);

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    setToken(res.data.token);
    setRefreshToken(res.data.refreshToken);
    setUser(res.data.user);
  };

  const register = async (displayName, email, password) => {
    const res = await axios.post('/auth/register', { displayName, email, password });
    setToken(res.data.token);
    setRefreshToken(res.data.refreshToken);
    setUser(res.data.user);
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
