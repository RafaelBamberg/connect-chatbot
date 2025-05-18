const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
require('dotenv').config();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Gera QR Code
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Scan it with your WhatsApp!');
});

client.on('ready', () => {
    console.log('Client is ready!');
    startDailyTasks();
});

client.on('message', async (message) => {
    if (message.body.startsWith('!')) {
        const command = message.body.slice(1).toLowerCase();
        handleCommand(message, command);
    }
});

async function handleCommand(message, command) {
    switch (command) {
        case 'menu':
            const menuText = `
*Menu de Opções*
1️⃣ - Informações sobre a Igreja
2️⃣ - Horários dos Cultos
3️⃣ - Produtos Disponíveis
4️⃣ - Falar com um Pastor
5️⃣ - Visitar a Igreja

Digite o número da opção desejada.
            `;
            await message.reply(menuText);
            break;

        case '1':
            await message.reply('Nossa igreja está localizada em [Endereço]. Somos uma comunidade acolhedora e dedicada ao serviço de Deus.');
            break;

        case '2':
            await message.reply('*Horários dos Cultos*\nDomingo: 10h e 19h\nQuarta-feira: 19h30\nSábado: 19h');
            break;

        case '3':
            const productsText = `
*Produtos Disponíveis*
📚 Bíblias
🎵 CDs de Louvor
📖 Livros Cristãos
🎁 Kits de Presentes

Para mais informações sobre algum produto, digite o nome do produto.
            `;
            await message.reply(productsText);
            break;

        case '4':
            await message.reply('Para falar com um pastor, por favor, envie seu nome e horário preferido para contato. Um pastor entrará em contato em breve.');
            break;

        case '5':
            await message.reply('Ficaremos felizes em recebê-lo! Por favor, envie seu nome e horário preferido para visita. Entraremos em contato para confirmar.');
            break;

        default:
            await message.reply('Comando não reconhecido. Digite !menu para ver as opções disponíveis.');
    }
}

function startDailyTasks() {
    setInterval(async () => {
        const now = moment();
        if (now.hours() === 9 && now.minutes() === 0) {
            await checkBirthdays();
            await checkVisitors();
        }
    }, 60000);
}

// Adicionar lógica para verificar aniversariantes (Incompleto)
async function checkBirthdays() {
    const birthdays = [];
    for (const person of birthdays) {
        const message = `Olá ${person.name}! Desejamos um feliz aniversário! Que Deus continue abençoando sua vida. 🎉🎂`;
    }
}

// Adicionar lógica para verificar visitantes (Incompleto)
async function checkVisitors() {
    const visitors = [];
    for (const visitor of visitors) {
        const message = `Olá ${visitor.name}! Foi um prazer tê-lo em nosso culto. Esperamos vê-lo novamente em breve! 🙏`;
    }
}

client.initialize(); 