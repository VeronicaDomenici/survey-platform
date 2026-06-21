import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getAdminSession } from '../../lib/db'

export function AdminGuard() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    void getAdminSession().then(setAuthed)
  }, [])

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Verifica sessione…</p>
      </div>
    )
  }

  return authed ? <Outlet /> : <Navigate to="/admin/login" replace />
}
