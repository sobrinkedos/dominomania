# Integração com WhatsApp usando N8N e Evolution API

Este documento descreve como configurar e utilizar a integração com WhatsApp no DominoMania, que permite enviar mensagens automáticas e gerenciar grupos para comunidades e competições.

## Visão Geral

A integração com WhatsApp utiliza duas ferramentas principais:

1. **Evolution API**: API de código aberto para interagir com o WhatsApp Web
2. **N8N**: Plataforma de automação para criar fluxos de trabalho (workflows)

Esta integração permite:
- Criar grupos de WhatsApp automaticamente para novas comunidades
- Adicionar membros aos grupos quando eles entram na comunidade
- Enviar notificações automáticas sobre eventos como:
  - Criação de competições
  - Início de jogos
  - Finalização de jogos
  - Resultados de competições

## Pré-requisitos

- Docker e Docker Compose instalados
- Número de telefone válido para o WhatsApp (será usado como administrador)
- Servidor com acesso à internet e portas liberadas

## 1. Configuração do Ambiente

### 1.1 Criando o arquivo docker-compose.yml

Crie um arquivo `docker-compose.yml` com o seguinte conteúdo:

```yaml
version: '3.8'

services:
  # Evolution API - Serviço para interação com WhatsApp
  evolution-api:
    image: evolutionapi/evolution:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_API_KEY=C9D9A5450D60-4231-ADE6-23ED2C5C4E7E
      - AUTHENTICATION_TYPE=apikey
    volumes:
      - ./evolution-api-data:/evolution/instances

  # N8N - Plataforma de automação para workflows
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=Brubiga@68
      - N8N_ENCRYPTION_KEY=chave_de_encriptacao_segura
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - ./n8n-data:/home/node/.n8n
```

### 1.2 Iniciando os serviços

Execute o seguinte comando no diretório onde está o arquivo docker-compose.yml:

```bash
docker-compose up -d
```

## 2. Configuração da Evolution API

### 2.1 Criando uma instância do WhatsApp

1. Acesse a Evolution API em `http://seu-servidor:8080`
2. Crie uma nova instância com o nome `dominomania` (ou o nome definido em EVOLUTION_API.INSTANCE)
3. Utilize o endpoint para criar a instância:

```bash
curl --location 'http://localhost:8080/instance/create' \
--header 'Content-Type: application/json' \
--header 'apikey: sua_chave_api_segura' \
--data '{
    "instanceName": "dominomania",
    "token": "seu_token_seguro",
    "qrcode": true
}'
```

### 2.2 Conectando o WhatsApp

1. Após criar a instância, acesse o endpoint para obter o QR Code:

```bash
curl --location 'http://localhost:8080/instance/dominomania/qrcode' \
--header 'apikey: sua_chave_api_segura'
```

2. Escaneie o QR Code com o WhatsApp do número que será utilizado como administrador
3. Verifique o status da conexão:

```bash
curl --location 'http://localhost:8080/instance/dominomania/status' \
--header 'apikey: sua_chave_api_segura'
```

## 3. Configuração do N8N

### 3.1 Acessando o N8N

1. Acesse o N8N em `http://seu-servidor:5678`
2. Faça login com as credenciais definidas no docker-compose.yml

### 3.2 Criando os Workflows

Você precisará criar 6 workflows no N8N:

#### 3.2.1 Workflow: create-whatsapp-group

Este workflow cria um grupo de WhatsApp quando uma nova comunidade é criada.

1. Crie um novo workflow chamado `create-whatsapp-group`
2. Adicione um nó de Webhook para receber as requisições
3. Configure o webhook com o caminho `/webhook/create-whatsapp-group`
4. Adicione um nó HTTP Request para chamar a Evolution API:
   - Método: POST
   - URL: `{{$json.instance}}/group/create`
   - Headers: 
     - Content-Type: application/json
     - apikey: sua_chave_api_segura
   - Body: 
     ```json
     {
       "name": "{{$json.communityName}} - DominoMania",
       "participants": ["{{$json.creatorPhone}}"]
     }
     ```
5. Adicione um nó Respond to Webhook para retornar o resultado

#### 3.2.2 Workflow: add-members-to-group

