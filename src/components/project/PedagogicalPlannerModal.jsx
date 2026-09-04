import { useState, useEffect, useMemo } from 'react'
import { PedagogicalPlannerService, DAILY_LIMIT, UNLIMITED_EMAIL } from '../../lib/ai/pedagogicalPlannerService.js'
import { AIProviderManager } from '../../lib/ai/AIProviderManager.js'
import { supabase } from '../../lib/supabaseClient.js'
import { buildUserLearningProfile } from '../../lib/machine-learning/user-profile/profileBuilder.js'
import { suggestThemesFromProfile } from '../../lib/machine-learning/recommendation/recommendationEngine.js'
import { selectBnccHabilidades } from '../../lib/bnccSelector.js'
import { suggestSteamAreasForMaterials } from '../../lib/steamMaterialSuggester.js'

import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import TextField from '../ui/TextField.jsx'

const LOCAL_QUEUE_KEY = 'steam-ml-behavior-queue'

function getLocalThemeSuggestions(limit = 5) {
  try {
    const events = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]')
    if (!events.length) return []
    const profile = buildUserLearningProfile({ events })
    return suggestThemesFromProfile(profile, limit).map((s) => s.theme)
  } catch {
    return []
  }
}

const DISCIPLINES = [
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Língua Portuguesa',
  'Inglês',
  'Arte',
  'Educação Física',
  'Robótica',
  'Educação Financeira',
  'Filosofia',
  'Sociologia',
  'Biologia',
  'Física',
  'Química'
]

const GRADES = [
  '6º ano - Ensino Fundamental',
  '7º ano - Ensino Fundamental',
  '8º ano - Ensino Fundamental',
  '9º ano - Ensino Fundamental'
]

const STEAM_COMPETENCIES = [
  { id: 'science', label: 'Ciência', icon: '🔬', color: '#10B981' },
  { id: 'technology', label: 'Tecnologia', icon: '💻', color: '#3B82F6' },
  { id: 'engineering', label: 'Engenharia', icon: '⚙️', color: '#F59E0B' },
  { id: 'arts', label: 'Arte', icon: '🎨', color: '#EF4444' },
  { id: 'mathematics', label: 'Matemática', icon: '🔢', color: '#8B5CF6' }
]

const PERSONALIZATION_OPTIONS = {
  assessment: {
    title: 'Avaliação',
    type: 'single',
    options: [
      { id: 'observacao', label: 'Observação do professor', instruction: 'Propor avaliação por observação, registro em diário de bordo e evidências do processo.' },
      { id: 'autoavaliacao', label: 'Autoavaliação dos alunos', instruction: 'Incluir autoavaliação curta para os estudantes refletirem sobre participação e aprendizagem.' }
    ]
  }
}

const defaultPersonalization = {
  assessment: 'observacao'
}

function buildDefaultPersonalization() {
  return { ...defaultPersonalization }
}

function TipCard({ icon, title, text, color }) {
  return (
    <div style={{ padding: '0.8rem 1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderLeft: `3px solid ${color}`, borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.15rem', flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: '600', color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.28rem' }}>{title}</div>
        <div style={{ fontSize: '0.84rem', color: '#374151', lineHeight: 1.6 }}>{text}</div>
      </div>
    </div>
  )
}

function SelectField({ label, placeholder, value, options, onChange }) {
  return (
    <label style={selectFieldStyle}>
      <span style={selectLabelStyle}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={selectInputStyle}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function MultiSelectDropdown({ label, placeholder, options, selectedValues, onToggle, recommendedIds = [] }) {
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.id))
    .map((option) => option.label)

  return (
    <details style={multiSelectStyle} open={recommendedIds.length > 0}>
      <summary style={multiSelectSummaryStyle}>
        <span>
          <span style={selectLabelStyle}>{label}</span>
          <span style={multiSelectValueStyle}>
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
          </span>
        </span>
        <span style={multiSelectArrowStyle}>⌄</span>
      </summary>
      <div style={multiSelectOptionsStyle}>
        {options.map((option) => {
          const checked = selectedValues.includes(option.id)
          const recommended = recommendedIds.includes(option.id)
          return (
            <label
              key={option.id}
              style={{
                ...multiSelectOptionStyle,
                borderColor: checked ? '#3B82F6' : recommended ? '#F59E0B' : '#E5E7EB',
                backgroundColor: checked ? '#DBEAFE' : '#FFFFFF',
                color: checked ? '#1E40AF' : '#374151',
                justifyContent: 'space-between'
              }}
            >
              <span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option.id)}
                  style={multiSelectCheckboxStyle}
                />
                {option.icon ? `${option.icon} ` : ''}{option.label}
              </span>
              {recommended && !checked && (
                <span style={recommendedBadgeStyle}>sugerido pelos materiais</span>
              )}
            </label>
          )
        })}
      </div>
    </details>
  )
}

