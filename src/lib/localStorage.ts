import { v4 as uuidv4 } from 'uuid'
import type { SurveyState } from '../types'

function storageKey(surveyId: string) {
  return `survey_state_${surveyId}`
}

export function loadState(surveyId: string): SurveyState | null {
  try {
    const raw = localStorage.getItem(storageKey(surveyId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    // Basic shape validation
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('sessionToken' in parsed) ||
      !('step' in parsed)
    ) {
      return null
    }
    return parsed as SurveyState
  } catch {
    return null
  }
}

export function saveState(state: SurveyState) {
  try {
    localStorage.setItem(storageKey(state.surveyId), JSON.stringify(state))
  } catch {
    // Storage full or private mode – silently ignore
  }
}

export function clearState(surveyId: string) {
  localStorage.removeItem(storageKey(surveyId))
}

export function getOrCreateSessionToken(surveyId: string): string {
  const existing = loadState(surveyId)
  if (existing?.sessionToken) return existing.sessionToken
  return uuidv4()
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function initialState(surveyId: string, videoIds?: string[]): SurveyState {
  return {
    surveyId,
    sessionToken: getOrCreateSessionToken(surveyId),
    step: 0,
    consent: false,
    demographics: {},
    videoAnswers: {},
    videoOrder: videoIds ? shuffleArray(videoIds) : [],
    submitted: false,
    submitError: null,
  }
}
