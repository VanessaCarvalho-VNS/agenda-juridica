const express = require('express');
const db = require('../database/db');
const auth = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM financeiro WHERE usuario_id = ? ORDER BY data_vencimento DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar financeiro' });
  }
});

router.post('/', async (req, res) => {
  const { cliente, processo, valor, data_vencimento, data_pagamento, status = 'pendente', forma_pagamento, observacoes } = req.body;
  if (!cliente || !valor || !data_vencimento) {
    return res.status(400).json({ error: 'Cliente, valor e data de vencimento são obrigatórios' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO financeiro (usuario_id, cliente, processo, valor, data_vencimento, data_pagamento, status, forma_pagamento, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, cliente, processo, valor, data_vencimento, data_pagamento || null, status, forma_pagamento, observacoes]
    );
    const [rows] = await db.query('SELECT * FROM financeiro WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar lançamento' });
  }
});

router.put('/:id', async (req, res) => {
  const { cliente, processo, valor, data_vencimento, data_pagamento, status, forma_pagamento, observacoes } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM financeiro WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Lançamento não encontrado' });

    await db.query(
      'UPDATE financeiro SET cliente=?, processo=?, valor=?, data_vencimento=?, data_pagamento=?, status=?, forma_pagamento=?, observacoes=? WHERE id=? AND usuario_id=?',
      [cliente, processo, valor, data_vencimento, data_pagamento || null, status, forma_pagamento, observacoes, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM financeiro WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar lançamento' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM financeiro WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.json({ message: 'Lançamento deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar lançamento' });
  }
});

module.exports = router;
