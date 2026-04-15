import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI, vendorAPI } from '../api/client'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { useToast } from '../components/Toast'

const EMPTY_FORM = { name: '', email: '', password: '', phone: '' }

export default function Vendors() {
  const { admin } = useAuth()
  const adminId = admin?.adminId || admin?.id

  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [showReset, setShowReset] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, showToast] = useToast()

  const fetchVendors = useCallback(async () => {
    if (!adminId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await adminAPI.getVendors(adminId)
      setVendors(Array.isArray(data) ? data : data.vendors || data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar vendedores')
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Nombre, correo y contraseña son requeridos.')
      return
    }
    setSubmitting(true)
    try {
      await adminAPI.createVendor(adminId, form)
      setShowCreate(false)
      setForm(EMPTY_FORM)
      showToast('Vendedor creado correctamente.')
      fetchVendors()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al crear vendedor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (vendor) => {
    try {
      await vendorAPI.toggleStatus(vendor.id || vendor.vendorId, !(vendor.active ?? vendor.status === 'active'))
      showToast(`Vendedor ${vendor.active ? 'desactivado' : 'activado'}.`)
      fetchVendors()
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cambiar estado', 'error')
    }
  }

  const handleResetDevice = async () => {
    if (!showReset) return
    setSubmitting(true)
    try {
      await vendorAPI.resetDevice(showReset.id || showReset.vendorId)
      setShowReset(null)
      showToast('Dispositivo reiniciado. El vendedor deberá iniciar sesión de nuevo.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al reiniciar dispositivo', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    setSubmitting(true)
    try {
      await vendorAPI.delete(showDelete.id || showDelete.vendorId)
      setShowDelete(null)
      showToast('Vendedor eliminado.')
      fetchVendors()
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al eliminar vendedor', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (v, row) => (
        <div>
          <p className="font-medium text-textPrimary text-sm">{v || row.fullName || '—'}</p>
          <p className="text-xs text-textMuted">{row.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Estado',
      render: (v, row) => {
        const isActive = v ?? row.status === 'active'
        return <Badge status={isActive ? 'active' : 'inactive'} />
      },
    },
    {
      key: 'routeCount',
      label: 'Rutas',
      render: (v, row) => (
        <span className="text-sm text-textSecondary font-mono">
          {v ?? row.routes_count ?? row.route_count ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row) }}
            title={(row.active ?? row.status === 'active') ? 'Desactivar' : 'Activar'}
            className="p-1.5 rounded-lg text-textMuted hover:text-warning hover:bg-warning/10 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowReset(row) }}
            title="Reiniciar dispositivo"
            className="p-1.5 rounded-lg text-textMuted hover:text-info hover:bg-info/10 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDelete(row) }}
            title="Eliminar"
            className="p-1.5 rounded-lg text-textMuted hover:text-error hover:bg-error/10 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Vendedores</h2>
          <p className="text-textMuted text-sm mt-0.5">{vendors.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchVendors} className="btn-secondary text-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Actualizar
          </button>
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowCreate(true) }}
            className="btn-primary text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nuevo vendedor
          </button>
        </div>
      </div>

      {toast}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-surfaceCard border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={vendors}
          loading={loading}
          emptyMessage="No hay vendedores registrados"
          keyField="id"
        />
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo Vendedor"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={handleCreate} disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Creando...' : 'Crear vendedor'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
              {formError}
            </div>
          )}
          <div>
            <label className="label">Nombre completo *</label>
            <input
              className="input-field"
              placeholder="Juan Pérez"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Correo electrónico *</label>
            <input
              type="email"
              className="input-field"
              placeholder="vendedor@ejemplo.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Contraseña *</label>
            <input
              type="password"
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              type="tel"
              className="input-field"
              placeholder="5512345678"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      {/* Reset Device Modal */}
      <Modal
        isOpen={!!showReset}
        onClose={() => setShowReset(null)}
        title="Reiniciar dispositivo"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowReset(null)} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={handleResetDevice} disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Reiniciando...' : 'Confirmar'}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-info/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-info">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-textPrimary font-medium">
              ¿Reiniciar dispositivo de <span className="text-info">{showReset?.name}</span>?
            </p>
            <p className="text-textMuted text-sm mt-1">
              El vendedor deberá iniciar sesión nuevamente en la aplicación móvil.
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        title="Eliminar vendedor"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowDelete(null)} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={handleDelete} disabled={submitting} className="bg-error hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2">
              {submitting ? 'Eliminando...' : 'Eliminar'}
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
            <p className="text-textPrimary font-medium">
              ¿Eliminar a <span className="text-error">{showDelete?.name}</span>?
            </p>
            <p className="text-textMuted text-sm mt-1">
              Esta acción no se puede deshacer. Se eliminarán todos sus datos.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
