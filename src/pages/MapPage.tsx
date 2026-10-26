import { useState } from 'react'
import { Crosshair, Layers, Locate, Upload } from 'lucide-react'
import { ActivityLog } from '../components/layout/ActivityLog'
import { PageHeading } from '../components/layout/PageHeading'
import { MapPanel, type MapTool, type MapToolDef } from '../components/visualization/MapPanel'
import { RobotOverview } from '../components/telemetry/RobotOverview'
import { Button } from '../components/ui/Button'

const TOOLS: MapToolDef[] = [
  { id: 'pose', label: '2D pose estimate', icon: Locate },
  { id: 'goal', label: 'Set goal', icon: Crosshair },
]

export function MapPage() {
  const [tool, setTool] = useState<MapTool | null>(null)

  return (
    <>
      <PageHeading
        title="Map overview"
        description="Monitor your robot, inspect the environment, and keep every system in view."
        actions={
          <>
            <Button icon={Layers} aria-disabled="true" title="Map selection is not connected in this build">
              warehouse_l1
            </Button>
            <Button icon={Upload} aria-disabled="true" title="Map import is not connected in this build">
              Import map
            </Button>
          </>
        }
      />
      <div className="workspace">
        <div className="workspace__grid workspace__grid--side-right">
          <MapPanel tools={TOOLS} activeTool={tool} onToolChange={setTool} showGoal showRoute={false} />
          <RobotOverview />
        </div>
        <ActivityLog page="map" />
      </div>
    </>
  )
}
