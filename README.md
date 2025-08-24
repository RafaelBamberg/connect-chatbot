# WhatsApp Bot Igreja - Connect Chatbot

Um bot WhatsApp avançado para igrejas com sistema de persistência de autenticação, mensagens automáticas para aniversariantes e visitantes.

## 🚀 Funcionalidades

- ✅ **Autenticação Persistente**: Uma vez autenticado, mantém a sessão ativa
- 🎂 **Mensagens Automáticas de Aniversário**: Envia felicitações automaticamente
- 👥 **Acompanhamento de Visitantes**: Mensagens automáticas para visitantes recentes
- 🤖 **Menu Interativo**: Sistema de comandos para informações da igreja
- 👨‍💼 **Painel Administrativo**: Comandos especiais para administradores
- 🔄 **Monitoramento Automático**: Verificações periódicas em tempo real

## 📁 Estrutura do Projeto

```
src/
├── index.js              # Arquivo principal - orquestra todos os módulos
├── whatsappClient.js      # Cliente WhatsApp e configurações de conexão
├── messageHandler.js      # Manipulação de mensagens e comandos
├── birthdayService.js     # Serviço de mensagens de aniversário
├── visitorService.js      # Serviço de mensagens para visitantes
├── scheduler.js           # Sistema de agendamento automático
├── database.js            # Funções de acesso ao Firebase
└── firebaseConfig.js      # Configuração do Firebase
```

## 🏗️ Arquitetura Modular

### `index.js` - Orquestrador Principal
- Importa e inicializa todos os módulos
- Configura os event listeners principais
- Ponto de entrada da aplicação

### `whatsappClient.js` - Cliente WhatsApp
- Configuração do cliente WhatsApp Web
- Autenticação persistente com LocalAuth
- Eventos de conexão e QR Code

### `messageHandler.js` - Gerenciador de Mensagens
- Processamento de comandos do usuário
- Menu interativo da igreja
- Comandos administrativos

### `birthdayService.js` - Serviço de Aniversários
- Verificação diária de aniversariantes
- Envio automático de mensagens de parabéns
- Formato: "Feliz Aniversario {nome} !"

### `visitorService.js` - Serviço de Visitantes
- Acompanhamento de visitantes recentes
- Mensagens automáticas de boas-vindas
- Formato: "Voce e foi cadastrado como visitante"

### `scheduler.js` - Agendador
- Sistema de verificações automáticas
- Controle de intervalos e timers
- Graceful shutdown

## 🔧 Configuração

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente (.env):**
```env
ADMIN_PHONE=5571999121838
FIREBASE_DATABASE_URL=https://connect-55d3b-default-rtdb.firebaseio.com/
```

3. **Executar:**
```bash
npm start
```

## 📱 Como Usar

### Para Usuários Comuns:
- Digite `menu` para ver as opções disponíveis
- Use números (1-5) para navegar pelo menu
- Comandos disponíveis: localização, horários, produtos, pastor, visita

### Para Administradores:
- Digite `admin` para acessar o painel administrativo
- Comandos especiais: `status`, `debug-data`, `test-birthdays`

## 🔄 Sistema Automático

O bot executa verificações automáticas a cada 30 segundos:
- **Aniversariantes**: Verifica nascimentos do dia atual
- **Visitantes**: Identifica visitantes dos últimos 7 dias
- **Mensagens**: Envia automaticamente sem intervenção manual

## 🗃️ Estrutura do Firebase

```
visitors/
├── {IGREJA_ID}/
│   ├── {VISITOR_ID}/
│   │   ├── name: "Nome do Visitante"
│   │   ├── phone: "(71) 99999-9999"
│   │   ├── dateOfBirthday: "24/08/2002"
│   │   ├── visitDate: "2025-08-24T09:47:32.524Z"
│   │   └── contacted: false
```

## 📊 Logs e Monitoramento

