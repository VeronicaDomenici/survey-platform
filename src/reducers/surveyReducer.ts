import type { SurveyState, QuestionAnswer } from '../types'

export type SurveyAction =
  | { type: 'SET_CONSENT'; consent: boolean }
  | { type: 'SET_DEMOGRAPHICS'; key: string; value: string }
  | { type: 'SET_ANSWER'; videoId: string; questionId: string; answer: QuestionAnswer }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'SET_SUBMITTED'; submitted: boolean }
  | { type: 'SET_SUBMIT_ERROR'; error: string | null }
  | { type: 'HYDRATE'; state: SurveyState }

export function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'SET_CONSENT':
      return { ...state, consent: action.consent }

    case 'SET_DEMOGRAPHICS':
      return {
        ...state,
        demographics: { ...state.demographics, [action.key]: action.value },
      }

    case 'SET_ANSWER': {
      const videoAnswers = {
        ...state.videoAnswers,
        [action.videoId]: {
          ...state.videoAnswers[action.videoId],
          [action.questionId]: action.answer,
        },
      }
      return { ...state, videoAnswers }
    }

    case 'GO_TO_STEP':
      return { ...state, step: action.step }

    case 'SET_SUBMITTED':
      return { ...state, submitted: action.submitted, submitError: null }

    case 'SET_SUBMIT_ERROR':
      return { ...state, submitError: action.error }

    default:
      return state
  }
}
