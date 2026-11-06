// ============================================================
// PlannerSelectFields.jsx
// Menus suspensos do Planejador Pedagógico.
// ============================================================
//
// SelectField: escolha única (menu nativo).
// MultiSelectDropdown: escolha múltipla com caixas de seleção.
// Usados nas telas do planner e no perfil da turma.
// ============================================================

// variant: 'dark' quando o campo fica direto no fundo escuro da janela
// (rótulo claro); 'light' quando fica dentro de um cartão claro.
export function SelectField({ label, placeholder, value, options, onChange, variant = 'dark' }) {
  return (
    <label style={selectFieldStyle}>
      <span style={variant === 'light' ? selectLabelStyle : selectLabelOnDarkStyle}>{label}</span>
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

export function MultiSelectDropdown({ label, placeholder, options, selectedValues, onToggle, recommendedIds = [] }) {
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
                {option.label}
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

const selectFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '12px'
}

const selectLabelStyle = {
  display: 'block',
  fontSize: '15px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px'
}

const selectLabelOnDarkStyle = {
  ...selectLabelStyle,
  color: 'rgba(255, 255, 255, 0.88)'
}

const selectInputStyle = {
  width: '100%',
  minHeight: '48px',
  padding: '0 44px 0 14px',
  border: '2px solid #D1D5DB',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  fontSize: '16px',
  fontWeight: '500',
  fontFamily: 'inherit',
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
  fontSize: '16px',
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
  fontSize: '15px',
  fontWeight: '500',
  cursor: 'pointer'
}

const multiSelectCheckboxStyle = {
  width: '16px',
  height: '16px',
  flexShrink: 0,
  margin: '0 10px 0 0',
  verticalAlign: '-2px'
}

const recommendedBadgeStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#92400E',
  backgroundColor: '#FEF3C7',
  border: '1px solid #F59E0B',
  borderRadius: '10px',
  padding: '2px 8px',
  whiteSpace: 'nowrap'
}
