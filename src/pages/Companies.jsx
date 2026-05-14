import { useState, useMemo, useRef } from 'react'
import { exportToExcel } from '../utils/exportCsv'
import { useSearchParams } from 'react-router-dom'
import GenAttrTreeSidebar from '../components/shared/GenAttrTreeSidebar'
import GenAttrContentPanel from '../components/shared/GenAttrContentPanel'
import FieldEditPanel from '../components/vessels/FieldEditPanel'
import {
  COMPANIES,
  getCompanyAttrValue, generateCompanyHistory,
  CO_FILTER_FIELDS, CO_COL_GROUPS, CO_COLUMNS,
  STATUS_CLS, getCompanyCellValue,
} from '../data/companies'
import { buildAttrTree } from '../data/attributeRegistry'

const COMPANY_ATTRIBUTE_TREE = buildAttrTree('company')

// ── Inline Filter Bar ────────────────────────────────────────────────────────
function CoFilterEditor({ cfg, filter, companies, onUpdate, onRemove, onClose, anchorEl }) {
  const [localVal, setLocalVal] = useState(() => {
    if (cfg.filterType === 'multiselect') return filter?.values || []
    if (cfg.filterType === 'range') return { min: filter?.min ?? '', max: filter?.max ?? '' }
    return ''
  })
  const [optSearch, setOptSearch] = useState('')
  const popRef = useRef(null)

  const rect = anchorEl?.getBoundingClientRect() || { bottom: 0, left: 0 }
  const pos = { top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 320) }

  const availableValues = useMemo(() =>
    cfg.filterType === 'multiselect' && cfg.getValues ? cfg.getValues(companies) : [],
  [cfg, companies])

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
    <div ref={popRef} className="fePop" style={{ top: pos.top, left: pos.left }} onMouseDown={e => e.stopPropagation()}>
      <div className="feHead">
        <span className="feTitle">{cfg.label}</span>
        <button className="feClose" onClick={onClose}>✕</button>
      </div>
      {cfg.filterType === 'multiselect' && (
        <>
          <div className="feSearch">
            <input
              autoFocus
              className="feSearchInp"
              placeholder="Search or paste comma-separated values…"
              value={optSearch}
              onChange={e => setOptSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && optSearch.trim()) {
                  optSearch.includes(',') ? applyCommaSearch(optSearch) : undefined
                }
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
                  <span className={`feChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
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
          <div className="feRangeSep">—</div>
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

function CoFilterBar({ filters, onChange, companies }) {
  const [showAdd, setShowAdd]       = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [editAnchor, setEditAnchor] = useState(null)
  const addRef = useRef(null)

  const activeIds = filters.map(f => f.fieldId)

  function addFilter(fieldId) {
    const cfg = CO_FILTER_FIELDS.find(f => f.id === fieldId)
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
    const cfg = CO_FILTER_FIELDS.find(c => c.id === f.fieldId)
    if (!cfg) return f.fieldId
    if (f.type === 'multiselect') return `${cfg.label}: ${f.values.join(', ')}`
    if (f.type === 'range') {
      const parts = []
      if (f.min != null) parts.push(`≥${f.min}`)
      if (f.max != null) parts.push(`≤${f.max}`)
      return `${cfg.label}: ${parts.join(' ')}`
    }
    return cfg.label
  }

  const hasActive = filters.some(f =>
    !(f.type === 'multiselect' && (!f.values || !f.values.length)) &&
    !(f.type === 'range' && f.min == null && f.max == null)
  )

  const editingCfg    = editingId ? CO_FILTER_FIELDS.find(f => f.id === editingId) : null
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
            <button className="fbChipRemove" onClick={() => removeFilter(f.fieldId)}>✕</button>
          </div>
        )
      })}

      <button ref={addRef} className="fbAddBtn" onClick={() => setShowAdd(v => !v)}>+ Add Filter</button>
      {hasActive && <button className="fbClearAll" onClick={() => onChange([])}>Clear all</button>}

      {showAdd && (
        <div className="fePop" style={{ top: (addRef.current?.getBoundingClientRect().bottom || 0) + 8, left: (addRef.current?.getBoundingClientRect().left || 0) }}>
          <div className="feHead">
            <span className="feTitle">Add Filter</span>
            <button className="feClose" onClick={() => setShowAdd(false)}>✕</button>
          </div>
          <div className="feOptList">
            {CO_FILTER_FIELDS.filter(f => !activeIds.includes(f.id)).map(f => (
              <button key={f.id} className="ftLeaf" style={{ paddingLeft: 10 }} onClick={() => addFilter(f.id)}>
                <span className="ftLeafLabel">{f.label}</span>
                <span className="ftLeafType">{f.filterType}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingCfg && editingFilter && (
        <CoFilterEditor
          cfg={editingCfg} filter={editingFilter} companies={companies}
          anchorEl={editAnchor}
          onUpdate={updateFilter}
          onRemove={() => removeFilter(editingId)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}

// ── Column Picker ────────────────────────────────────────────────────────────
function CoColumnPicker({ visible, onClose, selected, onChange }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(CO_COL_GROUPS.map(g => g.key)))

  if (!visible) return null

  const optCols = CO_COLUMNS.filter(c => !c.always)
  const alwaysCols = CO_COLUMNS.filter(c => c.always)
  const visibleCols = CO_COLUMNS.filter(c => c.always || selected.includes(c.id))

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
              {selected.length} columns selected · Always visible: {alwaysCols.map(c => c.label).join(', ')}
            </div>
          </div>
          <button className="cpModalClose" onClick={onClose}>✕</button>
        </div>

        <div className="cpModalBody">
          <div className="cpLeft">
            <div className="cpLeftHead">
              <div className="cpSectionTitle">Available Columns</div>
              <div className="cpTreeSearch">
                <span className="cpTreeSearchIcon">⌕</span>
                <input autoFocus className="cpTreeSearchInp" placeholder="Search columns…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="cpTreeSearchClear" onClick={() => setSearch('')}>✕</button>}
              </div>
            </div>
            <div className="cpLeftList">
              {searchMatches ? (
                searchMatches.length > 0 ? searchMatches.map(col => {
                  const on = selected.includes(col.id)
                  const grp = CO_COL_GROUPS.find(g => g.key === col.group)
                  return (
                    <button key={col.id} className={`cpTreeResult${on ? ' cpTreeResultOn' : ''}`} onClick={() => toggle(col.id)}>
                      <div className="cpTreeResultMeta">
                        <div className="cpTreeResultPath">{grp?.label || ''}</div>
                        <div className="cpTreeResultLabel">{col.label}</div>
                      </div>
                      <span className={`cpTreeChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                    </button>
                  )
                }) : <div className="ftEmpty" style={{padding:'16px',textAlign:'center',color:'var(--txt3)',fontSize:12}}>No columns found</div>
              ) : (
                <div className="cpTree">
                  {CO_COL_GROUPS.map(g => {
                    const cols = optCols.filter(c => c.group === g.key)
                    if (!cols.length) return null
                    const isOpen = expanded.has(g.key)
                    const selInGrp = cols.filter(c => selected.includes(c.id)).length
                    return (
                      <div key={g.key} className="cpGroup">
                        <button className={`cpTreeBranch${isOpen ? ' cpTreeOpen' : ''}`} onClick={() => toggleGroup(g.key)}>
                          <span className="cpTreeArrow">{isOpen ? '▾' : '▸'}</span>
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
                                  <span className={`cpTreeChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
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
              <div className="cpRightSub">Click a column to toggle · Fixed columns always shown</div>
            </div>
            <div className="cpRightList">
              {visibleCols.map(col => (
                <div key={col.id} className={`cpVisRow${col.always ? ' cpVisFixed' : ''}`}>
                  {col.always ? <span className="cpVisLock">🔒</span> : <span className="cpVisHandle">⠿</span>}
                  <span className="cpVisLabel">{col.label}</span>
                  <span className="cpVisGroup">{CO_COL_GROUPS.find(g => g.key === col.group)?.label || ''}</span>
                  {!col.always && <button className="cpVisRemove" onClick={() => toggle(col.id)} title="Remove">✕</button>}
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

// ── Ownership Org Chart ──────────────────────────────────────────────────────
function OrgChartSVG({ company }) {
  if (!company) return null

  const nodes = []
  const edges = []

  const topName = company.group?.name || company.ubo?.name || 'No Parent'
  nodes.push({ id: 'top', x: 300, y: 20, w: 200, h: 44, label: topName, sub: company.group ? 'Group' : 'Beneficial Owner', color: '#4f46e5', fill: '#ede9fe' })

  if (company.parent) {
    nodes.push({ id: 'parent', x: 240, y: 110, w: 200, h: 44, label: company.parent.name, sub: `${company.parent.pct}% parent`, color: '#7c3aed', fill: '#f3e8ff' })
    edges.push({ from: 'top', to: 'parent' })
  }

  const mainY = company.parent ? 200 : 110
  nodes.push({ id: 'main', x: 240, y: mainY, w: 200, h: 44, label: company.name, sub: company.type, color: '#0891b2', fill: '#e0f2fe', bold: true })
  edges.push({ from: company.parent ? 'parent' : 'top', to: 'main' })

  const subs = company.subsidiaries?.slice(0, 3) || []
  subs.forEach((s, i) => {
    const xPos = 40 + i * 220
    const yPos = mainY + 90
    nodes.push({ id: `sub${i}`, x: xPos, y: yPos, w: 180, h: 44, label: s.name, sub: s.country, color: '#059669', fill: '#d1fae5' })
    edges.push({ from: 'main', to: `sub${i}` })
  })

  const maxY = Math.max(...nodes.map(n => n.y + n.h)) + 30
  const maxX = Math.max(...nodes.map(n => n.x + n.w)) + 40

  function cx(n) { return n.x + n.w / 2 }
  function getNode(id) { return nodes.find(n => n.id === id) }

  return (
    <svg width="100%" viewBox={`0 0 ${maxX} ${maxY}`} style={{ maxHeight: 380 }}>
      <defs>
        {nodes.map(n => (
          <linearGradient key={n.id} id={`g${n.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={n.fill} />
            <stop offset="100%" stopColor={n.fill} stopOpacity="0.6" />
          </linearGradient>
        ))}
      </defs>
      {edges.map((e, i) => {
        const src = getNode(e.from), tgt = getNode(e.to)
        if (!src || !tgt) return null
        const x1 = cx(src), y1 = src.y + src.h
        const x2 = cx(tgt), y2 = tgt.y
        const my = (y1 + y2) / 2
        return <path key={i} d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" />
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="6" fill={`url(#g${n.id})`} stroke={n.color} strokeWidth={n.bold ? 2 : 1} />
          <text x={n.x + n.w / 2} y={n.y + 17} textAnchor="middle" fontSize="10" fontWeight={n.bold ? '600' : '500'} fill={n.color} fontFamily="system-ui">{n.label}</text>
          <text x={n.x + n.w / 2} y={n.y + 32} textAnchor="middle" fontSize="8.5" fill="#64748b" fontFamily="system-ui">{n.sub}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search,        setSearch]        = useState('')
  const [filters,       setFilters]       = useState([])
  const [selColumns,    setSelColumns]    = useState(['type', 'country', 'city', 'fleet', 'pscRisk'])
  const [showColPicker, setShowColPicker] = useState(false)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [companies]                       = useState(COMPANIES)
  const [sortKey,       setSortKey]       = useState('name')
  const [sortDir,       setSortDir]       = useState('asc')
  const [activeNode,    setActiveNode]    = useState('co-identity')
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
  const company  = detailId ? companies.find(c => String(c.id) === detailId) || null : null

  const filtered = useMemo(() => {
    let list = companies
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)  || c.lrNumber?.toLowerCase().includes(q)
      )
    }
    for (const f of filters) {
      if (f.type === 'multiselect' && f.values?.length) {
        if (f.fieldId === 'type')       list = list.filter(c => f.values.includes(c.type))
        if (f.fieldId === 'country')    list = list.filter(c => f.values.includes(c.country))
        if (f.fieldId === 'status')     list = list.filter(c => f.values.includes(c.status))
        if (f.fieldId === 'pp')         list = list.filter(c => f.values.includes(c.publicPrivate || 'Private'))
        if (f.fieldId === 'roles')      list = list.filter(c => f.values.some(v => (c.roles||[]).includes(v)))
        if (f.fieldId === 'psc-risk')   list = list.filter(c => f.values.includes(c.psc?.risk))
        if (f.fieldId === 'ism-auditor')list = list.filter(c => f.values.includes(c.ism?.auditor))
        if (f.fieldId === 'mlc')        list = list.filter(c => f.values.includes(c.esg?.mlc === 'Compliant' ? 'Compliant' : 'Non-compliant'))
        if (f.fieldId === 'sanctions')  list = list.filter(c => { const listed = [c.sanctions?.ofac, c.sanctions?.un, c.sanctions?.eu].some(Boolean); return f.values.includes(listed ? 'Listed' : 'Clear') })
        if (f.fieldId === 'ofac')       list = list.filter(c => f.values.includes(c.sanctions?.ofac ? 'Yes' : 'No'))
        if (f.fieldId === 'amlRisk')    list = list.filter(c => f.values.includes(c.kyc?.amlRisk))
        if (f.fieldId === 'kycTier')    list = list.filter(c => f.values.includes(c.kyc?.tier))
        if (f.fieldId === 'cii')        list = list.filter(c => f.values.includes(c.esg?.ciiAvg))
        if (f.fieldId === 'poseidon')   list = list.filter(c => f.values.includes(c.esg?.poseidon ? 'Yes' : 'No'))
        if (f.fieldId === 'iso14001')   list = list.filter(c => f.values.includes(c.esg?.iso14001 ? 'Yes' : 'No'))
        if (f.fieldId === 'creditRisk') list = list.filter(c => f.values.includes(c.credit?.payRisk))
      }
      if (f.type === 'range') {
        if (f.fieldId === 'fleet')       { if (f.min != null) list = list.filter(c => (c.fleet?.total||0) >= f.min); if (f.max != null) list = list.filter(c => (c.fleet?.total||0) <= f.max) }
        if (f.fieldId === 'avgage')      { if (f.min != null) list = list.filter(c => (c.fleet?.avgage||0) >= f.min); if (f.max != null) list = list.filter(c => (c.fleet?.avgage||0) <= f.max) }
        if (f.fieldId === 'foundedYear') { if (f.min != null) list = list.filter(c => (c.foundedYear||0) >= f.min); if (f.max != null) list = list.filter(c => (c.foundedYear||0) <= f.max) }
        if (f.fieldId === 'employees')   { if (f.min != null) list = list.filter(c => (c.employees||0) >= f.min); if (f.max != null) list = list.filter(c => (c.employees||0) <= f.max) }
        if (f.fieldId === 'detRate')     { if (f.min != null) list = list.filter(c => parseFloat(c.psc?.detRate||0) >= f.min); if (f.max != null) list = list.filter(c => parseFloat(c.psc?.detRate||0) <= f.max) }
      }
    }
    return [...list].sort((a, b) => {
      let av = a.name, bv = b.name
      if (sortKey === 'country') { av = a.country; bv = b.country }
      if (sortKey === 'fleet')   { av = a.fleet?.total || 0; bv = b.fleet?.total || 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [companies, search, filters, sortKey, sortDir])

  const visibleCols = useMemo(() => CO_COLUMNS.filter(c => c.always || selColumns.includes(c.id)), [selColumns])

  function openDetail(id) {
    setActiveNode('co-identity'); setSelLeafId(null); setSelLeafLabel(null); setEditMode(false); setDetailTab('attrs')
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

  // ── Detail View ──────────────────────────────────────────────────────────
  if (company) {
    const histRows = selLeafLabel
      ? generateCompanyHistory(selLeafLabel, company, getCompanyAttrValue(company, selLeafId))
      : []

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        <div className="dHead">
          <button className="backBtn" onClick={closeDetail}>← Companies</button>
          <div className="dHeadDiv"/>
          <span className="vNm">{company.name}</span>
          <span className="vdHdrMono">{company.lrNumber}</span>
          <span className="tag tN" style={{ fontSize: 9 }}>{company.type}</span>
          <span className={`stBadge ${STATUS_CLS[company.status] || 'stI'}`} style={{ flexShrink: 0 }}>
            <span className="stDot"/>{company.status}
          </span>
          <div className="dHeadDiv"/>
          <span className="vdHdrKpi">Country<strong>{company.country}</strong></span>
          <span className="vdHdrKpi">Fleet<strong>{company.fleet?.total ?? '—'}</strong></span>
          <span className="vdHdrKpi">Founded<strong>{company.foundedYear ?? '—'}</strong></span>
          <span className="vdHdrKpi">Employees<strong>{company.employees?.toLocaleString() ?? '—'}</strong></span>
          <div className="dActs">
            <button className={`btn btnSm${editMode ? ' btnP' : ' btnT'}`} onClick={() => setEditMode(e => !e)}>
              {editMode ? '✕ Cancel' : '✎ Edit'}
            </button>
            <button className="btn btnT btnSm">↗ Export</button>
          </div>
        </div>

        {editMode && <div className="eBan">⚠ Edit mode — all changes versioned in bi-temporal audit log</div>}

        <div style={{ display: 'flex', gap: 0, padding: '0 16px', background: 'var(--bg)', borderBottom: '1px solid var(--bd)' }}>
          {[['attrs', 'Attributes'], ['orgchart', 'Org Chart']].map(([t, l]) => (
            <button key={t}
              style={{ padding: '6px 16px', border: 'none', borderBottom: detailTab === t ? '2px solid var(--sp-red)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: detailTab === t ? 600 : 400, color: detailTab === t ? 'var(--sp-red)' : 'var(--txt2)', marginBottom: -1 }}
              onClick={() => setDetailTab(t)}>{l}</button>
          ))}
        </div>

        {detailTab === 'attrs' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <GenAttrTreeSidebar
              tree={COMPANY_ATTRIBUTE_TREE}
              activeNode={activeNode}
              onSelectNode={setActiveNode}
            />
            <GenAttrContentPanel
              entity={company}
              tree={COMPANY_ATTRIBUTE_TREE}
              getVal={getCompanyAttrValue}
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
                      vessel={company}
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
                >{histCollapsed ? '‹' : '›'}</button>
              </div>
            )}
          </div>
        )}

        {detailTab === 'orgchart' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Corporate Ownership Hierarchy</span>
            </div>
            <OrgChartSVG company={company} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 24 }}>
              {[
                ['Ultimate Beneficial Owner', company.ubo?.name || '—'],
                ['UBO Country', company.ubo?.country || '—'],
                ['UBO Ownership %', company.ubo?.pct ? company.ubo.pct + '%' : '—'],
                ['Parent Company', company.parent?.name || 'None'],
                ['Group', company.group?.name || '—'],
                ['Subsidiaries', String(company.subsidiaries?.length || 0)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── List View ────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>

      <div className="kpiRow" style={{padding:'10px 16px',flexShrink:0,gap:10}}>
        <div className="kpi"><div className="kpiV">{companies.length}</div><div className="kpiL">Total Companies</div></div>
        <div className="kpi"><div className="kpiV">{companies.filter(c => c.publicPrivate === 'Public').length}</div><div className="kpiL">Listed</div></div>
        <div className="kpi"><div className="kpiV">{companies.reduce((s, c) => s + (c.fleet?.total || 0), 0)}</div><div className="kpiL">Total Fleet</div></div>
        <div className="kpi"><div className="kpiV">{companies.filter(c => [c.sanctions?.ofac, c.sanctions?.un, c.sanctions?.eu].some(Boolean)).length}</div><div className="kpiL">Sanctioned</div></div>
        <div className="kpi"><div className="kpiV">{companies.filter(c => c.status === 'Active').length}</div><div className="kpiL">Active</div></div>
      </div>

      <div className="sBar">
        <div className="siWrap" style={{flex:1,minWidth:260}}>
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search companies by name, country, type, LR number…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="siClear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <button className="btn btnS btnSm" onClick={() => setSearch(search.trim())}>Search</button>
        <select className="fSel" value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="name">Sort: Name A→Z</option>
          <option value="country">Sort: Country</option>
          <option value="fleet">Sort: Fleet Size</option>
        </select>
        <button className="btn btnP btnSm">+ New Company</button>
      </div>

      <div className="fbBarWrap">
        <CoFilterBar filters={filters} onChange={setFilters} companies={companies} />
        <button className="btn btnS btnSm fbColsBtn" onClick={() => setShowColPicker(true)} title="Customise columns">⊞ Columns</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
        <div className="rBar">
          <div>Showing <strong>{filtered.length}</strong> of <strong>{companies.length}</strong> companies</div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {selectedIds.size > 0 && (
              <>
                <span style={{fontSize:11,color:'var(--txt2)'}}><strong>{selectedIds.size}</strong> selected</span>
                <button className="btn btnSm" style={{background:'var(--red)',color:'#fff',border:'none',padding:'3px 10px'}}
                  onClick={() => setSelectedIds(new Set())}>
                  🗑 Delete ({selectedIds.size})
                </button>
                <button className="btn btnS btnSm" onClick={() => setSelectedIds(new Set())}>Deselect All</button>
              </>
            )}
            <button className="btn btnS btnSm" onClick={() => exportToExcel(
              filtered, visibleCols,
              (colId, row) => getCompanyCellValue(row, colId),
              `companies-${new Date().toISOString().slice(0,10)}`
            )}>⬇ Export Excel</button>
            <div style={{fontSize:10,color:'var(--txt3)'}}>{visibleCols.length} columns</div>
          </div>
        </div>
        <div className="tWrap">
          <table className="vt">
            <thead>
              <tr>
                <th style={{width:26}}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every(co => selectedIds.has(co.id))}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !filtered.every(co => selectedIds.has(co.id)) }}
                    onChange={() => {
                      const allSel = filtered.every(co => selectedIds.has(co.id))
                      setSelectedIds(allSel ? new Set() : new Set(filtered.map(co => co.id)))
                    }}
                  />
                </th>
                {visibleCols.map(c => (
                  <th key={c.id} onClick={() => handleSortCol(c.id)} style={{cursor:'pointer',userSelect:'none'}}>
                    {c.label}{sortKey === c.id ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(co => (
                <tr key={co.id} onClick={() => openDetail(co.id)} style={{cursor:'pointer'}}>
                  <td><input type="checkbox" checked={selectedIds.has(co.id)}
                    onChange={() => setSelectedIds(prev => { const s=new Set(prev); s.has(co.id)?s.delete(co.id):s.add(co.id); return s })}
                    onClick={e => e.stopPropagation()}
                  /></td>
                  {visibleCols.map(c => {
                    const v = getCompanyCellValue(co, c.id)
                    if (c.id === 'name')    return <td key={c.id} style={{whiteSpace:'nowrap'}}><button className="vLnk">{v}</button></td>
                    if (c.id === 'status')  return <td key={c.id}><span className={`stBadge ${STATUS_CLS[v] || 'stI'}`}><span className="stDot"/>{v}</span></td>
                    if (c.id === 'sanc')    return <td key={c.id}><span className={`tag ${v === 'Listed' ? 'tR' : 'tG'}`}>{v}</span></td>
                    if (c.id === 'pscRisk') return <td key={c.id}><span className={`tag ${{ Low: 'tG', Medium: 'tA', High: 'tR', 'Very High': 'tR' }[v] || 'tN'}`}>{v}</span></td>
                    return <td key={c.id} style={{fontSize:11}}>{v}</td>
                  })}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={visibleCols.length + 1} style={{textAlign:'center',padding:32,color:'var(--txt3)'}}>No companies match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CoColumnPicker visible={showColPicker} onClose={() => setShowColPicker(false)} selected={selColumns} onChange={setSelColumns} />
    </div>
  )
}
