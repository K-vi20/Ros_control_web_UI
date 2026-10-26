import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  variant?: 'default' | 'primary' | 'danger'
  block?: boolean
}

export function Button({ icon: Icon, variant = 'default', block, className, children, type = 'button', ...rest }: ButtonProps) {
  const classes = ['btn', variant !== 'default' && `btn--${variant}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden />}
      {children}
    </button>
  )
}
