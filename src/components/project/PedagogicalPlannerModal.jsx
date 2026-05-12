import { useState, useEffect } from 'react'
import { PedagogicalPlannerService } from '../../lib/ai/pedagogicalPlannerService.js'
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
  '1º ano - Ensino Fundamental',
  '2º ano - Ensino Fundamental',
  '3º ano - Ensino Fundamental',
  '4º ano - Ensino Fundamental',
  '5º ano - Ensino Fundamental',
  '6º ano - Ensino Fundamental',
  '7º ano - Ensino Fundamental',
  '8º ano - Ensino Fundamental',
  '9º ano - Ensino Fundamental',
  '1ª série - Ensino Médio',
  '2ª série - Ensino Médio',
  '3ª série - Ensino Médio'
]

const STEAM_COMPETENCIES = [
  { id: 'science', label: 'Ciência', icon: '🔬', color: '#10B981' },
  { id: 'technology', label: 'Tecnologia', icon: '💻', color: '#3B82F6' },
  { id: 'engineering', label: 'Engenharia', icon: '⚙️', color: '#F59E0B' },
  { id: 'arts', label: 'Artes', icon: '🎨', color: '#EF4444' },
  { id: 'mathematics', label: 'Matemática', icon: '🔢', color: '#8B5CF6' }
]

function PedagogicalPlannerModal({ isOpen, onClose, onActivityGenerated }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    discipline: '',
    grade: '',
    theme: '',
    steamCompetencies: [],
    numberOfClasses: ''
  })
  const [previewData, setPreviewData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setCurrentStep(0)
    setFormData({
      discipline: '',
      grade: '',
      theme: '',
      steamCompetencies: [],
      numberOfClasses: ''
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

  const handleNext = () => {
    if (currentStep === 3) {
      generatePreviewData()
    }
    if (currentStep < 4) {
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

    setIsGenerating(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // generatePedagogicalActivity já verifica o limite internamente
      const result = await PedagogicalPlannerService.generatePedagogicalActivity({
        ...formData,
        userId: user.id
      })

      // Chamar callback com resultado (não aguardado intencionalmente — salva em background)
      if (onActivityGenerated) {
        onActivityGenerated({
          ...result,
          formData
        })
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

  const steps = [
    { title: 'Disciplina', icon: '📚' },
    { title: 'Série', icon: '🎓' },
    { title: 'Tema', icon: '🎯' },
    { title: 'STEAM', icon: '🔬' },
    { title: 'Aulas', icon: '⏱️' },
    { title: 'Prévia', icon: '👁️' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎓 Planejador Pedagógico Inteligente" size="large">
      <div style={containerStyle}>
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

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!validateCurrentStep()}
            >
              Próximo →
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!validateCurrentStep() || isGenerating}
              loading={isGenerating}
            >
              {isGenerating ? 'Gerando Atividade...' : '✨ Gerar Atividade Completa'}
            </Button>
          )}
        </div>
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

export default PedagogicalPlannerModal