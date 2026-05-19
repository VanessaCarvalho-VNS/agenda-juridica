const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const path = require('path')
const qrcode = require('qrcode-terminal') // ✅ ADICIONADO

// ── Estado das conversas ────────────────────────────────────────────────────
const sessoes = {}

function getSessao(jid) {
  if (!sessoes[jid]) {
    sessoes[jid] = { etapa: 'menu', nome: null, data: null, ultimaMsg: Date.now() }
  }
  return sessoes[jid]
}

function resetarSessao(jid) {
  sessoes[jid] = { etapa: 'menu', nome: null, data: null, ultimaMsg: Date.now() }
}

// ── Mensagens do bot ────────────────────────────────────────────────────────
const MSG = {
  saudacao: (nome) => `Olá${nome ? ', ' + nome : ''}! 👋

Bem-vindo ao atendimento do escritório *Rute Santos Advocacia* ⚖️

Como posso te ajudar hoje? Por favor, digite o número da opção desejada:

*1* - 📅 Agendar uma consulta
*2* - 🕐 Consultar horários disponíveis
*3* - 💬 Falar diretamente com a Dra. Rute Santos
*4* - ❓ Dúvidas frequentes

_Para reiniciar o atendimento, digite *menu* a qualquer momento._`,

  opcaoInvalida: `Não entendi sua resposta. 😕

Por favor, digite apenas o *número* da opção desejada:

*1* - 📅 Agendar uma consulta
*2* - 🕐 Consultar horários disponíveis  
*3* - 💬 Falar com a Dra. Rute Santos
*4* - ❓ Dúvidas frequentes`,

  pedirNome: `Ótimo! Vamos agendar sua consulta. 📅

Por favor, me informe o seu *nome completo*:`,

  pedirData: (nome) => `Obrigada, *${nome}*! 😊

Agora, qual seria a *data preferida* para a consulta?

Por exemplo: _15/02/2025_ ou _próxima terça-feira_`,

  confirmarAgendamento: (nome, data) => `Perfeito! ✅

Seus dados foram registrados:
- *Nome:* ${nome}
- *Data preferida:* ${data}

A Dra. Rute Santos entrará em contato em breve para *confirmar o horário* da consulta.

📱 Se preferir, você também pode ligar ou enviar mensagem para o número do escritório.

Obrigada pelo contato! 🙏`,

  horarios: `📅 *Horários disponíveis para consulta:*

🕑 *Segunda a Sexta-feira*
- 09:00 às 09:45
- 10:00 às 10:45
- 14:00 às 14:45
- 15:00 às 15:45
- 16:00 às 16:45

🕑 *Sábados* (mediante agendamento prévio)
- 09:00 às 11:00

_As consultas têm duração média de 45 minutos._

Deseja agendar uma consulta? Digite *1* para prosseguir ou *menu* para voltar ao início.`,

  falarComAdvogado: `📲 *Contato direto com a Dra. Rute Santos:*

Você está sendo encaminhado para atendimento humano. A Dra. Rute Santos ou um de seus assistentes responderá em breve.

⏰ *Horário de atendimento:*
Segunda a Sexta: 08:00 às 18:00
Sábados: 09:00 às 12:00

Se sua mensagem for fora do horário comercial, responderemos no próximo dia útil. 🙏

_Descreva brevemente o assunto da sua consulta e aguarde o retorno._`,

  duvidasFrequentes: `❓ *Dúvidas Frequentes:*

*1. Qual o valor da consulta inicial?*
A primeira consulta tem duração de 45 min. Entre em contato para informações sobre honorários.

*2. Quais áreas o escritório atende?*
Direito Civil, Trabalhista, Previdenciário, Família e Contratos.

*3. O escritório atende online?*
Sim! Realizamos consultas presenciais e por videochamada.

*4. Onde fica o escritório?*
📍 Av. Paulista, 1000 – Sala 101, Bela Vista, São Paulo – SP

*5. Como agendar?*
Digite *1* no menu principal ou ligue diretamente para o escritório.

_Ainda tem dúvidas? Digite *3* para falar com a equipe._`,

  despedida: `Obrigada pelo contato com o escritório *Rute Santos Advocacia*! ⚖️

Tenha um ótimo dia! 😊

_Para novo atendimento, envie qualquer mensagem._`
}

// ── Processar mensagem ─────────────────────────────────────────────────────
async function processarMensagem(sock, jid, texto) {
  const msg = texto.trim().toLowerCase()
  const sessao = getSessao(jid)

  const enviar = async (texto) => {
    await sock.sendMessage(jid, { text: texto })
  }

  if (['menu', 'oi', 'olá', 'ola'].some(p => msg.includes(p))) {
    resetarSessao(jid)
    await enviar(MSG.saudacao(''))
    return
  }

  switch (sessao.etapa) {
    case 'menu':
      if (msg === '1') {
        sessao.etapa = 'aguardando_nome'
        await enviar(MSG.pedirNome)
      } else if (msg === '2') {
        await enviar(MSG.horarios)
      } else if (msg === '3') {
        await enviar(MSG.falarComAdvogado)
      } else if (msg === '4') {
        await enviar(MSG.duvidasFrequentes)
      } else {
        await enviar(MSG.saudacao(''))
      }
      break

    case 'aguardando_nome':
      sessao.nome = texto
      sessao.etapa = 'aguardando_data'
      await enviar(MSG.pedirData(sessao.nome))
      break

    case 'aguardando_data':
      sessao.data = texto
      sessao.etapa = 'finalizado'
      await enviar(MSG.confirmarAgendamento(sessao.nome, sessao.data))
      break
  }
}

// ── Iniciar bot ─────────────────────────────────────────────────────────────
async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, 'auth_info_baileys')
  )

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Bot', 'Chrome', '1.0.0']
    // ❌ REMOVIDO printQRInTerminal
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {

    // ✅ AQUI ESTÁ A CORREÇÃO
    if (qr) {
      console.clear()
      console.log('📱 Escaneie o QR Code abaixo:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado!')
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const reconectar = code !== DisconnectReason.loggedOut

      if (reconectar) {
        console.log('🔄 Reconectando...')
        setTimeout(iniciarBot, 5000)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (msg.key.fromMe) continue
      if (msg.key.remoteJid.endsWith('@g.us')) continue

      const jid = msg.key.remoteJid
      const texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text || ''

      if (!texto) continue

      await processarMensagem(sock, jid, texto)
    }
  })
}

iniciarBot()