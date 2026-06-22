import { useEffect, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import { surveyReducer } from '../../reducers/surveyReducer'
import { loadState, saveState, initialState } from '../../lib/localStorage'
import { fetchPublishedSurvey, upsertResponse } from '../../lib/db'
import { ConsentStep } from './ConsentStep'
import { DemographicsStep } from './DemographicsStep'
import { VideoStep } from './VideoStep'
import { ThankYouStep } from './ThankYouStep'
import type { Survey } from '../../types'

const RETRY_DELAYS = [1000, 3000, 8000]

function Layout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <h1 className="text-lg font-semibold text-gray-700">{title}</h1>
      </header>
      <main className="px-4 pb-12">{children}</main>
    </div>
  )
}

export function SurveyPage() {
  const { surveyId = 'mock' } = useParams<{ surveyId: string }>()

  const [state, dispatch] = useReducer(
    surveyReducer,
    undefined,
    () => loadState(surveyId) ?? initialState(surveyId),
  )

  const [surveyData, setSurveyData] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  // orderedVideos: survey videos sorted by the session's randomised order
  const [orderedVideos, setOrderedVideos] = useState<Survey['videos']>([])
  // Persist to localStorage on every state change
  useEffect(() => {
    saveState(state)
  }, [state])

  // Sync step with browser history (back/forward button)
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const s = e.state as { surveyStep?: number } | null
      if (typeof s?.surveyStep === 'number') {
        dispatch({ type: 'GO_TO_STEP', step: s.surveyStep })
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  function pushStep(step: number) {
    window.history.pushState({ surveyStep: step }, '')
    dispatch({ type: 'GO_TO_STEP', step })
  }

  // Fetch survey config
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setFetchError(null)
      const data = await fetchPublishedSurvey(surveyId)
      if (cancelled) return
      if (!data) {
        setFetchError('Fragebogen nicht gefunden oder nicht veröffentlicht.')
      } else {
        setSurveyData(data)
        // Build ordered video list: reuse persisted shuffle or create new one
        const existing = loadState(surveyId)
        if (existing?.videoOrder?.length) {
          const videoMap = Object.fromEntries(data.videos.map((v) => [v.id, v]))
          setOrderedVideos(existing.videoOrder.flatMap((id) => (videoMap[id] ? [videoMap[id]!] : [])))
        } else {
          const shuffled = [...data.videos].sort(() => Math.random() - 0.5)
          setOrderedVideos(shuffled)
          dispatch({ type: 'SET_VIDEO_ORDER', videoOrder: shuffled.map((v) => v.id) })
        }
      }
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [surveyId])

  // Submit with exponential-backoff retry
  async function submit(retryIndex = 0): Promise<void> {
    if (!surveyData) return
    dispatch({ type: 'SET_SUBMIT_ERROR', error: null })
    try {
      await upsertResponse({
        sessionToken: state.sessionToken,
        surveyId: state.surveyId,
        demographics: state.demographics,
        answers: state.videoAnswers,
        consent: state.consent,
        completed: true,
      })
      dispatch({ type: 'SET_SUBMITTED', submitted: true })
      const totalSteps = 2 + orderedVideos.length
      pushStep(totalSteps)
    } catch {
      const delay = RETRY_DELAYS[retryIndex]
      if (delay !== undefined) {
        dispatch({
          type: 'SET_SUBMIT_ERROR',
          error: `Netzwerkfehler. Erneuter Versuch in ${delay / 1000}s… (Versuch ${retryIndex + 1}/3)`,
        })
        setTimeout(() => void submit(retryIndex + 1), delay)
      } else {
        dispatch({
          type: 'SET_SUBMIT_ERROR',
          error: 'Übermittlung nach 3 Versuchen fehlgeschlagen. Deine Daten sind lokal gespeichert. Drücke „Erneut versuchen", wenn du wieder online bist.',
        })
      }
    }
  }

  // ─── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Fragebogen wird geladen…</p>
      </div>
    )
  }

  if (fetchError || !surveyData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{fetchError ?? 'Fragebogen nicht verfügbar.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  if (orderedVideos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow p-8 max-w-md text-center">
          <p className="text-yellow-700">Keine Videos für diesen Fragebogen konfiguriert.</p>
        </div>
      </div>
    )
  }

  const totalSteps = 2 + orderedVideos.length
  const { step } = state

  // ─── Thank you ──────────────────────────────────────────────────────────────
  if (state.submitted || step >= totalSteps) {
    return (
      <Layout title={surveyData.title}>
        <ThankYouStep />
      </Layout>
    )
  }

  // ─── Consent ────────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <Layout title={surveyData.title}>
        <ConsentStep
          consent={state.consent}
          totalSteps={totalSteps}
          dispatch={dispatch}
          onNext={() => pushStep(1)}
        />
      </Layout>
    )
  }

  // ─── Demographics ───────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Layout title={surveyData.title}>
        <DemographicsStep
          fields={surveyData.demographics_fields}
          values={state.demographics}
          totalSteps={totalSteps}
          dispatch={dispatch}
          onNext={() => pushStep(2)}
          onBack={() => pushStep(0)}
        />
      </Layout>
    )
  }

  // ─── Video steps ────────────────────────────────────────────────────────────
  const videoIndex = step - 2
  const video = orderedVideos[videoIndex]

  if (!video) {
    // Step out of range – mark as submitted
    dispatch({ type: 'SET_SUBMITTED', submitted: true })
    return null
  }

  const isLastVideo = videoIndex === orderedVideos.length - 1

  return (
    <Layout title={surveyData.title}>
      <VideoStep
        video={video}
        videoIndex={videoIndex}
        totalVideos={orderedVideos.length}
        stepIndex={step}
        totalSteps={totalSteps}
        answers={state.videoAnswers[video.id] ?? {}}
        dispatch={dispatch}
        onBack={() => pushStep(step - 1)}
        onNext={() => {
          if (isLastVideo) {
            void submit()
          } else {
            pushStep(step + 1)
          }
        }}
      />
      {state.submitError && (
        <div className="max-w-3xl mx-auto mt-4 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700
            flex items-center justify-between">
            <span>{state.submitError}</span>
            {!state.submitError.includes('Erneut') && (
              <button
                onClick={() => void submit()}
                className="ml-4 bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs
                  hover:bg-red-700 shrink-0"
              >
                Erneut versuchen
              </button>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
