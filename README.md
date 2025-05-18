# Connect Chatbot - WhatsApp Bot para Gerenciamento de Igreja

Este é um chatbot para WhatsApp desenvolvido para auxiliar no gerenciamento e comunicação da sua igreja.

## Funcionalidades

- Menu interativo com opções para informações da igreja
- Sistema de envio automático de mensagens para:
  - Aniversariantes
  - Visitantes
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
