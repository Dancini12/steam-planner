// ============================================================
// ClassProfileFields.jsx
// "Conhecer a turma" — perguntas opcionais da tela "Série".
// ============================================================
//
// Menus suspensos em cascata, no mesmo estilo das outras telas
// do planner: a segunda pergunta só aparece depois da primeira
// resposta. "Outro" abre um campo curto, e há um campo livre no
// final.
// ============================================================

import { SelectField, MultiSelectDropdown } from './PlannerSelectFields.jsx'
import {
  SCHOOL_CONTEXT_OPTIONS,
  SCHOOL_CONTEXT_FOLLOW_UPS,
  CLASS_RHYTHM_OPTIONS,
  CLASS_RHYTHM_FOLLOW_UPS,
  CLASS_INTEREST_OPTIONS,
  CLASS_NOTES_MAX_LENGTH,
  OTHER_MAX_LENGTH
} from '../../lib/classProfile.js'

const toSelectOptions = (options) => options.map((option) => ({
  value: option.id,
  label: option.label
}))

function FollowUp({ children }) {
  return <div style={followUpStyle}>{children}</div>
}

function OtherInput({ label, value, onChange, placeholder }) {
  return (
    <label style={otherFieldStyle}>
      <span style={otherLabelStyle}>{label}</span>
      <input
        type="text"
        value={value}
        maxLength={OTHER_MAX_LENGTH}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={otherInputStyle}
      />
    </label>
  )
}

export default function ClassProfileFields({ value, onChange }) {
  const profile = value
  const update = (patch) => onChange({ ...profile, ...patch })

  const contextFollowUp = SCHOOL_CONTEXT_FOLLOW_UPS[profile.context]
  const rhythmFollowUp = CLASS_RHYTHM_FOLLOW_UPS[profile.rhythm]
  const toggleInList = (list, id) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id])

  return (
    <section style={sectionStyle} aria-label="Conhecer a turma">
      <div style={headerStyle}>
        <span style={headerTitleStyle}>Conhecer a turma</span>
        <span style={optionalBadgeStyle}>opcional</span>
      </div>
      <p style={hintStyle}>
        Ajuda a IA a adaptar a atividade à realidade dos seus alunos. Se preferir, pode pular.
      </p>

      {/* Trocar a primeira resposta limpa a segunda, que dependia dela. */}
      <div>
        <SelectField
          variant="light"
          label="Contexto da escola"
          placeholder="Clique para selecionar o contexto"
          value={profile.context}
          options={toSelectOptions(SCHOOL_CONTEXT_OPTIONS)}
          onChange={(context) => update({ context, contextOther: '', contextDetail: '', contextDetailOther: '' })}
        />
        {profile.context === 'outro' && (
          <FollowUp>
            <OtherInput
              label="↳ Qual é o contexto?"
              value={profile.contextOther}
              onChange={(contextOther) => update({ contextOther })}
              placeholder="Ex.: escola de assentamento, escola itinerante…"
            />
          </FollowUp>
        )}
        {contextFollowUp && (
          <FollowUp>
            <SelectField
              variant="light"
              label={`↳ ${contextFollowUp.question}`}
              placeholder="Clique para selecionar"
              value={profile.contextDetail}
              options={toSelectOptions(contextFollowUp.options)}
              onChange={(contextDetail) => update({ contextDetail, contextDetailOther: '' })}
            />
            {profile.contextDetail === 'outro' && (
              <OtherInput
                label="↳ Qual atividade?"
                value={profile.contextDetailOther}
                onChange={(contextDetailOther) => update({ contextDetailOther })}
                placeholder="Ex.: produção de leite, cana-de-açúcar…"
              />
            )}
          </FollowUp>
        )}
      </div>

      <div>
        <SelectField
          variant="light"
          label="Ritmo da turma"
          placeholder="Clique para selecionar o ritmo"
          value={profile.rhythm}
          options={toSelectOptions(CLASS_RHYTHM_OPTIONS)}
          onChange={(rhythm) => update({ rhythm, rhythmStrategies: [] })}
        />
        {rhythmFollowUp && (
          <FollowUp>
            <MultiSelectDropdown
              key={profile.rhythm}
              label={`↳ ${rhythmFollowUp.question}`}
              placeholder="Clique para selecionar uma ou mais opções"
              options={rhythmFollowUp.options}
              selectedValues={profile.rhythmStrategies}
              onToggle={(id) => update({ rhythmStrategies: toggleInList(profile.rhythmStrategies, id) })}
            />
          </FollowUp>
        )}
      </div>

      <div>
        <MultiSelectDropdown
          label="Interesses dos alunos"
          placeholder="Clique para selecionar um ou mais interesses"
          options={CLASS_INTEREST_OPTIONS}
          selectedValues={profile.interests}
          onToggle={(id) => update({
            interests: toggleInList(profile.interests, id),
            ...(id === 'outro' ? { interestsOther: '' } : {})
          })}
        />
        {profile.interests.includes('outro') && (
          <FollowUp>
            <OtherInput
              label="↳ Quais outros interesses?"
              value={profile.interestsOther}
              onChange={(interestsOther) => update({ interestsOther })}
              placeholder="Ex.: rodeio, dança, motos…"
            />
          </FollowUp>
        )}
      </div>

      <label style={otherFieldStyle}>
        <span style={notesLabelStyle}>Algo mais sobre a turma?</span>
        <textarea
          value={profile.notes}
          maxLength={CLASS_NOTES_MAX_LENGTH}
          rows={2}
          placeholder='Ex.: "Muitos alunos ajudam os pais na colheita."'
          onChange={(event) => update({ notes: event.target.value })}
          style={notesStyle}
        />
        <span style={notesFooterStyle}>
          <span style={privacyStyle}>Não escreva nomes ou dados de alunos.</span>
          <span>{profile.notes.length}/{CLASS_NOTES_MAX_LENGTH}</span>
        </span>
      </label>
    </section>
  )
}

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '8px',
  padding: '16px',
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '10px'
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const headerTitleStyle = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#1F2937'
}

const optionalBadgeStyle = {
  padding: '2px 8px',
  borderRadius: '999px',
  backgroundColor: '#E5E7EB',
  color: '#4B5563',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const hintStyle = {
  margin: '0 0 4px',
  fontSize: '15px',
  color: '#6B7280',
  lineHeight: 1.5
}

// Recuo com linha azul: mostra que a pergunta depende da de cima.
const followUpStyle = {
  marginTop: '4px',
  marginLeft: '6px',
  paddingLeft: '14px',
  borderLeft: '3px solid #BFDBFE'
}

const otherFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '12px'
}

const otherLabelStyle = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#374151'
}

const notesLabelStyle = {
  ...otherLabelStyle,
  marginBottom: '6px'
}

const otherInputStyle = {
  width: '100%',
  minHeight: '44px',
  padding: '0 14px',
  border: '2px solid #D1D5DB',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  fontSize: '16px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box'
}

const notesStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '2px solid #D1D5DB',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  fontSize: '16px',
  fontFamily: 'inherit',
  lineHeight: 1.5,
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box'
}

const notesFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  fontSize: '13px',
  color: '#6B7280'
}

const privacyStyle = {
  color: '#B45309',
  fontWeight: 600
}
