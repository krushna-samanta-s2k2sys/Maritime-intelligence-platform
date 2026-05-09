import { useState, useRef, useEffect, useMemo } from 'react'
import { FILTER_CONFIGS, FILTER_GROUPS, FILTER_MAP } from '../../data/filterConfig'

// ── Single filter value editor popover ──────────────────────────────────────
function FilterEditor({ cfg, filter, vessels, onUpdate, onRemove, onClose, anchor }) {
  const [localVal, setLocalVal] = useState(() => {
    if (cfg.filterType === 'multiselect') return filter?.values || []
    if (cfg.filterType === 'range')       return { min: filter?.min ?? '', max: filter?.max ?? '' }
    if (cfg.filterType === 'typeahead')   return filter?.query || ''
    return ''
  })
  const [search, setSearch] = useState('')
  const popRef = useRef(null)

  // Position popover near anchor
  const [pos, setPos] = useState({ top:0, left:0 })
  useEffect(() => {
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const vpW = window.innerWidth; const vpH = window.innerHeight
    let top = rect.bottom + 6; let left = rect.left
    if (left + 300 > vpW) left = vpW - 310
    if (top + 340 > vpH) top = rect.top - 346
    setPos({ top, left })
  }, [anchor])

  // Close on outside click
  useEffect(() => {
    function h(e) { if (popRef.current && !popRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  function commit() {
    if (cfg.filterType === 'multiselect') {
      if (localVal.length === 0) { onRemove(); return }
      onUpdate({ fieldId: cfg.id, type: 'multiselect', values: localVal })
    } else if (cfg.filterType === 'range') {
      const min = localVal.min !== '' ? Number(localVal.min) : null
      const max = localVal.max !== '' ? Number(localVal.max) : null
      if (min == null && max == null) { onRemove(); return }
      onUpdate({ fieldId: cfg.id, type: 'range', min, max })
    } else if (cfg.filterType === 'typeahead') {
      if (!localVal.trim()) { onRemove(); return }
      onUpdate({ fieldId: cfg.id, type: 'typeahead', query: localVal.trim() })
    }
    onClose()
  }

  const availableValues = useMemo(() =>
    cfg.filterType === 'multiselect' && cfg.getValues ? cfg.getValues(vessels) : [],
  [cfg, vessels])

  const filteredValues = search
    ? availableValues.filter(v => v.label.toLowerCase().includes(search.toLowerCase()))
    : availableValues

  function toggleValue(val) {
    setLocalVal(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  return (
    <div
      ref={popRef}
      className="fbEditorPop"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="fbEditorHead">
        <span className="fbEditorTitle">{cfg.label}</span>
        <button className="fbEditorClose" onClick={onClose}>✕</button>
      </div>

      {cfg.filterType === 'multiselect' && (
        <>
          {availableValues.length > 6 && (
            <div className="fbEditorSearch">
              <input
                autoFocus
                className="fbEditorSearchInp"
                placeholder="Search options…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className="fbCheckList">
            {filteredValues.map(opt => (
              <label key={opt.value} className="fbCheckRow">
                <input
                  type="checkbox"
                  checked={localVal.includes(opt.value)}
                  onChange={() => toggleValue(opt.value)}
                />
                <span className="fbCheckLabel">{opt.label}</span>
                <span className="fbCheckCount">{opt.count}</span>
              </label>
            ))}
            {filteredValues.length === 0 && <div className="empty" style={{padding:'8px 0'}}>No options found</div>}
          </div>
          {localVal.length > 0 && (
            <div className="fbEditorSel">{localVal.length} selected · <button className="fbEditorClrBtn" onClick={() => setLocalVal([])}>Clear</button></div>
          )}
        </>
      )}

      {cfg.filterType === 'range' && (
        <div className="fbRangeGrid">
          <div>
            <div className="fbRangeLabel">Min</div>
            <input
              autoFocus
              className="fbRangeInp"
              type="number"
              placeholder="No minimum"
              value={localVal.min}
              onChange={e => setLocalVal(p => ({ ...p, min: e.target.value }))}
            />
          </div>
          <div className="fbRangeSep">—</div>
          <div>
            <div className="fbRangeLabel">Max</div>
            <input
              className="fbRangeInp"
              type="number"
              placeholder="No maximum"
              value={localVal.max}
              onChange={e => setLocalVal(p => ({ ...p, max: e.target.value }))}
            />
          </div>
        </div>
      )}

      {cfg.filterType === 'typeahead' && (
        <div style={{ padding: '8px 12px 4px' }}>
          <input
            autoFocus
            className="fbTypeInp"
            placeholder={`Search by ${cfg.label.toLowerCase()}…`}
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit() }}
          />
        </div>
      )}

      <div className="fbEditorFoot">
        <button className="btn btnS btnSm" onClick={() => { onRemove(); onClose() }}>Remove</button>
        <button className="btn btnP btnSm" style={{ marginLeft: 'auto' }} onClick={commit}>Apply</button>
      </div>
    </div>
  )
}

// ── Attribute picker popover (+ Add Filter) ──────────────────────────────────
function AttributePicker({ vessels, activeIds, onPick, anchor, onClose }) {
  const [search, setSearch] = useState('')
  const popRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const vpW = window.innerWidth; const vpH = window.innerHeight
    let top = rect.bottom + 6; let left = rect.left
    if (left + 260 > vpW) left = vpW - 270
    if (top + 380 > vpH) top = rect.top - 386
    setPos({ top, left })
  }, [anchor])

  useEffect(() => {
    function h(e) { if (popRef.current && !popRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    return FILTER_GROUPS.map(g => ({
      ...g,
      items: FILTER_CONFIGS.filter(f =>
        f.group === g.id &&
        !activeIds.includes(f.id) &&
        (!q || f.label.toLowerCase().includes(q))
      ),
    })).filter(g => g.items.length > 0)
  }, [search, activeIds])

  return (
    <div
      ref={popRef}
      className="fbAttrPop"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="fbAttrSearch">
        <input
          autoFocus
          className="fbAttrInp"
          placeholder="Search attributes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="fbAttrList">
        {grouped.map(g => (
          <div key={g.id}>
            <div className="fbAttrGroupHdr">{g.label}</div>
            {g.items.map(f => (
              <button key={f.id} className="fbAttrItem" onClick={() => { onPick(f.id); onClose() }}>
                <span className="fbAttrItemLabel">{f.label}</span>
                <span className="fbAttrItemType">{f.filterType}</span>
              </button>
            ))}
          </div>
        ))}
        {grouped.length === 0 && <div className="empty" style={{ padding: 12 }}>No matching attributes</div>}
      </div>
    </div>
  )
}

// ── Main FilterBuilder ──────────────────────────────────────────────────────
export default function FilterBuilder({ filters, onChange, vessels }) {
  const [showAttrPicker, setShowAttrPicker] = useState(false)
  const [editingId, setEditingId] = useState(null)       // fieldId of filter being edited
  const [editingAnchor, setEditingAnchor] = useState(null)
  const [addAnchor, setAddAnchor] = useState(null)
  const addBtnRef = useRef(null)

  const activeIds = filters.map(f => f.fieldId)

  function addFilter(fieldId) {
    const cfg = FILTER_MAP[fieldId]
    if (!cfg) return
    // Open editor immediately for the new filter (empty)
    const el = addBtnRef.current
    setEditingId(fieldId)
    setEditingAnchor(el)
    // Insert placeholder so editor can compute position
    if (!filters.find(f => f.fieldId === fieldId)) {
      onChange([...filters, { fieldId, type: cfg.filterType, values: [], query: '', min: null, max: null }])
    }
  }

  function updateFilter(updated) {
    onChange(filters.map(f => f.fieldId === updated.fieldId ? updated : f))
  }

  function removeFilter(fieldId) {
    onChange(filters.filter(f => f.fieldId !== fieldId))
    if (editingId === fieldId) setEditingId(null)
  }

  function openEditor(e, fieldId) {
    setEditingId(fieldId)
    setEditingAnchor(e.currentTarget)
  }

  const editingCfg  = editingId ? FILTER_MAP[editingId] : null
  const editingFilter = editingId ? filters.find(f => f.fieldId === editingId) : null

  return (
    <div className="fbBar">
      {/* Active filter chips */}
      {filters.map(f => {
        const cfg = FILTER_MAP[f.fieldId]
        if (!cfg) return null
        const label = cfg.describe(f)
        const isEmpty = (f.type === 'multiselect' && (!f.values || f.values.length === 0)) ||
                        (f.type === 'typeahead' && !f.query) ||
                        (f.type === 'range' && f.min == null && f.max == null)
        if (isEmpty) return null
        return (
          <div key={f.fieldId} className={`fbChip${editingId === f.fieldId ? ' fbChipActive' : ''}`}>
            <button className="fbChipLabel" onClick={e => openEditor(e, f.fieldId)}>
              {label}
            </button>
            <button className="fbChipRemove" onClick={() => removeFilter(f.fieldId)} title="Remove filter">✕</button>
          </div>
        )
      })}

      {/* Add filter button */}
      <button
        ref={addBtnRef}
        className="fbAddBtn"
        onClick={e => { setAddAnchor(e.currentTarget); setShowAttrPicker(v => !v) }}
      >
        + Add Filter
      </button>

      {filters.length > 0 && (
        <button className="fbClearAll" onClick={() => onChange([])}>Clear all</button>
      )}

      {/* Attribute picker popover */}
      {showAttrPicker && (
        <AttributePicker
          vessels={vessels}
          activeIds={activeIds}
          anchor={addAnchor}
          onPick={fieldId => { addFilter(fieldId); setShowAttrPicker(false) }}
          onClose={() => setShowAttrPicker(false)}
        />
      )}

      {/* Filter value editor popover */}
      {editingCfg && editingFilter && (
        <FilterEditor
          cfg={editingCfg}
          filter={editingFilter}
          vessels={vessels}
          anchor={editingAnchor}
          onUpdate={updateFilter}
          onRemove={() => removeFilter(editingId)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}
