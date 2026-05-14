import { useState, useEffect, useRef, useMemo } from 'react'
import { exportToExcel } from '../utils/exportCsv'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import GenAttrTreeSidebar from '../components/shared/GenAttrTreeSidebar'
import GenAttrContentPanel from '../components/shared/GenAttrContentPanel'
import FieldEditPanel from '../components/vessels/FieldEditPanel'
import {
  PORTS,
  getPortAttrValue, generatePortHistory,
  PORT_FILTER_FIELDS, PORT_COL_GROUPS, PORT_COLUMNS,
  getPortCellValue,
} from '../data/ports'
import { buildAttrTree } from '../data/attributeRegistry'

const PORT_ATTRIBUTE_TREE = buildAttrTree('port')


// â”€â”€ Filter Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PoFilterEditor({ cfg, filter, ports, onUpdate, onRemove, onClose, anchorEl }) {
  const [localVal, setLocalVal] = useState(() => {
    if (cfg.filterType === 'multiselect') return filter?.values || []
    if (cfg.filterType === 'range') return { min: filter?.min ?? '', max: filter?.max ?? '' }
    return ''
  })
  const [optSearch, setOptSearch] = useState('')
  const rect = anchorEl?.getBoundingClientRect() || { bottom: 0, left: 0 }
  const pos = { top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 320) }

  const availableValues = useMemo(() =>
    cfg.filterType === 'multiselect' && cfg.getValues ? cfg.getValues(ports) : [],
  [cfg, ports])

  const filteredOpts = optSearch.trim()
    ? availableValues.filter(opt =>
        opt.label.toLowerCase().includes(optSearch.toLowerCase()) ||
        opt.value.toLowerCase().includes(optSearch.toLowerCase())
      )
    : availableValues

  function toggleValue(val) {
    setLocalVal(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  function applyCommaSearch(text) {
    const terms = text.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const matches = availableValues
      .filter(opt => terms.some(t =>
        opt.label.toLowerCase().includes(t) || opt.value.toLowerCase().includes(t)
      ))
      .map(opt => opt.value)
    setLocalVal(prev => [...new Set([...prev, ...matches])])
    setOptSearch('')
  }

  function commit() {
    if (cfg.filterType === 'multiselect') {
      if (localVal.length === 0) { onRemove(); return }
      onUpdate({ fieldId: cfg.id, type: 'multiselect', values: localVal })
    } else if (cfg.filterType === 'range') {
      const min = localVal.min !== '' ? Number(localVal.min) : null
      const max = localVal.max !== '' ? Number(localVal.max) : null
      if (min == null && max == null) { onRemove(); return }
      onUpdate({ fieldId: cfg.id, type: 'range', min, max })
    }
    onClose()
  }

  return (
    <div className="fePop" style={{ top: pos.top, left: pos.left }} onMouseDown={e => e.stopPropagation()}>
      <div className="feHead">
        <span className="feTitle">{cfg.label}</span>
        <button className="feClose" onClick={onClose}>âœ•</button>
      </div>
      {cfg.filterType === 'multiselect' && (
        <>
          <div className="feSearch">
            <input
              autoFocus
              className="feSearchInp"
              placeholder="Search or paste comma-separated valuesâ€¦"
              value={optSearch}
              onChange={e => setOptSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && optSearch.includes(',')) applyCommaSearch(optSearch)
              }}
              onPaste={e => {
                const text = e.clipboardData.getData('text')
                if (text.includes(',')) { e.preventDefault(); applyCommaSearch(text) }
              }}
            />
          </div>
          <div className="feOptList">
            {filteredOpts.map(opt => {
              const on = localVal.includes(opt.value)
              return (
                <label key={opt.value} className={`feOpt${on ? ' feOptOn' : ''}`} onClick={() => toggleValue(opt.value)}>
                  <span className={`feChk${on ? ' on' : ''}`}>{on ? 'âœ“' : ''}</span>
                  <span className="feOptLabel">{opt.label}</span>
                  <span className="feOptCount">{opt.count}</span>
                </label>
              )
            })}
            {filteredOpts.length === 0 && <div className="feEmpty">No options found</div>}
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
            <input className="feRangeInp" type="number" placeholder="Min" value={localVal.min} onChange={e => setLocalVal(p => ({ ...p, min: e.target.value }))} />
          </div>
          <div className="feRangeSep">â€”</div>
          <div className="feRangeField">
            <div className="feRangeLabel">To</div>
            <input className="feRangeInp" type="number" placeholder="Max" value={localVal.max} onChange={e => setLocalVal(p => ({ ...p, max: e.target.value }))} />
          </div>
        </div>
      )}
      <div className="feFoot">
        <button className="btn btnS btnSm" onClick={() => { onRemove(); onClose() }}>Remove</button>
        <button className="btn btnP btnSm" onClick={commit}>Apply</button>
      </div>
    </div>
  )
}

