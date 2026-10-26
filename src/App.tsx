import { useEffect, useState } from 'react'
import { StatusBar } from './components/layout/StatusBar'
import { TopNav } from './components/layout/TopNav'
import { MapPage } from './pages/MapPage'
import { NavPage } from './pages/NavPage'
import { WaypointPage } from './pages/WaypointPage'
import { RobotProvider } from './stores/RobotProvider'
import type { PageId } from './types/robot'

const PAGES: Record<PageId, () => React.JSX.Element> = {
  map: MapPage,
  nav: NavPage,
  waypoint: WaypointPage,
}

function pageFromHash(): PageId {
  const id = window.location.hash.replace('#/', '')
  return id in PAGES ? (id as PageId) : 'map'
}

export default function App() {
  const [page, setPage] = useState<PageId>(pageFromHash)

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const Page = PAGES[page]

  return (
    <RobotProvider>
      <div className="app">
        <TopNav page={page} onPageChange={(next) => (window.location.hash = `#/${next}`)} />
        <main id="workspace" role="tabpanel" aria-labelledby={`tab-${page}`} className="app__main">
          <Page />
        </main>
        <StatusBar />
      </div>
    </RobotProvider>
  )
}
