// Importações dos módulos
require("dotenv").config();
require("./config/firebaseConfig"); // Inicializar Firebase

const { client, initializeClient } = require("./whatsappClient");
const { handleMessage } = require("./messageHandler");
const { startDailyTasks } = require("./schedulers/scheduler");

// Configurar handler de mensagens
client.on("message", async (message) => {
  try {
    await handleMessage(message, client);
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error.message);
  }
});

// Inicializar sistema automático quando cliente estiver pronto
client.on("ready", () => {
  startDailyTasks();
});

// Inicializar aplicação
async function main() {
  try {
    await initializeClient();
  } catch (error) {
    console.error("❌ Erro crítico na inicialização:", error.message);
    process.exit(1);
  }
}

// Iniciar aplicação
main();
