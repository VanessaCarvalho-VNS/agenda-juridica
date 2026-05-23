import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui'
import { Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { fmtDate, fmtCurrency, toInputDate } from '../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts'
import { Pagination } from '../components/Pagination'

interface Honorario {
  id: number; cliente: string; processo: string; valor: number
  data_vencimento: string; data_pagamento?: string; status: string
  forma_pagamento?: string; observacoes?: string
}
const emptyForm = { cliente:'', processo:'', valor:'', data_vencimento:'', data_pagamento:'', status:'pendente', forma_pagamento:'', observacoes:'' }
const statusConfig: Record<string, { label:string; variant:any; icon:any; color:string }> = {
  pago:     { label:'Pago',     variant:'success',     icon:CheckCircle, color:'text-green-500'  },
  pendente: { label:'Pendente', variant:'warning',     icon:AlertCircle, color:'text-yellow-500' },
  atrasado: { label:'Atrasado', variant:'destructive', icon:AlertCircle, color:'text-red-500'    },
}
const LIMIT = 10

// Tooltip customizado para o gráfico de barras (Recebimentos)
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
      <p className="font-semibold text-slate-300 mb-0.5">{label}</p>
      <p className="font-bold text-indigo-300">{fmtCurrency(payload[0].value)}</p>
    </div>
  )
}

