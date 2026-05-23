import { useState, useEffect, useRef, useCallback } from 'react'
import { Layout } from '../components/Layout'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge, Textarea,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui'
import { Plus, Calendar as CalendarIcon, Clock, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { fmtDate, toInputDate } from '../lib/utils'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

interface Evento {
  id: number; titulo: string; tipo: string; data: string; hora: string
  cliente: string; processo: string; local: string; observacoes: string
}

const tipoColors: Record<string, { bg: string; border: string; label: string }> = {
  audiencia: { bg: '#3b82f6', border: '#2563eb', label: 'Audiência' },
  prazo:     { bg: '#ef4444', border: '#dc2626', label: 'Prazo' },
  reuniao:   { bg: '#8b5cf6', border: '#7c3aed', label: 'Reunião' },
  outros:    { bg: '#64748b', border: '#475569', label: 'Outros' },
}

const badgeVariant: Record<string, any> = {
  audiencia: 'info', prazo: 'destructive', reuniao: 'default', outros: 'secondary',
}

const empty = { titulo: '', tipo: 'audiencia', data: '', hora: '09:00', cliente: '', processo: '', local: '', observacoes: '' }

function toFCEvent(ev: Evento) {
  const colors = tipoColors[ev.tipo] || tipoColors.outros
  const hora = ev.hora ? ev.hora.slice(0, 5) : '00:00'
  const start = `${ev.data.split('T')[0]}T${hora}`
  return {
    id: String(ev.id),
    title: ev.titulo,
    start,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: '#ffffff',
    extendedProps: { ...ev },
  }
}

export default function Agenda() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Evento | null>(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const calendarRef = useRef<any>(null)

  useEffect(() => {
    api.getAgenda()
      .then(data => setEventos(data))
      .catch(() => toast.error('Erro ao carregar agenda'))
      .finally(() => setFetching(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = useCallback((dateStr?: string) => {
    setEditing(null)
    setForm({ ...empty, data: dateStr || '' })
    setOpen(true)
  }, [])

  const openEdit = useCallback((ev: Evento) => {
    setEditing(ev)
    setForm({
      titulo: ev.titulo, tipo: ev.tipo,
      data: toInputDate(ev.data),
      hora: ev.hora ? ev.hora.slice(0, 5) : '',
      cliente: ev.cliente || '', processo: ev.processo || '',
      local: ev.local || '', observacoes: ev.observacoes || '',
    })
    setOpen(true)
  }, [])

  const handleDateClick = useCallback((arg: { dateStr: string }) => {
    openCreate(arg.dateStr)
  }, [openCreate])

  const handleEventClick = useCallback((info: any) => {
    const ev: Evento = info.event.extendedProps
    const colors = tipoColors[ev.tipo] || tipoColors.outros
    toast.info(
      <div className="space-y-1 text-sm">
        <p className="font-bold text-base">{ev.titulo}</p>
        <p>📅 {fmtDate(ev.data)}{ev.hora ? ' às ' + ev.hora.slice(0,5) : ''}</p>
        {ev.cliente   && <p>👤 {ev.cliente}</p>}
        {ev.processo  && <p>📋 {ev.processo}</p>}
        {ev.local     && <p>📍 {ev.local}</p>}
        {ev.observacoes && <p className="text-slate-500 mt-1">{ev.observacoes}</p>}
      </div>,
      {
        duration: 6000,
        style: { borderLeft: `4px solid ${colors.bg}` },
        action: { label: 'Editar', onClick: () => openEdit(ev) },
      }
    )
  }, [openEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo || !form.data) return toast.error('Título e data são obrigatórios')
    setLoading(true)
    try {
      if (editing) {
        const updated = await api.updateAgenda(editing.id, form)
        setEventos(evs => evs.map(ev => ev.id === editing.id ? updated : ev))
        toast.success('Evento atualizado!')
      } else {
        const created = await api.createAgenda(form)
        setEventos(evs => [...evs, created])
        toast.success('Evento adicionado à agenda!')
      }
      setOpen(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Confirmar exclusão?')) return
    try {
      await api.deleteAgenda(id)
      setEventos(evs => evs.filter(ev => ev.id !== id))
      toast.success('Evento excluído!')
    } catch (err: any) { toast.error(err.message) }
  }

  const today = new Date()
  const proximos = [...eventos]
    .filter(ev => {
      const d = new Date(`${ev.data.split('T')[0]}T${ev.hora || '00:00'}`)
      return d >= today
    })
    .sort((a, b) =>
      new Date(`${a.data.split('T')[0]}T${a.hora||'00:00'}`).getTime() -
      new Date(`${b.data.split('T')[0]}T${b.hora||'00:00'}`).getTime()
    )
    .slice(0, 5)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Agenda Jurídica</h2>
            <p className="text-slate-500">Gerencie audiências, prazos e compromissos</p>
          </div>
          <Button onClick={() => openCreate()}>
            <Plus className="w-4 h-4 mr-2" />Novo Evento
          </Button>
        </div>

        {/* Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>{editing ? 'Editar Evento' : 'Adicionar Evento à Agenda'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 pb-6 pt-2 space-y-3">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.titulo} onChange={set('titulo')} placeholder="Ex: Audiência - Cliente X" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audiencia">Audiência</SelectItem>
                    <SelectItem value="prazo">Prazo Processual</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data/Hora Início</Label>
                  <Input type="date" value={form.data} onChange={set('data')} />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" value={form.hora} onChange={set('hora')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input value={form.cliente} onChange={set('cliente')} placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <Label>Processo</Label>
                <Input value={form.processo} onChange={set('processo')} placeholder="Número do processo" />
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input value={form.local} onChange={set('local')} placeholder="Vara, fórum, endereço..." />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={set('observacoes')} placeholder="Detalhes sobre o evento..." rows={2} />
              </div>
              <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-white/90 pb-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editing ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Legenda */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-5">
              {Object.entries(tipoColors).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: val.bg }} />
                  <span className="text-sm">{val.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendário */}
        <Card>
          <CardContent className="p-6">
            {fetching ? (
              <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
                locale="pt-br"
                events={eventos.map(toFCEvent)}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="auto"
                editable={false}
                selectable={true}
                dayMaxEvents={3}
                weekends={true}
                firstDay={0}
                eventDisplay="block"
              />
            )}
          </CardContent>
        </Card>

        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximos.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Nenhum evento futuro</p>
            ) : (
              <div className="space-y-3">
                {proximos.map(ev => {
                  const colors = tipoColors[ev.tipo] || tipoColors.outros
                  const hora = ev.hora ? ev.hora.slice(0, 5) : ''
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: colors.bg }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{ev.titulo}</p>
                            {ev.cliente   && <p className="text-sm text-slate-500">Cliente: {ev.cliente}</p>}
                            {ev.processo  && <p className="text-sm text-slate-500">Processo: {ev.processo}</p>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge variant={badgeVariant[ev.tipo] || 'secondary'}>{colors.label}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />{fmtDate(ev.data)}
                          </div>
                          {hora && <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{hora}</div>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
