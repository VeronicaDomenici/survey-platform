import { useState } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import type { DemographicsField } from '../../types'
import type { SurveyAction } from '../../reducers/surveyReducer'

interface Props {
  fields: DemographicsField[]
  values: Record<string, string>
  totalSteps: number
  dispatch: React.Dispatch<SurveyAction>
  onNext: () => void
  onBack: () => void
}

export function DemographicsStep({ fields, values, totalSteps, dispatch, onNext, onBack }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function validate() {
    const errors: Record<string, string> = {}
    for (const field of fields) {
      if (field.required && !values[field.id]?.trim()) {
        errors[field.id] = 'Pflichtfeld'
      } else if (field.id === 'age') {
        const n = Number(values[field.id])
        if (isNaN(n) || n < 10 || n > 99) errors[field.id] = 'Bitte ein Alter zwischen 10 und 99 angeben.'
      }
    }
    return errors
  }

  function handleNext() {
    const allTouched = Object.fromEntries(fields.map((f) => [f.id, true]))
    setTouched(allTouched)
    const errors = validate()
    if (Object.keys(errors).length === 0) onNext()
  }

  const errors = touched && Object.keys(touched).length > 0 ? validate() : {}

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar current={1} total={totalSteps} />

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Soziodemografische Angaben</h2>
        <p className="text-sm text-gray-500 mb-6">
          In diesem Abschnitt werden Dir Fragen zu Deinem soziodemografischen Hintergrund gestellt.
        </p>

        <div className="space-y-5">
          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  value={values[field.id] ?? ''}
                  onChange={(e) => {
                    dispatch({ type: 'SET_DEMOGRAPHICS', key: field.id, value: e.target.value })
                    setTouched((t) => ({ ...t, [field.id]: true }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Bitte wählen —</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={values[field.id] ?? ''}
                  min={field.id === 'age' ? 10 : undefined}
                  max={field.id === 'age' ? 99 : undefined}
                  onChange={(e) => {
                    dispatch({ type: 'SET_DEMOGRAPHICS', key: field.id, value: e.target.value })
                    setTouched((t) => ({ ...t, [field.id]: true }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {errors[field.id] && (
                <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition"
          >
            ← Zurück
          </button>
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium
              hover:bg-blue-700 transition"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  )
}
