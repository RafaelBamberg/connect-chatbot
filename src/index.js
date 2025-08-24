const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { getTodayBirthdays, getRecentVisitors } = require("./database");

// Criar dire// Listener desabilitado - mensagens enviadas diretamente aos aniversariantes
// botEvents.on('birthdaysFound', async (birthdays) => {
//   // Admin notification removed
// });o se não existir
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
  console.log("Tentando reconectar em 5 segundos...");
  setTimeout(() => {
    client.destroy().then(() => {
      console.log("Cliente destruído. Reiniciando...");
      client.initialize();
    });
  }, 5000);
});

client.on("ready", () => {
  console.log("🚀 Cliente está pronto! Bot WhatsApp conectado.");
  console.log("📱 Sessão autenticada e persistente ativa.");
  startDailyTasks();
});

client.on("disconnected", (reason) => {
  console.log("⚠️ Cliente desconectado:", reason);
  console.log("Tentando reconectar automaticamente...");
  setTimeout(() => {
    client.initialize();
  }, 3000);
});

// Evento para loading states
client.on("loading_screen", (percent, message) => {
  console.log(`📊 Carregando... ${percent}% - ${message}`);
});

client.on("message", async (message) => {
  try {
    if (message.body.startsWith("!")) {
      const command = message.body.slice(1).toLowerCase();
      handleCommand(message, command);
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error.message);
  }
});

