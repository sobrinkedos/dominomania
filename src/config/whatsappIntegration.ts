/**
 * Configuração para integração com WhatsApp via N8N e Evolution API
 */

export const WHATSAPP_INTEGRATION = {
  // Configurações do N8N
  N8N: {
    // URL base do servidor N8N (em produção, substituir pelo endereço real)
    BASE_URL: process.env.N8N_BASE_URL || 'http://localhost:5678',
    // Chave de API para autenticação no N8N
    API_KEY: process.env.N8N_API_KEY || '',
    // IDs dos workflows no N8N
    WORKFLOWS: {
      CREATE_GROUP: process.env.N8N_WORKFLOW_CREATE_GROUP || 'create-whatsapp-group',
      ADD_MEMBERS: process.env.N8N_WORKFLOW_ADD_MEMBERS || 'add-members-to-group',
      SEND_COMPETITION_CREATED: process.env.N8N_WORKFLOW_COMPETITION_CREATED || 'send-competition-created',
      SEND_GAME_STARTED: process.env.N8N_WORKFLOW_GAME_STARTED || 'send-game-started',
      SEND_GAME_FINISHED: process.env.N8N_WORKFLOW_GAME_FINISHED || 'send-game-finished',
      SEND_COMPETITION_FINISHED: process.env.N8N_WORKFLOW_COMPETITION_FINISHED || 'send-competition-finished'
    }
  },
  
  // Configurações da Evolution API
  EVOLUTION_API: {
    // URL base da Evolution API (em produção, substituir pelo endereço real)
    BASE_URL: process.env.EVOLUTION_API_BASE_URL || 'http://localhost:8080',
    // Chave de API para autenticação na Evolution API
    API_KEY: process.env.EVOLUTION_API_KEY || '',
    // Instância do WhatsApp a ser utilizada
    INSTANCE: process.env.EVOLUTION_API_INSTANCE || 'dominomania'
  }
};