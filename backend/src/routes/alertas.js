const express = require('express');
const db = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM alertas WHERE usuario_id = ? ORDER BY urgencia ASC, created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

router.post('/', async (req, res) => {
  const { tipo = 'outros', titulo, mensagem, urgencia = 'media', data_alerta, processo, cliente } = req.body;
  if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });
  try {
    const [result] = await db.query(
      'INSERT INTO alertas (usuario_id, tipo, titulo, mensagem, urgencia, data_alerta, processo, cliente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, tipo, titulo, mensagem || null, urgencia, data_alerta || null, processo || null, cliente || null]
    );
    const [rows] = await db.query('SELECT * FROM alertas WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar alerta:', err);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

// PATCH — marca como lido (rota simples e direta)
router.patch('/:id/lido', async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM alertas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Alerta não encontrado' });

    await db.query(
      'UPDATE alertas SET lido = 1 WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM alertas WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao marcar alerta como lido:', err);
    res.status(500).json({ error: 'Erro ao marcar alerta como lido' });
  }
});

// PUT — atualização completa
router.put('/:id', async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT * FROM alertas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Alerta não encontrado' });

    const atual = existing[0];
    const tipo        = req.body.tipo        !== undefined ? req.body.tipo        : atual.tipo;
    const titulo      = req.body.titulo      !== undefined ? req.body.titulo      : atual.titulo;
    const mensagem    = req.body.mensagem    !== undefined ? req.body.mensagem    : atual.mensagem;
    const urgencia    = req.body.urgencia    !== undefined ? req.body.urgencia    : atual.urgencia;
    const data_alerta = req.body.data_alerta !== undefined ? (req.body.data_alerta || null) : atual.data_alerta;
    const processo    = req.body.processo    !== undefined ? (req.body.processo   || null) : atual.processo;
    const cliente     = req.body.cliente     !== undefined ? (req.body.cliente    || null) : atual.cliente;
    const lido        = req.body.lido        !== undefined ? (req.body.lido ? 1 : 0)      : atual.lido;

    await db.query(
      'UPDATE alertas SET tipo=?, titulo=?, mensagem=?, urgencia=?, lido=?, data_alerta=?, processo=?, cliente=? WHERE id=? AND usuario_id=?',
      [tipo, titulo, mensagem, urgencia, lido, data_alerta, processo, cliente, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM alertas WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar alerta:', err);
    res.status(500).json({ error: 'Erro ao atualizar alerta', detalhe: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM alertas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Alerta não encontrado' });
    res.json({ message: 'Alerta deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar alerta' });
  }
});

module.exports = router;