import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  trailing?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function Panel({ title, trailing, className, bodyClassName, children }: PanelProps) {
  return (
    <section className={['panel', className].filter(Boolean).join(' ')} aria-label={title}>
      <header className="panel__heading">
        <h2 style={{ margin: 0, font: 'inherit' }}>{title}</h2>
        {trailing}
      </header>
      <div className={['panel__body', bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </section>
  )
}

export function SectionHeading({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="section-heading">
      <h3 style={{ margin: 0, font: 'inherit' }}>{title}</h3>
      {meta && <span className="section-heading__meta">{meta}</span>}
    </div>
  )
}
