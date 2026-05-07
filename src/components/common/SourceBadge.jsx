import { srcBadgeClass, srcBadgeLabel } from '../../data/vessels'

export default function SourceBadge({ src }) {
  if (!src) return null
  return <span className={`src ${srcBadgeClass(src)}`}>{srcBadgeLabel(src)}</span>
}
