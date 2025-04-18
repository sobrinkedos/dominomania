-- Script para criar as tabelas no ambiente de desenvolvimento
-- Execute este script no console SQL do Supabase para o projeto de desenvolvimento

-- Habilitar a extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Jogadores
CREATE TABLE IF NOT EXISTS public.dev_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  avatar_url TEXT
);

-- Tabela de Relações Usuário-Jogador
CREATE TABLE IF NOT EXISTS public.dev_user_player_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES public.dev_players(id) ON DELETE CASCADE,
  is_primary_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);

-- Tabela de Comunidades
CREATE TABLE IF NOT EXISTS public.dev_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Membros da Comunidade
CREATE TABLE IF NOT EXISTS public.dev_community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.dev_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Tabela de Organizadores da Comunidade
CREATE TABLE IF NOT EXISTS public.dev_community_organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.dev_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Tabela de Competições
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

-- Tabela de Membros da Competição
CREATE TABLE IF NOT EXISTS public.dev_competition_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES public.dev_competitions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.dev_players(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, player_id)
);

-- Tabela de Jogos
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

-- Tabela de Jogadores do Jogo
CREATE TABLE IF NOT EXISTS public.dev_game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.dev_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.dev_players(id) ON DELETE CASCADE,
  team INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- Tabela de Atividades
CREATE TABLE IF NOT EXISTS public.dev_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.dev_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
