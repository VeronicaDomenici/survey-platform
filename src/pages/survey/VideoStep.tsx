import { useState } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import type { VideoConfig, QuestionAnswer, MultipleAnswer, SliderAnswer } from '../../types'
import type { SurveyAction } from '../../reducers/surveyReducer'

interface Props {
  video: VideoConfig
  videoIndex: number
  totalVideos: number
  stepIndex: number
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
  const [validationError, setValidationError] = useState(false)

  function setAnswer(questionId: string, answer: QuestionAnswer) {
    dispatch({ type: 'SET_ANSWER', videoId: video.id, questionId, answer })
  }

  function validate(): boolean {
    for (const q of video.questions) {
      const ans = answers[q.id]
      if (q.type === 'single' && !ans) return false
      if (q.type === 'multiple' && !(ans as MultipleAnswer)?.length) return false
      if (q.type === 'multiple_slider') {
        const s = ans as SliderAnswer | undefined
        if (!s || Object.keys(s).length === 0) return false
      }
    }
    return true
  }

  function handleNext() {
    if (!validate()) { setValidationError(true); return }
    setValidationError(false)
    onNext()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressBar current={stepIndex} total={totalSteps} />

      {/* Section header — shown only on first video */}
      {videoIndex === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-1">
            Emotionale Bewertung von Filmszenen
          </h2>
          <p className="text-sm text-blue-700">
            In diesem Abschnitt siehst du einige kurze Szenen aus verschiedenen Filmen. Nach jeder
            Szene wirst du gebeten, anzugeben, welche Emotionen du dabei empfunden hast. Du kannst
            eine oder mehrere Emotionen auswählen und anschließend deren Intensität auf einer Skala
            von 0 bis 10 bewerten.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">{video.title}</h3>
          <span className="text-sm text-gray-400">Video {videoIndex + 1} von {totalVideos}</span>
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
              const next = el.nextElementSibling as HTMLElement | null
              if (next) next.classList.remove('hidden')
            }}
          />
          <div className="hidden bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            Video nicht verfügbar: <code>{video.storage_url}</code>
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

                {/* Multiple with slider 0–10 */}
                {question.type === 'multiple_slider' && (
                  <div className="space-y-3">
                    {question.options.map((opt) => {
                      const sliders = (ans as SliderAnswer | undefined) ?? {}
                      const isChecked = opt.id in sliders
                      const sliderVal = sliders[opt.id] ?? 5

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
                                  next[opt.id] = 5
                                }
                                setAnswer(question.id, next)
                              }}
                              className="h-4 w-4 rounded text-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                          </label>

                          {isChecked && (
                            <div className="ml-7">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-4">0</span>
                                <input
                                  type="range"
                                  min={0} max={10} step={1}
                                  value={sliderVal}
                                  onChange={(e) => {
                                    setAnswer(question.id, {
                                      ...sliders,
                                      [opt.id]: parseInt(e.target.value, 10),
                                    })
                                  }}
                                  className="flex-1 h-2 accent-blue-600"
                                />
                                <span className="text-xs text-gray-400 w-4 text-right">10</span>
                                <span className="text-sm text-blue-700 font-mono w-6 text-center">
                                  {sliderVal}
                                </span>
                              </div>
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
            Bitte beantworte alle Fragen, bevor du weitermachst.
          </div>
        )}

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
            {videoIndex === totalVideos - 1 ? 'Abschließen →' : 'Weiter →'}
          </button>
        </div>
      </div>
    </div>
  )
}
