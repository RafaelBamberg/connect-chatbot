connect-chatbot/
├─ .env
├─ package.json
└─ src/
   ├─ index.js          # Express + webhook verificação
   ├─ whatsapp.js       # Funções utilitárias (sendText, sendList…)
   ├─ menuHandler.js    # Lida com respostas do usuário
   ├─ campaigns/
   │   ├─ birthdays.js  # Workflow de aniversariantes
   │   └─ visitors.js   # Workflow de visitantes
   └─ scheduler.js      # Registro dos crons
