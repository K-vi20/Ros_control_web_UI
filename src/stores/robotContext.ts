import { createContext } from 'react'
import type {
  ConnectionInfo,
  GoalStatus,
  LogEvent,
  LogLevel,
  NavConfig,
  NavGoal,
  PageId,
  PlanSummary,
  Pose,
  RobotInfo,
  RobotMode,
  RouteConfig,
  RouteStatus,
  SystemHealth,
  Waypoint,
} from '../types/robot'

export interface RobotStore {
  /** True while every value comes from `data/mockData.ts` rather than a live robot. */
  simulated: boolean
  clock: Date
  connection: ConnectionInfo
  robot: RobotInfo
  mode: RobotMode
  batteryPct: number
  pose: Pose
  linearVelocity: number
  health: SystemHealth

  // Safety / manual control (software only — never a substitute for a hardware E-stop)
  estopEngaged: boolean
  toggleEstop: () => void
  manualOverride: boolean
  setManualOverride: (enabled: boolean) => void
  setLinearVelocity: (value: number) => void
  teleopSpeedLimit: number

  // Nav2
  navConfig: NavConfig
  updateNavConfig: (patch: Partial<NavConfig>) => void
  goal: NavGoal | null
  goalStatus: GoalStatus
  planSummary: PlanSummary | null
  placeGoal: (point: { x: number; y: number; yaw: number; px: number; py: number }) => void
  updateGoal: (patch: Partial<Pick<NavGoal, 'x' | 'y' | 'yaw'>>) => void
  startNavigation: () => void
  cancelGoal: () => void
  clearCostmaps: () => void
  setPoseEstimate: (pose: Pose) => void

  // Waypoint routes
  route: RouteConfig
  updateRoute: (patch: Partial<RouteConfig>) => void
  waypoints: Waypoint[]
  selectedWaypointId: string | null
  selectWaypoint: (id: string | null) => void
  addWaypoint: (point?: { x: number; y: number; px: number; py: number }) => void
  updateWaypoint: (id: string, patch: Partial<Pick<Waypoint, 'name' | 'x' | 'y' | 'waitS'>>) => void
  removeWaypoint: (id: string) => void
  moveWaypoint: (id: string, direction: -1 | 1) => void
  routeStatus: RouteStatus
  executeRoute: () => void
  stopRoute: () => void
  saveRoute: () => void

  logs: Record<PageId, LogEvent[]>
  pushLog: (page: PageId, level: LogLevel, message: string) => void
}

export const RobotContext = createContext<RobotStore | null>(null)
