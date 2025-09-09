const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");

// Função para normalizar números de telefone brasileiros
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove todos os caracteres não numéricos
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Se não começar com 55 (código do Brasil), adiciona
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }
  
  // Para números brasileiros
  if (cleanPhone.startsWith('55')) {
    // Extrai o código do país (55)
    const countryCode = cleanPhone.substring(0, 2);
    const rest = cleanPhone.substring(2);
    
    if (rest.length >= 10) {
      const areaCode = rest.substring(0, 2);
      let phoneNumber = rest.substring(2);
      
      // CORREÇÃO ESPECÍFICA: Se tem 11 dígitos (13 total) e começa com 9, remove o primeiro 9
      if (cleanPhone.length === 13 && phoneNumber.startsWith('9')) {
        phoneNumber = phoneNumber.substring(1); // Remove o primeiro 9
        console.log(`🔧 Removendo 9 extra: ${cleanPhone} -> ${countryCode + areaCode + phoneNumber}`);
      }
      // Se tem 10 dígitos e começa com 99, remove o primeiro 9
      else if (phoneNumber.length === 10 && phoneNumber.startsWith('99')) {
        phoneNumber = phoneNumber.substring(1);
        console.log(`🔧 Removendo 9 duplicado: ${cleanPhone} -> ${countryCode + areaCode + phoneNumber}`);
      }
      
      cleanPhone = countryCode + areaCode + phoneNumber;
    }
  }
  
  console.log(`📱 Número normalizado: ${phone} -> ${cleanPhone}`);
  return cleanPhone;
}

// Criar diretório se não existir
const sessionPath = path.join(__dirname, '..', '.wwebjs_auth');
if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "main-session",
    dataPath: sessionPath
  }),
  puppeteer: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu"
    ],
    headless: true,
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
  }
});

// Eventos de autenticação
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("QR Code gerado. Escaneie com seu WhatsApp!");
  console.log("Aguardando autenticação...");
});

client.on("authenticated", () => {
  console.log("✅ Autenticação bem-sucedida! Dados salvos localmente.");
  console.log("🔍 Verificando persistência da sessão...");
  
  // Verificar se os arquivos de sessão foram realmente criados
  const sessionFile = path.join(sessionPath, 'session-main-session', 'Default');
  if (fs.existsSync(sessionFile)) {
    console.log("✅ Arquivos de sessão confirmados no disco");
  } else {
    console.log("⚠️ ATENÇÃO: Arquivos de sessão NÃO encontrados após autenticação!");
  }
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
  console.log("🔄 Tente escanear o QR Code novamente.");
});

client.on("disconnected", (reason) => {
  console.log("⚠️ WhatsApp desconectado:", reason);
  console.log("🔄 Tentando reconectar...");
});

client.on("ready", () => {
  console.log("🚀 Cliente está pronto! Bot WhatsApp conectado.");
  console.log("📱 Sessão autenticada e persistente ativa.");
  
  // Debug: Verificar informações do cliente
  if (client.info) {
    console.log("ℹ️ Informações do cliente:");
    console.log(`   Nome: ${client.info.pushname}`);
    console.log(`   Número: ${client.info.wid.user}`);
    console.log(`   Plataforma: ${client.info.platform}`);
    console.log(`   WID: ${client.info.wid._serialized}`);
  } else {
    console.log("⚠️ PROBLEMA: Cliente 'ready' mas client.info está undefined!");
  }
  
  // Verificar novamente se a sessão está persistida
  const sessionFile = path.join(sessionPath, 'session-main-session', 'Default');
  if (fs.existsSync(sessionFile)) {
    console.log("✅ Persistência confirmada - arquivos de sessão existem");
  } else {
    console.log("❌ PROBLEMA: Cliente ready mas sem arquivos de sessão!");
  }
});

// Debug: Mostrar mensagens recebidas no console
client.on("message", (message) => {
  console.log("📨 MENSAGEM RECEBIDA:");
  console.log(`   De: ${message.from}`);
  console.log(`   Para: ${message.to}`);
  console.log(`   Conteúdo: ${message.body}`);
  console.log(`   Tipo: ${message.type}`);
  console.log(`   Timestamp: ${new Date(message.timestamp * 1000).toLocaleString()}`);
  console.log(`   É grupo: ${message.isGroupMsg}`);
  if (message.isGroupMsg) {
    console.log(`   Chat ID: ${message.chatId}`);
  }
  console.log("---");
});

// Debug: Mostrar mensagens enviadas no console
client.on("message_create", (message) => {
  // Só mostrar mensagens enviadas pelo bot (não as recebidas)
  if (message.fromMe) {
    console.log("📤 MENSAGEM ENVIADA:");
    console.log(`   Para: ${message.to}`);
    console.log(`   Conteúdo: ${message.body}`);
    console.log(`   Tipo: ${message.type}`);
    console.log(`   Timestamp: ${new Date(message.timestamp * 1000).toLocaleString()}`);
    console.log(`   É grupo: ${message.isGroupMsg}`);
    if (message.isGroupMsg) {
      console.log(`   Chat ID: ${message.chatId}`);
    }
    console.log("---");
  }
});

// Função para verificar se existe sessão salva
function checkSavedSession() {
  const sessionFile = path.join(sessionPath, 'session-main-session', 'Default');
  const sessionFolderExists = fs.existsSync(path.join(sessionPath, 'session-main-session'));
  
  console.log("🔍 Verificando sessão salva...");
  console.log(`   Caminho da sessão: ${sessionPath}`);
  console.log(`   Pasta session-main-session existe: ${sessionFolderExists}`);
  console.log(`   Arquivo Default existe: ${fs.existsSync(sessionFile)}`);
  
  if (fs.existsSync(sessionFile)) {
    const stats = fs.statSync(sessionFile);
    console.log(`   Tamanho do arquivo: ${stats.size} bytes`);
    console.log(`   Última modificação: ${stats.mtime.toLocaleString()}`);
    console.log("📂 Sessão salva encontrada. Tentando restaurar...");
    return true;
  } else {
    console.log("🆕 Nenhuma sessão salva encontrada. Será necessário escanear o QR Code.");
    return false;
  }
}

// Função para inicializar o cliente com verificação
async function initializeClient() {
  console.log("🔄 Iniciando WhatsApp Bot...");
  
  const hasSession = checkSavedSession();
  if (hasSession) {
    console.log("🔐 Tentando conectar com sessão existente...");
  }
  
  try {
    await client.initialize();
  } catch (error) {
    console.error("❌ Erro ao inicializar cliente:", error.message);
    console.log("🔄 Tentando novamente em 10 segundos...");
    setTimeout(() => {
      initializeClient();
    }, 10000);
  }
}

// Função para obter status da conexão
function getConnectionStatus() {
  if (client.info) {
    return 'connected';
  } else {
    return 'disconnected';
  }
}

// Função para fazer logout
async function logout() {
  try {
    console.log('📝 Iniciando processo de logout...');
    await client.logout();
    console.log('✅ Logout realizado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error.message);
    return false;
  }
}

// Função para limpar sessão local
function clearSession() {
  try {
    console.log('🗑️ Removendo arquivos de sessão...');
    
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('✅ Sessão removida com sucesso');
      return true;
    } else {
      console.log('ℹ️ Nenhuma sessão encontrada para remover');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro ao remover sessão:', error.message);
    return false;
  }
}

module.exports = {
  client,
  initializeClient,
  checkSavedSession,
  getConnectionStatus,
  logout,
  clearSession,
  normalizePhoneNumber
};
