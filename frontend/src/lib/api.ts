const BASE_URL = import.meta.env.VITE_API_URL ||  '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro na requisição')
  return data
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (nome: string, email: string, password: string) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ nome, email, password }) }),
  me: () => request('/auth/me'),

  // Clientes
  getClientes: () => request('/clientes'),
  createCliente: (data: object) => request('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateCliente: (id: number, data: object) => request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCliente: (id: number) => request(`/clientes/${id}`, { method: 'DELETE' }),

  // Processos
  getProcessos: () => request('/processos'),
  createProcesso: (data: object) => request('/processos', { method: 'POST', body: JSON.stringify(data) }),
  updateProcesso: (id: number, data: object) => request(`/processos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProcesso: (id: number) => request(`/processos/${id}`, { method: 'DELETE' }),

  // Agenda
  getAgenda: () => request('/agenda'),
  createAgenda: (data: object) => request('/agenda', { method: 'POST', body: JSON.stringify(data) }),
  updateAgenda: (id: number, data: object) => request(`/agenda/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAgenda: (id: number) => request(`/agenda/${id}`, { method: 'DELETE' }),

  // Alertas
  getAlertas: () => request('/alertas'),
  createAlerta: (data: object) => request('/alertas', { method: 'POST', body: JSON.stringify(data) }),
  updateAlerta: (id: number, data: object) => request(`/alertas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  marcarAlertaLido: (id: number) => request(`/alertas/${id}/lido`, { method: 'PATCH' }),
  deleteAlerta: (id: number) => request(`/alertas/${id}`, { method: 'DELETE' }),

  // Financeiro
  getFinanceiro: () => request('/financeiro'),
  createFinanceiro: (data: object) => request('/financeiro', { method: 'POST', body: JSON.stringify(data) }),
  updateFinanceiro: (id: number, data: object) => request(`/financeiro/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinanceiro: (id: number) => request(`/financeiro/${id}`, { method: 'DELETE' }),

  // Contratos
  getContratos: () => request('/contratos'),
  createContrato: (data: object) => request('/contratos', { method: 'POST', body: JSON.stringify(data) }),
  updateContrato: (id: number, data: object) => request(`/contratos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContrato: (id: number) => request(`/contratos/${id}`, { method: 'DELETE' }),
}