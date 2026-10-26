import { Fragment, useMemo } from 'react'
import { PLAN_H, PLAN_W } from '../../utils/geometry'
import { twoDigits } from '../../utils/format'

export interface PlanMarker {
  px: number
  py: number
  yaw: number
}

export interface PlanWaypoint {
  id: string
  px: number
  py: number
  selected: boolean
}

export interface FloorPlanLayers {
  robot: boolean
  path: boolean
  lidar: boolean
  obstacles: boolean
}

interface FloorPlanProps {
  layers: FloorPlanLayers
  robot: PlanMarker
  robotId: string
  goal?: PlanMarker | null
  pathD?: string | null
  waypoints?: PlanWaypoint[]
  closeLoop?: boolean
  /** Ghost marker shown while the operator drags to choose an orientation. */
  preview?: PlanMarker | null
}

const RACK_X = [250, 350, 450, 550, 650]
const RACK_Y = [76, 285]
const RACK_W = 56
const RACK_H = 118

const WALL = '#6f8089'
const PARTITION = '#7a8b94'

/** MOCK lidar returns: dotted rows along the aisles, generated deterministically. */
function useLidarDots() {
  return useMemo(() => {
    const dots: [number, number][] = []
    for (let x = 222; x < 700; x += 14) {
      if (x % 100 > 8 && x % 100 < 90) dots.push([x, 64])
    }
    for (let x = 262; x < 700; x += 16) dots.push([x, 412])
    for (let y = 70; y < 410; y += 6) dots.push([203, y])
    for (let x = 230; x < 700; x += 7) {
      if (x % 100 > 15 && x % 100 < 82) dots.push([x, 214 + ((x * 7) % 3)])
    }
    return dots
  }, [])
}

function Rack({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0.5} y={0.5} width={RACK_W - 1} height={RACK_H - 1} fill="#36444f" stroke="#83939c" />
      <rect x={27} y={0} width={2} height={RACK_H} fill="#657781" />
      {[23, 47, 71, 95].map((shelf) => (
        <rect key={shelf} x={0} y={shelf} width={RACK_W} height={1} fill="#667681" />
      ))}
    </g>
  )
}

export function FloorPlan({ layers, robot, robotId, goal, pathD, waypoints, closeLoop, preview }: FloorPlanProps) {
  const lidarDots = useLidarDots()
  const route = waypoints ?? []
  const routePoints = route.map((wp) => `${wp.px},${wp.py}`)
  if (closeLoop && route.length > 1) routePoints.push(`${route[0].px},${route[0].py}`)

  return (
    <svg
      className="floorplan"
      width={PLAN_W}
      height={PLAN_H}
      viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
      role="img"
      aria-label="Occupancy map of warehouse_l1 showing the robot, storage racks and planned motion"
    >
      <defs>
        <marker id="route-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="#60dec5" />
        </marker>
      </defs>

      {layers.obstacles && (
        <g>
          <path
            d="M54 33 H186 V56 H796 V102 H841 V425 H733 V446 H216 V424 H54 V260 H31 V148 H54 Z"
            fill="#15222a"
            stroke={WALL}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <g fill="none" stroke={PARTITION} strokeWidth={2.5}>
            <rect x={81} y={60} width={90} height={117} />
            <rect x={81} y={288} width={90} height={104} />
            <path d="M53 260 H119 M155 260 H187" />
            <path d="M733 56 V180 M733 340 V386 M733 340 H773 M811 340 H841" />
          </g>
          {RACK_X.flatMap((x) => RACK_Y.map((y) => <Rack key={`${x}-${y}`} x={x} y={y} />))}
        </g>
      )}

      <g fontFamily="var(--font-mono)" fontSize={9} fill="#617281" textAnchor="middle">
        <text x={422} y={35}>STORAGE A</text>
        <text x={422} y={465}>STORAGE B</text>
        <text x={127} y={121}>UTILITY</text>
        <text x={115} y={339}>CHARGING</text>
        <text x={774} y={375}>LOADING</text>
      </g>

      {layers.lidar && (
        <g fill="#4b9c8d" opacity={0.85}>
          {lidarDots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={1.1} />
          ))}
        </g>
      )}

      {layers.path && pathD && goal && (
        <path d={pathD} fill="none" stroke="#60dec5" strokeWidth={2.5} strokeLinecap="round" />
      )}

      {route.length > 0 && (
        <g>
          <polyline
            points={routePoints.join(' ')}
            fill="none"
            stroke="#60dec5"
            strokeWidth={1.5}
            strokeDasharray="6 5"
            markerEnd="url(#route-arrow)"
          />
          {route.map((wp, index) => (
            <g key={wp.id} transform={`translate(${wp.px} ${wp.py})`}>
              <circle r={13} fill={wp.selected ? '#60dec5' : '#13191f'} stroke="#60dec5" strokeWidth={2} />
              <text
                textAnchor="middle"
                dy="3.5"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fontWeight={600}
                fill={wp.selected ? '#0c1014' : '#60dec5'}
              >
                {twoDigits(index + 1)}
              </text>
            </g>
          ))}
        </g>
      )}

      {goal && (
        <g transform={`translate(${goal.px} ${goal.py})`}>
          <circle r={14} fill="#60dec5" fillOpacity={0.12} stroke="#60dec5" strokeWidth={1.5} />
          <path d="M0 -8 L6 7 L0 3.5 L-6 7 Z" fill="#60dec5" transform={`rotate(${90 - goal.yaw})`} />
          <text
            x={22}
            y={-4}
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill="#60dec5"
          >
            GOAL
          </text>
        </g>
      )}

      {preview && (
        <g transform={`translate(${preview.px} ${preview.py})`} opacity={0.75}>
          <circle r={14} fill="none" stroke="#60dec5" strokeDasharray="3 3" />
          <path d="M0 -8 L6 7 L0 3.5 L-6 7 Z" fill="#60dec5" transform={`rotate(${90 - preview.yaw})`} />
        </g>
      )}

      {layers.robot && (
        <Fragment>
          <g transform={`translate(${robot.px} ${robot.py})`}>
            <circle r={38} fill="#60dec5" fillOpacity={0.07} stroke="#60dec5" strokeOpacity={0.35} />
            <circle r={18} fill="#13191f" stroke="#60dec5" strokeWidth={2} />
            <path d="M0 -8 L6 7 L0 3.5 L-6 7 Z" fill="#60dec5" transform={`rotate(${90 - robot.yaw})`} />
          </g>
          <g transform={`translate(${robot.px - 36} ${robot.py + 29})`}>
            <rect width={52} height={23} rx={4} fill="#0e141a" stroke="#29333d" />
            <text x={26} y={15} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={10} fill="#e8eef3">
              {robotId}
            </text>
          </g>
        </Fragment>
      )}
    </svg>
  )
}
