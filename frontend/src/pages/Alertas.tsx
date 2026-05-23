import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui'
import { Bell, Clock, AlertTriangle, CheckCircle, X, Loader2, Plus, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { fmtDate } from '../lib/utils'

interface Alerta {
  id: number; tipo: string; titulo: string; mensagem: string
  urgencia: string; data_alerta: string; lido: boolean | number
  processo?: string; cliente?: string
}

const emptyForm = { tipo: 'outros', titulo: '', mensagem: '', urgencia: 'media', data_alerta: '', processo: '', cliente: '' }

const tipoConfig: Record<string, { icon: any; label: string; color: string }> = {
  audiencia: { icon: Bell,          label: 'Audiência', color: 'text-blue-500'   },
  prazo:     { icon: Clock,         label: 'Prazo',     color: 'text-red-500'    },
  pagamento: { icon: AlertTriangle, label: 'Pagamento', color: 'text-orange-500' },
  documento: { icon: AlertTriangle, label: 'Documento', color: 'text-purple-500' },
  outros:    { icon: Bell,          label: 'Outros',    color: 'text-slate-500'  },
}

const urgenciaConfig: Record<string, { label: string; variant: any; color: string }> = {
  alta:  { label: 'Alta',  variant: 'destructive', color: 'bg-red-500'    },
  media: { label: 'Média', variant: 'warning',     color: 'bg-yellow-500' },
  baixa: { label: 'Baixa', variant: 'info',        color: 'bg-blue-500'   },
}

export default function Alertas() {
  const [alertas, setAlertas]       = useState<Alerta[]>([])
  const [filtro, setFiltro]         = useState<'todos' | 'nao-lidos' | 'urgentes'>('nao-lidos')
  const [fetching, setFetching]     = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [loading, setLoading]       = useState(false)
  const [expanded, setExpanded]     = useState<Record<number, boolean>>({})  // accordion state

  useEffect(() => {
    api.getAlertas().then(setAlertas).catch(() => toast.error('Erro ao carregar alertas')).finally(() => setFetching(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const isLido = (a: Alerta) => a.lido === true || a.lido === 1

  const toggleExpanded = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo) return toast.error('Título é obrigatório')
    setLoading(true)
    try {
      const created = await api.createAlerta({
        tipo: form.tipo, titulo: form.titulo, mensagem: form.mensagem || null,
        urgencia: form.urgencia, data_alerta: form.data_alerta || null,
        processo: form.processo || null, cliente: form.cliente || null,
      })
      setAlertas(as => [created, ...as])
      toast.success('Alerta criado com sucesso!')
      setCreateOpen(false); setForm(emptyForm)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleMarcarLido = async (id: number) => {
    try {
      const updated = await api.marcarAlertaLido(id)
      setAlertas(as => as.map(a => a.id === id ? updated : a))
      toast.success('Alerta marcado como lido')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleRemover = async (id: number) => {
    try {
      await api.deleteAlerta(id)
      setAlertas(as => as.filter(a => a.id !== id))
      toast.success('Alerta removido')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleMarcarTodosLidos = async () => {
    try {
      await Promise.all(alertas.filter(a => !isLido(a)).map(a => api.marcarAlertaLido(a.id)))
      setAlertas(as => as.map(a => ({ ...a, lido: true })))
      toast.success('Todos os alertas marcados como lidos')
    } catch { toast.error('Erro ao atualizar alertas') }
  }

  const alertasFiltrados = alertas.filter(a => {
    if (filtro === 'nao-lidos') return !isLido(a)
    if (filtro === 'urgentes')  return a.urgencia === 'alta'
    return true
  })

  const naoLidos = alertas.filter(a => !isLido(a)).length
  const urgentes = alertas.filter(a => a.urgencia === 'alta').length

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Sistema de Alertas</h2>
            <p className="text-slate-500">Gerencie alertas de audiências, prazos e compromissos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setForm(emptyForm); setCreateOpen(true) }}>
              <Plus className="w-4 h-4 mr-2" />Novo Alerta
            </Button>
            <Button onClick={handleMarcarTodosLidos} variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />Marcar Todos como Lidos
            </Button>
          </div>
        </div>

        {/* Modal Criar */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Novo Alerta</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="overflow-y-auto flex-1 px-6 pb-6 pt-2 space-y-3">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.titulo} onChange={set('titulo')} placeholder="Ex: Audiência amanhã às 14h" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audiencia">Audiência</SelectItem>
                      <SelectItem value="prazo">Prazo</SelectItem>
                      <SelectItem value="pagamento">Pagamento</SelectItem>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgência</Label>
                  <Select value={form.urgencia} onValueChange={v => setForm(f => ({ ...f, urgencia: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Data do Alerta</Label><Input type="date" value={form.data_alerta} onChange={set('data_alerta')} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Cliente</Label><Input value={form.cliente} onChange={set('cliente')} placeholder="Nome do cliente" /></div>
                <div className="space-y-2"><Label>Processo</Label><Input value={form.processo} onChange={set('processo')} placeholder="Nº do processo" /></div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <textarea value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                  placeholder="Detalhes do alerta..." rows={2}
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 resize-none" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Criar Alerta</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltro('todos')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-slate-500 mb-1">Total de Alertas</p><p className="text-3xl font-bold">{alertas.length}</p></div>
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center"><Bell className="w-6 h-6 text-white" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltro('nao-lidos')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-slate-500 mb-1">Não Lidos</p><p className="text-3xl font-bold">{naoLidos}</p></div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-white" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltro('urgentes')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-slate-500 mb-1">Urgentes</p><p className="text-3xl font-bold">{urgentes}</p></div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center"><Clock className="w-6 h-6 text-white" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <Button variant={filtro === 'todos'     ? 'default' : 'outline'} onClick={() => setFiltro('todos')}>Todos</Button>
          <Button variant={filtro === 'nao-lidos' ? 'default' : 'outline'} onClick={() => setFiltro('nao-lidos')}>Não Lidos ({naoLidos})</Button>
          <Button variant={filtro === 'urgentes'  ? 'default' : 'outline'} onClick={() => setFiltro('urgentes')}>Urgentes ({urgentes})</Button>
        </div>

        {/* Lista com Accordion */}
        {fetching ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : alertasFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Nenhum alerta encontrado</p>
              <p className="text-sm text-slate-500 mt-1">Você está em dia com todos os compromissos!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {alertasFiltrados.map(alerta => {
              const tc       = tipoConfig[alerta.tipo]     || tipoConfig.outros
              const uc       = urgenciaConfig[alerta.urgencia] || urgenciaConfig.media
              const TipoIcon = tc.icon
              const lido     = isLido(alerta)
              const aberto   = !!expanded[alerta.id]

              // verifica se tem conteúdo para expandir
              const temDetalhes = alerta.mensagem || alerta.cliente || alerta.processo || alerta.data_alerta

              return (
                <div
                  key={alerta.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    lido ? 'opacity-60 border-slate-200 bg-white' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                  } ${aberto ? 'shadow-md' : ''}`}
                >
                  {/* ── Cabeçalho clicável ── */}
                  <button
                    className="w-full text-left"
                    onClick={() => temDetalhes && toggleExpanded(alerta.id)}
                  >
                    <div className="flex items-center gap-3 px-4 py-4">
                      {/* Barra de urgência */}
                      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${uc.color}`} />

                      {/* Ícone do tipo */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${lido ? 'bg-slate-100' : 'bg-slate-900'}`}>
                        <TipoIcon className={`w-5 h-5 ${lido ? 'text-slate-400' : 'text-white'}`} />
                      </div>

                      {/* Título + badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${lido ? 'text-slate-400' : 'text-slate-800'}`}>
                            {alerta.titulo}
                          </span>
                          <Badge variant={uc.variant}>{uc.label}</Badge>
                          <Badge variant="outline">{tc.label}</Badge>
                          {lido && <Badge variant="secondary">Lido</Badge>}
                        </div>
                        {/* Preview da mensagem quando fechado */}
                        {!aberto && alerta.mensagem && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{alerta.mensagem}</p>
                        )}
                      </div>

                      {/* Ações + chevron */}
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {!lido && (
                          <Button variant="ghost" size="icon" title="Marcar como lido" onClick={() => handleMarcarLido(alerta.id)}>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Remover" onClick={() => handleRemover(alerta.id)}>
                          <X className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>

                      {/* Chevron indicador */}
                      {temDetalhes && (
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${aberto ? 'rotate-180' : ''}`}
                        />
                      )}
                    </div>
                  </button>

                  {/* ── Corpo accordion ── */}
                  <div
                    style={{
                      maxHeight: aberto ? 400 : 0,
                      opacity:   aberto ? 1 : 0,
                      transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="px-4 pb-4 pt-0 ml-14 space-y-3 border-t border-slate-100">
                      <div className="pt-3 space-y-2">

                        {alerta.mensagem && (
                          <p className="text-sm text-slate-600 leading-relaxed">{alerta.mensagem}</p>
                        )}

                        {(alerta.cliente || alerta.processo) && (
                          <div className="flex flex-wrap gap-4 text-sm">
                            {alerta.cliente && (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <span className="font-medium text-slate-700">Cliente:</span> {alerta.cliente}
                              </div>
                            )}
                            {alerta.processo && (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <span className="font-medium text-slate-700">Processo:</span>
                                <span className="font-mono">{alerta.processo}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {alerta.data_alerta && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>Vence em: <span className="font-medium text-slate-700">{fmtDate(alerta.data_alerta)}</span></span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Configurações automáticas */}
        <Card>
          <CardHeader><CardTitle>Configurações de Alertas Automáticos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { titulo: 'Alertas de Audiência',    desc: 'Receber alertas 1 dia antes das audiências' },
                { titulo: 'Alertas de Prazo',        desc: 'Receber alertas 3 dias antes dos prazos processuais' },
                { titulo: 'Verificação Automática',  desc: 'Sistema verifica e envia alertas diariamente às 08:00' },
              ].map(item => (
                <div key={item.titulo} className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div><p className="font-medium">{item.titulo}</p><p className="text-sm text-slate-500">{item.desc}</p></div>
                  <Badge variant="success">Ativo</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  )
}