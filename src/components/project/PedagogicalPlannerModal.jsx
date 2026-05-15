import { useState, useEffect } from 'react'
import { PedagogicalPlannerService } from '../../lib/ai/pedagogicalPlannerService.js'
import { AIProviderManager } from '../../lib/ai/AIProviderManager.js'
import { supabase } from '../../lib/supabaseClient.js'

import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import TextField from '../ui/TextField.jsx'

const DISCIPLINES = [
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Língua Portuguesa',
  'Inglês',
  'Artes',
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
  { id: 'arts', label: 'Artes', icon: '🎨', color: '#EF4444' },
  { id: 'mathematics', label: 'Matemática', icon: '🔢', color: '#8B5CF6' }
]

const PERSONALIZATION_OPTIONS = {
  detailLevel: {
    title: 'Nível de detalhamento',
    type: 'single',
    options: [
      { id: 'passo_a_passo', label: 'Passo a passo detalhado', instruction: 'Detalhar a execução em passos numerados, com ações claras para professor e alunos.' },
      { id: 'resumo_pratico', label: 'Resumo prático', instruction: 'Manter a atividade objetiva, com instruções diretas e sem excesso de texto.' },
      { id: 'roteiro_completo', label: 'Roteiro completo', instruction: 'Criar um roteiro completo, com preparação, condução, fechamento e possíveis intervenções.' }
    ]
  },
  materials: {
    title: 'Materiais',
    type: 'single',
    options: [
      { id: 'quantidade_grupo', label: 'Quantidade por grupo', instruction: 'Listar materiais com quantidade por grupo e, se necessário, quantidade total para a turma.' },
      { id: 'baixo_custo', label: 'Baixo custo/reutilizáveis', instruction: 'Priorizar materiais baratos, recicláveis, reutilizáveis e fáceis de encontrar em escolas públicas.' },
      { id: 'sem_eletronica', label: 'Sem eletrônica', instruction: 'Evitar materiais eletrônicos e propor alternativas analógicas ou de papelaria.' }
    ]
  },
  accessibility: {
    title: 'Acessibilidade',
    type: 'multi',
    options: [
      { id: 'daltonismo', label: 'Alternativas para daltonismo', instruction: 'Se houver uso de cores, incluir padrões, símbolos, etiquetas, texturas, furos ou marcações táteis.' },
      { id: 'baixa_visao', label: 'Baixa visão', instruction: 'Sugerir contraste alto, letras grandes, materiais com boa legibilidade e organização visual simples.' },
      { id: 'grupos_colaborativos', label: 'Grupos colaborativos', instruction: 'Organizar papéis nos grupos para incluir estudantes com diferentes ritmos e necessidades.' }
    ]
  },
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
  detailLevel: 'passo_a_passo',
  materials: 'quantidade_grupo',
  accessibility: ['daltonismo'],
  assessment: 'observacao'
}

function buildDefaultPersonalization(accessibilityPreset = []) {
  return {
    ...defaultPersonalization,
    accessibility: [...new Set([
      ...defaultPersonalization.accessibility,
      ...accessibilityPreset
    ])]
  }
}

