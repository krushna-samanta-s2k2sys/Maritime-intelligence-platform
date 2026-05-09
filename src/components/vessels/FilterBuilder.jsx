import { useState, useRef, useEffect, useMemo } from 'react'
import { FILTER_MAP } from '../../data/filterConfig'
import { ATTRIBUTE_TREE, flattenFilterable, hasAnyFilterable } from '../../data/attributeTree'

// ── Filter value editor popover ──────────────────────────────────────────────
function FilterEditor({ cfg, filter, vessels, onUpdate, onRemove, onClose, anchor }) {
  const [localVal, setLocalVal] = useState(() => {
    if (cfg.filterType === 'multiselect') return filter?.values || []
    if (cfg.filterType === 'range')       return { min: filter?.min ?? '', max: filter?.max ?? '' }
    if (cfg.filterType === 'typeahead')   return filter?.query || ''
    return ''
  })
  const [search, setSearch]           = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const popRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const vpW = window.innerWidth, vpH = window.innerHeight
    let top = rect.bottom + 8, left = rect.left
    if (left + 320 > vpW) left = vpW - 328
    if (top + 400 > vpH) top = rect.top - 408
    setPos({ top, left })
  }, [anchor])

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
    setLocalVal(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  const suggestions = useMemo(() => {
    if (cfg.filterType !== 'typeahead' || !localVal || !cfg.getFieldValue) return []
    const q = localVal.toLowerCase()
    const seen = new Set()
    const results = []
    for (const v of vessels) {
      const s = cfg.getFieldValue(v)
      if (s && s.toLowerCase().includes(q) && !seen.has(s)) {
        seen.add(s); results.push(s)
        if (results.length >= 8) break
      }
    }
    return results
  }, [cfg, localVal, vessels])

  return (
    <div
      ref={popRef}
      className="fePop"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="feHead">
        <span className="feTitle">{cfg.label}</span>
        <span className="feType">{cfg.filterType}</span>
        <button className="feClose" onClick={onClose}>✕</button>
      </div>

      {cfg.filterType === 'multiselect' && (
        <>
          {availableValues.length > 5 && (
            <div className="feSearch">
              <input
                autoFocus
                className="feSearchInp"
                placeholder="Search options…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className="feOptList">
            {filteredValues.map(opt => {
              const on = localVal.includes(opt.value)
              return (
                <label key={opt.value} className={`feOpt${on ? ' feOptOn' : ''}`}>
                  <span className={`feChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                  <span className="feOptLabel">{opt.label}</span>
                  <span className="feOptCount">{opt.count}</span>
                </label>
              )
            })}
            {filteredValues.length === 0 && (
              <div className="feEmpty">No options found</div>
            )}
          </div>
          {localVal.length > 0 && (
            <div className="feSelBar">
              <span>{localVal.length} selected</span>
              <button className="feClrBtn" onClick={() => setLocalVal([])}>Clear all</button>
            </div>
          )}
        </>
      )}

      {cfg.filterType === 'range' && (
        <div className="feRangePair">
          <div className="feRangeField">
            <div className="feRangeLabel">From</div>
            <input
              autoFocus
              className="feRangeInp"
              type="number"
              placeholder="No minimum"
              value={localVal.min}
              onChange={e => setLocalVal(p => ({ ...p, min: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && commit()}
            />
          </div>
          <div className="feRangeSep">—</div>
          <div className="feRangeField">
            <div className="feRangeLabel">To</div>
            <input
              className="feRangeInp"
              type="number"
              placeholder="No maximum"
              value={localVal.max}
              onChange={e => setLocalVal(p => ({ ...p, max: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && commit()}
            />
          </div>
        </div>
      )}

      {cfg.filterType === 'typeahead' && (
        <div className="feTypeWrap">
          <input
            autoFocus
            className="feTypeInp"
            placeholder={`Search ${cfg.label.toLowerCase()}…`}
            value={localVal}
            onChange={e => { setLocalVal(e.target.value); setShowSuggest(true) }}
            onKeyDown={e => {
              if (e.key === 'Enter') { setShowSuggest(false); commit() }
              if (e.key === 'Escape') setShowSuggest(false)
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          />
          {showSuggest && suggestions.length > 0 && (
            <div className="feSuggestDrop">
              {suggestions.map(s => (
                <button
                  key={s}
                  className="feSuggestItem"
                  onMouseDown={e => { e.preventDefault(); setLocalVal(s); setShowSuggest(false) }}
                >{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="feFoot">
        <button className="btn btnS btnSm" onClick={() => { onRemove(); onClose() }}>Remove</button>
        <button className="btn btnP btnSm feApply" onClick={commit}>Apply</button>
      </div>
    </div>
  )
}

// ── Filter Tree Panel ────────────────────────────────────────────────────────
function FilterTreePanel({ vessels, activeIds, onPick, onClose }) {
  const [search, setSearch] = useState('')
  // Starts fully collapsed — user expands as needed
  const [expanded, setExpanded] = useState(() => new Set())

  const allFilterable = useMemo(() => flattenFilterable(ATTRIBUTE_TREE), [])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return allFilterable.filter(n =>
      !activeIds.includes(n.filterId) &&
      (n.label.toLowerCase().includes(q) ||
       n.path.some(p => p.toLowerCase().includes(q)))
    )
  }, [search, activeIds, allFilterable])

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function renderNodes(nodes, depth = 0) {
    return nodes.map(node => {
      if (node.children) {
        if (!hasAnyFilterable(node)) return null
        const isOpen = expanded.has(node.id)
        return (
          <div key={node.id}>
            <button
              className={`ftBranch${isOpen ? ' ftOpen' : ''}${depth === 0 ? ' ftBranchRoot' : ''}`}
              style={{ paddingLeft: 14 + depth * 16 }}
              onClick={() => toggleExpand(node.id)}
            >
              <span className="ftArrow">{isOpen ? '▾' : '▸'}</span>
              <span className="ftBranchLabel">{node.label}</span>
            </button>
            {isOpen && <div className="ftChildren" style={{ borderLeft: depth === 0 ? 'none' : '1px solid var(--bg3)', marginLeft: 22 + depth * 16 }}>{renderNodes(node.children, depth + 1)}</div>}
          </div>
        )
      } else {
        if (!node.filterId) return null
        const isActive = activeIds.includes(node.filterId)
        const cfg = FILTER_MAP[node.filterId]
        return (
          <button
            key={node.id}
            className={`ftLeaf${isActive ? ' ftLeafActive' : ''}`}
            style={{ paddingLeft: 10 }}
            onClick={() => { if (!isActive) { onPick(node.filterId); onClose() } }}
          >
            <span className="ftLeafLabel">{node.label}</span>
            {cfg && !isActive && <span className="ftLeafType">{cfg.filterType}</span>}
            {isActive && <span className="ftLeafCheck">✓ Added</span>}
          </button>
        )
      }
    })
  }

  return (
    <div
      className="ftOverlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="ftPanel">
        <div className="ftHead">
          <div className="ftHeadInfo">
            <div className="ftTitle">Add Filter</div>
            <div className="ftSub">Browse categories below, or type to search any attribute</div>
          </div>
          <button className="ftClose" onClick={onClose}>✕</button>
        </div>

        <div className="ftSearch">
          <div className="ftSearchIcon">⌕</div>
          <input
            autoFocus
            className="ftSearchInp"
            placeholder="Search attributes… e.g. DWT, Flag, Owner, Ice Class, COW"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="ftSearchClear" onClick={() => setSearch('')}>✕</button>}
        </div>

        <div className="ftBody">
          {search.trim() ? (
            searchResults.length > 0 ? (
              <>
                <div className="ftResultsHdr">{searchResults.length} attribute{searchResults.length !== 1 ? 's' : ''} found</div>
                {searchResults.map(n => {
                  const cfg = FILTER_MAP[n.filterId]
                  return (
                    <button
                      key={n.id}
                      className="ftResultItem"
                      onClick={() => { onPick(n.filterId); onClose() }}
                    >
                      <div className="ftResultMeta">
                        <div className="ftResultPath">{n.path.slice(0, -1).join(' › ')}</div>
                        <div className="ftResultLabel">{n.label}</div>
                      </div>
                      {cfg && <span className="ftLeafType">{cfg.filterType}</span>}
                    </button>
                  )
                })}
              </>
            ) : (
              <div className="ftEmpty">No filterable attributes matching "<strong>{search}</strong>"</div>
            )
          ) : (
            <div className="ftTree">{renderNodes(ATTRIBUTE_TREE)}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main FilterBuilder bar ───────────────────────────────────────────────────
export default function FilterBuilder({ filters, onChange, vessels }) {
  const [showTreePanel, setShowTreePanel] = useState(false)
  const [editingId, setEditingId]         = useState(null)
  const [editingAnchor, setEditingAnchor] = useState(null)
  const addBtnRef = useRef(null)

  const activeIds = filters.map(f => f.fieldId)

  function addFilter(fieldId) {
    const cfg = FILTER_MAP[fieldId]
    if (!cfg) return
    setShowTreePanel(false)
    setEditingId(fieldId)
    setEditingAnchor(addBtnRef.current)
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

  const editingCfg    = editingId ? FILTER_MAP[editingId] : null
  const editingFilter = editingId ? filters.find(f => f.fieldId === editingId) : null

  const hasActiveFilters = filters.some(f => {
    const t = f.type
    return !(t === 'multiselect' && (!f.values || !f.values.length)) &&
           !(t === 'typeahead' && !f.query) &&
           !(t === 'range' && f.min == null && f.max == null)
  })

  return (
    <div className="fbBar">
      {filters.map(f => {
        const cfg = FILTER_MAP[f.fieldId]
        if (!cfg) return null
        const isEmpty = (f.type === 'multiselect' && (!f.values || f.values.length === 0)) ||
                        (f.type === 'typeahead' && !f.query) ||
                        (f.type === 'range' && f.min == null && f.max == null)
        if (isEmpty) return null
        const label = cfg.describe(f)
        return (
          <div key={f.fieldId} className={`fbChip${editingId === f.fieldId ? ' fbChipActive' : ''}`}>
            <button className="fbChipLabel" onClick={e => openEditor(e, f.fieldId)}>{label}</button>
            <button className="fbChipRemove" onClick={() => removeFilter(f.fieldId)} title="Remove">✕</button>
          </div>
        )
      })}

      <button
        ref={addBtnRef}
        className="fbAddBtn"
        onClick={() => setShowTreePanel(v => !v)}
      >
        + Add Filter
      </button>

      {hasActiveFilters && (
        <button className="fbClearAll" onClick={() => onChange([])}>Clear all</button>
      )}

      {showTreePanel && (
        <FilterTreePanel
          vessels={vessels}
          activeIds={activeIds}
          onPick={addFilter}
          onClose={() => setShowTreePanel(false)}
        />
      )}

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
