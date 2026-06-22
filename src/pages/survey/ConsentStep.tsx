import { ProgressBar } from '../../components/ProgressBar'
import type { SurveyAction } from '../../reducers/surveyReducer'

interface Props {
  consent: boolean
  totalSteps: number
  dispatch: React.Dispatch<SurveyAction>
  onNext: () => void
}

export function ConsentStep({ consent, totalSteps, dispatch, onNext }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <ProgressBar current={0} total={totalSteps} />

      <div className="bg-white rounded-xl shadow-sm p-8">
        {/* No h2 title here — welcome line is the first visible element */}
        <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
          <p className="text-base font-semibold text-justify">
            Liebe*r Teilnehmer*in, herzlichen Dank für Deine Bereitschaft an unserer Studie teilzunehmen.
          </p>

          <p className="text-justify">
            Diese Studie ist Teil eines Forschungsprojektes das am Institutes für Klinische und
            Gesundheitspsychologie der Universität Wien. Die Studie dient ausschließlich
            wissenschaftlichen Zwecken und wurde durch die Ethikkommission der Universität Wien
            begutachtet und genehmigt (für weitere Informationen kannst Du{' '}
            <a href="mailto:ethikkommission@univie.ac.at" className="text-blue-600 underline">
              ethikkommission@univie.ac.at
            </a>{' '}
            kontaktieren).
          </p>

          <p className="text-justify">
            Solltest Du weitere Fragen bezüglich der Studie haben, kontaktiere unser Forschungsteam
            gerne unter:{' '}
            <a href="mailto:gutfeel.project@gmail.com" className="text-blue-600 underline italic">
              gutfeel.project@gmail.com
            </a>
            .
          </p>

          {/* "Einwilligungserklärung" — larger, with extra vertical spacing */}
          <p className="text-base font-semibold underline pt-3 pb-1">
            Einwilligungserklärung
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              Alle Informationen, die wir von Dir erhalten, werden gemäß dem Datenschutzgesetz
              vollständig anonym behandelt.
            </li>
            <li>
              Alle Angaben werden ausschließlich für wissenschaftliche Zwecke an dem Institut für
              Klinische und Gesundheitspsychologie der Universität Wien aufbewahrt und ausgewertet.
            </li>
            <li>
              Am Ende der Untersuchung werden alle personenbezogenen Daten gelöscht.
            </li>
            <li>
              Es ist für uns im Folgenden wichtig, dass Du alle Fragen beantwortest. Es geht um
              Deine persönliche Einschätzung und es gibt keine richtigen oder falschen Antworten.
            </li>
            <li>
              Solltest Du aus irgendeinem Grund Deine Teilnahme an der Studie zurückziehen oder
              beenden wollen, hat dies keine weiteren Folgen und alle Deine bereitgestellten
              Informationen werden gelöscht.
            </li>
          </ul>

          <p className="text-justify">
            Mit dem Ankreuzen von „Ich bin damit einverstanden" bestätigst Du die Einleitung gelesen
            zu haben und willigst ein, an dieser Studie teilzunehmen.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mt-6 mb-8">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => dispatch({ type: 'SET_CONSENT', consent: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 font-medium">
            Ich bin damit einverstanden.
          </span>
        </label>

        <div className="flex justify-end">
          <button
            onClick={onNext}
            disabled={!consent}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium
              hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  )
}
