import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSurveyForAdmin, fetchFirstSurveyId, saveSurvey, signOut } from '../../lib/db'
import type { Survey, Question } from '../../types'

export function EditorPage() {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    void fetchFirstSurveyId().then((id) => fetchSurveyForAdmin(id)).then((s) => setSurvey(s))
  }, [])

  if (!survey) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <p className="text-gray-400">Caricamento…</p>
      </AdminLayout>
    )
  }

  async function handleLogout() {
    await signOut()
    void navigate('/admin/login')
  }

  async function handleSave() {
    if (!survey) return
    setSaving(true)
    setError(null)
    try {
      await saveSurvey({ ...survey, updated_at: new Date().toISOString() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }

  function updateQuestion(videoIndex: number, questionIndex: number, patch: Partial<Question>) {
    setSurvey((s) => {
      if (!s) return s
      const videos = [...s.videos]
      const video = { ...videos[videoIndex]! }
      const questions = [...video.questions]
      questions[questionIndex] = { ...questions[questionIndex]!, ...patch }
      video.questions = questions
      videos[videoIndex] = video
      return { ...s, videos }
    })
  }

  function updateOptionLabel(videoIndex: number, questionIndex: number, optionIndex: number, label: string) {
    setSurvey((s) => {
      if (!s) return s
      const videos = [...s.videos]
      const video = { ...videos[videoIndex]! }
      const questions = [...video.questions]
      const question = { ...questions[questionIndex]! }
      const options = [...question.options]
      options[optionIndex] = { ...options[optionIndex]!, label }
      question.options = options
      questions[questionIndex] = question
      video.questions = questions
      videos[videoIndex] = video
      return { ...s, videos }
    })
  }

  const shareUrl = `${window.location.origin}/survey/${survey.id}`

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Editor questionario</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void navigate('/admin/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Dashboard →
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium
                hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Salvataggio…' : saved ? '✓ Salvato' : 'Salva'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* General settings */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Impostazioni generali</h2>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Titolo</label>
            <input
              value={survey.title}
              onChange={(e) => setSurvey((s) => s ? { ...s, title: e.target.value } : s)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Testo informativo iniziale</label>
            <textarea
              value={survey.intro_text}
              onChange={(e) => setSurvey((s) => s ? { ...s, intro_text: e.target.value } : s)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={survey.is_published}
                onChange={(e) => setSurvey((s) => s ? { ...s, is_published: e.target.checked } : s)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">Questionario pubblicato</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2
              text-sm text-gray-600 truncate">
              {shareUrl}
            </div>
            <button
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
              className="shrink-0 border border-gray-300 px-4 py-2 rounded-lg text-sm
                hover:bg-gray-50 transition"
            >
              Copia link
            </button>
          </div>
        </section>

        {/* Video questions */}
        {survey.videos.map((video, vi) => (
          <section key={video.id} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="font-semibold text-gray-700">
              Video {vi + 1}: {video.title}
            </h2>

            {video.questions.map((question, qi) => (
              <div key={question.id} className="border-t pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Domanda {qi + 1} ({question.type === 'single' ? 'scelta singola'
                      : question.type === 'multiple' ? 'scelta multipla'
                      : 'scelta multipla + slider'})
                  </label>
                  <input
                    value={question.text}
                    onChange={(e) => updateQuestion(vi, qi, { text: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Opzioni:</p>
                  {question.options.map((opt, oi) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5">{oi + 1}.</span>
                      <input
                        value={opt.label}
                        onChange={(e) => updateOptionLabel(vi, qi, oi, e.target.value)}
                        className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm
                          focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}

        <div className="flex justify-end pb-12">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium
              hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Salvataggio…' : saved ? '✓ Salvato' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

function AdminLayout({ children, onLogout }: {
  children: React.ReactNode
  onLogout: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center
        justify-between">
        <span className="font-semibold text-gray-700">Survey Admin</span>
        <button
          onClick={onLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Esci
        </button>
      </header>
      <main className="px-4 py-8">{children}</main>
    </div>
  )
}
