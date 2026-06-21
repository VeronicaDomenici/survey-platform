import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SurveyPage } from './pages/survey/SurveyPage'
import { LoginPage } from './pages/admin/LoginPage'
import { EditorPage } from './pages/admin/EditorPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { AdminGuard } from './pages/admin/AdminGuard'

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public survey */}
          <Route path="/survey/:surveyId" element={<SurveyPage />} />
          {/* Shortcut: /survey → mock survey for local dev */}
          <Route path="/survey" element={<Navigate to="/survey/mock-survey-1" replace />} />

          {/* Admin */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/editor" element={<EditorPage />} />
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/survey" replace />} />
          <Route path="*" element={<Navigate to="/survey" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
