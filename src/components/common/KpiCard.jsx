export default function KpiCard({ v, l, delta, up, color }) {
  return (
    <div className="kpi" style={{'--kc': color}}>
      <div className="kpiV">{v}</div>
      <div className="kpiL">{l}</div>
      {delta && (
        <div className="kpiDelta">
          <span className={up === true ? 'kpiUp' : up === false ? 'kpiDn' : 'kpiNt'}>
            {up === true ? '▲' : up === false ? '▼' : '–'} {delta}
          </span>
        </div>
      )}
    </div>
  )
}
