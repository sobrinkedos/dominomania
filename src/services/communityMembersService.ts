import { supabase } from '@/lib/supabase';
import { TableNames } from '@/utils/tableNames';
import type { Player } from '@/services/playerService';

export interface CommunityMember {
    id: string;
    community_id: string;
    player_id: string;
    players: {
        id: string;
        name: string;
    };
}

export const communityMembersService = {
    async listMembers(communityId: string) {
        try {
            const { data, error } = await supabase
                .from(TableNames.COMMUNITY_MEMBERS)
                // Alias para retornar relação como 'players'
                .select(`
                    id,
                    community_id,
                    player_id,
                    players: ${TableNames.PLAYERS} (
                        id,
                        name
                    )
                `)
                .eq('community_id', communityId);

            if (error) throw error;

            // Filtra membros sem dados do jogador
            const validMembers = data?.filter(member => member.players) || [];
            
            if (data?.length !== validMembers.length) {
                console.warn(`Encontrados ${data?.length - validMembers.length} membros sem dados de jogador`);
            }

            return validMembers;
        } catch (error) {
            console.error('Erro ao listar membros:', error);
            throw error;
        }
    },

    async addMember(communityId: string, playerId: string) {
        try {
            // Verifica se o membro já existe
            const { data: existingMember } = await supabase
                .from(TableNames.COMMUNITY_MEMBERS)
                .select('id')
                .eq('community_id', communityId)
                .eq('player_id', playerId)
                .single();

            if (existingMember) {
                throw new Error('Jogador já é membro desta comunidade');
            }
            
            // Obter o usuário atual
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }
            
            // Obter data atual para os campos created_at e updated_at
            const now = new Date().toISOString();
            
            // Usar SQL direto para inserir com UUID gerado pelo PostgreSQL
            const { data: insertResult, error: insertError } = await supabase.rpc('add_community_member_direct', {
                p_community_id: communityId,
                p_player_id: playerId
            });
            
            if (insertError) {
                console.error('Erro ao inserir membro via RPC:', insertError);
                throw insertError;
            }
            
            // Buscar o membro recém-adicionado
            const { data, error } = await supabase
                .from(TableNames.COMMUNITY_MEMBERS)
                .select(`
                    *,
                    ${TableNames.PLAYERS} (
                        id,
                        name
                    )
                `)
                .eq('community_id', communityId)
                .eq('player_id', playerId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao adicionar membro:', error);
            throw error;
        }
    },

    async addMembers(communityId: string, playerIds: string[]) {
        try {
            const results: CommunityMember[] = [];
            for (const playerId of playerIds) {
                try {
                    const member = await this.addMember(communityId, playerId);
                    results.push(member);
                } catch (error) {
                    console.error(`Erro ao adicionar jogador ${playerId}:`, error);
                }
            }
            return results;
        } catch (error) {
            console.error('Erro ao adicionar múltiplos membros:', error);
            throw error;
        }
    },

    async removeMember(communityId: string, playerId: string) {
        try {
            const { error } = await supabase
                .from(TableNames.COMMUNITY_MEMBERS)
                .delete()
                .eq('community_id', communityId)
                .eq('player_id', playerId);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao remover membro:', error);
            throw error;
        }
    },

    async isMember(communityId: string, playerId: string) {
        try {
            const { data, error } = await supabase
                .from(TableNames.COMMUNITY_MEMBERS)
                .select('id')
                .eq('community_id', communityId)
                .eq('player_id', playerId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return !!data;
        } catch (error) {
            console.error('Erro ao verificar membro:', error);
            throw error;
        }
    },

    async listAvailableMembers(communityId: string): Promise<Player[]> {
        try {
            const userRes = await supabase.auth.getUser();
            const userId = userRes.data.user?.id;
            if (!userId) throw new Error('Usuário não autenticado');
            // IDs de membros já adicionados
            const { data: members, error: membersError } = await supabase
                .from(TableNames.COMMUNITY_MEMBERS)
                .select('player_id')
                .eq('community_id', communityId);
            if (membersError) throw membersError;
            const memberIds = members.map(m => m.player_id);
            // Jogadores criados pelo usuário
            let query = supabase
                .from(TableNames.PLAYERS)
                .select('*')
                .eq('created_by', userId);
            if (memberIds.length > 0) {
                // Ajuste para adicionar parênteses ao filtro not.in
                const ids = memberIds.join(',');
                query = query.not('id', 'in', `(${ids})`);
            }
            const { data: availablePlayers, error: availError } = await query;
            if (availError) throw availError;
            return availablePlayers || [];
        } catch (error) {
            console.error('Erro ao listar jogadores disponíveis:', error);
            throw error;
        }
    },
};
