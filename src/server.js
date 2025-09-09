const express = require('express');
const cors = require('cors');
const { getAllChurchMembers } = require('./config/database');
const { client, getConnectionStatus, logout, clearSession, normalizePhoneNumber } = require('./whatsappClient');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting simples (controle de requisições por IP)
const rateLimitMap = new Map();

// Função para limpar completamente o rate limit
function clearRateLimit() {
  rateLimitMap.clear();
  console.log('🗑️ Rate limit limpo completamente');
}

function rateLimit(maxRequests = 10000, windowMs = 300000) { // 10000 requests per 5 minutes
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { requests: 1, resetTime: now + windowMs });
      console.log(`📊 Rate limit: Primeira requisição do IP ${ip}`);
      return next();
    }
    
    const userData = rateLimitMap.get(ip);
    
    if (now > userData.resetTime) {
      // Reset da janela de tempo
      userData.requests = 1;
      userData.resetTime = now + windowMs;
      console.log(`📊 Rate limit: Janela resetada para IP ${ip}`);
      return next();
    }
    
    if (userData.requests >= maxRequests) {
      const retryAfter = Math.ceil((userData.resetTime - now) / 1000);
      console.log(`⚠️ Rate limit atingido para IP ${ip}. Retry em ${retryAfter}s`);
      return res.status(429).json({
        success: false,
        message: `Muitas requisições. Limite: ${maxRequests} a cada ${windowMs/60000} minutos. Tente novamente em ${retryAfter} segundos.`,
        retryAfter: retryAfter
      });
    }
    
    userData.requests++;
    console.log(`📊 Rate limit: ${userData.requests}/${maxRequests} para IP ${ip}`);
    next();
  };
}

// Middleware básico
app.use(cors());
app.use(express.json());

// Rate limiting global (mais permissivo)
app.use(rateLimit(100, 60000)); // 100 requests por minuto para rotas gerais

