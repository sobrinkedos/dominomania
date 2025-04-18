-- Migração para o projeto dominomania_prod
-- Criado em: 18/04/2025

-- Tabela de comunidades
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Políticas para communities
CREATE POLICY "communities_select_policy"
ON communities FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "communities_insert_policy"
ON communities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "communities_update_policy"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "communities_delete_policy"
ON communities FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Tabela de membros da comunidade
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(community_id, user_id)
);

-- Habilitar RLS para community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Políticas para community_members
CREATE POLICY "community_members_select_policy"
ON community_members FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "community_members_insert_policy"
ON community_members FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "community_members_update_policy"
ON community_members FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "community_members_delete_policy"
ON community_members FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

-- Tabela de competições
CREATE TABLE IF NOT EXISTS competitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    prize_pool DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para competitions
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Políticas para competitions
CREATE POLICY "competitions_select_policy"
ON competitions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competitions_insert_policy"
ON competitions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competitions_update_policy"
ON competitions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competitions_delete_policy"
ON competitions FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

-- Tabela de membros da competição
CREATE TABLE IF NOT EXISTS competition_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(competition_id, user_id)
);

-- Habilitar RLS para competition_members
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Políticas para competition_members
CREATE POLICY "competition_members_select_policy"
ON competition_members FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM competitions comp
        JOIN communities c ON comp.community_id = c.id
        WHERE comp.id = competition_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competition_members_insert_policy"
ON competition_members FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM competitions comp
        JOIN communities c ON comp.community_id = c.id
        WHERE comp.id = competition_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competition_members_update_policy"
ON competition_members FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM competitions comp
        JOIN communities c ON comp.community_id = c.id
        WHERE comp.id = competition_id
        AND c.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM competitions comp
        JOIN communities c ON comp.community_id = c.id
        WHERE comp.id = competition_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "competition_members_delete_policy"
ON competition_members FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM competitions comp
        JOIN communities c ON comp.community_id = c.id
        WHERE comp.id = competition_id
        AND c.created_by = auth.uid()
    )
);

-- Tabela de jogos
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
    team1 UUID[] DEFAULT '{}',
    team2 UUID[] DEFAULT '{}',
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished')),
    rounds JSONB[] DEFAULT '{}',
    last_round_was_tie BOOLEAN DEFAULT false,
    team1_was_losing_5_0 BOOLEAN DEFAULT false,
    team2_was_losing_5_0 BOOLEAN DEFAULT false,
    is_buchuda BOOLEAN DEFAULT false,
    is_buchuda_de_re BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Políticas para games
CREATE POLICY "games_select_policy"
ON games FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "games_insert_policy"
ON games FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "games_update_policy"
ON games FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "games_delete_policy"
ON games FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    nickname TEXT,
    phone_number TEXT,
    UNIQUE(user_id)
);

-- Habilitar RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "user_profiles_select_policy"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar índice parcial para phone_number
CREATE UNIQUE INDEX user_profiles_phone_number_unique_idx 
ON user_profiles (phone_number) 
WHERE phone_number IS NOT NULL AND phone_number != '';

-- Criar trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar timestamps
CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON communities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_members_updated_at
    BEFORE UPDATE ON community_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at
    BEFORE UPDATE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_members_updated_at
    BEFORE UPDATE ON competition_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