async function handleCommand(message, command) {
  try {
    // Verificar se é o administrador
    const isAdmin = message.from === `${ADMIN_PHONE}@c.us`;
    
    console.log(`📱 Comando recebido: !${command}`);
    console.log(`👤 De: ${message.from}`);
    console.log(`🔑 Admin esperado: ${ADMIN_PHONE}@c.us`);
    console.log(`✅ É admin: ${isAdmin}`);
    
    switch (command) {
      case "whoami":
        await message.reply(`ID: ${message.from}\nAdmin esperado: ${ADMIN_PHONE}@c.us\nÉ admin: ${isAdmin}`);
        break;
        
      case "menu":
        const menuText = `
*Menu de Opções*
1️⃣ - Informações sobre a Igreja
2️⃣ - Horários dos Cultos
3️⃣ - Produtos Disponíveis
4️⃣ - Falar com um Pastor
5️⃣ - Visitar a Igreja

Digite o número da opção desejada.
            `;
        await message.reply(menuText);
        break;

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

📊 Status:
• ✅ Monitoramento automático funcionando
• 🎂 Aniversariantes: Verificação a cada hora
• 👥 Visitantes: Verificação a cada 2 horas
• 📱 Última verificação: ${moment().format('HH:mm')}

🔍 **Debug:**
• !status - Ver status detalhado
• !debug-data - Ver dados do Firebase (só para debug)

⚙️ **Sistema totalmente automático!**
Não precisa fazer nada manualmente.
          `;
          await message.reply(adminMenu);
        } else {
          await message.reply("❌ Acesso negado. Comando disponível apenas para administradores.");
        }
        break;

      case "status":
        if (isAdmin) {
          const statusMsg = `🤖 *Status do Sistema Automático*

✅ Bot conectado e funcionando
📅 ${moment().format('DD/MM/YYYY')}
🕒 ${moment().format('HH:mm')}

🔄 **Verificações Automáticas:**
• 🎂 Aniversariantes: A cada hora (8h-18h)
• 👥 Visitantes: A cada 2h (9h-17h)

📱 Sistema 100% automático!`;
          await message.reply(statusMsg);
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
          const statusMsg = `🤖 *Status do Sistema*\n\n✅ Bot conectado e funcionando\n📅 Data: ${moment().format('DD/MM/YYYY')}\n🕒 Hora: ${moment().format('HH:mm')}\n\n🔄 Próximas verificações automáticas:\n• Aniversariantes: Diariamente às 09:00\n• Visitantes: Diariamente às 10:00\n• Status diário: 08:00`;
          await message.reply(statusMsg);
        }
        break;

      case "test-birthdays":
        if (isAdmin) {
          await message.reply("🔄 Testando sistema de aniversariantes...");
          await checkBirthdays();
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

      case "test-visitors":
        if (isAdmin) {
          await message.reply("🔄 Testando sistema de visitantes...");
          await checkVisitors();
        }
        break;

      case "force-birthdays":
        if (isAdmin) {
          await message.reply("🎂 Forçando verificação de aniversariantes...");
          await checkBirthdays();
        }
        break;

      case "force-visitors":
        if (isAdmin) {
          await message.reply("👥 Forçando verificação de visitantes...");
          await checkVisitors();
        }
        break;

      default:
        await message.reply(
          "Comando não reconhecido. Digite !menu para ver as opções disponíveis."
        );
    }
  } catch (error) {
    console.error("Erro ao processar comando:", error);
    try {
      await message.reply("Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente em alguns minutos.");
    } catch (replyError) {
      console.error("Erro ao enviar mensagem de erro:", replyError);
    }
  }
}

// Configuração do administrador (adicione o número do WhatsApp do administrador)
const ADMIN_PHONE = process.env.ADMIN_PHONE || "5511999999999"; // Adicione no .env

// Listeners de eventos personalizados
const EventEmitter = require('events');
const botEvents = new EventEmitter();

// Listener para aniversariantes
botEvents.on('birthdaysFound', async (birthdays) => {
  const adminChatId = `${ADMIN_PHONE}@c.us`;
  
  if (birthdays.length > 0) {
    const birthdayList = birthdays.map(person => `• ${person.name}`).join('\n');
    const adminMessage = `🎂 *Aniversariantes do Dia* (${birthdays.length})\n\n${birthdayList}\n\n✅ Mensagens de parabéns foram enviadas automaticamente.`;
    
    try {
      await client.sendMessage(adminChatId, adminMessage);
      console.log(`📱 Notificação de aniversariantes enviada para o administrador`);
    } catch (error) {
      console.error("❌ Erro ao notificar administrador sobre aniversariantes:", error.message);
    }
  }
});

// Listener desabilitado - mensagens enviadas diretamente aos visitantes
// botEvents.on('visitorsFound', async (visitors) => {
//   // Admin notification removed
// });

// Listener para status do sistema
botEvents.on('systemStatus', async (status) => {
  const adminChatId = `${ADMIN_PHONE}@c.us`;
  
  try {
    await client.sendMessage(adminChatId, status);
    console.log(`📱 Status do sistema enviado para o administrador`);
  } catch (error) {
    console.error("❌ Erro ao enviar status do sistema:", error.message);
  }
});

function startDailyTasks() {
  console.log("🕘 Iniciando sistema automático de monitoramento...");
  
  // Verificar a cada 30 segundos para testes mais rápidos
  setInterval(async () => {
    const now = moment();
    const currentTime = `${now.hours()}:${now.minutes().toString().padStart(2, '0')}`;
    
    // Aniversariantes - verificar a cada hora das 8h às 18h
    if (now.minutes() === 0 && now.hours() >= 8 && now.hours() <= 18) {
      console.log(`🎂 [${currentTime}] Verificando aniversariantes automaticamente...`);
      await checkBirthdays();
    }
    
    // Visitantes - verificar a cada 2 horas das 9h às 17h
    if (now.minutes() === 0 && now.hours() >= 9 && now.hours() <= 17 && now.hours() % 2 === 1) {
      console.log(`👥 [${currentTime}] Verificando visitantes automaticamente...`);
      await checkVisitors();
    }
    
    // Status diário às 8h
    if (now.hours() === 8 && now.minutes() === 0) {
      const statusMessage = `🤖 *Sistema Automático Ativo*\n\n📅 ${now.format('DD/MM/YYYY')}\n🕒 ${now.format('HH:mm')}\n\n🔄 **Monitoramento Automático:**\n• 🎂 Aniversariantes: A cada hora (8h-18h)\n• 👥 Visitantes: A cada 2h (9h-17h)\n• 📊 Status: Diário às 8h\n\n✅ Tudo funcionando perfeitamente!`;
      botEvents.emit('systemStatus', statusMessage);
    }
    
    // Log a cada 10 minutos para mostrar que está ativo
    if (now.minutes() % 10 === 0 && now.seconds() === 0) {
      console.log(`⏰ [${currentTime}] Sistema automático ativo - monitorando...`);
    }
    
  }, 30000); // Verifica a cada 30 segundos para ser mais responsivo
  
  // Fazer uma verificação imediata ao iniciar
  setTimeout(async () => {
    console.log("🚀 Fazendo verificação inicial automática...");
    await checkBirthdays();
    await checkVisitors();
  }, 5000); // Aguarda 5 segundos após iniciar
}

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
      const message = `Feliz aniversário, ${person.name}! 🎂✨ Hoje agradecemos a Deus pela sua vida e por tê-lo(a) como parte da nossa família em Cristo. Que o Senhor abençoe seus dias com saúde, paz e muitas alegrias. Estamos felizes em celebrar com você mais um ano de vida! 🙌❤️`;

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
    // Notificar administrador sobre erro
    botEvents.emit('systemStatus', `❌ *Erro no Sistema*\n\nFalha ao verificar aniversariantes:\n${error.message}\n\n🕒 ${moment().format('DD/MM/YYYY HH:mm')}`);
  }
}

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
      const message = `Olá, ${visitor.name}! Foi uma alegria receber você em nossa igreja! 🙏 Esperamos que tenha se sentido acolhido(a) e abençoado(a) em nossa companhia. Nossa porta estará sempre aberta para você e sua família. Que Deus continue guiando seus passos e esperamos revê-lo(a) em breve! ✨🙌`;

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
    // Notificar administrador sobre erro
    botEvents.emit('systemStatus', `❌ *Erro no Sistema*\n\nFalha ao verificar visitantes:\n${error.message}\n\n🕒 ${moment().format('DD/MM/YYYY HH:mm')}`);
  }
}

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
    setTimeout(initializeClient, 10000);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido sinal de interrupção. Desconectando...');
  await client.destroy();
  console.log('👋 Cliente desconectado. Encerrando aplicação.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido sinal de término. Desconectando...');
  await client.destroy();
  console.log('👋 Cliente desconectado. Encerrando aplicação.');
  process.exit(0);
});

// Inicializar o cliente
initializeClient();
