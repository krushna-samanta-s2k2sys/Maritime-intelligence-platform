import { useState, useMemo, Fragment } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ETLSubNav from '../components/etl/ETLSubNav'

/* ─── Mock data ───────────────────────────────────────────────────────────── */
const REVIEW_VESSELS = [
  { id:'rv001', imo:'9412345', name:'PACIFIC STAR',    type:'Container Ship',  flag:'GR', vendor:"Lloyd's Register", pipeline:"Lloyd's Register — Class Notation", fields:4,  priority:'high',   reason:'GT/DWT conflict + class notation update' },
  { id:'rv002', imo:'9287631', name:'EASTERN PIONEER', type:'Oil Tanker',       flag:'SG', vendor:'IHS Fairplay',     pipeline:'IHS Fairplay — Vessel Registry',   fields:2,  priority:'medium', reason:'Flag code mismatch (XX vs SG)' },
  { id:'rv003', imo:'9534892', name:'STELLAR WIND',    type:'LNG Carrier',      flag:'JP', vendor:"Lloyd's Register", pipeline:"Lloyd's Register — Class Notation", fields:6,  priority:'high',   reason:'Owner change: Tokyo Gas → Pacific LNG Holdings' },
  { id:'rv004', imo:'9412340', name:'GULF VOYAGER',    type:'Container Ship',   flag:'SA', vendor:'IHS Fairplay',     pipeline:'IHS Fairplay — Vessel Registry',   fields:1,  priority:'low',    reason:'Built year discrepancy (2007 vs 2008)' },
  { id:'rv005', imo:'9341122', name:'OCEAN PRIDE',     type:'Bulk Carrier',     flag:'PA', vendor:'Bureau Veritas',   pipeline:'Bureau Veritas — Certificates',    fields:3,  priority:'medium', reason:"P&I club change + new class survey date" },
  { id:'rv006', imo:'9601234', name:'PACIFIC ATLAS',   type:'Bulk Carrier',     flag:'HK', vendor:'DNV GL',           pipeline:'DNV GL — Class & Surveys',         fields:2,  priority:'low',    reason:'LOA updated (229.0 m → 229.2 m)' },
  { id:'rv007', imo:'9188741', name:'NORTHERN STAR',   type:'Chemical Tanker',  flag:'NO', vendor:'IHS Fairplay',     pipeline:'IHS Fairplay — Vessel Registry',   fields:5,  priority:'high',   reason:'Ownership change — 3 vendors disagree' },
  { id:'rv008', imo:'9778532', name:'MAERSK COLON',    type:'Container Ship',   flag:'DK', vendor:"Lloyd's Register", pipeline:"Lloyd's Register — Class Notation", fields:1,  priority:'low',    reason:'Class notation suffix updated' },
]

