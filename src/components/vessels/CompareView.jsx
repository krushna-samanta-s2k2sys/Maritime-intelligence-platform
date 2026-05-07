import SourceBadge from '../common/SourceBadge'
import { dRand, buildVendorList } from '../../data/entities'

export default function CompareView({ fields, sectionKey, vessel, editMode, selField, onSelectField }) {
  if (!fields || fields.length === 0) {
    return <div className="empty">No fields available.</div>
  }

  const vendors = buildVendorList(vessel, sectionKey)

  function getBadgeCls(v) { return v.badgeCls || 'sIHS' }
  function getBadgeLbl(v) { return v.badgeLbl || v.key }

  return (
    <div className="msWrap">
      <table className="msTable">
        <thead>
          <tr>
            <th style={{ width: 130 }}>Attribute</th>
            <th style={{ background: '#f0f7ff', width: 150 }}>Master (Golden Record)</th>
            {vendors.map(v => (
              <th key={v.key}>
                <span className={`src ${getBadgeCls(v)}`}>{getBadgeLbl(v)}</span> {v.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => {
            const [lbl, masterVal, masterSrc] = f
            const seed = lbl + (vessel ? vessel.imo : '') + sectionKey
            const isSelected = selField === i
            const autoUpd = dRand('auto' + seed) > 0.75

            return (
              <tr key={i}>
                {/* Attribute name */}
                <td>
                  <div
                    className={'msAttr' + (isSelected ? ' selA' : '')}
                    onClick={() => onSelectField(i, lbl)}
                  >{lbl}</div>
                </td>

                {/* Master cell */}
                <td className="msMaster">
                  <div className="msMasterV">{masterVal}</div>
                  <div className="msMasterSrc">
                    <SourceBadge src={masterSrc} />
                    {autoUpd
                      ? <span className="msAutoTag">AUTO</span>
                      : <span className="msAutoTag msOvrTag">OVERRIDE</span>
                    }
                  </div>
                  {editMode && (
                    <div style={{ marginTop: 4 }}>
                      <input
                        className="overrideInput"
                        placeholder="Override value..."
                        id={'ovr_' + i}
                      />
                      <button
                        className="overrideBtn"
                        onClick={() => {
                          const inp = document.getElementById('ovr_' + i)
                          if (!inp || !inp.value.trim()) return
                          const ts = new Date().toISOString().substr(0, 19).replace('T', ' ')
                          alert('Manual override for "' + lbl + '":\nNew value: "' + inp.value.trim() + '"\nSaved with transaction_time: ' + ts + '\nSource flagged as ANALYST_OVERRIDE in audit log.')
                        }}
                      >&#9998; Save Override</button>
                    </div>
                  )}
                </td>

                {/* Vendor cells */}
                {vendors.map(v => {
                  const covers = dRand('cov' + v.key + seed) < v.coverage
                  if (!covers) {
                    return (
                      <td key={v.key} className="msVCell miss">
                        <div className="msVVal missV">—</div>
                      </td>
                    )
                  }
                  const conflictR = dRand('cfl' + v.key + seed)
                  let value = masterVal
                  let cellCls = 'match'
                  let valCls = 'matchV'
                  let score = 1.0
                  if (conflictR < 0.04) {
                    value = '(vendor differs)'
                    cellCls = 'diff'; valCls = 'diffV'; score = 0.62
                  } else if (conflictR < 0.12) {
                    value = masterVal + (masterVal.match(/[0-9]/) ? ' *' : '')
                    cellCls = 'diff'; valCls = 'diffV'; score = 0.87
                  }
                  const barColor = score >= 0.95 ? '#34a853' : score >= 0.75 ? '#f59e0b' : '#d93025'
                  const ts = '2024-01-' + (Math.floor(dRand('ts' + v.key + lbl) * 20) + 10)

                  return (
                    <td key={v.key} className={'msVCell ' + cellCls}>
                      <div className={'msVVal ' + valCls}>{value}</div>
                      <div className="msVBar">
                        <div className="msVBarTr">
                          <div className="msVBarFl" style={{ width: Math.round(score * 100) + '%', background: barColor }} />
                        </div>
                        <span style={{ fontSize: 8, color: 'var(--txt3)', fontFamily: 'monospace' }}>{score.toFixed(2)}</span>
                      </div>
                      <div className="msVTs">{ts}</div>
                      {editMode && (
                        <button
                          className="applyBtn"
                          onClick={() => {
                            const ts2 = new Date().toISOString().substr(0, 19).replace('T', ' ')
                            alert('Applied from ' + v.key + ':\n"' + value + '"\nwill be saved with transaction_time: ' + ts2 + '\nPrevious value retained in bi-temporal audit log.')
                          }}
                        >&#10003; Apply to Master</button>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
