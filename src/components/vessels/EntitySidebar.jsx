import { ENTITIES } from '../../data/entities'
import { getChangedFieldCount } from '../../data/vesselTimeline'

export default function EntitySidebar({ vessel, curDate, curEntity, onSelectEntity }) {
  if (!vessel) return null

  const showChanges = curDate < '2024-01-30'

  return (
    <div className="detSidebar">
      <div className="detSbHead">Entities</div>
      {ENTITIES.map(e => {
        const chg = showChanges ? getChangedFieldCount(vessel, e.key, curDate) : 0
        return (
          <div
            key={e.key}
            className={'detSbItem' + (e.key === curEntity ? ' on' : '')}
            onClick={() => onSelectEntity(e.key)}
          >
            <div className="detSbDot" style={{ background: e.color }} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.label}
            </span>
            {e.cnt ? (
              <span className="detSbCnt">{e.cnt}</span>
            ) : null}
            {chg > 0 && (
              <span className="detSbChg">+{chg}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
