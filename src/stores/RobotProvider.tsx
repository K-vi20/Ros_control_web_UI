import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  INITIAL_LOGS,
  MOCK_BATTERY_PCT,
  MOCK_CONNECTION,
  MOCK_GOAL,
  MOCK_HEALTH,
  MOCK_NAV_CONFIG,
  MOCK_POSE,
  MOCK_ROBOT,
  MOCK_ROUTE,
  MOCK_WAYPOINTS,
  mockPlan,
} from '../data/mockData'
import type {
  GoalStatus,
  LogLevel,
  NavConfig,
  NavGoal,
  PageId,
  Pose,
  RobotMode,
  RouteConfig,
  RouteStatus,
  Waypoint,
} from '../types/robot'
import { formatNum, utcTime } from '../utils/format'
import { normalizeYaw, worldToPlan } from '../utils/geometry'
import { RobotContext, type RobotStore } from './robotContext'

const TELEOP_SPEED_LIMIT = 0.3
const MAX_LOG_ENTRIES = 50

/**
 * Application state for the console.
 *
 * Everything here is SIMULATED. To go live, replace the `useState` seeds with a rosbridge
 * client (connection state, /odom, /battery_state, /diagnostics, TF) and turn the Nav2 / waypoint
 * actions into action-client calls (NavigateToPose, FollowWaypoints). The component tree only
 * talks to `useRobot()`, so it does not need to change.
 */
