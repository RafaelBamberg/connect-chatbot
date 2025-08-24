const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");

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
});

// Função para verificar se existe sessão salva
function checkSavedSession() {
  const sessionFile = path.join(sessionPath, 'main-session', 'Default');
  if (fs.existsSync(sessionFile)) {
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

module.exports = {
  client,
  initializeClient,
  checkSavedSession
};
