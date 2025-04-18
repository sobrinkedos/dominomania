/**
 * Script para configurar dados iniciais no Supabase
 * Uso: node scripts/setup-initial-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obter variáveis de ambiente
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const env = process.env.EXPO_PUBLIC_SUPABASE_ENV || 'DEV';
const prefix = env === 'PROD' ? '' : 'dev_';

// Verificar se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas no arquivo .env');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para fazer login
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Erro ao fazer login:', error.message);
    process.exit(1);
  }

  console.log('Login bem-sucedido:', data.user.email);
  return data.user;
}

// Função para criar comunidade inicial
async function createInitialCommunity(userId) {
  const communitiesTable = `${prefix}communities`;
  const organizersTable = `${prefix}community_organizers`;
  
  console.log(`Criando comunidade inicial na tabela ${communitiesTable}...`);
  
  // Criar comunidade
  const { data: community, error: communityError } = await supabase
    .from(communitiesTable)
    .insert([
      {
        name: 'Comunidade Inicial',
        description: 'Esta é uma comunidade de teste criada automaticamente',
        created_by: userId
      }
    ])
    .select()
    .single();

  if (communityError) {
    console.error('Erro ao criar comunidade:', communityError);
    return null;
  }

  console.log('Comunidade criada com sucesso:', community);

  // Adicionar usuário como organizador
  const { data: organizer, error: organizerError } = await supabase
    .from(organizersTable)
    .insert([
      {
        community_id: community.id,
        user_id: userId,
        role: 'admin'
      }
    ])
    .select()
    .single();

  if (organizerError) {
    console.error('Erro ao adicionar organizador:', organizerError);
  } else {
    console.log('Organizador adicionado com sucesso:', organizer);
  }

  return community;
}

// Função principal
async function main() {
  try {
    // Solicitar credenciais
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Perguntar email
    const email = await new Promise(resolve => {
      readline.question('Digite seu email: ', resolve);
    });

    // Perguntar senha
    const password = await new Promise(resolve => {
      readline.question('Digite sua senha: ', resolve);
    });

    // Fazer login
    const user = await login(email, password);
    
    // Criar comunidade inicial
    await createInitialCommunity(user.id);
    
    console.log('Configuração inicial concluída com sucesso!');
    readline.close();
  } catch (error) {
    console.error('Erro durante a configuração:', error);
    process.exit(1);
  }
}

// Executar função principal
main();
