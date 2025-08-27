const moment = require("moment");
const { client } = require("../whatsappClient");
const { getUpcomingEvents, getAllChurchMembers } = require("../config/database");

async function sendEventNotifications() {
  try {
    console.log("📅 Iniciando verificação de eventos próximos...");
    
    // Buscar eventos dos próximos 7 dias
    const upcomingEvents = await getUpcomingEvents(7);
    
    if (upcomingEvents.length === 0) {
      console.log("📋 Nenhum evento próximo encontrado");
      return;
    }

    console.log(`🔍 Encontrados ${upcomingEvents.length} eventos próximos`);
    
    for (const event of upcomingEvents) {
      console.log(`📅 Processando evento: ${event.title} da igreja ${event.churchId}`);
      
      // Buscar membros da igreja do evento
      const members = await getAllChurchMembers(event.churchId);
      
      if (members.length === 0) {
        console.log(`⚠️ Nenhum membro encontrado para igreja ${event.churchId}`);
        continue;
      }

      // Criar mensagem do evento
      const eventMessage = createEventMessage(event);
      
      // Enviar para todos os membros da igreja
      await sendEventToMembers(members, eventMessage, event.title);
      
      // Adicionar delay entre diferentes eventos
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
  } catch (error) {
    console.error("❌ Erro ao enviar notificações de eventos:", error.message);
  }
}

function createEventMessage(event) {
  const eventDate = moment(event.startDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
  const endDate = event.endDate ? moment(event.endDate, 'DD/MM/YYYY').format('DD/MM/YYYY') : null;
  
  let message = `📅 *Evento Especial da Igreja!* 📅

🎉 *${event.title}*

📝 *Descrição:* ${event.description || 'Evento especial da nossa igreja'}

📅 *Data de Início:* ${eventDate}`;

  if (endDate && endDate !== eventDate) {
    message += `\n📅 *Data de Término:* ${endDate}`;
  }

  if (event.eventPrice) {
    message += `\n💰 *Investimento:* ${event.eventPrice}`;
  }

  if (event.contact) {
    message += `\n📞 *Contato:* ${event.contact}`;
  }

  message += `\n\n✨ Não perca esta oportunidade de comunhão e crescimento espiritual!

💒 *"Quão bom e quão suave é que os irmãos vivam em união!"*
(Salmos 133:1)

🙏 Esperamos você lá! Deus abençoe!`;

  return message;
}

async function sendEventToMembers(members, eventMessage, eventTitle) {
  const sentMessages = [];
  
  for (const member of members) {
    if (member.phone) {
      const chatId = `${member.phone}@c.us`;
      try {
        // Delay entre mensagens para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await client.sendMessage(chatId, eventMessage);
        console.log(`✅ Notificação de evento enviada para ${member.name}`);
        sentMessages.push(member);
        
      } catch (error) {
        console.error(`❌ Erro ao enviar notificação para ${member.name}:`, error.message);
      }
    }
  }
  
  if (sentMessages.length > 0) {
    console.log(`📅 ${sentMessages.length} notificações do evento "${eventTitle}" enviadas com sucesso`);
  }
}

// Função para enviar eventos manualmente para uma igreja específica
async function sendEventsToChurch(churchId) {
  try {
    console.log(`📅 Enviando eventos para igreja ${churchId}...`);
    
    const upcomingEvents = await getUpcomingEvents(30); // próximos 30 dias
    const churchEvents = upcomingEvents.filter(event => event.churchId === churchId);
    
    if (churchEvents.length === 0) {
      console.log(`📋 Nenhum evento encontrado para igreja ${churchId}`);
      return;
    }

    const members = await getAllChurchMembers(churchId);
    
    for (const event of churchEvents) {
      const eventMessage = createEventMessage(event);
      await sendEventToMembers(members, eventMessage, event.title);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
  } catch (error) {
    console.error("❌ Erro ao enviar eventos para igreja:", error.message);
  }
}

module.exports = {
  sendEventNotifications,
  sendEventsToChurch
};
