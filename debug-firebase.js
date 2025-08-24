const { ref, get, query } = require("firebase/database");
const { db } = require("./src/config/firebaseConfig");

async function debugFirebase() {
  console.log("🔍 Debugando estrutura do Firebase...");
  
  try {
    // Primeiro, vamos ver a estrutura na raiz
    console.log("\n1. Verificando estrutura na raiz:");
    const refRoot = query(ref(db, "/"));
    const rootSnapshot = await get(refRoot);
    
    if (rootSnapshot.exists()) {
      const rootData = rootSnapshot.val();
      console.log("📁 Pastas na raiz:", Object.keys(rootData));
    }
    
    // Agora vamos verificar especificamente a pasta visitors
    console.log("\n2. Verificando pasta 'visitors':");
    const refVisitors = query(ref(db, "visitors"));
    const visitorsSnapshot = await get(refVisitors);
    
    if (visitorsSnapshot.exists()) {
      const visitorsData = visitorsSnapshot.val();
      console.log("📁 IDs de igreja encontrados:", Object.keys(visitorsData));
      
      // Vamos ver os dados do primeiro ID de igreja
      const firstChurchId = Object.keys(visitorsData)[0];
      console.log(`\n3. Dados da igreja ${firstChurchId}:`);
      
      const churchData = visitorsData[firstChurchId];
      if (churchData && typeof churchData === 'object') {
        const visitors = Object.values(churchData);
        console.log(`👥 Visitantes encontrados: ${visitors.length}`);
        
        visitors.forEach((visitor, index) => {
          if (visitor && visitor.name) {
            console.log(`${index + 1}. ${visitor.name} - Aniversário: ${visitor.dateOfBirthday || 'N/A'} - Telefone: ${visitor.phone || 'N/A'}`);
          }
        });
      }
    } else {
      console.log("❌ Pasta 'visitors' não encontrada");
    }
    
  } catch (error) {
    console.error("❌ Erro ao debugar Firebase:", error.message);
  }
  
  process.exit(0);
}

debugFirebase();