function PoFilterBar({ filters, onChange, ports }) {
  const [showAdd, setShowAdd]       = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [editAnchor, setEditAnchor] = useState(null)
  const addRef = useRef(null)

  const activeIds = filters.map(f => f.fieldId)

  function addFilter(fieldId) {
    const cfg = PORT_FILTER_FIELDS.find(f => f.id === fieldId)
    if (!cfg) return
    setShowAdd(false)
    if (!filters.find(f => f.fieldId === fieldId)) {
      onChange([...filters, { fieldId, type: cfg.filterType, values: [], min: null, max: null }])
    }
    setEditingId(fieldId)
    setEditAnchor(addRef.current)
  }

  function removeFilter(fieldId) {
    onChange(filters.filter(f => f.fieldId !== fieldId))
    if (editingId === fieldId) setEditingId(null)
  }

  function updateFilter(updated) {
    onChange(filters.map(f => f.fieldId === updated.fieldId ? updated : f))
  }

  function describeFilter(f) {
    const cfg = PORT_FILTER_FIELDS.find(c => c.id === f.fieldId)
    if (!cfg) return f.fieldId
    if (f.type === 'multiselect') return `${cfg.label}: ${f.values.join(', ')}`
    if (f.type === 'range') {
      const parts = []
      if (f.min != null) parts.push(`â‰¥${f.min}`)
      if (f.max != null) parts.push(`â‰¤${f.max}`)
      return `${cfg.label}: ${parts.join(' ')}`
    }
    return cfg.label
  }

  const hasActive = filters.some(f =>
    !(f.type === 'multiselect' && (!f.values || !f.values.length)) &&
    !(f.type === 'range' && f.min == null && f.max == null)
  )

  const editingCfg    = editingId ? PORT_FILTER_FIELDS.find(f => f.id === editingId) : null
  const editingFilter = editingId ? filters.find(f => f.fieldId === editingId) : null

  return (
    <div className="fbBar">
      {filters.map(f => {
        const isEmpty = (f.type === 'multiselect' && (!f.values || !f.values.length)) ||
                        (f.type === 'range' && f.min == null && f.max == null)
        if (isEmpty) return null
        return (
          <div key={f.fieldId} className={`fbChip${editingId === f.fieldId ? ' fbChipActive' : ''}`}>
            <button className="fbChipLabel" onClick={e => { setEditingId(f.fieldId); setEditAnchor(e.currentTarget) }}>
              {describeFilter(f)}
            </button>
            <button className="fbChipRemove" onClick={() => removeFilter(f.fieldId)}>âœ•</button>
          </div>
        )
      })}
      <button ref={addRef} className="fbAddBtn" onClick={() => setShowAdd(v => !v)}>+ Add Filter</button>
      {hasActive && <button className="fbClearAll" onClick={() => onChange([])}>Clear all</button>}

      {showAdd && (
        <div className="fePop" style={{ top: (addRef.current?.getBoundingClientRect().bottom || 0) + 8, left: (addRef.current?.getBoundingClientRect().left || 0) }}>
          <div className="feHead">
            <span className="feTitle">Add Filter</span>
            <button className="feClose" onClick={() => setShowAdd(false)}>âœ•</button>
          </div>
          <div className="feOptList">
            {PORT_FILTER_FIELDS.filter(f => !activeIds.includes(f.id)).map(f => (
              <button key={f.id} className="ftLeaf" style={{ paddingLeft: 10 }} onClick={() => addFilter(f.id)}>
                <span className="ftLeafLabel">{f.label}</span>
                <span className="ftLeafType">{f.filterType}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingCfg && editingFilter && (
        <PoFilterEditor
          cfg={editingCfg} filter={editingFilter} ports={ports}
          anchorEl={editAnchor}
          onUpdate={updateFilter}
          onRemove={() => removeFilter(editingId)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}

// â”€â”€ Column Picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PoColumnPicker({ visible, onClose, selected, onChange }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(PORT_COL_GROUPS.map(g => g.key)))

  if (!visible) return null

  const optCols = PORT_COLUMNS.filter(c => !c.always)
  const alwaysCols = PORT_COLUMNS.filter(c => c.always)
  const visibleCols = PORT_COLUMNS.filter(c => c.always || selected.includes(c.id))

  const searchMatches = search.trim()
    ? optCols.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : null

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  function toggleGroup(key) {
    setExpanded(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  return (
    <div className="cpModalOverlay" onMouseDown={onClose}>
      <div className="cpModal" onMouseDown={e => e.stopPropagation()}>
        <div className="cpModalHead">
          <div>
            <div className="cpModalTitle">Column Configuration</div>
            <div className="cpModalSub">
              {selected.length} columns selected Â· Always visible: {alwaysCols.map(c => c.label).join(', ')}
            </div>
          </div>
          <button className="cpModalClose" onClick={onClose}>âœ•</button>
        </div>

        <div className="cpModalBody">
          <div className="cpLeft">
            <div className="cpLeftHead">
              <div className="cpSectionTitle">Available Columns</div>
              <div className="cpTreeSearch">
                <span className="cpTreeSearchIcon">âŒ•</span>
                <input autoFocus className="cpTreeSearchInp" placeholder="Search columnsâ€¦" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="cpTreeSearchClear" onClick={() => setSearch('')}>âœ•</button>}
              </div>
            </div>
            <div className="cpLeftList">
              {searchMatches ? (
                searchMatches.length > 0 ? searchMatches.map(col => {
                  const on = selected.includes(col.id)
                  const grp = PORT_COL_GROUPS.find(g => g.key === col.group)
                  return (
                    <button key={col.id} className={`cpTreeResult${on ? ' cpTreeResultOn' : ''}`} onClick={() => toggle(col.id)}>
                      <div className="cpTreeResultMeta">
                        <div className="cpTreeResultPath">{grp?.label || ''}</div>
                        <div className="cpTreeResultLabel">{col.label}</div>
                      </div>
                      <span className={`cpTreeChk${on ? ' on' : ''}`}>{on ? 'âœ“' : ''}</span>
                    </button>
                  )
                }) : <div style={{padding:'16px',textAlign:'center',color:'var(--txt3)',fontSize:12}}>No columns found</div>
              ) : (
                <div className="cpTree">
                  {PORT_COL_GROUPS.map(g => {
                    const cols = optCols.filter(c => c.group === g.key)
                    if (!cols.length) return null
                    const isOpen = expanded.has(g.key)
                    const selInGrp = cols.filter(c => selected.includes(c.id)).length
                    return (
                      <div key={g.key} className="cpGroup">
                        <button className={`cpTreeBranch${isOpen ? ' cpTreeOpen' : ''}`} onClick={() => toggleGroup(g.key)}>
                          <span className="cpTreeArrow">{isOpen ? 'â–¾' : 'â–¸'}</span>
                          <span className="cpTreeBranchLabel">{g.label}</span>
                          {selInGrp > 0
                            ? <span className="cpTreeBadge">{selInGrp}/{cols.length}</span>
                            : <span className="cpTreeCount">{cols.length}</span>
                          }
                        </button>
                        {isOpen && (
                          <div className="cpTreeChildren">
                            {cols.map(col => {
                              const on = selected.includes(col.id)
                              return (
                                <button key={col.id} className={`cpTreeLeaf${on ? ' cpTreeLeafOn' : ''}`} onClick={() => toggle(col.id)}>
                                  <span className={`cpTreeChk${on ? ' on' : ''}`}>{on ? 'âœ“' : ''}</span>
                                  <span className="cpTreeLeafLabel">{col.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="cpRight">
            <div className="cpRightHead">
              <div className="cpSectionTitle">Visible Columns ({visibleCols.length})</div>
              <div className="cpRightSub">Click a column to toggle Â· Fixed columns always shown</div>
            </div>
            <div className="cpRightList">
              {visibleCols.map(col => (
                <div key={col.id} className={`cpVisRow${col.always ? ' cpVisFixed' : ''}`}>
                  {col.always ? <span className="cpVisLock">ðŸ”’</span> : <span className="cpVisHandle">â ¿</span>}
                  <span className="cpVisLabel">{col.label}</span>
                  <span className="cpVisGroup">{PORT_COL_GROUPS.find(g => g.key === col.group)?.label || ''}</span>
                  {!col.always && <button className="cpVisRemove" onClick={() => toggle(col.id)} title="Remove">âœ•</button>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cpModalFoot">
          <button className="btn btnS btnSm" onClick={() => onChange([])}>Clear All</button>
          <div style={{flex:1}}/>
          <button className="btn btnS btnSm" onClick={onClose}>Cancel</button>
          <button className="btn btnP btnSm" onClick={onClose}>Done ({visibleCols.length} columns)</button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Map Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PortMap({ ports, selectedId, onSelectPort }) {
  const mapRef    = useRef(null)
  const leafletRef = useRef(null)
  const markersRef = useRef({})

  useEffect(() => {
    if (leafletRef.current) return
    leafletRef.current = L.map(mapRef.current, { center: [20, 0], zoom: 2, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Â© OpenStreetMap', maxZoom: 18
    }).addTo(leafletRef.current)
  }, [])

  useEffect(() => {
    if (!leafletRef.current) return
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    ports.forEach(p => {
      const m = L.circleMarker([p.lat, p.lon], {
        radius: 7, color: selectedId === p.id ? '#c8102e' : '#1558d6',
        fillColor: selectedId === p.id ? '#c8102e' : '#4f8ef7', fillOpacity: 0.85, weight: 2,
      }).bindPopup(`<b>${p.name}</b><br>${p.unlocode} Â· ${p.country}`)
        .on('click', () => onSelectPort(p.id))
        .addTo(leafletRef.current)
      markersRef.current[p.id] = m
    })
  }, [ports, selectedId, onSelectPort])

  return <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
}

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Ports() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search,        setSearch]        = useState('')
  const [filters,       setFilters]       = useState([])
  const [selColumns,    setSelColumns]    = useState(['country', 'type', 'mou', 'maxDraft', 'totalCalls'])
  const [showColPicker, setShowColPicker] = useState(false)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [ports]                           = useState(PORTS)
  const [sortKey,       setSortKey]       = useState('name')
  const [sortDir,       setSortDir]       = useState('asc')
  const [listTab,       setListTab]       = useState('table')
  const [activeNode,    setActiveNode]    = useState('po-identity')
  const [selLeafId,     setSelLeafId]     = useState(null)
  const [selLeafLabel,  setSelLeafLabel]  = useState(null)
  const [editMode,      setEditMode]      = useState(false)
  const [detailTab,     setDetailTab]     = useState('attrs')
  const [histPanelW,    setHistPanelW]    = useState(320)
  const [histCollapsed, setHistCollapsed] = useState(false)
  const histWidthRef = useRef(320)

  function startHistResize(e) {
    e.preventDefault()
    const startX = e.clientX, startW = histWidthRef.current
    function onMove(ev) {
      const w = Math.max(240, Math.min(600, startW - (ev.clientX - startX)))
      histWidthRef.current = w; setHistPanelW(w)
    }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.classList.remove('ew-resizing') }
    document.body.classList.add('ew-resizing')
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const detailId = searchParams.get('id')
  const port     = detailId ? ports.find(p => String(p.id) === detailId) || null : null

  const filtered = useMemo(() => {
    let list = ports
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.unlocode.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) || p.mou?.toLowerCase().includes(q)
      )
    }
    for (const f of filters) {
      if (f.type === 'multiselect' && f.values?.length) {
        if (f.fieldId === 'mou')       list = list.filter(p => f.values.includes(p.mou))
        if (f.fieldId === 'type')      list = list.filter(p => f.values.includes(p.type))
        if (f.fieldId === 'country')   list = list.filter(p => f.values.includes(p.country))
        if (f.fieldId === 'status')    list = list.filter(p => f.values.includes(p.status))
        if (f.fieldId === 'functions') list = list.filter(p => f.values.some(v => (p.functions||[]).includes(v)))
        if (f.fieldId === 'ecaZone')   list = list.filter(p => f.values.includes(p.ecaZone ? 'Yes' : 'No'))
        if (f.fieldId === 'container') list = list.filter(p => f.values.includes(p.terminals?.container?.exists ? 'Yes' : 'No'))
        if (f.fieldId === 'drydock')   list = list.filter(p => f.values.includes(p.repair?.drydock ? 'Yes' : 'No'))
        if (f.fieldId === 'lngBunker') list = list.filter(p => f.values.includes(p.bunker?.lng ? 'Yes' : 'No'))
        if (f.fieldId === 'bunker')    list = list.filter(p => f.values.includes(p.bunker?.available ? 'Yes' : 'No'))
        if (f.fieldId === 'congestion')list = list.filter(p => f.values.includes(p.congestion?.risk))
        if (f.fieldId === 'pilotage')  list = list.filter(p => f.values.includes(p.services?.pilotageCompulsory ? 'Yes' : 'No'))
        if (f.fieldId === 'vts')       list = list.filter(p => f.values.includes(p.navAids?.vts ? 'Yes' : 'No'))
      }
      if (f.type === 'range') {
        if (f.fieldId === 'calls')      { if (f.min != null) list = list.filter(p => (p.traffic?.totalCalls||0) >= f.min); if (f.max != null) list = list.filter(p => (p.traffic?.totalCalls||0) <= f.max) }
        if (f.fieldId === 'maxDraft')   { if (f.min != null) list = list.filter(p => (p.channel?.maxDraft||0) >= f.min); if (f.max != null) list = list.filter(p => (p.channel?.maxDraft||0) <= f.max) }
        if (f.fieldId === 'maxLoa')     { if (f.min != null) list = list.filter(p => (p.channel?.maxLoa||0) >= f.min); if (f.max != null) list = list.filter(p => (p.channel?.maxLoa||0) <= f.max) }
        if (f.fieldId === 'maxBeam')    { if (f.min != null) list = list.filter(p => (p.channel?.maxBeam||0) >= f.min); if (f.max != null) list = list.filter(p => (p.channel?.maxBeam||0) <= f.max) }
        if (f.fieldId === 'berthCount') { if (f.min != null) list = list.filter(p => (p.berths?.count||0) >= f.min); if (f.max != null) list = list.filter(p => (p.berths?.count||0) <= f.max) }
        if (f.fieldId === 'detRate')    { if (f.min != null) list = list.filter(p => (p.psc?.detRate||0) >= f.min); if (f.max != null) list = list.filter(p => (p.psc?.detRate||0) <= f.max) }
        if (f.fieldId === 'avgWaiting') { if (f.min != null) list = list.filter(p => (p.congestion?.avgWaiting||0) >= f.min); if (f.max != null) list = list.filter(p => (p.congestion?.avgWaiting||0) <= f.max) }
      }
    }
    return [...list].sort((a, b) => {
      let av = a.name, bv = b.name
      if (sortKey === 'country') { av = a.country; bv = b.country }
      if (sortKey === 'rank')    { av = a.traffic?.worldRank || 9999; bv = b.traffic?.worldRank || 9999 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [ports, search, filters, sortKey, sortDir])

  const visibleCols = useMemo(() => PORT_COLUMNS.filter(c => c.always || selColumns.includes(c.id)), [selColumns])

  function openDetail(id) {
    setActiveNode('po-identity'); setSelLeafId(null); setSelLeafLabel(null); setEditMode(false); setDetailTab('attrs')
    setSearchParams({ id: String(id) })
  }
  function closeDetail() { setSearchParams({}) }

  function handleSortCol(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleSelectLeaf(leafId, leafLabel) {
    setSelLeafId(prev => prev === leafId ? null : leafId)
    setSelLeafLabel(leafLabel)
  }

  const congCls = { Low: 'tG', Medium: 'tA', High: 'tR', 'Very High': 'tR' }

  // â”€â”€ Detail View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (port) {
    const histRows = selLeafLabel
      ? generatePortHistory(selLeafLabel, port, getPortAttrValue(port, selLeafId))
      : []

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        <div className="dHead">
          <button className="backBtn" onClick={closeDetail}>â† Ports</button>
          <div className="dHeadDiv"/>
          <span className="vNm">{port.name}</span>
          <span className="vdHdrMono">{port.unlocode}</span>
          <span className="tag tN" style={{ fontSize: 9 }}>{port.type}</span>
          <span className="stBadge stA" style={{ flexShrink: 0 }}><span className="stDot"/>{port.status || 'Active'}</span>
          <div className="dHeadDiv"/>
          <span className="vdHdrKpi">Country<strong>{port.country}</strong></span>
          <span className="vdHdrKpi">Max Draft<strong>{port.channel?.maxDraft ? port.channel.maxDraft + ' m' : 'â€”'}</strong></span>
          <span className="vdHdrKpi">Annual Calls<strong>{port.traffic?.totalCalls?.toLocaleString() ?? 'â€”'}</strong></span>
          <span className="vdHdrKpi">MOU<strong>{port.mou}</strong></span>
          <div className="dActs">
            <button className={`btn btnSm${editMode ? ' btnP' : ' btnT'}`} onClick={() => setEditMode(e => !e)}>
              {editMode ? 'âœ• Cancel' : 'âœŽ Edit'}
            </button>
            <button className="btn btnT btnSm">â†— Export</button>
          </div>
        </div>

        {editMode && <div className="eBan">âš  Edit mode â€” all changes versioned in bi-temporal audit log</div>}

        <div style={{ display: 'flex', gap: 0, padding: '0 16px', background: 'var(--bg)', borderBottom: '1px solid var(--bd)' }}>
          {[['attrs', 'Attributes'], ['map', 'Map View']].map(([t, l]) => (
            <button key={t}
              style={{ padding: '6px 16px', border: 'none', borderBottom: detailTab === t ? '2px solid var(--sp-red)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: detailTab === t ? 600 : 400, color: detailTab === t ? 'var(--sp-red)' : 'var(--txt2)', marginBottom: -1 }}
              onClick={() => setDetailTab(t)}>{l}</button>
          ))}
        </div>

        {detailTab === 'attrs' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <GenAttrTreeSidebar
              tree={PORT_ATTRIBUTE_TREE}
              activeNode={activeNode}
              onSelectNode={setActiveNode}
            />
            <GenAttrContentPanel
              entity={port}
              tree={PORT_ATTRIBUTE_TREE}
              getVal={getPortAttrValue}
              activeNode={activeNode}
              editMode={editMode}
              selLeafId={selLeafId}
              onSelectLeaf={handleSelectLeaf}
            />
            {selLeafId && (
              <div style={{ display: 'flex', flexShrink: 0, position: 'relative' }}>
                {!histCollapsed && (
                  <div style={{ width: histPanelW, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--bd)', overflow: 'hidden' }}>
                    <FieldEditPanel
                      vessel={port}
                      leaf={{ id: selLeafId, label: selLeafLabel }}
                      editMode={editMode}
                      curDate={null}
                      histRows={histRows}
                      onClose={() => { setSelLeafId(null); setSelLeafLabel(null) }}
                      onJumpDate={() => {}}
                    />
                  </div>
                )}
                <div className="atSbResizeHandle" style={{ position: 'absolute', left: histCollapsed ? 0 : -4, top: 0, bottom: 0, width: 8, cursor: 'ew-resize' }} onMouseDown={startHistResize} />
                <button
                  style={{ position: 'absolute', left: histCollapsed ? 4 : -14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 4, padding: '4px 3px', fontSize: 11, cursor: 'pointer', lineHeight: 1 }}
                  onClick={() => setHistCollapsed(c => !c)}
                >{histCollapsed ? 'â€¹' : 'â€º'}</button>
              </div>
            )}
          </div>
        )}

        {detailTab === 'map' && (
          <div style={{ flex: 1, position: 'relative' }}>
            <PortMap ports={[port]} selectedId={port.id} onSelectPort={() => {}} />
          </div>
        )}
      </div>
    )
  }

  // â”€â”€ List View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>

      <div className="kpiRow" style={{padding:'10px 16px',flexShrink:0,gap:10}}>
        <div className="kpi"><div className="kpiV">{ports.length}</div><div className="kpiL">Total Ports</div></div>
        <div className="kpi"><div className="kpiV">{ports.filter(p => p.ecaZone).length}</div><div className="kpiL">ECA Zones</div></div>
        <div className="kpi"><div className="kpiV">{ports.reduce((s, p) => s + (p.traffic?.totalCalls || 0), 0).toLocaleString()}</div><div className="kpiL">Annual Calls</div></div>
        <div className="kpi"><div className="kpiV">{[...new Set(ports.map(p => p.country))].length}</div><div className="kpiL">Countries</div></div>
        <div className="kpi"><div className="kpiV">{ports.filter(p => p.bunker?.lng).length}</div><div className="kpiL">LNG Bunkering</div></div>
      </div>

      <div className="sBar">
        <div className="siWrap" style={{flex:1,minWidth:260}}>
          <span className="siIc">ðŸ”</span>
          <input className="si" placeholder="Search ports by name, LOCODE, country, MOUâ€¦" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="siClear" onClick={() => setSearch('')}>âœ•</button>}
        </div>
        <button className="btn btnS btnSm" onClick={() => setSearch(search.trim())}>Search</button>
        <select className="fSel" value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="name">Sort: Name Aâ†’Z</option>
          <option value="country">Sort: Country</option>
          <option value="rank">Sort: World Rank</option>
        </select>
        <div style={{display:'flex',gap:2,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:6,padding:2}}>
          {[['table','â˜° Table'],['map','â¬¡ Map']].map(([t,l]) => (
            <button key={t} className={`btn btnSm${listTab===t?' btnP':' btnT'}`} onClick={() => setListTab(t)} style={{padding:'4px 10px'}}>{l}</button>
          ))}
        </div>
        <button className="btn btnP btnSm">+ New Port</button>
      </div>

      <div className="fbBarWrap">
        <PoFilterBar filters={filters} onChange={setFilters} ports={ports} />
        <button className="btn btnS btnSm fbColsBtn" onClick={() => setShowColPicker(true)} title="Customise columns">âŠž Columns</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0,position:'relative'}}>
        {/* Map view â€” always mounted to preserve Leaflet state */}
        <div style={{display:listTab==='map'?'flex':'none',flexDirection:'column',flex:1,overflow:'hidden'}}>
          <PortMap ports={filtered} selectedId={null} onSelectPort={openDetail} />
        </div>

        {/* Table view */}
        {listTab === 'table' && (
          <>
            <div className="rBar">
              <div>Showing <strong>{filtered.length}</strong> of <strong>{ports.length}</strong> ports</div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {selectedIds.size > 0 && (
                  <>
                    <span style={{fontSize:11,color:'var(--txt2)'}}><strong>{selectedIds.size}</strong> selected</span>
                    <button className="btn btnSm" style={{background:'var(--red)',color:'#fff',border:'none',padding:'3px 10px'}}
                      onClick={() => setSelectedIds(new Set())}>
                      ðŸ—‘ Delete ({selectedIds.size})
                    </button>
                    <button className="btn btnS btnSm" onClick={() => setSelectedIds(new Set())}>Deselect All</button>
                  </>
                )}
                <button className="btn btnS btnSm" onClick={() => exportToExcel(
                  filtered, visibleCols,
                  (colId, row) => getPortCellValue(row, colId),
                  `ports-${new Date().toISOString().slice(0,10)}`
                )}>â¬‡ Export Excel</button>
                <div style={{fontSize:10,color:'var(--txt3)'}}>{visibleCols.length} columns</div>
              </div>
            </div>
            <div className="tWrap">
              <table className="vt">
                <thead>
                  <tr>
                    <th style={{width:26}}>
                      <input type="checkbox"
                        checked={filtered.length > 0 && filtered.every(p => selectedIds.has(p.id))}
                        ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !filtered.every(p => selectedIds.has(p.id)) }}
                        onChange={() => {
                          const allSel = filtered.every(p => selectedIds.has(p.id))
                          setSelectedIds(allSel ? new Set() : new Set(filtered.map(p => p.id)))
                        }}
                      />
                    </th>
                    {visibleCols.map(c => (
                      <th key={c.id} onClick={() => handleSortCol(c.id)} style={{cursor:'pointer',userSelect:'none'}}>
                        {c.label}{sortKey===c.id?(sortDir==='asc'?' â–²':' â–¼'):''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} onClick={() => openDetail(p.id)} style={{cursor:'pointer'}}>
                      <td><input type="checkbox" checked={selectedIds.has(p.id)}
                          onChange={() => setSelectedIds(prev => { const s=new Set(prev); s.has(p.id)?s.delete(p.id):s.add(p.id); return s })}
                          onClick={e => e.stopPropagation()}
                        /></td>
                      {visibleCols.map(c => {
                        const v = getPortCellValue(p, c.id)
                        if (c.id === 'name')       return <td key={c.id} style={{whiteSpace:'nowrap'}}><button className="vLnk">{v}</button></td>
                        if (c.id === 'congestion') return <td key={c.id}><span className={`tag ${congCls[v]||'tN'}`}>{v}</span></td>
                        return <td key={c.id} style={{fontSize:11}}>{v}</td>
                      })}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={visibleCols.length+1} style={{textAlign:'center',padding:32,color:'var(--txt3)'}}>No ports match the current filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <PoColumnPicker visible={showColPicker} onClose={() => setShowColPicker(false)} selected={selColumns} onChange={setSelColumns} />
    </div>
  )
}
