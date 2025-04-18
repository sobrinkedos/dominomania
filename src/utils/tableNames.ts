/**
 * Utilitário para gerenciar nomes de tabelas com base no ambiente
 */

// Determinar qual prefixo usar com base no ambiente
const env = process.env.EXPO_PUBLIC_SUPABASE_ENV || 'DEV';
const prefix = env === 'PROD' ? '' : 'dev_';

// Lista de todas as tabelas do sistema
export const TableNames = {
  // Tabelas de usuários
  USER_PROFILES: `${prefix}user_profiles`,
  
  // Tabelas de jogadores
  PLAYERS: `${prefix}players`,
  USER_PLAYER_RELATIONS: `${prefix}user_player_relations`,
  
  // Tabelas de comunidades
  COMMUNITIES: `${prefix}communities`,
  COMMUNITY_MEMBERS: `${prefix}community_members`,
  COMMUNITY_ORGANIZERS: `${prefix}community_organizers`,
  
  // Tabelas de competições
  COMPETITIONS: `${prefix}competitions`,
  COMPETITION_MEMBERS: `${prefix}competition_members`,
  
  // Tabelas de jogos
  GAMES: `${prefix}games`,
  GAME_PLAYERS: `${prefix}game_players`,
  
  // Tabelas de atividades
  ACTIVITIES: `${prefix}activities`,
};

// Função auxiliar para obter o nome da tabela
export function getTableName(tableName: keyof typeof TableNames): string {
  return TableNames[tableName];
}

// Log para debug
console.log(`Ambiente: ${env}, Prefixo: '${prefix}'`);
console.log('Tabelas configuradas:', TableNames);
