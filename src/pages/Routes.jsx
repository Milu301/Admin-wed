import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI, routeAPI } from '../api/client'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

const today = () => new Date().toISOString().split('T')[0]

function Spinner({ cls = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${cls}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
    </svg>
  )
}

// ─── Route Form Modal ─────────────────────────────────────────────────────
function RouteFormModal({ isOpen, onClose, onSaved, initial, adminId }) {
  const [form, setForm] = useState({ name: '', description: '', status: 'active' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? { name: initial.name || '', description: initial.description || '', status: initial.status || 'active' }
        : { name: '', description: '', status: 'active' }
      )
      setError('')
    }
  }, [isOpen, initial])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('El nombre es requerido.'); return }
    setSaving(true)
    try {
      if (initial) {
        await routeAPI.update(initial.id, { name: form.name.trim(), description: form.description || null, status: form.status })
      } else {
        await routeAPI.create(adminId, { name: form.name.trim(), description: form.description || null, status: form.status })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Error al guardar ruta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar ruta' : 'Nueva ruta'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear ruta'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="px-3 py-2 bg-error/10 border border-error/30 rounded-lg text-error text-sm">{error}</div>}
        <div>
          <label className="label">Nombre de la ruta *</label>
          <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Ruta Norte" required />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción opcional..." />
        </div>
        <div>
          <label className="label">Estado</label>
          <div className="flex gap-3">
            {[{ v: 'active', l: 'Activa' }, { v: 'inactive', l: 'Inactiva' }].map(({ v, l }) => (
              <button key={v} type="button"
                onClick={() => setForm(f => ({ ...f, status: v }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${form.status === v
                  ? v === 'active' ? 'bg-success/15 border-success/40 text-success' : 'bg-error/15 border-error/40 text-error'
                  : 'bg-surfaceBright border-border text-textSecondary hover:border-textMuted'}`}
              >{l}</button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ─── Assign Modal ─────────────────────────────────────────────────────────
function AssignModal({ isOpen, onClose, onSaved, route, vendors }) {
  const [form, setForm] = useState({ vendor_id: '', assigned_date: today(), notes: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) { setForm({ vendor_id: vendors[0]?.id || '', assigned_date: today(), notes: '' }); setError('') }
  }, [isOpen, vendors])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.vendor_id) { setError('Selecciona un vendedor.'); return }
    setSaving(true)
    try {
      await routeAPI.assign(route.id, { vendor_id: form.vendor_id, assigned_date: form.assigned_date, notes: form.notes || null })
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Error al asignar ruta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar: ${route?.name || ''}`}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Asignando...' : 'Asignar'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="px-3 py-2 bg-error/10 border border-error/30 rounded-lg text-error text-sm">{error}</div>}
        <div>
          <label className="label">Vendedor *</label>
          <select className="input-field" value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} required>
            <option value="">— Seleccionar vendedor —</option>
            {vendors.map(v => (
              <option key={v.id || v.vendorId} value={v.id || v.vendorId}>{v.name || v.fullName || '—'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Fecha de asignación *</label>
          <input type="date" className="input-field" value={form.assigned_date} onChange={e => setForm(f => ({ ...f, assigned_date: e.target.value }))} required style={{ colorScheme: 'dark' }} />
        </div>
        <div>
          <label className="label">Notas</label>
          <input className="input-field" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional..." />
        </div>
      </form>
    </Modal>
  )
}

// ─── Clients Modal ────────────────────────────────────────────────────────
function RouteClientsModal({ isOpen, onClose, route, adminId }) {
  const [routeClients, setRouteClients] = useState([])
  const [allClients, setAllClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen || !route) return
    setLoadingClients(true)
    setError('')
    Promise.allSettled([
      routeAPI.getClients(route.id),
      adminAPI.getClients(adminId, { limit: 100 }),
    ]).then(([rcRes, acRes]) => {
      if (rcRes.status === 'fulfilled') {
        const d = rcRes.value.data
        const inner = d?.data ?? d
        setRouteClients(Array.isArray(inner) ? inner : inner?.clients || [])
      }
      if (acRes.status === 'fulfilled') {
        const d = acRes.value.data
        const inner = Array.isArray(d) ? d : (d?.data ?? d)
        setAllClients(Array.isArray(inner) ? inner : inner?.clients || [])
      }
    }).finally(() => setLoadingClients(false))
  }, [isOpen, route, adminId])

  const isInRoute = (clientId) => routeClients.some(c => (c.client_id || c.id) === clientId)

  const toggleClient = (client) => {
    const cid = client.id || client.clientId
    if (isInRoute(cid)) {
      setRouteClients(prev => prev.filter(c => (c.client_id || c.id) !== cid))
    } else {
      setRouteClients(prev => [...prev, { client_id: cid, name: client.name || client.fullName, id: cid }])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const clients = routeClients.map((c, i) => ({ client_id: c.client_id || c.id, visit_order: i + 1 }))
      await routeAPI.setClients(route.id, clients)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Error al guardar clientes')
    } finally {
      setSaving(false)
    }
  }

  const filtered = allClients.filter(c => {
    const name = (c.name || c.fullName || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Clientes — ${route?.name || ''}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-sm">Cerrar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Guardando...' : `Guardar (${routeClients.length} clientes)`}
          </button>
        </>
      }
    >
      {error && <div className="px-3 py-2 mb-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">{error}</div>}
      {loadingClients ? (
        <div className="flex justify-center py-8 text-textMuted gap-2"><Spinner /> Cargando...</div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-textMuted">
            <span>{routeClients.length} clientes en la ruta</span>
            <span>{allClients.length} clientes totales</span>
          </div>
          <input
            className="input-field text-sm"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0
              ? <p className="text-center text-textMuted text-sm py-4">Sin resultados</p>
              : filtered.map(client => {
                  const cid = client.id || client.clientId
                  const inRoute = isInRoute(cid)
                  const order = inRoute ? routeClients.findIndex(c => (c.client_id || c.id) === cid) + 1 : null
                  return (
                    <div key={cid}
                      onClick={() => toggleClient(client)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border transition-colors
                        ${inRoute ? 'bg-primary/10 border-primary/30' : 'bg-surfaceBright border-transparent hover:border-border'}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-textPrimary">{client.name || client.fullName || '—'}</p>
                        <p className="text-xs text-textMuted">{client.phone || '—'}</p>
                      </div>
                      {inRoute
                        ? <span className="text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">#{order}</span>
                        : <span className="text-xs text-textMuted">+ Agregar</span>
                      }
                    </div>
                  )
                })
            }
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function Routes() {
  const { admin } = useAuth()
  const adminId = admin?.adminId || admin?.id

  const [routes, setRoutes] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [assignRoute, setAssignRoute] = useState(null)
  const [clientsRoute, setClientsRoute] = useState(null)
  const [deletingRoute, setDeletingRoute] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const showMsg = (msg, type = 'success') => {
    setActionMsg({ msg, type })
    setTimeout(() => setActionMsg(null), 3500)
  }

  const fetchRoutes = useCallback(async () => {
    if (!adminId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await routeAPI.list(adminId)
      const inner = data?.data ?? data
      setRoutes(Array.isArray(inner) ? inner : inner?.routes || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar rutas')
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => { fetchRoutes() }, [fetchRoutes])

  useEffect(() => {
    if (!adminId) return
    adminAPI.getVendors(adminId)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data?.vendors || data?.data || []
        setVendors(list)
      }).catch(() => {})
  }, [adminId])

  const handleDelete = async () => {
    if (!deletingRoute) return
    setDeleting(true)
    try {
      await routeAPI.delete(deletingRoute.id)
      setDeletingRoute(null)
      showMsg('Ruta eliminada.')
      fetchRoutes()
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error al eliminar ruta', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Rutas</h2>
          <p className="text-textMuted text-sm mt-0.5">{routes.length} rutas registradas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRoutes} className="btn-secondary text-sm flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Actualizar
          </button>
          <button onClick={() => { setEditingRoute(null); setShowForm(true) }} className="btn-primary text-sm flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nueva ruta
          </button>
        </div>
      </div>

      {/* Toast */}
      {actionMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm border animate-slide-in ${actionMsg.type === 'error' ? 'bg-error/10 border-error/30 text-error' : 'bg-success/10 border-success/30 text-success'}`}>
          {actionMsg.type === 'error' ? '✗' : '✓'} {actionMsg.msg}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm">{error}</div>
      )}

      {/* Routes list */}
      <div className="bg-surfaceCard border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16 gap-2 text-textMuted">
            <Spinner cls="w-5 h-5" /> Cargando rutas...
          </div>
        ) : routes.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-textMuted">
            <svg className="w-10 h-10 opacity-25" viewBox="0 0 24 24" fill="none">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm">No hay rutas registradas</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Crear primera ruta</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surfaceBright/40">
                {['Ruta', 'Estado', 'Clientes', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-textMuted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map(route => (
                <tr key={route.id} className="border-b border-border/50 hover:bg-surfaceBright/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm text-textPrimary">{route.name}</p>
                    {route.description && <p className="text-xs text-textMuted mt-0.5 max-w-xs truncate">{route.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={route.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-textSecondary">{route.client_count ?? route.clients_count ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button onClick={() => { setEditingRoute(route); setShowForm(true) }}
                        title="Editar" className="p-1.5 rounded-lg text-textMuted hover:text-primary hover:bg-primary/10 transition-colors">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      {/* Manage clients */}
                      <button onClick={() => setClientsRoute(route)}
                        title="Gestionar clientes" className="p-1.5 rounded-lg text-textMuted hover:text-info hover:bg-info/10 transition-colors">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </button>
                      {/* Assign */}
                      <button onClick={() => setAssignRoute(route)}
                        title="Asignar a vendedor" className="p-1.5 rounded-lg text-textMuted hover:text-success hover:bg-success/10 transition-colors">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button onClick={() => setDeletingRoute(route)}
                        title="Eliminar" className="p-1.5 rounded-lg text-textMuted hover:text-error hover:bg-error/10 transition-colors">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <RouteFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingRoute(null) }}
        onSaved={() => { fetchRoutes(); showMsg(editingRoute ? 'Ruta actualizada.' : 'Ruta creada.') }}
        initial={editingRoute}
        adminId={adminId}
      />

      <AssignModal
        isOpen={!!assignRoute}
        onClose={() => setAssignRoute(null)}
        onSaved={() => showMsg('Ruta asignada correctamente.')}
        route={assignRoute}
        vendors={vendors}
      />

      <RouteClientsModal
        isOpen={!!clientsRoute}
        onClose={() => setClientsRoute(null)}
        route={clientsRoute}
        adminId={adminId}
      />

      {/* Delete confirm */}
      <Modal
        isOpen={!!deletingRoute}
        onClose={() => setDeletingRoute(null)}
        title="Eliminar ruta"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeletingRoute(null)} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="bg-error hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-error/15 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 text-error">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-textPrimary font-medium">¿Eliminar <span className="text-error">{deletingRoute?.name}</span>?</p>
            <p className="text-textMuted text-sm mt-1">Esta acción no se puede deshacer.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
