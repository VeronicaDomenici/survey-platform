import type { Survey, SurveyResponse, VideoAnswers, SliderAnswer, MultipleAnswer } from '../types'

function escapeCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '')
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(escapeCell).join(',')
}

export function buildSingleResponseCSV(response: SurveyResponse, survey: Survey): string {
  const lines: string[] = []

  // Header
  lines.push(row(['Campo', 'Valore']))

  // Demographics
  lines.push(row(['--- ANAGRAFICA ---', '']))
  for (const field of survey.demographics_fields) {
    lines.push(row([field.label, response.demographics[field.id] ?? '']))
  }
  lines.push(row(['Consenso', response.consent ? 'Sì' : 'No']))
  lines.push(row(['Data completamento', response.completed_at ?? '']))
  lines.push(row(['']))

  // Answers per video
  for (const video of survey.videos) {
    lines.push(row([`--- VIDEO: ${video.title} ---`, '']))
    const videoAnswers: VideoAnswers = response.answers[video.id] ?? {}

    for (const question of video.questions) {
      const answer = videoAnswers[question.id]

      if (question.type === 'single') {
        const optionLabel =
          question.options.find((o) => o.id === answer)?.label ?? String(answer ?? '')
        lines.push(row([question.text, optionLabel]))
      } else if (question.type === 'multiple') {
        const ids = (answer as MultipleAnswer | undefined) ?? []
        const labels = ids
          .map((id) => question.options.find((o) => o.id === id)?.label ?? id)
          .join('; ')
        lines.push(row([question.text, labels]))
      } else if (question.type === 'multiple_slider') {
        const sliders = (answer as SliderAnswer | undefined) ?? {}
        for (const opt of question.options) {
          if (opt.id in sliders) {
            lines.push(row([`${question.text} — ${opt.label}`, sliders[opt.id]]))
          }
        }
      }
    }
    lines.push(row(['']))
  }

  return lines.join('\n')
}

export function buildAggregateCSV(responses: SurveyResponse[], survey: Survey): string {
  const lines: string[] = []

  // Build header columns
  const headers: string[] = ['session_token', 'data_completamento']
  for (const field of survey.demographics_fields) {
    headers.push(field.label)
  }
  for (const video of survey.videos) {
    for (const question of video.questions) {
      if (question.type === 'multiple_slider') {
        for (const opt of question.options) {
          headers.push(`${video.title} | ${question.text} | ${opt.label}`)
        }
      } else {
        headers.push(`${video.title} | ${question.text}`)
      }
    }
  }
  lines.push(row(headers))

  // One row per response
  for (const resp of responses) {
    const cells: (string | number | null)[] = [
      resp.session_token,
      resp.completed_at ?? '',
    ]

    for (const field of survey.demographics_fields) {
      cells.push(resp.demographics[field.id] ?? '')
    }

    for (const video of survey.videos) {
      const videoAnswers: VideoAnswers = resp.answers[video.id] ?? {}
      for (const question of video.questions) {
        const answer = videoAnswers[question.id]

        if (question.type === 'single') {
          const optionLabel =
            question.options.find((o) => o.id === answer)?.label ?? String(answer ?? '')
          cells.push(optionLabel)
        } else if (question.type === 'multiple') {
          const ids = (answer as MultipleAnswer | undefined) ?? []
          cells.push(
            ids.map((id) => question.options.find((o) => o.id === id)?.label ?? id).join('; '),
          )
        } else if (question.type === 'multiple_slider') {
          const sliders = (answer as SliderAnswer | undefined) ?? {}
          for (const opt of question.options) {
            cells.push(opt.id in sliders ? sliders[opt.id] ?? null : null)
          }
        }
      }
    }

    lines.push(row(cells))
  }

  return lines.join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
