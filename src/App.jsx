import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vendors from './pages/Vendors'
import Clients from './pages/Clients'
import Cash from './pages/Cash'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
<<<<<<< HEAD
=======
import LiqDiaria from './pages/LiqDiaria'
>>>>>>> d2eb52cd6cd5c27022eea8c815b2344d48780099

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/cash" element={<Cash />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
<<<<<<< HEAD
=======
        <Route path="/liq-diaria" element={<LiqDiaria />} />
>>>>>>> d2eb52cd6cd5c27022eea8c815b2344d48780099
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
