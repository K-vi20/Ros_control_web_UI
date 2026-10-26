import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Square, type LucideIcon } from 'lucide-react'
import { useRobot } from '../../hooks/useRobot'
import { SectionHeading } from '../ui/Panel'
import './robot-control.css'

type Direction = 'forward' | 'reverse' | 'left' | 'right'

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'forward',
  ArrowDown: 'reverse',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const isTextEntry = (target: EventTarget | null) =>
  target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)

/**
 * Hold-to-drive control. Motion only happens while a key / button is held and the operator
 * has explicitly enabled manual override; releasing, losing focus or hitting E-stop zeroes it.
 * In this build the command only updates simulated state — no /cmd_vel is published.
 */
export function ManualControl() {
  const { manualOverride, setManualOverride, estopEngaged, setLinearVelocity, teleopSpeedLimit } = useRobot()
  const [pressed, setPressed] = useState<Direction | null>(null)
  const active = manualOverride && !estopEngaged

  const press = useCallback(
    (direction: Direction) => {
      if (!active) return
      setPressed(direction)
      setLinearVelocity(direction === 'forward' ? teleopSpeedLimit : direction === 'reverse' ? -teleopSpeedLimit : 0)
    },
    [active, setLinearVelocity, teleopSpeedLimit],
  )

  const release = useCallback(() => {
    setPressed(null)
    setLinearVelocity(0)
  }, [setLinearVelocity])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key]
      if (!direction || event.repeat || isTextEntry(event.target)) return
      event.preventDefault()
      press(direction)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (KEY_TO_DIRECTION[event.key]) release()
    }
    const onVisibility = () => document.hidden && release()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', onVisibility)
      setPressed(null)
    }
  }, [active, press, release])

  const drive = (direction: Direction, label: string, Icon: LucideIcon) => (
    <button
      type="button"
      className="dpad__key"
      aria-label={label}
      aria-pressed={pressed === direction}
      disabled={!active}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        press(direction)
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
    </button>
  )

  return (
    <div className="manual">
      <SectionHeading title="Manual control" meta="TELEOP" />
      <div className="manual__body">
        <div className="dpad">
          {drive('forward', 'Drive forward (hold)', ArrowUp)}
          <div className="dpad__row">
            {drive('left', 'Turn left (hold)', ArrowLeft)}
            <button type="button" className="dpad__key dpad__key--stop" aria-label="Stop" disabled={!active} onClick={release}>
              <Square size={10} strokeWidth={1.75} aria-hidden />
            </button>
            {drive('right', 'Turn right (hold)', ArrowRight)}
          </div>
          {drive('reverse', 'Drive in reverse (hold)', ArrowDown)}
        </div>
        <div className="manual__info">
          <span className="manual__limit">{teleopSpeedLimit.toFixed(2)} m/s</span>
          <p>Hold arrow keys to drive. Release to stop.</p>
          <button
            type="button"
            role="switch"
            aria-checked={manualOverride}
            disabled={estopEngaged}
            className={`manual__override${manualOverride ? ' manual__override--on' : ''}`}
            onClick={() => setManualOverride(!manualOverride)}
          >
            {manualOverride ? 'Manual override on' : 'Manual override off'}
          </button>
        </div>
      </div>
    </div>
  )
}
