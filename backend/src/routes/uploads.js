const express  = require('express')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const auth     = require('../middlewares/auth')
const db       = require('../database/db')

const router = express.Router()
router.use(auth)

// ── Pasta de uploads ──────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'contratos')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// ── Configuração do Multer ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const ext       = path.extname(file.originalname)
    const base      = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50)
    cb(null, `contrato_${req.params.id}_${timestamp}_${base}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, PNG, JPG'))
  }
})

// POST /api/uploads/contratos/:id
router.post('/contratos/:id', upload.single('arquivo'), async (req, res) => {
  try {
    // Verifica se o contrato pertence ao usuário
    const [rows] = await db.query(
      'SELECT id FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) {
      fs.unlinkSync(req.file.path) // Remove arquivo se contrato não encontrado
      return res.status(404).json({ error: 'Contrato não encontrado' })
    }

    // Atualiza arquivo_nome no banco
    await db.query(
      'UPDATE contratos SET arquivo_nome = ? WHERE id = ? AND usuario_id = ?',
      [req.file.filename, req.params.id, req.user.id]
    )

    res.json({
      message: 'Arquivo enviado com sucesso!',
      arquivo: {
        nome_original: req.file.originalname,
        nome_salvo:    req.file.filename,
        tamanho:       req.file.size,
        url:           `/uploads/contratos/${req.file.filename}`
      }
    })
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path)
    console.error('Erro no upload:', err)
    res.status(500).json({ error: 'Erro ao salvar arquivo' })
  }
})

// GET /api/uploads/contratos/:id/arquivos — lista arquivos do contrato
router.get('/contratos/:id/arquivos', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, arquivo_nome FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' })

    const arquivos = []
    if (rows[0].arquivo_nome) {
      const filePath = path.join(UPLOAD_DIR, rows[0].arquivo_nome)
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath)
        arquivos.push({
          nome:     rows[0].arquivo_nome,
          tamanho:  stat.size,
          url:      `/uploads/contratos/${rows[0].arquivo_nome}`,
          criado_em: stat.birthtime
        })
      }
    }
    res.json(arquivos)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar arquivos' })
  }
})

// DELETE /api/uploads/contratos/:id/arquivo — remove arquivo
router.delete('/contratos/:id/arquivo', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT arquivo_nome FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' })

    if (rows[0].arquivo_nome) {
      const filePath = path.join(UPLOAD_DIR, rows[0].arquivo_nome)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      await db.query(
        'UPDATE contratos SET arquivo_nome = NULL WHERE id = ? AND usuario_id = ?',
        [req.params.id, req.user.id]
      )
    }
    res.json({ message: 'Arquivo removido com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover arquivo' })
  }
})

module.exports = router