Este workflow adiciona membros a um grupo existente.

1. Crie um novo workflow chamado `add-members-to-group`
2. Adicione um nó de Webhook para receber as requisições
3. Configure o webhook com o caminho `/webhook/add-members-to-group`
4. Adicione um nó HTTP Request para chamar a Evolution API:
   - Método: POST
   - URL: `{{$json.instance}}/group/add-participants`
   - Headers: 
     - Content-Type: application/json
     - apikey: sua_chave_api_segura
   - Body: 
     ```json
     {
       "groupId": "{{$json.groupId}}",
       "participants": {{$json.phones}}
     }
     ```
5. Adicione um nó Respond to Webhook para retornar o resultado

#### 3.2.3 Workflow: send-competition-created

Este workflow envia uma mensagem quando uma nova competição é criada.

1. Crie um novo workflow chamado `send-competition-created`
2. Adicione um nó de Webhook para receber as requisições
3. Configure o webhook com o caminho `/webhook/send-competition-created`
4. Adicione um nó HTTP Request para chamar a Evolution API:
   - Método: POST
   - URL: `{{$json.instance}}/message/text`
   - Headers: 
     - Content-Type: application/json
     - apikey: sua_chave_api_segura
   - Body: 
     ```json
     {
       "chatId": "{{$json.groupId}}",
       "text": "🏆 *NOVA COMPETIÇÃO CRIADA* 🏆\n\n*{{$json.competitionName}}*\n\n📝 Descrição: {{$json.competitionDescription}}\n📅 Data de início: {{$json.startDate}}\n🏠 Comunidade: {{$json.communityName}}\n\nBoa sorte a todos os participantes!"
     }
     ```
5. Adicione um nó Respond to Webhook para retornar o resultado

#### 3.2.4 Workflow: send-game-started

Este workflow envia uma mensagem quando um jogo é iniciado.

1. Crie um novo workflow chamado `send-game-started`
2. Adicione um nó de Webhook para receber as requisições
3. Configure o webhook com o caminho `/webhook/send-game-started`
4. Adicione um nó HTTP Request para chamar a Evolution API:
   - Método: POST
   - URL: `{{$json.instance}}/message/text`
   - Headers: 
     - Content-Type: application/json
     - apikey: sua_chave_api_segura
   - Body: 
     ```json
     {
       "chatId": "{{$json.groupId}}",
       "text": "🎮 *JOGO INICIADO* 🎮\n\n*{{$json.competitionName}}*\n\n👥 *Time 1*: {{$json.team1}}\n👥 *Time 2*: {{$json.team2}}\n\nQue vença o melhor! 🎲"
     }
     ```
5. Adicione um nó Respond to Webhook para retornar o resultado

#### 3.2.5 Workflow: send-game-finished

Este workflow envia uma mensagem quando um jogo é finalizado.

1. Crie um novo workflow chamado `send-game-finished`
2. Adicione um nó de Webhook para receber as requisições
3. Configure o webhook com o caminho `/webhook/send-game-finished`
4. Adicione um nó HTTP Request para chamar a Evolution API:
   - Método: POST
   - URL: `{{$json.instance}}/message/text`
   - Headers: 
     - Content-Type: application/json
     - apikey: sua_chave_api_segura
   - Body: 
     ```json
     {
       "chatId": "{{$json.groupId}}",
       "text": "🏁 *JOGO FINALIZADO* 🏁\n\n*{{$json.competitionName}}*\n\n🏆 *VENCEDORES*: {{$json.winnerTeam}}\n😢 *Perdedores*: {{$json.loserTeam}}\n\n📊 *Placar*: {{$json.score}}\n{{$json.specialVictory}}"
     }
     ```
5. Adicione um nó Respond to Webhook para retornar o resultado

#### 3.2.6 Workflow: send-competition-finished

Este workflow envia uma mensagem quando uma competição é finalizada.

