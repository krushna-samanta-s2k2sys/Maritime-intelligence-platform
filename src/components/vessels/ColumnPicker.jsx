import { useState } from 'react'
import { ALL_VESSEL_COLUMNS, COLUMN_GROUPS } from '../../data/vesselColumns'
import { usePreferences } from '../../contexts/PreferencesContext'

export default function ColumnPicker({ onClose }) {
  const { vesselColumns, updateVesselColumns, resetVesselColumns, persona } = usePreferences()
  const [local, setLocal] = useState(() => new Set(vesselColumns))

  function toggle(id) {
    const next = new Set(local)
    if (next.has(id)) { if (next.size > 1) next.delete(id) }
    else next.add(id)
    setLocal(next)
  }

  function apply() {
    // Preserve the natural order from ALL_VESSEL_COLUMNS for checked columns
    const ordered = ALL_VESSEL_COLUMNS.filter(c => local.has(c.id)).map(c => c.id)
    updateVesselColumns(ordered)
    onClose()
  }

  function reset() {
    resetVesselColumns()
    onClose()
  }

  const grouped = COLUMN_GROUPS.map(g => ({
    ...g,
    cols: ALL_VESSEL_COLUMNS.filter(c => c.group === g.key)
  })).filter(g => g.cols.length > 0)

  return (
    <div className="colPickerOverlay" onClick={onClose}>
      <div className="colPickerPane" onClick={e => e.stopPropagation()}>
        <div className="colPickerHead">
          <div className="colPickerTitle">Customize Columns</div>
          <div className="colPickerSub">{local.size} of {ALL_VESSEL_COLUMNS.length} columns selected</div>
          <button className="catalogClose" onClick={onClose}>✕</button>
        </div>

        <div className="colPickerBody">
          {grouped.map(group => (
            <div key={group.key} className="colPickerGroup">
              <div className="colPickerGroupHdr">{group.label}</div>
              {group.cols.map(col => (
                <label key={col.id} className={`colPickerItem${local.has(col.id)?' on':''}`}>
                  <input
                    type="checkbox"
                    checked={local.has(col.id)}
                    disabled={col.always}
                    onChange={() => toggle(col.id)}
                    style={{marginRight:8,accentColor:'var(--blue)'}}
                  />
                  <span className="colPickerLabel">{col.label}</span>
                  {col.always && <span className="colPickerRequired">required</span>}
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="colPickerFoot">
          <button className="btn btnS btnSm" onClick={reset}>↺ Reset to {persona.name} default</button>
          <div style={{flex:1}}/>
          <button className="btn btnS btnSm" onClick={onClose}>Cancel</button>
          <button className="btn btnP btnSm" onClick={apply}>Apply Columns</button>
        </div>
      </div>
    </div>
  )
}
