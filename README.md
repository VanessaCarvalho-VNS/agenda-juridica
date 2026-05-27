# ⚖️ Agenda Jurídica

Sistema completo de gestão para escritórios de advocacia. Reúne em um só lugar o controle de clientes, processos, agenda, financeiro, contratos e alertas, além de um bot de atendimento via WhatsApp.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 🔐 **Autenticação** | Cadastro e login com JWT — cada advogado vê apenas seus próprios dados |
| 👥 **Clientes** | Cadastro completo com histórico de processos e contratos |
| 📁 **Processos** | Acompanhamento de processos por status, tribunal e partes |
| 📅 **Agenda** | Audiências, reuniões e prazos com calendário visual (FullCalendar) |
| 🔔 **Alertas** | Lembretes com níveis de urgência e notificação automática |
| 💰 **Financeiro** | Controle de honorários com gráficos de receita (Recharts) |
| 📄 **Contratos** | Upload e gestão de contratos em PDF |
| 🤖 **WhatsApp Bot** | Atendimento automático de clientes via WhatsApp (Baileys) |

---

## 🛠️ Stack

### Backend
- **Node.js** + **Express** — API REST
- **MySQL 8** — banco de dados relacional
- **JWT** (jsonwebtoken) — autenticação stateless
- **bcryptjs** — hash de senhas
- **Multer** — upload de arquivos
- **Nodemon** — hot-reload em desenvolvimento

### Frontend
- **React 18** + **TypeScript** — interface moderna e tipada
- **Vite** — bundler ultra-rápido
- **Tailwind CSS** — estilização utilitária
- **Radix UI** + **shadcn/ui** — componentes acessíveis
- **FullCalendar** — calendário interativo
- **Recharts** — gráficos financeiros
- **React Router v6** — navegação SPA

### WhatsApp Bot
- **@whiskeysockets/baileys** — integração com WhatsApp Web

---

## 📁 Estrutura do Projeto

```
agenda-juridica/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── db.js           # Pool de conexão MySQL
│   │   │   └── migrate.js      # Criação das tabelas
│   │   ├── middlewares/
│   │   │   └── auth.js         # Middleware de autenticação JWT
│   │   └── routes/
│   │       ├── auth.js         # Login / Cadastro
│   │       ├── clientes.js
│   │       ├── processos.js
│   │       ├── agenda.js
│   │       ├── alertas.js
│   │       ├── financeiro.js
│   │       ├── contratos.js
│   │       └── uploads.js
│   ├── uploads/                # Arquivos enviados (ignorado pelo Git)
│   │   └── contratos/
│   ├── .env.example
│   ├── package.json
│   ├── nixpacks.toml           # Deploy Railway
│   └── railway.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx      # Sidebar + Header
│   │   │   ├── Pagination.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ui.tsx          # Componentes base
│   │   ├── lib/
│   │   │   ├── api.ts          # Todas as chamadas à API
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clientes.tsx
│   │   │   ├── Processos.tsx
│   │   │   ├── Agenda.tsx
│   │   │   ├── Alertas.tsx
│   │   │   ├── Financeiro.tsx
│   │   │   └── Contratos.tsx
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── whatsapp-bot/
    └── whatsapp/
        ├── whatsapp.js         # Lógica do bot
        ├── auth_info_baileys/  # Sessão local (ignorado pelo Git)
        └── package.json
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- **Node.js 18+**
- **MySQL 8+** rodando localmente
- **npm** ou **yarn**

---

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/agenda-juridica.git
cd agenda-juridica
```

---

### 2. Configurar o banco de dados

Acesse o MySQL e crie o banco:

```sql
CREATE DATABASE agenda_juridica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

### 3. Configurar o Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=agenda_juridica
JWT_SECRET=troque_por_uma_chave_secreta_longa_e_aleatoria
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Execute as migrações (cria todas as tabelas):

```bash
npm run migrate
```

Inicie o servidor:

```bash
# Desenvolvimento (hot-reload)
npm run dev

