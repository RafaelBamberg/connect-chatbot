// Importações dos módulos
require("dotenv").config();
require("./config/firebaseConfig"); // Inicializar Firebase

const { client, initializeClient } = require("./whatsappClient");
const { startServer } = require("./server");

// Inicializar servidor Express imediatamente (independente do WhatsApp)
console.log("🚀 Iniciando servidor API...");
startServer();

// Log quando WhatsApp conectar
client.on("ready", () => {
  console.log("✅ WhatsApp conectado! API pronta para uso completo.");
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