// Tooltip customizado para o gráfico de área (Evolução)
const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
      <p className="font-semibold text-slate-300 mb-0.5">{label}</p>
      <p className="font-bold text-green-300">{fmtCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function Financeiro() {
  const [honorarios, setHonorarios]     = useState<Honorario[]>([])
  const [createOpen, setCreateOpen]     = useState(false)
  const [editOpen, setEditOpen]         = useState(false)
  const [detalhesOpen, setDetalhesOpen] = useState(false)
  const [selected, setSelected]         = useState<Honorario | null>(null)
  const [editing, setEditing]           = useState<Honorario | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [form, setForm]                 = useState(emptyForm)
  const [loading, setLoading]           = useState(false)
  const [fetching, setFetching]         = useState(true)
  const [page, setPage]                 = useState(1)
  const [showRecebido, setShowRecebido] = useState(true)
  const [showPendente, setShowPendente] = useState(true)
  const [showAtrasado, setShowAtrasado] = useState(true)

  useEffect(() => {
    api.getFinanceiro().then(setHonorarios).catch(() => toast.error('Erro ao carregar financeiro')).finally(() => setFetching(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const totalRecebido = honorarios.filter(h => h.status==='pago').reduce((a,h) => a+Number(h.valor), 0)
  const totalPendente = honorarios.filter(h => h.status==='pendente').reduce((a,h) => a+Number(h.valor), 0)
  const totalAtrasado = honorarios.filter(h => h.status==='atrasado').reduce((a,h) => a+Number(h.valor), 0)

  // Dados para o gráfico de barras (recebido por mês)
  const byMonth: Record<string,number> = {}
  honorarios.filter(h => h.status==='pago').forEach(h => {
    const date = h.data_pagamento||h.data_vencimento; if(!date) return
    const d = new Date(date.split('T')[0]+'T00:00')
    const key = d.toLocaleString('pt-BR',{month:'short'})
    byMonth[key] = (byMonth[key]||0)+Number(h.valor)
  })
  const chartData = Object.entries(byMonth).map(([mes,recebido]) => ({mes,recebido}))

  // Dados para o gráfico de área (acumulado)
  const areaData = chartData.reduce((acc: any[], cur, i) => {
    const prev = acc[i - 1]?.acumulado || 0
    return [...acc, { ...cur, acumulado: prev + cur.recebido }]
  }, [])

  // Cores das barras — destaque para o mês com maior valor
  const maxRecebido = Math.max(...chartData.map(d => d.recebido), 0)

  const filtered   = honorarios.filter(h => filtroStatus==='todos' || h.status===filtroStatus)
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage-1)*LIMIT, safePage*LIMIT)

  const handleFiltro = (v: string) => { setFiltroStatus(v); setPage(1) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente||!form.valor||!form.data_vencimento) return toast.error('Cliente, valor e vencimento são obrigatórios')
    setLoading(true)
    try {
      const created = await api.createFinanceiro({ cliente:form.cliente, processo:form.processo||null,
        valor:parseFloat(form.valor), data_vencimento:form.data_vencimento, data_pagamento:form.data_pagamento||null,
        status:form.status, forma_pagamento:form.forma_pagamento||null, observacoes:form.observacoes||null })
      setHonorarios(hs => [...hs, created]); toast.success('Honorário cadastrado!'); setCreateOpen(false); setForm(emptyForm)
    } catch (err:any) { toast.error(err.message) } finally { setLoading(false) }
  }

  const openEdit = (h: Honorario) => {
    setEditing(h)
    setForm({ cliente:h.cliente||'', processo:h.processo||'', valor:h.valor?String(h.valor):'',
      data_vencimento:toInputDate(h.data_vencimento), data_pagamento:h.data_pagamento?toInputDate(h.data_pagamento):'',
      status:h.status||'pendente', forma_pagamento:h.forma_pagamento||'', observacoes:h.observacoes||'' })
    setEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if(!editing) return
    if (!form.cliente||!form.valor||!form.data_vencimento) return toast.error('Cliente, valor e vencimento são obrigatórios')
    setLoading(true)
    try {
      const updated = await api.updateFinanceiro(editing.id, { cliente:form.cliente, processo:form.processo||null,
        valor:parseFloat(form.valor), data_vencimento:form.data_vencimento, data_pagamento:form.data_pagamento||null,
        status:form.status, forma_pagamento:form.forma_pagamento||null, observacoes:form.observacoes||null })
      setHonorarios(hs => hs.map(h => h.id===editing.id?updated:h)); toast.success('Honorário atualizado!'); setEditOpen(false)
    } catch (err:any) { toast.error(err.message) } finally { setLoading(false) }
  }

  const handleRegistrarPagamento = async (h: Honorario) => {
    try {
      const updated = await api.updateFinanceiro(h.id, { cliente:h.cliente, processo:h.processo||null, valor:Number(h.valor),
        data_vencimento:toInputDate(h.data_vencimento), data_pagamento:new Date().toISOString().split('T')[0],
        status:'pago', forma_pagamento:h.forma_pagamento||'PIX', observacoes:h.observacoes||null })
      setHonorarios(hs => hs.map(item => item.id===h.id?updated:item)); toast.success('Pagamento registrado!'); setDetalhesOpen(false)
    } catch (err:any) { toast.error(err.message) }
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Confirmar exclusão?')) return
    try { await api.deleteFinanceiro(id); setHonorarios(hs => hs.filter(h => h.id!==id)); toast.success('Lançamento excluído!') }
    catch (err:any) { toast.error(err.message) }
  }

  const renderFormFields = () => (
    <>
      <div className="space-y-2"><Label>Cliente *</Label><Input value={form.cliente} onChange={set('cliente')} placeholder="Nome do cliente" /></div>
      <div className="space-y-2"><Label>Processo</Label><Input value={form.processo} onChange={set('processo')} placeholder="Número do processo" /></div>
      <div className="space-y-2"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.valor} onChange={set('valor')} placeholder="0.00" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Vencimento *</Label><Input type="date" value={form.data_vencimento} onChange={set('data_vencimento')} /></div>
        <div className="space-y-2"><Label>Pagamento</Label><Input type="date" value={form.data_pagamento} onChange={set('data_pagamento')} /></div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={v => setForm(f => ({...f,status:v}))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Forma de Pagamento</Label><Input value={form.forma_pagamento} onChange={set('forma_pagamento')} placeholder="PIX, TED, Boleto..." /></div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <textarea value={form.observacoes} onChange={e => setForm(f=>({...f,observacoes:e.target.value}))} placeholder="Observações..." rows={2}
          className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 resize-none" />
      </div>
    </>
  )

  const EyeBtn = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors ml-1" title={show?'Ocultar':'Mostrar'}>
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h2 className="text-2xl font-bold">Controle Financeiro</h2><p className="text-slate-500">Gerencie honorários e pagamentos</p></div>
          <Button onClick={() => { setForm(emptyForm); setCreateOpen(true) }}><Plus className="w-4 h-4 mr-2" />Cadastrar Honorário</Button>
        </div>

        {/* Modais */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col"><DialogHeader className="px-6 pt-5 pb-1 flex-shrink-0 border-b border-slate-100"><DialogTitle>Cadastrar Honorário</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">{renderFormFields()}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-1"><Button type="button" variant="outline" onClick={()=>setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading&&<Loader2 className="w-4 h-4 animate-spin mr-2"/>}Cadastrar</Button></div>
            </form></DialogContent>
        </Dialog>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col"><DialogHeader className="px-6 pt-5 pb-1 flex-shrink-0 border-b border-slate-100"><DialogTitle>Editar Honorário</DialogTitle></DialogHeader>
            <form onSubmit={handleEdit} className="overflow-y-auto flex-1 px-6 py-4 space-y-3">{renderFormFields()}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-1"><Button type="button" variant="outline" onClick={()=>setEditOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading&&<Loader2 className="w-4 h-4 animate-spin mr-2"/>}Salvar</Button></div>
            </form></DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-1"><p className="text-sm text-slate-500">Total Recebido</p><EyeBtn show={showRecebido} onToggle={()=>setShowRecebido(v=>!v)} /></div>
                <p className="text-2xl font-bold text-green-600">{showRecebido ? fmtCurrency(totalRecebido) : '••••••'}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-white"/></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-1"><p className="text-sm text-slate-500">Pendente</p><EyeBtn show={showPendente} onToggle={()=>setShowPendente(v=>!v)} /></div>
                <p className="text-2xl font-bold text-yellow-600">{showPendente ? fmtCurrency(totalPendente) : '••••••'}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-white"/></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-1"><p className="text-sm text-slate-500">Atrasado</p><EyeBtn show={showAtrasado} onToggle={()=>setShowAtrasado(v=>!v)} /></div>
                <p className="text-2xl font-bold text-red-600">{showAtrasado ? fmtCurrency(totalAtrasado) : '••••••'}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center"><AlertCircle className="w-6 h-6 text-white"/></div>
            </div>
          </CardContent></Card>
        </div>

        {/* Gráficos lado a lado */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Barras — Recebimentos por mês com destaque no pico */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/>Recebimentos por Mês</CardTitle>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Pagos</span>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barSize={30} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.75} />
                      </linearGradient>
                      <linearGradient id="barGradFinPeak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }} />
                    <Bar dataKey="recebido" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.recebido === maxRecebido ? 'url(#barGradFinPeak)' : 'url(#barGradFin)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Área — Evolução acumulada */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/>Receita Acumulada</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-xs text-slate-400">Acumulado</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomAreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="acumulado"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      fill="url(#areaGradFin)"
                      dot={{ fill: '#6366F1', strokeWidth: 2, r: 4, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {(['todos','pago','pendente','atrasado'] as const).map(s => (
            <Button key={s} variant={filtroStatus===s?'default':'outline'} onClick={()=>handleFiltro(s)}>
              {s==='todos'?'Todos':statusConfig[s]?.label||s}
            </Button>
          ))}
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader><CardTitle>Honorários ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400"/></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Nenhum honorário encontrado</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead><TableHead>Processo</TableHead><TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead><TableHead>Pagamento</TableHead><TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map(h => {
                        const sc = statusConfig[h.status]||{label:h.status,variant:'secondary',icon:AlertCircle,color:''}
                        const StatusIcon = sc.icon
                        return (
                          <TableRow key={h.id}>
                            <TableCell className="font-medium">{h.cliente}</TableCell>
                            <TableCell className="text-slate-500 font-mono text-sm">{h.processo||'-'}</TableCell>
                            <TableCell className="font-semibold">{fmtCurrency(Number(h.valor))}</TableCell>
                            <TableCell className="text-slate-500">{fmtDate(h.data_vencimento)}</TableCell>
                            <TableCell className="text-slate-500">{h.data_pagamento?fmtDate(h.data_pagamento):'-'}</TableCell>
                            <TableCell><div className="flex items-center gap-2"><StatusIcon className={`w-4 h-4 ${sc.color}`}/><Badge variant={sc.variant}>{sc.label}</Badge></div></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={()=>{setSelected(h);setDetalhesOpen(true)}}><Eye className="w-4 h-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={()=>openEdit(h)}><Edit className="w-4 h-4"/></Button>
                                {h.status!=='pago'&&<Button variant="ghost" size="icon" onClick={()=>handleRegistrarPagamento(h)}><CheckCircle className="w-4 h-4 text-green-500"/></Button>}
                                <Button variant="ghost" size="icon" onClick={()=>handleDelete(h.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
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

        {/* Detalhes */}
        <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <DialogTitle>Detalhes do Honorário</DialogTitle>
                {selected&&<Button size="sm" variant="outline" onClick={()=>{setDetalhesOpen(false);setTimeout(()=>openEdit(selected),50)}}><Edit className="w-4 h-4 mr-2"/>Editar</Button>}
              </div>
            </DialogHeader>
            {selected&&(
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Cliente</Label><p className="text-sm mt-1">{selected.cliente}</p></div>
                  <div><Label>Processo</Label><p className="text-sm mt-1 font-mono">{selected.processo||'-'}</p></div>
                  <div><Label>Valor</Label><p className="text-lg font-bold mt-1">{fmtCurrency(Number(selected.valor))}</p></div>
                  <div><Label>Status</Label><div className="mt-1"><Badge variant={statusConfig[selected.status]?.variant||'secondary'}>{statusConfig[selected.status]?.label||selected.status}</Badge></div></div>
                  <div><Label>Vencimento</Label><p className="text-sm mt-1">{fmtDate(selected.data_vencimento)}</p></div>
                  <div><Label>Pagamento</Label><p className="text-sm mt-1">{selected.data_pagamento?fmtDate(selected.data_pagamento):'Não pago'}</p></div>
                  {selected.forma_pagamento&&<div className="col-span-2"><Label>Forma</Label><p className="text-sm mt-1">{selected.forma_pagamento}</p></div>}
                  {selected.observacoes&&<div className="col-span-2"><Label>Observações</Label><p className="text-sm mt-1 text-slate-600">{selected.observacoes}</p></div>}
                </div>
                {selected.status!=='pago'&&<Button className="w-full" onClick={()=>handleRegistrarPagamento(selected)}><CheckCircle className="w-4 h-4 mr-2"/>Registrar Pagamento</Button>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
