import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Database } from '@/types';

// Valores de fallback para quando as variáveis de ambiente não estiverem disponíveis no APK
const FALLBACK_SUPABASE_URL = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

console.log('Inicializando cliente Supabase...');
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Erro: Variáveis de ambiente do Supabase não encontradas, usando valores de fallback');
    console.log('URL:', supabaseUrl);
    console.log('ANON_KEY:', supabaseAnonKey ? '[PRESENTE]' : '[AUSENTE]');
}
console.log('Variáveis de ambiente do Supabase verificadas com sucesso');

// Adapter para web
const webAdapter = {
    getItem: (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return Promise.resolve(item);
        } catch {
            return Promise.resolve(null);
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
};

// Adapter para mobile
const mobileAdapter = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
};

// Escolher o adapter apropriado baseado na plataforma
const storageAdapter = Platform.OS === 'web' ? webAdapter : mobileAdapter;

// Verificar qual ambiente está sendo usado
const env = process.env.EXPO_PUBLIC_SUPABASE_ENV || 'DEV';
console.log('Ambiente Supabase:', env);
console.log('URL Supabase:', supabaseUrl);

// Verificar se estamos usando o prefixo correto para as tabelas
const prefix = env === 'PROD' ? '' : 'dev_';
console.log('Prefixo de tabelas:', prefix);
console.log('Exemplo de nome de tabela:', `${prefix}communities`);

console.log('Criando cliente Supabase...');
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web', // Apenas para web
        flowType: 'pkce',
        debug: true, // Habilita logs detalhados de autenticação
        onAuthStateChange: (event, session) => {
            console.log(`[Supabase Auth] Evento: ${event}`, session ? `Usuário: ${session.user.email}` : 'Sem sessão');
            
            if (event === 'TOKEN_REFRESHED') {
                console.log('[Supabase Auth] Token atualizado com sucesso');
                // Garantir que a sessão seja salva no armazenamento persistente
                if (session) {
                    const expiresAt = new Date(session.expires_at * 1000);
                    console.log(`[Supabase Auth] Nova sessão válida até: ${expiresAt.toLocaleString()}`);
                }
            } else if (event === 'SIGNED_IN') {
                console.log('[Supabase Auth] Usuário conectado com sucesso');
                if (session) {
                    console.log(`[Supabase Auth] Detalhes do usuário: ${session.user.email}`);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('[Supabase Auth] Usuário desconectado');
                // Limpar tokens armazenados
                storageAdapter.removeItem('supabase.auth.token');
                storageAdapter.removeItem('supabase.auth.refreshToken');
                storageAdapter.removeItem('supabase.auth.expires_at');
            } else if (event === 'USER_UPDATED') {
                console.log('[Supabase Auth] Dados do usuário atualizados');
            } else if (event === 'INITIAL_SESSION') {
                console.log('[Supabase Auth] Sessão inicial carregada');
                if (session) {
                    const expiresAt = new Date(session.expires_at * 1000);
                    console.log(`[Supabase Auth] Sessão válida até: ${expiresAt.toLocaleString()}`);
                }
            }
        }
    },
});
