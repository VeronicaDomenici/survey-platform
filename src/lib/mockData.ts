import type { Survey } from '../types'

const R2_BASE = 'https://pub-69c2fe31a3bd4ec98bd6fe04be7f4d13.r2.dev'

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Partecipando a questa ricerca accetti che i tuoi dati vengano utilizzati in forma anonima per scopi scientifici. Le tue risposte saranno trattate con la massima riservatezza.'

// 12 emotion options for the slider question (Q3), scale 0–10
const SLIDER_OPTIONS = [
  { id: 'admiration',  label: 'Admiration' },
  { id: 'amusement',   label: 'Amusement' },
  { id: 'joy',         label: 'Joy' },
  { id: 'relief',      label: 'Relief' },
  { id: 'tenderness',  label: 'Tenderness' },
  { id: 'compassion',  label: 'Compassion' },
  { id: 'surprise',    label: 'Surprise' },
  { id: 'agitation',   label: 'Agitation' },
  { id: 'disgust',     label: 'Disgust' },
  { id: 'fear',        label: 'Fear' },
  { id: 'anger',       label: 'Anger' },
  { id: 'sadness',     label: 'Sadness' },
]

// Each video: file id, URL-safe filename, display film title for Q1
// Removed: intouchable, meet_the_parent
const VIDEO_META: Array<{ id: string; filename: string; filmTitle: string; displayTitle: string }> = [
  { id: '10_cloverfield_lane',           filename: '10_cloverfield_lane',           filmTitle: '10 Cloverfield Lane',                        displayTitle: '10 Cloverfield Lane' },
  { id: '500_days_of_summer',            filename: '500_days_of_summer',            filmTitle: '500 Days of Summer',                         displayTitle: '500 Days of Summer' },
  { id: 'extremely_loud_extremely_close',filename: 'extremely_loud_extremely_close', filmTitle: 'Extrem laut und unglaublich nah',             displayTitle: 'Extrem laut und unglaublich nah' },
  { id: "hachi_a_dog´s_tale",       filename: "hachi_a_dog´s_tale",       filmTitle: 'Hachiko – Eine wunderbare Freundschaft',      displayTitle: 'Hachiko – Eine wunderbare Freundschaft' },
  { id: 'i_tonya',                       filename: 'i_tonya',                       filmTitle: 'I, Tonya',                                   displayTitle: 'I, Tonya' },
  { id: 'jojo_rabbit',                   filename: 'jojo_rabbit',                   filmTitle: 'Jojo Rabbit',                                displayTitle: 'Jojo Rabbit' },
  { id: 'little_miss_sunshine_negative', filename: 'little_miss_sunshine_negative', filmTitle: 'Little Miss Sunshine',                       displayTitle: 'Little Miss Sunshine (Szene A)' },
  { id: 'little_miss_sunshine_positive', filename: 'little_miss_sunshine_positive', filmTitle: 'Little Miss Sunshine',                       displayTitle: 'Little Miss Sunshine (Szene B)' },
  { id: 'soul',                          filename: 'soul',                          filmTitle: 'Soul',                                       displayTitle: 'Soul' },
  { id: 'up',                            filename: 'up',                            filmTitle: 'Oben',                                       displayTitle: 'Oben' },
]

function makeQuestions(videoId: string, filmTitle: string) {
  return [
    // Q1 — single choice: have you seen this film?
    {
      id: `${videoId}_q1`,
      text: `Diese Szene stammt aus dem Film „${filmTitle}". Hast du diesen Film schon einmal gesehen?`,
      type: 'single' as const,
      options: [
        { id: 'ja',   label: 'Ja' },
        { id: 'nein', label: 'Nein' },
      ],
    },
    // Q2 removed — jump straight to slider
    // Q3 — multiple choice with slider 0–10 (12 emotions)
    {
      id: `${videoId}_q3`,
      text: 'Welche Emotionen hast du beim Anschauen dieser Szene empfunden? Gib bitte für jede ausgewählte Emotion die Intensität an (0 = gar nicht, 10 = sehr stark).',
      type: 'multiple_slider' as const,
      options: SLIDER_OPTIONS,
    },
  ]
}

export const MOCK_SURVEY: Survey = {
  id: 'mock-survey-1',
  title: 'EMOVIE: Bewertung emotionaler Filmszenen',
  intro_text: LOREM,
  demographics_fields: [
    {
      id: 'age',
      label: 'Alter',
      type: 'number',
      required: true,
    },
    {
      id: 'gender',
      label: 'Geschlecht',
      type: 'select',
      required: true,
      options: ['Weiblich', 'Männlich', 'Divers'],
    },
    {
      id: 'education',
      label: 'Bildungsabschluss',
      type: 'select',
      required: true,
      options: [
        'Pflichtschulabschluss (z. B. Hauptschule / Mittelschule / Sekundarstufe I)',
        'Matura / Allgemeine Hochschulreife (AHS, BHS, Abitur)',
        'Bachelorabschluss (Universität / Fachhochschule)',
        'Masterabschluss (Universität / Fachhochschule)',
      ],
    },
    {
      id: 'language',
      label: 'Sprachniveau Deutsch',
      type: 'select',
      required: true,
      options: [
        'A1 – Anfänger',
        'A2 – Grundkenntnisse',
        'B1 – Mittelstufe',
        'B2 – Gute Kenntnisse',
        'C1 – Fortgeschrittene',
        'C2 – Muttersprachler',
      ],
    },
  ],
  videos: VIDEO_META.map(({ id, filename, filmTitle, displayTitle }) => ({
    id,
    storage_url: `${R2_BASE}/${filename}.mp4`,
    title: displayTitle,
    questions: makeQuestions(id, filmTitle),
  })),
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