/* all-source-field rows per vessel: match = 'exact'|'close'|'conflict' */
const SOURCE_FIELDS = {
  rv001: [
    { field:'imo_number',       mf:'vessel.imo_number',       label:'IMO Number',         src:'9412345',                          master:'9412345',                          match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'9412345',ok:true},{name:'DNV',v:'9412345',ok:true}] },
    { field:'vessel_name',      mf:'vessel.vessel_name',      label:'Vessel Name',        src:'PACIFIC STAR',                     master:'PACIFIC STAR',                     match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'PACIFIC STAR',ok:true}] },
    { field:'flag_code',        mf:'vessel.flag_code',        label:'Flag Code',          src:'GR',                               master:'GR',                               match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'GR',ok:true},{name:'DNV',v:'GR',ok:true}] },
    { field:'gross_tonnage',    mf:'vessel.gt',               label:'Gross Tonnage',      src:'62,400',                           master:'52,400',                           match:'conflict', conf:60,  qc:'fail', others:[{name:'IHS',v:'52,400',ok:true},{name:'DNV',v:'52,350',ok:true}], issue:"LR value is 19% higher than the vendor consensus (52,400). Likely a data-entry error at source." },
    { field:'net_tonnage',      mf:'vessel.nt',               label:'Net Tonnage',        src:'34,200',                           master:'28,600',                           match:'conflict', conf:55,  qc:'fail', others:[{name:'IHS',v:'28,600',ok:true},{name:'DNV',v:'28,580',ok:true}], issue:"NT proportionally elevated alongside GT — same LR source row suspected." },
    { field:'dwt',              mf:'vessel.dwt',              label:'Deadweight (DWT)',   src:'66,000',                           master:'66,000',                           match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'66,000',ok:true}] },
    { field:'loa',              mf:'vessel.loa',              label:'Length Overall',     src:'294.1 m',                          master:'294.1 m',                          match:'exact',    conf:99,  qc:'pass', others:[{name:'IHS',v:'294.1 m',ok:true}] },
    { field:'year_built',       mf:'vessel.year_built',       label:'Year Built',         src:'2002',                             master:'2002',                             match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'2002',ok:true},{name:'DNV',v:'2002',ok:true}] },
    { field:'class_notation',   mf:'vessel.class_notation',   label:'Class Notation',     src:'100A1 Container Ship LMC UMS IWS', master:'100A1 Container Ship LMC UMS',     match:'close',    conf:88,  qc:'pass', others:[{name:'IHS',v:'100A1 Container Ship LMC UMS',ok:true}], issue:'LR added "IWS" suffix (In-Water Survey notation). May be a genuine classification update.' },
    { field:'last_survey_date', mf:'vessel.last_survey_date', label:'Last Survey Date',   src:'2024-02-10',                       master:'2023-06-15',                       match:'conflict', conf:92,  qc:'pass', others:[{name:'IHS',v:'2023-06-15',ok:true}], issue:'LR reports a more recent survey date — likely a genuine update from a periodic class survey.' },
    { field:'vessel_type',      mf:'vessel.vessel_type',      label:'Vessel Type',        src:'Container Ship',                   master:'Container Ship',                   match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'Container Ship',ok:true},{name:'DNV',v:'Container Ship',ok:true}] },
    { field:'call_sign',        mf:'vessel.call_sign',        label:'Call Sign',          src:'SVCD3',                            master:'SVCD3',                            match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'SVCD3',ok:true}] },
  ],
  rv002: [
    { field:'imo_number',        mf:'vessel.imo_number',        label:'IMO Number',        src:'9287631',             master:'9287631',             match:'exact',    conf:100, qc:'pass', others:[{name:'LR',v:'9287631',ok:true}] },
    { field:'vessel_name',       mf:'vessel.vessel_name',       label:'Vessel Name',       src:'EASTERN PIONEER',     master:'EASTERN PIONEER',     match:'exact',    conf:100, qc:'pass', others:[{name:'LR',v:'EASTERN PIONEER',ok:true}] },
    { field:'flag_code',         mf:'vessel.flag_code',         label:'Flag Code',         src:'XX',                  master:'SG',                  match:'conflict', conf:45,  qc:'fail', others:[{name:'LR',v:'SG',ok:true},{name:'DNV',v:'SG',ok:true}], issue:'IHS reports flag "XX" (not a valid ISO 3166-1 code). All other vendors confirm "SG" (Singapore). Reject this value.' },
    { field:'gross_tonnage',     mf:'vessel.gt',                label:'Gross Tonnage',     src:'81,000',              master:'81,000',              match:'exact',    conf:100, qc:'pass', others:[{name:'LR',v:'81,000',ok:true}] },
    { field:'vessel_type',       mf:'vessel.vessel_type',       label:'Vessel Type',       src:'Oil Tanker',          master:'Oil Tanker',          match:'exact',    conf:100, qc:'pass', others:[{name:'LR',v:'Oil Tanker',ok:true}] },
    { field:'year_built',        mf:'vessel.year_built',        label:'Year Built',        src:'2009',                master:'2009',                match:'exact',    conf:100, qc:'pass', others:[{name:'LR',v:'2009',ok:true}] },
    { field:'registered_owner',  mf:'vessel.registered_owner',  label:'Registered Owner',  src:'Eastern Shipping Pte Ltd', master:'Eastern Shipping Pte Ltd', match:'exact', conf:95, qc:'pass', others:[] },
    { field:'mmsi',              mf:'vessel.mmsi',              label:'MMSI',              src:'563123456',           master:'563123456',           match:'exact',    conf:100, qc:'pass', others:[{name:'LR',v:'563123456',ok:true}] },
  ],
  rv003: [
    { field:'imo_number',          mf:'vessel.imo_number',          label:'IMO Number',          src:'9534892',                   master:'9534892',                match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'9534892',ok:true},{name:'Equasis',v:'9534892',ok:true}] },
    { field:'vessel_name',         mf:'vessel.vessel_name',         label:'Vessel Name',         src:'STELLAR WIND',              master:'STELLAR WIND',           match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'STELLAR WIND',ok:true}] },
    { field:'flag_code',           mf:'vessel.flag_code',           label:'Flag Code',           src:'JP',                        master:'JP',                     match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'JP',ok:true}] },
    { field:'registered_owner',    mf:'vessel.registered_owner',    label:'Registered Owner',    src:'Pacific LNG Holdings Ltd',  master:'Tokyo Gas Shipping',     match:'conflict', conf:70,  qc:'pass', others:[{name:'IHS',v:'Tokyo Gas Shipping',ok:true},{name:'Equasis',v:'Pacific LNG Holdings Ltd',ok:false}], issue:'Two vendors (LR + Equasis) report ownership transferred. IHS still shows old owner. Requires verification before accepting.' },
    { field:'technical_manager',   mf:'vessel.technical_manager',   label:'Technical Manager',   src:'Pacific Ship Management',   master:'Mitsui OSK Lines',       match:'conflict', conf:72,  qc:'pass', others:[{name:'IHS',v:'Mitsui OSK Lines',ok:true},{name:'Equasis',v:'Pacific Ship Management',ok:false}], issue:'Follows reported ownership change. Verify with operator directly before updating.' },
    { field:'gross_tonnage',       mf:'vessel.gt',                  label:'Gross Tonnage',       src:'152,000',                   master:'152,000',                match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'152,000',ok:true}] },
    { field:'loa',                 mf:'vessel.loa',                 label:'Length Overall',      src:'299.0 m',                   master:'299.0 m',                match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'299.0 m',ok:true}] },
    { field:'year_built',          mf:'vessel.year_built',          label:'Year Built',          src:'2015',                      master:'2015',                   match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'2015',ok:true}] },
    { field:'vessel_type',         mf:'vessel.vessel_type',         label:'Vessel Type',         src:'LNG Carrier',               master:'LNG Carrier',            match:'exact',    conf:100, qc:'pass', others:[{name:'IHS',v:'LNG Carrier',ok:true}] },
    { field:'class_notation',      mf:'vessel.class_notation',      label:'Class Notation',      src:'✠100A1 LNG Carrier +E IWS', master:'✠100A1 LNG Carrier +E',  match:'close',    conf:88,  qc:'pass', others:[{name:'IHS',v:'✠100A1 LNG Carrier +E',ok:true}], issue:'LR added IWS suffix. Consistent with similar PACIFIC STAR update — likely a genuine classification change.' },
    { field:'last_drydock_date',   mf:'vessel.last_drydock_date',   label:'Last Drydock Date',   src:'2025-08-20',                master:'2023-04-12',             match:'conflict', conf:85,  qc:'pass', others:[{name:'IHS',v:'2025-08-20',ok:false}], issue:'Both LR and IHS agree drydock completed Aug 2025. Master record not yet updated.' },
  ],
}

