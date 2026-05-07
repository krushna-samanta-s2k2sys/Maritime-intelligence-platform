import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'

export default function AppShell() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      <TopNav />
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <Outlet />
      </div>
    </div>
  )
}
