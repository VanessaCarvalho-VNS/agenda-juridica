const express    = require('express')
const multer     = require('multer')
const auth       = require('../middlewares/auth')
const db         = require('../database/db')
const cloudinary = require('cloudinary').v2
const { Readable } = require('stream')
const https      = require('https')
const http       = require('http')

const router = express.Router()
router.use(auth)

// ── Configuração do Cloudinary ─────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Multer em memória ──────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, PNG, JPG'))
  }
})

// ── Determina o resource_type correto pelo mimetype ───────────────────────
function getResourceType(mimetype) {
  const rawTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  return rawTypes.includes(mimetype) ? 'raw' : 'image'
}

// ── Helper: faz upload para o Cloudinary via stream ───────────────────────
function uploadToCloudinary(buffer, filename, mimetype) {
  const resourceType = getResourceType(mimetype)

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'agenda-juridica/contratos',
        public_id: filename,
        resource_type: resourceType,
        type: 'upload',
        access_mode: 'public',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}

// ── Helper: corrige URL para garantir /raw/upload/ em PDFs/DOCs ───────────
function fixCloudinaryUrl(url) {
  if (!url) return null
  if (url.includes('/image/upload/') && !url.match(/\.(png|jpg|jpeg)$/i)) {
    return url.replace('/image/upload/', '/raw/upload/')
  }
  return url
}

// ── POST /api/uploads/contratos/:id ───────────────────────────────────────
router.post('/contratos/:id', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })

    const [rows] = await db.query(
      'SELECT id, arquivo_nome, arquivo_resource_type FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' })

    // Remove arquivo antigo do Cloudinary se existir
    if (rows[0].arquivo_nome) {
      try {
        const urlParts    = rows[0].arquivo_nome.split('/')
        const fileWithExt = urlParts.pop()
        const filename    = fileWithExt.split('.')[0]
        const publicId    = `agenda-juridica/contratos/${filename}`
        const oldType     = rows[0].arquivo_resource_type || 'raw'
        await cloudinary.uploader.destroy(publicId, { resource_type: oldType })
      } catch (e) { /* ignora se não encontrar */ }
    }

    // Nome único para o arquivo
    const timestamp = Date.now()
    const ext       = req.file.originalname.split('.').pop()
    const filename  = `contrato_${req.params.id}_${timestamp}.${ext}`

    // Faz upload para o Cloudinary com o resource_type correto
    const result = await uploadToCloudinary(req.file.buffer, filename, req.file.mimetype)

    // Salva a URL e o resource_type no banco
    await db.query(
      'UPDATE contratos SET arquivo_nome = ?, arquivo_resource_type = ? WHERE id = ? AND usuario_id = ?',
      [result.secure_url, result.resource_type, req.params.id, req.user.id]
    )

    res.json({
      message: 'Arquivo enviado com sucesso!',
      arquivo: {
        nome_original: req.file.originalname,
        tamanho:       req.file.size,
        url:           result.secure_url
      }
    })
  } catch (err) {
    console.error('Erro no upload:', err)
    res.status(500).json({ error: 'Erro ao enviar arquivo: ' + err.message })
  }
})

// ── GET /api/uploads/contratos/:id/arquivos ───────────────────────────────
router.get('/contratos/:id/arquivos', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, arquivo_nome FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' })

    const arquivos = []
    if (rows[0].arquivo_nome) {
      const url = fixCloudinaryUrl(rows[0].arquivo_nome)
      arquivos.push({
        nome: rows[0].arquivo_nome.split('/').pop(),
        url:  url
      })
    }
    res.json(arquivos)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar arquivos' })
  }
})

// ── GET /api/uploads/contratos/:id/download ───────────────────────────────
// Proxy de download: busca o arquivo no Cloudinary e serve ao usuário
router.get('/contratos/:id/download', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT arquivo_nome FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' })
    if (!rows[0].arquivo_nome) return res.status(404).json({ error: 'Nenhum arquivo anexado' })

    const url      = fixCloudinaryUrl(rows[0].arquivo_nome)
    const filename = rows[0].arquivo_nome.split('/').pop()

    // Define o header para forçar download no browser
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')

    // Faz proxy do arquivo: busca no Cloudinary e repassa para o cliente
    const protocol = url.startsWith('https') ? https : http
    protocol.get(url, (fileRes) => {
      if (fileRes.headers['content-type']) {
        res.setHeader('Content-Type', fileRes.headers['content-type'])
      }
      if (fileRes.headers['content-length']) {
        res.setHeader('Content-Length', fileRes.headers['content-length'])
      }
      fileRes.pipe(res)
    }).on('error', (err) => {
      console.error('Erro no proxy de download:', err)
      res.status(500).json({ error: 'Erro ao baixar arquivo' })
    })

  } catch (err) {
    console.error('Erro no download:', err)
    res.status(500).json({ error: 'Erro ao baixar arquivo: ' + err.message })
  }
})

// ── DELETE /api/uploads/contratos/:id/arquivo ─────────────────────────────
router.delete('/contratos/:id/arquivo', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT arquivo_nome, arquivo_resource_type FROM contratos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Contrato não encontrado' })

    if (rows[0].arquivo_nome) {
      try {
        const urlParts    = rows[0].arquivo_nome.split('/')
        const fileWithExt = urlParts.pop()
        const filename    = fileWithExt.split('.')[0]
        const publicId    = `agenda-juridica/contratos/${filename}`
        const resourceType = rows[0].arquivo_resource_type || 'raw'
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
      } catch (e) { /* ignora */ }

      await db.query(
        'UPDATE contratos SET arquivo_nome = NULL, arquivo_resource_type = NULL WHERE id = ? AND usuario_id = ?',
        [req.params.id, req.user.id]
      )
    }
    res.json({ message: 'Arquivo removido com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover arquivo' })
  }
})

module.exports = router