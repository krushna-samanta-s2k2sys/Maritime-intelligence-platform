import { STATUS_CLASSES } from '../../data/vessels'

export default function StatusBadge({ status, style }) {
  const cls = STATUS_CLASSES[status] || 'stI'
  return (
    <span className={`stBadge ${cls}`} style={style}>
      <span className="stDot"></span>{status}
    </span>
  )
}
