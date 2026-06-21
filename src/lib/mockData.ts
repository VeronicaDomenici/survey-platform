import type { Survey } from '../types'

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Partecipando a questa ricerca accetti che i tuoi dati vengano utilizzati in forma anonima per scopi scientifici. Le tue risposte saranno trattate con la massima riservatezza.'

const videoFiles = [
  '10_cloverfield_lane',
  '500_days_of_summer',
  'extremely_loud_extremely_close',
  "hachi_a_dog´s_tale",
  'i_tonya',
  'intouchable',
  'jojo_rabbit',
  'little_miss_sunshine_negative',
  'little_miss_sunshine_positive',
  'meet_the_parent',
  'soul',
  'up',
]

function makeQuestions(videoId: string) {
  return [
    {
      id: `${videoId}_q1`,
      text: 'Come descriveresti l\'emozione predominante in questo clip?',
      type: 'single' as const,
      options: [
        { id: 'joy', label: 'Gioia' },
        { id: 'sadness', label: 'Tristezza' },
        { id: 'fear', label: 'Paura' },
        { id: 'anger', label: 'Rabbia' },
        { id: 'surprise', label: 'Sorpresa' },
        { id: 'disgust', label: 'Disgusto' },
      ],
    },
    {
      id: `${videoId}_q2`,
      text: 'Quali emozioni hai provato guardando questo clip? (puoi selezionare più risposte)',
      type: 'multiple' as const,
      options: [
        { id: 'excited', label: 'Eccitazione' },
        { id: 'calm', label: 'Calma' },
        { id: 'tense', label: 'Tensione' },
        { id: 'moved', label: 'Commozione' },
        { id: 'amused', label: 'Divertimento' },
        { id: 'uneasy', label: 'Disagio' },
      ],
    },
    {
      id: `${videoId}_q3`,
      text: 'Con quale intensità hai provato le seguenti emozioni? (sposta lo slider per ogni emozione selezionata)',
      type: 'multiple_slider' as const,
      options: [
        { id: 'happiness', label: 'Felicità' },
        { id: 'melancholy', label: 'Malinconia' },
        { id: 'anxiety', label: 'Ansia' },
        { id: 'tenderness', label: 'Tenerezza' },
        { id: 'admiration', label: 'Ammirazione' },
      ],
    },
  ]
}

export const MOCK_SURVEY: Survey = {
  id: 'mock-survey-1',
  title: 'Questionario sulle emozioni nei film',
  intro_text: LOREM,
  demographics_fields: [
    { id: 'age', label: 'Età', type: 'number', required: true },
    {
      id: 'gender',
      label: 'Genere',
      type: 'select',
      required: true,
      options: ['Uomo', 'Donna', 'Non binario', 'Preferisco non specificare'],
    },
    {
      id: 'education',
      label: 'Titolo di studio',
      type: 'select',
      required: true,
      options: ['Licenza media', 'Diploma', 'Laurea triennale', 'Laurea magistrale o superiore'],
    },
  ],
  videos: videoFiles.map((name) => ({
    id: name,
    storage_url: `/videos/${name}.mp4`,
    title: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    questions: makeQuestions(name),
  })),
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
