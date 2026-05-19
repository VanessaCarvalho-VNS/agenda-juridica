require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const processosRoutes = require('./routes/processos');
const agendaRoutes = require('./routes/agenda');
const alertasRoutes = require('./routes/alertas');
const financeiroRoutes = require('./routes/financeiro');
const contratosRoutes = require('./routes/contratos');
const uploadsRouter = require('./routes/uploads')
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001; // ✅ só aqui

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) =>
    (!origin || allowedOrigins.includes(origin))
      ? cb(null, true)
      : cb(new Error('CORS')),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', message: 'Servidor Agenda Jurídica online' })
);

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/processos', processosRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/contratos', contratosRoutes);
app.use('/api/uploads', uploadsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});



app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});


