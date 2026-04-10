import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI } from '../api/client'
import StatCard from '../components/StatCard'

const fmt = (n, opts = {}) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', { ...opts }).format(n)
}

const currency = (n) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export default function Dashboard() {
  const { admin } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchStats = useCallback(async () => {
    if (!admin?.adminId && !admin?.id) return
    const id = admin.adminId || admin.id
    setLoading(true)
    setError(null)
    try {
      const { data } = await adminAPI.getStats(id)
      setStats(data)
      setLastUpdate(new Date())
    } catch (err) {
      if (err.response?.status === 404) {
        // Gracefully show zeros
        setStats({})
      } else {
        setError(err.response?.data?.message || 'Error al cargar estadísticas')
      }
    } finally {
      setLoading(false)
    }
  }, [admin])

  useEffect(() => { fetchStats() }, [fetchStats])

  const cards = [
    {
      title: 'Total Vendedores',
      value: fmt(stats?.totalVendors ?? stats?.vendors_count ?? 0),
      subtitle: 'Vendedores registrados',
      icon: '👥',
      color: 'primary',
    },
    {
      title: 'Total Clientes',
      value: fmt(stats?.totalClients ?? stats?.clients_count ?? 0),
      subtitle: 'Clientes activos',
      icon: '🧑‍💼',
      color: 'info',
    },
    {
      title: 'Créditos Activos',
      value: fmt(stats?.activeCredits ?? stats?.active_credits ?? 0),
      subtitle: 'En circulación',
      icon: '💳',
      color: 'success',
    },
    {
      title: 'Cartera Total',
      value: currency(stats?.totalPortfolio ?? stats?.total_portfolio ?? stats?.portfolio ?? 0),
      subtitle: 'Saldo vigente',
      icon: '💰',
      color: 'success',
    },
    {
      title: 'Monto Vencido',
      value: currency(stats?.overdueAmount ?? stats?.overdue_amount ?? stats?.overdue ?? 0),
      subtitle: 'Créditos vencidos',
      icon: '⚠️',
      color: 'error',
    },
    {
      title: 'Cobros de Hoy',
      value: currency(stats?.todayCollections ?? stats?.today_collections ?? stats?.today ?? 0),
      subtitle: 'Cobros del día',
      icon: '📈',
      color: 'warning',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">
            Bienvenido, <span className="text-gradient">{admin?.email?.split('@')[0] || 'Admin'}</span>
          </h2>
          <p className="text-textSecondary text-sm mt-0.5">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} loading={loading} />
        ))}
      </div>

      {/* Quick info bar */}
      {!loading && stats && (
        <div className="bg-surfaceCard border border-border rounded-xl p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-info">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold text-textPrimary">Resumen de actividad</h3>
            {lastUpdate && (
              <span className="ml-auto text-xs text-textMuted">
                Actualizado: {lastUpdate.toLocaleTimeString('es-MX')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tasa de morosidad', value: stats?.overdueAmount && stats?.totalPortfolio ? `${((stats.overdueAmount / stats.totalPortfolio) * 100).toFixed(1)}%` : '—', color: 'text-error' },
              { label: 'Promedio cartera/cliente', value: stats?.totalPortfolio && stats?.totalClients ? currency(stats.totalPortfolio / stats.totalClients) : '—', color: 'text-info' },
              { label: 'Créditos por vendedor', value: stats?.activeCredits && stats?.totalVendors ? fmt(Math.round(stats.activeCredits / stats.totalVendors)) : '—', color: 'text-primary' },
              { label: 'Meta cobros diaria', value: stats?.todayTarget ? currency(stats.todayTarget) : '—', color: 'text-success' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surfaceBright/50 rounded-lg p-3">
                <p className="text-xs text-textMuted mb-1">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
