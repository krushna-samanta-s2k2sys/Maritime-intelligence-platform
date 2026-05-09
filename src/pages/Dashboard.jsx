import DashboardGrid from '../components/dashboard/DashboardGrid'

export default function Dashboard() {
  return (
    <div className="main">
      <DashboardGrid />
      <div style={{height:20,flexShrink:0}} />
    </div>
  )
}
