import StatusBadge from '../common/StatusBadge'

export default function VesselTable({ vessels, onOpen }) {
  if (!vessels || vessels.length === 0) {
    return <div className="empty">No vessels match your search criteria.</div>
  }

  return (
    <table className="vt">
      <thead>
        <tr>
          <th>Flag</th>
          <th>Name / IMO</th>
          <th>Type</th>
          <th>DWT</th>
          <th>GT</th>
          <th>Built</th>
          <th>LOA</th>
          <th>Owner</th>
          <th>Manager</th>
          <th>Class</th>
          <th>Status</th>
          <th>Updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {vessels.map(v => (
          <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(v.id)}>
            <td style={{ fontSize: 18 }}>{v.flag}</td>
            <td>
              <div className="vLnk">{v.nm}</div>
              <div className="mn" style={{ fontSize: 11 }}>{v.imo}</div>
              <div className="mn" style={{ fontSize: 9, color: 'var(--txt3)' }}>{v.mmsi}</div>
            </td>
            <td>
              <span className="tag tN" style={{ fontSize: 9 }}>{v.ty}</span>
            </td>
            <td className="mn" style={{ fontSize: 11 }}>{v.dwt}</td>
            <td className="mn" style={{ fontSize: 11 }}>{v.gt}</td>
            <td>{v.yr}</td>
            <td className="mn" style={{ fontSize: 11 }}>{v.loa}</td>
            <td style={{ fontSize: 11, fontWeight: 500 }}>{v.ow}</td>
            <td style={{ fontSize: 10, color: 'var(--txt3)' }}>{v.mg}</td>
            <td>
              <span className="tag tN" style={{ fontSize: 9 }}>{v.cls}</span>
            </td>
            <td>
              <StatusBadge status={v.st} />
            </td>
            <td className="mn" style={{ fontSize: 10, color: 'var(--txt3)' }}>{v.up}</td>
            <td style={{ display: 'flex', gap: 3, padding: '4px 10px' }} onClick={e => e.stopPropagation()}>
              <button
                className="pgBtn"
                style={{ fontSize: 10 }}
                title="View Detail"
                onClick={() => onOpen(v.id)}
              >👁</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
