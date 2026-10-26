import { Bot, ChevronDown, Map, Navigation, Octagon, Route, Scan, type LucideIcon } from 'lucide-react'
import { useRobot } from '../../hooks/useRobot'
import type { ConnectionState, PageId } from '../../types/robot'
import { Button } from '../ui/Button'
import { StatusBadge, type BadgeTone } from '../ui/StatusBadge'
import './layout.css'

const TABS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'nav', label: 'Nav2', icon: Navigation },
  { id: 'waypoint', label: 'Waypoint', icon: Route },
]

const CONNECTION_BADGE: Record<ConnectionState, { label: string; tone: BadgeTone }> = {
  connected: { label: 'ROS 2 CONNECTED', tone: 'accent' },
  connecting: { label: 'CONNECTING', tone: 'warn' },
  disconnected: { label: 'DISCONNECTED', tone: 'neutral' },
  error: { label: 'CONNECTION ERROR', tone: 'danger' },
}

interface TopNavProps {
  page: PageId
  onPageChange: (page: PageId) => void
}

export function TopNav({ page, onPageChange }: TopNavProps) {
  const { connection, robot, estopEngaged, toggleEstop } = useRobot()
  const badge = CONNECTION_BADGE[connection.state]

  return (
    <header className="topnav">
      <div className="topnav__brand">
        <span className="topnav__symbol">
          <Scan size={21} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="topnav__name">orbit</span>
        <span className="topnav__product">ROS CONSOLE</span>
      </div>

      <nav className="topnav__tabs" role="tablist" aria-label="Workspace">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={page === id}
            aria-controls="workspace"
            className="topnav__tab"
            onClick={() => onPageChange(id)}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      <div className="topnav__robot">
        <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
        <button type="button" className="topnav__selector" aria-label={`Selected robot ${robot.id}`}>
          <Bot size={16} strokeWidth={1.75} aria-hidden />
          <span>{robot.id}</span>
          <ChevronDown size={12} strokeWidth={1.75} aria-hidden />
        </button>
        <span className="topnav__divider" aria-hidden />
        <Button
          variant="danger"
          icon={Octagon}
          aria-pressed={estopEngaged}
          onClick={toggleEstop}
          title="Software stop only. It does not replace the robot's hardware emergency stop."
        >
          {estopEngaged ? 'E-stop engaged' : 'Emergency stop'}
        </Button>
        <span className="topnav__avatar" aria-label="Operator AK">
          AK
        </span>
      </div>
    </header>
  )
}
