// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { Layout } from '../components/Layout'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui'
import { Plus, FileText, Upload, Eye, Trash2, Download, Loader2, Edit, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { fmtDate, fmtCurrency, toInputDate } from '../lib/utils'
import { Pagination } from '../components/Pagination'

interface Contrato {
  id: number; titulo: string; cliente: string; tipo: string; status: string
  data_inicio: string; data_fim: string; valor: number; arquivo_nome: string; observacoes: string
}
interface Arquivo {
  nome: string; tamanho: number; url: string; criado_em: string
}

const emptyForm = { cliente: '', tipo: '', valor: '', data_inicio: '', data_fim: '', status: 'ativo', observacoes: '' }
const statusConfig: Record<string, { label: string; variant: any }> = {
  ativo:     { label: 'Ativo',     variant: 'success'     },
  pendente:  { label: 'Pendente',  variant: 'warning'     },
  encerrado: { label: 'Encerrado', variant: 'secondary'   },
  vencido:   { label: 'Vencido',   variant: 'destructive' },
}
const LIMIT = 10

const API_BASE = import.meta.env.VITE_API_URL || 'https://agenda-juridica-production.up.railway.app/api'

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Contratos() {
  const [contratos, setContratos]       = useState<Contrato[]>([])
  const [open, setOpen]                 = useState(false)
  const [detalhesOpen, setDetalhesOpen] = useState(false)
  const [editing, setEditing]           = useState<Contrato | null>(null)
  const [selected, setSelected]         = useState<Contrato | null>(null)
  const [form, setForm]                 = useState(emptyForm)
  const [loading, setLoading]           = useState(false)
  const [fetching, setFetching]         = useState(true)
  const [arquivosMap, setArquivosMap]   = useState<Record<number, Arquivo[]>>({})
  const [uploading, setUploading]       = useState<number | null>(null)
  const [downloading, setDownloading]   = useState<number | null>(null)
  const [page, setPage]                 = useState(1)
  const [showValor, setShowValor]       = useState(true)
  const fileRef         = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<number | null>(null)

  useEffect(() => {
    api.getContratos().then(data => {
      setContratos(data)
    }).catch(() => toast.error('Erro ao carregar contratos')).finally(() => setFetching(false))
  }, [])

  // Carrega arquivos de um contrato ao abrir detalhes
  const carregarArquivos = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(`${API_BASE}/uploads/contratos/${id}/arquivos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setArquivosMap(prev => ({ ...prev, [id]: data }))
    } catch { /* silencioso */ }
  }

  // ── Download via proxy do backend ────────────────────────────────────────
  const handleDownload = async (contratoId: number, nomeArquivo: string) => {
    setDownloading(contratoId)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(`${API_BASE}/uploads/contratos/${contratoId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao baixar arquivo')
      }

      // Converte a resposta em blob e cria link de download
      const blob     = await res.blob()
      const blobUrl  = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = blobUrl
      a.download     = nomeArquivo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      toast.success('Download iniciado!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao baixar arquivo')
    } finally {
      setDownloading(null)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit   = (c: Contrato) => {
    setEditing(c)
    setForm({ cliente: c.cliente||'', tipo: c.tipo||'', valor: c.valor?String(c.valor):'',
      data_inicio: toInputDate(c.data_inicio), data_fim: toInputDate(c.data_fim),
      status: c.status||'ativo', observacoes: c.observacoes||'' })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente || !form.tipo) return toast.error('Cliente e tipo são obrigatórios')
    setLoading(true)
    try {
      const payload = { titulo: `${form.tipo} - ${form.cliente}`, cliente: form.cliente, tipo: form.tipo,
        valor: form.valor ? parseFloat(form.valor) : null, data_inicio: form.data_inicio||null,
        data_fim: form.data_fim||null, status: form.status, observacoes: form.observacoes||null }
      if (editing) {
        const updated = await api.updateContrato(editing.id, payload)
        setContratos(cs => cs.map(c => c.id === editing.id ? updated : c))
        toast.success('Contrato atualizado!')
      } else {
        const created = await api.createContrato(payload)
        setContratos(cs => [...cs, created])
        toast.success('Contrato cadastrado!')
        setPage(1)
      }
      setOpen(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Confirmar exclusão?')) return
    try {
      await api.deleteContrato(id)
      setContratos(cs => cs.filter(c => c.id !== id))
      toast.success('Contrato excluído!')
    } catch (err: any) { toast.error(err.message) }
  }

  // ── Upload real para o backend ──
  const handleUploadClick = (id: number) => {
    uploadTargetRef.current = id
    fileRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id   = uploadTargetRef.current
    if (!file || !id) return
    e.target.value = ''

    setUploading(id)
    try {
      const token    = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('arquivo', file)

      const res = await fetch(`${API_BASE}/uploads/contratos/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no upload')

      toast.success(`"${file.name}" enviado com sucesso!`)
      await carregarArquivos(id)

      setContratos(cs => cs.map(c => c.id === id ? { ...c, arquivo_nome: data.arquivo.url } : c))
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar arquivo')
    } finally {
      setUploading(null)
    }
  }

  const handleDeleteArquivo = async (contratoId: number) => {
    if (!confirm('Remover arquivo do contrato?')) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_BASE}/uploads/contratos/${contratoId}/arquivo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setArquivosMap(prev => ({ ...prev, [contratoId]: [] }))
      setContratos(cs => cs.map(c => c.id === contratoId ? { ...c, arquivo_nome: '' } : c))
      toast.success('Arquivo removido!')
    } catch { toast.error('Erro ao remover arquivo') }
  }

  const totalAtivos   = contratos.filter(c => c.status === 'ativo').length
  const totalVencidos = contratos.filter(c => c.status === 'vencido' || c.status === 'encerrado').length
  const valorTotal    = contratos.filter(c => c.status === 'ativo').reduce((a, c) => a + Number(c.valor||0), 0)

  const totalPages = Math.max(1, Math.ceil(contratos.length / LIMIT))
  const safePage   = Math.min(page, totalPages)
  const paginated  = contratos.slice((safePage - 1) * LIMIT, safePage * LIMIT)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Input de arquivo oculto */}
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h2 className="text-2xl font-bold">Gestão de Contratos</h2><p className="text-slate-500">Gerencie contratos e documentação</p></div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Novo Contrato</Button>
        </div>

        {/* Modal Cadastrar/Editar */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
            <DialogHeader className="px-6 pt-5 pb-1 flex-shrink-0 border-b border-slate-100"><DialogTitle>{editing ? 'Editar Contrato' : 'Cadastrar Contrato'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              <div className="space-y-2"><Label>Cliente *</Label><Input value={form.cliente} onChange={set('cliente')} placeholder="Nome do cliente" /></div>
              <div className="space-y-2"><Label>Tipo de Contrato *</Label><Input value={form.tipo} onChange={set('tipo')} placeholder="Ex: Prestação de Serviços" /></div>
              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={set('valor')} placeholder="0.00" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Data de Início</Label><Input type="date" value={form.data_inicio} onChange={set('data_inicio')} /></div>
                <div className="space-y-2"><Label>Data de Vigência</Label><Input type="date" value={form.data_fim} onChange={set('data_fim')} /></div>
              </div>
              {editing && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="encerrado">Encerrado</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Observações</Label>
                <textarea value={form.observacoes} onChange={set('observacoes')} placeholder="Observações..." rows={2}
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 resize-none" />
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editing ? 'Salvar' : 'Cadastrar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 mb-1">Contratos Ativos</p><p className="text-3xl font-bold">{totalAtivos}</p></div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 mb-1">Contratos Vencidos</p><p className="text-3xl font-bold">{totalVencidos}</p></div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-slate-500">Valor Total Ativo</p>
                  <button onClick={() => setShowValor(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    {showValor ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-2xl font-bold">{showValor ? fmtCurrency(valorTotal) : '••••••'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader><CardTitle>Lista de Contratos ({contratos.length})</CardTitle></CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : contratos.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Nenhum contrato cadastrado</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead>
                        <TableHead>Vigência</TableHead><TableHead>Status</TableHead><TableHead>Docs</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map(c => {
                        const sc = statusConfig[c.status] || { label: c.status, variant: 'secondary' }
                        const temDoc = !!c.arquivo_nome
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.cliente}</TableCell>
                            <TableCell className="max-w-[180px] truncate">{c.tipo||'-'}</TableCell>
                            <TableCell>{c.valor ? fmtCurrency(Number(c.valor)) : '-'}</TableCell>
                            <TableCell>
                              <div className="text-sm"><p>{fmtDate(c.data_inicio)}</p>{c.data_fim&&<p className="text-slate-500">até {fmtDate(c.data_fim)}</p>}</div>
                            </TableCell>
                            <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${temDoc ? 'text-blue-600' : 'text-slate-400'}`}>
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">{temDoc ? '1' : '0'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" title="Ver detalhes"
                                  onClick={() => { setSelected(c); carregarArquivos(c.id); setDetalhesOpen(true) }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(c)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Anexar documento"
                                  disabled={uploading === c.id}
                                  onClick={() => handleUploadClick(c.id)}>
                                  {uploading === c.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Upload className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(c.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={safePage} totalPages={totalPages} total={contratos.length} limit={LIMIT} onPageChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal Detalhes */}
        <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <DialogTitle>Detalhes do Contrato</DialogTitle>
                {selected && (
                  <Button size="sm" variant="outline" onClick={() => { setDetalhesOpen(false); setTimeout(() => openEdit(selected), 50) }}>
                    <Edit className="w-4 h-4 mr-2" />Editar
                  </Button>
                )}
              </div>
            </DialogHeader>
            {selected && (() => {
              const sc   = statusConfig[selected.status] || { label: selected.status, variant: 'secondary' }
              const docs = arquivosMap[selected.id] || []
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Cliente</Label><p className="text-sm mt-1 font-medium">{selected.cliente}</p></div>
                    <div><Label>Tipo</Label><p className="text-sm mt-1">{selected.tipo||'-'}</p></div>
                    <div><Label>Valor</Label><p className="text-lg font-bold mt-1">{selected.valor ? fmtCurrency(Number(selected.valor)) : '-'}</p></div>
                    <div><Label>Status</Label><div className="mt-1"><Badge variant={sc.variant}>{sc.label}</Badge></div></div>
                    <div><Label>Data de Início</Label><p className="text-sm mt-1">{fmtDate(selected.data_inicio)}</p></div>
                    <div><Label>Data de Vigência</Label><p className="text-sm mt-1">{fmtDate(selected.data_fim)}</p></div>
                    {selected.observacoes && <div className="col-span-2"><Label>Observações</Label><p className="text-sm mt-1 text-slate-600">{selected.observacoes}</p></div>}
                  </div>

                  {/* Documentos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Documentos ({docs.length})</Label>
                      <Button size="sm" disabled={uploading === selected.id}
                        onClick={() => { setDetalhesOpen(false); setTimeout(() => handleUploadClick(selected.id), 100) }}>
                        {uploading === selected.id
                          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
                          : <><Upload className="w-4 h-4 mr-2" />Upload</>}
                      </Button>
                    </div>

                    {docs.length > 0 ? docs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.nome}</p>
                            <p className="text-xs text-slate-400">{doc.tamanho ? fmtBytes(doc.tamanho) : ''}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {/* ✅ Download via proxy do backend */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Download"
                            disabled={downloading === selected.id}
                            onClick={() => handleDownload(selected.id, doc.nome)}
                          >
                            {downloading === selected.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Download className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" title="Remover arquivo"
                            onClick={() => handleDeleteArquivo(selected.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center p-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500 mb-3">Nenhum documento anexado</p>
                        <p className="text-xs text-slate-400 mb-3">Formatos aceitos: PDF, DOC, DOCX, PNG, JPG (máx. 10MB)</p>
                        <Button size="sm" variant="outline"
                          onClick={() => { setDetalhesOpen(false); setTimeout(() => handleUploadClick(selected.id), 100) }}>
                          <Upload className="w-4 h-4 mr-2" />Anexar Documento
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}