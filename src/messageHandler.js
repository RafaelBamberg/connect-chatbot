const moment = require("moment");
const { getUserByPhone, getUserChurches, getChurchEvents, getChurchInfo } = require("./config/database");

// Comandos disponíveis para usuários
const AVAILABLE_COMMANDS = {
  'Igrejas': 'Mostra as igrejas que você está filiado',
  'Perfil': 'Exibe suas informações pessoais',
  'Aniversário': 'Mostra quando é seu aniversário',
  'Eventos': 'Mostra os eventos próximos das suas igrejas',
  'Contato': 'Informações para entrar em contato conosco',
  'Ajuda': 'Mostra esta lista de comandos'
};

async function handleMessage(message, client) {
  const messageBody = message.body.trim();
  const from = message.from;

  // Buscar informações do usuário pelo número de telefone
  const userData = await getUserByPhone(from);
  
  console.log(`📱 Mensagem recebida de: ${from}`);
  console.log(`👤 Usuário encontrado: ${userData ? userData.name : 'Não encontrado'}`);

  // Processar comandos do usuário
  await handleUserCommand(messageBody, message, userData, from);
}

async function handleUserCommand(messageBody, message, userData, from) {
  // Normalizar comando removendo acentos e convertendo para lowercase
  const command = messageBody
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .trim();

  // Mapeamento de comandos com variações
  const commandMap = {
    'igrejas': ['igrejas', 'igreja'],
    'perfil': ['perfil', 'meu perfil', 'dados'],
    'aniversario': ['aniversario', 'aniversário', 'niver', 'birthday'],
    'eventos': ['eventos', 'evento'],
    'contato': ['contato', 'contatos', 'telefone', 'falar'],
    'ajuda': ['ajuda', 'help', 'comandos', 'menu']
  };

  // Encontrar o comando correspondente
  let matchedCommand = null;
  for (const [key, variations] of Object.entries(commandMap)) {
    if (variations.some(variation => command.includes(variation))) {
      matchedCommand = key;
      break;
    }
  }

  switch (matchedCommand) {
    case 'igrejas':
      await handleIgrejasCommand(message, from);
      break;

    case 'perfil':
      await handlePerfilCommand(message, userData);
      break;

    case 'aniversario':
      await handleAniversarioCommand(message, userData);
      break;

    case 'eventos':
      await handleEventosCommand(message, from);
      break;

    case 'contato':
      await handleContatoCommand(message, from);
      break;

    case 'ajuda':
      await showAvailableCommands(message);
      break;

    default:
      // Para qualquer mensagem não reconhecida, mostrar comandos disponíveis
      await showAvailableCommands(message, userData);
      break;
  }
}

async function showAvailableCommands(message, userData = null) {
  const greeting = userData ? `Olá, ${userData.name}! 👋` : 'Olá! 👋';
  
  let commandsList = Object.entries(AVAILABLE_COMMANDS)
    .map(([command, description]) => `• *${command}* - ${description}`)
    .join('\n');

  const helpText = `${greeting}

🤖 *Como posso ajudar ?*

${commandsList}

📝 *Como usar:* Digite exatamente o nome do comando (ex: "Igrejas")`;

  await message.reply(helpText);
}

async function handleIgrejasCommand(message, from) {
  try {
    const userChurches = await getUserChurches(from);
    
    if (userChurches.length === 0) {
      await message.reply('❌ Não encontrei informações sobre suas igrejas no nosso banco de dados.');
      return;
    }

    let response = '⛪ *Suas Igrejas:*\n\n';
    userChurches.forEach((church, index) => {
      response += `${index + 1}. *${church.churchName}*\n`;
    });

    await message.reply(response);
  } catch (error) {
    console.error('Erro ao buscar igrejas:', error);
    await message.reply('❌ Erro ao buscar informações das igrejas. Tente novamente.');
  }
}

async function handlePerfilCommand(message, userData) {
  if (!userData) {
    await message.reply('❌ Não encontrei seu perfil no nosso banco de dados. Entre em contato conosco para mais informações.');
    return;
  }

  let profileText = `👤 *Seu Perfil:*\n\n`;
  profileText += `📛 *Nome:* ${userData.name}\n`;
  
  if (userData.dateOfBirthday) {
    profileText += `🎂 *Aniversário:* ${userData.dateOfBirthday}\n`;
  }
  
  if (userData.phone) {
    profileText += `📱 *Telefone:* ${userData.phone}\n`;
  }

  if (userData.visitDate) {
    profileText += `📅 *Última Visita:* ${moment(userData.visitDate).format('DD/MM/YYYY')}\n`;
  }

  await message.reply(profileText);
}

async function handleAniversarioCommand(message, userData) {
  if (!userData || !userData.dateOfBirthday) {
    await message.reply('❌ Não encontrei informações sobre seu aniversário. Entre em contato conosco para atualizar seus dados.');
    return;
  }

  const birthday = userData.dateOfBirthday;
  const today = moment();
  const birthdayThisYear = moment(birthday, 'DD/MM/YYYY').year(today.year());
  
  if (birthdayThisYear.isBefore(today, 'day')) {
    birthdayThisYear.add(1, 'year');
  }

  const daysUntil = birthdayThisYear.diff(today, 'days');
  
  let response = `🎂 *Seu Aniversário:*\n\n`;
  response += `📅 Data: ${birthday}\n`;
  
  if (daysUntil === 0) {
    response += `🎉 *FELIZ ANIVERSÁRIO!* Hoje é seu dia especial!`;
  } else {
    response += `⏰ Faltam ${daysUntil} dias para seu aniversário!`;
  }

  await message.reply(response);
}

