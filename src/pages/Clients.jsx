import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI, clientAPI } from '../api/client'

// ─── helpers ────────────────────────────────────────────────────────────── //

const money = (n) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(n)
}

const FREQ_MAP = {
  daily: 'Diaria', weekly: 'Semanal', once: 'Única',
  diario: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal',
}

const INIT_FILTERS = {
  consecutivo: '', nombres: '', apellidos: '', documento: '',
  debe: '', fecha_venta: '', fecha_cancelacion: '', estado_revision: '', frecuencia: '',
}

// ─── tiny sub-components ─────────────────────────────────────────────────── //

function Spinner({ cls = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${cls}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
    </svg>
  )
}

function LV({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-textMuted uppercase tracking-wider">{label}</p>
      <p className="text-xs text-textSecondary mt-0.5 break-words">{value || '—'}</p>
    </div>
  )
}

// ─── expanded panel (inline below row) ───────────────────────────────────── //

function ExpandedPanel({ row, creditsState }) {
  return (
    <div className="bg-surfaceBright/60 px-4 py-3 space-y-3">
      {/* Options button */}
      <div>
        <button className="inline-flex items-center gap-1.5 text-xs text-textSecondary border border-border rounded px-2 py-1 hover:bg-surfaceBright transition-colors">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <circle cx="8" cy="3" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="13" r="1.5" />
          </svg>
          Opciones
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-x-4 gap-y-2">
        <LV label="ESTADO" value={row.verification_status || 'Sin Verificación'} />
        <LV label="DIRECCIÓN" value={row.address} />
        <LV label="NRO SEGURO" value={row.insurance_number} />
        <LV label="VALOR SEGURO" value={row.insurance_value != null ? money(row.insurance_value) : '0,00'} />
        <LV label="NOMBRE CODEUDOR" value={row.cosigner_name} />
        <LV label="TELEFONO CODEUDOR" value={row.cosigner_phone} />
        <LV label="DIRECCION CODEUDOR" value={row.cosigner_address} />
        <LV label="REPORTES" value="—" />
      </div>

      {/* Observations */}
      {row.observations && (
        <div>
          <p className="text-[9px] font-bold text-textMuted uppercase tracking-wider mb-1">
            Observaciones del Cliente
          </p>
          <p className="text-xs text-textSecondary">{row.observations}</p>
        </div>
      )}

      {/* Credits */}
      <div>
        <p className="text-[9px] font-bold text-textMuted uppercase tracking-wider mb-2">
          Historial de Créditos
        </p>
        {(!creditsState || creditsState.loading) && (
          <div className="flex items-center gap-2 text-xs text-textMuted py-1">
            <Spinner cls="w-3.5 h-3.5" /> Cargando créditos...
          </div>
        )}
        {creditsState?.error && (
          <p className="text-xs text-error">{creditsState.error}</p>
        )}
        {creditsState?.data && (
          creditsState.data.length === 0
            ? <p className="text-xs text-textMuted">Sin créditos registrados</p>
            : (
              <div className="flex flex-col gap-1">
                {creditsState.data.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center bg-surface px-2.5 py-1.5 rounded text-xs"
                  >
                    <span className="font-mono text-warning">{c.creditNumber || c.id || '—'}</span>
                    <span className="text-textMuted">
                      Capital: <span className="text-textSecondary font-medium">{money(c.principal)}</span>
                    </span>
                    <span className="text-warning">Saldo: {money(c.balance ?? c.remaining_balance)}</span>
                    <span className={
                      ['active', 'al_dia'].includes(c.status) ? 'text-success' :
                      ['paid', 'pagado'].includes(c.status) ? 'text-info' : 'text-error'
                    }>
                      {c.status || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────── //

export default function Clients() {
  const { admin } = useAuth()
  const adminId = admin?.adminId || admin?.id

  const [clients, setClients]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [offset, setOffset]         = useState(0)
  const [hasMore, setHasMore]       = useState(true)
  const [filters, setFilters]       = useState(INIT_FILTERS)
  const [sentFilters, setSentFilters] = useState({})
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [creditsCache, setCreditsCache] = useState({})

  const LIMIT = 50

  const fetchClients = useCallback(async (params = {}, off = 0, replace = true) => {
    if (!adminId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await adminAPI.getClients(adminId, { ...params, limit: LIMIT, offset: off })
      const inner = Array.isArray(data) ? data : (data?.data ?? data)
      const rows = Array.isArray(inner) ? inner : inner?.clients || inner?.data || []
      if (replace) setClients(rows)
      else setClients(prev => [...prev, ...rows])
      setHasMore(rows.length === LIMIT)
      setOffset(off + rows.length)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => { fetchClients({}, 0, true) }, [fetchClients])

  const handleSearch = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    setSentFilters(params)
    setOffset(0)
    setExpandedRows(new Set())
    fetchClients(params, 0, true)
  }

  const handleClear = () => {
    setFilters(INIT_FILTERS)
    setSentFilters({})
    setOffset(0)
    setExpandedRows(new Set())
    fetchClients({}, 0, true)
  }

  const handleLoadMore = () => fetchClients(sentFilters, offset, false)

  const loadCredits = async (clientId) => {
    setCreditsCache(prev => ({ ...prev, [clientId]: { loading: true, data: null, error: null } }))
    try {
      const { data } = await clientAPI.getCredits(clientId)
      const credits = Array.isArray(data) ? data : data.credits || data.data || []
      setCreditsCache(prev => ({ ...prev, [clientId]: { loading: false, data: credits, error: null } }))
    } catch (err) {
      setCreditsCache(prev => ({
        ...prev,
        [clientId]: { loading: false, data: null, error: err.response?.data?.message || 'Error al cargar' },
      }))
    }
  }

  const toggleRow = (clientId) => {
    const wasExpanded = expandedRows.has(clientId)
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (wasExpanded) next.delete(clientId)
      else next.add(clientId)
      return next
    })
    if (!wasExpanded && !creditsCache[clientId]) {
      loadCredits(clientId)
    }
  }

  const totalBalance = clients.reduce((sum, c) => sum + (c.credit_balance ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Clientes</h2>
          <p className="text-textMuted text-sm mt-0.5">{clients.length} registros cargados</p>
        </div>
        <button onClick={handleClear} className="btn-secondary text-sm flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-surfaceCard border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-x-3 gap-y-2 items-end">
          {[
            { key: 'consecutivo',      label: 'Consecutivo',       type: 'text' },
            { key: 'nombres',          label: 'Nombres',           type: 'text' },
            { key: 'apellidos',        label: 'Apellidos',         type: 'text' },
            { key: 'documento',        label: 'Documento',         type: 'text' },
            { key: 'fecha_venta',      label: 'Fecha Venta',       type: 'date' },
            { key: 'fecha_cancelacion',label: 'Fecha Cancelación', type: 'date' },
          ].map(({ key, label, type }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-textMuted uppercase tracking-wide">{label}</label>
              <input
                type={type}
                value={filters[key]}
                onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="input-field text-xs py-1.5 w-[110px]"
                placeholder={type !== 'date' ? '...' : undefined}
              />
            </div>
          ))}

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-textMuted uppercase tracking-wide">Debe</label>
            <select
              value={filters.debe}
              onChange={e => setFilters(f => ({ ...f, debe: e.target.value }))}
              className="input-field text-xs py-1.5 w-[110px]"
            >
              <option value="">-- Seleccione --</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-textMuted uppercase tracking-wide">Estado Revisión</label>
            <select
              value={filters.estado_revision}
              onChange={e => setFilters(f => ({ ...f, estado_revision: e.target.value }))}
              className="input-field text-xs py-1.5 w-[150px]"
            >
              <option value="">-- Seleccione --</option>
              <option value="verificado">Verificado</option>
              <option value="sin_verificacion">Sin Verificación</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-textMuted uppercase tracking-wide">Frecuencia</label>
            <select
              value={filters.frecuencia}
              onChange={e => setFilters(f => ({ ...f, frecuencia: e.target.value }))}
              className="input-field text-xs py-1.5 w-[120px]"
            >
              <option value="">-- Seleccione --</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="once">Única</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <button onClick={handleSearch} className="btn-primary text-xs px-4 py-1.5">Buscar</button>
            <button onClick={handleClear} className="btn-secondary text-xs px-3 py-1.5">Limpiar</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm">{error}</div>
      )}

      {/* ── Table ── */}
      <div className="bg-surfaceCard border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-border bg-surfaceBright/40">
                <th className="w-10 px-3 py-3" />
                {[
                  'CONSECUTIVO', 'NOMBRE Y APELLIDO', 'TELÉFONOS', 'FRECUENCIA',
                  'VALOR VENTA', 'TOTAL', 'CUOTAS', 'PAGOS/ATRASOS', 'VLR CUOTA', 'SALDO',
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] font-bold text-textMuted uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && clients.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-textMuted text-sm">
                      <Spinner /> Cargando clientes...
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-textMuted text-sm">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                clients.map((row) => {
                  const clientId = row.id || row.clientId
                  const expanded = expandedRows.has(clientId)
                  const isActive = row.credit_status === 'active' || row.active === true || row.status === 'active'
                  const consecutivo = row.consecutivo || row.credit_id || row.id || '—'
                  const name = row.name || row.fullName || row.full_name || '—'
                  const phone = row.phone || row.phoneNumber || '—'
                  const freq = FREQ_MAP[row.frequency || row.credit_frequency] || row.frequency || '—'
                  const interestRate = row.credit_interest_rate ?? 0
                  const paidInst = row.paid_installments ?? 0
                  const overdueInst = row.overdue_installments ?? 0
                  const remainingInst = row.remaining_installments ?? '—'
                  const visits = row.visits ?? row.visit_count ?? '—'

                  return (
                    <React.Fragment key={clientId}>
                      <tr
                        className="border-b border-border/50 hover:bg-surfaceBright/30 transition-colors cursor-pointer"
                        onClick={() => toggleRow(clientId)}
                      >
                        {/* Toggle */}
                        <td className="px-3 py-3 w-10">
                          <button
                            onClick={e => { e.stopPropagation(); toggleRow(clientId) }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold leading-none transition-colors
                              ${expanded
                                ? 'border-primary text-primary bg-primary/10'
                                : 'border-border text-textMuted hover:border-primary hover:text-primary'}`}
                          >
                            {expanded ? '−' : '+'}
                          </button>
                        </td>

                        {/* Consecutivo */}
                        <td className="px-3 py-3">
                          <div className="space-y-0.5">
                            <span className="block text-xs font-mono text-warning">{consecutivo}</span>
                            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold border
                              ${isActive
                                ? 'bg-success/10 text-success border-success/30'
                                : 'bg-error/10 text-error border-error/30'}`}>
                              ({isActive ? 'ACTIVO' : 'INACTIVO'})
                            </span>
                            <span className="inline-block ml-1 text-[10px] px-1.5 py-0.5 rounded border bg-info/10 text-info border-info/30">
                              VISITAS {visits}
                            </span>
                          </div>
                        </td>

                        {/* Nombre */}
                        <td className="px-3 py-3">
                          <span className="text-sm font-medium text-textPrimary">{name}</span>
                        </td>

                        {/* Teléfonos */}
                        <td className="px-3 py-3">
                          <span className="text-sm text-textSecondary font-mono">{phone}</span>
                        </td>

                        {/* Frecuencia */}
                        <td className="px-3 py-3">
                          <span className="text-xs text-textSecondary">{freq}</span>
                        </td>

                        {/* Valor Venta */}
                        <td className="px-3 py-3">
                          <span className="text-sm text-textSecondary">{money(row.credit_total)}</span>
                        </td>

                        {/* Total (interés % + valor) */}
                        <td className="px-3 py-3">
                          <p className="text-[10px] text-textMuted">Interes {interestRate}%</p>
                          <span className="mt-0.5 inline-block text-xs font-semibold bg-surfaceBright text-textPrimary px-1.5 py-0.5 rounded">
                            {money(row.credit_total)}
                          </span>
                        </td>

                        {/* Cuotas */}
                        <td className="px-3 py-3">
                          <span className="text-sm text-textSecondary">
                            {row.installments ?? row.total_installments ?? '—'}
                          </span>
                        </td>

                        {/* Pagos/Atrasos */}
                        <td className="px-3 py-3 min-w-[160px]">
                          <p className="text-xs">
                            <span className="text-error">Atrasadas {overdueInst}</span>
                            <span className="text-textMuted"> / </span>
                            <span className="text-success">Pagas {paidInst}</span>
                          </p>
                          <p className="text-xs text-textMuted">
                            Restantes {remainingInst} (Sanc. 0)
                          </p>
                        </td>

                        {/* Vlr Cuota */}
                        <td className="px-3 py-3">
                          <span className="text-sm text-textSecondary">{money(row.installment_value)}</span>
                        </td>

                        {/* Saldo */}
                        <td className="px-3 py-3">
                          <span className="inline-block bg-surfaceBright text-textPrimary font-bold text-sm px-2 py-1 rounded-lg">
                            {money(row.credit_balance)}
                          </span>
                        </td>
                      </tr>

                      {expanded && (
                        <tr key={`${clientId}-exp`} className="border-b border-border">
                          <td colSpan={11} className="p-0">
                            <ExpandedPanel row={row} creditsState={creditsCache[clientId]} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
            {clients.length > 0 && (
              <tfoot>
                <tr className="border-t border-border bg-surfaceBright/40">
                  <td colSpan={10} className="px-4 py-2.5">
                    <span className="text-xs font-bold text-textMuted uppercase tracking-wide">
                      TOTAL CLIENTES: {clients.length}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-block bg-surfaceBright text-textPrimary font-bold text-sm px-2 py-1 rounded-lg">
                      {money(totalBalance)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {!loading && hasMore && clients.length > 0 && (
        <div className="flex justify-center">
          <button onClick={handleLoadMore} className="btn-secondary text-sm">
            Cargar más clientes
          </button>
        </div>
      )}
    </div>
  )
}
