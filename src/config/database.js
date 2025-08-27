const { ref, get, query } = require("firebase/database");
const { db } = require("./firebaseConfig");

// Verificar se o Firebase foi inicializado corretamente
if (!db) {
  console.error("❌ Database não inicializado. Verificando configuração do Firebase...");
}

async function getUser(accessToken) {
  if (!accessToken) {
    console.log("⚠️ Access token não fornecido");
    return null;
  }

  if (!db) {
    console.error("❌ Erro: Database não está disponível");
    return null;
  }

  try {
    const refUsers = query(ref(db, "users"));
    const snapshot = await get(refUsers);

    if (snapshot.exists()) {
      const users = Object.values(snapshot.val()).filter(
        (user) => user.accessToken === accessToken
      );
      return users.length > 0 ? users : null;
    } else {
      console.log("📋 Nenhum dado de usuários disponível");
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao obter dados do usuário:", error.message);
    return null;
  }
}

async function getTodayBirthdays() {
  if (!db) {
    console.error("❌ Erro: Database não está disponível para buscar aniversariantes");
    return [];
  }

  try {
    // Buscar na pasta 'visitors' do Firebase
    const refVisitors = query(ref(db, "visitors"));
    const snapshot = await get(refVisitors);

    if (snapshot.exists()) {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1; // Janeiro = 1, Dezembro = 12

      const visitorsData = snapshot.val();
      let allPeople = [];

      Object.keys(visitorsData).forEach(churchId => {
        const churchData = visitorsData[churchId];
        if (churchData && typeof churchData === 'object') {
          Object.values(churchData).forEach(person => {
            if (person && typeof person === 'object' && person.dateOfBirthday) {
              allPeople.push(person);
            }
          });
        }
      });

      const birthdays = allPeople.filter((person) => {
        if (!person.dateOfBirthday) return false;

        const parts = person.dateOfBirthday.split("/");
        if (parts.length !== 3) return false;

        const userDay = parseInt(parts[0], 10);
        const userMonth = parseInt(parts[1], 10);

        console.log(`👤 ${person.name}: ${userDay}/${userMonth} vs hoje: ${day}/${month}`);

        return userDay === day && userMonth === month;
      });

      return birthdays.map(person => ({
        ...person,
        phone: formatPhoneNumber(person.phone)
      }));
    } else {
      console.log("📋 Nenhum dado de aniversariantes disponível");
      return [];
    }
  } catch (error) {
    console.error("❌ Erro ao obter aniversariantes:", error.message);
    return [];
  }
}

async function getRecentVisitors(daysAgo = 7) {
  if (!db) {
    console.error("❌ Erro: Database não está disponível para buscar visitantes");
    return [];
  }

  try {
    // Buscar na pasta 'visitors' do Firebase
    const refVisitors = query(ref(db, "visitors"));
    const snapshot = await get(refVisitors);

    if (snapshot.exists()) {
      const today = new Date();
      const cutoffDate = new Date(today);
      cutoffDate.setDate(today.getDate() - daysAgo);

      const visitorsData = snapshot.val();
      let allPeople = [];

      Object.keys(visitorsData).forEach(churchId => {
        const churchData = visitorsData[churchId];
        if (churchData && typeof churchData === 'object') {
          Object.values(churchData).forEach(person => {
            if (person && typeof person === 'object' && person.visitDate) {
              allPeople.push(person);
            }
          });
        }
      });

      console.log(`🔍 Verificando ${allPeople.length} pessoas para visitantes recentes`);

      const visitors = allPeople.filter((visitor) => {
        if (!visitor.visitDate) return false;

        const visitDate = new Date(visitor.visitDate);
        const isRecent = visitDate >= cutoffDate && visitDate <= today;
        
        console.log(`👤 ${visitor.name}: visitou em ${visitDate.toLocaleDateString()} - recente: ${isRecent}`);
        
        return isRecent;
      });

      return visitors.map(visitor => ({
        ...visitor,
        phone: formatPhoneNumber(visitor.phone)
      }));
    } else {
      console.log("📋 Nenhum visitante disponível");
      return [];
    }
  } catch (error) {
    console.error("❌ Erro ao obter visitantes:", error.message);
    return [];
  }
}

async function getUserByPhone(phoneNumber) {
  if (!phoneNumber) {
    console.log("⚠️ Número de telefone não fornecido");
    return null;
  }

  if (!db) {
    console.error("❌ Erro: Database não está disponível");
    return null;
  }

  try {
    // Extrair número limpo do WhatsApp (remove @c.us)
    const cleanPhone = phoneNumber.replace('@c.us', '');
    console.log(`🔍 Buscando usuário com telefone: ${cleanPhone}`);

    // Buscar em visitors
    const refVisitors = query(ref(db, "visitors"));
    const snapshot = await get(refVisitors);

    if (snapshot.exists()) {
      const visitorsData = snapshot.val();
      let userFound = null;

      // Procurar em todas as igrejas
      Object.keys(visitorsData).forEach(churchId => {
        const churchData = visitorsData[churchId];
        if (churchData && typeof churchData === 'object') {
          Object.values(churchData).forEach(person => {
            if (person && typeof person === 'object' && person.phone) {
              const personPhone = formatPhoneNumber(person.phone);
              if (personPhone === cleanPhone || person.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) {
                userFound = {
                  ...person,
                  churchId: churchId,
                  phone: personPhone
                };
              }
            }
          });
        }
      });

      if (userFound) {
        console.log(`✅ Usuário encontrado: ${userFound.name}`);
        return userFound;
      }
    }

    console.log("❌ Usuário não encontrado no banco de dados");
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar usuário por telefone:", error.message);
    return null;
  }
}

async function getUserChurches(phoneNumber) {
  if (!phoneNumber || !db) {
    return [];
  }

  try {
    const cleanPhone = phoneNumber.replace('@c.us', '');
    const refVisitors = query(ref(db, "visitors"));
    const snapshot = await get(refVisitors);

    if (snapshot.exists()) {
      const visitorsData = snapshot.val();
      const userChurches = [];

      Object.keys(visitorsData).forEach(churchId => {
        const churchData = visitorsData[churchId];
        if (churchData && typeof churchData === 'object') {
          Object.values(churchData).forEach(person => {
            if (person && typeof person === 'object' && person.phone) {
              const personPhone = formatPhoneNumber(person.phone);
              if (personPhone === cleanPhone || person.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) {
                userChurches.push({
                  churchId: churchId,
                  churchName: churchId, // Você pode mapear para nomes reais se necessário
                  userData: person
                });
              }
            }
          });
        }
      });

      return userChurches;
    }

    return [];
  } catch (error) {
    console.error("❌ Erro ao buscar igrejas do usuário:", error.message);
    return [];
  }
}

async function getChurchEvents(churchId) {
  if (!churchId || !db) {
    return [];
  }

  try {
    const refEvents = query(ref(db, `events/${churchId}`));
    const snapshot = await get(refEvents);

    if (snapshot.exists()) {
      const eventsData = snapshot.val();
      const events = Object.values(eventsData);
      
      console.log(`📅 Encontrados ${events.length} eventos para igreja ${churchId}`);
      return events;
    }

    return [];
  } catch (error) {
    console.error("❌ Erro ao buscar eventos da igreja:", error.message);
    return [];
  }
}

async function getAllChurchMembers(churchId) {
  if (!churchId || !db) {
    return [];
  }

  try {
    const refMembers = query(ref(db, `members/${churchId}`));
    const snapshot = await get(refMembers);

    if (snapshot.exists()) {
      const membersData = snapshot.val();
      const members = Object.values(membersData);
      
      console.log(`👥 Encontrados ${members.length} membros para igreja ${churchId}`);
      return members.map(member => ({
        ...member,
        phone: formatPhoneNumber(member.phone)
      }));
    }

    return [];
  } catch (error) {
    console.error("❌ Erro ao buscar membros da igreja:", error.message);
    return [];
  }
}

async function getUpcomingEvents(daysAhead = 7) {
  if (!db) {
    return [];
  }

  try {
    const refEvents = query(ref(db, "events"));
    const snapshot = await get(refEvents);

    if (snapshot.exists()) {
      const eventsData = snapshot.val();
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + daysAhead);

      let upcomingEvents = [];

      Object.keys(eventsData).forEach(churchId => {
        const churchEvents = eventsData[churchId];
        if (churchEvents && typeof churchEvents === 'object') {
          Object.values(churchEvents).forEach(event => {
            if (event && event.startDate) {
              const eventDate = moment(event.startDate, 'DD/MM/YYYY').toDate();
              if (eventDate >= today && eventDate <= futureDate) {
                upcomingEvents.push({
                  ...event,
                  churchId: churchId
                });
              }
            }
          });
        }
      });

      console.log(`📅 Encontrados ${upcomingEvents.length} eventos próximos`);
      return upcomingEvents;
    }

    return [];
  } catch (error) {
    console.error("❌ Erro ao buscar eventos próximos:", error.message);
    return [];
  }
}

async function getChurchInfo(churchId) {
  if (!churchId || !db) {
    return null;
  }

  try {
    const refChurch = query(ref(db, `church/${churchId}`));
    const snapshot = await get(refChurch);

    if (snapshot.exists()) {
      const churchData = snapshot.val();
      console.log(`⛪ Informações da igreja ${churchId} encontradas`);
      return churchData;
    }

    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar informações da igreja:", error.message);
    return null;
  }
}

function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  let cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }
  
  console.log(`📱 Telefone formatado: ${phone} -> ${cleanPhone}`);
  return cleanPhone;
}

module.exports = {
  getUser,
  getUserByPhone,
  getUserChurches,
  getTodayBirthdays,
  getRecentVisitors,
  getChurchEvents,
  getAllChurchMembers,
  getUpcomingEvents,
  getChurchInfo,
};
