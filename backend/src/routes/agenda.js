const express = require('express');
const db = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM agenda WHERE usuario_id = ? ORDER BY data ASC, hora ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar agenda' });
  }
});

router.post('/', async (req, res) => {
  const { titulo, tipo = 'outros', data, hora, cliente, processo, local, observacoes } = req.body;
  if (!titulo || !data) return res.status(400).json({ error: 'Título e data são obrigatórios' });

  try {
    // Criar evento na agenda
    const [result] = await db.query(
      'INSERT INTO agenda (usuario_id, titulo, tipo, data, hora, cliente, processo, local, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, titulo, tipo, data, hora || null, cliente || null, processo || null, local || null, observacoes || null]
    );
    const [rows] = await db.query('SELECT * FROM agenda WHERE id = ?', [result.insertId]);
    const evento = rows[0];

    // ── Criar alerta automático se for audiência ou prazo ──
    if (tipo === 'audiencia' || tipo === 'prazo') {
      const urgencia = tipo === 'audiencia' ? 'alta' : 'media'
      const tipoAlerta = tipo === 'audiencia' ? 'audiencia' : 'prazo'
      const horaStr = hora ? ` às ${hora.slice(0, 5)}` : ''
      const tituloAlerta = tipo === 'audiencia'
        ? `Audiência: ${titulo}${horaStr}`
        : `Prazo: ${titulo}`
      const mensagem = [
        cliente ? `Cliente: ${cliente}` : null,
        processo ? `Processo: ${processo}` : null,
        local ? `Local: ${local}` : null,
        observacoes || null,
      ].filter(Boolean).join(' | ')

      await db.query(
        `INSERT INTO alertas 
          (usuario_id, tipo, titulo, mensagem, urgencia, lido, data_alerta, processo, cliente) 
         VALUES (?, ?, ?, ?, ?, FALSE, ?, ?, ?)`,
        [
          req.user.id,
          tipoAlerta,
          tituloAlerta,
          mensagem || null,
          urgencia,
          data,
          processo || null,
          cliente || null,
        ]
      );
    }

    res.status(201).json(evento);
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

router.put('/:id', async (req, res) => {
  const { titulo, tipo, data, hora, cliente, processo, local, observacoes } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM agenda WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Evento não encontrado' });

    await db.query(
      'UPDATE agenda SET titulo=?, tipo=?, data=?, hora=?, cliente=?, processo=?, local=?, observacoes=? WHERE id=? AND usuario_id=?',
      [titulo, tipo, data, hora || null, cliente || null, processo || null, local || null, observacoes || null, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM agenda WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM agenda WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json({ message: 'Evento deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar evento' });
  }
});

module.exports = router;