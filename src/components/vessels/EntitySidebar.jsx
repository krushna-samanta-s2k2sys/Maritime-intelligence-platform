import { useState } from 'react'
import { ENTITIES } from '../../data/entities'
import { getChangedFieldCount } from '../../data/vesselTimeline'

const ENTITY_GROUPS = [
  {
    key: 'general',
    label: 'General',
    entities: ['imo', 'flag', 'ais']
  },
  {
    key: 'build',
    label: 'Construction',
    entities: ['construction', 'dimensions']
  },
  {
    key: 'machinery',
    label: 'Machinery',
    entities: ['propulsion']
  },
  {
    key: 'ownership',
    label: 'Ownership & Management',
    entities: ['ownership', 'finance', 'crew']
  },
  {
    key: 'class',
    label: 'Classification',
    entities: ['class', 'certs']
  },
  {
    key: 'cargo',
    label: 'Cargo & Capacities',
    entities: ['cargo', 'safety']
  },
  {
    key: 'compliance',
    label: 'Compliance & Risk',
    entities: ['portcalls', 'inspections', 'incidents', 'sanctions']
  },
]

export default function EntitySidebar({ vessel, curDate, curEntity, onSelectEntity }) {
  if (!vessel) return null

  const [collapsed, setCollapsed] = useState({})
  const showChanges = curDate < '2024-01-30'
  const entMap = Object.fromEntries(ENTITIES.map(e => [e.key, e]))

  function toggleGroup(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="detSidebar">
      {ENTITY_GROUPS.map(grp => {
        const isCollapsed = !!collapsed[grp.key]
        const groupEntities = grp.entities.map(k => entMap[k]).filter(Boolean)
        const totalChanges = showChanges
          ? groupEntities.reduce((sum, e) => sum + getChangedFieldCount(vessel, e.key, curDate), 0)
          : 0
        const hasActive = groupEntities.some(e => e.key === curEntity)

        return (
          <div key={grp.key} className="detSbGrp">
            <div
              className={`detSbGrpHdr${hasActive ? ' hasActive' : ''}`}
              onClick={() => toggleGroup(grp.key)}
            >
              <span className="detSbGrpLabel">{grp.label}</span>
              {totalChanges > 0 && <span className="detSbChg">{totalChanges}</span>}
              <span className="detSbGrpArrow">{isCollapsed ? '▸' : '▾'}</span>
            </div>

            {!isCollapsed && groupEntities.map(e => {
              const chg      = showChanges ? getChangedFieldCount(vessel, e.key, curDate) : 0
              const isActive = e.key === curEntity
              return (
                <div
                  key={e.key}
                  className={`detSbItem${isActive ? ' on' : ''}`}
                  onClick={() => onSelectEntity(e.key)}
                >
                  <span className="detSbIcon">{e.icon}</span>
                  <span className="detSbLabel">{e.label}</span>
                  {e.cnt ? <span className="detSbCnt">{e.cnt}</span> : null}
                  {chg > 0 && <span className="detSbChg">+{chg}</span>}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
