const { getUserByPhone, getUserChurches, getChurchInfo } = require('./config/database');

// Estado das conversas dos usuários (em memória)
const userStates = new Map();

// Estados possíveis das conversas
const STATES = {
  INITIAL: 'initial',
  WAITING_CHURCH_SELECTION: 'waiting_church_selection',
  CHURCH_SELECTED: 'church_selected'
};

// Função para gerar o menu principal
function getMainMenu() {
  return `🤖 Como posso ajudar ?

* Palavra do dia - Mostra a palavra do dia da sua igreja
* Dias de culto - Mostra os dias e horários de culto
* Endereço - Mostra o endereço da sua igreja
* Contato - Informações de contato da sua igreja
* Ajuda - Mostra esta lista de comandos

📝 Como usar: Digite exatamente o nome do comando (ex: "Palavra do dia")
💡 Digite "Menu" para ver estas opções novamente`;
}

// Função para processar mensagem recebida
async function processMessage(message) {
  const phoneNumber = message.from.replace('@c.us', '');
  const messageText = message.body.trim();
  
  console.log(`📱 Mensagem recebida de ${phoneNumber}: "${messageText}"`);
  
  // Verificar se o usuário está cadastrado
  const user = await getUserByPhone(phoneNumber);
  
  if (!user) {
    return `❌ Desculpe, seu número não está cadastrado em nosso sistema.

Para se cadastrar, entre em contato com a administração da sua igreja.

📞 Precisa de ajuda? Entre em contato com a administração.`;
  }
  
  console.log(`✅ Usuário cadastrado encontrado: ${user.name}`);
  
  // Obter estado atual do usuário
  const userState = userStates.get(phoneNumber) || { state: STATES.INITIAL };
  
  // Processar comando baseado no estado atual
  switch (userState.state) {
    case STATES.INITIAL:
      return await handleInitialState(phoneNumber, messageText, user);
      
    case STATES.WAITING_CHURCH_SELECTION:
      return await handleChurchSelection(phoneNumber, messageText, user, userState);
      
    case STATES.CHURCH_SELECTED:
      return await handleMenuCommands(phoneNumber, messageText, user, userState);
      
    default:
      return await handleInitialState(phoneNumber, messageText, user);
  }
}

// Manipular estado inicial (identificar igrejas do usuário)
async function handleInitialState(phoneNumber, messageText, user) {
  try {
    const userChurches = await getUserChurches(user.phone);
    
    if (userChurches.length === 0) {
      return `❌ Não encontramos igrejas vinculadas ao seu cadastro.

Entre em contato com a administração para verificar sua situação.`;
    }
    
    if (userChurches.length === 1) {
      // Se só tem uma igreja, ir direto para o menu
      const selectedChurch = userChurches[0];
      
      // Salvar estado com igreja selecionada
      userStates.set(phoneNumber, {
        state: STATES.CHURCH_SELECTED,
        selectedChurch: selectedChurch,
        hasMultipleChurches: false
      });
      
      return `Olá, ${user.name}! 👋

🏛️ *${selectedChurch.churchName}*

${getMainMenu()}`;
    }
    
    // Se tem múltiplas igrejas, pedir para escolher
    let response = `Olá, ${user.name}! 👋

Você faz parte de múltiplas igrejas. Por favor, selecione de qual igreja você deseja consultar informações:

`;
    
    userChurches.forEach((church, index) => {
      response += `${index + 1}. ${church.churchName}\n`;
    });
    
    response += `\n📝 Digite o número da igreja desejada.`;
    
    // Salvar estado para aguardar seleção de igreja
    userStates.set(phoneNumber, {
      state: STATES.WAITING_CHURCH_SELECTION,
      churches: userChurches
    });
    
    return response;
  } catch (error) {
    console.error(`❌ Erro ao buscar igrejas do usuário:`, error);
    return `❌ Ocorreu um erro ao buscar suas informações. Tente novamente em alguns instantes.`;
  }
}

