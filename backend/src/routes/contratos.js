const express = require('express');
const db = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM contratos WHERE usuario_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contratos' });
  }
});

router.post('/', async (req, res) => {
  const { titulo, cliente, tipo, status = 'ativo', data_inicio, data_fim, valor, arquivo_nome, observacoes } = req.body;
  if (!titulo || !cliente) return res.status(400).json({ error: 'Título e cliente são obrigatórios' });

  try {
    const [result] = await db.query(
      'INSERT INTO contratos (usuario_id, titulo, cliente, tipo, status, data_inicio, data_fim, valor, arquivo_nome, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, titulo, cliente, tipo, status, data_inicio || null, data_fim || null, valor || null, arquivo_nome, observacoes]
    );
    const [rows] = await db.query('SELECT * FROM contratos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar contrato' });
  }
});

router.put('/:id', async (req, res) => {
  const { titulo, cliente, tipo, status, data_inicio, data_fim, valor, arquivo_nome, observacoes } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' });

    await db.query(
      'UPDATE contratos SET titulo=?, cliente=?, tipo=?, status=?, data_inicio=?, data_fim=?, valor=?, arquivo_nome=?, observacoes=? WHERE id=? AND usuario_id=?',
      [titulo, cliente, tipo, status, data_inicio || null, data_fim || null, valor || null, arquivo_nome, observacoes, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM contratos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar contrato' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Contrato não encontrado' });
    res.json({ message: 'Contrato deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar contrato' });
  }
});

module.exports = router;
