/**
 * Script para alternar entre os ambientes de desenvolvimento e produção
 * Uso: node scripts/switch-env.js dev|prod
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente do arquivo .env
const envPath = path.resolve(process.cwd(), '.env');
const envVars = dotenv.parse(fs.readFileSync(envPath));

// Verificar argumentos
const args = process.argv.slice(2);
if (args.length === 0 || !['dev', 'prod'].includes(args[0].toLowerCase())) {
  console.error('Uso: node scripts/switch-env.js dev|prod');
  process.exit(1);
}

const targetEnv = args[0].toLowerCase() === 'prod' ? 'PROD' : 'DEV';
console.log(`Alternando para ambiente: ${targetEnv}`);

// Atualizar variáveis de ambiente
envVars['EXPO_PUBLIC_SUPABASE_ENV'] = targetEnv;

// Atualizar as variáveis derivadas
envVars['EXPO_PUBLIC_SUPABASE_URL'] = envVars[`EXPO_PUBLIC_SUPABASE_URL_${targetEnv}`];
envVars['EXPO_PUBLIC_SUPABASE_ANON_KEY'] = envVars[`EXPO_PUBLIC_SUPABASE_ANON_KEY_${targetEnv}`];
envVars['EXPO_PUBLIC_SUPABASE_PROJECT_ID'] = envVars[`EXPO_PUBLIC_SUPABASE_PROJECT_ID_${targetEnv}`];

// Salvar o arquivo .env atualizado
const envContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(envPath, envContent);

console.log(`Ambiente alterado para ${targetEnv} com sucesso!`);
console.log(`URL: ${envVars['EXPO_PUBLIC_SUPABASE_URL']}`);
console.log(`Projeto ID: ${envVars['EXPO_PUBLIC_SUPABASE_PROJECT_ID']}`);
console.log('\nReinicie o servidor de desenvolvimento para aplicar as alterações.');
