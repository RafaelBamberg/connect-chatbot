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
      const message = `🎉 *Parabéns!* 🎉

A família da Igreja Batista Missões Restauradoras se alegra em celebrar a sua vida!
Você é presente de Deus para todos nós, e cremos que o Senhor tem preparado dias de bênçãos, saúde e muitas conquistas para você.

Que cada novo ano seja cheio da graça, da paz e do amor de Cristo. 🙌✨

*"Este é o dia que fez o Senhor; regozijemo-nos e alegremo-nos nele."*
(Salmos 118:24)

💒 Receba nosso carinho e orações, e que sua vida continue sendo luz e inspiração para todos nós!`;

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
