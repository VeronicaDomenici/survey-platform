// ─── Survey config (stored in DB / mock) ───────────────────────────────────

export interface SliderOption {
  id: string
  label: string
}

export interface QuestionOption {
  id: string
  label: string
}

export interface Question {
  id: string
  text: string
  type: 'single' | 'multiple' | 'multiple_slider'
  options: QuestionOption[]
}

export interface VideoConfig {
  id: string
  storage_url: string   // URL pubblico del video (Supabase Storage o /videos/...)
  title: string
  questions: Question[]
}

export interface DemographicsField {
  id: string
  label: string
  type: 'text' | 'select' | 'number'
  required: boolean
  options?: string[]  // solo per type='select'
}

export interface Survey {
  id: string
  title: string
  intro_text: string
  demographics_fields: DemographicsField[]
  videos: VideoConfig[]
  is_published: boolean
  created_at: string
  updated_at: string
}

// ─── Survey state (reducer / localStorage) ─────────────────────────────────

export type SingleAnswer = string                       // option id
export type MultipleAnswer = string[]                   // option ids
export type SliderAnswer = Record<string, number>       // option id → value 0-1

export type QuestionAnswer = SingleAnswer | MultipleAnswer | SliderAnswer

export interface VideoAnswers {
  [questionId: string]: QuestionAnswer
}

export interface SurveyState {
  surveyId: string
  sessionToken: string
  step: number          // 0=consent 1=demographics 2..N+1=video N+2=thank-you
  consent: boolean
  demographics: Record<string, string>
  videoAnswers: Record<string, VideoAnswers>  // videoId → answers
  videoOrder: string[]  // shuffled video IDs, fixed per session
  submitted: boolean
  submitError: string | null
}

// ─── Responses (stored in DB) ───────────────────────────────────────────────

export interface SurveyResponse {
  id: string
  survey_id: string
  session_token: string
  demographics: Record<string, string>
  answers: Record<string, VideoAnswers>
  consent: boolean
  completed: boolean
  started_at: string
  completed_at: string | null
}
