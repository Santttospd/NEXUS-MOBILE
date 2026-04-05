import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync('nexus_token');
      const storedUser = await SecureStore.getItemAsync('nexus_user');
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Atualiza nomeCondominio em segundo plano sem bloquear a renderização
        refreshCondominioName(parsed);
      }
    } catch {
      // ignora erro de leitura
    } finally {
      setLoading(false);
    }
  }

  async function refreshCondominioName(currentUser) {
    try {
      const res = await api.get('/api/configuracoes');
      const nomeCondominio = res.data?.nome;
      if (nomeCondominio && nomeCondominio !== currentUser?.nomeCondominio) {
        const updated = { ...currentUser, nomeCondominio };
        await SecureStore.setItemAsync('nexus_user', JSON.stringify(updated));
        setUser(updated);
      }
    } catch {
      // silencia — usa o valor armazenado
    }
  }

  async function signIn(email, password) {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, refreshToken, user: userData } = response.data;

    await SecureStore.setItemAsync('nexus_token', token);
    await SecureStore.setItemAsync('nexus_user', JSON.stringify(userData));
    if (refreshToken) {
      await SecureStore.setItemAsync('nexus_refresh_token', refreshToken);
    }

    setUser(userData);
    return userData;
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('nexus_token');
    await SecureStore.deleteItemAsync('nexus_user');
    await SecureStore.deleteItemAsync('nexus_refresh_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
