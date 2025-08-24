const moment = require("moment");
const { getTodayBirthdays, getRecentVisitors } = require("./config/database");
const { checkBirthdays } = require("./schedulers/birthdayService");
const { runDailyChecks } = require("./schedulers/scheduler");

require("dotenv").config();
const ADMIN_PHONE = process.env.ADMIN_PHONE;

async function handleMessage(message, client) {
  const messageBody = message.body;
  const from = message.from;

  // Verificar se é administrador
  const isAdmin = from.includes(ADMIN_PHONE);

  // Menu principal
  if (messageBody === "menu" || messageBody === "Menu" || messageBody === "MENU") {
    const menuText = `
🤖 *Bem-vindo ao Bot da Igreja!*

Escolha uma opção:
1️⃣ - Localização da Igreja
2️⃣ - Horários dos Cultos
3️⃣ - Produtos Disponíveis
4️⃣ - Falar com Pastor
5️⃣ - Agendar Visita

Digite o número da opção desejada.
        `;
    await message.reply(menuText);
    return;
  }

  // Processar comandos
  switch (messageBody) {
    case "1":
      await message.reply(
        "Nossa igreja está localizada em [Endereço]. Somos uma comunidade acolhedora e dedicada ao serviço de Deus."
      );
      break;

    case "2":
      await message.reply(
        "*Horários dos Cultos*\nDomingo: 10h e 19h\nQuarta-feira: 19h30\nSábado: 19h"
      );
      break;

    case "3":
      const productsText = `
*Produtos Disponíveis*
📚 Bíblias
🎵 CDs de Louvor
📖 Livros Cristãos
🎁 Kits de Presentes

Para mais informações sobre algum produto, digite o nome do produto.
            `;
      await message.reply(productsText);
      break;

    case "4":
      await message.reply(
        "Para falar com um pastor, por favor, envie seu nome e horário preferido para contato. Um pastor entrará em contato em breve."
      );
      break;

    case "5":
      await message.reply(
        "Ficaremos felizes em recebê-lo! Por favor, envie seu nome e horário preferido para visita. Entraremos em contato para confirmar."
      );
      break;

    // Comandos administrativos
    case "admin":
      if (isAdmin) {
        const adminMenu = `
🤖 *Menu Administrativo*

🔧 Comandos disponíveis:
• \`status\` - Status do sistema
• \`debug-data\` - Ver dados do Firebase
• \`test-birthdays\` - Testar aniversariantes
• \`test-daily\` - Testar verificação diária completa
• \`test-phone\` - Testar formatação de telefone
        `;
        await message.reply(adminMenu);
      }
      break;

    case "debug-data":
      if (isAdmin) {
        try {
          const birthdays = await getTodayBirthdays();
          const visitors = await getRecentVisitors(7);
          
          const debugMsg = `🔍 *Debug - Dados do Firebase*

🎂 **Aniversariantes hoje (${moment().format('DD/MM')}):** ${birthdays.length}
${birthdays.map(p => `• ${p.name} - ${p.dateOfBirthday} - Tel: ${p.phone}`).join('\n') || '   Nenhum encontrado'}

👥 **Visitantes recentes (7 dias):** ${visitors.length}
${visitors.map(v => `• ${v.name} - ${moment(v.visitDate).format('DD/MM')} - Tel: ${v.phone}`).join('\n') || '   Nenhum encontrado'}`;
          
          await message.reply(debugMsg);
        } catch (error) {
          await message.reply(`❌ Erro ao buscar dados: ${error.message}`);
        }
      }
      break;

    case "status":
      if (isAdmin) {
        const statusMsg = `🤖 *Status do Sistema*\n\n✅ Bot conectado e funcionando\n📅 Data: ${moment().format('DD/MM/YYYY')}\n🕒 Hora: ${moment().format('HH:mm')}\n\n🔄 Verificações automáticas:\n• Aniversariantes e Visitantes: Diariamente às 09:00`;
        await message.reply(statusMsg);
      }
      break;

    case "test-birthdays":
      if (isAdmin) {
        await message.reply("🔄 Testando sistema de aniversariantes...");
        await checkBirthdays();
      }
      break;

    case "test-daily":
      if (isAdmin) {
        await message.reply("🔄 Executando verificação diária completa...");
        await runDailyChecks();
      }
      break;

    case "test-phone":
      if (isAdmin) {
        const testPhone = "(71) 99912-1838";
        const formatted = testPhone.replace(/\D/g, '');
        const withCountry = '55' + formatted;
        await message.reply(`Teste telefone:\nOriginal: ${testPhone}\nLimpo: ${formatted}\nCom país: ${withCountry}`);
      }
      break;

    default:
      // Resposta padrão para mensagens não reconhecidas
      if (!isAdmin && !messageBody.startsWith("/")) {
        await message.reply(
          `Olá! 👋 Digite *menu* para ver as opções disponíveis.`
        );
      }
      break;
  }
}

module.exports = {
  handleMessage
};
