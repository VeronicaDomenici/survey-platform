import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { fetchAllResponses, fetchSurveyForAdmin, fetchFirstSurveyId, signOut } from '../../lib/db'
import { buildSingleResponseCSV, buildAggregateCSV, downloadCSV } from '../../lib/csv'
import type { Survey, SurveyResponse, MultipleAnswer, SliderAnswer } from '../../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function DashboardPage() {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    void fetchFirstSurveyId().then((surveyId) =>
      Promise.all([
        fetchSurveyForAdmin(surveyId),
        fetchAllResponses(surveyId),
      ])
    ).then(([s, r]) => {
      setSurvey(s)
      setResponses(r)
      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    await signOut()
    void navigate('/admin/login')
  }

  if (loading) {
    return (
      <AdminLayout onLogout={handleLogout} onEditor={() => void navigate('/admin/editor')}>
        <p className="text-gray-400">Caricamento…</p>
      </AdminLayout>
    )
  }

  if (!survey) {
    return (
      <AdminLayout onLogout={handleLogout} onEditor={() => void navigate('/admin/editor')}>
        <p className="text-red-600">Questionario non trovato.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout onLogout={handleLogout} onEditor={() => void navigate('/admin/editor')}>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              {responses.length} risposta{responses.length !== 1 ? 'e' : ''} completata{responses.length !== 1 ? 'e' : ''}
            </p>
          </div>
          {responses.length > 0 && (
            <button
              onClick={() => {
                const csv = buildAggregateCSV(responses, survey)
                downloadCSV(csv, `risposte_aggregate_${survey.id}.csv`)
              }}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              ⬇ Esporta tutte (CSV)
            </button>
          )}
        </div>

        {responses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
            Nessuna risposta ancora. Condividi il link del questionario per raccogliere dati.
          </div>
        )}

        {/* Charts per video */}
        {responses.length > 0 && survey.videos.map((video) => (
          <section key={video.id} className="bg-white rounded-xl shadow-sm p-6 space-y-8">
            <h2 className="font-semibold text-gray-700 text-lg">{video.title}</h2>

            {video.questions.map((question) => {
              if (question.type === 'single' || question.type === 'multiple') {
                const counts: Record<string, number> = {}
                for (const opt of question.options) counts[opt.id] = 0

                for (const resp of responses) {
                  const ans = resp.answers[video.id]?.[question.id]
                  if (question.type === 'single') {
                    if (typeof ans === 'string' && ans in counts) counts[ans]!++
                  } else {
                    const ids = (ans as MultipleAnswer | undefined) ?? []
                    for (const id of ids) {
                      if (id in counts) counts[id]!++
                    }
                  }
                }

                const chartData = question.options.map((opt) => ({
                  name: opt.label,
                  valore: counts[opt.id] ?? 0,
                }))

                return (
                  <div key={question.id}>
                    <p className="text-sm font-medium text-gray-600 mb-3">{question.text}</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="valore" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              }

              if (question.type === 'multiple_slider') {
                const sums: Record<string, number> = {}
                const cnts: Record<string, number> = {}
                for (const opt of question.options) { sums[opt.id] = 0; cnts[opt.id] = 0 }

                for (const resp of responses) {
                  const ans = resp.answers[video.id]?.[question.id] as SliderAnswer | undefined
                  if (!ans) continue
                  for (const [id, val] of Object.entries(ans)) {
                    if (id in sums) { sums[id]! += val; cnts[id]!++ }
                  }
                }

                const chartData = question.options.map((opt) => ({
                  name: opt.label,
                  media: cnts[opt.id] ? Math.round((sums[opt.id]! / cnts[opt.id]!) * 100) / 100 : 0,
                  risposte: cnts[opt.id] ?? 0,
                }))

                return (
                  <div key={question.id}>
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      {question.text} — <span className="font-normal text-gray-400">media intensità (0–1)</span>
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [v, 'Media']} />
                        <Bar dataKey="media" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              }

              return null
            })}
          </section>
        ))}

        {/* Response list */}
        {responses.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Risposte individuali</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Sessione</th>
                    <th className="pb-2 pr-4 font-medium">Data</th>
                    {survey.demographics_fields.map((f) => (
                      <th key={f.id} className="pb-2 pr-4 font-medium">{f.label}</th>
                    ))}
                    <th className="pb-2 font-medium">CSV</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((resp) => (
                    <tr key={resp.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-mono text-xs text-gray-400">
                        {resp.session_token.slice(0, 8)}…
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {resp.completed_at
                          ? new Date(resp.completed_at).toLocaleDateString('it-IT')
                          : '—'}
                      </td>
                      {survey.demographics_fields.map((f) => (
                        <td key={f.id} className="py-2 pr-4 text-gray-700">
                          {resp.demographics[f.id] ?? '—'}
                        </td>
                      ))}
                      <td className="py-2">
                        <button
                          onClick={() => {
                            const csv = buildSingleResponseCSV(resp, survey)
                            downloadCSV(csv, `risposta_${resp.session_token.slice(0, 8)}.csv`)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          ⬇ Scarica
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  )
}

function AdminLayout({ children, onLogout, onEditor }: {
  children: React.ReactNode
  onLogout: () => void
  onEditor: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center
        justify-between">
        <span className="font-semibold text-gray-700">Survey Admin</span>
        <div className="flex items-center gap-4">
          <button onClick={onEditor} className="text-sm text-blue-600 hover:text-blue-800">
            Editor
          </button>
          <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-700">
            Esci
          </button>
        </div>
      </header>
      <main className="px-4 py-8">{children}</main>
    </div>
  )
}
