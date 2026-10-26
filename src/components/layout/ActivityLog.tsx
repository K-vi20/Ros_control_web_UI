import { useState } from 'react'
import { ArrowUpRight, Terminal } from 'lucide-react'
import { useRobot } from '../../hooks/useRobot'
import type { PageId } from '../../types/robot'
import { Button } from '../ui/Button'
import './layout.css'

const LEVEL_CLASS = { INFO: 'log__level--info', WARN: 'log__level--warn', ERROR: 'log__level--error' } as const

export function ActivityLog({ page }: { page: PageId }) {
  const { logs, robot } = useRobot()
  const [expanded, setExpanded] = useState(false)
  const events = logs[page].slice(0, expanded ? 12 : 3)

  return (
    <section className={`panel activity${expanded ? ' activity--expanded' : ''}`} aria-label="Activity log">
      <div className="activity__title">
        <h2>
          <Terminal size={14} strokeWidth={1.75} aria-hidden />
          Activity log
        </h2>
        <span>/{robot.id.toLowerCase().replace('-', '_')} • LIVE</span>
      </div>
      <ol className="activity__events" aria-live="polite">
        {events.map((event) => (
          <li key={event.id}>
            <time>{event.time}</time>
            <span className={LEVEL_CLASS[event.level]}>{event.level}</span>
            <span className="activity__message">{event.message}</span>
          </li>
        ))}
      </ol>
      <Button icon={ArrowUpRight} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Show less' : 'View all logs'}
      </Button>
    </section>
  )
}
