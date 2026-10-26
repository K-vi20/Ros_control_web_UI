import { useContext } from 'react'
import { RobotContext, type RobotStore } from '../stores/robotContext'

export function useRobot(): RobotStore {
  const store = useContext(RobotContext)
  if (!store) throw new Error('useRobot must be used inside <RobotProvider>')
  return store
}
