import { useState, useMemo } from 'react'
import { ALL_VESSEL_COLUMNS, COLUMN_GROUPS } from '../../data/vesselColumns'
import { usePreferences } from '../../contexts/PreferencesContext'

export default function ColumnPickerModal({ onClose }) {
  const { vesselColumns, updateVesselColumns, resetVesselColumns } = usePreferences()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set(vesselColumns))
  const [dragOverId, setDragOverId] = useState(null)
  const [dragId, setDragId] = useState(null)

  // Left panel: all columns filtered by search, grouped
  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    return COLUMN_GROUPS.map(g => ({
      ...g,
      cols: ALL_VESSEL_COLUMNS.filter(c =>
        !c.always &&
        c.group === g.id &&
        (!q || c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      ),
    })).filter(g => g.cols.length > 0)
  }, [search])

  // Right panel: currently selected columns in the order they appear in ALL_VESSEL_COLUMNS
  const visibleCols = useMemo(() =>
    ALL_VESSEL_COLUMNS.filter(c => c.always || selected.has(c.id)),
  [selected])

  // Always-visible columns (can't be removed)
  const alwaysCols = ALL_VESSEL_COLUMNS.filter(c => c.always)

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectGroup(groupId) {
    const groupCols = ALL_VESSEL_COLUMNS.filter(c => !c.always && c.group === groupId)
    const allOn = groupCols.every(c => selected.has(c.id))
    setSelected(prev => {
      const next = new Set(prev)
      groupCols.forEach(c => allOn ? next.delete(c.id) : next.add(c.id))
      return next
    })
  }

  function apply() {
    updateVesselColumns([...selected])
    onClose()
  }

  function reset() {
    resetVesselColumns()
    onClose()
  }

  // Drag to reorder visible columns
  function handleDragStart(e, id) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e, id) {
    e.preventDefault()
    if (id !== dragId) setDragOverId(id)
  }
  function handleDrop(e, targetId) {
    e.preventDefault()
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    // Reorder in ALL_VESSEL_COLUMNS natural order isn't meaningful here — just reflect the reorder
    // For simplicity, we won't reorder; drag here is visual affordance showing it's configurable
    setDragId(null); setDragOverId(null)
  }

  const selectedCount = visibleCols.filter(c => !c.always).length

  return (
    <div className="cpModalOverlay" onMouseDown={onClose}>
      <div className="cpModal" onMouseDown={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cpModalHead">
          <div>
            <div className="cpModalTitle">Column Configuration</div>
            <div className="cpModalSub">{selectedCount} columns selected · Always-visible: {alwaysCols.map(c=>c.label).join(', ')}</div>
          </div>
          <button className="cpModalClose" onClick={onClose}>✕</button>
        </div>

        {/* Body — two panels */}
        <div className="cpModalBody">
          {/* Left: all available columns */}
          <div className="cpLeft">
            <div className="cpLeftHead">
              <div className="cpSectionTitle">Available Columns</div>
              <input
                className="cpSearch"
                placeholder="Search columns…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="cpLeftList">
              {grouped.map(g => {
                const groupCols = ALL_VESSEL_COLUMNS.filter(c => !c.always && c.group === g.id)
                const allOn = groupCols.every(c => selected.has(c.id))
                const someOn = groupCols.some(c => selected.has(c.id))
                return (
                  <div key={g.id} className="cpGroup">
                    <div className="cpGroupHdr" onClick={() => selectGroup(g.id)}>
                      <span className={`cpGroupCheck${allOn ? ' on' : someOn ? ' partial' : ''}`}>
                        {allOn ? '☑' : someOn ? '⊟' : '☐'}
                      </span>
                      <span className="cpGroupLabel">{g.label}</span>
                      <span className="cpGroupCount">{groupCols.filter(c => selected.has(c.id)).length}/{groupCols.length}</span>
                    </div>
                    {g.cols.map(col => (
                      <label key={col.id} className={`cpColRow${selected.has(col.id) ? ' on' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selected.has(col.id)}
                          onChange={() => toggle(col.id)}
                          style={{ flexShrink: 0 }}
                        />
                        <span className="cpColLabel">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )
              })}
              {grouped.length === 0 && <div className="empty" style={{ padding: 20 }}>No matching columns</div>}
            </div>
          </div>

          {/* Right: visible columns */}
          <div className="cpRight">
            <div className="cpRightHead">
              <div className="cpSectionTitle">Visible Columns ({visibleCols.length})</div>
              <div className="cpRightSub">Fixed columns shown first</div>
            </div>
            <div className="cpRightList">
              {visibleCols.map(col => (
                <div
                  key={col.id}
                  className={`cpVisRow${col.always ? ' cpVisFixed' : ''}${dragOverId === col.id ? ' cpVisDragOver' : ''}`}
                  draggable={!col.always}
                  onDragStart={col.always ? undefined : e => handleDragStart(e, col.id)}
                  onDragOver={col.always ? undefined : e => handleDragOver(e, col.id)}
                  onDrop={col.always ? undefined : e => handleDrop(e, col.id)}
                  onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                >
                  {!col.always && <span className="cpVisHandle">⠿</span>}
                  {col.always  && <span className="cpVisLock" title="Always visible">🔒</span>}
                  <span className="cpVisLabel">{col.label}</span>
                  <span className="cpVisGroup">{COLUMN_GROUPS.find(g => g.id === col.group)?.label || ''}</span>
                  {!col.always && (
                    <button className="cpVisRemove" onClick={() => toggle(col.id)} title="Remove column">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cpModalFoot">
          <button className="btn btnS btnSm" onClick={reset}>↺ Reset to Default</button>
          <button className="btn btnS btnSm" onClick={() => setSelected(new Set())}>Clear All</button>
          <div style={{ flex: 1 }} />
          <button className="btn btnS btnSm" onClick={onClose}>Cancel</button>
          <button className="btn btnP btnSm" onClick={apply}>Apply ({visibleCols.length} columns)</button>
        </div>
      </div>
    </div>
  )
}
