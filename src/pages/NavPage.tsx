import { useState } from 'react'
import { Crosshair, Layers, Locate, Upload } from 'lucide-react'
import { ActivityLog } from '../components/layout/ActivityLog'
import { PageHeading } from '../components/layout/PageHeading'
import { NavigationPanel } from '../components/robot-control/NavigationPanel'
import { MapPanel, type MapTool, type MapToolDef } from '../components/visualization/MapPanel'
import { Button } from '../components/ui/Button'

const TOOLS: MapToolDef[] = [
  { id: 'pose', label: '2D pose estimate', icon: Locate },
  { id: 'goal', label: 'Set goal', icon: Crosshair },
]

export function NavPage() {
  const [tool, setTool] = useState<MapTool | null>('goal')

  return (
    <>
      <PageHeading
        title="Navigation"
        description="Configure the navigation stack, place a goal, and send your robot on its way."
        actions={
          <>
            <Button icon={Layers} aria-disabled="true" title="Map selection is not connected in this build">
              warehouse_l1
            </Button>
            <Button icon={Upload} aria-disabled="true" title="Loading a Nav2 config is not connected in this build">
              Load config
            </Button>
          </>
        }
      />
      <div className="workspace">
        <div className="workspace__grid workspace__grid--side-left">
          <NavigationPanel />
          <MapPanel tools={TOOLS} activeTool={tool} onToolChange={setTool} showGoal showRoute={false} />
        </div>
        <ActivityLog page="nav" />
      </div>
    </>
  )
}
