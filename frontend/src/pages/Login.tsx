import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import badgeRS from '../assets/badgeRS.png'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui'

export default function Login() {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ nome: '', email: '', password: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setChecking(false); return }
    api.me()
      .then(() => navigate('/dashboard'))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setChecking(false))
  }, [navigate])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Preencha todos os campos')
    if (form.password.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres')
    if (isSignup && !form.nome) return toast.error('Nome é obrigatório')

    setLoading(true)
    try {
      const data = isSignup
        ? await api.signup(form.nome, form.email, form.password)
        : await api.login(form.email, form.password)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success(isSignup ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0f1729 30%, #0a0e1a 60%, #0d0a0f 100%)',
      }}
    >
      {/* Fundo decorativo — padrão geométrico elegante */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Grade diagonal sutil */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#c0a96e" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Círculo gradiente grande — esquerda */}
        <div className="absolute -left-64 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #1e3a5f 0%, transparent 70%)' }} />

        {/* Círculo gradiente grande — direita */}
        <div className="absolute -right-64 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2d1b4e 0%, transparent 70%)' }} />

        {/* Brilho dourado superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10"
          style={{ background: 'radial-gradient(ellipse, #c0a96e 0%, transparent 70%)' }} />

        {/* Ornamento SVG — topo esquerdo */}
        <svg className="absolute top-8 left-8 w-40 h-40 opacity-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" stroke="#c0a96e" strokeWidth="0.8"/>
          <circle cx="100" cy="100" r="70" stroke="#c0a96e" strokeWidth="0.5"/>
          <circle cx="100" cy="100" r="50" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="10" y1="100" x2="190" y2="100" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="100" y1="10" x2="100" y2="190" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="29" y1="29" x2="171" y2="171" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="171" y1="29" x2="29" y2="171" stroke="#c0a96e" strokeWidth="0.5"/>
        </svg>

        {/* Ornamento SVG — baixo direito */}
        <svg className="absolute bottom-8 right-8 w-48 h-48 opacity-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" stroke="#c0a96e" strokeWidth="0.8"/>
          <circle cx="100" cy="100" r="70" stroke="#c0a96e" strokeWidth="0.5"/>
          <circle cx="100" cy="100" r="50" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="10" y1="100" x2="190" y2="100" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="100" y1="10" x2="100" y2="190" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="29" y1="29" x2="171" y2="171" stroke="#c0a96e" strokeWidth="0.5"/>
          <line x1="171" y1="29" x2="29" y2="171" stroke="#c0a96e" strokeWidth="0.5"/>
        </svg>

        {/* Linhas decorativas horizontais — baixo */}
        <div className="absolute bottom-0 left-0 right-0 h-px opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent, #c0a96e, transparent)' }} />
        <div className="absolute bottom-2 left-0 right-0 h-px opacity-10"
          style={{ background: 'linear-gradient(90deg, transparent, #c0a96e, transparent)' }} />

        {/* Linhas decorativas horizontais — topo */}
        <div className="absolute top-0 left-0 right-0 h-px opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent, #c0a96e, transparent)' }} />
        <div className="absolute top-2 left-0 right-0 h-px opacity-10"
          style={{ background: 'linear-gradient(90deg, transparent, #c0a96e, transparent)' }} />

        {/* Texto decorativo vertical esquerdo */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs tracking-[0.5em] text-slate-600 uppercase opacity-30 whitespace-nowrap select-none">
          Advocacia &amp; Consultoria Jurídica
        </div>

        {/* Texto decorativo vertical direito */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-xs tracking-[0.5em] text-slate-600 uppercase opacity-30 whitespace-nowrap select-none">
          Rute Santos · OAB/SP
        </div>
      </div>

      {/* Card de login */}
      <div className="relative z-10 w-full max-w-md">
        {/* Linha dourada topo do card */}
        <div className="h-px w-full mb-0"
          style={{ background: 'linear-gradient(90deg, transparent, #c0a96e, transparent)' }} />
        <Card className="shadow-2xl border-0 rounded-none rounded-b-2xl"
          style={{ background: 'rgba(10, 12, 22, 0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(192,169,110,0.15)' }}>
          <CardHeader className="space-y-3 text-center pb-6 pt-8">
            <div className="mx-auto w-24 h-26 flex items-center justify-center">
              <img src={badgeRS} alt="Badge RS" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <CardTitle className="text-2xl text-white">Sistema Agenda Jurídica</CardTitle>
            <p className="text-sm" style={{ color: '#8a9ab5' }}>
              {isSignup ? 'Crie sua conta para começar' : 'Acesse sua conta para gerenciar seus processos'}
            </p>
            {/* Divisor dourado */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(192,169,110,0.4))' }} />
              <div className="w-1 h-1 rounded-full" style={{ background: '#c0a96e' }} />
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(192,169,110,0.4), transparent)' }} />
            </div>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-slate-300">Nome</Label>
                  <Input id="nome" placeholder="Seu nome completo" value={form.nome} onChange={set('nome')}
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-yellow-600/60" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')}
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-yellow-600/60" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')}
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-yellow-600/60" />
              </div>
              <Button type="submit" className="w-full mt-2 font-semibold tracking-wide" disabled={loading}
                style={{ background: 'linear-gradient(135deg, #b8960c, #c0a96e, #a07c10)', color: '#0a0a0f', border: 'none' }}>
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSignup ? 'Criando conta...' : 'Entrando...'}</>
                  : isSignup ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-5 text-center">
              <button type="button" onClick={() => setIsSignup(!isSignup)}
                className="text-sm hover:underline transition-colors"
                style={{ color: '#c0a96e' }}>
                {isSignup ? 'Já tem conta? Faça login' : 'Não tem conta? Crie agora'}
              </button>
            </div>
          </CardContent>
        </Card>
        {/* Linha dourada base do card */}
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #c0a96e, transparent)' }} />
      </div>
    </div>
  )
}