function TipCard({ icon, title, text, color }) {
  return (
    <div style={{ padding: '0.8rem 1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderLeft: `3px solid ${color}`, borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.15rem', flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.28rem' }}>{title}</div>
        <div style={{ fontSize: '0.84rem', color: '#374151', lineHeight: 1.6 }}>{text}</div>
      </div>
    </div>
  )
}

function generateActivityTips(formData) {
  const steamNames = { science: 'Ciência', technology: 'Tecnologia', engineering: 'Engenharia', arts: 'Artes', mathematics: 'Matemática' }
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

  const accessMap = {
    daltonismo: 'use padrões visuais (listras, bolinhas) além de cores para diferenciar elementos',
    baixa_visao: 'instrua com fontes grandes e alto contraste nos materiais impressos',
    grupos_colaborativos: 'defina papéis claros nos grupos (construtor, testador, registrador, apresentador)'
  }
  const inclText = formData.personalization.accessibility.map(id => accessMap[id]).filter(Boolean).join('; ')

  return [
    { icon: '⚡', title: 'Dica STEAM', color: '#4F46E5', text: steamText + ' A combinação dessas áreas cria conexões interdisciplinares que tornam o aprendizado mais significativo.' },
    { icon: '🔨', title: 'Cultura Maker', color: '#10B981', text: 'A Cultura Maker aparece quando os alunos constroem, testam e melhoram seus protótipos. O erro faz parte do processo — cada tentativa ensina mais do que qualquer explicação.' },
    { icon: '📋', title: 'Competências BNCC', color: '#8B5CF6', text: `Para o ${formData.grade || 'Ensino Fundamental'}, esta atividade desenvolve pensamento científico, criatividade, comunicação, colaboração e uso de tecnologias — competências gerais da BNCC presentes em todas as áreas do conhecimento.` },
    { icon: '🔧', title: 'Como adaptar', color: '#F59E0B', text: 'Sem laboratório? Sem problema. Papelão, recicláveis, palitos e cola são suficientes para prototipagem. Para aulas mais curtas, reduza o ciclo para 1 construção + 1 teste + 1 melhoria.' },
    { icon: '🎨', title: 'Dica Criativa', color: '#EC4899', text: 'Apresente o problema como uma missão: "vocês são engenheiros(as) responsáveis por resolver...". Isso aumenta o engajamento e dá propósito real à atividade.' },
    { icon: '♿', title: 'Inclusão', color: '#06B6D4', text: inclText ? `Para esta turma: ${inclText}. Adaptar beneficia todos — não apenas quem tem necessidades específicas.` : 'Papéis complementares nos grupos garantem participação ativa de todos, independente do ritmo ou perfil de aprendizado.' }
  ]
}

function PedagogicalPlannerModal({ isOpen, onClose, onActivityGenerated, accessibilityPreset = [] }) {
  const accessibilityPresetKey = accessibilityPreset.join('|')
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    discipline: '',
    grade: '',
    theme: '',
    steamCompetencies: [],
    numberOfClasses: '',
    personalization: buildDefaultPersonalization(accessibilityPreset),
    manualInstructions: ''
  })
  const [previewData, setPreviewData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeProviders, setActiveProviders] = useState([])
  const [usedProvider, setUsedProvider] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, accessibilityPresetKey])

  const resetForm = () => {
    setCurrentStep(0)
    setFormData({
      discipline: '',
      grade: '',
      theme: '',
      steamCompetencies: [],
      numberOfClasses: '',
      personalization: buildDefaultPersonalization(accessibilityPreset),
      manualInstructions: ''
    })
    setPreviewData(null)
    setError('')
  }

  const generatePreviewData = () => {
    const bnccMap = {
      '6º ano - Ensino Fundamental': ['EF06CI01', 'EF06MA01', 'EF06LP01', 'EF06AR01'],
      '7º ano - Ensino Fundamental': ['EF07CI01', 'EF07MA01', 'EF07LP01', 'EF07AR01'],
      '8º ano - Ensino Fundamental': ['EF08CI01', 'EF08MA01', 'EF08LP01', 'EF08AR01'],
      '9º ano - Ensino Fundamental': ['EF09CI01', 'EF09MA01', 'EF09LP01', 'EF09AR01']
    }

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
      bnccCodes: bnccMap[formData.grade] || [],
      studentBenefits: [...new Set(selectedBenefits)],
      makerElements: ['🔨 Prototipagem prática', '🔄 Ciclos de iteração', '🧠 Pensamento crítico', '👥 Trabalho colaborativo', '⚡ Aprendizagem mão na massa']
    })
  }

  const buildCustomInstructions = () => {
    const instructions = []
    Object.entries(PERSONALIZATION_OPTIONS).forEach(([groupId, group]) => {
      if (groupId === 'accessibility') return
      const selected = formData.personalization[groupId]
      const selectedIds = Array.isArray(selected) ? selected : [selected]
      group.options
        .filter((option) => selectedIds.includes(option.id))
        .forEach((option) => instructions.push(`- ${option.instruction}`))
    })

    if (formData.manualInstructions.trim()) {
      instructions.push(`- Solicitação adicional do professor: ${formData.manualInstructions.trim()}`)
    }

    return instructions.join('\n')
  }

  const handleNext = () => {
    if (currentStep === 5) {
      generatePreviewData()
    }
    if (currentStep < 6) {
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

  const handleSteamCompetencyToggle = (competencyId) => {
    setFormData(prev => ({
      ...prev,
      steamCompetencies: prev.steamCompetencies.includes(competencyId)
        ? prev.steamCompetencies.filter(id => id !== competencyId)
        : [...prev.steamCompetencies, competencyId]
    }))
    setError('')
  }

  const handleNumberOfClassesChange = (value) => {
    setFormData(prev => ({ ...prev, numberOfClasses: value }))
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

  const handleManualInstructionsChange = (manualInstructions) => {
    setFormData(prev => ({ ...prev, manualInstructions }))
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
        return formData.steamCompetencies.length > 0
      case 4:
        return formData.numberOfClasses !== '' && parseInt(formData.numberOfClasses) > 0
      case 5:
        return formData.personalization.accessibility.length > 0
      case 6:
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
    setIsGenerating(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const result = await PedagogicalPlannerService.generatePedagogicalActivity({
        ...formData,
        customInstructions: buildCustomInstructions(),
        userId: user.id
      })

      setUsedProvider(result.provider || providers[0] || 'gemini')

      if (onActivityGenerated) {
        onActivityGenerated({ ...result, formData })
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
            <div style={gridStyle}>
              {DISCIPLINES.map(discipline => (
                <button
                  key={discipline}
                  type="button"
                  style={{
                    ...optionButtonStyle,
                    backgroundColor: formData.discipline === discipline ? '#3B82F6' : '#F3F4F6',
                    color: formData.discipline === discipline ? 'white' : '#374151'
                  }}
                  onClick={() => handleDisciplineSelect(discipline)}
                >
                  {discipline}
                </button>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>🎓 Qual série/ano?</h3>
            <p style={stepDescriptionStyle}>
              Selecione a série ou ano escolar apropriado.
            </p>
            <div style={gridStyle}>
              {GRADES.map(grade => (
                <button
                  key={grade}
                  type="button"
                  style={{
                    ...optionButtonStyle,
                    backgroundColor: formData.grade === grade ? '#3B82F6' : '#F3F4F6',
                    color: formData.grade === grade ? 'white' : '#374151'
                  }}
                  onClick={() => handleGradeSelect(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>🎯 Qual tema central?</h3>
            <p style={stepDescriptionStyle}>
              Descreva o tema principal da atividade (mínimo 3 caracteres).
            </p>
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

      case 3:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>🔬 Competências STEAM</h3>
            <p style={stepDescriptionStyle}>
              Selecione as competências STEAM que deseja utilizar. A Cultura Maker será incluída automaticamente.
            </p>
            <div style={steamGridStyle}>
              {STEAM_COMPETENCIES.map(competency => (
                <button
                  key={competency.id}
                  type="button"
                  style={{
                    ...steamButtonStyle,
                    backgroundColor: formData.steamCompetencies.includes(competency.id)
                      ? competency.color
                      : '#F3F4F6',
                    color: formData.steamCompetencies.includes(competency.id)
                      ? 'white'
                      : '#374151',
                    border: `2px solid ${competency.color}`
                  }}
                  onClick={() => handleSteamCompetencyToggle(competency.id)}
                >
                  <span style={steamIconStyle}>{competency.icon}</span>
                  <span style={steamLabelStyle}>{competency.label}</span>
                </button>
              ))}
            </div>
            <div style={makerNoteStyle}>
              🔧 <strong>Cultura Maker</strong> será incluída automaticamente em todas as atividades
            </div>
          </div>
        )

      case 4:
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
                <p style={stepDescriptionStyle}>Sugestões rápidas:</p>
                <div style={classesQuickSelectStyle}>
                  {[1, 2, 3, 5, 8, 10].map(num => (
                    <button
                      key={num}
                      type="button"
                      style={{
                        ...classesQuickButtonStyle,
                        backgroundColor: formData.numberOfClasses === String(num) ? '#3B82F6' : '#F3F4F6',
                        color: formData.numberOfClasses === String(num) ? 'white' : '#374151'
                      }}
                      onClick={() => handleNumberOfClassesChange(String(num))}
                    >
                      {num} aula{num > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div style={stepContentStyle}>
            <h3 style={stepTitleStyle}>⚙️ Como você quer personalizar?</h3>
            <p style={stepDescriptionStyle}>
              Escolha as opções que melhor combinam com sua turma. Se faltar algo, escreva uma orientação extra no final.
            </p>

            {Object.entries(PERSONALIZATION_OPTIONS).map(([groupId, group]) => (
              <div key={groupId} style={personalizationGroupStyle}>
                <h4 style={previewSubtitleStyle}>{group.title}</h4>
                <div style={personalizationGridStyle}>
                  {group.options.map((option) => {
                    const selected = formData.personalization[groupId]
                    const isSelected = Array.isArray(selected)
                      ? selected.includes(option.id)
                      : selected === option.id

                    return (
                      <button
                        key={option.id}
                        type="button"
                        style={{
                          ...personalizationButtonStyle,
                          backgroundColor: isSelected ? '#DBEAFE' : '#FFFFFF',
                          borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                          color: isSelected ? '#1E40AF' : '#374151'
                        }}
                        onClick={() => handlePersonalizationChange(groupId, option.id, group.type)}
                      >
                        {isSelected ? '✓ ' : ''}{option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div style={personalizationGroupStyle}>
              <h4 style={previewSubtitleStyle}>Pedido manual opcional</h4>
              <TextField
                placeholder="Ex.: A turma tem poucos materiais, prefiro grupos de 4 alunos, evite uso de celular..."
                value={formData.manualInstructions}
                onChange={handleManualInstructionsChange}
                multiline
                rows={3}
                fullWidth
              />
            </div>
          </div>
        )

      case 6:
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
                    {previewData.bnccCodes.map((code, idx) => (
                      <div key={idx} style={previewItemStyle}>
                        <span style={previewBadgeStyle}>{code}</span>
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
    if (step === 6) {
      const tips = generateActivityTips(formData)
      return (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9CA3AF', marginBottom: '0.6rem' }}>
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
        icon: '⚡',
        title: 'Sinergia STEAM',
        color: '#4F46E5',
        text: formData.steamCompetencies.length > 1
          ? `Combinar ${formData.steamCompetencies.length} áreas cria conexões interdisciplinares poderosas. Os alunos percebem que desafios reais exigem múltiplos olhares.`
          : 'Selecione mais áreas STEAM para criar conexões interdisciplinares mais ricas. A Cultura Maker estará presente automaticamente em toda a atividade.'
      },
      4: {
        icon: '🗓️',
        title: 'Jornada Maker',
        color: '#8B5CF6',
        text: `Com ${formData.numberOfClasses || '?'} aula(s) sugerimos: exploração do problema → investigação → construção → testes e ajustes → apresentação. Cada fase aprofunda o aprendizado progressivamente.`
      },
      5: { icon: '🎨', title: 'Design Universal', color: '#06B6D4', text: 'Adaptar uma atividade para diferentes perfis beneficia toda a turma. Recursos de acessibilidade tornam o aprendizado mais inclusivo, rico e diverso para todos os alunos.' }
    }

    const tip = byStep[step]
    return tip ? <TipCard {...tip} /> : null
  }

  const steps = [
    { title: 'Disciplina', icon: '📚' },
    { title: 'Série', icon: '🎓' },
    { title: 'Tema', icon: '🎯' },
    { title: 'STEAM', icon: '🔬' },
    { title: 'Aulas', icon: '⏱️' },
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

      <div style={loadingTitleStyle}>Gerando sua atividade</div>
      <p style={loadingSubtitleStyle}>
        Analisando o tema, selecionando competências BNCC e montando o planejamento completo…
      </p>

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

              {currentStep < 6 ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateCurrentStep()}
                >
                  Próximo →
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={!validateCurrentStep()}
                >
                  ✨ Gerar Atividade Completa
                </Button>
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
  fontWeight: 'bold'
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
  fontWeight: 'bold',
  color: '#1F2937',
  margin: 0
}

const stepDescriptionStyle = {
  fontSize: '16px',
  color: '#6B7280',
  margin: 0,
  lineHeight: '1.5'
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
  fontWeight: '600',
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
  fontWeight: '600',
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
  fontWeight: '600',
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
  fontWeight: '700',
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
  fontWeight: '700',
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
  fontWeight: '800',
  fontSize: '0.9rem',
  flexShrink: 0
}

const loadingProviderInfoStyle = {
  flex: 1,
  minWidth: 0
}

const loadingProviderNameStyle = {
  fontSize: '0.88rem',
  fontWeight: '600',
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
  fontWeight: '600'
}

export default PedagogicalPlannerModal
