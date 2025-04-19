-- Atualiza unique constraint em community_members para usar player_id
-- Criado em: 18/04/2025

-- Remove constraint antiga e adiciona nova para produção
drop constraint if exists community_members_community_id_user_id_key on community_members;
alter table community_members
  add constraint community_members_community_id_player_id_key unique (community_id, player_id);

-- Remove constraint antiga e adiciona nova para desenvolvimento
drop constraint if exists dev_community_members_community_id_user_id_key on dev_community_members;
alter table dev_community_members
  add constraint dev_community_members_community_id_player_id_key unique (community_id, player_id);