export function RobotProvider({ children }: { children: ReactNode }) {
  const [clock, setClock] = useState(() => new Date())
  const [estopEngaged, setEstopEngaged] = useState(false)
  const [manualOverride, setManualOverrideState] = useState(false)
  const [linearVelocity, setLinearVelocityState] = useState(0)
  const [pose, setPose] = useState<Pose>(MOCK_POSE)
  const [navConfig, setNavConfig] = useState<NavConfig>(MOCK_NAV_CONFIG)
  const [goal, setGoal] = useState<NavGoal | null>(MOCK_GOAL)
  const [goalStatus, setGoalStatus] = useState<GoalStatus>('ready')
  const [route, setRoute] = useState<RouteConfig>(MOCK_ROUTE)
  const [waypoints, setWaypoints] = useState<Waypoint[]>(MOCK_WAYPOINTS)
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>('wp-2')
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')
  const [logs, setLogs] = useState(INITIAL_LOGS)

  const nextId = useRef(100)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const pushLog = useCallback((page: PageId, level: LogLevel, message: string) => {
    const entry = { id: nextId.current++, time: utcTime(), level, message }
    setLogs((prev) => ({ ...prev, [page]: [entry, ...prev[page]].slice(0, MAX_LOG_ENTRIES) }))
  }, [])

  const planSummary = useMemo(() => (goal ? mockPlan(pose, goal) : null), [goal, pose])

  const mode: RobotMode = estopEngaged
    ? 'STOPPED'
    : goalStatus === 'navigating' || routeStatus === 'running'
      ? 'NAVIGATING'
      : manualOverride && linearVelocity !== 0
        ? 'TELEOP'
        : 'IDLE'

  const toggleEstop = useCallback(() => {
    const next = !estopEngaged
    setEstopEngaged(next)
    if (next) {
      // Software stop: cancel everything we started and zero the commanded velocity.
      setLinearVelocityState(0)
      setManualOverrideState(false)
      setGoalStatus((s) => (s === 'navigating' ? 'canceled' : s))
      setRouteStatus('idle')
      pushLog('map', 'WARN', 'Software emergency stop engaged')
    } else {
      pushLog('map', 'INFO', 'Software emergency stop released')
    }
  }, [estopEngaged, pushLog])

  const setManualOverride = useCallback(
    (enabled: boolean) => {
      if (enabled && estopEngaged) return
      setManualOverrideState(enabled)
      if (!enabled) setLinearVelocityState(0)
      pushLog('map', 'INFO', `Manual override ${enabled ? 'enabled' : 'disabled'}`)
    },
    [estopEngaged, pushLog],
  )

  const setLinearVelocity = useCallback(
    (value: number) => {
      if (estopEngaged || !manualOverride) {
        setLinearVelocityState(0)
        return
      }
      setLinearVelocityState(Math.max(-TELEOP_SPEED_LIMIT, Math.min(TELEOP_SPEED_LIMIT, value)))
    },
    [estopEngaged, manualOverride],
  )

  const updateNavConfig = useCallback((patch: Partial<NavConfig>) => {
    setNavConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const placeGoal = useCallback(
    (point: { x: number; y: number; yaw: number; px: number; py: number }) => {
      setGoal(point)
      setGoalStatus('ready')
      pushLog('nav', 'INFO', `Goal set · x ${formatNum(point.x)} y ${formatNum(point.y)} yaw ${point.yaw.toFixed(1)}°`)
    },
    [pushLog],
  )

  const updateGoal = useCallback(
    (patch: Partial<Pick<NavGoal, 'x' | 'y' | 'yaw'>>) => {
      setGoal((prev) => {
        const base = prev ?? { x: pose.x, y: pose.y, yaw: 0, ...worldToPlan(pose.x, pose.y) }
        const next = { ...base, ...patch }
        if (patch.yaw !== undefined) next.yaw = normalizeYaw(patch.yaw)
        return { ...next, ...worldToPlan(next.x, next.y) }
      })
      setGoalStatus('ready')
    },
    [pose],
  )

  const startNavigation = useCallback(() => {
    if (estopEngaged || !goal || goalStatus === 'navigating') return
    setGoalStatus('navigating')
    pushLog('nav', 'INFO', 'Navigation requested (simulated)')
  }, [estopEngaged, goal, goalStatus, pushLog])

  const cancelGoal = useCallback(() => {
    setGoalStatus((status) => (status === 'navigating' ? 'canceled' : 'no-goal'))
    setGoal((current) => (goalStatus === 'navigating' ? current : null))
    pushLog('nav', 'WARN', 'Goal canceled')
  }, [goalStatus, pushLog])

  const clearCostmaps = useCallback(() => {
    pushLog('nav', 'INFO', 'Costmaps cleared (simulated)')
  }, [pushLog])

  const setPoseEstimate = useCallback(
    (next: Pose) => {
      setPose({ ...next, yaw: normalizeYaw(next.yaw) })
      pushLog('map', 'INFO', `2D pose estimate · x ${formatNum(next.x)} y ${formatNum(next.y)} yaw ${next.yaw.toFixed(1)}°`)
    },
    [pushLog],
  )

  const updateRoute = useCallback((patch: Partial<RouteConfig>) => {
    setRoute((prev) => ({ ...prev, ...patch }))
  }, [])

  const addWaypoint = useCallback(
    (point?: { x: number; y: number; px: number; py: number }) => {
      const id = `wp-${nextId.current++}`
      setWaypoints((prev) => {
        const base = point ?? { x: pose.x, y: pose.y, ...worldToPlan(pose.x, pose.y) }
        const name = `Waypoint ${String(prev.length + 1).padStart(2, '0')}`
        return [...prev, { id, name, waitS: route.defaultWaitS, ...base }]
      })
      setSelectedWaypointId(id)
      pushLog('waypoint', 'INFO', 'Waypoint added')
    },
    [pose, pushLog, route.defaultWaitS],
  )

  const updateWaypoint = useCallback(
    (id: string, patch: Partial<Pick<Waypoint, 'name' | 'x' | 'y' | 'waitS'>>) => {
      setWaypoints((prev) =>
        prev.map((wp) => {
          if (wp.id !== id) return wp
          const next = { ...wp, ...patch }
          return patch.x !== undefined || patch.y !== undefined ? { ...next, ...worldToPlan(next.x, next.y) } : next
        }),
      )
    },
    [],
  )

  const removeWaypoint = useCallback(
    (id: string) => {
      setWaypoints((prev) => prev.filter((wp) => wp.id !== id))
      setSelectedWaypointId((current) => (current === id ? null : current))
      pushLog('waypoint', 'INFO', 'Waypoint removed')
    },
    [pushLog],
  )

  const moveWaypoint = useCallback((id: string, direction: -1 | 1) => {
    setWaypoints((prev) => {
      const index = prev.findIndex((wp) => wp.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= prev.length) return prev
      const copy = [...prev]
      ;[copy[index], copy[target]] = [copy[target], copy[index]]
      return copy
    })
  }, [])

  const executeRoute = useCallback(() => {
    if (estopEngaged || waypoints.length === 0 || routeStatus === 'running') return
    setRouteStatus('running')
    pushLog('waypoint', 'INFO', `Route started (simulated) · ${route.name}`)
  }, [estopEngaged, pushLog, route.name, routeStatus, waypoints.length])

  const stopRoute = useCallback(() => {
    setRouteStatus('idle')
    pushLog('waypoint', 'WARN', 'Route stopped')
  }, [pushLog])

  const saveRoute = useCallback(() => {
    pushLog('waypoint', 'INFO', `Route saved locally · ${route.name}`)
  }, [pushLog, route.name])

  const store: RobotStore = {
    simulated: true,
    clock,
    connection: MOCK_CONNECTION,
    robot: MOCK_ROBOT,
    mode,
    batteryPct: MOCK_BATTERY_PCT,
    pose,
    linearVelocity,
    health: MOCK_HEALTH,
    estopEngaged,
    toggleEstop,
    manualOverride,
    setManualOverride,
    setLinearVelocity,
    teleopSpeedLimit: TELEOP_SPEED_LIMIT,
    navConfig,
    updateNavConfig,
    goal,
    goalStatus,
    planSummary,
    placeGoal,
    updateGoal,
    startNavigation,
    cancelGoal,
    clearCostmaps,
    setPoseEstimate,
    route,
    updateRoute,
    waypoints,
    selectedWaypointId,
    selectWaypoint: setSelectedWaypointId,
    addWaypoint,
    updateWaypoint,
    removeWaypoint,
    moveWaypoint,
    routeStatus,
    executeRoute,
    stopRoute,
    saveRoute,
    logs,
    pushLog,
  }

  return <RobotContext.Provider value={store}>{children}</RobotContext.Provider>
}
