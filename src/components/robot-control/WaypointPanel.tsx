import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleCheck, Ellipsis, GripVertical, Play, Plus, SlidersHorizontal, X } from 'lucide-react'
import { useRobot } from '../../hooks/useRobot'
import type { Waypoint } from '../../types/robot'
import { formatDuration, formatNum, twoDigits } from '../../utils/format'
import { distanceM } from '../../utils/geometry'
import { Button } from '../ui/Button'
import { NumberField, TextField } from '../ui/Fields'
import { Panel, SectionHeading } from '../ui/Panel'
import './robot-control.css'

interface RowProps {
  waypoint: Waypoint
  index: number
  total: number
  selected: boolean
  onSelect: () => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

function WaypointRow({ waypoint, index, total, selected, onSelect, onMove, onRemove }: RowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rowRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rowRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  return (
    <li ref={rowRef} className={`waypoint${selected ? ' waypoint--selected' : ''}`}>
      <button
        type="button"
        className="waypoint__select"
        aria-pressed={selected}
        aria-label={`Select waypoint ${twoDigits(index + 1)}, ${waypoint.name}`}
        onClick={onSelect}
      />
      <GripVertical className="waypoint__grip" size={12} strokeWidth={1.75} aria-hidden />
      <span className="waypoint__number">{twoDigits(index + 1)}</span>
      <div className="waypoint__details">
        <span className="waypoint__name">{waypoint.name}</span>
        <span className="waypoint__coords">
          {formatNum(waypoint.x)}, {formatNum(waypoint.y)} m
        </span>
      </div>
      <div className="waypoint__actions">
        <span>{waypoint.waitS} s</span>
        <button
          type="button"
          className="waypoint__menu-button"
          aria-label={`Actions for ${waypoint.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Ellipsis size={12} strokeWidth={1.75} aria-hidden />
        </button>
        {menuOpen && (
          <div className="waypoint__menu" role="menu">
            <button
              type="button"
              role="menuitem"
              disabled={index === 0}
              onClick={() => {
                setMenuOpen(false)
                onMove(-1)
              }}
            >
              Move up
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={index === total - 1}
              onClick={() => {
                setMenuOpen(false)
                onMove(1)
              }}
            >
              Move down
            </button>
            <button
              type="button"
              role="menuitem"
              className="waypoint__menu-danger"
              onClick={() => {
                setMenuOpen(false)
                onRemove()
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

export function WaypointPanel() {
  const {
    route,
    updateRoute,
    waypoints,
    selectedWaypointId,
    selectWaypoint,
    addWaypoint,
    removeWaypoint,
    moveWaypoint,
    routeStatus,
    executeRoute,
    stopRoute,
    pose,
    navConfig,
    estopEngaged,
    connection,
  } = useRobot()

  const summary = useMemo(() => {
    const stops = route.returnToFirst && waypoints.length > 1 ? [...waypoints, waypoints[0]] : waypoints
    let length = 0
    let previous: { x: number; y: number } = pose
    for (const stop of stops) {
      length += distanceM(previous, stop)
      previous = stop
    }
    const waits = waypoints.reduce((sum, wp) => sum + wp.waitS, 0)
    const cycleS = length / navConfig.maxLinearVelocity + waits
    return { length: length * route.repetitions, etaS: cycleS * route.repetitions }
  }, [navConfig.maxLinearVelocity, pose, route.repetitions, route.returnToFirst, waypoints])

  const running = routeStatus === 'running'
  const hasWaypoints = waypoints.length > 0
  const canExecute = hasWaypoints && !estopEngaged && connection.state === 'connected'

  return (
    <Panel title="Waypoint configuration" trailing={<SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />} bodyClassName="config config--route">
      <TextField label="Route name" value={route.name} onCommit={(name) => updateRoute({ name })} />

      <div className="field-row">
        <NumberField
          label="Default wait"
          value={route.defaultWaitS}
          decimals={0}
          unit="s"
          min={0}
          max={600}
          onCommit={(defaultWaitS) => updateRoute({ defaultWaitS })}
        />
        <NumberField
          label="Repetitions"
          value={route.repetitions}
          decimals={0}
          unit={route.repetitions === 1 ? 'cycle' : 'cycles'}
          min={1}
          max={99}
          onCommit={(repetitions) => updateRoute({ repetitions })}
        />
      </div>

      <div className="config__loop">
        <span id="loop-label">Return to first waypoint</span>
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={route.returnToFirst}
          aria-labelledby="loop-label"
          onClick={() => updateRoute({ returnToFirst: !route.returnToFirst })}
        />
      </div>

      <div className="divider" />
      <SectionHeading title="Waypoints" meta={`${twoDigits(waypoints.length)} POINTS`} />

      {hasWaypoints ? (
        <ol className="waypoints">
          {waypoints.map((waypoint, index) => (
            <WaypointRow
              key={waypoint.id}
              waypoint={waypoint}
              index={index}
              total={waypoints.length}
              selected={waypoint.id === selectedWaypointId}
              onSelect={() => selectWaypoint(waypoint.id === selectedWaypointId ? null : waypoint.id)}
              onMove={(direction) => moveWaypoint(waypoint.id, direction)}
              onRemove={() => removeWaypoint(waypoint.id)}
            />
          ))}
        </ol>
      ) : (
        <div className="config__tip">No waypoints yet. Add one below or click the map.</div>
      )}

      <Button icon={Plus} block onClick={() => addWaypoint()}>
        Add waypoint
      </Button>

      <div className="route-summary">
        <span>
          {summary.length.toFixed(1)} m · ~{formatDuration(summary.etaS)}
        </span>
        <span className={`route-summary__state ${hasWaypoints ? 'tone--ok' : 'tone--warn'}`}>
          {hasWaypoints && <CircleCheck size={12} strokeWidth={1.75} aria-hidden />}
          {hasWaypoints ? 'Validated' : 'No waypoints'}
        </span>
      </div>

      {running ? (
        <Button icon={X} block onClick={stopRoute}>
          Stop route
        </Button>
      ) : (
        <Button variant="primary" icon={Play} block disabled={!canExecute} onClick={executeRoute}>
          Execute route
        </Button>
      )}
    </Panel>
  )
}
