import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { generateHistory } from '../data/vesselTimeline'
import { getAttrValue, LEAF_TEMPORAL_MAP, ALL_VESSEL_COLUMNS, getCellValue, applyFilters } from '../data/attributeRegistry'
import { VESSELS, STATUS_CLASSES, srcBadgeClass, srcBadgeLabel } from '../data/vessels'
import { useTemporalDate } from '../hooks/useTemporalDate'
import BiTemporalTimeline from '../components/vessels/BiTemporalTimeline'
import AttrTreeSidebar from '../components/vessels/AttrTreeSidebar'
import AttrContentPanel from '../components/vessels/AttrContentPanel'
import FieldEditPanel from '../components/vessels/FieldEditPanel'
import FilterBuilder from '../components/vessels/FilterBuilder'
import ColumnPickerModal from '../components/vessels/ColumnPickerModal'
import { usePreferences } from '../contexts/PreferencesContext'
import { parseSearch, applySearch, describeFilters } from '../utils/searchParser'
import { exportToExcel } from '../utils/exportCsv'


export default function Vessels() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { vesselColumns, attrFavorites, toggleAttrFavorite, persona,
          vesselFilters, updateVesselFilters } = usePreferences()

  // Navigation: ?id=N or ?imo=XXXXXXX → detail view, ?date=YYYY-MM-DD → temporal position
  const detailId  = searchParams.get('id')
  const imoParam  = searchParams.get('imo')
  const dateParam = searchParams.get('date')
  const vessel = imoParam  ? VESSELS.find(v => v.imo === imoParam)          || null
               : detailId ? VESSELS.find(v => String(v.id) === detailId) || null : null

  const [search,        setSearch]        = useState('')
  const [activeFilters, setActiveFilters] = useState(() => vesselFilters)
  const [showColPicker, setShowColPicker] = useState(false)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [activeNode,    setActiveNode]    = useState('general')
  const [selLeafId,     setSelLeafId]     = useState(null)
  const [selLeafLabel,  setSelLeafLabel]  = useState(null)
  const [editMode,      setEditMode]      = useState(false)
  const [showTimeline,  setShowTimeline]  = useState(true)
  const [sortKey,       setSortKey]       = useState('name')
  const [sortDir,       setSortDir]       = useState('asc')
  const [histPanelWidth,     setHistPanelWidth]     = useState(320)
  const [histPanelCollapsed, setHistPanelCollapsed] = useState(false)
  const histWidthRef = useRef(320)

  function startHistResize(e) {
    e.preventDefault()
    const startX = e.clientX
    const startW = histWidthRef.current
    function onMove(ev) {
      const newW = Math.max(240, Math.min(600, startW - (ev.clientX - startX)))
      histWidthRef.current = newW
      setHistPanelWidth(newW)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.classList.remove('ew-resizing')
    }
    document.body.classList.add('ew-resizing')
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const { curDate, setCurDate, dateToPct, jumpToMilestone, events, TL_START_YR, TL_END_YR } = useTemporalDate(vessel)

  // Sync date from URL param (deep link from AIS / Dashboard)
  useEffect(() => {
    if (dateParam && vessel) setCurDate(dateParam)
  }, [vessel?.id, dateParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // Smart search + filter builder filters combined
  const filtered = useMemo(() => {
    let vl = VESSELS

    if (search.trim()) {
      const parsed = parseSearch(search)
      vl = applySearch(vl, parsed)
    }

    vl = applyFilters(vl, activeFilters)

    vl = [...vl].sort((a, b) => {
      let av = a.nm, bv = b.nm
      if (sortKey === 'imo')   { av = a.imo;  bv = b.imo  }
      if (sortKey === 'built') { av = a.yr;   bv = b.yr   }
      if (sortKey === 'dwt')   { av = Number(a.dwt.replace(/,/g,'')); bv = Number(b.dwt.replace(/,/g,'')) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return vl
  }, [search, activeFilters, sortKey, sortDir])

  // Search interpretation hints
  const searchHints = useMemo(() => {
    if (!search.trim()) return []
    const parsed = parseSearch(search)
    return describeFilters(parsed)
  }, [search])

  // Columns to show
  const visibleColumns = useMemo(() =>
    ALL_VESSEL_COLUMNS.filter(c => c.always || vesselColumns.includes(c.id)),
  [vesselColumns])

  function openDetail(id) {
    setActiveNode('general'); setSelLeafId(null); setSelLeafLabel(null)
    setEditMode(false); setShowTimeline(false)
    setSearchParams({ id: String(id) })
  }

  function closeDetail() {
    setSearchParams({})
  }

  // Date-aware voyage — changes by month so it reacts to curDate on the timeline
  function getVoyageData(v, date) {
    const PORTS = ['Rotterdam','Singapore','Shanghai','Fujairah','Houston','Long Beach','Hamburg','Mumbai','Busan','Antwerp','Yokohama','Ningbo','Guangzhou','Port Klang','Piraeus']
    const d    = date ? new Date(date) : new Date()
    const seed = parseInt(v.imo.replace(/\D/g,'').slice(-4), 10) + d.getFullYear() * 100 + d.getMonth()
    const dep  = PORTS[seed % PORTS.length]
    const arr  = PORTS[(seed * 3 + 7) % PORTS.length]
    const voyDays = 10 + (seed % 16)             // 10-25 day voyage
    const prog    = 0.05 + (seed % 90) / 100     // 5-94% progress at this date
    const depDt   = new Date(d.getTime() - Math.round(prog * voyDays) * 86400000)
    const etaDt   = new Date(d.getTime() + Math.round((1 - prog) * voyDays) * 86400000)
    const fmt = dt => dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    return { dep, arr, prog, depDate: fmt(depDt), etaDate: fmt(etaDt) }
  }

  const TYPE_TAGS = {
    'Container Ship':'container,ship','Oil Tanker':'oil,tanker,ship',
    'LNG Carrier':'lng,tanker,vessel','LPG Carrier':'lpg,tanker,vessel',
    'Bulk Carrier':'bulk,carrier,ship','Chemical Tanker':'chemical,tanker,ship',
    'Car Carrier':'car,carrier,ship','Passenger/Cruise':'cruise,ship,passenger',
    'Offshore Wind':'offshore,wind,vessel','Offshore Supply':'offshore,supply,vessel',
    'RoRo':'roro,ferry,ship','Research Vessel':'research,vessel,ship',
    'General Cargo':'cargo,ship,vessel',
  }

  function vesselPhotoUrl(ty, imo, idx) {
    const tags = TYPE_TAGS[ty] || 'cargo,ship'
    const lock  = (parseInt(imo.replace(/\D/g,'').slice(-4), 10) * 7 + idx * 31) % 200 + 1
    return `https://loremflickr.com/240/160/${tags}?lock=${lock}`
  }

  if (vessel) {
    const voyage = getVoyageData(vessel, curDate)
    // Resolve exact entity key + label for mapped leaves; fall back to tree label for others
    const leafMeta     = selLeafId ? LEAF_TEMPORAL_MAP[selLeafId] : null
    const histLabel    = leafMeta ? leafMeta.label    : selLeafLabel
    const histEntity   = leafMeta ? leafMeta.entity   : null
    const histFallback = selLeafId ? getAttrValue(vessel, selLeafId) : null
    const histRows = selLeafLabel
      ? generateHistory(histLabel, vessel, histEntity, histFallback)
      : []
    const histOpen = selLeafId !== null

    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>

        {/* ── Compact vessel bar ── */}
        <div className="dHead">
          <button className="backBtn" onClick={closeDetail}>← Fleet</button>
          <div className="dHeadDiv"/>
          <span className="vdHeadFlag">{vessel.flag}</span>
          <span className="vNm">{vessel.nm}</span>
          <span className="vdHdrMono">IMO {vessel.imo}</span>
          <span className="tag tN" style={{fontSize:9,flexShrink:0}}>{vessel.ty}</span>
          <span className={`stBadge ${STATUS_CLASSES[vessel.st]||'stI'}`} style={{flexShrink:0}}><span className="stDot"/>{vessel.st}</span>
          <div className="dHeadDiv"/>
          <span className="vdHdrKpi">DWT<strong>{vessel.dwt}</strong></span>
          <span className="vdHdrKpi">GT<strong>{vessel.gt}</strong></span>
          <span className="vdHdrKpi">LOA<strong>{vessel.loa}</strong></span>
          <span className="vdHdrKpi">Built<strong>{vessel.yr}</strong></span>
          <div className="dActs">
            <button
              className={`btn btnSm${showTimeline ? ' btnP' : ' btnT'}`}
              onClick={() => setShowTimeline(t => !t)}
              title="Toggle bi-temporal timeline"
            >⏱ Timeline</button>
            <button className="btn btnT btnSm" onClick={() => setEditMode(e=>!e)}>
              {editMode ? '✕ Cancel' : '✎ Edit'}
            </button>
            <button className="btn btnT btnSm">↗ Export</button>
            <button className="btn btnT btnSm" onClick={() => navigate('/movements')}>🗺 Track</button>
            <button className="btn btnT btnSm" onClick={() => navigate('/psc')}>🔍 PSC</button>
          </div>
        </div>

        {editMode && <div className="eBan">⚠ Edit mode — all changes versioned in bi-temporal audit log (valid_from / valid_to / transaction_time)</div>}

        {/* ── Collapsible bi-temporal timeline ── */}
        {showTimeline && (
          <BiTemporalTimeline
            vessel={vessel} curDate={curDate} onDateChange={setCurDate}
            dateToPct={dateToPct} jumpToMilestone={jumpToMilestone}
            events={events} TL_START_YR={TL_START_YR} TL_END_YR={TL_END_YR}
          />
        )}

        {/* ── 3-panel body: tree | attributes | history ── */}
        <div className={`vdBody${histOpen ? ' histOpen' : ''}`}>

          {/* Left column: sidebar with voyage card + image strip injected at top */}
          <AttrTreeSidebar
            key={vessel.id}
            vessel={vessel}
            curDate={curDate}
            activeNode={activeNode}
            favorites={attrFavorites}
            onToggleFavorite={toggleAttrFavorite}
            personaAttrSections={persona.attrSections}
            onSelectNode={id => { setActiveNode(id); setSelLeafId(null); setSelLeafLabel(null) }}
            topContent={<>
              <div className="vdImgStrip">
                <div className="vdImgStripHd">
                  <span className="vdVoyageCardTitle">Vessel Images</span>
                  <button className="vdImgMoreBtn" onClick={() => navigate(`/vessel-images?imo=${vessel.imo}`)}>📷 All →</button>
                </div>
                <div className="vdImgRow">
                  {[0,1,2].map(i => (
                    <div key={i} className="vdImgThumb"
                      onClick={() => navigate(`/vessel-images?imo=${vessel.imo}`)}>
                      <img
                        src={vesselPhotoUrl(vessel.ty, vessel.imo, i)}
                        alt={`${vessel.nm} ${i+1}`}
                        className="vdImgThumbImg"
                        loading="lazy"
                        onError={e => { e.target.src = `https://loremflickr.com/80/60/ship,vessel?lock=${vessel.id+i}` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="vdVoyageCard">
                <div className="vdVoyageCardHd">
                  <span className="vdVoyageCardTitle">Current Voyage</span>
                  <span className="vdVoyageCardDate">{curDate || new Date().toISOString().slice(0,10)}</span>
                </div>
                <div className="vdVoyageCardBody">
                  <div className="vdVcPort">
                    <span className="vdVcDot" style={{ background:'#16a34a' }}/>
                    <div className="vdVcPortInfo">
                      <span className="vdVcPortName">{voyage.dep}</span>
                      <span className="vdVcPortDate">{voyage.depDate}</span>
                    </div>
                  </div>
                  <div className="vdVcTrack">
                    <div className="vdVcBar">
                      <div className="vdVcFill" style={{ width:`${Math.round(voyage.prog * 100)}%` }}/>
                      <span className="vdVcShip" style={{ left:`${Math.round(voyage.prog * 100)}%` }}>🚢</span>
                    </div>
                    <span className="vdVcPct">{Math.round(voyage.prog * 100)}%</span>
                  </div>
                  <div className="vdVcPort">
                    <span className="vdVcDot" style={{ background:'#dc2626' }}/>
                    <div className="vdVcPortInfo">
                      <span className="vdVcPortName">{voyage.arr}</span>
                      <span className="vdVcPortDate">ETA {voyage.etaDate}</span>
                    </div>
                  </div>
                </div>
                <div className="vdVoyageCardActs">
                  <button className="vdVcActBtn" onClick={() => navigate('/gis-ais')}>🔮 Route Forecast</button>
                  <button className="vdVcActBtn" onClick={() => navigate('/gis-ais')}>🛤 Past Track</button>
                </div>
              </div>
            </>}
          />

          {/* Centre: all attributes for selected node */}
          <AttrContentPanel
            vessel={vessel}
            activeNode={activeNode}
            editMode={editMode}
            selLeafId={selLeafId}
            curDate={curDate}
            onSelectLeaf={(id, label) => { setSelLeafId(id); setSelLeafLabel(label); setHistPanelCollapsed(false) }}
          />

          {/* Right: field edit + history panel */}
          <div
            className={`vdHistPanel${histOpen ? ' histOpen' : ''}${histOpen && histPanelCollapsed ? ' histCollapsed' : ''}`}
            style={histOpen && !histPanelCollapsed ? { flex: `0 0 ${histPanelWidth}px`, width: histPanelWidth } : undefined}
          >
            {histOpen && (
              <>
                <div className="vdHistResizeHandle" onMouseDown={startHistResize} title="Drag to resize" />
                <div className="vdHistHeader">
                  <button
                    className="vdHistCollapseBtn"
                    onClick={() => setHistPanelCollapsed(c => !c)}
                    title={histPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >{histPanelCollapsed ? '‹' : '›'}</button>
                  {!histPanelCollapsed && <span className="vdHistHeaderTitle">Field History</span>}
                </div>
              </>
            )}
            {!histPanelCollapsed && (
              <FieldEditPanel
                vessel={vessel}
                leaf={selLeafId ? { id: selLeafId, label: selLeafLabel } : null}
                editMode={editMode}
                curDate={curDate}
                histRows={histRows}
                onClose={() => { setSelLeafId(null); setSelLeafLabel(null) }}
                onJumpDate={setCurDate}
              />
            )}
          </div>
        </div>

        {editMode && (
          <div className="eActBar">
            <button className="btn btnS" onClick={() => setEditMode(false)}>Cancel</button>
            <button className="btn btnP" onClick={() => setEditMode(false)}>💾 Save Changes</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
      {/* Search + toolbar */}
      <div className="sBar">
        <div className="siWrap" style={{flex:1,minWidth:260}}>
          <span className="siIc">🔍</span>
          <input
            className="si"
            placeholder='Search: name, IMO, flag, owner… or try "vlcc detained", "built>2015 container", "flag:panama"'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="siClear" onClick={() => setSearch('')} title="Clear search">✕</button>}
        </div>
        <button className="btn btnS btnSm" onClick={() => setSearch(search.trim())}>Search</button>
        <select className="fSel" value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="name">Sort: Name A→Z</option>
          <option value="imo">Sort: IMO ↑</option>
          <option value="built">Sort: Built Year</option>
          <option value="dwt">Sort: DWT</option>
        </select>
        <button className="btn btnP btnSm">+ Add Vessel</button>
      </div>

      {/* Search interpretation hints */}
      {searchHints.length > 0 && (
        <div className="searchHints">
          <span className="searchHintsLabel">Searching by:</span>
          {searchHints.map((h, i) => <span key={i} className="tag tB" style={{fontSize:9}}>{h}</span>)}
        </div>
      )}

      {/* Filter builder bar + column picker */}
      <div className="fbBarWrap">
        <FilterBuilder
          filters={activeFilters}
          onChange={f => { setActiveFilters(f); updateVesselFilters(f) }}
          vessels={VESSELS}
        />
        <button className="btn btnS btnSm fbColsBtn" onClick={() => setShowColPicker(true)} title="Customise columns">⊞ Columns</button>
      </div>

      {/* Results bar */}
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
        <div className="rBar">
          <div>Showing <strong>{filtered.length}</strong> of <strong>847,392</strong> vessels</div>
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
              filtered, visibleColumns,
              (colId, row) => getCellValue(colId, row),
              `vessels-${new Date().toISOString().slice(0,10)}`
            )}>⬇ Export Excel</button>
            <div style={{fontSize:10,color:'var(--txt3)'}}>{visibleColumns.length} columns · {vesselColumns.length} configured</div>
          </div>
        </div>

        {/* Table */}
        <div className="tWrap">
          <table className="vt">
            <thead>
              <tr>
                <th style={{width:26}}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every(v => selectedIds.has(v.id))}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !filtered.every(v => selectedIds.has(v.id)) }}
                    onChange={() => {
                      const allSel = filtered.every(v => selectedIds.has(v.id))
                      setSelectedIds(allSel ? new Set() : new Set(filtered.map(v => v.id)))
                    }}
                  />
                </th>
                {visibleColumns.map(col => (
                  <th key={col.id} style={{minWidth:col.width,cursor:'pointer',userSelect:'none'}} onClick={() => {
                    if (sortKey===col.id) setSortDir(d=>d==='asc'?'desc':'asc')
                    else { setSortKey(col.id); setSortDir('asc') }
                  }}>
                    {col.label}{sortKey===col.id ? (sortDir==='asc'?' ▲':' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const sc = STATUS_CLASSES[v.st] || 'stI'
                return (
                  <tr key={v.id}>
                    <td><input type="checkbox" checked={selectedIds.has(v.id)}
                      onChange={() => setSelectedIds(prev => { const s=new Set(prev); s.has(v.id)?s.delete(v.id):s.add(v.id); return s })}
                      onClick={e => e.stopPropagation()}
                    /></td>
                    {visibleColumns.map(col => {
                      const val = getCellValue(col, v)
                      if (col.id === 'name') return (
                        <td key={col.id} style={{whiteSpace:'nowrap'}}>
                          <span className="vtFlagBadge">{v.fl}</span>
                          <button className="vLnk" onClick={() => openDetail(v.id)}>{v.nm}</button>
                        </td>
                      )
                      if (col.id === 'imo') return <td key={col.id} className="mn" style={{fontSize:11}}>{v.imo}</td>
                      if (col.id === 'mmsi') return <td key={col.id} className="mn" style={{fontSize:11}}>{v.mmsi}</td>
                      if (col.id === 'type') return <td key={col.id}><span className="tag tN" style={{fontSize:9}}>{v.ty}</span></td>
                      if (col.id === 'status') return <td key={col.id}><span className={`stBadge ${sc}`}><span className="stDot"/>{v.st}</span></td>
                      if (col.id === 'class') return <td key={col.id}><span className="tag tN" style={{fontSize:9}}>{v.cls}</span></td>
                      if (['dwt','gt','nt','mcr'].includes(col.id)) return <td key={col.id} className="mn" style={{fontSize:11}}>{val}</td>
                      return (
                        <td key={col.id} style={{fontSize:11,maxWidth:col.width,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {typeof val === 'string' ? val : '—'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pgBar">
          {[1,2,3,'…',847].map((p,i) => typeof p==='number'
            ? <button key={i} className={`pgBtn${p===1?' on':''}`}>{p}</button>
            : <span key={i} style={{color:'var(--txt3)',fontSize:11,padding:'0 4px'}}>{p}</span>
          )}
          <span style={{fontSize:11,color:'var(--txt3)',marginLeft:'auto'}}>Page 1 of 33,895 · 25 per page</span>
        </div>
      </div>

      {/* Column picker modal */}
      {showColPicker && <ColumnPickerModal onClose={() => setShowColPicker(false)} />}
    </div>
  )
}