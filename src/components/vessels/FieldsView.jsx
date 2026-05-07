import SourceBadge from '../common/SourceBadge'

export default function FieldsView({ fields, currentFields, editMode, selField, onSelectField }) {
  if (!fields || fields.length === 0) {
    return <div className="empty">No fields available.</div>
  }

  return (
    <div className="detGrid" style={{ padding: '4px 10px' }}>
      {fields.map((f, i) => {
        const [lbl, val, src, desc] = f
        const isChanged = currentFields && currentFields[i] && currentFields[i][1] !== val
        const isSel = selField === i

        return (
          <div
            key={i}
            className={'detField' + (isSel ? ' sel' : '') + (isChanged ? ' changed' : '')}
            onClick={() => onSelectField(i, lbl)}
            title={desc || ''}
          >
            <div className="fieldLbl">{lbl}{isChanged ? ' ▲' : ''}</div>
            {editMode ? (
              <input className="inp" defaultValue={val} style={{ fontSize: 12, padding: '4px 8px', marginTop: 3 }} />
            ) : (
              <div className="fieldVal mn">{val}</div>
            )}
            {isChanged && !editMode && (
              <div style={{ fontSize: 8, color: '#b45309', marginTop: 2 }}>
                ▲ Current: {currentFields[i][1]}
              </div>
            )}
            <div className="fieldSrc">
              <SourceBadge src={src} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
