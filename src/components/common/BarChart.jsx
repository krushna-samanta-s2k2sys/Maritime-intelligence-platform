export default function BarChart({ data }) {
  if (!data || !data.length) return null
  const max = Math.max(...data.map(d => d[1]))
  return (
    <div>
      {data.map(([label, value, color]) => (
        <div className="barRow" key={label}>
          <div className="barLbl">{label}</div>
          <div className="barTr">
            <div
              className="barFl"
              style={{ width: max > 0 ? (value / max * 100) + '%' : '0%', background: color || 'var(--blue)' }}
            />
          </div>
          <div className="barN">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        </div>
      ))}
    </div>
  )
}
