import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui'
import { Users, Briefcase, Calendar, DollarSign, TrendingUp, AlertCircle, FileText, Eye, EyeOff } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, defs, linearGradient, stop
} from 'recharts'
import { api } from '../lib/api'
import { fmtDate, fmtCurrency } from '../lib/utils'

export default function Dashboard() {
  const [stats, setStats]               = useState({ clientes: 0, processos: 0, audiencias: 0, recebido: 0 })
  const [contratoStats, setContratoStats] = useState({ ativos: 0, vencidos: 0, valorAtivo: 0 })
  const [proximas, setProximas]         = useState<any[]>([])
  const [alertas, setAlertas]           = useState<any[]>([])
  const [finChart, setFinChart]         = useState<any[]>([])
  const [showRecebido,  setShowRecebido]  = useState(true)
  const [showValorAtivo, setShowValorAtivo] = useState(true)

  const processosChart = [
    { mes: 'Jan', quantidade: 28 }, { mes: 'Fev', quantidade: 35 },
    { mes: 'Mar', quantidade: 42 }, { mes: 'Abr', quantidade: 38 },
    { mes: 'Mai', quantidade: 45 }, { mes: 'Jun', quantidade: 47 },
  ]

  useEffect(() => {
    async function load() {
      try {
        const [clientes, processos, agenda, alertasData, financeiro, contratos] = await Promise.all([
          api.getClientes(), api.getProcessos(), api.getAgenda(), api.getAlertas(), api.getFinanceiro(), api.getContratos()
        ])
        const today = new Date().toISOString().split('T')[0]
        const audienciasHoje = agenda.filter((a: any) => a.data?.startsWith(today)).length
        const totalRecebido  = financeiro.filter((f: any) => f.status === 'pago').reduce((s: number, f: any) => s + Number(f.valor), 0)
        setStats({ clientes: clientes.length, processos: processos.length, audiencias: audienciasHoje, recebido: totalRecebido })

        const ativos     = contratos.filter((c: any) => c.status === 'ativo').length
        const vencidos   = contratos.filter((c: any) => c.status === 'vencido' || c.status === 'encerrado').length
        const valorAtivo = contratos.filter((c: any) => c.status === 'ativo').reduce((s: number, c: any) => s + Number(c.valor || 0), 0)
        setContratoStats({ ativos, vencidos, valorAtivo })

        setProximas(agenda.filter((a: any) => a.data >= today).sort((a: any, b: any) => a.data.localeCompare(b.data)).slice(0, 3))
        setAlertas(alertasData.filter((a: any) => !a.lido && a.lido !== 1).slice(0, 3))

        const byMonth: Record<string, number> = {}
        financeiro.filter((f: any) => f.status === 'pago').forEach((f: any) => {
          const date = (f.data_pagamento || f.data_vencimento || '').split('T')[0]
          if (!date) return
          const key = new Date(date + 'T00:00').toLocaleString('pt-BR', { month: 'short' })
          byMonth[key] = (byMonth[key] || 0) + Number(f.valor)
        })
        setFinChart(Object.entries(byMonth).map(([mes, valor]) => ({ mes, valor })))
      } catch {}
    }
    load()
  }, [])

  const EyeBtn = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors ml-1.5" title={show ? 'Ocultar valor' : 'Mostrar valor'}>
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  // Tooltip customizado para barras
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-slate-300 mb-0.5">{label}</p>
        <p className="font-bold text-white">{payload[0].value} processos</p>
      </div>
    )
  }

  // Tooltip customizado para área
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-slate-300 mb-0.5">{label}</p>
        <p className="font-bold text-green-400">{fmtCurrency(payload[0].value)}</p>
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Stats principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Clientes',  value: stats.clientes,   icon: Users,      bg: 'bg-blue-500',   trend: '+12%' },
            { label: 'Processos Ativos',   value: stats.processos,  icon: Briefcase,  bg: 'bg-green-500',  trend: '+8%'  },
            { label: 'Audiências Hoje',    value: stats.audiencias, icon: Calendar,   bg: 'bg-purple-500', trend: '0%'   },
          ].map(({ label, value, icon: Icon, bg, trend }) => (
            <Card key={label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    <div className="flex items-center gap-1 mt-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm text-green-500">{trend}</span></div>
                  </div>
                  <div className={`${bg} w-12 h-12 rounded-lg flex items-center justify-center`}><Icon className="w-6 h-6 text-white" /></div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-1">
                    <p className="text-sm text-slate-500">Recebido (Total)</p>
                    <EyeBtn show={showRecebido} onToggle={() => setShowRecebido(v => !v)} />
                  </div>
                  <p className="text-2xl font-bold">{showRecebido ? fmtCurrency(stats.recebido) : '••••••'}</p>
                  <div className="flex items-center gap-1 mt-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm text-green-500">+15%</span></div>
                </div>
                <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats contratos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 mb-1">Contratos Ativos</p><p className="text-3xl font-bold">{contratoStats.ativos}</p></div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 mb-1">Contratos Vencidos</p><p className="text-3xl font-bold">{contratoStats.vencidos}</p></div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-1">
                  <p className="text-sm text-slate-500">Valor Total Ativo</p>
                  <EyeBtn show={showValorAtivo} onToggle={() => setShowValorAtivo(v => !v)} />
                </div>
                <p className="text-2xl font-bold">{showValorAtivo ? fmtCurrency(contratoStats.valorAtivo) : '••••••'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
        </div>

        {/* Charts modernos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar Chart — Processos por Mês */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Processos por Mês</CardTitle>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">2024</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={processosChart} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }} />
                  <Bar dataKey="quantidade" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Area Chart — Faturamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Faturamento Mensal</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs text-slate-400">Recebido</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={finChart.length ? finChart : [{ mes: '-', valor: 0 }]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Próximas audiências + alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Próximas Audiências</CardTitle></CardHeader>
            <CardContent>
              {proximas.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Nenhuma audiência agendada</p>
              ) : (
                <div className="space-y-4">
                  {proximas.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div><p className="font-medium">{a.titulo}</p><p className="text-sm text-slate-500">{a.cliente || a.processo || '-'}</p></div>
                      <div className="text-right"><p className="text-sm font-medium">{fmtDate(a.data)}</p><p className="text-sm text-slate-500">{a.hora ? a.hora.slice(0, 5) : ''}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5" />Alertas Pendentes</CardTitle></CardHeader>
            <CardContent>
              {alertas.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Nenhum alerta pendente</p>
              ) : (
                <div className="space-y-4">
                  {alertas.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.urgencia === 'alta' ? 'bg-red-500' : a.urgencia === 'media' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <div><p className="font-medium text-sm">{a.titulo}</p><p className="text-sm text-slate-500">{a.mensagem}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  )
}
