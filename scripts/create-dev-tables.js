// Script para criar as tabelas no ambiente de desenvolvimento
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obter as variáveis de ambiente
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_DEV;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas');
  console.log('URL:', supabaseUrl);
  console.log('ANON_KEY:', supabaseAnonKey ? '[PRESENTE]' : '[AUSENTE]');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para executar uma consulta SQL
async function executeSql(query) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    return false;
  }
}

// Função para criar as tabelas no ambiente de desenvolvimento
async function createDevTables() {
  console.log('Criando tabelas no ambiente de desenvolvimento...');
  
  // Criar extensão uuid-ossp
  const createExtension = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `;
  
  // Tabela de Jogadores
  const createPlayersTable = `
    CREATE TABLE IF NOT EXISTS public.dev_players (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      phone TEXT,
      nickname TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID,
      avatar_url TEXT
    );
  `;
  
  // Tabela de Relações Usuário-Jogador
  const createUserPlayerRelationsTable = `
    CREATE TABLE IF NOT EXISTS public.dev_user_player_relations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      player_id UUID NOT NULL REFERENCES public.dev_players(id) ON DELETE CASCADE,
      is_primary_user BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, player_id)
    );
  `;
  
  // Tabela de Comunidades
  const createCommunitiesTable = `
    CREATE TABLE IF NOT EXISTS public.dev_communities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      owner_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  // Tabela de Membros da Comunidade
  const createCommunityMembersTable = `
    CREATE TABLE IF NOT EXISTS public.dev_community_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      community_id UUID NOT NULL REFERENCES public.dev_communities(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(community_id, user_id)
    );
  `;
  
  // Tabela de Organizadores da Comunidade
  const createCommunityOrganizersTable = `
    CREATE TABLE IF NOT EXISTS public.dev_community_organizers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      community_id UUID NOT NULL REFERENCES public.dev_communities(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(community_id, user_id)
    );
  `;
  
  // Tabela de Competições
  const createCompetitionsTable = `
    CREATE TABLE IF NOT EXISTS public.dev_competitions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      community_id UUID NOT NULL REFERENCES public.dev_communities(id) ON DELETE CASCADE,
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      prize_pool NUMERIC,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  // Tabela de Membros da Competição
  const createCompetitionMembersTable = `
    CREATE TABLE IF NOT EXISTS public.dev_competition_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      competition_id UUID NOT NULL REFERENCES public.dev_competitions(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES public.dev_players(id) ON DELETE CASCADE,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(competition_id, player_id)
    );
  `;
  
  // Tabela de Jogos
  const createGamesTable = `
    CREATE TABLE IF NOT EXISTS public.dev_games (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      competition_id UUID NOT NULL REFERENCES public.dev_competitions(id) ON DELETE CASCADE,
      team1 UUID[] NOT NULL,
      team2 UUID[] NOT NULL,
      team1_score INTEGER DEFAULT 0,
      team2_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      rounds JSONB DEFAULT '[]',
      last_round_was_tie BOOLEAN DEFAULT FALSE,
      team1_was_losing_5_0 BOOLEAN DEFAULT FALSE,
      team2_was_losing_5_0 BOOLEAN DEFAULT FALSE,
      is_buchuda BOOLEAN DEFAULT FALSE,
      is_buchuda_de_re BOOLEAN DEFAULT FALSE
    );
  `;
  
  // Tabela de Jogadores do Jogo
  const createGamePlayersTable = `
    CREATE TABLE IF NOT EXISTS public.dev_game_players (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      game_id UUID NOT NULL REFERENCES public.dev_games(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES public.dev_players(id) ON DELETE CASCADE,
      team INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(game_id, player_id)
    );
  `;
  
  // Tabela de Atividades
  const createActivitiesTable = `
    CREATE TABLE IF NOT EXISTS public.dev_activities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      user_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      metadata JSONB
    );
  `;
  
  // Tabela de Perfis de Usuário
  const createUserProfilesTable = `
    CREATE TABLE IF NOT EXISTS public.dev_user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  // Lista de consultas SQL a serem executadas
  const queries = [
    { name: 'Extensão uuid-ossp', query: createExtension },
    { name: 'Tabela dev_players', query: createPlayersTable },
    { name: 'Tabela dev_user_player_relations', query: createUserPlayerRelationsTable },
    { name: 'Tabela dev_communities', query: createCommunitiesTable },
    { name: 'Tabela dev_community_members', query: createCommunityMembersTable },
    { name: 'Tabela dev_community_organizers', query: createCommunityOrganizersTable },
    { name: 'Tabela dev_competitions', query: createCompetitionsTable },
    { name: 'Tabela dev_competition_members', query: createCompetitionMembersTable },
    { name: 'Tabela dev_games', query: createGamesTable },
    { name: 'Tabela dev_game_players', query: createGamePlayersTable },
    { name: 'Tabela dev_activities', query: createActivitiesTable },
    { name: 'Tabela dev_user_profiles', query: createUserProfilesTable }
  ];
  
  // Executar cada consulta SQL
  for (const { name, query } of queries) {
    console.log(`Criando ${name}...`);
    const success = await executeSql(query);
    
    if (success) {
      console.log(`${name} criada com sucesso`);
    } else {
      console.error(`Erro ao criar ${name}`);
    }
  }
  
  console.log('Tabelas criadas com sucesso');
}

// Executar a função principal
createDevTables()
  .then(() => {
    console.log('Script concluído com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });
