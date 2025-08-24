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
  getTodayBirthdays,
  getRecentVisitors,
};
