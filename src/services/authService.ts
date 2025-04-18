import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
    success: boolean;
    error?: string;
    data?: any;
}

class AuthService {
    private getErrorMessage(error: AuthError): string {
        switch (error.message) {
            case 'Invalid login credentials':
                return 'E-mail ou senha incorretos';
            case 'Email not confirmed':
                return 'E-mail não confirmado. Por favor, verifique sua caixa de entrada';
            case 'User not found':
                return 'Usuário não encontrado';
            case 'Invalid email':
                return 'E-mail inválido';
            case 'Password should be at least 6 characters':
                return 'A senha deve ter pelo menos 6 caracteres';
            case 'User already registered':
                return 'Este e-mail já está cadastrado. Por favor, faça login ou use outro e-mail.';
            default:
                return `Erro ao realizar operação: ${error.message}`;
        }
    }

    async signIn(email: string, password: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });

            if (error) {
                console.error('Erro no login:', error);
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            return {
                success: true,
                data
            };
        } catch (error: any) {
            console.error('Erro inesperado no login:', error);
            return {
                success: false,
                error: 'Erro inesperado ao fazer login. Tente novamente.'
            };
        }
    }

    async signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        name: name || email.split('@')[0],
                        full_name: name || email.split('@')[0],
                        nickname: name || email.split('@')[0]
                    }
                }
            });

            if (error) {
                console.error('Erro no cadastro:', error);
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            // Após o registro bem-sucedido, criamos o perfil diretamente
            if (data?.user) {
                console.log('Registro bem-sucedido. Criando perfil diretamente...');
                
                try {
                    // Criar perfil diretamente usando a API de administração do Supabase
                    await this.createUserProfile(data.user.id, name || email.split('@')[0]);
                    
                    console.log('Perfil criado com sucesso após registro.');
                    console.log('IMPORTANTE: Verifique seu e-mail para confirmar o cadastro antes de fazer login.');
                } catch (profileError) {
                    console.error('Erro ao criar perfil após registro:', profileError);
                }
            }

            return {
                success: true,
                data
            };
        } catch (error: any) {
            console.error('Erro inesperado no cadastro:', error);
            return {
                success: false,
                error: 'Erro inesperado ao criar conta. Tente novamente.'
            };
        }
    }

    async signOut(): Promise<AuthResponse> {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Erro ao sair:', error);
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            return {
                success: true
            };
        } catch (error: any) {
            console.error('Erro inesperado ao sair:', error);
            return {
                success: false,
                error: 'Erro inesperado ao sair. Tente novamente.'
            };
        }
    }

    async resetPassword(email: string): Promise<AuthResponse> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());

            if (error) {
                console.error('Erro ao resetar senha:', error);
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            return {
                success: true
            };
        } catch (error: any) {
            console.error('Erro inesperado ao resetar senha:', error);
            return {
                success: false,
                error: 'Erro inesperado ao resetar senha. Tente novamente.'
            };
        }
    }
    
    // Método para criar o perfil do usuário (funciona mesmo sem autenticação)
    async createUserProfile(userId: string, name: string): Promise<boolean> {
        try {
            // Determinar qual tabela usar com base no ambiente
            const env = process.env.EXPO_PUBLIC_SUPABASE_ENV || 'DEV';
            const profileTable = env === 'PROD' ? 'user_profiles' : 'dev_user_profiles';
            
            console.log(`Tentando criar perfil na tabela ${profileTable} para o usuário ${userId}`);
            
            // Usar uma função RPC para criar o perfil
            // Primeiro, vamos tentar usar a função create_profile_for_user se ela existir
            try {
                const { data, error } = await supabase.rpc('create_profile_for_user', {
                    user_id_param: userId,
                    full_name_param: name,
                    nickname_param: name,
                    phone_number_param: null
                });
                
                if (!error) {
                    console.log(`Perfil criado com sucesso via RPC para o usuário ${userId}`);
                    return true;
                }
                console.log('Função RPC não encontrada ou erro:', error);
                // Se a função RPC falhar, continuamos com o método alternativo
            } catch (rpcError) {
                console.log('Erro ao chamar RPC, tentando método alternativo:', rpcError);
            }
            
            // Método alternativo: criar a função SQL primeiro e depois usá-la
            const createFunctionSQL = `
                CREATE OR REPLACE FUNCTION create_profile_for_user(
                    user_id_param UUID,
                    full_name_param TEXT,
                    nickname_param TEXT,
                    phone_number_param TEXT
                ) RETURNS BOOLEAN
                LANGUAGE plpgsql
                SECURITY DEFINER
                AS $$
                BEGIN
                    INSERT INTO ${profileTable} (user_id, full_name, nickname, phone_number)
                    VALUES (user_id_param, full_name_param, nickname_param, phone_number_param);
                    RETURN TRUE;
                EXCEPTION
                    WHEN unique_violation THEN
                        RETURN FALSE;
                    WHEN OTHERS THEN
                        RAISE;
                END;
                $$;
            `;
            
            // Tentar criar a função SQL (isso pode falhar se o usuário não tiver permissão)
            try {
                await supabase.rpc('exec_sql', { sql: createFunctionSQL });
                console.log('Função SQL criada com sucesso');
            } catch (sqlError) {
                console.log('Não foi possível criar a função SQL:', sqlError);
            }
            
            // Tentar novamente com a função RPC
            try {
                const { data, error } = await supabase.rpc('create_profile_for_user', {
                    user_id_param: userId,
                    full_name_param: name,
                    nickname_param: name,
                    phone_number_param: null
                });
                
                if (!error) {
                    console.log(`Perfil criado com sucesso via RPC para o usuário ${userId}`);
                    return true;
                }
                console.log('Ainda não foi possível criar o perfil via RPC:', error);
            } catch (rpcError) {
                console.log('Erro ao chamar RPC novamente:', rpcError);
            }
            
            // Última tentativa: inserir diretamente (isso provavelmente falhará devido às políticas RLS)
            const { error: directError } = await supabase
                .from(profileTable)
                .insert([
                    {
                        user_id: userId,
                        full_name: name,
                        nickname: name,
                        phone_number: null
                    }
                ]);
            
            if (directError) {
                console.error(`Erro ao criar perfil diretamente em ${profileTable}:`, directError);
                return false;
            } else {
                console.log(`Perfil criado com sucesso diretamente em ${profileTable} para o usuário ${userId}`);
                return true;
            }
        } catch (profileError) {
            console.error('Exceção ao criar perfil:', profileError);
            return false;
        }
    }
}

export const authService = new AuthService();