O sistema fornece logs detalhados:
- ✅ Conexões bem-sucedidas
- 📱 Mensagens enviadas
- ❌ Erros e falhas
- 🔍 Verificações automáticas
- 📊 Estatísticas de uso

## 🛠️ Tecnologias

- **Node.js**: Runtime JavaScript
- **whatsapp-web.js**: Integração com WhatsApp Web
- **Firebase**: Banco de dados em tempo real
- **Moment.js**: Manipulação de datas
- **dotenv**: Gerenciamento de variáveis de ambiente

## ✨ Funcionalidades

### 🔐 **Persistência de Autenticação**
- **Sessão persistente**: Uma vez autenticado, o bot mantém a sessão mesmo após reinicializações
- **Reconexão automática**: Em caso de desconexão, o bot tenta reconectar automaticamente
- **Verificação de sessão**: Detecta se existe uma sessão salva antes de solicitar QR code
- **Armazenamento local seguro**: Dados de sessão salvos localmente com segurança

### 💬 **Sistema de Menu Interativo**
- Menu principal com opções numeradas
- Informações sobre a igreja
- Horários dos cultos
- Produtos disponíveis
- Contato com pastores
- Agendamento de visitas

### 📅 **Tarefas Automatizadas**
- **Mensagens de aniversário**: Envio automático às 9h para aniversariantes do dia
- **Follow-up de visitantes**: Mensagens de acompanhamento para visitantes recentes
- **Rate limiting**: Delay entre mensagens para evitar bloqueios

### 🛡️ **Tratamento de Erros Robusto**
- Logs detalhados de erros
- Recuperação automática de falhas
- Graceful shutdown com limpeza adequada
- Fallback para casos de erro na comunicação
- Catálogo de produtos disponíveis
- Agendamento de visitas
- Contato com pastores

## Requisitos

- Node.js 14.x ou superior
- NPM (Node Package Manager)
- WhatsApp Web instalado no celular

## Instalação

 Instale as dependências:
```bash
npm install
```

Crie um arquivo `.env` na raiz do projeto:
```bash
cp .env.example .env
```

Configure as variáveis de ambiente no arquivo `.env` com as credenciais do Firebase:
```
FIREBASE_API_KEY=seu-api-key
FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
FIREBASE_APP_ID=seu-app-id
FIREBASE_MEASUREMENT_ID=seu-measurement-id
```

Inicie o bot:
```bash
npm start
```

Escaneie o QR Code que aparecerá no terminal com seu WhatsApp

## Como Usar

1. Envie `!menu` para ver todas as opções disponíveis
2. Digite o número da opção desejada (1-5)
3. Siga as instruções na tela

## Comandos Disponíveis

- `!menu` - Mostra o menu principal
- `1` - Informações sobre a Igreja
- `2` - Horários dos Cultos
- `3` - Produtos Disponíveis
- `4` - Falar com um Pastor
- `5` - Visitar a Igreja

## Personalização

Para personalizar as mensagens e funcionalidades:

1. Edite o arquivo `src/index.js`
2. As funções `checkBirthdays()` e `checkVisitors()` agora utilizam o Firebase para buscar dados
3. Ajuste os horários e mensagens conforme necessário

## Estrutura do Banco de Dados Firebase

O sistema espera a seguinte estrutura no Firebase Realtime Database:

### Usuários
```json
{
  "users": {
    "userId1": {
      "name": "Nome do Usuário",
      "phone": "5511999999999",
      "birthdate": "18/05/1990",
      "accessToken": "token-de-acesso-unico",
      "selectedChurch": "igreja-principal"
    }
  }
}
```

### Visitantes
```json
{
  "visitors": {
    "visitorId1": {
      "name": "Nome do Visitante",
      "phone": "5511999999999",
      "visitDate": "2025-05-15T10:00:00.000Z",
      "contacted": false
    }
  }
}
```

## Suporte

Para suporte ou dúvidas, entre em contato através de [seu-email].
