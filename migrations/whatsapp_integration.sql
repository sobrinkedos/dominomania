-- Migração para adicionar suporte a integração com WhatsApp

-- Criar tabela para armazenar links de grupos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_group_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    invite_link TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por community_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_links_community_id ON whatsapp_group_links(community_id);

-- Adicionar permissões RLS (Row Level Security)
ALTER TABLE whatsapp_group_links ENABLE ROW LEVEL SECURITY;

-- Política para visualização de links (qualquer pessoa pode ver)
CREATE POLICY "Links de grupos do WhatsApp são visíveis para todos" 
    ON whatsapp_group_links FOR SELECT 
    USING (true);

-- Política para inserção de links (apenas organizadores da comunidade)
CREATE POLICY "Apenas organizadores podem adicionar links de grupos" 
    ON whatsapp_group_links FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM community_organizers 
            WHERE community_organizers.community_id = whatsapp_group_links.community_id 
            AND community_organizers.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = whatsapp_group_links.community_id 
            AND communities.created_by = auth.uid()
        )
    );

-- Política para atualização de links (apenas organizadores da comunidade)
CREATE POLICY "Apenas organizadores podem atualizar links de grupos" 
    ON whatsapp_group_links FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM community_organizers 
            WHERE community_organizers.community_id = whatsapp_group_links.community_id 
            AND community_organizers.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = whatsapp_group_links.community_id 
            AND communities.created_by = auth.uid()
        )
    );

-- Política para exclusão de links (apenas organizadores da comunidade)
CREATE POLICY "Apenas organizadores podem excluir links de grupos" 
    ON whatsapp_group_links FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM community_organizers 
            WHERE community_organizers.community_id = whatsapp_group_links.community_id 
            AND community_organizers.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM communities 
            WHERE communities.id = whatsapp_group_links.community_id 
            AND communities.created_by = auth.uid()
        )
    );