# Produção
npm start
```

> API disponível em: `http://localhost:3001`

---

### 4. Configurar o Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

> App disponível em: `http://localhost:5173`

O Vite já está configurado com proxy — chamadas para `/api` e `/uploads` são redirecionadas automaticamente ao backend.

---

### 5. Configurar o WhatsApp Bot (opcional)

```bash
cd ../whatsapp-bot/whatsapp
npm install
npm run dev
```

Na primeira execução será exibido um QR Code no terminal. Escaneie com o WhatsApp do celular para autenticar. A sessão é salva localmente em `auth_info_baileys/`.

---

## 🔌 Endpoints da API

Todos os endpoints (exceto `/auth`) exigem o header:

```
Authorization: Bearer <token>
```

### Autenticação
| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/signup` | Criar conta |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/me` | Dados do usuário logado |

### Recursos (padrão CRUD)
| Recurso | Base URL |
|---|---|
| Clientes | `/api/clientes` |
| Processos | `/api/processos` |
| Agenda | `/api/agenda` |
| Alertas | `/api/alertas` |
| Financeiro | `/api/financeiro` |
| Contratos | `/api/contratos` |

Cada recurso suporta:
- `GET /` — listar (filtrado pelo usuário autenticado)
- `POST /` — criar
- `PUT /:id` — atualizar
- `DELETE /:id` — deletar

### Uploads
| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/uploads/contrato` | Upload de PDF de contrato |
| `GET` | `/uploads/contratos/:arquivo` | Servir arquivo estático |

### Health check
```
GET /api/health  →  { "status": "ok" }
```

---

## 🔒 Segurança

- Senhas armazenadas com hash **bcryptjs** (salt rounds 10)
- Autenticação stateless via **JWT** (validade configurável, padrão 7 dias)
- Isolamento de dados: cada usuário acessa **somente seus próprios registros**
- **CORS** restrito às origens permitidas (configurável via `FRONTEND_URL`)
- Variáveis sensíveis gerenciadas por **dotenv** — nunca commitar o `.env`

---

## ☁️ Deploy

O projeto está configurado para deploy no **Railway**:

- `backend/nixpacks.toml` — configuração de build do backend
- `backend/railway.json` — configuração de serviço do backend
- `frontend/railway.json` — configuração de serviço do frontend

Para outros provedores (Render, Vercel, Fly.io), configure as variáveis de ambiente listadas nos arquivos `.env.example`.

---

## ☁️ Deploy


- **Frontend:** hospedado no [Vercel](https://agenda-juridica-iota.vercel.app)
- **Backend (API):** hospedado no [Railway](https://agenda-juridica-production.up.railway.app)

Health check da API:
GET https://agenda-juridica-production.up.railway.app/api/health → { "status": "ok" }

## 🌐 Acesso

| Serviço  | URL |
|----------|-----|
| Frontend | https://agenda-juridica-iota.vercel.app |
| Backend  | https://agenda-juridica-production.up.railway.app |


---

## 🐛 Problemas Comuns

**Erro de conexão com MySQL**
```bash
sudo service mysql start        # Linux
brew services start mysql       # macOS
```

**Porta já em uso**
```bash
# Backend: altere PORT no .env
# Frontend: inicie com porta diferente
npm run dev -- --port 5174
```

**CORS error em produção**
Certifique-se de que `FRONTEND_URL` no `.env` do backend aponta para a URL exata do frontend (sem barra no final).

**QR Code do WhatsApp não aparece**
Delete a pasta `auth_info_baileys/` e reinicie o bot para gerar um novo QR Code.

---

## 📄 Licença

Este projeto é de uso privado. Todos os direitos reservados.

---

## 👨‍💻 Desenvolvido por

<div align="center">
  
**Desenvolvimento de software sob medida para escritórios e empresas.**
**V-GLAMP Programando o Futuro**
<img  height="150" alt="Image" src="https://github.com/user-attachments/assets/c8c0832e-7280-46f1-a833-9d3aee6efefb" />

</div>





