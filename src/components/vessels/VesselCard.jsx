import { STATUS_CLASSES } from '../../data/vessels'

export default function VesselCard({ vessel }) {
  if (!vessel) return null
  const v = vessel
  const sc = STATUS_CLASSES[v.st] || 'stI'

  return (
    <div className="vCard">
      <div className="vCardFlag">{v.flag}</div>
      <div>
        <div className="vCardName">{v.nm}</div>
        <div className="vCardMeta">
          IMO {v.imo}&nbsp;&nbsp;·&nbsp;&nbsp;{v.ty}&nbsp;&nbsp;·&nbsp;&nbsp;{v.fn}&nbsp;&nbsp;·&nbsp;&nbsp;MMSI {v.mmsi}&nbsp;&nbsp;·&nbsp;&nbsp;{v.cs}
        </div>
      </div>
      <div className="vCardKPIs">
        <div className="kpiBox">
          <div className="kpiBoxV">{v.dwt}</div>
          <div className="kpiBoxL">DWT</div>
        </div>
        <div className="kpiBox">
          <div className="kpiBoxV">{v.gt}</div>
          <div className="kpiBoxL">GT</div>
        </div>
        <div className="kpiBox">
          <div className="kpiBoxV">{v.loa}</div>
          <div className="kpiBoxL">LOA</div>
        </div>
        <div className="kpiBox">
          <div className="kpiBoxV">{v.yr}</div>
          <div className="kpiBoxL">Built</div>
        </div>
        <span className={`stBadge ${sc}`} style={{ marginLeft: 4, padding: '4px 12px' }}>
          <span className="stDot"></span>{v.st}
        </span>
      </div>
    </div>
  )
}
