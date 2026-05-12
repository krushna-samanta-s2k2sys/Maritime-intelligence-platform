import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ETLSubNav from '../components/etl/ETLSubNav'

/* ─── Static reference data ──────────────────────────────────────────────── */
const ENTITY_OPTS = ['Vessel', 'Port', 'Company', 'Market', 'Compliance']
const CONN_TYPES  = ['BigQuery', 'S3', 'PubSub', 'PostgreSQL', 'Kafka', 'SFTP', 'REST']
const QC_TYPES    = ['Format', 'Range', 'Completeness', 'Reference', 'Cross-field']
const XFM_TYPES   = ['Function', 'Lookup', 'Regex', 'Conversion', 'Combine', 'Split', 'SQL']
const SEVERITY    = ['error', 'warn', 'info']
const WRITE_MODES = ['MERGE (upsert)', 'APPEND', 'REPLACE partition']
const LOAD_MODES  = ['Delta', 'Full Reload', 'Streaming']
const MATCH_TYPES = ['exact', 'fuzzy', 'fuzzy+exact', 'phonetic']
const MATCH_ACTIONS = ['Update', 'Review', 'Skip']

const INIT_PROFILES = [
  { id:'cp1', name:'BigQuery — Raw Landing',  type:'BigQuery',    project:'sp-maritime-prod',    dataset:'raw_landing',        location:'EU' },
  { id:'cp2', name:'BigQuery — Master',        type:'BigQuery',    project:'sp-maritime-prod',    dataset:'vessel_master',      location:'EU' },
  { id:'cp3', name:'BigQuery — Staging',       type:'BigQuery',    project:'sp-maritime-staging', dataset:'staging',            location:'EU' },
  { id:'cp4', name:'AWS S3 — Raw Zone',        type:'S3',          bucket:'sp-maritime-raw',      region:'us-east-1',           prefix:'landing/' },
  { id:'cp5', name:'GCP PubSub — AIS Stream',  type:'PubSub',      project:'sp-maritime-prod',    topic:'ais-position-stream',  subscription:'etl-consumer' },
  { id:'cp6', name:'PostgreSQL — Master DB',   type:'PostgreSQL',  host:'pg-master.sp-internal',  port:'5432',                  db:'maritime_master' },
  { id:'cp7', name:'Kafka — Events',           type:'Kafka',       brokers:'kafka-01:9092',       topic:'maritime-events',      group:'etl-group' },
]

const INIT_QC = [
  { id:'GQ01', entity:'Vessel',  field:'imo_number',    rule:'Format',       severity:'error', expr:'REGEXP_MATCH(imo_number, r"^\\d{7}$")',                           desc:'IMO must be exactly 7 digits', enabled:true },
  { id:'GQ02', entity:'Vessel',  field:'mmsi',          rule:'Format',       severity:'error', expr:'REGEXP_MATCH(mmsi, r"^\\d{9}$")',                                 desc:'MMSI must be exactly 9 digits', enabled:true },
  { id:'GQ03', entity:'Vessel',  field:'vessel_name',   rule:'Completeness', severity:'error', expr:'vessel_name IS NOT NULL AND LENGTH(vessel_name) > 1',             desc:'Vessel name required', enabled:true },
  { id:'GQ04', entity:'Vessel',  field:'gross_tonnage', rule:'Range',        severity:'warn',  expr:'gross_tonnage > 0 AND gross_tonnage < 600000',                    desc:'GT must be 0–600,000', enabled:true },
  { id:'GQ05', entity:'Vessel',  field:'dwt',           rule:'Range',        severity:'warn',  expr:'dwt >= 0 AND dwt < 650000',                                       desc:'DWT must be 0–650,000', enabled:true },
  { id:'GQ06', entity:'Vessel',  field:'year_built',    rule:'Range',        severity:'warn',  expr:'year_built >= 1900 AND year_built <= EXTRACT(YEAR FROM NOW())+2', desc:'Built year in valid range', enabled:true },
  { id:'GQ07', entity:'Vessel',  field:'flag_code',     rule:'Reference',    severity:'error', expr:'flag_code IN (SELECT code FROM ref.iso3166)',                     desc:'Flag must be valid ISO 3166-1 alpha-2', enabled:true },
  { id:'GQ08', entity:'Port',    field:'unlocode',      rule:'Format',       severity:'error', expr:'REGEXP_MATCH(unlocode, r"^[A-Z]{2}[A-Z0-9]{3}$")',               desc:'UN/LOCODE: 2-letter country + 3 alphanum', enabled:true },
  { id:'GQ09', entity:'Company', field:'lei',           rule:'Format',       severity:'warn',  expr:'lei IS NULL OR REGEXP_MATCH(lei, r"^[A-Z0-9]{20}$")',             desc:'LEI must be 20 alphanumeric chars', enabled:true },
]

const INIT_TRANSFORMS = [
  { id:'GT01', entity:'Vessel',  field:'vessel_name',  type:'Function',   rule:'UPPER(TRIM(vessel_name))',                       desc:'Trim and uppercase vessel name', enabled:true },
  { id:'GT02', entity:'Vessel',  field:'imo_number',   type:'Function',   rule:'LPAD(CAST(imo AS STRING), 7, "0")',              desc:'Zero-pad IMO to 7 digits', enabled:true },
  { id:'GT03', entity:'Vessel',  field:'flag_code',    type:'Lookup',     rule:'MAP(flag_code, ref.flag_iso_map)',               desc:'Normalise flag to ISO 3166-1 alpha-2', enabled:true },
  { id:'GT04', entity:'Vessel',  field:'vessel_type',  type:'Lookup',     rule:'MAP(vessel_type, ref.vessel_type_map)',          desc:'Normalise vessel type to master taxonomy', enabled:true },
  { id:'GT05', entity:'Vessel',  field:'call_sign',    type:'Regex',      rule:'REGEXP_REPLACE(call_sign, r"[^A-Z0-9]", "")',    desc:'Strip non-alphanumeric from call sign', enabled:true },
  { id:'GT06', entity:'Vessel',  field:'loa',          type:'Conversion', rule:'CAST(loa_raw AS FLOAT64) * loa_unit_factor',    desc:'Convert LOA to metres', enabled:true },
  { id:'GT07', entity:'Port',    field:'port_name',    type:'Function',   rule:'INITCAP(TRIM(port_name))',                      desc:'Title-case port names', enabled:true },
  { id:'GT08', entity:'Company', field:'company_name', type:'Function',   rule:'REGEXP_REPLACE(UPPER(TRIM(name)), r"\\s+", " ")',desc:'Normalise company name whitespace', enabled:true },
]