async function handleEventosCommand(message, from) {
  try {
    const userChurches = await getUserChurches(from);
    
    if (userChurches.length === 0) {
      await message.reply('❌ Não encontrei informações sobre suas igrejas para buscar eventos.');
      return;
    }

    let allEvents = [];
    
    // Buscar eventos de todas as igrejas do usuário
    for (const church of userChurches) {
      const churchEvents = await getChurchEvents(church.churchId);
      allEvents = allEvents.concat(churchEvents.map(event => ({
        ...event,
        churchName: church.churchName
      })));
    }

    if (allEvents.length === 0) {
      await message.reply('📅 No momento não há eventos programados nas suas igrejas.');
      return;
    }

    // Filtrar eventos futuros e ordenar por data
    const today = new Date();
    const futureEvents = allEvents.filter(event => {
      const eventDate = moment(event.startDate, 'DD/MM/YYYY').toDate();
      return eventDate >= today;
    }).sort((a, b) => {
      const dateA = moment(a.startDate, 'DD/MM/YYYY').toDate();
      const dateB = moment(b.startDate, 'DD/MM/YYYY').toDate();
      return dateA - dateB;
    });

    if (futureEvents.length === 0) {
      await message.reply('📅 No momento não há eventos futuros programados nas suas igrejas.');
      return;
    }

    let response = '📅 *Próximos Eventos das Suas Igrejas:*\n\n';
    
    futureEvents.slice(0, 5).forEach((event, index) => {
      const eventDate = moment(event.startDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
      response += `${index + 1}. 🎉 *${event.title}*\n`;
      response += `   📅 Data: ${eventDate}\n`;
      if (event.churchName) {
        response += `   ⛪ Igreja: ${event.churchName}\n`;
      }
      if (event.description) {
        response += `   📝 ${event.description}\n`;
      }
      if (event.eventPrice) {
        response += `   💰 Investimento: ${event.eventPrice}\n`;
      }
      response += '\n';
    });

    if (futureEvents.length > 5) {
      response += `📋 E mais ${futureEvents.length - 5} eventos...`;
    }

    await message.reply(response);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    await message.reply('❌ Erro ao buscar eventos. Tente novamente.');
  }
}

async function handleContatoCommand(message, from) {
  try {
    const userChurches = await getUserChurches(from);
    
    if (userChurches.length === 0) {
      // Fallback para usuários não cadastrados
      const contactText = `📞 *Informações de Contato:*

📧 Email: contato@igreja.com
📱 WhatsApp: Este número
🌐 Site: www.igreja.com
📍 Endereço: [Endereço da Igreja]

⏰ *Horários de Atendimento:*
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h

🙏 Estamos aqui para ajudar você!`;
      
      await message.reply(contactText);
      return;
    }

    let contactText = `📞 *Informações de Contato das Suas Igrejas:*\n\n`;
    
    for (const userChurch of userChurches) {
      const churchInfo = await getChurchInfo(userChurch.churchId);
      
      if (churchInfo) {
        contactText += `⛪ *${churchInfo.name}*\n`;
        
        if (churchInfo.phone) {
          contactText += `📱 Telefone: ${churchInfo.phone}\n`;
        }
        
        if (churchInfo.address && Array.isArray(churchInfo.address)) {
          contactText += `📍 Endereço: ${churchInfo.address.join(', ')}\n`;
        }
        
        if (churchInfo.cep) {
          contactText += `📮 CEP: ${churchInfo.cep}\n`;
        }
        
        if (churchInfo.phrase) {
          contactText += `💬 "${churchInfo.phrase}"\n`;
        }
        
        if (churchInfo.phraseOfDay) {
          contactText += `✨ Frase do dia: "${churchInfo.phraseOfDay}"\n`;
        }

        // Adicionar horários de culto se disponível
        if (churchInfo.worshipSchedule) {
          contactText += `⏰ *Horários de Culto:*\n`;
          
          const dayNames = {
            'monday': 'Segunda-feira',
            'tuesday': 'Terça-feira', 
            'wednesday': 'Quarta-feira',
            'thursday': 'Quinta-feira',
            'friday': 'Sexta-feira',
            'saturday': 'Sábado',
            'sunday': 'Domingo'
          };
          
          Object.entries(churchInfo.worshipSchedule).forEach(([day, services]) => {
            const dayName = dayNames[day] || day;
            if (Array.isArray(services)) {
              services.forEach(service => {
                contactText += `   • ${dayName}: ${service.name} - ${service.time}h`;
                if (service.minister) {
                  contactText += ` (${service.minister})`;
                }
                contactText += `\n`;
              });
            }
          });
        }
        
        contactText += `\n`;
      } else {
        contactText += `⛪ *${userChurch.churchName}*\n`;
        contactText += `📱 Entre em contato através deste WhatsApp\n\n`;
      }
    }
    
    contactText += `🙏 *Estamos aqui para ajudar você!*\n`;
    contactText += `💒 Que Deus abençoe sua caminhada conosco!`;
    
    await message.reply(contactText);
    
  } catch (error) {
    console.error('Erro ao buscar informações de contato:', error);
    
    // Fallback em caso de erro
    const fallbackText = `📞 *Informações de Contato:*

📱 WhatsApp: Este número
🙏 Entre em contato conosco através deste WhatsApp

Estamos aqui para ajudar você!`;
    
    await message.reply(fallbackText);
  }
}

module.exports = {
  handleMessage
};