function generateActivityTips(formData) {
  const steamNames = { science: 'Ciência', technology: 'Tecnologia', engineering: 'Engenharia', arts: 'Arte', mathematics: 'Matemática' }
  const steamDescs = {
    science: 'investigação e método científico',
    technology: 'criação e uso de ferramentas digitais',
    engineering: 'design, construção e testes de soluções',
    arts: 'expressão criativa e pensamento estético',
    mathematics: 'lógica, cálculo e modelagem de problemas'
  }
  const selected = formData.steamCompetencies
  const steamText = selected.length > 0
    ? `Integra ${selected.map(c => steamNames[c] || c).join(', ')} por meio de ${selected.map(c => steamDescs[c] || c).join('; ')}.`
    : 'As áreas STEAM selecionadas criam uma experiência interdisciplinar que conecta teoria e prática.'

  return [
    { icon: '⚡', title: 'Dica STEAM', color: '#4F46E5', text: steamText + ' A combinação dessas áreas cria conexões interdisciplinares que tornam o aprendizado mais significativo.' },
    { icon: '🔨', title: 'Cultura Maker', color: '#10B981', text: 'A Cultura Maker aparece quando os alunos constroem, testam e melhoram seus protótipos. O erro faz parte do processo — cada tentativa ensina mais do que qualquer explicação.' },
    { icon: '📋', title: 'Competências BNCC', color: '#8B5CF6', text: `Para o ${formData.grade || 'Ensino Fundamental'}, esta atividade desenvolve pensamento científico, criatividade, comunicação, colaboração e uso de tecnologias — competências gerais da BNCC presentes em todas as áreas do conhecimento.` },
    { icon: '🔧', title: 'Como adaptar', color: '#F59E0B', text: 'Sem laboratório? Sem problema. Papelão, recicláveis, palitos e cola são suficientes para prototipagem. Para aulas mais curtas, reduza o ciclo para 1 construção + 1 teste + 1 melhoria.' },
    { icon: '🎨', title: 'Dica Criativa', color: '#EC4899', text: 'Apresente o problema como uma missão: "vocês são engenheiros(as) responsáveis por resolver...". Isso aumenta o engajamento e dá propósito real à atividade.' },
    { icon: '📚', title: 'Referências', color: '#06B6D4', text: 'As referências ficam junto ao documento da atividade para revisão, validação e impressão pelo professor.' }
  ]
}

