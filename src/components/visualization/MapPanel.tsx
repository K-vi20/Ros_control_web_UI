import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { ArrowUp, Layers, LocateFixed, Map as MapIcon, Maximize, MousePointer2, Minus, Plus, type LucideIcon } from 'lucide-react'
import { useRobot } from '../../hooks/useRobot'
import { formatNum } from '../../utils/format'
import { PLAN_H, PLAN_W, clamp, planToWorld, plannedPathD, worldToPlan, yawBetween } from '../../utils/geometry'
import type { PlanPoint } from '../../types/robot'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { FloorPlan, type FloorPlanLayers, type PlanMarker } from './FloorPlan'
import './map.css'

export type MapTool = 'pose' | 'goal' | 'waypoint'

export interface MapToolDef {
  id: MapTool
  label: string
  icon: LucideIcon
}

interface MapPanelProps {
  tools: MapToolDef[]
  activeTool: MapTool | null
  onToolChange: (tool: MapTool | null) => void
  showGoal: boolean
  showRoute: boolean
}

const INSTRUCTIONS: Record<MapTool, string> = {
  pose: 'Click to set position. Drag to set orientation.',
  goal: 'Click to set position. Drag to set orientation.',
  waypoint: 'Click the map to add a waypoint.',
}

const LAYER_LABELS: { key: keyof FloorPlanLayers; label: string }[] = [
  { key: 'robot', label: 'Robot' },
  { key: 'path', label: 'Planned path' },
  { key: 'obstacles', label: 'Obstacles' },
  { key: 'lidar', label: 'Lidar scan' },
]

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const DRAG_THRESHOLD_PX = 8

interface DragState {
  start: PlanPoint
  yaw: number | null
}

