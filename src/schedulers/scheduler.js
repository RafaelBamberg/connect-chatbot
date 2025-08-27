const moment = require("moment");
const { checkBirthdays } = require("./birthdayService");
const { checkVisitors } = require("./visitorService");
const { sendEventNotifications } = require("./eventService");

let dailyCheckInterval;
let hasRunToday = false;

function startDailyTasks() {
  console.log("🕘 Iniciando sistema automático de monitoramento...");
  console.log("⏰ Verificações programadas para às 9:00 da manhã");
  
  // Verificar se já é 9h ou passou e ainda não executou hoje
  const now = moment();
  if (now.hour() >= 9 && !hasRunToday) {
    console.log("🚀 Executando verificação inicial (já passou das 9h)...");
    setTimeout(async () => {
      await runDailyChecks();
    }, 2000);
  }

  // Configurar verificação a cada minuto para checar se chegou às 9h
  dailyCheckInterval = setInterval(async () => {
    const currentTime = moment();
    
    // Verificar se é 9h da manhã e ainda não executou hoje
    if (currentTime.hour() === 9 && currentTime.minute() === 0 && !hasRunToday) {
      console.log(`⏰ Hora da verificação diária - ${currentTime.format('DD/MM/YYYY HH:mm')}`);
      await runDailyChecks();
    }
    
    // Reset do flag às 00:00 para permitir execução no próximo dia
    if (currentTime.hour() === 0 && currentTime.minute() === 0) {
      hasRunToday = false;
      console.log("🌅 Novo dia iniciado - verificações resetadas");
    }
  }, 60000); // Verificar a cada minuto

  console.log("✅ Sistema de monitoramento automático iniciado!");
  console.log("🔄 Verificações diárias às 9:00");
}

async function runDailyChecks() {
  try {
    console.log("🎂 Verificando aniversariantes do dia...");
    await checkBirthdays();
    
    console.log("👥 Verificando visitantes recentes...");
    await checkVisitors();
    
    console.log("📅 Verificando eventos próximos...");
    await sendEventNotifications();
    
    hasRunToday = true;
    console.log("✅ Verificação diária concluída!");
  } catch (error) {
    console.error("❌ Erro na verificação diária:", error.message);
  }
}

function stopDailyTasks() {
  if (dailyCheckInterval) {
    clearInterval(dailyCheckInterval);
    console.log("⏹️ Sistema de monitoramento automático parado");
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido sinal de interrupção. Desconectando...');
  stopDailyTasks();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido sinal de término. Desconectando...');
  stopDailyTasks();
  process.exit(0);
});

module.exports = {
  startDailyTasks,
  stopDailyTasks,
  runDailyChecks
};
