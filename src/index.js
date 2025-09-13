// Importações dos módulos
require("dotenv").config();
require("./config/firebaseConfig"); // Inicializar Firebase

const { app, startServer } = require("./server");

// Para ambiente de desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const { client, initializeClient } = require("./whatsappClient");
  
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
} else {
  // Para produção na Vercel, apenas inicializar configurações básicas
  console.log("🚀 Iniciando em modo produção...");
}

// Exportar o app para a Vercel
module.exports = app;