// Função para enviar mensagem para todos os membros de uma igreja
async function sendMessageToAllMembers(churchId, message) {
  try {
    console.log(`📤 Enviando mensagem para todos os membros da igreja ${churchId}`);
    
    // Buscar todos os membros da igreja
    const members = await getAllChurchMembers(churchId);
    
    if (!members || members.length === 0) {
      console.log(`⚠️ Nenhum membro encontrado para a igreja ${churchId}`);
      return { success: false, message: 'Nenhum membro encontrado para esta igreja' };
    }

    console.log(`👥 Encontrados ${members.length} membros para enviar mensagem`);

    // Configurações para envio em lotes
    const BATCH_SIZE = 20; // Processar 20 membros por vez
    const DELAY_BETWEEN_MESSAGES = 500; // 0.5 segundos entre mensagens
    const DELAY_BETWEEN_BATCHES = 10000; // 10 segundos entre lotes

    const results = [];
    const totalBatches = Math.ceil(members.length / BATCH_SIZE);
    
    // Processar em lotes
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, members.length);
      const currentBatch = members.slice(startIndex, endIndex);
      
      console.log(`📦 Processando lote ${batchIndex + 1}/${totalBatches} (${currentBatch.length} membros)`);
      
      // Enviar mensagens do lote atual
      for (const member of currentBatch) {
        if (member.phone) {
          try {
            // Verificar se o cliente WhatsApp está conectado
            if (!client.info) {
              console.log('⚠️ Cliente WhatsApp não está conectado');
              return { success: false, message: 'Cliente WhatsApp não está conectado' };
            }

            // Normalizar o número de telefone
            const normalizedPhone = normalizePhoneNumber(member.phone);
            const chatId = normalizedPhone.includes('@c.us') ? normalizedPhone : `${normalizedPhone}@c.us`;
            
            await client.sendMessage(chatId, message);
            console.log(`✅ Mensagem enviada para ${member.name} (${normalizedPhone})`);
            
            results.push({
              name: member.name,
              phone: normalizedPhone,
              status: 'enviado'
            });
            
            // Delay entre mensagens (menor delay)
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
            
          } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para ${member.name}: ${error.message}`);
            const normalizedPhone = normalizePhoneNumber(member.phone);
            results.push({
              name: member.name,
              phone: normalizedPhone,
              status: 'erro',
              error: error.message
            });
          }
        } else {
          console.log(`⚠️ Membro ${member.name} não possui telefone cadastrado`);
          results.push({
            name: member.name,
            phone: 'não cadastrado',
            status: 'pulado'
          });
        }
      }
      
      // Delay maior entre lotes (exceto no último lote)
      if (batchIndex < totalBatches - 1) {
        console.log(`⏱️ Aguardando ${DELAY_BETWEEN_BATCHES/1000}s antes do próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Estatísticas finais
    const enviados = results.filter(r => r.status === 'enviado').length;
    const erros = results.filter(r => r.status === 'erro').length;
    const pulados = results.filter(r => r.status === 'pulado').length;
    
    console.log(`📊 Estatísticas finais: ${enviados} enviados, ${erros} erros, ${pulados} pulados`);

    return {
      success: true,
      message: `Mensagem processada para ${results.length} membros (${enviados} enviados, ${erros} erros, ${pulados} pulados)`,
      results: results,
      statistics: {
        total: results.length,
        sent: enviados,
        errors: erros,
        skipped: pulados,
        batchesProcessed: totalBatches
      }
    };

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para membros:', error.message);
    return { success: false, message: error.message };
  }
}

// Rota para enviar mensagem personalizada para todos os membros de uma igreja
app.post('/send-message', rateLimit(10, 300000), async (req, res) => { // 10 envios a cada 5 minutos
  try {
    const { churchId, message } = req.body;

    // Validações básicas
    if (!churchId) {
      return res.status(400).json({
        success: false,
        message: 'ID da igreja é obrigatório'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }

    // Verificar se o cliente WhatsApp está conectado
    if (!client.info) {
      return res.status(503).json({
        success: false,
        message: 'Cliente WhatsApp não está conectado'
      });
    }

    console.log(`📨 Recebida solicitação para enviar mensagem para igreja ${churchId}`);
    console.log(`📝 Mensagem: ${message}`);

    // Enviar mensagem para todos os membros
    const result = await sendMessageToAllMembers(churchId, message);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Erro na rota /send-message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota para verificar o status do WhatsApp (melhorada)
app.get('/status', (req, res) => {
  try {
    const connectionStatus = getConnectionStatus();
    const isConnected = client.info ? true : false;
    
    res.json({
      success: true,
      whatsappConnected: isConnected,
      connectionStatus: connectionStatus,
      clientInfo: isConnected ? {
        pushname: client.info.pushname,
        wid: client.info.wid._serialized,
        platform: client.info.platform
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      whatsappConnected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para fazer logout e limpar sessão
app.post('/logout', async (req, res) => {
  try {
    console.log('📝 Requisição de logout recebida');
    
    const result = await logout();
    
    if (result) {
      res.json({
        success: true,
        message: 'Logout realizado com sucesso. Sessão removida.',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer logout',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Erro na rota /logout:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para limpar sessão (sem logout formal)
app.post('/clear-session', (req, res) => {
  try {
    console.log('📝 Requisição para limpar sessão recebida');
    
    const result = clearSession();
    
    if (result) {
      res.json({
        success: true,
        message: 'Sessão removida. Reinicie o bot para escanear novo QR Code.',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        message: 'Nenhuma sessão encontrada para remover.',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Erro na rota /clear-session:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para limpar rate limit
app.post('/clear-rate-limit', (req, res) => {
  try {
    console.log('📝 Requisição para limpar rate limit recebida');
    
    clearRateLimit();
    
    res.json({
      success: true,
      message: 'Rate limit limpo com sucesso. Todos os IPs foram resetados.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro na rota /clear-rate-limit:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para limpar tudo (sessão + rate limit + cache)
app.post('/clear-all', async (req, res) => {
  try {
    console.log('📝 Requisição para limpar tudo recebida');
    
    // Limpar rate limit
    clearRateLimit();
    
    // Limpar sessão
    const sessionResult = clearSession();
    
    res.json({
      success: true,
      message: 'Limpeza completa realizada: Rate limit resetado, sessão removida. Reinicie o bot para começar fresh.',
      sessionCleared: sessionResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro na rota /clear-all:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Inicializar servidor
function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Express rodando na porta ${PORT}`);
    console.log(`🌐 Acessível via: http://localhost:${PORT} ou http://[SEU_IP]:${PORT}`);
    console.log(`📋 Endpoints disponíveis:`);
    console.log(`   POST /send-message - Enviar mensagem para todos os membros`);
    console.log(`   GET  /status - Status detalhado do WhatsApp`);
    console.log(`   POST /logout - Fazer logout e limpar sessão`);
    console.log(`   POST /clear-session - Limpar sessão local`);
    console.log(`   POST /clear-rate-limit - Limpar rate limit`);
    console.log(`   POST /clear-all - Limpar tudo (sessão + rate limit)`);
    console.log(`🔒 Rate Limiting configurado:`);
    console.log(`   Global: 10000 requests por 5 minutos`);
    console.log(`   /send-message: 10 requests a cada 5 minutos`);
    console.log(`📦 Envio em lotes:`);
    console.log(`   Tamanho do lote: 20 membros`);
    console.log(`   Delay entre mensagens: 0.5s`);
    console.log(`   Delay entre lotes: 10s`);
    console.log(`💾 Persistência de sessão ativa`);
  });
}

module.exports = {
  startServer,
  sendMessageToAllMembers
};
