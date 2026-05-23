import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge, Textarea,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui'
import { Plus, Search, Edit, Trash2, Loader2, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { fmtDate, toInputDate } from '../lib/utils'
import { Pagination } from '../components/Pagination'

interface Processo {
  id: number; numero: string; cliente_nome: string; tipo: string; status: string
  data_inicio: string; proxima_audiencia: string; observacoes: string
}
const empty = { numero: '', cliente_nome: '', tipo: '', status: 'inicial', data_inicio: '', proxima_audiencia: '', observacoes: '' }
const statusConfig: Record<string, { label: string; variant: any; color: string }> = {
  inicial:   { label: 'Inicial',      variant: 'success',   color: 'bg-green-500'  },
  andamento: { label: 'Em Andamento', variant: 'warning',   color: 'bg-yellow-500' },
  arquivado: { label: 'Arquivado',    variant: 'secondary', color: 'bg-slate-400'  },
}
const LIMIT = 10

export default function Processos() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [open, setOpen]           = useState(false)
  const [editing, setEditing]     = useState<Processo | null>(null)
  const [form, setForm]           = useState(empty)
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(true)

  useEffect(() => {
    api.getProcessos().then(setProcessos).catch(() => toast.error('Erro ao carregar processos')).finally(() => setFetching(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (p: Processo) => {
    setEditing(p)
    setForm({ numero: p.numero, cliente_nome: p.cliente_nome, tipo: p.tipo, status: p.status,
      data_inicio: toInputDate(p.data_inicio), proxima_audiencia: toInputDate(p.proxima_audiencia), observacoes: p.observacoes || '' })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.numero || !form.cliente_nome || !form.tipo) return toast.error('Número, cliente e tipo são obrigatórios')
    setLoading(true)
    try {
      if (editing) {
        const updated = await api.updateProcesso(editing.id, form)
        setProcessos(ps => ps.map(p => p.id === editing.id ? updated : p))
        toast.success('Processo atualizado!')
      } else {
        const created = await api.createProcesso(form)
        setProcessos(ps => [...ps, created])
        toast.success('Processo cadastrado!')
      }
      setOpen(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Confirmar exclusão?')) return
    try { await api.deleteProcesso(id); setProcessos(ps => ps.filter(p => p.id !== id)); toast.success('Processo excluído!') }
    catch (err: any) { toast.error(err.message) }
  }

  const filtered   = processos.filter(p =>
    p.numero.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
    p.tipo.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * LIMIT, safePage * LIMIT)
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h2 className="text-2xl font-bold">Gestão de Processos</h2><p className="text-slate-500">Gerencie todos os processos do escritório</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Novo Processo</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
              <DialogHeader className="px-6 pt-5 pb-1 flex-shrink-0 border-b border-slate-100"><DialogTitle>{editing ? 'Editar Processo' : 'Novo Processo'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                <div className="space-y-2"><Label>Número do Processo</Label><Input value={form.numero} onChange={set('numero')} placeholder="2024.001.234-5" /></div>
                <div className="space-y-2"><Label>Cliente</Label><Input value={form.cliente_nome} onChange={set('cliente_nome')} placeholder="Nome do cliente" /></div>
                <div className="space-y-2"><Label>Tipo</Label><Input value={form.tipo} onChange={set('tipo')} placeholder="Trabalhista, Cível, Criminal..." /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inicial">Inicial</SelectItem>
                      <SelectItem value="andamento">Em Andamento</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data de Início</Label><Input type="date" value={form.data_inicio} onChange={set('data_inicio')} /></div>
                  <div className="space-y-2"><Label>Próxima Audiência</Label><Input type="date" value={form.proxima_audiencia} onChange={set('proxima_audiencia')} /></div>
                </div>
                <div className="space-y-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={set('observacoes')} placeholder="Observações..." rows={2} /></div>
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-1">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editing ? 'Atualizar' : 'Cadastrar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <span>Lista de Processos ({filtered.length})</span>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar por número, cliente ou tipo..." value={search} onChange={e => handleSearch(e.target.value)} className="pl-10" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">{search ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado ainda'}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead><TableHead>Cliente</TableHead><TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead><TableHead>Início</TableHead><TableHead>Próx. Audiência</TableHead>
                        <TableHead>Docs</TableHead><TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map(p => {
                        const sc = statusConfig[p.status] || { label: p.status, variant: 'secondary', color: 'bg-slate-400' }
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-sm font-medium">{p.numero}</TableCell>
                            <TableCell className="font-medium">{p.cliente_nome}</TableCell>
                            <TableCell>{p.tipo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${sc.color}`} />
                                <Badge variant={sc.variant}>{sc.label}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-500">{fmtDate(p.data_inicio)}</TableCell>
                            <TableCell>
                              {p.proxima_audiencia
                                ? <div className="flex items-center gap-1 text-sm text-blue-600"><Calendar className="w-3 h-3" />{fmtDate(p.proxima_audiencia)}</div>
                                : '-'}
                            </TableCell>
                            <TableCell><div className="flex items-center gap-1 text-slate-400"><FileText className="w-4 h-4" /><span className="text-sm">0</span></div></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={safePage} totalPages={totalPages} total={filtered.length} limit={LIMIT} onPageChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
