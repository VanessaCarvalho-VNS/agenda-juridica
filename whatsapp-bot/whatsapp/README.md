# Bot de Atendimento WhatsApp — Rute Santos Advocacia

## Como instalar e rodar

### 1. Instalar dependências
```bash
cd whatsapp-bot
npm install
```

### 2. Iniciar o bot
```bash
npm start
```

### 3. Conectar ao WhatsApp
- Um QR Code aparecerá no terminal
- Abra o WhatsApp no celular
- Vá em: **Configurações → Dispositivos Conectados → Conectar dispositivo**
- Escaneie o QR Code
- O bot estará ativo! ✅

---

## Fluxo de Atendimento

```
Cliente envia mensagem
        ↓
  Saudação + Menu
  1 - Agendar consulta
  2 - Horários disponíveis
  3 - Falar com a advogada
  4 - Dúvidas frequentes
        ↓
[Opção 1 - Agendamento]
  → Solicita nome
  → Solicita data preferida
  → Confirma e encerra
        ↓
[Opção 2 - Horários]
  → Exibe horários disponíveis
        ↓
[Opção 3 - Humano]
  → Encaminha para atendimento humano
        ↓
[Opção 4 - FAQ]
  → Responde dúvidas frequentes
```

## Palavras que reiniciam o menu
- oi, olá, bom dia, boa tarde, boa noite
- menu, início, começar, start

## Estrutura de arquivos
```
whatsapp-bot/
├── whatsapp.js          ← bot principal
├── package.json
├── README.md
└── auth_info_baileys/   ← criado automaticamente após login
```

## Observações
- A pasta `auth_info_baileys/` guarda a sessão do WhatsApp
- Após o primeiro login, não precisa escanear novamente
- Se desconectar, o bot reconecta automaticamente
- **Não compartilhe** a pasta `auth_info_baileys/` — ela contém suas credenciais
