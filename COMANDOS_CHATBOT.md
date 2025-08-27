# 🤖 Documentação do Chatbot - Atualizada

## 🆕 Melhorias Implementadas

### 1. Sistema de Comandos Inteligente
- **Case-insensitive**: Funciona com maiúscula, minúscula ou misto
- **Sem acentos**: Aceita "aniversario" ou "aniversário"
- **Variações múltiplas**: Reconhece diferentes formas de escrever
- **Flexível**: Aceita comandos mesmo com palavras extras

### 2. Contato Personalizado das Igrejas
- **Informações reais**: Mostra dados das igrejas onde o usuário está filiado
- **Endereço completo**: CEP, rua, bairro
- **Telefones**: Números de contato específicos
- **Horários de culto**: Cronograma de atividades
- **Frases**: Mensagens especiais da igreja

## 📋 Comandos Disponíveis

| Comando Principal | Descrição | Variações Aceitas |
|------------------|-----------|-------------------|
| **Igrejas** | Mostra as igrejas que você está filiado | `igrejas`, `igreja` |
| **Perfil** | Exibe suas informações pessoais | `perfil`, `meu perfil`, `dados` |
| **Aniversário** | Mostra quando é seu aniversário | `aniversário`, `aniversario`, `niver`, `birthday` |
| **Última Visita** | Informa quando foi sua última visita | `última visita`, `ultima visita`, `visita`, `ultima` |
| **Eventos** | Mostra eventos próximos das suas igrejas | `eventos`, `evento` |
| **Contato** | Informações para entrar em contato | `contato`, `contatos`, `telefone`, `falar` |
| **Ajuda** | Mostra a lista de comandos | `ajuda`, `help`, `comandos`, `menu` |

## 🔄 Exemplos de Uso

### ✅ Todas essas variações funcionam:

**Para ver o perfil:**
- "Perfil"
- "perfil" 
- "PERFIL"
- "Meu Perfil"
- "meus dados"

**Para ver contato:**
- "Contato"
- "contatos"
- "CONTATO"
- "telefone"
- "quero falar"

**Para ver aniversário:**
- "Aniversário"
- "aniversario"
- "ANIVERSARIO" 
- "niver"
- "birthday"

## 📞 Nova Funcionalidade: Contato Personalizado

Quando você digitar **"Contato"**, o bot mostrará:

### Para usuários cadastrados:
```
📞 Informações de Contato das Suas Igrejas:

⛪ Igreja Sao Francisco
📱 Telefone: (67) 99663-7373
📍 Endereço: Julia Maksoud, Monte Castelo
📮 CEP: 79011-100
💬 "Bem vindo meus colaboradores"

⏰ Horários de Culto:
   • Segunda-feira: Culto de segunda - 16h (Pastor Claudio)

🙏 Estamos aqui para ajudar você!
💒 Que Deus abençoe sua caminhada conosco!
```

### Para usuários não cadastrados:
```
📞 Informações de Contato:

📱 WhatsApp: Este número
🙏 Entre em contato conosco através deste WhatsApp

Estamos aqui para ajudar você!
```

## 🗄️ Estrutura do Banco de Dados

### Informações das Igrejas
```
church/
  └── [churchId]/
      ├── name              (Nome da igreja)
      ├── phone             (Telefone)
      ├── address[]         (Endereço completo)
      ├── cep               (CEP)
      ├── phrase            (Frase da igreja)
      ├── phraseOfDay       (Frase do dia)
      └── worshipSchedule   (Horários de culto)
          ├── monday[]
          ├── tuesday[]
          └── ...
```

## 🚀 Como Usar

### Para qualquer comando:
1. **Digite de qualquer forma**: Maiúscula, minúscula, com ou sem acento
2. **Use variações**: "contato", "telefone", "falar" - todos funcionam
3. **Seja natural**: O sistema reconhece intenções

### Exemplos práticos:
- ✅ "CONTATO" → Mostra informações das suas igrejas
- ✅ "perfil" → Mostra seu perfil
- ✅ "EVENTOS" → Lista eventos próximos
- ✅ "aniversario" → Informações do aniversário
- ✅ "help" → Lista de comandos

## ⏰ Funcionalidades Automáticas

### Verificações Diárias (9:00)
- ✅ **Aniversariantes**: Mensagens personalizadas
- ✅ **Visitantes**: Mensagens de boas-vindas com nome da igreja
- ✅ **Eventos**: Notificações automáticas

## 📝 Observações Importantes

- ✅ **Comandos flexíveis**: Não precisa decorar a forma exata
- ✅ **Informações reais**: Dados das suas igrejas específicas
- ✅ **Sistema inteligente**: Reconhece intenções naturalmente
- ✅ **Fallback seguro**: Sempre tem uma resposta, mesmo com erro
- ✅ **Case-insensitive**: Maiúscula/minúscula não importa
- ✅ **Sem acentos**: Funciona com ou sem acentuação

## 🎯 Melhorias Técnicas

### Sistema de Reconhecimento
- **Normalização NFD**: Remove acentos automaticamente
- **Mapeamento inteligente**: Múltiplas variações por comando
- **Busca por inclusão**: Reconhece comando mesmo com palavras extras

### Busca de Informações
- **Cache inteligente**: Otimização de consultas
- **Fallback robusto**: Sempre retorna algo útil
- **Tratamento de erros**: Mensagens amigáveis em caso de falha