export function MapPanel({ tools, activeTool, onToolChange, showGoal, showRoute }: MapPanelProps) {
  const { pose, goal, waypoints, selectedWaypointId, route, robot, setPoseEstimate, placeGoal, addWaypoint } = useRobot()

  const [layers, setLayers] = useState<FloorPlanLayers>({ robot: true, path: true, lidar: true, obstacles: true })
  const [layersOpen, setLayersOpen] = useState(false)
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [hover, setHover] = useState<PlanPoint | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  const planRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!layersOpen) return
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!layersRef.current?.contains(event.target as Node)) setLayersOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLayersOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [layersOpen])

  const robotPlan = useMemo(() => worldToPlan(pose.x, pose.y), [pose.x, pose.y])
  const robotMarker: PlanMarker = { ...robotPlan, yaw: pose.yaw }
  const pathD = goal ? plannedPathD(robotPlan, goal) : null

  const toPlanPoint = (event: PointerEvent): PlanPoint | null => {
    const rect = planRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    return {
      px: clamp(((event.clientX - rect.left) * PLAN_W) / rect.width, 0, PLAN_W),
      py: clamp(((event.clientY - rect.top) * PLAN_H) / rect.height, 0, PLAN_H),
    }
  }

  const onPointerDown = (event: PointerEvent) => {
    if (!activeTool || event.button !== 0) return
    const point = toPlanPoint(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ start: point, yaw: null })
  }

  const onPointerMove = (event: PointerEvent) => {
    const point = toPlanPoint(event)
    setHover(point)
    if (!drag || !point) return
    const moved = Math.hypot(point.px - drag.start.px, point.py - drag.start.py)
    setDrag({ start: drag.start, yaw: moved > DRAG_THRESHOLD_PX ? yawBetween(drag.start, point) : null })
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!drag || !activeTool) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    const { start, yaw } = drag
    setDrag(null)
    const world = planToWorld(start.px, start.py)
    if (activeTool === 'pose') setPoseEstimate({ ...world, yaw: yaw ?? pose.yaw })
    if (activeTool === 'goal') placeGoal({ ...world, yaw: yaw ?? goal?.yaw ?? 0, ...start })
    if (activeTool === 'waypoint') addWaypoint({ ...world, ...start })
  }

  const zoom = (delta: number) =>
    setView((v) => {
      const scale = clamp(v.scale + delta, MIN_SCALE, MAX_SCALE)
      return { ...v, scale }
    })

  const centerOnRobot = () =>
    setView((v) => ({ ...v, tx: -v.scale * (robotPlan.px - PLAN_W / 2), ty: -v.scale * (robotPlan.py - PLAN_H / 2) }))

  const cursor = hover ? planToWorld(hover.px, hover.py) : { x: pose.x, y: pose.y }
  const cursorLabel = hover ? 'CURSOR' : 'ROBOT'
  const theta = hover ? null : (pose.yaw * Math.PI) / 180

  const previewMarker: PlanMarker | null =
    drag && activeTool && activeTool !== 'waypoint' ? { ...drag.start, yaw: drag.yaw ?? (goal?.yaw ?? 0) } : null

  return (
    <section className="panel map" aria-label="Robot map">
      <header className="map__toolbar">
        <div className="map__identity">
          <MapIcon size={16} strokeWidth={1.75} aria-hidden />
          <strong>warehouse_l1</strong>
          <span>v2.4</span>
          <StatusBadge tone="accent">LIVE</StatusBadge>
        </div>

        <div className="map__tools">
          {tools.map(({ id, label, icon }) => (
            <Button
              key={id}
              icon={icon}
              variant={activeTool === id ? 'primary' : 'default'}
              aria-pressed={activeTool === id}
              onClick={() => onToolChange(activeTool === id ? null : id)}
            >
              {label}
            </Button>
          ))}
          <div className="map__layers" ref={layersRef}>
            <Button icon={Layers} aria-expanded={layersOpen} aria-haspopup="true" onClick={() => setLayersOpen((o) => !o)}>
              Layers
            </Button>
            {layersOpen && (
              <div className="map__layers-menu" role="group" aria-label="Map layers">
                {LAYER_LABELS.map(({ key, label }) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={(e) => setLayers((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="map__canvas">
        <svg className="map__grid" aria-hidden>
          <defs>
            <pattern id="metric-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#202a33" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#metric-grid)" />
        </svg>

        <div
          ref={planRef}
          className="map__plan"
          data-tool={activeTool ?? undefined}
          style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag(null)}
          onPointerLeave={() => setHover(null)}
        >
          <FloorPlan
            layers={layers}
            robot={robotMarker}
            robotId={robot.id}
            goal={showGoal ? goal : null}
            pathD={showGoal ? pathD : null}
            waypoints={
              showRoute
                ? waypoints.map((wp) => ({ id: wp.id, px: wp.px, py: wp.py, selected: wp.id === selectedWaypointId }))
                : undefined
            }
            closeLoop={showRoute && route.returnToFirst}
            preview={previewMarker}
          />
        </div>

        <div className="map__reference">
          <span className="map__reference-dot" aria-hidden />
          OCCUPANCY GRID · 0.05 m/px · MOCK
        </div>

        <div className="map__zoom" role="group" aria-label="Map view controls">
          <button type="button" aria-label="Zoom in" onClick={() => zoom(0.25)} disabled={view.scale >= MAX_SCALE}>
            <Plus size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoom(-0.25)} disabled={view.scale <= MIN_SCALE}>
            <Minus size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" aria-label="Fit map to view" onClick={() => setView({ scale: 1, tx: 0, ty: 0 })}>
            <Maximize size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" aria-label="Center on robot" onClick={centerOnRobot}>
            <LocateFixed size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="map__scale">
          <span className="map__scale-bar" aria-hidden />5 m
        </div>
        <div className="map__north">
          <ArrowUp size={16} strokeWidth={1.75} aria-hidden />N
        </div>

        {activeTool && (
          <div className="map__instruction" role="status">
            <MousePointer2 size={14} strokeWidth={1.75} aria-hidden />
            {INSTRUCTIONS[activeTool]}
          </div>
        )}
      </div>

      <footer className="map__legend">
        <ul>
          <li><i style={{ background: 'var(--accent)' }} />Robot</li>
          <li><i style={{ background: 'var(--accent)' }} />Planned path</li>
          <li><i style={{ background: 'var(--obstacle)' }} />Obstacles</li>
          <li><i style={{ background: 'var(--lidar)' }} />Lidar scan</li>
        </ul>
        <span className="map__coords" aria-live="off">
          <span className="visually-hidden">{cursorLabel}</span>
          {`X  ${formatNum(cursor.x)} m    Y  ${formatNum(cursor.y)} m`}
          {theta !== null && `    θ  ${formatNum(theta)} rad`}
        </span>
      </footer>
    </section>
  )
}