// Manipular seleção de igreja (quando usuário tem múltiplas igrejas)
async function handleChurchSelection(phoneNumber, messageText, user, userState) {
  const selection = parseInt(messageText);
  
  if (isNaN(selection) || selection < 1 || selection > userState.churches.length) {
    return `❌ Seleção inválida. 

Digite um número entre 1 e ${userState.churches.length}.`;
  }
  
  const selectedChurch = userState.churches[selection - 1];
  
  // Atualizar estado para igreja selecionada
  userStates.set(phoneNumber, {
    state: STATES.CHURCH_SELECTED,
    selectedChurch: selectedChurch,
    hasMultipleChurches: userState.churches.length > 1
  });
  
  return `🏛️ *${selectedChurch.churchName}*

${getMainMenu()}`;
}

// Manipular comandos do menu (após igreja selecionada)
async function handleMenuCommands(phoneNumber, messageText, user, userState) {
  const command = messageText.toLowerCase();
  const selectedChurch = userState.selectedChurch;
  const hasMultipleChurches = userState.hasMultipleChurches;
  
  console.log(`🎯 Comando recebido: "${command}"`);
  console.log(`🏛️ Igreja selecionada:`, selectedChurch?.churchName);
  console.log(`📊 ChurchInfo disponível:`, !!selectedChurch?.churchInfo);
  
  // Debug: mostrar estrutura da churchInfo
  if (selectedChurch?.churchInfo) {
    console.log(`🔍 Chaves na churchInfo:`, Object.keys(selectedChurch.churchInfo));
  }
  
  switch (command) {
    case 'palavra do dia':
      return formatPalavraFoDia(selectedChurch.churchInfo, selectedChurch.churchName, hasMultipleChurches);
      
    case 'dias de culto':
      return formatDiasDeCulto(selectedChurch.churchInfo, selectedChurch.churchName, hasMultipleChurches);
      
    case 'endereço':
    case 'endereco':
      return formatEndereco(selectedChurch.churchInfo, selectedChurch.churchName, hasMultipleChurches);
      
    case 'contato':
      return formatContato(selectedChurch.churchInfo, selectedChurch.churchName, hasMultipleChurches);
      
    case 'ajuda':
    case 'menu':
      return `🏛️ *${selectedChurch.churchName}*

${getMainMenu()}`;
      
    case 'trocar igreja':
      // Só permitir se usuário tem múltiplas igrejas
      if (hasMultipleChurches) {
        // Limpar estado e voltar ao início
        userStates.delete(phoneNumber);
        return await handleInitialState(phoneNumber, messageText, user);
      } else {
        return `🏛️ *${selectedChurch.churchName}*

Você faz parte apenas desta igreja.

${getMainMenu()}`;
      }
      
    case 'debug':
      // Comando especial para debug (oculto)
      return `🔍 *Debug Info*
Igreja: ${selectedChurch?.churchName}
ChurchId: ${selectedChurch?.churchId}  
ChurchInfo: ${selectedChurch?.churchInfo ? 'Disponível' : 'NULL'}
${selectedChurch?.churchInfo ? `Chaves: ${Object.keys(selectedChurch.churchInfo).join(', ')}` : ''}`;
      
    default:
      return `🏛️ *${selectedChurch.churchName}*

${getMainMenu()}

⚠️ Comando não reconhecido: "${messageText}"
Digite exatamente um dos comandos listados acima.

${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  }
}

// Formatar palavra do dia
function formatPalavraFoDia(churchInfo, churchName = null, hasMultipleChurches = false) {
  console.log(`📖 formatPalavraFoDia chamado com:`, {
    churchInfo: !!churchInfo,
    churchName,
    phraseOfDay: churchInfo?.phraseOfDay ? 'Disponível' : 'Não disponível'
  });
  
  if (!churchInfo) {
    return `❌ Informações da igreja não disponíveis no momento.

Para ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  }
  
  let response = `📖 *Palavra do Dia*\n`;
  response += `🏛️ *${churchName || churchInfo.name || 'Igreja'}*\n\n`;
  
  if (churchInfo.phraseOfDay) {
    response += `${churchInfo.phraseOfDay}\n\n`;
  } else if (churchInfo.phrase) {
    // Fallback para o campo 'phrase' se phraseOfDay não estiver disponível
    response += `${churchInfo.phrase}\n\n`;
  } else {
    response += `❌ Palavra do dia não disponível no momento.\n\n`;
  }
  
  response += `Para ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  
  return response;
}

// Formatar dias de culto
function formatDiasDeCulto(churchInfo, churchName = null, hasMultipleChurches = false) {
  if (!churchInfo) {
    return `❌ Informações da igreja não disponíveis no momento.

Para ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  }
  
  let response = `📅 *Dias de Culto*\n`;
  response += `🏛️ *${churchName || churchInfo.name || 'Igreja'}*\n\n`;
  
  if (churchInfo.worshipSchedule) {
    const schedule = churchInfo.worshipSchedule;
    const dayNames = {
      'sunday': 'Domingo',
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira', 
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado'
    };
    
    let hasSchedule = false;
    Object.entries(schedule).forEach(([day, services]) => {
      if (services && services.length > 0) {
        hasSchedule = true;
        response += `🗓️ *${dayNames[day]}:*\n`;
        services.forEach(service => {
          response += `• ${service.name} - ${service.time}`;
          if (service.minister) {
            response += ` (${service.minister})`;
          }
          response += `\n`;
        });
        response += `\n`;
      }
    });
    
    if (!hasSchedule) {
      response += `❌ Dias de culto não disponíveis no momento.\n\n`;
    }
  } else {
    response += `❌ Dias de culto não disponíveis no momento.\n\n`;
  }
  
  if (churchInfo.address) {
    const addressText = Array.isArray(churchInfo.address) 
      ? churchInfo.address.join(', ') 
      : churchInfo.address;
    response += `📍 *Endereço:* ${addressText}\n\n`;
  }
  
  response += `Para ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  
  return response;
}

// Formatar endereço
function formatEndereco(churchInfo, churchName = null, hasMultipleChurches = false) {
  if (!churchInfo) {
    return `❌ Informações da igreja não disponíveis no momento.

