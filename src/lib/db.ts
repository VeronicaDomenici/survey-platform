/**
 * Data access layer: Supabase when env vars are set, mock localStorage otherwise.
 * Swap-in by just adding VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env
 */
import { supabase, supabaseAvailable } from './supabase'
import { MOCK_SURVEY } from './mockData'
import type { Survey, SurveyResponse, VideoAnswers } from '../types'

// ─── Mock in-memory store (local dev without Supabase) ─────────────────────

const MOCK_RESPONSES_KEY = 'survey_mock_responses'

function getMockResponses(): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(MOCK_RESPONSES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SurveyResponse[]
  } catch {
    return []
  }
}

function saveMockResponses(responses: SurveyResponse[]) {
  localStorage.setItem(MOCK_RESPONSES_KEY, JSON.stringify(responses))
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function fetchPublishedSurvey(id: string): Promise<Survey | null> {
  if (!supabaseAvailable) {
    // Return mock only if id matches (or use the first mock)
    if (id === MOCK_SURVEY.id || id === 'mock') return MOCK_SURVEY
    // Try any id → return mock (convenient for local dev)
    return MOCK_SURVEY
  }

  const { data, error } = await supabase!
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (error || !data) return null
  return data as Survey
}

export async function upsertResponse(params: {
  sessionToken: string
  surveyId: string
  demographics: Record<string, string>
  answers: Record<string, VideoAnswers>
  consent: boolean
  completed: boolean
}): Promise<void> {
  const now = new Date().toISOString()

  if (!supabaseAvailable) {
    const responses = getMockResponses()
    const idx = responses.findIndex((r) => r.session_token === params.sessionToken)
    const entry: SurveyResponse = {
      id: params.sessionToken,
      survey_id: params.surveyId,
      session_token: params.sessionToken,
      demographics: params.demographics,
      answers: params.answers,
      consent: params.consent,
      completed: params.completed,
      started_at: idx >= 0 ? (responses[idx]?.started_at ?? now) : now,
      completed_at: params.completed ? now : null,
    }
    if (idx >= 0) {
      responses[idx] = entry
    } else {
      responses.push(entry)
    }
    saveMockResponses(responses)
    return
  }

  const { error } = await supabase!.from('responses').upsert(
    {
      survey_id: params.surveyId,
      session_token: params.sessionToken,
      demographics: params.demographics,
      answers: params.answers,
      consent: params.consent,
      completed: params.completed,
      completed_at: params.completed ? now : null,
    },
    { onConflict: 'session_token' },
  )

  if (error) throw new Error(error.message)
}

export async function fetchAllResponses(surveyId: string): Promise<SurveyResponse[]> {
  if (!supabaseAvailable) {
    return getMockResponses().filter((r) => r.survey_id === surveyId && r.completed)
  }

  const { data, error } = await supabase!
    .from('responses')
    .select('*')
    .eq('survey_id', surveyId)
    .eq('completed', true)
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as SurveyResponse[]
}

export async function saveSurvey(survey: Survey): Promise<void> {
  if (!supabaseAvailable) {
    // Persist to localStorage so admin edits survive reload in local dev
    localStorage.setItem('survey_mock_config_' + survey.id, JSON.stringify(survey))
    // Also update the in-memory mock used by fetchPublishedSurvey — handled via reload
    return
  }

  const { error } = await supabase!.from('surveys').upsert(survey)
  if (error) throw new Error(error.message)
}

export async function fetchSurveyForAdmin(id: string): Promise<Survey | null> {
  if (!supabaseAvailable) {
    const saved = localStorage.getItem('survey_mock_config_' + id)
    if (saved) {
      try { return JSON.parse(saved) as Survey } catch { /* fall through */ }
    }
    return MOCK_SURVEY
  }

  // If called with the mock ID, fetch the first survey from DB instead
  const query = (id === MOCK_SURVEY.id)
    ? supabase!.from('surveys').select('*').order('created_at').limit(1).single()
    : supabase!.from('surveys').select('*').eq('id', id).single()

  const { data, error } = await query
  if (error || !data) return null
  return data as Survey
}

export async function fetchFirstSurveyId(): Promise<string> {
  if (!supabaseAvailable) return MOCK_SURVEY.id
  const { data } = await supabase!.from('surveys').select('id').order('created_at').limit(1).single()
  return data?.id ?? MOCK_SURVEY.id
}

// ─── Auth helpers ───────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  if (!supabaseAvailable) {
    // Mock auth: accept hardcoded admin credentials for local dev
    if (email === 'admin@local.dev' && password === 'admin1234') {
      localStorage.setItem('mock_admin_session', '1')
      return { error: null }
    }
    return { error: { message: 'Credenziali non valide (mock: admin@local.dev / admin1234)' } }
  }
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  return { error }
}

export async function signOut() {
  if (!supabaseAvailable) {
    localStorage.removeItem('mock_admin_session')
    return
  }
  await supabase!.auth.signOut()
}

export async function getAdminSession(): Promise<boolean> {
  if (!supabaseAvailable) {
    return localStorage.getItem('mock_admin_session') === '1'
  }
  const { data } = await supabase!.auth.getSession()
  return Boolean(data.session)
}
