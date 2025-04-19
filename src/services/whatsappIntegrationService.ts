import { supabase } from '@/lib/supabase';
import { WHATSAPP_INTEGRATION } from '@/config/whatsappIntegration';
import { whatsappService, WhatsappGroupLink } from './whatsappService';
import { Community } from './communityService';
import { Competition, CompetitionResult } from './competitionService';
import { Game } from './gameService';
import { TableNames } from '@/utils/tableNames';

/**
 * Serviço responsável pela integração com WhatsApp via N8N e Evolution API
 */
class WhatsappIntegrationService {
  /**
   * Cria um grupo no WhatsApp quando uma nova comunidade é criada
   * @param community Dados da comunidade criada
   * @param creatorPhone Número de telefone do criador da comunidade
   */
  async createGroupForCommunity(community: Community, creatorPhone: string): Promise<WhatsappGroupLink | null> {
    try {
      console.log(`Criando grupo do WhatsApp para comunidade: ${community.name}`);
      
      // Chamar o workflow do N8N para criar o grupo
      const response = await fetch(`${WHATSAPP_INTEGRATION.N8N.BASE_URL}/webhook/${WHATSAPP_INTEGRATION.N8N.WORKFLOWS.CREATE_GROUP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': WHATSAPP_INTEGRATION.N8N.API_KEY
        },
        body: JSON.stringify({
          communityId: community.id,
          communityName: community.name,
          creatorPhone: creatorPhone,
          instance: WHATSAPP_INTEGRATION.EVOLUTION_API.INSTANCE
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar grupo: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Salvar o link do grupo no banco de dados
      if (result.success && result.groupData) {
        const groupLink = await whatsappService.createGroupLink({
          community_id: community.id,
          group_name: result.groupData.name || `${community.name} - DominoMania`,
          invite_link: result.groupData.inviteLink
        });
        
        return groupLink;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao criar grupo do WhatsApp:', error);
      return null;
    }
  }

  /**
   * Adiciona membros a um grupo do WhatsApp quando são adicionados à comunidade
   * @param communityId ID da comunidade
   * @param phones Array com os números de telefone dos membros a serem adicionados
   */
  async addMembersToGroup(communityId: string, phones: string[]): Promise<boolean> {
    try {
      // Buscar o link do grupo do WhatsApp associado à comunidade
      const groupLinks = await whatsappService.getGroupLinksByCommunity(communityId);
      
      if (!groupLinks || groupLinks.length === 0 || !groupLinks[0].invite_link) {
        console.error('Nenhum grupo do WhatsApp encontrado para esta comunidade');
        return false;
      }
      
      const groupLink = groupLinks[0];
      
      // Chamar o workflow do N8N para adicionar membros ao grupo
      const response = await fetch(`${WHATSAPP_INTEGRATION.N8N.BASE_URL}/webhook/${WHATSAPP_INTEGRATION.N8N.WORKFLOWS.ADD_MEMBERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': WHATSAPP_INTEGRATION.N8N.API_KEY
        },
        body: JSON.stringify({
          groupId: groupLink.invite_link.split('/').pop(),
          phones: phones,
          instance: WHATSAPP_INTEGRATION.EVOLUTION_API.INSTANCE
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao adicionar membros: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Erro ao adicionar membros ao grupo do WhatsApp:', error);
      return false;
    }
  }

  /**
   * Envia mensagem quando uma nova competição é criada
   * @param competition Dados da competição criada
   * @param communityName Nome da comunidade
   */
  async sendCompetitionCreatedMessage(competition: Competition, communityName: string): Promise<boolean> {
    try {
      // Buscar o link do grupo do WhatsApp associado à comunidade
      const groupLinks = await whatsappService.getGroupLinksByCommunity(competition.community_id);
      
      if (!groupLinks || groupLinks.length === 0) {
        console.error('Nenhum grupo do WhatsApp encontrado para esta comunidade');
        return false;
      }
      
      // Formatar a data de início
      const startDate = new Date(competition.start_date);
      const formattedDate = startDate.toLocaleDateString('pt-BR');
      
      // Chamar o workflow do N8N para enviar a mensagem
      const response = await fetch(`${WHATSAPP_INTEGRATION.N8N.BASE_URL}/webhook/${WHATSAPP_INTEGRATION.N8N.WORKFLOWS.SEND_COMPETITION_CREATED}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': WHATSAPP_INTEGRATION.N8N.API_KEY
        },
        body: JSON.stringify({
          groupId: groupLinks[0].invite_link.split('/').pop(),
          competitionName: competition.name,
          competitionDescription: competition.description,
          startDate: formattedDate,
          communityName: communityName,
          instance: WHATSAPP_INTEGRATION.EVOLUTION_API.INSTANCE
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Erro ao enviar mensagem de competição criada:', error);
      return false;
    }
  }

  /**
   * Envia mensagem quando um jogo é iniciado
   * @param game Dados do jogo iniciado
   * @param competitionName Nome da competição
   * @param team1Names Nomes dos jogadores do time 1
   * @param team2Names Nomes dos jogadores do time 2
   */
  async sendGameStartedMessage(game: Game, competitionName: string, team1Names: string[], team2Names: string[]): Promise<boolean> {
    try {
      // Buscar a competição para obter o ID da comunidade
      const { data: competition } = await supabase
        .from(TableNames.COMPETITIONS)
        .select('community_id')
        .eq('id', game.competition_id)
        .single();
      
      if (!competition) {
        console.error('Competição não encontrada');
        return false;
      }
      
      // Buscar o link do grupo do WhatsApp associado à comunidade
      const groupLinks = await whatsappService.getGroupLinksByCommunity(competition.community_id);
      
      if (!groupLinks || groupLinks.length === 0) {
        console.error('Nenhum grupo do WhatsApp encontrado para esta comunidade');
        return false;
      }
      
      // Chamar o workflow do N8N para enviar a mensagem
      const response = await fetch(`${WHATSAPP_INTEGRATION.N8N.BASE_URL}/webhook/${WHATSAPP_INTEGRATION.N8N.WORKFLOWS.SEND_GAME_STARTED}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': WHATSAPP_INTEGRATION.N8N.API_KEY
        },
        body: JSON.stringify({
          groupId: groupLinks[0].invite_link.split('/').pop(),
          gameId: game.id,
          competitionName: competitionName,
          team1: team1Names.join(' e '),
          team2: team2Names.join(' e '),
          instance: WHATSAPP_INTEGRATION.EVOLUTION_API.INSTANCE
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Erro ao enviar mensagem de jogo iniciado:', error);
      return false;
    }
  }

  /**
   * Envia mensagem quando um jogo é finalizado
   * @param game Dados do jogo finalizado
   * @param competitionName Nome da competição
   * @param team1Names Nomes dos jogadores do time 1
   * @param team2Names Nomes dos jogadores do time 2
   */
  async sendGameFinishedMessage(game: Game, competitionName: string, team1Names: string[], team2Names: string[]): Promise<boolean> {
    try {
      // Buscar a competição para obter o ID da comunidade
      const { data: competition } = await supabase
        .from(TableNames.COMPETITIONS)
        .select('community_id')
        .eq('id', game.competition_id)
        .single();
      
      if (!competition) {
        console.error('Competição não encontrada');
        return false;
      }
      
      // Buscar o link do grupo do WhatsApp associado à comunidade
      const groupLinks = await whatsappService.getGroupLinksByCommunity(competition.community_id);
      
      if (!groupLinks || groupLinks.length === 0) {
        console.error('Nenhum grupo do WhatsApp encontrado para esta comunidade');
        return false;
      }
      
      // Determinar o time vencedor
      const winnerTeam = game.team1_score > game.team2_score ? 1 : 2;
      const winnerNames = winnerTeam === 1 ? team1Names : team2Names;
      const loserNames = winnerTeam === 1 ? team2Names : team1Names;
      const winnerScore = winnerTeam === 1 ? game.team1_score : game.team2_score;
      const loserScore = winnerTeam === 1 ? game.team2_score : game.team1_score;
      
      // Verificar se foi buchuda ou buchuda de ré
      let specialVictory = '';
      if (game.is_buchuda_de_re) {
        specialVictory = '🔥 BUCHUDA DE RÉ! 🔥';
      } else if (game.is_buchuda) {
        specialVictory = '🔥 BUCHUDA! 🔥';
      }
      
      // Chamar o workflow do N8N para enviar a mensagem
      const response = await fetch(`${WHATSAPP_INTEGRATION.N8N.BASE_URL}/webhook/${WHATSAPP_INTEGRATION.N8N.WORKFLOWS.SEND_GAME_FINISHED}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': WHATSAPP_INTEGRATION.N8N.API_KEY
        },
        body: JSON.stringify({
          groupId: groupLinks[0].invite_link.split('/').pop(),
          gameId: game.id,
          competitionName: competitionName,
          winnerTeam: winnerNames.join(' e '),
          loserTeam: loserNames.join(' e '),
          score: `${winnerScore} x ${loserScore}`,
          specialVictory: specialVictory,
          instance: WHATSAPP_INTEGRATION.EVOLUTION_API.INSTANCE
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Erro ao enviar mensagem de jogo finalizado:', error);
      return false;
    }
  }

  /**
   * Envia mensagem quando uma competição é finalizada
   * @param competition Dados da competição finalizada
   * @param results Resultados da competição
   * @param communityName Nome da comunidade
   */
  async sendCompetitionFinishedMessage(competition: Competition, results: CompetitionResult, communityName: string): Promise<boolean> {
    try {
      // Buscar o link do grupo do WhatsApp associado à comunidade
      const groupLinks = await whatsappService.getGroupLinksByCommunity(competition.community_id);
      
      if (!groupLinks || groupLinks.length === 0) {
        console.error('Nenhum grupo do WhatsApp encontrado para esta comunidade');
        return false;
      }
      
      // Preparar os dados do ranking de jogadores (top 5)
      const topPlayers = results.players
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((player, index) => `${index + 1}. ${player.name}: ${player.wins} vitórias, ${player.score} pontos`);
      
      // Preparar os dados do ranking de duplas (top 3)
      const topPairs = results.pairs
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((pair, index) => `${index + 1}. ${pair.players.join(' e ')}: ${pair.wins} vitórias, ${pair.score} pontos`);
      
      // Chamar o workflow do N8N para enviar a mensagem
      const response = await fetch(`${WHATSAPP_INTEGRATION.N8N.BASE_URL}/webhook/${WHATSAPP_INTEGRATION.N8N.WORKFLOWS.SEND_COMPETITION_FINISHED}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': WHATSAPP_INTEGRATION.N8N.API_KEY
        },
        body: JSON.stringify({
          groupId: groupLinks[0].invite_link.split('/').pop(),
          competitionName: competition.name,
          communityName: communityName,
          championPlayer: results.players[0]?.name || 'Não definido',
          championPair: results.pairs[0]?.players.join(' e ') || 'Não definido',
          topPlayers: topPlayers,
          topPairs: topPairs,
          instance: WHATSAPP_INTEGRATION.EVOLUTION_API.INSTANCE
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Erro ao enviar mensagem de competição finalizada:', error);
      return false;
    }
  }
}

export const whatsappIntegrationService = new WhatsappIntegrationService();