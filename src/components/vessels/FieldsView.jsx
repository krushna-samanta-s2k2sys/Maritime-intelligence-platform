import SourceBadge from '../common/SourceBadge'

export default function FieldsView({ fields, currentFields, editMode, selField, onSelectField }) {
  if (!fields || fields.length === 0) {
    return <div className="empty" style={{ padding: 32 }}>No fields available.</div>
  }

  return (
    <div className="detGrid2">
      {fields.map((f, i) => {
        const [lbl, val, src, desc] = f
        const isChanged = currentFields && currentFields[i] && currentFields[i][1] !== val
        const isSel     = selField === i
        const isEmpty   = !val || val === '—' || val === 'N/A'

        return (
          <div
            key={i}
            className={`detField2${isSel ? ' sel' : ''}${isChanged ? ' changed' : ''}`}
            onClick={() => onSelectField(i)}
            title={desc || ''}
          >
            <div className="f2Lbl">{lbl}{isChanged ? ' ▲' : ''}</div>

            {editMode ? (
              <input
                className="inp"
                defaultValue={isEmpty ? '' : val}
                style={{ fontSize: 12, padding: '4px 8px', marginTop: 4, width: '100%', boxSizing: 'border-box' }}
              />
            ) : (
              <div className={`f2Val${isEmpty ? ' f2Empty' : ''}`}>{val || '—'}</div>
            )}

            {isChanged && !editMode && (
              <div className="f2Changed">▲ Now: {currentFields[i][1]}</div>
            )}

            <div className="f2Foot">
              <SourceBadge src={src} />
              {desc && <span className="f2Desc" title={desc}>ⓘ</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
