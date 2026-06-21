import { ProgressBar } from '../../components/ProgressBar'
import type { SurveyAction } from '../../reducers/surveyReducer'

interface Props {
  introText: string
  consent: boolean
  totalSteps: number
  dispatch: React.Dispatch<SurveyAction>
  onNext: () => void
}

export function ConsentStep({ introText, consent, totalSteps, dispatch, onNext }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar current={0} total={totalSteps} />

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Informativa e consenso</h2>

        <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">
          {introText}
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-8">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => dispatch({ type: 'SET_CONSENT', consent: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Ho letto l'informativa e acconsento alla partecipazione alla ricerca.
          </span>
        </label>

        <div className="flex justify-end">
          <button
            onClick={onNext}
            disabled={!consent}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium
              hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Avanti →
          </button>
        </div>
      </div>
    </div>
  )
}
