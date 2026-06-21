import { useState } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import type { VideoConfig, QuestionAnswer, MultipleAnswer, SliderAnswer } from '../../types'
import type { SurveyAction } from '../../reducers/surveyReducer'

interface Props {
  video: VideoConfig
  videoIndex: number
  totalVideos: number
  stepIndex: number     // for progress bar (step 2 = first video)
  totalSteps: number
  answers: Record<string, QuestionAnswer>
  dispatch: React.Dispatch<SurveyAction>
  onNext: () => void
  onBack: () => void
}

export function VideoStep({
  video, videoIndex, totalVideos, stepIndex, totalSteps,
  answers, dispatch, onNext, onBack,
}: Props) {
  const [validationError, setValidationError] = useState<string | null>(null)

  function setAnswer(questionId: string, answer: QuestionAnswer) {
    dispatch({ type: 'SET_ANSWER', videoId: video.id, questionId, answer })
  }

  function validate(): string | null {
    for (const q of video.questions) {
      const ans = answers[q.id]
      if (q.type === 'single' && !ans) return `Rispondi alla domanda: "${q.text}"`
      if (q.type === 'multiple' && (!(ans as MultipleAnswer)?.length))
        return `Seleziona almeno un'opzione per: "${q.text}"`
      if (q.type === 'multiple_slider') {
        const selected = ans as SliderAnswer | undefined
        if (!selected || Object.keys(selected).length === 0)
          return `Seleziona almeno un'opzione per: "${q.text}"`
      }
    }
    return null
  }

  function handleNext() {
    const err = validate()
    if (err) { setValidationError(err); return }
    setValidationError(null)
    onNext()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressBar current={stepIndex} total={totalSteps} />

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">{video.title}</h2>
          <span className="text-sm text-gray-400">Video {videoIndex + 1} di {totalVideos}</span>
        </div>

        {/* Video player */}
        <div className="mb-8">
          <video
            src={video.storage_url}
            controls
            className="w-full rounded-lg bg-black"
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              el.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            Video non disponibile: <code>{video.storage_url}</code>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {video.questions.map((question, qi) => {
            const ans = answers[question.id]

            return (
              <div key={question.id} className="border-t pt-6">
                <p className="font-medium text-gray-800 mb-4">
                  <span className="text-blue-600 mr-2">{qi + 1}.</span>
                  {question.text}
                </p>

                {/* Single choice */}
                {question.type === 'single' && (
                  <div className="space-y-2">
                    {question.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-3 cursor-pointer
                        p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name={question.id}
                          value={opt.id}
                          checked={ans === opt.id}
                          onChange={() => setAnswer(question.id, opt.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Multiple choice */}
                {question.type === 'multiple' && (
                  <div className="space-y-2">
                    {question.options.map((opt) => {
                      const selected = (ans as MultipleAnswer | undefined) ?? []
                      const checked = selected.includes(opt.id)
                      return (
                        <label key={opt.id} className="flex items-center gap-3 cursor-pointer
                          p-2 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? selected.filter((id) => id !== opt.id)
                                : [...selected, opt.id]
                              setAnswer(question.id, next)
                            }}
                            className="h-4 w-4 rounded text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Multiple with slider */}
                {question.type === 'multiple_slider' && (
                  <div className="space-y-3">
                    {question.options.map((opt) => {
                      const sliders = (ans as SliderAnswer | undefined) ?? {}
                      const isChecked = opt.id in sliders
                      const sliderVal = sliders[opt.id] ?? 0.5

                      return (
                        <div key={opt.id}
                          className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                          <label className="flex items-center gap-3 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const next = { ...sliders }
                                if (isChecked) {
                                  delete next[opt.id]
                                } else {
                                  next[opt.id] = 0.5
                                }
                                setAnswer(question.id, next)
                              }}
                              className="h-4 w-4 rounded text-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                          </label>

                          {isChecked && (
                            <div className="flex items-center gap-4 ml-7">
                              <input
                                type="range"
                                min={0} max={1} step={0.01}
                                value={sliderVal}
                                onChange={(e) => {
                                  setAnswer(question.id, {
                                    ...sliders,
                                    [opt.id]: parseFloat(e.target.value),
                                  })
                                }}
                                className="flex-1 h-2 accent-blue-600"
                              />
                              <span className="text-sm text-blue-700 font-mono w-10 text-right">
                                {sliderVal.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {validationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {validationError}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition"
          >
            ← Indietro
          </button>
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium
              hover:bg-blue-700 transition"
          >
            {videoIndex === totalVideos - 1 ? 'Termina →' : 'Avanti →'}
          </button>
        </div>
      </div>
    </div>
  )
}