const PRIO_CLS = { high:'stR', medium:'stD', low:'stA' }

const MATCH = {
  exact:    { icon:'=', color:'#16a34a', rowBg:'transparent'  },
  close:    { icon:'≈', color:'#d97706', rowBg:'#fffbeb80'    },
  conflict: { icon:'!', color:'#dc2626', rowBg:'#fef2f280'    },
}

const DEC_STYLE = {
  accept:   { active:'#16a34a', activeBg:'#f0fdf4', label:'✓ Accept' },
  keep:     { active:'#475569', activeBg:'#f1f5f9', label:'⊘ Keep'   },
  override: { active:'#7c3aed', activeBg:'#f5f3ff', label:'✎ Edit'   },
}

function decBtn(dec, type, onClick) {
  const s = DEC_STYLE[type]
  const on = dec === type
  return (
    <button onClick={onClick} style={{
      background: on ? s.activeBg : 'transparent',
      color: on ? s.active : 'var(--txt3)',
      border: `1px solid ${on ? s.active : 'var(--bd)'}`,
      borderRadius:4, fontSize:10, fontWeight:700, padding:'3px 9px',
      cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', transition:'all .1s',
    }}>{s.label}</button>
  )
}

function confColor(c) { return c >= 90 ? '#16a34a' : c >= 70 ? '#d97706' : '#dc2626' }

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ETLReview() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const initPipeline = location.state?.pipeline || 'All'

  const [selVessel,      setSelVessel]      = useState(null)
  const [decisions,      setDecisions]      = useState({})         // {vid: {field: 'accept'|'keep'|'override'}}
  const [overrideVals,   setOverrideVals]   = useState({})         // {vid: {field: str}}
  const [comments,       setComments]       = useState({})         // {vid: {field: str}}
  const [expandedField,  setExpandedField]  = useState(null)
  const [prioFilter,     setPrioFilter]     = useState('All')
  const [pipelineFilter, setPipelineFilter] = useState(initPipeline)
  const [searchQ,        setSearchQ]        = useState('')
  const [showAll,        setShowAll]        = useState(false)
  const [saved,          setSaved]          = useState(new Set())

  const pipelines = ['All', ...new Set(REVIEW_VESSELS.map(v => v.pipeline))]

  const filtered = useMemo(() => REVIEW_VESSELS.filter(v => {
    if (prioFilter !== 'All' && v.priority !== prioFilter) return false
    if (pipelineFilter !== 'All' && v.pipeline !== pipelineFilter) return false
    if (searchQ && !v.name.toLowerCase().includes(searchQ.toLowerCase()) && !v.imo.includes(searchQ)) return false
    return true
  }), [prioFilter, pipelineFilter, searchQ])

  const allFields     = selVessel ? (SOURCE_FIELDS[selVessel.id] || []) : []
  const conflictFields = allFields.filter(f => f.match !== 'exact')
  const displayFields  = showAll ? allFields : conflictFields

  const vid  = selVessel?.id
  const vDec = vid ? (decisions[vid]    || {}) : {}
  const vOvr = vid ? (overrideVals[vid] || {}) : {}
  const vCmt = vid ? (comments[vid]     || {}) : {}

  function setDec(field, val) {
    if (!vid) return
    setDecisions(p => ({ ...p, [vid]: { ...(p[vid] || {}), [field]: val } }))
    setExpandedField(val === 'override' ? field : null)
  }
  function setOvr(field, val) {
    if (!vid) return
    setOverrideVals(p => ({ ...p, [vid]: { ...(p[vid] || {}), [field]: val } }))
  }
  function setCmt(field, val) {
    if (!vid) return
    setComments(p => ({ ...p, [vid]: { ...(p[vid] || {}), [field]: val } }))
  }
  function saveToMaster() {
    if (selVessel) setSaved(p => new Set([...p, selVessel.id]))
  }

  const decidedCount   = Object.keys(vDec).length
  const conflictCount  = conflictFields.length
  const allDecided     = decidedCount >= conflictCount && conflictCount > 0

  const COL = '28px 1fr 190px 190px 160px 210px'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', minHeight:0 }}>

      <ETLSubNav
        metrics={{ review: REVIEW_VESSELS.length }}
      />

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* ── Left queue panel ── */}
        <div style={{ width:260, flexShrink:0, borderRight:'1px solid var(--bd)', display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg)' }}>

          <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--bd)', background:'var(--bg2)', flexShrink:0 }}>
            <div className="siWrap" style={{ marginBottom:6 }}>
              <span className="siIc">🔍</span>
              <input className="si" placeholder="Search vessel…" value={searchQ}
                onChange={e => setSearchQ(e.target.value)} style={{ fontSize:11 }}/>
            </div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
              {['All','high','medium','low'].map(p => (
                <button key={p}
                  className={`btn btnSm${prioFilter===p?' btnP':' btnS'}`}
                  style={{ fontSize:9, padding:'2px 7px' }}
                  onClick={() => setPrioFilter(p)}>
                  {p==='All' ? 'All' : p[0].toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
            <select className="fSel" style={{ width:'100%', fontSize:10 }}
              value={pipelineFilter} onChange={e => setPipelineFilter(e.target.value)}>
              {pipelines.map(p => <option key={p} value={p}>{p==='All' ? 'All Pipelines' : p}</option>)}
            </select>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.map(v => (
              <div key={v.id}
                className={`etlRevVesselRow${selVessel?.id===v.id?' on':''}${saved.has(v.id)?' resolved':''}`}
                onClick={() => { setSelVessel(v); setExpandedField(null); setShowAll(false) }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:12, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.name}</span>
                  <span className={`stBadge ${PRIO_CLS[v.priority]}`} style={{ fontSize:7, flexShrink:0 }}><span className="stDot"/>{v.priority}</span>
                  {saved.has(v.id) && <span style={{ color:'#16a34a', fontSize:12 }}>✓</span>}
                </div>
                <div style={{ fontSize:9, color:'var(--txt3)', marginBottom:2 }}>IMO {v.imo} · {v.type}</div>
                <div style={{ fontSize:9, color:'var(--txt2)', marginBottom:2 }}>
                  {v.fields} field{v.fields!==1?'s':''} need review · <span style={{color:'var(--txt3)'}}>{v.vendor}</span>
                </div>
                <div style={{ fontSize:9, color:'var(--txt3)', lineHeight:1.4 }}>{v.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right comparison area ── */}
        {selVessel ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

            {/* Record bar */}
            <div className="etlRevVesselBar">
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:800, fontSize:15 }}>{selVessel.name}</span>
                  <code style={{ fontSize:10, color:'var(--txt3)', fontFamily:'monospace' }}>IMO {selVessel.imo}</code>
                  <span className="tag tN" style={{ fontSize:9 }}>{selVessel.type}</span>
                  <span className={`stBadge ${PRIO_CLS[selVessel.priority]}`} style={{ fontSize:8 }}><span className="stDot"/>{selVessel.priority} priority</span>
                </div>
                <div style={{ fontSize:10, color:'var(--txt3)' }}>
                  Source vendor: <strong style={{color:'var(--txt2)'}}>{selVessel.vendor}</strong>
                  &nbsp;·&nbsp;Pipeline: <strong style={{color:'var(--txt2)'}}>{selVessel.pipeline}</strong>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, color: allDecided?'#16a34a':'var(--txt3)' }}>
                  {allDecided ? '✓ All decided' : `${decidedCount}/${conflictCount} fields decided`}
                </span>
                <button className="btn btnS btnSm" onClick={() => setShowAll(v => !v)}>
                  {showAll ? '← Conflicts only' : `Show all ${allFields.length} fields`}
                </button>
                <button className="btn btnP btnSm" onClick={saveToMaster}>💾 Save to Master</button>
              </div>
            </div>

            {/* Column header */}
            <div style={{ display:'grid', gridTemplateColumns:COL, padding:'6px 14px',
              background:'var(--bg2)', borderBottom:'2px solid var(--bd)', flexShrink:0,
              fontSize:9, fontWeight:700, color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.4px', gap:0 }}>
              <div></div>
              <div>Field</div>
              <div>Source — {selVessel.vendor.split(' ')[0]}</div>
              <div>Current Master</div>
              <div>Other Vendors</div>
              <div>Decision</div>
            </div>

            {/* Field rows */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {displayFields.length === 0 ? (
                <div className="etlEmptyState">
                  <div className="etlEmptyIcon">✓</div>
                  <div>All source fields exactly match the master — no conflicts.</div>
                  <button className="btn btnS btnSm" onClick={() => setShowAll(true)}>Show all {allFields.length} fields</button>
                </div>
              ) : (
                <>
                  {displayFields.map(f => {
                    const mm  = MATCH[f.match] || MATCH.exact
                    const dec = vDec[f.field]
                    const expanded = expandedField === f.field

                    const rowBg = dec==='accept'  ? '#f0fdf4'
                                : dec==='keep'    ? '#f8fafc'
                                : dec==='override'? '#faf5ff'
                                : mm.rowBg

                    return (
                      <Fragment key={f.field}>
                        {/* Main field row */}
                        <div style={{ display:'grid', gridTemplateColumns:COL, gap:0,
                          padding:'9px 14px', borderBottom:'1px solid var(--bd)',
                          alignItems:'center', background:rowBg, transition:'background .15s' }}>

                          {/* Match indicator */}
                          <div style={{ textAlign:'center', fontWeight:800, fontSize:14, color:mm.color, lineHeight:1 }}>{mm.icon}</div>

                          {/* Field name */}
                          <div>
                            <div style={{ fontWeight:600, fontSize:11, marginBottom:1 }}>{f.label}</div>
                            <code style={{ fontSize:9, color:'var(--txt3)' }}>{f.mf}</code>
                            {f.qc !== 'pass' && <span style={{ fontSize:9, color:'#dc2626', marginLeft:6, fontWeight:700 }}>QC {f.qc.toUpperCase()}</span>}
                          </div>

                          {/* Source value */}
                          <div style={{ paddingRight:8 }}>
                            <div style={{ fontWeight:700, fontSize:12,
                              color: f.match==='conflict'?'#dc2626': f.match==='close'?'#d97706':'var(--txt)',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {f.src}
                            </div>
                            <div style={{ fontSize:9, color:confColor(f.conf), fontWeight:600 }}>{f.conf}% confidence</div>
                          </div>

                          {/* Master value */}
                          <div style={{ fontSize:11, color:'var(--txt2)', paddingRight:8,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {f.master}
                          </div>

                          {/* Other vendors */}
                          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                            {f.others.length === 0
                              ? <span style={{ fontSize:9, color:'var(--txt3)' }}>No other data</span>
                              : f.others.slice(0,3).map((o,i) => (
                                  <div key={i} style={{ fontSize:9, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    <span style={{ color:o.ok?'#16a34a':'#dc2626', fontWeight:700 }}>{o.ok?'✓':'✗'}</span>
                                    <span style={{ color:'var(--txt3)', marginLeft:2 }}>{o.name}:</span>
                                    <span style={{ color:'var(--txt2)', marginLeft:3 }}>{o.v}</span>
                                  </div>
                                ))
                            }
                          </div>

                          {/* Decision buttons */}
                          <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
                            {f.match === 'exact' ? (
                              <span style={{ fontSize:10, color:'#16a34a', fontWeight:600 }}>✓ Matched</span>
                            ) : (
                              <>
                                {decBtn(dec, 'accept',   () => setDec(f.field, 'accept'))}
                                {decBtn(dec, 'keep',     () => setDec(f.field, 'keep'))}
                                {decBtn(dec, 'override', () => { setDec(f.field,'override') })}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded override row */}
                        {expanded && (
                          <div style={{ background:'#faf5ff', borderBottom:'1px solid var(--bd)',
                            padding:'12px 14px 12px 56px' }}>
                            {f.issue && (
                              <div style={{ fontSize:10, color:'#92400e', background:'#fffbeb',
                                border:'1px solid #fde68a', borderRadius:4, padding:'6px 10px',
                                marginBottom:10, lineHeight:1.5 }}>⚠ {f.issue}</div>
                            )}
                            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                              <div className="etlFG" style={{ flex:'1 1 180px' }}>
                                <label>Override value</label>
                                <input className="etlInput" placeholder={`Current master: ${f.master}`}
                                  value={vOvr[f.field]||''} onChange={e => setOvr(f.field, e.target.value)}/>
                              </div>
                              <div className="etlFG" style={{ flex:'2 1 240px' }}>
                                <label>Comment / reason</label>
                                <input className="etlInput" placeholder="Explain the override…"
                                  value={vCmt[f.field]||''} onChange={e => setCmt(f.field, e.target.value)}/>
                              </div>
                              <button className="btn btnS btnSm" style={{ alignSelf:'flex-end' }}
                                onClick={() => setExpandedField(null)}>Done</button>
                            </div>
                          </div>
                        )}
                      </Fragment>
                    )
                  })}

                  {/* Show-all toggle footer */}
                  {!showAll && allFields.some(f => f.match==='exact') && (
                    <div style={{ padding:'10px 14px', background:'var(--bg2)',
                      fontSize:10, color:'var(--txt3)', display:'flex', alignItems:'center', gap:8 }}>
                      <span>{allFields.filter(f=>f.match==='exact').length} exact-match fields hidden.</span>
                      <button className="btn btnS btnSm" style={{fontSize:9}} onClick={() => setShowAll(true)}>Show all fields</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Save bar */}
            <div className="etlSaveBar">
              <div style={{ fontSize:11 }}>
                {conflictCount === 0
                  ? <span style={{color:'#16a34a'}}>✓ No conflicts — ready to confirm</span>
                  : allDecided
                    ? <span style={{color:'#16a34a'}}>✓ All {conflictCount} conflict{conflictCount!==1?'s':''} decided — ready to save</span>
                    : <span style={{color:'#d97706'}}>⚠ {conflictCount-decidedCount} field{conflictCount-decidedCount!==1?'s':''} still need a decision</span>
                }
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btnS" onClick={() => { setSelVessel(null); setExpandedField(null) }}>← Back to queue</button>
                <button className="btn btnP" onClick={saveToMaster}>💾 Save to Master</button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, color:'var(--txt3)' }}>
            <div style={{ fontSize:44, opacity:.25 }}>👁</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--txt2)' }}>Select a record from the queue to begin review</div>
            <div style={{ fontSize:11 }}>{REVIEW_VESSELS.filter(v=>v.priority==='high').length} high-priority records are waiting</div>
          </div>
        )}
      </div>
    </div>
  )
}
