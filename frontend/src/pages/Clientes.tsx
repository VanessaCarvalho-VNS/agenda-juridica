import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui'
import { Plus, Search, Edit, Trash2, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Pagination } from '../components/Pagination'

interface Cliente { id: number; nome: string; cpf: string; email: string; telefone: string; status: string }
const empty = { nome: '', cpf: '', email: '', telefone: '', status: 'ativo' }
const LIMIT = 10

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Cliente | null>(null)
  const [form, setForm]         = useState(empty)
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    api.getClientes().then(setClientes).catch(() => toast.error('Erro ao carregar clientes')).finally(() => setFetching(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit   = (c: Cliente) => {
    setEditing(c)
    setForm({ nome: c.nome, cpf: c.cpf || '', email: c.email || '', telefone: c.telefone || '', status: c.status })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome) return toast.error('Nome é obrigatório')
    setLoading(true)
    try {
      if (editing) {
        const updated = await api.updateCliente(editing.id, form)
        setClientes(cs => cs.map(c => c.id === editing.id ? updated : c))
        toast.success('Cliente atualizado com sucesso!')
      } else {
        const created = await api.createCliente(form)
        setClientes(cs => [...cs, created])
        toast.success('Cliente cadastrado com sucesso!')
      }
      setOpen(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Confirmar exclusão do cliente?')) return
    try {
      await api.deleteCliente(id)
      setClientes(cs => cs.filter(c => c.id !== id))
      toast.success('Cliente excluído com sucesso!')
    } catch (err: any) { toast.error(err.message) }
  }

  const filtered   = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || (c.cpf || '').includes(search)
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * LIMIT, safePage * LIMIT)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Cadastro de Clientes</h2>
            <p className="text-slate-500">Gerencie todos os clientes do escritório</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
              <DialogHeader className="px-6 pt-5 pb-1 flex-shrink-0 border-b border-slate-100"><DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                <div className="space-y-2"><Label>Nome Completo</Label><Input value={form.nome} onChange={set('nome')} placeholder="Nome do cliente" /></div>
                <div className="space-y-2"><Label>CPF</Label><Input value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-1">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {editing ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <span>Lista de Clientes ({filtered.length})</span>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => handleSearch(e.target.value)} className="pl-10" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell>{c.cpf || '-'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {c.email    && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-3 h-3" />{c.email}</div>}
                              {c.telefone && <div className="text-sm text-slate-600">{c.telefone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'ativo' ? 'success' : 'secondary'}>
                              {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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