const INIT_PIPELINES = [
  { id:'pl01', name:'IHS Fairplay — Vessel Registry',    entity:'Vessel',  vendor:'IHS Fairplay',      freq:'Daily',     cron:'0 2 * * *',   mode:'Delta',        status:'success', enabled:true,  records:847392,  failed:312,  review:89,  lastRun:'2026-05-11 02:58', bqTable:'raw_landing.ihs_vessel_registry',  srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl02', name:'DNV GL — Class & Surveys',          entity:'Vessel',  vendor:'DNV GL',            freq:'Daily',     cron:'0 3 * * *',   mode:'Delta',        status:'success', enabled:true,  records:241800,  failed:54,   review:23,  lastRun:'2026-05-11 03:41', bqTable:'raw_landing.dnv_class_surveys',    srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl03', name:"Lloyd's Register — Class Notation", entity:'Vessel',  vendor:"Lloyd's Register",  freq:'Daily',     cron:'0 3 * * *',   mode:'Delta',        status:'warn',    enabled:true,  records:198200,  failed:1240, review:441, lastRun:'2026-05-11 04:12', bqTable:'raw_landing.lr_class_notation',    srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl04', name:'Bureau Veritas — Certificates',     entity:'Vessel',  vendor:'Bureau Veritas',    freq:'Weekly',    cron:'0 4 * * 1',   mode:'Full Reload',  status:'success', enabled:true,  records:167400,  failed:88,   review:31,  lastRun:'2026-05-10 04:44', bqTable:'raw_landing.bv_certificates',      srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl05', name:'Equasis — Ownership & Finance',     entity:'Vessel',  vendor:'Equasis',           freq:'Daily',     cron:'0 5 * * *',   mode:'Delta',        status:'error',   enabled:true,  records:0,       failed:0,    review:0,   lastRun:'2026-05-11 05:13', bqTable:'raw_landing.equasis_ownership',    srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl06', name:'MarineTraffic — AIS Positions',     entity:'Vessel',  vendor:'MarineTraffic',     freq:'Streaming', cron:'@stream',     mode:'Streaming',    status:'success', enabled:true,  records:9241000, failed:1820, review:0,   lastRun:'2026-05-11 09:58', bqTable:'raw_landing.mt_ais_positions',     srcConn:'cp5', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl07', name:'Refinitiv — Sanctions Screening',   entity:'Vessel',  vendor:'Refinitiv',         freq:'Daily',     cron:'0 1 * * *',   mode:'Full Reload',  status:'success', enabled:true,  records:55000,   failed:12,   review:38,  lastRun:'2026-05-11 01:22', bqTable:'raw_landing.refinitiv_sanctions',  srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl08', name:'Paris MOU — PSC Inspections',       entity:'Vessel',  vendor:'Paris MOU',         freq:'Weekly',    cron:'0 6 * * 5',   mode:'Delta',        status:'success', enabled:true,  records:42100,   failed:6,    review:14,  lastRun:'2026-05-09 06:48', bqTable:'raw_landing.paris_mou_psc',        srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl09', name:'World Ports — Port Directory',      entity:'Port',    vendor:'World Ports',       freq:'Monthly',   cron:'0 8 1 * *',   mode:'Full Reload',  status:'success', enabled:true,  records:12400,   failed:22,   review:9,   lastRun:'2026-05-01 08:29', bqTable:'raw_landing.worldports_directory', srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl10', name:'Dun & Bradstreet — Companies',      entity:'Company', vendor:'Dun & Bradstreet',  freq:'Monthly',   cron:'0 10 1 * *',  mode:'Full Reload',  status:'success', enabled:true,  records:284000,  failed:512,  review:188, lastRun:'2026-05-01 11:42', bqTable:'raw_landing.dnb_companies',        srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl11', name:'Veson IMOS — Fixtures',             entity:'Market',  vendor:'Veson IMOS',        freq:'Daily',     cron:'0 7 * * *',   mode:'Delta',        status:'success', enabled:false, records:28400,   failed:9,    review:5,   lastRun:'2026-05-10 07:28', bqTable:'raw_landing.veson_fixtures',       srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
  { id:'pl12', name:'Baltic Exchange — Freight Rates',   entity:'Market',  vendor:'Baltic Exchange',   freq:'Daily',     cron:'0 8 * * *',   mode:'Delta',        status:'success', enabled:true,  records:1200,    failed:0,    review:0,   lastRun:'2026-05-11 08:04', bqTable:'raw_landing.baltic_rates',         srcConn:'cp1', tgtConn:'cp2', alert:'etl-alerts@sp-maritime.com' },
]

const STATUS_META = {
  success: { cls:'stA', label:'Success',  icon:'✓' },
  warn:    { cls:'stD', label:'Warning',  icon:'⚠' },
  error:   { cls:'stR', label:'Failed',   icon:'✕' },
  running: { cls:'stB', label:'Running',  icon:'⏳' },
  disabled:{ cls:'stI', label:'Disabled', icon:'—'  },
}
const ENTITY_CLS = { Vessel:'tN', Port:'tB', Company:'tP', Market:'tS' }

/* ─── Shared atoms ───────────────────────────────────────────────────────── */
function Badge({ st }) {
  const m = STATUS_META[st] || STATUS_META.disabled
  return <span className={`stBadge ${m.cls}`}><span className="stDot"/>{m.label}</span>
}

function Toggle({ on, onChange }) {
  return (
    <button className={`etlToggle${on ? ' on' : ''}`} onClick={() => onChange(!on)}>
      <span className="etlToggleKnob" />
    </button>
  )
}

function ModalShell({ title, subtitle, onClose, onSave, saveLabel = '💾 Save', width = 560, children }) {
  return (
    <div className="etlModalBg" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="etlModal" style={{ width }}>
        <div className="etlModalHdr">
          <div>
            <div className="etlModalTitle">{title}</div>
            {subtitle && <div className="etlModalSub">{subtitle}</div>}
          </div>
          <button className="etlModalClose" onClick={onClose}>✕</button>
        </div>
        <div className="etlModalBody">{children}</div>
        <div className="etlModalFoot">
          <button className="btn btnS" onClick={onClose}>Cancel</button>
          <button className="btn btnP" onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  )
}

function FG({ label, children }) {
  return <div className="etlFG"><label>{label}</label>{children}</div>
}

/* ─── Pipeline Configure (full-page view) ───────────────────────────────── */
const PL_SRC_TABLES_INIT = {
  pl01: [
    { id:'t1', table:'ihs_vessel_main',      rows:'847,392',   pk:'imo_number', desc:'Core vessel particulars' },
    { id:'t2', table:'ihs_vessel_ownership', rows:'1,024,881', pk:'imo_number', desc:'Ownership history' },
    { id:'t3', table:'ihs_vessel_certs',     rows:'2,180,000', pk:'cert_id',    desc:'Statutory certificates' },
  ],
  pl03: [
    { id:'t4', table:'lr_vessel_registry',   rows:'198,200',   pk:'imo_number', desc:'LR vessel register' },
    { id:'t5', table:'lr_class_notations',   rows:'512,000',   pk:'notation_id',desc:'Class notations' },
  ],
}
const PL_FIELD_MAP_INIT = {
  pl01: [
    { id:'m1', src:'IMO_NUMBER',    tgt:'vessel.imo_number',  xfm:'GT01,GT02', status:'mapped'  },
    { id:'m2', src:'VESSEL_NAME',   tgt:'vessel.vessel_name', xfm:'GT01',      status:'mapped'  },
    { id:'m3', src:'FLAG_CODE',     tgt:'vessel.flag_code',   xfm:'GT03',      status:'mapped'  },
    { id:'m4', src:'GROSS_TONNAGE', tgt:'vessel.gt',          xfm:'—',         status:'mapped'  },
    { id:'m5', src:'DWT',           tgt:'vessel.dwt',         xfm:'—',         status:'mapped'  },
    { id:'m6', src:'LOA',           tgt:'vessel.loa',         xfm:'GT06',      status:'mapped'  },
    { id:'m7', src:'YEAR_BUILT',    tgt:'vessel.year_built',  xfm:'—',         status:'mapped'  },
    { id:'m8', src:'IHS_OWNER_ID',  tgt:'',                   xfm:'—',         status:'ignored' },
    { id:'m9', src:'LEGACY_CODE',   tgt:'',                   xfm:'—',         status:'unmapped'},
  ],
}
const BLANK_TABLE   = { table:'', rows:'', pk:'', desc:'' }
const BLANK_MAPPING = { src:'', tgt:'', xfm:'—', status:'mapped' }
const BLANK_MATCH   = { field:'', match:'exact', confidence:'90', action:'Update' }
const BLANK_SQL     = { type:'QC', name:'', severity:'warn', sql:'' }
const BLANK_PQC     = { field:'', rule:'Format', severity:'warn', expr:'', desc:'', enabled:true }
const BLANK_PXM     = { field:'', type:'Function', rule:'', desc:'', enabled:true }

const PL_QC_INIT = {
  pl01: [
    { id:'pq1', field:'GROSS_TONNAGE', rule:'Cross-field', severity:'warn',  expr:'GROSS_TONNAGE > DWT * 0.6',                        desc:'GT/DWT ratio check — IHS-specific',        enabled:true },
    { id:'pq2', field:'IHS_OWNER_ID',  rule:'Completeness',severity:'info',  expr:'IHS_OWNER_ID IS NOT NULL',                         desc:'Ownership link present',                   enabled:true },
  ],
  pl03: [
    { id:'pq3', field:'CLASS_CODE',    rule:'Reference',   severity:'error', expr:'CLASS_CODE IN (SELECT code FROM ref.lr_class_map)', desc:'Class code in LR reference table',         enabled:true },
  ],
}
const PL_XFM_INIT = {
  pl01: [
    { id:'px1', field:'VESSEL_NAME',   type:'Regex',    rule:'REGEXP_REPLACE(VESSEL_NAME, r"^(MT|MV|MS|SS)\\s+", "")', desc:'Strip vessel name prefix (IHS format)',      enabled:true },
    { id:'px2', field:'DWT',           type:'Conversion',rule:'CAST(DWT_RAW AS FLOAT64) * COALESCE(DWT_UNIT_FACTOR,1)', desc:'Normalise DWT to metric tonnes',             enabled:true },
  ],
  pl03: [
    { id:'px3', field:'LOA',           type:'Conversion',rule:'ROUND(CAST(LOA_FT AS FLOAT64) * 0.3048, 2)',            desc:'Convert LOA from feet to metres (LR source)',enabled:true },
  ],
}

function ConfigurePage({ pl, profiles, qcRules, transforms, onBack, onSave }) {
  const [tab,        setTab]        = useState('general')
  const [form,       setForm]       = useState({ ...pl })
  const [srcTables,  setSrcTables]  = useState(PL_SRC_TABLES_INIT[pl.id] || [])
  const [fieldMaps,  setFieldMaps]  = useState(PL_FIELD_MAP_INIT[pl.id]  || [])
  const [matchRules, setMatchRules] = useState([
    { id:'r1', field:'imo_number',            match:'exact',       confidence:'100', action:'Update' },
    { id:'r2', field:'vessel_name+flag_code', match:'fuzzy+exact', confidence:'90',  action:'Review' },
  ])
  const [sqlRules, setSqlRules] = useState([
    { id:'s1', type:'QC',        name:'GT vs DWT sanity check', severity:'warn', sql:"SELECT imo_number,'GT_DWT_MISMATCH' AS rule_id FROM source_table WHERE gross_tonnage > dwt * 3" },
    { id:'s2', type:'Transform', name:'Derive age category',    severity:'info', sql:"SELECT *, CASE WHEN yr < 2010 THEN 'Aged' ELSE 'Modern' END AS age_cat FROM source_table" },
  ])
  const [pipelineQc,  setPipelineQc]  = useState(PL_QC_INIT[pl.id]  || [])
  const [pipelineXfm, setPipelineXfm] = useState(PL_XFM_INIT[pl.id] || [])
  const [editTable,   setEditTable]   = useState(null)
  const [editMapping, setEditMapping] = useState(null)
  const [editMatch,   setEditMatch]   = useState(null)
  const [editSql,     setEditSql]     = useState(null)
  const [editPQc,     setEditPQc]     = useState(null)
  const [editPXm,     setEditPXm]     = useState(null)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const TABS = [
    ['general',   '① General'],
    ['source',    '② Source'],
    ['src-tables','③ Src Tables'],
    ['qc',        '④ QC Rules'],
    ['transforms','⑤ Transforms'],
    ['match',     '⑥ Match / Dedup'],
    ['field-map', '⑦ Field Mapping'],
    ['sql',       '⑧ SQL Rules'],
    ['target',    '⑨ Target'],
  ]

  function saveTable(t) {
    if (editTable?.id) setSrcTables(p => p.map(x => x.id === t.id ? t : x))
    else setSrcTables(p => [...p, { ...t, id: `t${Date.now()}` }])
    setEditTable(null)
  }
  function saveMapping(m) {
    if (editMapping?.id) setFieldMaps(p => p.map(x => x.id === m.id ? m : x))
    else setFieldMaps(p => [...p, { ...m, id: `m${Date.now()}` }])
    setEditMapping(null)
  }
  function saveMatch(r) {
    if (editMatch?.id) setMatchRules(p => p.map(x => x.id === r.id ? r : x))
    else setMatchRules(p => [...p, { ...r, id: `r${Date.now()}` }])
    setEditMatch(null)
  }
  function saveSql(s) {
    if (editSql?.id) setSqlRules(p => p.map(x => x.id === s.id ? s : x))
    else setSqlRules(p => [...p, { ...s, id: `s${Date.now()}` }])
    setEditSql(null)
  }
  function savePQc(r) {
    if (editPQc?.id) setPipelineQc(p => p.map(x => x.id === r.id ? r : x))
    else setPipelineQc(p => [...p, { ...r, id: `pq${Date.now()}` }])
    setEditPQc(null)
  }
  function savePXm(r) {
    if (editPXm?.id) setPipelineXfm(p => p.map(x => x.id === r.id ? r : x))
    else setPipelineXfm(p => [...p, { ...r, id: `px${Date.now()}` }])
    setEditPXm(null)
  }

  function connName(id) { return profiles.find(p => p.id === id)?.name || id }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', minHeight:0 }}>

      {/* Header */}
      <div className="dHead" style={{ padding:'0 20px', gap:10, flexWrap:'wrap' }}>
        <button className="backBtn" onClick={onBack}>← Pipelines</button>
        <div className="dHeadDiv"/>
        <div>
          <span style={{ fontWeight:700, fontSize:14 }}>⚙ Configure Pipeline</span>
          <span style={{ fontSize:11, color:'var(--txt3)', marginLeft:10 }}>{pl.name}</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button className="btn btnT" onClick={onBack}>Cancel</button>
          <button className="btn btnP" onClick={() => onSave(form)}>💾 Save Pipeline</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="etlCfgTabs">
        {TABS.map(([t, l]) => (
          <button key={t} className={`etlCfgTab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* Tab body */}
      <div className="etlCfgBody">

        {/* ── General ── */}
        {tab === 'general' && (
          <div className="etlForm" style={{ maxWidth:680 }}>
            <div className="etlFormRow2">
              <FG label="Pipeline Name"><input className="etlInput" value={form.name} onChange={e=>set('name',e.target.value)}/></FG>
              <FG label="Vendor / Source"><input className="etlInput" value={form.vendor} onChange={e=>set('vendor',e.target.value)}/></FG>
            </div>
            <div className="etlFormRow3">
              <FG label="Entity Type">
                <select className="etlInput" value={form.entity} onChange={e=>set('entity',e.target.value)}>
                  {ENTITY_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </FG>
              <FG label="Load Mode">
                <select className="etlInput" value={form.mode} onChange={e=>set('mode',e.target.value)}>
                  {LOAD_MODES.map(o=><option key={o}>{o}</option>)}
                </select>
              </FG>
              <FG label="Schedule (cron)"><input className="etlInput" value={form.cron} onChange={e=>set('cron',e.target.value)}/></FG>
            </div>
            <div className="etlFormRow2">
              <FG label="Timeout (seconds)"><input className="etlInput" type="number" defaultValue={120}/></FG>
              <FG label="Max Retries"><input className="etlInput" type="number" defaultValue={3}/></FG>
            </div>
            <FG label="BigQuery Landing Table">
              <input className="etlInput etlInputMono" value={form.bqTable} onChange={e=>set('bqTable',e.target.value)}/>
            </FG>
            <FG label="Alert Email(s)">
              <input className="etlInput" value={form.alert} onChange={e=>set('alert',e.target.value)}/>
            </FG>
            <FG label="Description / Notes">
              <textarea className="etlInput" rows={3} defaultValue={`Daily delta load from ${pl.vendor} for ${pl.entity} master data.`}/>
            </FG>
          </div>
        )}

        {/* ── Source Connection ── */}
        {tab === 'source' && (
          <div className="etlForm" style={{ maxWidth:680 }}>
            <FG label="Source Connection Profile">
              <select className="etlInput" value={form.srcConn} onChange={e=>set('srcConn',e.target.value)}>
                {profiles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FG>
            <div className="etlInfoCard">
              <div className="etlInfoCardTitle">Selected: {connName(form.srcConn)}</div>
              {(() => {
                const p = profiles.find(x=>x.id===form.srcConn)
                if (!p) return null
                return (
                  <div className="etlFormRow2" style={{marginTop:8}}>
                    {p.project && <FG label="Project"><input className="etlInput etlInputMono" value={p.project} readOnly/></FG>}
                    {p.dataset && <FG label="Dataset"><input className="etlInput etlInputMono" value={p.dataset} readOnly/></FG>}
                    {p.bucket  && <FG label="Bucket"><input  className="etlInput etlInputMono" value={p.bucket}  readOnly/></FG>}
                    {p.host    && <FG label="Host"><input    className="etlInput etlInputMono" value={p.host}    readOnly/></FG>}
                    {p.topic   && <FG label="Topic"><input   className="etlInput etlInputMono" value={p.topic}   readOnly/></FG>}
                  </div>
                )
              })()}
            </div>
            <div className="etlFormRow2">
              <FG label="Partition Filter Column"><input className="etlInput" defaultValue="_ingestion_ts"/></FG>
              <FG label="Watermark Column (for delta)"><input className="etlInput" defaultValue="_ingestion_ts"/></FG>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btnS btnSm">🔗 Test Connection</button>
              <button className="btn btnS btnSm">📋 Browse Tables</button>
            </div>
          </div>
        )}

        {/* ── Source Tables ── */}
        {tab === 'src-tables' && (
          <div>
            <div className="etlTabHead">
              <div>
                <div className="etlTabHeadTitle">Source Tables</div>
                <div className="etlTabHeadSub">Tables in the landing dataset that this pipeline reads from.</div>
              </div>
              <button className="btn btnP btnSm" onClick={() => setEditTable({ ...BLANK_TABLE })}>+ Add Table</button>
            </div>
            {srcTables.length === 0
              ? <div className="etlEmptyState"><div className="etlEmptyIcon">📋</div><div>No source tables configured yet.</div><button className="btn btnP btnSm" onClick={() => setEditTable({ ...BLANK_TABLE })}>+ Add First Table</button></div>
              : <table className="etlTable">
                  <thead><tr><th>Table Name</th><th>Approx. Rows</th><th>Primary Key</th><th>Description</th><th style={{width:80}}>Actions</th></tr></thead>
                  <tbody>
                    {srcTables.map(t => (
                      <tr key={t.id}>
                        <td><code className="etlCode">{t.table}</code></td>
                        <td>{t.rows}</td>
                        <td><code className="etlCode">{t.pk}</code></td>
                        <td style={{color:'var(--txt2)'}}>{t.desc}</td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btnS btnSm" onClick={() => setEditTable({...t})}>✎</button>
                            <button className="btn btnS btnSm etlDanger" onClick={() => setSrcTables(p=>p.filter(x=>x.id!==t.id))}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        )}

        {/* ── QC Rules ── */}
        {tab === 'qc' && (
          <div>
            {/* Pipeline-specific rules */}
            <div className="etlTabHead">
              <div>
                <div className="etlTabHeadTitle">Pipeline QC Rules</div>
                <div className="etlTabHeadSub">Rules specific to this pipeline — extend or override the global baseline.</div>
              </div>
              <button className="btn btnP btnSm" onClick={() => setEditPQc({ ...BLANK_PQC })}>+ Add Rule</button>
            </div>
            {pipelineQc.length === 0
              ? <div style={{padding:'10px 0 18px',color:'var(--txt3)',fontSize:12}}>No pipeline-specific rules yet. Global rules below are inherited automatically.</div>
              : <table className="etlTable" style={{marginBottom:0}}>
                  <thead><tr><th>Source Field</th><th>Type</th><th>Severity</th><th>Expression</th><th>Description</th><th>On</th><th style={{width:80}}>Actions</th></tr></thead>
                  <tbody>
                    {pipelineQc.map(r => (
                      <tr key={r.id}>
                        <td><code className="etlCode">{r.field}</code></td>
                        <td><span className="tag tN etlTag">{r.rule}</span></td>
                        <td><span className={`stBadge ${r.severity==='error'?'stR':'stD'} etlBadgeSm`}><span className="stDot"/>{r.severity}</span></td>
                        <td className="etlCodeCell"><code className="etlCode etlCodeSm">{r.expr}</code></td>
                        <td style={{color:'var(--txt2)'}}>{r.desc}</td>
                        <td><input type="checkbox" checked={r.enabled} onChange={e=>setPipelineQc(p=>p.map(x=>x.id===r.id?{...x,enabled:e.target.checked}:x))}/></td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btnS btnSm" onClick={() => setEditPQc({...r})}>✎</button>
                            <button className="btn btnS btnSm etlDanger" onClick={() => setPipelineQc(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }

            {/* Inherited global rules */}
            <div style={{marginTop:22,marginBottom:8,display:'flex',alignItems:'center',gap:8,borderTop:'1px solid var(--bd)',paddingTop:16}}>
              <span style={{fontWeight:700,fontSize:12}}>Inherited Global Rules</span>
              <span style={{fontSize:11,color:'var(--txt3)'}}>matching {form.entity} entity — source field resolved from field mappings</span>
            </div>
            <table className="etlTable">
              <thead><tr><th>Rule ID</th><th>Master Field</th><th>Source Field</th><th>Type</th><th>Severity</th><th>Expression</th><th>Description</th><th>On</th></tr></thead>
              <tbody>
                {qcRules.filter(r => r.entity === form.entity || r.entity === 'All').map(r => {
                  const mapping = fieldMaps.find(m => m.tgt && m.tgt.split('.').pop() === r.field)
                  return (
                    <tr key={r.id} style={{background:'var(--bg2)'}}>
                      <td><code className="etlCode etlCodeSm">{r.id}</code><span style={{fontSize:9,color:'var(--txt3)',marginLeft:4}}>global</span></td>
                      <td><code className="etlCode">{r.field}</code></td>
                      <td>{mapping
                        ? <code className="etlCode" style={{color:'var(--blue)'}}>{mapping.src}</code>
                        : <span style={{color:'var(--txt3)',fontSize:11}}>not mapped</span>}
                      </td>
                      <td><span className="tag tN etlTag">{r.rule}</span></td>
                      <td><span className={`stBadge ${r.severity==='error'?'stR':'stD'} etlBadgeSm`}><span className="stDot"/>{r.severity}</span></td>
                      <td className="etlCodeCell" title={r.expr}><code className="etlCode etlCodeSm">{r.expr}</code></td>
                      <td style={{color:'var(--txt2)',fontSize:11}}>{r.desc}</td>
                      <td><input type="checkbox" defaultChecked={r.enabled}/></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Transformations ── */}
        {tab === 'transforms' && (
          <div>
            {/* Pipeline-specific transforms */}
            <div className="etlTabHead">
              <div>
                <div className="etlTabHeadTitle">Pipeline Transform Rules</div>
                <div className="etlTabHeadSub">Source-field transforms specific to this pipeline — applied before global transforms.</div>
              </div>
              <button className="btn btnP btnSm" onClick={() => setEditPXm({ ...BLANK_PXM })}>+ Add Rule</button>
            </div>
            {pipelineXfm.length === 0
              ? <div style={{padding:'10px 0 18px',color:'var(--txt3)',fontSize:12}}>No pipeline-specific transforms. Global transforms below are inherited automatically.</div>
              : <table className="etlTable" style={{marginBottom:0}}>
                  <thead><tr><th>Source Field</th><th>Type</th><th>Rule Expression</th><th>Description</th><th>On</th><th style={{width:80}}>Actions</th></tr></thead>
                  <tbody>
                    {pipelineXfm.map(r => (
                      <tr key={r.id}>
                        <td><code className="etlCode">{r.field}</code></td>
                        <td><span className="tag tB etlTag">{r.type}</span></td>
                        <td className="etlCodeCell"><code className="etlCode etlCodeSm">{r.rule}</code></td>
                        <td style={{color:'var(--txt2)'}}>{r.desc}</td>
                        <td><input type="checkbox" checked={r.enabled} onChange={e=>setPipelineXfm(p=>p.map(x=>x.id===r.id?{...x,enabled:e.target.checked}:x))}/></td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btnS btnSm" onClick={() => setEditPXm({...r})}>✎</button>
                            <button className="btn btnS btnSm etlDanger" onClick={() => setPipelineXfm(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }

            {/* Inherited global transforms */}
            <div style={{marginTop:22,marginBottom:8,display:'flex',alignItems:'center',gap:8,borderTop:'1px solid var(--bd)',paddingTop:16}}>
              <span style={{fontWeight:700,fontSize:12}}>Inherited Global Transforms</span>
              <span style={{fontSize:11,color:'var(--txt3)'}}>matching {form.entity} entity — source field resolved from field mappings</span>
            </div>
            <table className="etlTable">
              <thead><tr><th>Rule ID</th><th>Master Field</th><th>Source Field</th><th>Type</th><th>Rule Expression</th><th>Description</th><th>On</th></tr></thead>
              <tbody>
                {transforms.filter(r => r.entity === form.entity || r.entity === 'All').map(r => {
                  const mapping = fieldMaps.find(m => m.tgt && m.tgt.split('.').pop() === r.field)
                  return (
                    <tr key={r.id} style={{background:'var(--bg2)'}}>
                      <td><code className="etlCode etlCodeSm">{r.id}</code><span style={{fontSize:9,color:'var(--txt3)',marginLeft:4}}>global</span></td>
                      <td><code className="etlCode">{r.field}</code></td>
                      <td>{mapping
                        ? <code className="etlCode" style={{color:'var(--blue)'}}>{mapping.src}</code>
                        : <span style={{color:'var(--txt3)',fontSize:11}}>not mapped</span>}
                      </td>
                      <td><span className="tag tB etlTag">{r.type}</span></td>
                      <td className="etlCodeCell" title={r.rule}><code className="etlCode etlCodeSm">{r.rule}</code></td>
                      <td style={{color:'var(--txt2)',fontSize:11}}>{r.desc}</td>
                      <td><input type="checkbox" defaultChecked={r.enabled}/></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Match & Dedup ── */}
        {tab === 'match' && (
          <div style={{maxWidth:800}}>
            <div className="etlTabHead">
              <div>
                <div className="etlTabHeadTitle">Match & Deduplication</div>
                <div className="etlTabHeadSub">Rules evaluated in priority order to identify existing master records.</div>
              </div>
              <button className="btn btnP btnSm" onClick={() => setEditMatch({ ...BLANK_MATCH })}>+ Add Rule</button>
            </div>
            <table className="etlTable">
              <thead><tr><th>#</th><th>Match Field(s)</th><th>Match Type</th><th>Min Confidence %</th><th>On Match</th><th style={{width:80}}>Actions</th></tr></thead>
              <tbody>
                {matchRules.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{fontWeight:700,color:'var(--blue)'}}>{i+1}</td>
                    <td><code className="etlCode">{r.field}</code></td>
                    <td><span className="tag tN etlTag">{r.match}</span></td>
                    <td>{r.confidence}%</td>
                    <td><span className={`stBadge ${r.action==='Update'?'stA':'stD'} etlBadgeSm`}><span className="stDot"/>{r.action}</span></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btnS btnSm" onClick={() => setEditMatch({...r})}>✎</button>
                        <button className="btn btnS btnSm etlDanger" onClick={() => setMatchRules(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="etlInfoCard" style={{marginTop:16}}>
              <div className="etlInfoCardTitle">Deduplication Strategy</div>
              <div className="etlFormRow2" style={{marginTop:10}}>
                <FG label="Dedup Key"><input className="etlInput etlInputMono" defaultValue="imo_number"/></FG>
                <FG label="On Conflict">
                  <select className="etlInput"><option>Latest wins (by _ingestion_ts)</option><option>Highest confidence wins</option><option>Route to review queue</option></select>
                </FG>
              </div>
            </div>
          </div>
        )}

        {/* ── Field Mapping ── */}
        {tab === 'field-map' && (
          <div>
            <div className="etlTabHead">
              <div>
                <div className="etlTabHeadTitle">Field Mapping — {form.vendor} → Master</div>
                <div className="etlTabHeadSub">Map source fields to master schema. Unmapped fields are ignored unless flagged.</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btnS btnSm">🔍 Auto-detect</button>
                <button className="btn btnP btnSm" onClick={() => setEditMapping({ ...BLANK_MAPPING })}>+ Add Mapping</button>
              </div>
            </div>
            <table className="etlTable">
              <thead><tr><th>Source Field</th><th>→</th><th>Master Field</th><th>Pipeline Transforms</th><th>Global QC</th><th>Global Transforms</th><th>Status</th><th style={{width:80}}>Actions</th></tr></thead>
              <tbody>
                {fieldMaps.map(m => {
                  const masterField = m.tgt ? m.tgt.split('.').pop() : null
                  const gQc  = masterField ? qcRules.filter(r  => r.field  === masterField && (r.entity===form.entity||r.entity==='All')) : []
                  const gXfm = masterField ? transforms.filter(r => r.field === masterField && (r.entity===form.entity||r.entity==='All')) : []
                  return (
                    <tr key={m.id}>
                      <td><code className="etlCode">{m.src}</code></td>
                      <td style={{color:'var(--txt3)',fontWeight:700}}>→</td>
                      <td><code className="etlCode" style={{color:m.tgt?undefined:'var(--txt3)'}}>{m.tgt||'(not mapped)'}</code></td>
                      <td>
                        {m.xfm !== '—' ? m.xfm.split(',').map(x=><span key={x} className="tag tP etlTag" style={{marginRight:2}}>{x}</span>) : <span style={{color:'var(--txt3)',fontSize:11}}>—</span>}
                      </td>
                      <td>
                        {gQc.length ? gQc.map(r=><span key={r.id} className="tag tR etlTag" style={{marginRight:2}} title={r.desc}>{r.id}</span>) : <span style={{color:'var(--txt3)',fontSize:11}}>—</span>}
                      </td>
                      <td>
                        {gXfm.length ? gXfm.map(r=><span key={r.id} className="tag tB etlTag" style={{marginRight:2}} title={r.desc}>{r.id}</span>) : <span style={{color:'var(--txt3)',fontSize:11}}>—</span>}
                      </td>
                      <td><span className={`stBadge ${m.status==='mapped'?'stA':m.status==='ignored'?'stI':'stR'} etlBadgeSm`}><span className="stDot"/>{m.status}</span></td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className="btn btnS btnSm" onClick={() => setEditMapping({...m})}>✎</button>
                          <button className="btn btnS btnSm etlDanger" onClick={() => setFieldMaps(p=>p.filter(x=>x.id!==m.id))}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SQL Rules ── */}
        {tab === 'sql' && (
          <div>
            <div className="etlTabHead">
              <div>
                <div className="etlTabHeadTitle">SQL-based Rules</div>
                <div className="etlTabHeadSub">BigQuery SQL executed at table level after field mapping. Can be QC checks or transformations.</div>
              </div>
              <button className="btn btnP btnSm" onClick={() => setEditSql({ ...BLANK_SQL })}>+ Add SQL Rule</button>
            </div>
            {sqlRules.map(s => (
              <div key={s.id} className="etlSqlBlock">
                <div className="etlSqlBlockHdr">
                  <span className={`tag ${s.type==='QC'?'tR':'tB'} etlTag`}>{s.type}</span>
                  <span style={{fontWeight:600,fontSize:12}}>{s.name}</span>
                  {s.severity && <span className={`stBadge ${s.severity==='warn'?'stD':'stA'} etlBadgeSm`} style={{marginLeft:4}}><span className="stDot"/>{s.severity}</span>}
                  <div style={{marginLeft:'auto',display:'flex',gap:4}}>
                    <button className="btn btnS btnSm" onClick={() => setEditSql({...s})}>✎ Edit</button>
                    <button className="btn btnS btnSm etlDanger" onClick={() => setSqlRules(p=>p.filter(x=>x.id!==s.id))}>🗑</button>
                  </div>
                </div>
                <pre className="etlSqlPre">{s.sql}</pre>
              </div>
            ))}
          </div>
        )}

        {/* ── Target ── */}
        {tab === 'target' && (
          <div className="etlForm" style={{maxWidth:680}}>
            <div className="etlInfoCard">
              <div className="etlInfoCardTitle">Primary Target — Master Table</div>
              <div className="etlFormRow2" style={{marginTop:10}}>
                <FG label="Connection Profile">
                  <select className="etlInput" value={form.tgtConn} onChange={e=>set('tgtConn',e.target.value)}>
                    {profiles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FG>
                <FG label="Target Table"><input className="etlInput etlInputMono" defaultValue="vessel_master.vessel_particulars"/></FG>
              </div>
              <div className="etlFormRow3" style={{marginTop:8}}>
                <FG label="Write Mode">
                  <select className="etlInput">{WRITE_MODES.map(o=><option key={o}>{o}</option>)}</select>
                </FG>
                <FG label="Merge / Partition Key"><input className="etlInput etlInputMono" defaultValue="imo_number"/></FG>
                <FG label="Partition Column"><input className="etlInput etlInputMono" defaultValue="_updated_date"/></FG>
              </div>
            </div>
            <div className="etlInfoCard">
              <div className="etlInfoCardTitle">Review Queue Target</div>
              <div className="etlFormRow2" style={{marginTop:10}}>
                <FG label="Table"><input className="etlInput etlInputMono" defaultValue="etl_ops.review_queue"/></FG>
                <FG label="Route records when">
                  <select className="etlInput"><option>Confidence &lt; 90%</option><option>Any QC warning</option><option>New key not in master</option></select>
                </FG>
              </div>
            </div>
            <div className="etlInfoCard">
              <div className="etlInfoCardTitle">QC Failure Table</div>
              <div style={{marginTop:10}}>
                <FG label="Table"><input className="etlInput etlInputMono" defaultValue="etl_ops.qc_failures"/></FG>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Save bar always visible at bottom */}
      <div className="etlSaveBar">
        <button className="btn btnS" onClick={onBack}>Cancel</button>
        <button className="btn btnP" onClick={() => onSave(form)}>💾 Save Pipeline</button>
      </div>

      {/* Modals */}
      {editTable && (
        <ModalShell title={editTable.id ? 'Edit Source Table' : 'Add Source Table'} onClose={() => setEditTable(null)} onSave={() => saveTable(editTable)}>
          <FG label="Table Name"><input className="etlInput etlInputMono" value={editTable.table} onChange={e=>setEditTable(t=>({...t,table:e.target.value}))}/></FG>
          <FG label="Primary Key"><input className="etlInput etlInputMono" value={editTable.pk} onChange={e=>setEditTable(t=>({...t,pk:e.target.value}))}/></FG>
          <FG label="Approx Row Count"><input className="etlInput" value={editTable.rows} onChange={e=>setEditTable(t=>({...t,rows:e.target.value}))}/></FG>
          <FG label="Description"><input className="etlInput" value={editTable.desc} onChange={e=>setEditTable(t=>({...t,desc:e.target.value}))}/></FG>
        </ModalShell>
      )}
      {editMapping && (
        <ModalShell title={editMapping.id ? 'Edit Field Mapping' : 'Add Field Mapping'} onClose={() => setEditMapping(null)} onSave={() => saveMapping(editMapping)}>
          <FG label="Source Field (as in landing table)"><input className="etlInput etlInputMono" value={editMapping.src} onChange={e=>setEditMapping(m=>({...m,src:e.target.value}))}/></FG>
          <FG label="Master Field (dot-notation)"><input className="etlInput etlInputMono" value={editMapping.tgt} onChange={e=>setEditMapping(m=>({...m,tgt:e.target.value}))}/></FG>
          <FG label="Transform Rule IDs (comma-separated)"><input className="etlInput" value={editMapping.xfm} onChange={e=>setEditMapping(m=>({...m,xfm:e.target.value}))}/></FG>
          <FG label="Status">
            <select className="etlInput" value={editMapping.status} onChange={e=>setEditMapping(m=>({...m,status:e.target.value}))}>
              {['mapped','ignored','unmapped'].map(o=><option key={o}>{o}</option>)}
            </select>
          </FG>
        </ModalShell>
      )}
      {editMatch && (
        <ModalShell title={editMatch.id ? 'Edit Match Rule' : 'Add Match Rule'} onClose={() => setEditMatch(null)} onSave={() => saveMatch(editMatch)}>
          <FG label="Match Field(s) (e.g. imo_number or name+flag)"><input className="etlInput etlInputMono" value={editMatch.field} onChange={e=>setEditMatch(r=>({...r,field:e.target.value}))}/></FG>
          <FG label="Match Type">
            <select className="etlInput" value={editMatch.match} onChange={e=>setEditMatch(r=>({...r,match:e.target.value}))}>
              {MATCH_TYPES.map(o=><option key={o}>{o}</option>)}
            </select>
          </FG>
          <FG label="Minimum Confidence %"><input className="etlInput" type="number" min={0} max={100} value={editMatch.confidence} onChange={e=>setEditMatch(r=>({...r,confidence:e.target.value}))}/></FG>
          <FG label="On Match Action">
            <select className="etlInput" value={editMatch.action} onChange={e=>setEditMatch(r=>({...r,action:e.target.value}))}>
              {MATCH_ACTIONS.map(o=><option key={o}>{o}</option>)}
            </select>
          </FG>
        </ModalShell>
      )}
      {editPQc && (
        <ModalShell title={editPQc.id ? 'Edit Pipeline QC Rule' : 'Add Pipeline QC Rule'} onClose={() => setEditPQc(null)} onSave={() => savePQc(editPQc)} width={620}>
          <div className="etlFormRow2">
            <FG label="Source Field Name"><input className="etlInput etlInputMono" value={editPQc.field} onChange={e=>setEditPQc(r=>({...r,field:e.target.value}))}/></FG>
            <FG label="Rule Type">
              <select className="etlInput" value={editPQc.rule} onChange={e=>setEditPQc(r=>({...r,rule:e.target.value}))}>
                {QC_TYPES.map(o=><option key={o}>{o}</option>)}
              </select>
            </FG>
          </div>
          <FG label="Severity">
            <select className="etlInput" value={editPQc.severity} onChange={e=>setEditPQc(r=>({...r,severity:e.target.value}))}>
              {SEVERITY.map(o=><option key={o}>{o}</option>)}
            </select>
          </FG>
          <FG label="Expression / SQL condition"><textarea className="etlInput etlInputMono" rows={3} value={editPQc.expr} onChange={e=>setEditPQc(r=>({...r,expr:e.target.value}))}/></FG>
          <FG label="Description"><input className="etlInput" value={editPQc.desc} onChange={e=>setEditPQc(r=>({...r,desc:e.target.value}))}/></FG>
        </ModalShell>
      )}
      {editPXm && (
        <ModalShell title={editPXm.id ? 'Edit Pipeline Transform' : 'Add Pipeline Transform'} onClose={() => setEditPXm(null)} onSave={() => savePXm(editPXm)} width={620}>
          <div className="etlFormRow2">
            <FG label="Source Field Name"><input className="etlInput etlInputMono" value={editPXm.field} onChange={e=>setEditPXm(r=>({...r,field:e.target.value}))}/></FG>
            <FG label="Transform Type">
              <select className="etlInput" value={editPXm.type} onChange={e=>setEditPXm(r=>({...r,type:e.target.value}))}>
                {XFM_TYPES.map(o=><option key={o}>{o}</option>)}
              </select>
            </FG>
          </div>
          <FG label="Rule Expression"><textarea className="etlInput etlInputMono" rows={3} value={editPXm.rule} onChange={e=>setEditPXm(r=>({...r,rule:e.target.value}))}/></FG>
          <FG label="Description"><input className="etlInput" value={editPXm.desc} onChange={e=>setEditPXm(r=>({...r,desc:e.target.value}))}/></FG>
        </ModalShell>
      )}
      {editSql && (
        <ModalShell title={editSql.id ? 'Edit SQL Rule' : 'Add SQL Rule'} onClose={() => setEditSql(null)} onSave={() => saveSql(editSql)} width={700}>
          <div className="etlFormRow2">
            <FG label="Rule Type">
              <select className="etlInput" value={editSql.type} onChange={e=>setEditSql(s=>({...s,type:e.target.value}))}>
                <option>QC</option><option>Transform</option>
              </select>
            </FG>
            <FG label="Severity">
              <select className="etlInput" value={editSql.severity} onChange={e=>setEditSql(s=>({...s,severity:e.target.value}))}>
                {SEVERITY.map(o=><option key={o}>{o}</option>)}
              </select>
            </FG>
          </div>
          <FG label="Rule Name"><input className="etlInput" value={editSql.name} onChange={e=>setEditSql(s=>({...s,name:e.target.value}))}/></FG>
          <FG label="SQL Expression">
            <textarea className="etlInput etlInputMono" rows={7} value={editSql.sql} onChange={e=>setEditSql(s=>({...s,sql:e.target.value}))} style={{fontSize:11,lineHeight:1.6}}/>
          </FG>
        </ModalShell>
      )}
    </div>
  )
}

/* ─── Global Settings (full-page) ────────────────────────────────────────── */
const BLANK_PROFILE = { name:'', type:'BigQuery', project:'', dataset:'', location:'EU', bucket:'', region:'', prefix:'', host:'', port:'5432', db:'', topic:'', subscription:'', brokers:'', group:'' }
const BLANK_QC      = { entity:'Vessel', field:'', rule:'Format', severity:'error', expr:'', desc:'', enabled:true }
const BLANK_XFM     = { entity:'Vessel', field:'', type:'Function', rule:'', desc:'', enabled:true }

function GlobalSettingsPage({ profiles, setProfiles, qcRules, setQcRules, transforms, setTransforms, onBack }) {
  const [section,  setSection]  = useState('alerts')
  const [alert1,   setAlert1]   = useState('etl-alerts@sp-maritime.com')
  const [alert2,   setAlert2]   = useState('data-ops@sp-maritime.com')
  const [failAct,  setFailAct]  = useState('Email + PagerDuty')
  const [warnAct,  setWarnAct]  = useState('Email only')
  const [summary,  setSummary]  = useState('08:00 UTC')
  const [editProf, setEditProf] = useState(null)
  const [editQc,   setEditQc]   = useState(null)
  const [editXfm,  setEditXfm]  = useState(null)
  const [saved,    setSaved]    = useState(false)

  function saveAll() { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  function saveProfile(p) {
    setProfiles(prev => prev.find(x=>x.id===p.id) ? prev.map(x=>x.id===p.id?p:x) : [...prev, {...p, id:`cp${Date.now()}`}])
    setEditProf(null)
  }
  function saveQc(r) {
    setQcRules(prev => prev.find(x=>x.id===r.id) ? prev.map(x=>x.id===r.id?r:x) : [...prev, {...r, id:`GQ${Date.now()}`}])
    setEditQc(null)
  }
  function saveXfm(r) {
    setTransforms(prev => prev.find(x=>x.id===r.id) ? prev.map(x=>x.id===r.id?r:x) : [...prev, {...r, id:`GT${Date.now()}`}])
    setEditXfm(null)
  }

  const SECTIONS = [['alerts','🔔 Alert Settings'],['connections','🔗 Connections'],['qc','✅ QC Rules'],['transforms','⚡ Transforms']]

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
      <div className="dHead" style={{padding:'0 20px',gap:10}}>
        <span style={{fontWeight:700,fontSize:14}}>⚙ Global Settings</span>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {saved && <span style={{color:'#16a34a',fontWeight:600,fontSize:12}}>✓ Saved</span>}
          <button className="btn btnP" onClick={saveAll}>💾 Save All</button>
        </div>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0}}>
        {/* Sidebar */}
        <div className="etlGsNav">
          {SECTIONS.map(([k,l]) => (
            <button key={k} className={`etlGsNavItem${section===k?' on':''}`} onClick={() => setSection(k)}>{l}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:28}}>
          <div style={{maxWidth:860}}>

            {section==='alerts' && (
              <>
                <div className="etlGsGroupTitle">Alert Recipients</div>
                <div className="etlInfoCard" style={{marginBottom:16}}>
                  <div className="etlFormRow2">
                    <FG label="Primary Email"><input className="etlInput" value={alert1} onChange={e=>setAlert1(e.target.value)}/></FG>
                    <FG label="Secondary Email"><input className="etlInput" value={alert2} onChange={e=>setAlert2(e.target.value)}/></FG>
                  </div>
                </div>
                <div className="etlGsGroupTitle">Trigger Rules</div>
                <div className="etlInfoCard">
                  <div className="etlFormRow3">
                    <FG label="On Pipeline Failure">
                      <select className="etlInput" value={failAct} onChange={e=>setFailAct(e.target.value)}>
                        <option>Email + PagerDuty</option><option>Email only</option><option>None</option>
                      </select>
                    </FG>
                    <FG label="On QC Warning">
                      <select className="etlInput" value={warnAct} onChange={e=>setWarnAct(e.target.value)}>
                        <option>Email only</option><option>Slack</option><option>None</option>
                      </select>
                    </FG>
                    <FG label="Daily Summary">
                      <select className="etlInput" value={summary} onChange={e=>setSummary(e.target.value)}>
                        <option>08:00 UTC</option><option>06:00 UTC</option><option>None</option>
                      </select>
                    </FG>
                  </div>
                </div>
              </>
            )}

            {section==='connections' && (
              <>
                <div style={{display:'flex',alignItems:'center',marginBottom:16}}>
                  <div className="etlGsGroupTitle" style={{margin:0}}>Connection Profiles</div>
                  <button className="btn btnP btnSm" style={{marginLeft:'auto'}} onClick={() => setEditProf({...BLANK_PROFILE, id:`cp${Date.now()}`})}>+ New Profile</button>
                </div>
                <table className="etlTable">
                  <thead><tr><th>Profile Name</th><th>Type</th><th>Host / Project / Bucket</th><th>Dataset / DB / Topic</th><th>Status</th><th style={{width:120}}>Actions</th></tr></thead>
                  <tbody>
                    {profiles.map(c => (
                      <tr key={c.id}>
                        <td style={{fontWeight:600}}>{c.name}</td>
                        <td><span className="tag tN etlTag">{c.type}</span></td>
                        <td><code className="etlCode etlCodeSm">{c.project||c.bucket||c.host||c.brokers||'—'}</code></td>
                        <td><code className="etlCode etlCodeSm">{c.dataset||c.db||c.topic||c.region||'—'}</code></td>
                        <td><span className="stBadge stA etlBadgeSm"><span className="stDot"/>Connected</span></td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btnS btnSm" onClick={() => setEditProf({...c})}>✎ Edit</button>
                            <button className="btn btnS btnSm">🔗 Test</button>
                            <button className="btn btnS btnSm etlDanger" onClick={() => setProfiles(p=>p.filter(x=>x.id!==c.id))}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {section==='qc' && (
              <>
                <div style={{display:'flex',alignItems:'center',marginBottom:16}}>
                  <div className="etlGsGroupTitle" style={{margin:0}}>Global QC Rules</div>
                  <div style={{fontSize:11,color:'var(--txt3)',marginLeft:12}}>Inherited by all pipelines</div>
                  <button className="btn btnP btnSm" style={{marginLeft:'auto'}} onClick={() => setEditQc({...BLANK_QC, id:''})}>+ New Rule</button>
                </div>
                <table className="etlTable">
                  <thead><tr><th>ID</th><th>Entity</th><th>Field</th><th>Type</th><th>Severity</th><th>Description</th><th>On</th><th style={{width:80}}>Actions</th></tr></thead>
                  <tbody>
                    {qcRules.map(r => (
                      <tr key={r.id}>
                        <td><code className="etlCode etlCodeSm">{r.id}</code></td>
                        <td><span className={`tag ${ENTITY_CLS[r.entity]||'tN'} etlTag`}>{r.entity}</span></td>
                        <td><code className="etlCode">{r.field}</code></td>
                        <td><span className="tag tN etlTag">{r.rule}</span></td>
                        <td><span className={`stBadge ${r.severity==='error'?'stR':'stD'} etlBadgeSm`}><span className="stDot"/>{r.severity}</span></td>
                        <td style={{color:'var(--txt2)'}}>{r.desc}</td>
                        <td><input type="checkbox" checked={r.enabled} onChange={e=>setQcRules(p=>p.map(x=>x.id===r.id?{...x,enabled:e.target.checked}:x))}/></td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btnS btnSm" onClick={() => setEditQc({...r})}>✎</button>
                            <button className="btn btnS btnSm etlDanger" onClick={() => setQcRules(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {section==='transforms' && (
              <>
                <div style={{display:'flex',alignItems:'center',marginBottom:16}}>
                  <div className="etlGsGroupTitle" style={{margin:0}}>Global Transformation Rules</div>
                  <div style={{fontSize:11,color:'var(--txt3)',marginLeft:12}}>Applied across all pipelines after field mapping</div>
                  <button className="btn btnP btnSm" style={{marginLeft:'auto'}} onClick={() => setEditXfm({...BLANK_XFM, id:''})}>+ New Rule</button>
                </div>
                <table className="etlTable">
                  <thead><tr><th>ID</th><th>Entity</th><th>Field</th><th>Type</th><th>Rule</th><th>Description</th><th>On</th><th style={{width:80}}>Actions</th></tr></thead>
                  <tbody>
                    {transforms.map(r => (
                      <tr key={r.id}>
                        <td><code className="etlCode etlCodeSm">{r.id}</code></td>
                        <td><span className={`tag ${ENTITY_CLS[r.entity]||'tN'} etlTag`}>{r.entity}</span></td>
                        <td><code className="etlCode">{r.field}</code></td>
                        <td><span className="tag tB etlTag">{r.type}</span></td>
                        <td className="etlCodeCell"><code className="etlCode etlCodeSm">{r.rule}</code></td>
                        <td style={{color:'var(--txt2)'}}>{r.desc}</td>
                        <td><input type="checkbox" checked={r.enabled} onChange={e=>setTransforms(p=>p.map(x=>x.id===r.id?{...x,enabled:e.target.checked}:x))}/></td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btnS btnSm" onClick={() => setEditXfm({...r})}>✎</button>
                            <button className="btn btnS btnSm etlDanger" onClick={() => setTransforms(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      {editProf && (
        <ModalShell title={editProf.name ? `Edit: ${editProf.name}` : 'New Connection Profile'} onClose={() => setEditProf(null)} onSave={() => saveProfile(editProf)} width={620}>
          <div className="etlFormRow2">
            <FG label="Profile Name"><input className="etlInput" value={editProf.name} onChange={e=>setEditProf(p=>({...p,name:e.target.value}))}/></FG>
            <FG label="Connection Type">
              <select className="etlInput" value={editProf.type} onChange={e=>setEditProf(p=>({...p,type:e.target.value}))}>
                {CONN_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </FG>
          </div>
          {editProf.type === 'BigQuery' && (
            <div className="etlFormRow3">
              <FG label="Project ID"><input className="etlInput etlInputMono" value={editProf.project} onChange={e=>setEditProf(p=>({...p,project:e.target.value}))}/></FG>
              <FG label="Dataset"><input className="etlInput etlInputMono" value={editProf.dataset} onChange={e=>setEditProf(p=>({...p,dataset:e.target.value}))}/></FG>
              <FG label="Location"><input className="etlInput" value={editProf.location} onChange={e=>setEditProf(p=>({...p,location:e.target.value}))}/></FG>
            </div>
          )}
          {editProf.type === 'S3' && (
            <div className="etlFormRow3">
              <FG label="Bucket"><input className="etlInput etlInputMono" value={editProf.bucket} onChange={e=>setEditProf(p=>({...p,bucket:e.target.value}))}/></FG>
              <FG label="Region"><input className="etlInput" value={editProf.region} onChange={e=>setEditProf(p=>({...p,region:e.target.value}))}/></FG>
              <FG label="Prefix"><input className="etlInput etlInputMono" value={editProf.prefix} onChange={e=>setEditProf(p=>({...p,prefix:e.target.value}))}/></FG>
            </div>
          )}
          {editProf.type === 'PostgreSQL' && (
            <div className="etlFormRow3">
              <FG label="Host"><input className="etlInput etlInputMono" value={editProf.host} onChange={e=>setEditProf(p=>({...p,host:e.target.value}))}/></FG>
              <FG label="Port"><input className="etlInput" value={editProf.port} onChange={e=>setEditProf(p=>({...p,port:e.target.value}))}/></FG>
              <FG label="Database"><input className="etlInput etlInputMono" value={editProf.db} onChange={e=>setEditProf(p=>({...p,db:e.target.value}))}/></FG>
            </div>
          )}
          {(editProf.type === 'PubSub') && (
            <div className="etlFormRow2">
              <FG label="Project"><input className="etlInput etlInputMono" value={editProf.project} onChange={e=>setEditProf(p=>({...p,project:e.target.value}))}/></FG>
              <FG label="Topic"><input className="etlInput etlInputMono" value={editProf.topic} onChange={e=>setEditProf(p=>({...p,topic:e.target.value}))}/></FG>
            </div>
          )}
          {editProf.type === 'Kafka' && (
            <div className="etlFormRow2">
              <FG label="Brokers (comma-separated)"><input className="etlInput etlInputMono" value={editProf.brokers} onChange={e=>setEditProf(p=>({...p,brokers:e.target.value}))}/></FG>
              <FG label="Topic"><input className="etlInput etlInputMono" value={editProf.topic} onChange={e=>setEditProf(p=>({...p,topic:e.target.value}))}/></FG>
            </div>
          )}
          {(editProf.type === 'SFTP' || editProf.type === 'REST') && (
            <div className="etlFormRow2">
              <FG label="Host / URL"><input className="etlInput etlInputMono" value={editProf.host} onChange={e=>setEditProf(p=>({...p,host:e.target.value}))}/></FG>
              <FG label="Username / API Key"><input className="etlInput" placeholder="Stored in Secret Manager"/></FG>
            </div>
          )}
        </ModalShell>
      )}
      {editQc && (
        <ModalShell title={editQc.id ? 'Edit QC Rule' : 'New Global QC Rule'} onClose={() => setEditQc(null)} onSave={() => saveQc(editQc)} width={620}>
          <div className="etlFormRow2">
            <FG label="Entity">
              <select className="etlInput" value={editQc.entity} onChange={e=>setEditQc(r=>({...r,entity:e.target.value}))}>
                {ENTITY_OPTS.map(o=><option key={o}>{o}</option>)}
              </select>
            </FG>
            <FG label="Field Name"><input className="etlInput etlInputMono" value={editQc.field} onChange={e=>setEditQc(r=>({...r,field:e.target.value}))}/></FG>
          </div>
          <div className="etlFormRow2">
            <FG label="Rule Type">
              <select className="etlInput" value={editQc.rule} onChange={e=>setEditQc(r=>({...r,rule:e.target.value}))}>
                {QC_TYPES.map(o=><option key={o}>{o}</option>)}
              </select>
            </FG>
            <FG label="Severity">
              <select className="etlInput" value={editQc.severity} onChange={e=>setEditQc(r=>({...r,severity:e.target.value}))}>
                {SEVERITY.map(o=><option key={o}>{o}</option>)}
              </select>
            </FG>
          </div>
          <FG label="Expression / SQL condition"><textarea className="etlInput etlInputMono" rows={3} value={editQc.expr} onChange={e=>setEditQc(r=>({...r,expr:e.target.value}))}/></FG>
          <FG label="Description"><input className="etlInput" value={editQc.desc} onChange={e=>setEditQc(r=>({...r,desc:e.target.value}))}/></FG>
        </ModalShell>
      )}
      {editXfm && (
        <ModalShell title={editXfm.id ? 'Edit Transform Rule' : 'New Global Transform'} onClose={() => setEditXfm(null)} onSave={() => saveXfm(editXfm)} width={620}>
          <div className="etlFormRow2">
            <FG label="Entity">
              <select className="etlInput" value={editXfm.entity} onChange={e=>setEditXfm(r=>({...r,entity:e.target.value}))}>
                {ENTITY_OPTS.map(o=><option key={o}>{o}</option>)}
              </select>
            </FG>
            <FG label="Field Name"><input className="etlInput etlInputMono" value={editXfm.field} onChange={e=>setEditXfm(r=>({...r,field:e.target.value}))}/></FG>
          </div>
          <FG label="Transform Type">
            <select className="etlInput" value={editXfm.type} onChange={e=>setEditXfm(r=>({...r,type:e.target.value}))}>
              {XFM_TYPES.map(o=><option key={o}>{o}</option>)}
            </select>
          </FG>
          <FG label="Rule Expression"><textarea className="etlInput etlInputMono" rows={3} value={editXfm.rule} onChange={e=>setEditXfm(r=>({...r,rule:e.target.value}))}/></FG>
          <FG label="Description"><input className="etlInput" value={editXfm.desc} onChange={e=>setEditXfm(r=>({...r,desc:e.target.value}))}/></FG>
        </ModalShell>
      )}
    </div>
  )
}

/* ─── Main ETL page (pipeline list) ─────────────────────────────────────── */
export default function ETL() {
  const navigate = useNavigate()
  const location = useLocation()
  const [view,         setView]         = useState(location.state?.view || 'list')    // 'list' | 'configure' | 'global'
  const [pipelines,    setPipelines]    = useState(INIT_PIPELINES)
  const [profiles,     setProfiles]     = useState(INIT_PROFILES)
  const [qcRules,      setQcRules]      = useState(INIT_QC)
  const [transforms,   setTransforms]   = useState(INIT_TRANSFORMS)
  const [selectedPl,   setSelectedPl]   = useState(null)
  const [entityFilter, setEntityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQ,      setSearchQ]      = useState('')

  const filtered = useMemo(() => pipelines.filter(p => {
    if (entityFilter !== 'All' && p.entity !== entityFilter) return false
    if (statusFilter !== 'All' && p.status !== statusFilter) return false
    if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase()) &&
        !p.vendor.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  }), [pipelines, entityFilter, statusFilter, searchQ])

  const totalReview = pipelines.reduce((s,p) => s+p.review, 0)
  const totalFailed = pipelines.reduce((s,p) => s+p.failed, 0)
  const errorCount  = pipelines.filter(p => p.status==='error').length

  function openConfigure(pl) { setSelectedPl(pl); setView('configure') }
  function savePipeline(updated) {
    setPipelines(prev => prev.map(p => p.id===updated.id ? {...p,...updated} : p))
    setView('list')
  }
  function toggleEnabled(id, val) {
    setPipelines(prev => prev.map(p => p.id===id ? {...p, enabled:val} : p))
  }

  // ── Sub-views ──
  if (view === 'configure' && selectedPl) {
    return <ConfigurePage pl={selectedPl} profiles={profiles} qcRules={qcRules} transforms={transforms}
             onBack={() => setView('list')} onSave={savePipeline}/>
  }
  if (view === 'global') {
    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
        <ETLSubNav view={view} onViewChange={setView}
          metrics={{ pipelines:pipelines.length, errors:errorCount, qcFailed:totalFailed, review:totalReview, active:pipelines.filter(p=>p.enabled).length }}/>
        <GlobalSettingsPage profiles={profiles} setProfiles={setProfiles}
          qcRules={qcRules} setQcRules={setQcRules}
          transforms={transforms} setTransforms={setTransforms}
          onBack={() => setView('list')}/>
      </div>
    )
  }

  // ── Pipeline list ──
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>

      {/* Sub-nav + metrics */}
      <ETLSubNav
        view={view}
        onViewChange={setView}
        metrics={{ pipelines:pipelines.length, errors:errorCount, qcFailed:totalFailed, review:totalReview, active:pipelines.filter(p=>p.enabled).length }}
      />

      {/* Filter bar */}
      <div className="sBar" style={{flexWrap:'wrap',rowGap:4}}>
        <div className="siWrap" style={{flex:'1 1 220px',minWidth:180}}>
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search pipeline name or vendor…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
          {searchQ && <button className="siClear" onClick={() => setSearchQ('')}>✕</button>}
        </div>
        <select className="fSel" value={entityFilter} onChange={e=>setEntityFilter(e.target.value)}>
          <option value="All">All Entities</option>
          {ENTITY_OPTS.map(o=><option key={o}>{o}</option>)}
        </select>
        <select className="fSel" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          {['success','warn','error'].map(o=><option key={o} value={o}>{STATUS_META[o].label}</option>)}
        </select>
        <div style={{marginLeft:'auto',fontSize:11,color:'var(--txt3)',alignSelf:'center',whiteSpace:'nowrap'}}>
          <strong style={{color:'var(--txt)'}}>{filtered.length}</strong> / {pipelines.length} pipelines
        </div>
      </div>

      {/* Pipeline table */}
      <div className="tWrap">
        <table className="vt" style={{minWidth:1020}}>
          <thead>
            <tr>
              <th style={{minWidth:260}}>Pipeline</th>
              <th>Entity</th>
              <th>Schedule</th>
              <th style={{whiteSpace:'nowrap'}}>Last Run</th>
              <th>Status</th>
              <th className="mn">Processed</th>
              <th className="mn">QC Failed</th>
              <th className="mn">Review</th>
              <th style={{textAlign:'center'}}>Enabled</th>
              <th style={{minWidth:160,whiteSpace:'nowrap'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const st = p.enabled ? p.status : 'disabled'
              return (
                <tr key={p.id} style={{opacity:p.enabled ? 1 : .6}}>
                  <td>
                    <button className="etlLinkBtn" style={{fontWeight:700,fontSize:12,color:'var(--blue)',display:'block',marginBottom:2,textAlign:'left'}}
                      onClick={() => navigate('/etl-runs', { state: { pipeline: p.name } })}>{p.name}</button>
                    <code style={{fontSize:9,color:'var(--txt3)',fontFamily:'monospace'}}>{p.bqTable}</code>
                  </td>
                  <td><span className={`tag ${ENTITY_CLS[p.entity]||'tN'}`} style={{fontSize:9}}>{p.entity}</span></td>
                  <td style={{fontSize:11,color:'var(--txt2)',whiteSpace:'nowrap'}}>{p.freq}</td>
                  <td style={{fontSize:10,fontFamily:'monospace',color:'var(--txt3)',whiteSpace:'nowrap'}}>
                    {p.status==='error' ? <span style={{color:'var(--red)',fontWeight:600}}>Failed</span> : p.lastRun || '—'}
                  </td>
                  <td><Badge st={st}/></td>
                  <td className="mn" style={{fontWeight:p.records>0?600:400}}>{p.records.toLocaleString()}</td>
                  <td className="mn">
                    {p.failed > 0
                      ? <button className="etlLinkBtn etlRed" onClick={() => navigate('/etl-runs', { state: { pipeline: p.name } })}>{p.failed.toLocaleString()}</button>
                      : <span style={{color:'var(--txt3)'}}>—</span>}
                  </td>
                  <td className="mn">
                    {p.review > 0
                      ? <button className="etlLinkBtn etlAmber" onClick={() => navigate('/etl-review', { state: { pipeline: p.name } })}>{p.review.toLocaleString()}</button>
                      : <span style={{color:'var(--txt3)'}}>—</span>}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <Toggle on={p.enabled} onChange={v => toggleEnabled(p.id, v)}/>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'nowrap'}}>
                      <button className="btn btnP btnSm" onClick={() => openConfigure(p)}>⚙ Configure</button>
                      <button className="btn btnS btnSm" title="Trigger manual run">▶ Run</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
