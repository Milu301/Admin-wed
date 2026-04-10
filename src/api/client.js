import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cobros_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle 401 → logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cobros_token')
      localStorage.removeItem('cobros_admin')
      // Redirect to login without causing a loop
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/admin/login', { email, password }),
}

// ─── Admins / Stats ────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: (adminId) => apiClient.get(`/admins/${adminId}/stats`),
  getVendors: (adminId) => apiClient.get(`/admins/${adminId}/vendors`),
  createVendor: (adminId, data) => apiClient.post(`/admins/${adminId}/vendors`, data),
  getClients: (adminId, params = {}) =>
    apiClient.get(`/admins/${adminId}/clients`, { params }),
  getCash: (adminId, date) =>
    apiClient.get(`/admins/${adminId}/cash`, { params: { date } }),
  getCashSummary: (adminId, date) =>
    apiClient.get(`/admins/${adminId}/cash/summary`, { params: { date } }),
  createCashMovement: (adminId, data) =>
    apiClient.post(`/admins/${adminId}/cash/movements`, data),
  getCollectionsReport: (adminId, params = {}) =>
    apiClient.get(`/admins/${adminId}/reports/collections`, { params }),
  getLateClientsReport: (adminId, params = {}) =>
    apiClient.get(`/admins/${adminId}/reports/late-clients`, { params }),
  getVendorPerformanceReport: (adminId, params = {}) =>
    apiClient.get(`/admins/${adminId}/reports/vendor-performance`, { params }),
  getVendorRouteDay: (adminId, vendorId, date) =>
    apiClient.get(`/admins/${adminId}/vendors/${vendorId}/route-day`, { params: { date } }),
  getVendorStats: (adminId, vendorId) =>
    apiClient.get(`/vendors/${vendorId}/stats`),
}

// ─── Vendors ───────────────────────────────────────────────────────────────
export const vendorAPI = {
  update: (vendorId, data) => apiClient.put(`/vendors/${vendorId}`, data),
  delete: (vendorId) => apiClient.delete(`/vendors/${vendorId}`),
  resetDevice: (vendorId) => apiClient.post(`/vendors/${vendorId}/reset-device`),
  toggleStatus: (vendorId, active) =>
    apiClient.put(`/vendors/${vendorId}`, { status: active ? 'active' : 'inactive' }),
}

// ─── Clients ───────────────────────────────────────────────────────────────
export const clientAPI = {
  getCredits: (clientId) => apiClient.get(`/clients/${clientId}/credits`),
  update: (clientId, data) => apiClient.put(`/clients/${clientId}`, data),
}
