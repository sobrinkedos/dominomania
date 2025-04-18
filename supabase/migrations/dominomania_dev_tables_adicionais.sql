-- Migração adicional para o projeto dominomania_dev
-- Criado em: 18/04/2025

-- Tabela de organizadores de comunidade
CREATE TABLE IF NOT EXISTS dev_community_organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES dev_communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'organizer' CHECK (role IN ('organizer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(community_id, user_id)
);

-- Habilitar RLS para dev_community_organizers
ALTER TABLE dev_community_organizers ENABLE ROW LEVEL SECURITY;

-- Políticas para dev_community_organizers
CREATE POLICY "dev_community_organizers_select_policy"
ON dev_community_organizers FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM dev_communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "dev_community_organizers_insert_policy"
ON dev_community_organizers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM dev_communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "dev_community_organizers_update_policy"
ON dev_community_organizers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM dev_communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM dev_communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

CREATE POLICY "dev_community_organizers_delete_policy"
ON dev_community_organizers FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM dev_communities c
        WHERE c.id = community_id
        AND c.created_by = auth.uid()
    )
);

-- Tabela de atividades
CREATE TABLE IF NOT EXISTS dev_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('game', 'competition', 'community', 'player')),
    description TEXT NOT NULL,
    metadata JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para dev_activities
ALTER TABLE dev_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para dev_activities
CREATE POLICY "dev_activities_select_policy"
ON dev_activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "dev_activities_insert_policy"
ON dev_activities FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Aplicar trigger para atualizar timestamps nas novas tabelas
CREATE TRIGGER set_dev_community_organizers_updated_at
BEFORE UPDATE ON dev_community_organizers
FOR EACH ROW
EXECUTE FUNCTION update_dev_updated_at_column();

-- Inserir um registro inicial na tabela dev_communities (apenas para teste)
INSERT INTO dev_communities (name, description, created_by)
SELECT 'Comunidade Inicial', 'Esta é uma comunidade de teste criada automaticamente', auth.uid()
FROM auth.users
LIMIT 1
ON CONFLICT DO NOTHING;

-- Inserir um organizador para a comunidade inicial
INSERT INTO dev_community_organizers (community_id, user_id)
SELECT c.id, c.created_by
FROM dev_communities c
LIMIT 1
ON CONFLICT DO NOTHING;
