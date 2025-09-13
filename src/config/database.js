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

// Função para buscar um usuário pelo número de telefone
async function getUserByPhone(phone) {
  if (!phone || !db) {
    return null;
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log(`🔍 Buscando usuário pelo telefone: ${normalizedPhone}`);
    
    // Buscar em todas as igrejas
    const refMembers = ref(db, 'members');
    const snapshot = await get(refMembers);
    
    if (snapshot.exists()) {
      const churchesData = snapshot.val();
      
      for (const [churchId, members] of Object.entries(churchesData)) {
        for (const [memberId, member] of Object.entries(members)) {
          if (normalizePhoneNumber(member.phone) === normalizedPhone) {
            console.log(`✅ Usuário encontrado na igreja ${churchId}`);
            return {
              ...member,
              memberId,
              churchId,
              phone: normalizedPhone
            };
          }
        }
      }
    }
    
    console.log(`❌ Usuário não encontrado para o telefone: ${normalizedPhone}`);
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar usuário:", error.message);
    return null;
  }
}

// Função para buscar todas as igrejas que um usuário faz parte
async function getUserChurches(phone) {
  if (!phone || !db) {
    return [];
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log(`🔍 Buscando igrejas do usuário: ${normalizedPhone}`);
    
    const userChurches = [];
    const refMembers = ref(db, 'members');
    const snapshot = await get(refMembers);
    
    if (snapshot.exists()) {
      const churchesData = snapshot.val();
      
      for (const [churchId, members] of Object.entries(churchesData)) {
        for (const [memberId, member] of Object.entries(members)) {
          if (normalizePhoneNumber(member.phone) === normalizedPhone) {
            console.log(`✅ Usuário encontrado na igreja ${churchId}, membro ID: ${memberId}`);
            // Buscar informações da igreja
            const churchInfo = await getChurchInfo(churchId);
            console.log(`🏛️ Informações da igreja ${churchId}:`, churchInfo ? 'Encontradas' : 'NÃO encontradas');
            userChurches.push({
              churchId,
              churchName: churchInfo?.name || `Igreja ${churchId}`,
              churchInfo,
              memberInfo: {
                ...member,
                memberId,
                phone: normalizedPhone
              }
            });
          }
        }
      }
    }
    
    console.log(`✅ Encontradas ${userChurches.length} igrejas para o usuário`);
    return userChurches;
  } catch (error) {
    console.error("❌ Erro ao buscar igrejas do usuário:", error.message);
    return [];
  }
}

// Função para buscar informações de uma igreja específica
async function getChurchInfo(churchId) {
  if (!churchId || !db) {
    console.log(`❌ getChurchInfo: churchId ou db inválido - churchId: ${churchId}, db: ${!!db}`);
    return null;
  }

  try {
    console.log(`🔍 Buscando informações da igreja: ${churchId}`);
    
    // Lista de caminhos possíveis para buscar a igreja
    const searchPaths = [
      churchId,                    // Diretamente pelo ID
      `churches/${churchId}`,      // Em uma coleção churches
      `church/${churchId}`,        // Em uma coleção church (singular)
      `igrejas/${churchId}`,       // Em português
      `${churchId}/info`,          // Info dentro do ID
      `${churchId}/church`         // Church dentro do ID
    ];
    
    for (const path of searchPaths) {
      console.log(`🔍 Tentando caminho: ${path}`);
      const refChurch = ref(db, path);
      const snapshot = await get(refChurch);
      
      if (snapshot.exists()) {
        const churchData = snapshot.val();
        console.log(`✅ Igreja encontrada no caminho: ${path}`);
        console.log(`📊 Nome da igreja: ${churchData.name || 'Nome não disponível'}`);
        console.log(`📊 Chaves disponíveis:`, Object.keys(churchData));
        return churchData;
      } else {
        console.log(`❌ Não encontrado em: ${path}`);
      }
    }
    
    // Se não encontrou, fazer uma busca mais ampla
    console.log(`🔍 Fazendo busca ampla no Firebase...`);
    const rootRef = ref(db, '/');
    const rootSnapshot = await get(rootRef);
    
    if (rootSnapshot.exists()) {
      const rootData = rootSnapshot.val();
      console.log(`🔍 Chaves disponíveis no nível raiz:`, Object.keys(rootData));
      
      // Procurar recursivamente pela igreja
      for (const [key, value] of Object.entries(rootData)) {
        if (typeof value === 'object' && value !== null) {
          // Se o valor é um objeto, verificar se tem informações de igreja
          if (value.name && (key === churchId || key.includes(churchId))) {
            console.log(`🎯 Igreja encontrada em: ${key}`);
            return value;
          }
          
          // Verificar se há uma subchave com o churchId
          if (value[churchId]) {
            console.log(`🎯 Igreja encontrada em: ${key}/${churchId}`);
            return value[churchId];
          }
        }
      }
      
      // Última tentativa: procurar por qualquer objeto que tenha o nome da igreja
      for (const [key, value] of Object.entries(rootData)) {
        if (typeof value === 'object' && value !== null && value.name && value.id === churchId) {
          console.log(`🎯 Igreja encontrada por ID em: ${key}`);
          return value;
        }
      }
    }
    
    console.log(`❌ Igreja ${churchId} não encontrada em nenhum lugar`);
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar informações da igreja:", error.message);
    return null;
  }
}

module.exports = {
  getAllChurchMembers,
  getUserByPhone,
  getUserChurches,
  getChurchInfo,
};
