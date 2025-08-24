const moment = require("moment");
const { client } = require("../whatsappClient");
const { getRecentVisitors } = require("../config/database");

async function checkVisitors() {
  try {
    const visitors = await getRecentVisitors(7); // últimos 7 dias
    console.log(`🔍 Verificando ${visitors.length} visitantes recentes`);

    if (visitors.length === 0) {
      console.log("📋 Nenhum visitante recente encontrado");
      return;
    }

    const sentMessages = [];
    
    for (const visitor of visitors) {
      const message = `Voce e foi cadastrado como visitante`;

      if (visitor.phone && !visitor.contacted) {
        const chatId = `${visitor.phone}@c.us`;
        try {
          // Add a small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          await client.sendMessage(chatId, message);
          console.log(`✅ Mensagem de acompanhamento enviada para ${visitor.name}`);
          sentMessages.push(visitor);
        } catch (error) {
          console.error(`❌ Erro ao enviar mensagem para ${visitor.name}:`, error.message);
        }
      }
    }
    
    // Log apenas para controle interno
    if (sentMessages.length > 0) {
      console.log(`👥 ${sentMessages.length} mensagens de acompanhamento enviadas com sucesso`);
    }
    
  } catch (error) {
    console.error("❌ Erro ao verificar visitantes:", error.message);
  }
}

module.exports = {
  checkVisitors
};
