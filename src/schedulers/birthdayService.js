const moment = require("moment");
const { client } = require("../whatsappClient");
const { getTodayBirthdays } = require("../config/database");

async function checkBirthdays() {
  try {
    const birthdays = await getTodayBirthdays();
    console.log(`🔍 Verificando ${birthdays.length} aniversariantes`);

    if (birthdays.length === 0) {
      console.log("📋 Nenhum aniversariante encontrado hoje");
      return;
    }

    const sentMessages = [];
    
    for (const person of birthdays) {
      const message = `Feliz Aniversario ${person.name} !`;

      if (person.phone) {
        const chatId = `${person.phone}@c.us`;
        try {
          // Add a small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          await client.sendMessage(chatId, message);
          console.log(`✅ Mensagem de aniversário enviada para ${person.name}`);
          sentMessages.push(person);
        } catch (error) {
          console.error(`❌ Erro ao enviar mensagem para ${person.name}:`, error.message);
        }
      }
    }
    
    // Log apenas para controle interno
    if (sentMessages.length > 0) {
      console.log(`🎂 ${sentMessages.length} mensagens de aniversário enviadas com sucesso`);
    }
    
  } catch (error) {
    console.error("❌ Erro ao verificar aniversários:", error.message);
  }
}

module.exports = {
  checkBirthdays
};
