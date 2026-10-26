import type { ReactNode } from 'react'
import './layout.css'

interface PageHeadingProps {
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeading({ title, description, actions }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div className="page-heading__text">
        <div className="page-heading__title">
          <h1>{title}</h1>
          <span>WAREHOUSE / LEVEL 01</span>
        </div>
        <p>{description}</p>
      </div>
      <div className="page-heading__actions">{actions}</div>
    </div>
  )
}
