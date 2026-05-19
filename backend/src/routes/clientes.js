const express = require('express');
const db = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM clientes WHERE usuario_id = ? ORDER BY nome ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  const { nome, cpf, email, telefone, status = 'ativo' } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

  try {
    const [result] = await db.query(
      'INSERT INTO clientes (usuario_id, nome, cpf, email, telefone, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, nome, cpf, email, telefone, status]
    );
    const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  const { nome, cpf, email, telefone, status } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM clientes WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });

    await db.query(
      'UPDATE clientes SET nome=?, cpf=?, email=?, telefone=?, status=? WHERE id=? AND usuario_id=?',
      [nome, cpf, email, telefone, status, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// DELETE /api/clientes/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM clientes WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

module.exports = router;