Para ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  }
  
  let response = `📍 *Endereço*\n`;
  response += `🏛️ *${churchName || churchInfo.name || 'Igreja'}*\n\n`;
  
  if (churchInfo.address) {
    if (Array.isArray(churchInfo.address)) {
      churchInfo.address.forEach(line => {
        response += `${line}\n`;
      });
    } else {
      response += `${churchInfo.address}\n`;
    }
    
    if (churchInfo.cep) {
      response += `CEP: ${churchInfo.cep}\n`;
    }
    response += `\n`;
  } else {
    response += `❌ Endereço não disponível no momento.\n\n`;
  }
  
  response += `Para ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  
  return response;
}

// Formatar contato
function formatContato(churchInfo, churchName = null, hasMultipleChurches = false) {
  if (!churchInfo) {
    return `❌ Informações da igreja não disponíveis no momento.

Para ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  }
  
  let response = `📞 *Contato*\n`;
  response += `🏛️ *${churchName || churchInfo.name || 'Igreja'}*\n\n`;
  
  if (churchInfo.phone) {
    response += `📱 *Telefone:* ${churchInfo.phone}\n`;
  }
  
  if (churchInfo.email) {
    response += `📧 *E-mail:* ${churchInfo.email}\n`;
  }
  
  if (churchInfo.pixKey) {
    response += `💰 *PIX:* ${churchInfo.pixKey}\n`;
  }
  
  if (churchInfo.phrase) {
    response += `\n💬 *Mensagem da Igreja:*\n${churchInfo.phrase}\n`;
  }
  
  if (!churchInfo.phone && !churchInfo.email && !churchInfo.pixKey) {
    response += `❌ Informações de contato não disponíveis no momento.\n`;
  }
  
  response += `\nPara ver o menu novamente, digite "Menu".
${hasMultipleChurches ? '💡 Digite "Trocar igreja" para selecionar outra igreja.' : ''}`;
  
  return response;
}

module.exports = {
  processMessage,
  getMainMenu,
  userStates,
  STATES
};