import type { PlanPoint, Pose } from '../types/robot'

/** Size of the floor-plan canvas, in canvas pixels (matches the Figma frame). */
export const PLAN_W = 920
export const PLAN_H = 480

/**
 * MOCK CALIBRATION.
 * The Figma floor plan is an illustration, not a metric map. These constants pin the
 * initial robot pose to its drawn position and assume a fixed scale so clicks on the
 * canvas can be turned into map-frame coordinates. Replace with the real
 * `nav_msgs/OccupancyGrid` info (resolution + origin) and the live `map` → `base_link`
 * transform when the ROS layer is connected.
 */
export const ROBOT_ANCHOR_WORLD = { x: 4.28, y: 2.16 }
export const ROBOT_ANCHOR_PLAN: PlanPoint = { px: 403, py: 238 }
export const PX_PER_M = 28.8

export function worldToPlan(x: number, y: number): PlanPoint {
  return {
    px: ROBOT_ANCHOR_PLAN.px + (x - ROBOT_ANCHOR_WORLD.x) * PX_PER_M,
    py: ROBOT_ANCHOR_PLAN.py - (y - ROBOT_ANCHOR_WORLD.y) * PX_PER_M,
  }
}

export function planToWorld(px: number, py: number): { x: number; y: number } {
  return {
    x: ROBOT_ANCHOR_WORLD.x + (px - ROBOT_ANCHOR_PLAN.px) / PX_PER_M,
    y: ROBOT_ANCHOR_WORLD.y - (py - ROBOT_ANCHOR_PLAN.py) / PX_PER_M,
  }
}

export function clamp(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeYaw(deg: number): number {
  const wrapped = ((deg % 360) + 360) % 360
  return wrapped > 180 ? wrapped - 360 : wrapped
}

/** Yaw (degrees, CCW from +X) of the vector from `a` to `b` on the canvas (screen Y points down). */
export function yawBetween(a: PlanPoint, b: PlanPoint): number {
  return normalizeYaw((Math.atan2(a.py - b.py, b.px - a.px) * 180) / Math.PI)
}

/** Rounded orthogonal path from the robot to a goal, for the mock planned-path layer. */
export function plannedPathD(from: PlanPoint, to: PlanPoint): string {
  const radius = 24
  const lift = 17
  const laneY = from.py - lift
  const dirX = to.px >= from.px ? 1 : -1
  const dirY = to.py <= laneY ? -1 : 1
  const turnX = to.px - dirX * radius
  const endY = to.py - dirY * 14
  return [
    `M ${from.px} ${from.py}`,
    `C ${from.px + dirX * 20} ${from.py} ${from.px + dirX * 25} ${laneY} ${from.px + dirX * 45} ${laneY}`,
    `L ${turnX} ${laneY}`,
    `Q ${to.px} ${laneY} ${to.px} ${laneY + dirY * radius}`,
    `L ${to.px} ${endY}`,
  ].join(' ')
}

export function distanceM(a: Pick<Pose, 'x' | 'y'>, b: Pick<Pose, 'x' | 'y'>): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
