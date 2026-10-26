import { useState } from 'react'
import { Layers, Locate, MapPinPlus, Save } from 'lucide-react'
import { ActivityLog } from '../components/layout/ActivityLog'
import { PageHeading } from '../components/layout/PageHeading'
import { WaypointPanel } from '../components/robot-control/WaypointPanel'
import { MapPanel, type MapTool, type MapToolDef } from '../components/visualization/MapPanel'
import { Button } from '../components/ui/Button'
import { useRobot } from '../hooks/useRobot'

const TOOLS: MapToolDef[] = [
  { id: 'pose', label: '2D pose estimate', icon: Locate },
  { id: 'waypoint', label: 'Add waypoint', icon: MapPinPlus },
]

export function WaypointPage() {
  const [tool, setTool] = useState<MapTool | null>('waypoint')
  const { saveRoute } = useRobot()

  return (
    <>
      <PageHeading
        title="Waypoint routes"
        description="Build repeatable missions with ordered waypoints and precise stop behavior."
        actions={
          <>
            <Button icon={Layers} aria-disabled="true" title="Map selection is not connected in this build">
              warehouse_l1
            </Button>
            <Button icon={Save} onClick={saveRoute}>
              Save route
            </Button>
          </>
        }
      />
      <div className="workspace">
        <div className="workspace__grid workspace__grid--side-left">
          <WaypointPanel />
          <MapPanel tools={TOOLS} activeTool={tool} onToolChange={setTool} showGoal={false} showRoute />
        </div>
        <ActivityLog page="waypoint" />
      </div>
    </>
  )
}
