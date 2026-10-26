export type PageId = 'map' | 'nav' | 'waypoint'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

/** Pose in the `map` frame. Metres and degrees (counter-clockwise from +X, as in ROS). */
export interface Pose {
  x: number
  y: number
  yaw: number
}

/** Position on the 920×480 floor-plan canvas, in canvas pixels. */
export interface PlanPoint {
  px: number
  py: number
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface LogEvent {
  id: number
  time: string
  level: LogLevel
  message: string
}

export interface ConnectionInfo {
  state: ConnectionState
  url: string
  latencyMs: number | null
  fixedFrame: string
  rosDistro: string
}

export type RobotMode = 'IDLE' | 'TELEOP' | 'NAVIGATING' | 'STOPPED'

export interface RobotInfo {
  id: string
  model: string
}

export type LocalizationState = 'converged' | 'searching' | 'lost'

export interface SystemHealth {
  localization: LocalizationState
  lidarHz: number
  odomHz: number
  cpuPct: number
  temperatureC: number
}

export interface NavConfig {
  globalPlanner: string
  localController: string
  maxLinearVelocity: number
  goalTolerance: number
}

export interface NavGoal extends Pose, PlanPoint {}

export type GoalStatus = 'no-goal' | 'ready' | 'navigating' | 'canceled'

export interface PlanSummary {
  distanceM: number
  etaS: number
  poses: number
}

export interface Waypoint extends PlanPoint {
  id: string
  name: string
  x: number
  y: number
  waitS: number
}

export interface RouteConfig {
  name: string
  defaultWaitS: number
  repetitions: number
  returnToFirst: boolean
}

export type RouteStatus = 'idle' | 'running'
