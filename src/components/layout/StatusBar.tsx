import { useRobot } from '../../hooks/useRobot'
import type { ConnectionState } from '../../types/robot'
import './layout.css'

const DOT_LABEL: Record<ConnectionState, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  error: 'Connection error',
}

export function StatusBar() {
  const { connection, clock, simulated } = useRobot()
  return (
    <footer className="statusbar">
      <span
        className={`statusbar__dot statusbar__dot--${connection.state}`}
        role="img"
        aria-label={DOT_LABEL[connection.state]}
      />
      <span className="statusbar__url">{connection.url}</span>
      <span>{connection.latencyMs === null ? 'LATENCY —' : `LATENCY ${connection.latencyMs} ms`}</span>
      <span>FIXED FRAME {connection.fixedFrame}</span>
      <div className="statusbar__end">
        {simulated && <span className="statusbar__sim">SIMULATED DATA</span>}
        <span>ROS 2 {connection.rosDistro}</span>
        <span className="statusbar__time">{clock.toISOString().slice(11, 19)} UTC</span>
      </div>
    </footer>
  )
}
