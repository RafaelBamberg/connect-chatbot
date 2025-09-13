// Entry point para Vercel - Importa e exporta o app Express
require("dotenv").config();

// Configurar ambiente de produção
process.env.NODE_ENV = 'production';

// Importar e exportar o app Express configurado
const app = require('./src/index.js');

module.exports = app;