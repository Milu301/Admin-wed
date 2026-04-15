import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI, clientAPI } from '../api/client'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { currency, formatDate } from '../utils/formatters'

function CreditsPanel({ client, onClose }) {
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = client?.id || client?.clientId
    if (!id) return
    setLoading(true)
    setError(null)
    clientAPI.getCredits(id)
      .then(({ data }) => setCredits(Array.isArray(data) ? data : data.credits || data.data || []))
      .catch(err => setError(err.response?.data?.message || 'Error al cargar créditos'))
      .finally(() => setLoading(false))
  }, [client])

  const cols = [
    { key: 'creditNumber', label: 'Crédito #', render: (v, r) => <span className="font-mono text-xs text-textSecondary">{v || r.id || '—'}</span> },
    { key: 'principal', label: 'Capital', render: (v) => <span className="text-sm font-medium">{currency(v)}</span> },
    { key: 'balance', label: 'Saldo', render: (v, r) => <span className="text-sm font-semibold text-warning">{currency(v ?? r.remaining_balance)}</span> },
    {
      key: 'status',
      label: 'Estado',
      render: (v) => {
        const map = { active: 'current', paid: 'paid', overdue: 'overdue', vencido: 'overdue', al_dia: 'current', pagado: 'paid' }
        return <Badge status={map[v?.toLowerCase()] || v} label={v} />
      },
    },
    {
      key: 'startDate',
      label: 'Inicio',
      render: (v, r) => {
        const d = v || r.start_date || r.created_at
        return <span className="text-xs text-textSecondary">{d ? formatDate(d) : '—'}</span>
      },
    },
    {
      key: 'installments',
      label: 'Cuotas',
      render: (v, r) => <span className="text-xs text-textSecondary">{v || r.total_installments || '—'}</span>,
    },
  ]

  return (
    <Modal isOpen={!!client} onClose={onClose} title={`Créditos — ${client?.name || client?.fullName || ''}`} size="xl">
      {error && <div className="mb-4 text-sm text-error">{error}</div>}
      <DataTable columns={cols} data={credits} loading={loading} emptyMessage="Este cliente no tiene créditos" keyField="id" pageSize={10} />
    </Modal>
  )
}

export default function Clients() {
  const { admin } = useAuth()
  const adminId = admin?.adminId || admin?.id

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedClient, setSelectedClient] = useState(null)
  const LIMIT = 50
  const searchTimer = useRef(null)

  const fetchClients = useCallback(async (q = '', off = 0, replace = true) => {
    if (!adminId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await adminAPI.getClients(adminId, { q, limit: LIMIT, offset: off })
      const rows = Array.isArray(data) ? data : data.clients || data.data || []
      if (replace) {
        setClients(rows)
      } else {
        setClients(prev => [...prev, ...rows])
      }
      setHasMore(rows.length === LIMIT)
      setOffset(off + rows.length)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => { fetchClients('', 0, true) }, [fetchClients])

  const handleSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setOffset(0)
      fetchClients(q, 0, true)
    }, 400)
  }

  const handleLoadMore = () => {
    fetchClients(search, offset, false)
  }

  const columns = [
    {
      key: 'name',
      label: 'Cliente',
      render: (v, row) => (
        <div>
          <p className="font-medium text-sm text-textPrimary">{v || row.fullName || row.full_name || '—'}</p>
          <p className="text-xs text-textMuted">{row.phone || row.phoneNumber || '—'}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (v, row) => <span className="text-sm text-textSecondary font-mono">{v || row.phoneNumber || '—'}</span>,
    },
    {
      key: 'docId',
      label: 'Doc. ID',
      render: (v, row) => <span className="text-sm text-textSecondary font-mono">{v || row.document_id || row.documentId || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (v, row) => {
        const active = v ?? row.active
        if (typeof active === 'boolean') return <Badge status={active ? 'active' : 'inactive'} />
        const map = { active: 'active', inactive: 'inactive', activo: 'active', inactivo: 'inactive' }
        return <Badge status={map[String(v).toLowerCase()] || 'default'} label={v || '—'} />
      },
    },
    {
      key: 'vendor',
      label: 'Vendedor',
      render: (v, row) => (
        <span className="text-sm text-textSecondary">
          {v || row.vendorName || row.vendor_name || '—'}
        </span>
      ),
    },
    {
      key: 'credits',
      label: 'Ver créditos',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedClient(row) }}
          className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
        >
          Ver
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Clientes</h2>
          <p className="text-textMuted text-sm mt-0.5">{clients.length} registros cargados</p>
        </div>
        <button onClick={() => fetchClients('', 0, true)} className="btn-secondary text-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por nombre, teléfono o documento..."
          className="input-field pl-10 text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-surfaceCard border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={clients}
          loading={loading}
          emptyMessage="No se encontraron clientes"
          keyField="id"
          pageSize={15}
          onRowClick={(row) => setSelectedClient(row)}
        />
      </div>

      {/* Load more */}
      {!loading && hasMore && clients.length > 0 && (
        <div className="flex justify-center">
          <button onClick={handleLoadMore} className="btn-secondary text-sm">
            Cargar más clientes
          </button>
        </div>
      )}

      {/* Credits panel */}
      <CreditsPanel client={selectedClient} onClose={() => setSelectedClient(null)} />
    </div>
  )
}
