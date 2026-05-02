import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Auth from './pages/Auth'
import Home from './pages/Home'
import EditRoutine from './pages/EditRoutine'
import ActiveWorkout from './pages/ActiveWorkout'
import History from './pages/History'
import SessionDetail from './pages/SessionDetail'
import ExerciseHistory from './pages/ExerciseHistory'
import ExerciseDetail from './pages/ExerciseDetail'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--accent)', fontFamily: 'Bebas Neue', fontSize: 32 }}>IRONLOG</div>
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/routines/new" element={<ProtectedRoute><EditRoutine /></ProtectedRoute>} />
      <Route path="/routines/:id/edit" element={<ProtectedRoute><EditRoutine /></ProtectedRoute>} />
      <Route path="/workout/:id" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/history/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      <Route path="/exercise-history" element={<ProtectedRoute><ExerciseHistory /></ProtectedRoute>} />
      <Route path="/exercise-history/:exerciseId" element={<ProtectedRoute><ExerciseDetail /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
