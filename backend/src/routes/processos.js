const express = require('express');
const db = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM processos WHERE usuario_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar processos' });
  }
});

router.post('/', async (req, res) => {
  const { numero, cliente_nome, tipo, status = 'inicial', data_inicio, proxima_audiencia, observacoes } = req.body;
  if (!numero || !cliente_nome || !tipo) {
    return res.status(400).json({ error: 'Número, cliente e tipo são obrigatórios' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO processos (usuario_id, numero, cliente_nome, tipo, status, data_inicio, proxima_audiencia, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, numero, cliente_nome, tipo, status, data_inicio || null, proxima_audiencia || null, observacoes]
    );
    const [rows] = await db.query('SELECT * FROM processos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar processo' });
  }
});

router.put('/:id', async (req, res) => {
  const { numero, cliente_nome, tipo, status, data_inicio, proxima_audiencia, observacoes } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM processos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Processo não encontrado' });

    await db.query(
      'UPDATE processos SET numero=?, cliente_nome=?, tipo=?, status=?, data_inicio=?, proxima_audiencia=?, observacoes=? WHERE id=? AND usuario_id=?',
      [numero, cliente_nome, tipo, status, data_inicio || null, proxima_audiencia || null, observacoes, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM processos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar processo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM processos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json({ message: 'Processo deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar processo' });
  }
});

module.exports = router;
