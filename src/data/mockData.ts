import type {
  ConnectionInfo,
  LogEvent,
  NavConfig,
  NavGoal,
  PageId,
  PlanSummary,
  Pose,
  RobotInfo,
  RouteConfig,
  SystemHealth,
  Waypoint,
} from '../types/robot'

/**
 * SIMULATED DATA — values taken from the Figma design so the UI can be reviewed
 * without a robot. Nothing in this file comes from a live ROS 2 system.
 */

export const MOCK_CONNECTION: ConnectionInfo = {
  state: 'connected',
  url: import.meta.env.VITE_ROSBRIDGE_URL ?? 'ws://192.168.1.107:9090',
  latencyMs: 24,
  fixedFrame: 'map',
  rosDistro: 'HUMBLE',
}

export const MOCK_ROBOT: RobotInfo = {
  id: 'AMR-07',
  model: 'TurtleBot 4 · differential drive',
}

export const MOCK_POSE: Pose = { x: 4.28, y: 2.16, yaw: 48.1 }

export const MOCK_BATTERY_PCT = 84

export const MOCK_HEALTH: SystemHealth = {
  localization: 'converged',
  lidarHz: 10,
  odomHz: 50,
  cpuPct: 23,
  temperatureC: 42,
}

export const MOCK_NAV_CONFIG: NavConfig = {
  globalPlanner: 'NavFn / Dijkstra',
  localController: 'DWB Local Planner',
  maxLinearVelocity: 0.5,
  goalTolerance: 0.25,
}

/** Option lists are examples of Nav2 plugins; load the real ones from the robot's Nav2 params. */
export const GLOBAL_PLANNERS = ['NavFn / Dijkstra', 'NavFn / A*', 'Smac 2D', 'Smac Hybrid-A*']
export const LOCAL_CONTROLLERS = ['DWB Local Planner', 'Regulated Pure Pursuit', 'MPPI Controller']

export const MOCK_GOAL: NavGoal = { x: 12.6, y: 8.4, yaw: 90, px: 738, py: 140 }

export const MOCK_ROUTE: RouteConfig = {
  name: 'Morning inspection',
  defaultWaitS: 5,
  repetitions: 1,
  returnToFirst: false,
}

export const MOCK_WAYPOINTS: Waypoint[] = [
  { id: 'wp-1', name: 'Receiving bay', x: 1.2, y: 2.1, waitS: 2, px: 159, py: 222 },
  { id: 'wp-2', name: 'Storage aisle A', x: 6.2, y: 2.1, waitS: 5, px: 500, py: 222 },
  { id: 'wp-3', name: 'Inspection point', x: 12.6, y: 2.1, waitS: 5, px: 738, py: 222 },
  { id: 'wp-4', name: 'Loading dock', x: 12.6, y: -3.4, waitS: 2, px: 738, py: 388 },
]

/** Stand-in for the Nav2 planner result; the factor reproduces the figures in the design. */
export function mockPlan(from: Pose, to: Pick<Pose, 'x' | 'y'>): PlanSummary {
  const distanceM = (Math.abs(to.x - from.x) + Math.abs(to.y - from.y)) * 0.88
  return { distanceM, etaS: distanceM / 0.4, poses: Math.round(distanceM * 5) }
}

export const INITIAL_LOGS: Record<PageId, LogEvent[]> = {
  map: [
    { id: 1, time: '14:32:08', level: 'INFO', message: 'Map synchronized · warehouse_l1' },
    { id: 2, time: '14:32:06', level: 'INFO', message: 'AMCL localization converged' },
    { id: 3, time: '14:32:04', level: 'INFO', message: 'Robot connected · 192.168.1.107' },
  ],
  nav: [
    { id: 4, time: '14:32:08', level: 'INFO', message: 'Path computed · 12.8 m · 64 poses' },
    { id: 5, time: '14:32:06', level: 'INFO', message: 'Goal accepted by bt_navigator' },
    { id: 6, time: '14:32:04', level: 'INFO', message: 'Controller server activated' },
  ],
  waypoint: [
    { id: 7, time: '14:32:08', level: 'INFO', message: 'Route saved · Morning inspection' },
    { id: 8, time: '14:32:06', level: 'INFO', message: '4 waypoints validated · all reachable' },
    { id: 9, time: '14:32:04', level: 'INFO', message: 'Waypoint follower ready' },
  ],
}
