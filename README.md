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

1. Clone o repositório:
```bash
git clone [seu-repositorio]
cd connect-chatbot
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto:
```bash
touch .env
```

4. Inicie o bot:
```bash
node src/index.js
```

5. Escaneie o QR Code que aparecerá no terminal com seu WhatsApp

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
2. Modifique as funções `checkBirthdays()` e `checkVisitors()` para incluir sua lógica de dados
3. Ajuste os horários e mensagens conforme necessário

## Suporte

Para suporte ou dúvidas, entre em contato através de [seu-email].