1. Crie um novo workflow chamado `send-competition-finished`
2. Adicione um nó de Webhook para receber as requisições
3. Configure o webhook com o caminho `/webhook/send-competition-finished`
4. Adicione um nó HTTP Request para chamar a Evolution API:
   - Método: POST
   - URL: `{{$json.instance}}/message/text`
   - Headers: 
     - Content-Type: application/json
     - apikey: sua_chave_api_segura
   - Body: 
     ```json
     {
       "chatId": "{{$json.groupId}}",
       "text": "🎉 *COMPETIÇÃO FINALIZADA* 🎉\n\n*{{$json.competitionName}}*\n*{{$json.communityName}}*\n\n👑 *Campeão Individual*: {{$json.championPlayer}}\n👑 *Dupla Campeã*: {{$json.championPair}}\n\n🏆 *TOP 5 JOGADORES*:\n{{$json.topPlayers}}\n\n🏆 *TOP 3 DUPLAS*:\n{{$json.topPairs}}\n\nParabéns a todos os participantes!"
     }
     ```
5. Adicione um nó Respond to Webhook para retornar o resultado

## 4. Configuração do Aplicativo

### 4.1 Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no seu aplicativo:

```
# N8N
N8N_BASE_URL=http://seu-servidor:5678
N8N_API_KEY=sua_chave_api_n8n
N8N_WORKFLOW_CREATE_GROUP=create-whatsapp-group
N8N_WORKFLOW_ADD_MEMBERS=add-members-to-group
N8N_WORKFLOW_COMPETITION_CREATED=send-competition-created
N8N_WORKFLOW_GAME_STARTED=send-game-started
N8N_WORKFLOW_GAME_FINISHED=send-game-finished
N8N_WORKFLOW_COMPETITION_FINISHED=send-competition-finished

# Evolution API
EVOLUTION_API_BASE_URL=http://seu-servidor:8080
EVOLUTION_API_KEY=sua_chave_api_segura
EVOLUTION_API_INSTANCE=dominomania
```

### 4.2 Testando a Integração

Para testar se a integração está funcionando corretamente:

1. Crie uma nova comunidade no aplicativo
2. Verifique se um grupo do WhatsApp foi criado automaticamente
3. Adicione membros à comunidade e verifique se eles são adicionados ao grupo
4. Crie uma competição e verifique se a mensagem é enviada ao grupo
5. Inicie um jogo e verifique se a mensagem é enviada ao grupo
6. Finalize um jogo e verifique se a mensagem é enviada ao grupo
7. Finalize uma competição e verifique se a mensagem é enviada ao grupo

## 5. Solução de Problemas

### 5.1 Verificando Logs

Para verificar os logs dos serviços:

```bash
# Logs da Evolution API
docker-compose logs -f evolution-api

# Logs do N8N
docker-compose logs -f n8n
```

### 5.2 Problemas Comuns

#### Não consegue conectar o WhatsApp

- Verifique se o QR Code está sendo gerado corretamente
- Certifique-se de que o telefone tem uma conexão estável com a internet
- Tente reiniciar a instância da Evolution API

#### Mensagens não estão sendo enviadas

- Verifique se o grupo do WhatsApp foi criado corretamente
- Confirme se o ID do grupo está sendo extraído corretamente do link de convite
- Verifique os logs do N8N para identificar possíveis erros nos workflows

#### Erros nos workflows do N8N

- Verifique se os webhooks estão configurados corretamente
- Confirme se as URLs da Evolution API estão corretas
- Verifique se a chave de API está sendo enviada corretamente nos headers

## 6. Manutenção

### 6.1 Backup

É recomendável fazer backup regular dos volumes do Docker:

```bash
# Backup da Evolution API
tar -czvf evolution-api-backup.tar.gz ./evolution-api-data

# Backup do N8N
tar -czvf n8n-backup.tar.gz ./n8n-data
```

### 6.2 Atualização

Para atualizar os serviços:

```bash
# Parar os serviços
docker-compose down

# Puxar as novas imagens
docker-compose pull

# Iniciar os serviços novamente
docker-compose up -d
```

## 7. Referências

- [Documentação da Evolution API](https://github.com/evolution-api/evolution-api)
- [Documentação do N8N](https://docs.n8n.io/)
- [Código da integração no DominoMania](../src/services/whatsappIntegrationService.ts)
- [Configuração da integração](../src/config/whatsappIntegration.ts)