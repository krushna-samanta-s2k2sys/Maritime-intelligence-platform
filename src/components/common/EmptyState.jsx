export default function EmptyState({ msg = 'No data available' }) {
  return <div className="empty">{msg}</div>
}