function PedagogicalPlannerModal({ isOpen, onClose, onActivityGenerated, currentUser }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    discipline: '',
    grade: '',
    theme: '',
    availableMaterials: '',
    strictMaterials: true,
    steamCompetencies: [],
    numberOfClasses: '',
    modality: 'grupo',
    personalization: buildDefaultPersonalization()
  })
  const [previewData, setPreviewData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('generating')
  const [activeProviders, setActiveProviders] = useState([])
  const [usedProvider, setUsedProvider] = useState(null)
  const [error, setError] = useState('')
  const [remainingCount, setRemainingCount] = useState(null)

  const isUnlimited = currentUser?.email === UNLIMITED_EMAIL

  // Assim que o professor lista os materiais que possui, sugere quais áreas
  // STEAM eles sustentam e por quê — recalculado a cada alteração do texto.
  const materialSteamSuggestions = useMemo(
    () => suggestSteamAreasForMaterials(formData.availableMaterials),
    [formData.availableMaterials]
  )
  const suggestedSteamIds = materialSteamSuggestions.matches.map((m) => m.id)

  useEffect(() => {
    if (isOpen) {
      resetForm()
      if (!isUnlimited && currentUser?.id) {
        PedagogicalPlannerService.getDailyUsageCount(currentUser.id)
          .then((used) => setRemainingCount(Math.max(0, DAILY_LIMIT - used)))
          .catch(() => setRemainingCount(null))
      }
    }
  }, [isOpen, currentUser?.id, isUnlimited])

  const resetForm = () => {
    setCurrentStep(0)
    setFormData({
      discipline: '',
      grade: '',
      theme: '',
      availableMaterials: '',
      strictMaterials: true,
      steamCompetencies: [],
      numberOfClasses: '',
      modality: 'grupo',
      personalization: buildDefaultPersonalization()
    })
    setPreviewData(null)
    setError('')
  }

  const generatePreviewData = () => {
    const bnccItems = selectBnccHabilidades({
      grade: formData.grade,
      discipline: formData.discipline,
      theme: formData.theme,
      steamCompetencies: formData.steamCompetencies,
      limit: 5
    })

    const benefitsMap = {
      science: ['Desenvolvimento do pensamento científico', 'Capacidade de observação e investigação', 'Compreensão de conceitos fundamentais'],
      technology: ['Letramento digital aprimorado', 'Pensamento computacional', 'Capacidade de resolver problemas tecnológicos'],
      engineering: ['Habilidade de design e prototipagem', 'Pensamento sistêmico', 'Capacidade de otimizar soluções'],
      arts: ['Expressão criativa', 'Desenvolvimento artístico e estético', 'Pensamento divergente'],
      mathematics: ['Aplicação prática de conceitos matemáticos', 'Raciocínio lógico aprimorado', 'Resolução de problemas complexos']
    }

    const selectedBenefits = []
    formData.steamCompetencies.forEach(competency => {
      if (benefitsMap[competency]) {
        selectedBenefits.push(...benefitsMap[competency])
      }
    })

    setPreviewData({
      bnccItems,
      studentBenefits: [...new Set(selectedBenefits)],
      makerElements: ['🔨 Prototipagem prática', '🔄 Ciclos de iteração', '🧠 Pensamento crítico', '👥 Trabalho colaborativo', '⚡ Aprendizagem mão na massa']
    })
  }

  const buildCustomInstructions = () => {
    const instructions = []
    Object.entries(PERSONALIZATION_OPTIONS).forEach(([groupId, group]) => {
      const selected = formData.personalization[groupId]
      const selectedIds = Array.isArray(selected) ? selected : [selected]
      group.options
        .filter((option) => selectedIds.includes(option.id))
        .forEach((option) => instructions.push(`- ${option.instruction}`))
    })

    return instructions.join('\n')
  }

  const handleNext = () => {
    if (currentStep === 7) {
      generatePreviewData()
    }
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1)
      setError('')
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleDisciplineSelect = (discipline) => {
    setFormData(prev => ({ ...prev, discipline }))
    setError('')
  }

  const handleGradeSelect = (grade) => {
    setFormData(prev => ({ ...prev, grade }))
    setError('')
  }

  const handleThemeChange = (theme) => {
    setFormData(prev => ({ ...prev, theme }))
    setError('')
  }

  const handleAvailableMaterialsChange = (availableMaterials) => {
    setFormData(prev => ({ ...prev, availableMaterials }))
    setError('')
  }

  const handleSteamCompetencyToggle = (competencyId) => {
    setFormData(prev => ({
      ...prev,
      steamCompetencies: prev.steamCompetencies.includes(competencyId)
        ? prev.steamCompetencies.filter(id => id !== competencyId)
        : [...prev.steamCompetencies, competencyId]
    }))
    setError('')
  }

  // Aplica, com um clique, as áreas STEAM sugeridas a partir dos materiais
  // informados — soma às já selecionadas em vez de substituir.
  const handleApplySteamSuggestions = (suggestedIds) => {
    setFormData(prev => ({
      ...prev,
      steamCompetencies: [...new Set([...prev.steamCompetencies, ...suggestedIds])]
    }))
    setError('')
  }

  const handleNumberOfClassesChange = (value) => {
    setFormData(prev => ({ ...prev, numberOfClasses: value }))
    setError('')
  }

  const handleModalityChange = (value) => {
    setFormData(prev => ({ ...prev, modality: value }))
    setError('')
  }

  const handlePersonalizationChange = (groupId, optionId, type) => {
    setFormData(prev => {
      const current = prev.personalization[groupId]
      const nextValue = type === 'multi'
        ? current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        : optionId

      return {
        ...prev,
        personalization: {
          ...prev.personalization,
          [groupId]: nextValue
        }
      }
    })
    setError('')
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return formData.discipline !== ''
      case 1:
        return formData.grade !== ''
      case 2:
        return formData.theme.trim().length >= 3
      case 3:
        return true
      case 4:
        return formData.steamCompetencies.length > 0
      case 5:
        return formData.numberOfClasses !== '' && parseInt(formData.numberOfClasses) > 0
      case 6:
        return true
      case 7:
        return true
      case 8:
        return !!previewData
      default:
        return false
    }
  }

  const handleGenerate = async () => {
    if (!validateCurrentStep()) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const providers = AIProviderManager.getProviderNames()
    setActiveProviders(providers)
    setUsedProvider(null)
    setLoadingPhase('sources')
    setIsGenerating(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      setLoadingPhase('generating')
      const result = await PedagogicalPlannerService.generatePedagogicalActivity({
        ...formData,
        customInstructions: buildCustomInstructions(),
        userId: user.id,
        userEmail: user.email,
      })

      setUsedProvider(result.provider || providers[0] || 'gemini')
      setLoadingPhase('saving')

      if (onActivityGenerated) {
        await onActivityGenerated({ ...result, formData })
      }

      onClose()
    } catch (error) {
      setError(error.message || 'Erro ao gerar atividade pedagógica')
    } finally {
      setIsGenerating(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>📚 Qual disciplina?</h3>
            <p style={stepDescriptionStyle}>
              Escolha a disciplina principal da atividade pedagógica.
            </p>
            <SelectField
              label="Disciplina"
              placeholder="Clique para selecionar uma disciplina"
              value={formData.discipline}
              options={DISCIPLINES}
              onChange={handleDisciplineSelect}
            />
          </div>
        )

      case 1:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>🎓 Qual série/ano?</h3>
            <p style={stepDescriptionStyle}>
              Selecione a série ou ano escolar apropriado.
            </p>
            <SelectField
              label="Série/ano"
              placeholder="Clique para selecionar a série"
              value={formData.grade}
              options={GRADES}
              onChange={handleGradeSelect}
            />
          </div>
        )

      case 2: {
        const themeSuggestions = getLocalThemeSuggestions(5)
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>🎯 Qual tema central?</h3>
            <p style={stepDescriptionStyle}>
              Descreva o tema principal da atividade (mínimo 3 caracteres).
            </p>
            {themeSuggestions.length > 0 && (
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '0.5rem' }}>
                  Temas do seu histórico
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {themeSuggestions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleThemeChange(t)}
                      style={{
                        padding: '0.3rem 0.75rem',
                        background: formData.theme === t ? '#4F46E5' : 'rgba(79,70,229,0.1)',
                        border: `1px solid ${formData.theme === t ? '#4F46E5' : 'rgba(79,70,229,0.35)'}`,
                        borderRadius: '20px',
                        color: formData.theme === t ? '#fff' : '#818CF8',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <TextField
              placeholder="Ex: Energia Renovável, Revolução Industrial, Frações e Decimais..."
              value={formData.theme}
              onChange={handleThemeChange}
              multiline
              rows={3}
              fullWidth
            />
          </div>
        )
      }

      case 3:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>📦 Materiais disponíveis</h3>
            <p style={stepDescriptionStyle}>
              Informe quais materiais e quantidades você já possui para montar a atividade. Assim a IA pode propor uma atividade mais alinhada à sua realidade.
            </p>
            <TextField
              label="Materiais e quantidades"
              placeholder="Ex: 10 canetas esferográficas, 30 folhas A4, 5 kits de circuito básico, 2 metros de barbante..."
              hint="Um material por linha é ideal. Inclua quantidades aproximadas para ajudar na geração."
              value={formData.availableMaterials}
              onChange={handleAvailableMaterialsChange}
              multiline
              rows={4}
              fullWidth
            />
            {formData.availableMaterials.trim().length > 0 && (
              <div style={steamSuggestionBoxStyle}>
                <div style={steamSuggestionHeaderStyle}>
                  💡 Áreas STEAM sugeridas para estes materiais
                </div>
                {materialSteamSuggestions.matches.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {materialSteamSuggestions.matches.map((s) => (
                        <div key={s.id} style={{ ...steamSuggestionItemStyle, borderLeftColor: s.color }}>
                          <span style={{ fontSize: '20px', lineHeight: 1 }}>{s.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: s.color, fontSize: '0.85rem' }}>
                              {s.letter} · {s.name}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#4B5563', lineHeight: 1.4 }}>
                              {s.reason}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplySteamSuggestions(suggestedSteamIds)}
                      style={applySuggestionButtonStyle}
                    >
                      Usar {materialSteamSuggestions.matches.length > 1 ? 'estas sugestões' : 'esta sugestão'} nas competências STEAM
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '6px' }}>
                    {materialSteamSuggestions.fallbackMessage}
                  </p>
                )}
              </div>
            )}
            {formData.availableMaterials.trim().length > 0 && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={!formData.strictMaterials}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, strictMaterials: !e.target.checked }))
                  }
                  style={{ marginTop: '0.15rem' }}
                />
                <span>
                  Permitir que a IA acrescente materiais extras de baixo custo.
                  <br />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                    Por padrão, a atividade usa <strong>somente</strong> os materiais que você listou — em todas as etapas, no desafio, no produto e no gabarito.
                  </span>
                </span>
              </label>
            )}
          </div>
        )

      case 4:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>🔬 Competências STEAM</h3>
            <p style={stepDescriptionStyle}>
              Selecione as competências STEAM que deseja utilizar. A Cultura Maker será incluída automaticamente.
            </p>
            <MultiSelectDropdown
              label="Competências STEAM"
              placeholder="Clique para selecionar uma ou mais competências"
              options={STEAM_COMPETENCIES}
              selectedValues={formData.steamCompetencies}
              onToggle={handleSteamCompetencyToggle}
              recommendedIds={suggestedSteamIds}
            />
            {suggestedSteamIds.length > 0 && (
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                💡 Marcadas com base nos materiais informados na etapa anterior — ajuste como preferir.
              </p>
            )}
            <div style={makerNoteStyle}>
              🔧 <strong>Cultura Maker</strong> será incluída automaticamente em todas as atividades
            </div>
          </div>
        )

      case 5:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>⏱️ Quantas aulas?</h3>
            <p style={stepDescriptionStyle}>
              Defina a quantidade de aulas que você deseja trabalhar o conteúdo. A atividade será adequada à duração especificada.
            </p>
            <div style={classesInputContainerStyle}>
              <div style={classesInputFieldStyle}>
                <label style={classesLabelStyle}>Número de aulas</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.numberOfClasses}
                  onChange={(e) => handleNumberOfClassesChange(e.target.value)}
                  placeholder="Ex: 5"
                  style={classesNumberInputStyle}
                />
              </div>
              <div style={classesSuggestionsStyle}>
                <SelectField
                  label="Sugestões rápidas"
                  placeholder="Clique para escolher uma duração"
                  value={['1', '2', '3', '5', '8', '10'].includes(formData.numberOfClasses) ? formData.numberOfClasses : ''}
                  options={[1, 2, 3, 5, 8, 10].map((num) => ({
                    value: String(num),
                    label: `${num} aula${num > 1 ? 's' : ''}`
                  }))}
                  onChange={handleNumberOfClassesChange}
                />
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>👥 Como será desenvolvida?</h3>
            <p style={stepDescriptionStyle}>
              Defina se a atividade será realizada em grupo ou individualmente pelos estudantes.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {[
                { value: 'grupo', label: 'Em grupo', icon: '👥', desc: 'Colaboração, papéis definidos e aprendizagem entre pares' },
                { value: 'individual', label: 'Individual', icon: '👤', desc: 'Autonomia, reflexão pessoal e ritmo próprio' }
              ].map(({ value, label, icon, desc }) => {
                const active = formData.modality === value
                return (
                  <button
                    key={value}
                    onClick={() => handleModalityChange(value)}
                    style={{
                      flex: 1,
                      padding: '1.25rem 1rem',
                      borderRadius: '10px',
                      border: active ? '2px solid #3B82F6' : '2px solid #E5E7EB',
                      background: active ? '#DBEAFE' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: active ? '#1E40AF' : '#1F2937', marginBottom: '0.35rem' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: active ? '#3B82F6' : '#6B7280', lineHeight: 1.4 }}>{desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 7:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>⚙️ Como você quer personalizar?</h3>
            <p style={stepDescriptionStyle}>
              Escolha as opções que melhor combinam com sua turma. Se faltar algo, escreva uma orientação extra no final.
            </p>

            {Object.entries(PERSONALIZATION_OPTIONS).map(([groupId, group]) => (
              <div key={groupId} style={personalizationGroupStyle}>
                {group.type === 'multi' ? (
                  <MultiSelectDropdown
                    label={group.title}
                    placeholder="Clique para selecionar uma ou mais opções"
                    options={group.options}
                    selectedValues={formData.personalization[groupId]}
                    onToggle={(optionId) => handlePersonalizationChange(groupId, optionId, group.type)}
                  />
                ) : (
                  <SelectField
                    label={group.title}
                    placeholder="Clique para selecionar uma opção"
                    value={formData.personalization[groupId]}
                    options={group.options.map((option) => ({
                      value: option.id,
                      label: option.label
                    }))}
                    onChange={(optionId) => handlePersonalizationChange(groupId, optionId, group.type)}
                  />
                )}
              </div>
            ))}

          </div>
        )

      case 8:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>👁️ Prévia da Atividade</h3>
            <p style={stepDescriptionStyle}>
              Confira o que será abordado nesta atividade:
            </p>

            {previewData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={previewSectionStyle}>
                  <h4 style={previewSubtitleStyle}>📋 Competências da BNCC</h4>
                  <div style={previewListStyle}>
                    {previewData.bnccItems.map((item, idx) => (
                      <div key={idx} style={previewItemStyle}>
                        <span style={previewBadgeStyle}>{item.codigo}</span>
                        <div style={{ marginTop: '6px' }}>{item.descricao}</div>
                      </div>
                    ))}
                  </div>
                  <p style={previewHintStyle}>
                    Essas competências da BNCC serão trabalhadas e desenvolvidas durante a atividade.
                  </p>
                </div>

                <div style={previewSectionStyle}>
                  <h4 style={previewSubtitleStyle}>⚙️ Personalização escolhida</h4>
                  <div style={previewListStyle}>
                    {buildCustomInstructions().split('\n').map((instruction, idx) => (
                      <div key={idx} style={previewItemStyle}>
                        {instruction.replace(/^- /, '✓ ')}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={previewSectionStyle}>
                  <h4 style={previewSubtitleStyle}>🔧 Elementos Maker Inclusos</h4>
                  <div style={previewListStyle}>
                    {previewData.makerElements.map((element, idx) => (
                      <div key={idx} style={previewItemStyle}>
                        {element}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={previewSectionStyle}>
                  <h4 style={previewSubtitleStyle}>✨ O que o aluno vai aprender?</h4>
                  <div style={previewListStyle}>
                    {previewData.studentBenefits.map((benefit, idx) => (
                      <div key={idx} style={previewItemStyle}>
                        ✓ {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const renderStepTip = (step) => {
    if (step === 8) {
      const tips = generateActivityTips(formData)
      return (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9CA3AF', marginBottom: '0.6rem' }}>
            Orientações pedagógicas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.55rem' }}>
            {tips.map((tip, i) => <TipCard key={i} {...tip} />)}
          </div>
        </div>
      )
    }

    const byStep = {
      0: { icon: '💡', title: 'Dica STEAM', color: '#4F46E5', text: 'Toda disciplina conecta ao STEAM. Você não precisa abandonar o currículo — apenas transformar o conteúdo em uma experiência investigativa e prática que faz sentido para o aluno.' },
      1: {
        icon: '🎓',
        title: formData.grade?.includes('6') || formData.grade?.includes('7') ? 'Série ideal para Maker' : 'Protagonismo estudantil',
        color: '#10B981',
        text: formData.grade?.includes('6') || formData.grade?.includes('7')
          ? 'Alunos de 6º e 7º ano adoram explorar e construir. Desafios mão na massa e investigação criam memórias de aprendizado duradouras.'
          : 'No 8º e 9º ano, projetos com impacto real e autonomia aumentam muito o engajamento. Desafios sociais e tecnológicos são ideais para esta faixa.'
      },
      2: { icon: '🔍', title: 'Transforme em desafio', color: '#EC4899', text: 'Um bom tema STEAM começa com uma pergunta real: "Como podemos resolver...?" Isso coloca os alunos como protagonistas da investigação, não receptores de conteúdo.' },
      3: {
        icon: '📦',
        title: 'Materiais reais',
        color: '#F59E0B',
        text: formData.availableMaterials.trim()
          ? 'Use os materiais que você já tem para tornar a atividade mais prática e adequada à sua realidade.'
          : 'Se você não souber ao certo, a IA ainda sugerirá uma atividade, mas incluir os materiais disponíveis melhora a proposta.'
      },
      4: {
        icon: '⚡',
        title: 'Sinergia STEAM',
        color: '#4F46E5',
        text: formData.steamCompetencies.length > 1
          ? `Combinar ${formData.steamCompetencies.length} áreas cria conexões interdisciplinares poderosas. Os alunos percebem que desafios reais exigem múltiplos olhares.`
          : 'Selecione mais áreas STEAM para criar conexões interdisciplinares mais ricas. A Cultura Maker estará presente automaticamente em toda a atividade.'
      },
      5: {
        icon: '🗓️',
        title: 'Jornada Maker',
        color: '#8B5CF6',
        text: `Com ${formData.numberOfClasses || '?'} aula(s) sugerimos: exploração do problema → investigação → construção → testes e ajustes → apresentação. Cada fase aprofunda o aprendizado progressivamente.`
      },
      6: {
        icon: '👥',
        title: 'Modo de Trabalho',
        color: '#10B981',
        text: formData.modality === 'individual'
          ? 'Atividades individuais fortalecem autonomia, autoavaliação e o ritmo próprio de cada aluno. A IA adaptará as etapas, desafios e a Atividade do Aluno para trabalho solo.'
          : 'Atividades em grupo desenvolvem colaboração, comunicação e aprendizagem entre pares. A IA distribuirá papéis (construtor, testador, registrador, apresentador) entre os membros.'
      },
      7: { icon: '⚙️', title: 'Ajustes finais', color: '#06B6D4', text: 'Use este passo para definir nível de detalhe, materiais, avaliação e qualquer orientação específica da turma.' }
    }

    const tip = byStep[step]
    return tip ? <TipCard {...tip} /> : null
  }

  const steps = [
    { title: 'Disciplina', icon: '📚' },
    { title: 'Série', icon: '🎓' },
    { title: 'Tema', icon: '🎯' },
    { title: 'Materiais', icon: '📦' },
    { title: 'STEAM', icon: '🔬' },
    { title: 'Aulas', icon: '⏱️' },
    { title: 'Modo', icon: '👥' },
    { title: 'Ajustes', icon: '⚙️' },
    { title: 'Prévia', icon: '👁️' }
  ]

  const PROVIDER_META = {
    gemini: { label: 'Google Gemini', role: 'Geração principal', color: '#4F46E5', badge: 'G' },
    cerebras: { label: 'Cerebras llama-3.3-70b', role: 'Fallback rápido', color: '#10B981', badge: 'C' }
  }

  const renderLoading = () => (
    <div style={loadingContainerStyle}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
      <div style={loadingSpinnerWrapStyle}>
        <div style={loadingRingStyle} />
        <span style={loadingIconStyle}>✨</span>
      </div>

      <div style={loadingTitleStyle}>
        {loadingPhase === 'sources' ? 'Buscando fontes reais…' : loadingPhase === 'saving' ? 'Salvando atividade…' : 'Gerando sua atividade'}
      </div>
      <p style={loadingSubtitleStyle}>
        {loadingPhase === 'sources'
          ? 'Consultando Crossref, OpenAlex, SciELO e Semantic Scholar para validar referências antes de gerar o planejamento…'
          : loadingPhase === 'saving'
          ? 'Registrando a atividade gerada e preparando o visualizador…'
          : 'Analisando o tema, selecionando competências BNCC e montando o planejamento completo…'}
      </p>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {[
          { key: 'sources', label: '🔍 Fontes' },
          { key: 'generating', label: '✨ Geração' },
          { key: 'saving', label: '💾 Salvando' }
        ].map(({ key, label }, i) => {
          const phaseOrder = ['sources', 'generating', 'saving']
          const currentIndex = phaseOrder.indexOf(loadingPhase)
          const stepIndex = phaseOrder.indexOf(key)
          const done = stepIndex < currentIndex
          const active = key === loadingPhase
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <div style={{ width: 24, height: 2, background: done ? '#10B981' : '#E5E7EB', borderRadius: 1 }} />}
              <div style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: done ? '#D1FAE5' : active ? '#EDE9FE' : '#F3F4F6',
                color: done ? '#065F46' : active ? '#5B21B6' : '#9CA3AF',
                border: `1px solid ${done ? '#6EE7B7' : active ? '#C4B5FD' : '#E5E7EB'}`
              }}>{done ? '✓ ' : ''}{label}</div>
            </div>
          )
        })}
      </div>

      <div style={loadingProviderBoxStyle}>
        <div style={loadingProviderLabelStyle}>IAs utilizadas</div>
        <div style={loadingProviderListStyle}>
          {activeProviders.map((name, i) => {
            const meta = PROVIDER_META[name] || { label: name, role: 'Provedor', color: '#6B7280', badge: name[0].toUpperCase() }
            const isPrimary = i === 0
            return (
              <div key={name} style={{ ...loadingProviderItemStyle, borderColor: isPrimary ? meta.color : '#E5E7EB' }}>
                <div style={{ ...loadingProviderBadgeStyle, background: meta.color }}>{meta.badge}</div>
                <div style={loadingProviderInfoStyle}>
                  <div style={loadingProviderNameStyle}>{meta.label}</div>
                  <div style={loadingProviderRoleStyle}>{isPrimary ? 'Principal' : 'Fallback'} · {meta.role}</div>
                </div>
                <div style={{ ...loadingProviderDotStyle, background: isPrimary ? meta.color : '#D1D5DB' }} />
              </div>
            )
          })}
        </div>
      </div>

      <div style={loadingParamsStyle}>
        <span style={loadingParamChipStyle}>{formData.discipline}</span>
        <span style={loadingParamChipStyle}>{formData.grade}</span>
        <span style={loadingParamChipStyle}>{formData.numberOfClasses} aula{formData.numberOfClasses !== '1' ? 's' : ''}</span>
        {formData.steamCompetencies.map((c) => (
          <span key={c} style={{ ...loadingParamChipStyle, background: '#EDE9FE', color: '#5B21B6', border: '1px solid #C4B5FD' }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={isGenerating ? undefined : onClose} title="🎓 Planejador Pedagógico Inteligente" size="large">
      <div style={containerStyle}>
        {isGenerating ? renderLoading() : (
          <>
            {/* Progress Indicator */}
            <div style={progressStyle}>
              {steps.map((step, index) => (
                <div key={index} style={progressStepStyle}>
                  <div style={{
                    ...progressCircleStyle,
                    backgroundColor: index <= currentStep ? '#3B82F6' : '#E5E7EB',
                    color: index <= currentStep ? 'white' : '#6B7280'
                  }}>
                    {index < currentStep ? '✓' : step.icon}
                  </div>
                  <span style={{
                    ...progressLabelStyle,
                    color: index <= currentStep ? '#3B82F6' : '#6B7280'
                  }}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div style={{
                      ...progressLineStyle,
                      backgroundColor: index < currentStep ? '#3B82F6' : '#E5E7EB'
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div style={contentStyle}>
              {renderStepContent()}
              {renderStepTip(currentStep)}

              {error && (
                <div style={errorStyle}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={actionsStyle}>
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                ← Voltar
              </Button>

              <div style={spacerStyle} />

              {currentStep < 8 ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateCurrentStep()}
                >
                  Próximo →
                </Button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {!isUnlimited && remainingCount !== null && (
                    <span style={{
                      fontSize: '0.72rem',
                      color: remainingCount <= 1 ? '#EF4444' : remainingCount <= 2 ? '#F59E0B' : '#6B7280',
                      fontWeight: 600
                    }}>
                      {remainingCount === 0
                        ? 'Limite diário atingido'
                        : `${remainingCount} de ${DAILY_LIMIT} atividade${remainingCount !== 1 ? 's' : ''} disponível${remainingCount !== 1 ? 'is' : ''} hoje`}
                    </span>
                  )}
                  <Button
                    onClick={handleGenerate}
                    disabled={!validateCurrentStep() || remainingCount === 0}
                  >
                    ✨ Gerar Atividade Completa
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  minHeight: '500px'
}

const progressStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px 0'
}

const progressStepStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const progressCircleStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: '600'
}

const progressLabelStyle = {
  fontSize: '12px',
  fontWeight: '500',
  whiteSpace: 'nowrap'
}

const progressLineStyle = {
  width: '60px',
  height: '2px',
  margin: '0 16px'
}

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const stepContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const stepTitleStyle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1F2937',
  margin: 0
}

const stepDescriptionStyle = {
  fontSize: '16px',
  color: '#6B7280',
  margin: 0,
  lineHeight: '1.5'
}

const selectFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '12px'
}

const selectLabelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '6px'
}

const selectInputStyle = {
  width: '100%',
  minHeight: '48px',
  padding: '0 44px 0 14px',
  border: '2px solid #D1D5DB',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  fontSize: '15px',
  fontWeight: '500',
  outline: 'none',
  cursor: 'pointer'
}

const multiSelectStyle = {
  marginTop: '12px',
  border: '2px solid #D1D5DB',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  overflow: 'hidden'
}

const multiSelectSummaryStyle = {
  minHeight: '48px',
  padding: '10px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  cursor: 'pointer',
  listStyle: 'none'
}

const multiSelectValueStyle = {
  display: 'block',
  color: '#1F2937',
  fontSize: '15px',
  fontWeight: '500',
  lineHeight: 1.35
}

const multiSelectArrowStyle = {
  color: '#6B7280',
  fontSize: '18px',
  flexShrink: 0
}

const multiSelectOptionsStyle = {
  display: 'grid',
  gap: '8px',
  padding: '12px',
  backgroundColor: '#F9FAFB',
  borderTop: '1px solid #E5E7EB'
}

const multiSelectOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minHeight: '42px',
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer'
}

const multiSelectCheckboxStyle = {
  width: '16px',
  height: '16px',
  flexShrink: 0
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px',
  marginTop: '16px'
}

const optionButtonStyle = {
  padding: '12px 16px',
  border: '2px solid #E5E7EB',
  borderRadius: '8px',
  backgroundColor: '#F3F4F6',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center'
}

const steamGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '12px',
  marginTop: '16px'
}

const steamButtonStyle = {
  padding: '16px',
  borderRadius: '12px',
  border: '2px solid',
  backgroundColor: '#F3F4F6',
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  fontWeight: '500'
}

const steamIconStyle = {
  fontSize: '24px'
}

const steamLabelStyle = {
  textAlign: 'center'
}

const makerNoteStyle = {
  marginTop: '16px',
  padding: '12px',
  backgroundColor: '#FEF3C7',
  border: '1px solid #F59E0B',
  borderRadius: '8px',
  color: '#92400E',
  fontSize: '14px',
  textAlign: 'center'
}

const steamSuggestionBoxStyle = {
  marginTop: '0.75rem',
  padding: '12px 14px',
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '10px'
}

const steamSuggestionHeaderStyle = {
  fontSize: '0.78rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#374151'
}

const steamSuggestionItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '8px 10px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderLeft: '4px solid',
  borderRadius: '6px'
}

const applySuggestionButtonStyle = {
  marginTop: '10px',
  padding: '8px 14px',
  backgroundColor: '#4F46E5',
  border: 'none',
  borderRadius: '20px',
  color: '#FFFFFF',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit'
}

const recommendedBadgeStyle = {
  fontSize: '0.68rem',
  fontWeight: 700,
  color: '#92400E',
  backgroundColor: '#FEF3C7',
  border: '1px solid #F59E0B',
  borderRadius: '10px',
  padding: '2px 8px',
  whiteSpace: 'nowrap'
}

const errorStyle = {
  padding: '12px',
  backgroundColor: '#FEE2E2',
  border: '1px solid #F87171',
  borderRadius: '8px',
  color: '#DC2626',
  fontSize: '14px',
  textAlign: 'center'
}

const actionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '24px',
  borderTop: '1px solid #E5E7EB'
}

const spacerStyle = {
  flex: 1
}

const previewSectionStyle = {
  padding: '16px',
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  border: '1px solid #E5E7EB'
}

const previewSubtitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0 0 12px 0'
}

const previewListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const previewItemStyle = {
  padding: '10px 12px',
  backgroundColor: 'white',
  borderRadius: '6px',
  border: '1px solid #E5E7EB',
  fontSize: '14px',
  color: '#374151'
}

const previewBadgeStyle = {
  display: 'inline-block',
  padding: '4px 12px',
  backgroundColor: '#DBEAFE',
  color: '#1E40AF',
  borderRadius: '4px',
  fontWeight: '500',
  fontSize: '12px'
}

const previewHintStyle = {
  fontSize: '13px',
  color: '#6B7280',
  marginTop: '8px',
  fontStyle: 'italic'
}

const personalizationGroupStyle = {
  padding: '16px',
  backgroundColor: '#F9FAFB',
  borderRadius: '10px',
  border: '1px solid #E5E7EB'
}

const personalizationGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '10px'
}

const personalizationButtonStyle = {
  padding: '12px',
  border: '2px solid #E5E7EB',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  color: '#374151',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  textAlign: 'left',
  lineHeight: 1.35,
  transition: 'all 0.2s ease'
}

const classesInputContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  marginTop: '16px'
}

const classesInputFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const classesLabelStyle = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151'
}

const classesNumberInputStyle = {
  padding: '12px 16px',
  border: '2px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '500',
  color: '#1F2937',
  transition: 'border-color 0.2s ease',
  outline: 'none'
}

const classesSuggestionsStyle = {
  padding: '16px',
  backgroundColor: '#F0F9FF',
  border: '1px solid #BFDBFE',
  borderRadius: '8px'
}

const classesQuickSelectStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '8px',
  marginTop: '12px'
}

const classesQuickButtonStyle = {
  padding: '10px 12px',
  border: '2px solid #E5E7EB',
  borderRadius: '8px',
  backgroundColor: '#F3F4F6',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '460px',
  gap: '1.5rem',
  padding: '2rem 1rem'
}

const loadingSpinnerWrapStyle = {
  position: 'relative',
  width: '72px',
  height: '72px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const loadingRingStyle = {
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  border: '3px solid #E5E7EB',
  borderTopColor: '#4F46E5',
  animation: 'spin 1s linear infinite'
}

const loadingIconStyle = {
  fontSize: '1.75rem',
  zIndex: 1
}

const loadingTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#1F2937',
  textAlign: 'center'
}

const loadingSubtitleStyle = {
  fontSize: '0.9rem',
  color: '#6B7280',
  textAlign: 'center',
  maxWidth: '380px',
  lineHeight: 1.6,
  margin: 0
}

const loadingProviderBoxStyle = {
  width: '100%',
  maxWidth: '420px',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '10px',
  padding: '1rem'
}

const loadingProviderLabelStyle = {
  fontSize: '0.7rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#9CA3AF',
  marginBottom: '0.75rem'
}

const loadingProviderListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
}

const loadingProviderItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.65rem 0.85rem',
  background: '#FFFFFF',
  borderRadius: '8px',
  border: '1.5px solid'
}

const loadingProviderBadgeStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: '500',
  fontSize: '0.9rem',
  flexShrink: 0
}

const loadingProviderInfoStyle = {
  flex: 1,
  minWidth: 0
}

const loadingProviderNameStyle = {
  fontSize: '0.88rem',
  fontWeight: '500',
  color: '#1F2937'
}

const loadingProviderRoleStyle = {
  fontSize: '0.75rem',
  color: '#6B7280',
  marginTop: '1px'
}

const loadingProviderDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
  animation: 'pulse 1.5s ease-in-out infinite'
}

const loadingParamsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  justifyContent: 'center',
  maxWidth: '420px'
}

const loadingParamChipStyle = {
  display: 'inline-block',
  padding: '0.25rem 0.65rem',
  background: '#EFF6FF',
  color: '#1D4ED8',
  border: '1px solid #BFDBFE',
  borderRadius: '20px',
  fontSize: '0.78rem',
  fontWeight: '500'
}

export default PedagogicalPlannerModal
