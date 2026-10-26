import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatNum, parseNum } from '../../utils/format'
import { clamp } from '../../utils/geometry'

interface NumberFieldProps {
  label: string
  value: number
  onCommit: (value: number) => void
  decimals?: number
  unit?: string
  min?: number
  max?: number
  disabled?: boolean
}

/** Text input that keeps a draft while typing and commits a validated number on blur / Enter. */
export function NumberField({ label, value, onCommit, decimals = 2, unit, min, max, disabled }: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const parsed = parseNum(draft)
    if (Number.isFinite(parsed)) onCommit(clamp(parsed, min, max))
    setDraft(null)
  }

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="input">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          value={draft ?? formatNum(value, decimals)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setDraft(null)
          }}
        />
        {unit && <span className="input__unit">{unit}</span>}
      </div>
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onCommit: (value: string) => void
}

export function TextField({ label, value, onCommit }: TextFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="input">
        <input id={id} value={value} onChange={(e) => onCommit(e.target.value)} autoComplete="off" />
      </div>
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="input">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="input__chevron" size={12} strokeWidth={1.75} aria-hidden />
      </div>
    </div>
  )
}
