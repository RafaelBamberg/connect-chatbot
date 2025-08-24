const { initializeApp } = require("firebase/app");
const { getDatabase, connectDatabaseEmulator } = require("firebase/database");
const { getAuth } = require("firebase/auth");

// Firebase configuration - load from .env file for security
const firebaseConfig = {
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTHDOMAIN,
  projectId: process.env.FIREBASE_PROJECTID,
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID,
  appId: process.env.FIREBASE_APPID,
  measurementId: process.env.FIREBASE_MEASUREMENTID,
  // Configuração correta da URL do Realtime Database
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECTID}-default-rtdb.firebaseio.com/`,
};

// Validar configuração antes de inicializar
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Erro: Configuração do Firebase incompleta. Verifique o arquivo .env");
  process.exit(1);
}

let app, db, auth;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
  
  console.log("✅ Firebase inicializado com sucesso");
  console.log(`🔗 Database URL: ${firebaseConfig.databaseURL}`);
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error.message);
  console.log("💡 Verifique se:");
  console.log("   - O projeto Firebase existe");
  console.log("   - O Realtime Database está habilitado");
  console.log("   - As credenciais estão corretas no arquivo .env");
}

module.exports = { db, auth };
