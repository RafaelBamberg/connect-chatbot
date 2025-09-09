const { ref, get, query } = require("firebase/database");
const { db } = require("./firebaseConfig");

// Função para normalizar números de telefone brasileiros (importada)
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove todos os caracteres não numéricos
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Se não começar com 55 (código do Brasil), adiciona
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }
  
  // Para números brasileiros
  if (cleanPhone.startsWith('55')) {
    // Extrai o código do país (55)
    const countryCode = cleanPhone.substring(0, 2);
    const rest = cleanPhone.substring(2);
    
    if (rest.length >= 10) {
      const areaCode = rest.substring(0, 2);
      let phoneNumber = rest.substring(2);
      
      // CORREÇÃO ESPECÍFICA: Se tem 11 dígitos (13 total) e começa com 9, remove o primeiro 9
      if (cleanPhone.length === 13 && phoneNumber.startsWith('9')) {
        phoneNumber = phoneNumber.substring(1); // Remove o primeiro 9
        console.log(`🔧 Removendo 9 extra: ${cleanPhone} -> ${countryCode + areaCode + phoneNumber}`);
      }
      // Se tem 10 dígitos e começa com 99, remove o primeiro 9
      else if (phoneNumber.length === 10 && phoneNumber.startsWith('99')) {
        phoneNumber = phoneNumber.substring(1);
        console.log(`🔧 Removendo 9 duplicado: ${cleanPhone} -> ${countryCode + areaCode + phoneNumber}`);
      }
      
      cleanPhone = countryCode + areaCode + phoneNumber;
    }
  }
  
  console.log(`📱 Número normalizado: ${phone} -> ${cleanPhone}`);
  return cleanPhone;
}

// Verificar se o Firebase foi inicializado corretamente
if (!db) {
  console.error("❌ Database não inicializado. Verificando configuração do Firebase...");
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
        phone: normalizePhoneNumber(member.phone)
      }));
    }

    return [];
  } catch (error) {
    console.error("❌ Erro ao buscar membros da igreja:", error.message);
    return [];
  }
}

module.exports = {
  getAllChurchMembers,
};
