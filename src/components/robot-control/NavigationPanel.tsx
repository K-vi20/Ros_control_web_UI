import { Eraser, MousePointer2, Play, SlidersHorizontal, X } from 'lucide-react'
import { GLOBAL_PLANNERS, LOCAL_CONTROLLERS } from '../../data/mockData'
import { useRobot } from '../../hooks/useRobot'
import type { GoalStatus } from '../../types/robot'
import { formatDuration, formatNum } from '../../utils/format'
import { Button } from '../ui/Button'
import { NumberField, SelectField } from '../ui/Fields'
import { Panel, SectionHeading } from '../ui/Panel'
import { StatusBadge } from '../ui/StatusBadge'
import './robot-control.css'

const GOAL_STATUS: Record<GoalStatus, { text: string; tone: string }> = {
  'no-goal': { text: 'NO GOAL SET', tone: 'dim' },
  ready: { text: 'READY TO NAVIGATE', tone: 'accent' },
  navigating: { text: 'NAVIGATING', tone: 'accent' },
  canceled: { text: 'GOAL CANCELED', tone: 'warn' },
}

export function NavigationPanel() {
  const {
    navConfig,
    updateNavConfig,
    goal,
    goalStatus,
    planSummary,
    updateGoal,
    startNavigation,
    cancelGoal,
    clearCostmaps,
    estopEngaged,
    connection,
  } = useRobot()

  const status = GOAL_STATUS[goalStatus]
  const navigating = goalStatus === 'navigating'
  const canStart = Boolean(goal) && !navigating && !estopEngaged && connection.state === 'connected'

  return (
    <Panel title="Navigation configuration" trailing={<SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />} bodyClassName="config">
      <div className="config__lifecycle">
        <span>NAV2 STACK</span>
        <StatusBadge tone="accent">ACTIVE</StatusBadge>
      </div>

      <SelectField
        label="Global planner"
        value={navConfig.globalPlanner}
        options={GLOBAL_PLANNERS}
        onChange={(globalPlanner) => updateNavConfig({ globalPlanner })}
      />
      <SelectField
        label="Local controller"
        value={navConfig.localController}
        options={LOCAL_CONTROLLERS}
        onChange={(localController) => updateNavConfig({ localController })}
      />

      <div className="field-row">
        <NumberField
          label="Max. linear velocity"
          value={navConfig.maxLinearVelocity}
          unit="m/s"
          min={0.05}
          max={1}
          onCommit={(maxLinearVelocity) => updateNavConfig({ maxLinearVelocity })}
        />
        <NumberField
          label="Goal tolerance"
          value={navConfig.goalTolerance}
          unit="m"
          min={0.05}
          max={2}
          onCommit={(goalTolerance) => updateNavConfig({ goalTolerance })}
        />
      </div>

      <div className="divider" />
      <SectionHeading title="Navigation goal" meta="FRAME: map" />

      <div className="field-row field-row--tight">
        <NumberField label="X position" value={goal?.x ?? 0} unit="m" onCommit={(x) => updateGoal({ x })} />
        <NumberField label="Y position" value={goal?.y ?? 0} unit="m" onCommit={(y) => updateGoal({ y })} />
        <NumberField label="Yaw" value={goal?.yaw ?? 0} decimals={1} unit="°" onCommit={(yaw) => updateGoal({ yaw })} />
      </div>

      <div className="config__tip">
        <MousePointer2 size={14} strokeWidth={1.75} aria-hidden />
        <span>Set coordinates or place a goal on the map.</span>
      </div>

      <div className="divider" />

      <div className="config__feedback">
        <div className="config__row">
          <span>Goal status</span>
          <strong className={`tone--${status.tone}`} role="status">
            {status.text}
          </strong>
        </div>
        <div className="config__row">
          <span>Planned distance / ETA</span>
          <strong className="tone--text">
            {goal && planSummary
              ? `${planSummary.distanceM.toFixed(1)} m / ~${formatDuration(planSummary.etaS)}`
              : `${formatNum(0, 1)} m / —`}
          </strong>
        </div>
      </div>

      <div className="config__actions">
        <Button variant="primary" icon={Play} block disabled={!canStart} onClick={startNavigation}>
          {navigating ? 'Navigating…' : 'Start navigation'}
        </Button>
        <div className="config__actions-row">
          <Button icon={X} disabled={!goal} onClick={cancelGoal}>
            Cancel goal
          </Button>
          <Button icon={Eraser} onClick={clearCostmaps}>
            Clear costmaps
          </Button>
        </div>
      </div>
    </Panel>
  )
}
