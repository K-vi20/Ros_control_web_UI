import { Bot } from 'lucide-react'
import { useRobot } from '../../hooks/useRobot'
import type { LocalizationState, RobotMode } from '../../types/robot'
import { formatNum } from '../../utils/format'
import { ManualControl } from '../robot-control/ManualControl'
import { Panel, SectionHeading } from '../ui/Panel'
import { StatusBadge, type BadgeTone } from '../ui/StatusBadge'
import './telemetry.css'

const MODE_TONE: Record<RobotMode, BadgeTone> = {
  IDLE: 'accent',
  TELEOP: 'warn',
  NAVIGATING: 'accent',
  STOPPED: 'danger',
}

const LOCALIZATION_LABEL: Record<LocalizationState, { text: string; tone: 'ok' | 'warn' | 'danger' }> = {
  converged: { text: 'Converged', tone: 'ok' },
  searching: { text: 'Searching', tone: 'warn' },
  lost: { text: 'Lost', tone: 'danger' },
}

function batteryTone(pct: number): 'ok' | 'warn' | 'danger' {
  if (pct >= 30) return 'ok'
  if (pct >= 15) return 'warn'
  return 'danger'
}

function Metric({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: string }) {
  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <span className="metric__reading">
        <span className={tone ? `tone--${tone}` : undefined}>{value}</span>
        <span className="metric__unit">{unit}</span>
      </span>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="telemetry-row">
      <span>{label}</span>
      <span className={tone ? `tone--${tone}` : 'tone--text'}>{value}</span>
    </div>
  )
}

export function RobotOverview() {
  const { robot, mode, batteryPct, linearVelocity, pose, health, connection } = useRobot()
  const localization = LOCALIZATION_LABEL[health.localization]
  const allNormal = health.localization === 'converged' && connection.state === 'connected'

  return (
    <Panel title="Robot overview" trailing={<StatusBadge tone={MODE_TONE[mode]}>{mode}</StatusBadge>} bodyClassName="telemetry">
      <div className="telemetry__identity">
        <span className="telemetry__icon">
          <Bot size={22} strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <div className="telemetry__name">{robot.id}</div>
          <div className="telemetry__model">{robot.model}</div>
        </div>
      </div>

      <div className="telemetry__metrics">
        <Metric label="Battery" value={String(Math.round(batteryPct))} unit="%" tone={batteryTone(batteryPct)} />
        <Metric label="Velocity" value={Math.abs(linearVelocity).toFixed(2)} unit="m/s" />
      </div>

      <div className="telemetry__section">
        <SectionHeading title="Robot pose" meta="map → base_link" />
        <div className="telemetry__pose">
          {[
            ['X', `${formatNum(pose.x)} m`],
            ['Y', `${formatNum(pose.y)} m`],
            ['Yaw', `${pose.yaw.toFixed(1)}°`],
          ].map(([axis, value]) => (
            <div key={axis}>
              <span>{axis}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="telemetry__section telemetry__section--rows">
        <SectionHeading title="System health" meta={allNormal ? 'ALL SYSTEMS NORMAL' : 'ATTENTION REQUIRED'} />
        <Row label="Localization" value={localization.text} tone={localization.tone} />
        <Row label="Lidar / scan" value={`${health.lidarHz.toFixed(1)} Hz`} />
        <Row label="Odometry / odom" value={`${health.odomHz.toFixed(1)} Hz`} />
        <Row label="CPU / temperature" value={`${health.cpuPct}% / ${health.temperatureC}°C`} />
      </div>

      <div className="divider" />

      <ManualControl />
    </Panel>
  )
}
