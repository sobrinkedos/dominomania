import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

interface AuthContextData {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[useAuth] Iniciando verificação de sessão...');
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let subscription: { unsubscribe: () => void } | null = null;

    // Adiciona um timeout de segurança para evitar que o app fique preso na tela de splash
    const startTimeout = () => {
      timeoutId = setTimeout(() => {
        if (isMounted && isLoading) {
          console.warn('[useAuth] Timeout de inicialização atingido - Forçando continuação');
          setSession(null);
          setIsLoading(false);
        }
      }, 5000); // 5 segundos para timeout
    };

    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Tentando obter sessão do Supabase...');
        
        // Verificar sessão atual - isso vai buscar a sessão do armazenamento persistente
        const { data: { session: persistedSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[useAuth] Erro ao verificar sessão:', error);
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        if (persistedSession) {
          console.log('[useAuth] Sessão obtida com sucesso:', {
            email: persistedSession.user.email,
            lastSignIn: persistedSession.user.last_sign_in_at,
            userId: persistedSession.user.id
          });
          
          // Verificar se o token está válido
          if (new Date(persistedSession.expires_at * 1000) < new Date()) {
            console.log('[useAuth] Token expirado, tentando renovar...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('[useAuth] Erro ao renovar sessão:', refreshError);
              if (isMounted) {
                setSession(null);
                setIsLoading(false);
              }
              return;
            }
            
            if (isMounted) {
              setSession(refreshData.session);
              setIsLoading(false);
            }
          } else {
            if (isMounted) {
              setSession(persistedSession);
              setIsLoading(false);
            }
          }
        } else {
          console.log('[useAuth] Nenhuma sessão ativa encontrada');
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('[useAuth] Erro crítico durante inicialização:', error);
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    // Iniciar o processo de autenticação
    startTimeout();
    initializeAuth();

    // Configurar listener para mudanças de autenticação
    console.log('[useAuth] Configurando listener de mudanças de autenticação...');
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[useAuth] Mudança de estado de autenticação:', event, newSession?.user.id);
      
      if (isMounted) {
        setSession(newSession);
        
        // Se o usuário fez login ou logout, atualizar o estado de carregamento
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setIsLoading(false);
        }
      }
    });
    
    subscription = authSubscription;

    return () => {
      console.log('[useAuth] Limpando recursos...');
      clearTimeout(timeoutId);
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
