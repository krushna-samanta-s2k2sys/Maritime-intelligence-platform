import { ENTITIES } from '../../data/entities'
import { useBiTemporalFields } from '../../hooks/useBiTemporalFields'
import FieldsView from './FieldsView'
import CompareView from './CompareView'

export default function EntityContent({
  vessel, curDate, curEntity,
  editMode, viewMode, onViewModeChange,
  selField, onSelectField
}) {
  const { fields, currentFields, changedCount } = useBiTemporalFields(vessel, curEntity, curDate)
  const ent = ENTITIES.find(e => e.key === curEntity)

  if (!ent || !fields.length) {
    return (
      <div className="detContent">
        <div className="empty">No data available for this entity.</div>
      </div>
    )
  }

  const chgNote = changedCount > 0
    ? (
      <span className="tag" style={{
        fontSize: 9,
        background: '#fff3cd',
        color: '#b45309',
        border: '1px solid #ffd700',
        padding: '2px 6px',
        borderRadius: 3
      }}>
        {changedCount} attr differ vs current
      </span>
    )
    : (curDate < '2024-01-30'
      ? <span className="tag tG" style={{ fontSize: 9, padding: '2px 6px' }}>No changes</span>
      : null
    )

  return (
    <div className="detContent">
      {/* Sticky header */}
      <div style={{
        padding: '10px 20px 8px',
        borderBottom: '1px solid var(--bd)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg2)',
        position: 'sticky',
        top: 0,
        zIndex: 4
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: ent.color
        }}>
          {ent.icon} {ent.label}
        </span>
        <span className="tag tN" style={{ fontSize: 9 }}>{fields.length} fields</span>
        {chgNote}
        <div className="viewToggle" style={{ marginLeft: 'auto' }}>
          <button
            className={'vtBtn' + (viewMode === 'fields' ? ' on' : '')}
            onClick={() => onViewModeChange('fields')}
          >Fields</button>
          <button
            className={'vtBtn' + (viewMode === 'compare' ? ' on' : '')}
            onClick={() => onViewModeChange('compare')}
          >Compare Sources</button>
        </div>
      </div>

      {/* Body */}
      {viewMode === 'compare' ? (
        <CompareView
          fields={fields}
          sectionKey={curEntity}
          vessel={vessel}
          editMode={editMode}
          selField={selField}
          onSelectField={onSelectField}
        />
      ) : (
        <FieldsView
          fields={fields}
          currentFields={currentFields}
          editMode={editMode}
          selField={selField}
          onSelectField={onSelectField}
        />
      )}
    </div>
  )
}
