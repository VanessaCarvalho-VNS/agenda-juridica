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
    const [result] = await db.query(
      'INSERT INTO agenda (usuario_id, titulo, tipo, data, hora, cliente, processo, local, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, titulo, tipo, data, hora || null, cliente, processo, local, observacoes]
    );
    const [rows] = await db.query('SELECT * FROM agenda WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
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
      [titulo, tipo, data, hora || null, cliente, processo, local, observacoes, req.params.id, req.user.id]
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
