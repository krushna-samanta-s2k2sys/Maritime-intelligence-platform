import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ETLSubNav from '../components/etl/ETLSubNav'

const PIPELINES_LIST = [
  'All Pipelines',
  'IHS Fairplay — Vessel Registry',
  "Lloyd's Register — Class Notation",
  'DNV GL — Class & Surveys',
  'Bureau Veritas — Certificates',
  'Equasis — Ownership & Finance',
  'MarineTraffic — AIS Positions',
  'Refinitiv — Sanctions Screening',
  'Paris MOU — PSC Inspections',
  'Tokyo MOU — PSC Inspections',
  'World Ports — Port Directory',
  'Dun & Bradstreet — Companies',
  'Veson IMOS — Fixtures',
  'Baltic Exchange — Freight Rates',
]

function airflowId(pipeline, started, mode = 'scheduled') {
  const ts = started.replace(' ', 'T').replace(/(\d{2}:\d{2})$/, '$1:00') + '+00:00'
  const slug = pipeline.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
  return `${mode}__${slug}__${ts}`
}

const RAW_RUNS = [
  { pipeline:'IHS Fairplay — Vessel Registry',    entity:'Vessel',  started:'2026-05-11 02:14', ended:'2026-05-11 02:58', status:'success', processed:847392,  qcFailed:312,  review:89,  mode:'scheduled' },
  { pipeline:'DNV GL — Class & Surveys',          entity:'Vessel',  started:'2026-05-11 03:22', ended:'2026-05-11 03:41', status:'success', processed:241800,  qcFailed:54,   review:23,  mode:'scheduled' },
  { pipeline:"Lloyd's Register — Class Notation", entity:'Vessel',  started:'2026-05-11 03:45', ended:'2026-05-11 04:12', status:'warn',    processed:198200,  qcFailed:1240, review:441, mode:'scheduled' },
  { pipeline:'Bureau Veritas — Certificates',     entity:'Vessel',  started:'2026-05-10 04:00', ended:'2026-05-10 04:44', status:'success', processed:167400,  qcFailed:88,   review:31,  mode:'scheduled' },
  { pipeline:'Equasis — Ownership & Finance',     entity:'Vessel',  started:'2026-05-11 05:10', ended:'2026-05-11 05:13', status:'error',   processed:0,       qcFailed:0,    review:0,   mode:'scheduled' },
  { pipeline:'MarineTraffic — AIS Positions',     entity:'Vessel',  started:'2026-05-11 09:00', ended:'2026-05-11 09:58', status:'success', processed:9241000, qcFailed:1820, review:0,   mode:'scheduled' },
  { pipeline:'Refinitiv — Sanctions Screening',   entity:'Vessel',  started:'2026-05-11 01:00', ended:'2026-05-11 01:22', status:'success', processed:55000,   qcFailed:12,   review:38,  mode:'scheduled' },
  { pipeline:'Paris MOU — PSC Inspections',       entity:'Vessel',  started:'2026-05-09 06:00', ended:'2026-05-09 06:48', status:'success', processed:42100,   qcFailed:6,    review:14,  mode:'scheduled' },
  { pipeline:'Tokyo MOU — PSC Inspections',       entity:'Vessel',  started:'2026-05-09 07:30', ended:'2026-05-09 08:05', status:'success', processed:38900,   qcFailed:8,    review:11,  mode:'scheduled' },
  { pipeline:'World Ports — Port Directory',      entity:'Port',    started:'2026-05-01 08:00', ended:'2026-05-01 08:29', status:'success', processed:12400,   qcFailed:22,   review:9,   mode:'scheduled' },
  { pipeline:'Dun & Bradstreet — Companies',      entity:'Company', started:'2026-05-01 10:00', ended:'2026-05-01 11:42', status:'success', processed:284000,  qcFailed:512,  review:188, mode:'scheduled' },
  { pipeline:'IHS Fairplay — Vessel Registry',    entity:'Vessel',  started:'2026-05-10 02:14', ended:'2026-05-10 02:59', status:'success', processed:847200,  qcFailed:298,  review:74,  mode:'scheduled' },
  { pipeline:"Lloyd's Register — Class Notation", entity:'Vessel',  started:'2026-05-10 03:45', ended:'2026-05-10 04:10', status:'success', processed:197900,  qcFailed:210,  review:88,  mode:'scheduled' },
  { pipeline:'Equasis — Ownership & Finance',     entity:'Vessel',  started:'2026-05-10 05:10', ended:'2026-05-10 06:01', status:'success', processed:312400,  qcFailed:84,   review:29,  mode:'scheduled' },
  { pipeline:'Baltic Exchange — Freight Rates',   entity:'Market',  started:'2026-05-11 08:00', ended:'2026-05-11 08:04', status:'success', processed:1200,    qcFailed:0,    review:0,   mode:'scheduled' },
  { pipeline:'IHS Fairplay — Vessel Registry',    entity:'Vessel',  started:'2026-05-11 08:30', ended:null,               status:'running', processed:412000,  qcFailed:0,    review:0,   mode:'manual'    },
]

const RUNS = RAW_RUNS.map((r, i) => ({
  ...r,
  id: airflowId(r.pipeline, r.started, r.mode),
  seq: i + 1,
}))

const FAILED_RECORDS = {
  3: [
    { id:'FR001', imo:'9412345', name:'PACIFIC STAR',    field:'gross_tonnage', rule:'GQ04', value:'620000', reason:'GT exceeds max (600,000)',          severity:'warn'  },
    { id:'FR002', imo:'9287631', name:'EASTERN PIONEER', field:'flag_code',     rule:'GQ07', value:'XX',     reason:'Flag code not in ISO 3166-1',       severity:'error' },
    { id:'FR003', imo:'9534892', name:'STELLAR WIND',    field:'loa',           rule:'GQ08', value:'520.0',  reason:'LOA 520 m exceeds max (500 m)',      severity:'warn'  },
    { id:'FR004', imo:'9412340', name:'GULF VOYAGER',    field:'year_built',    rule:'GQ06', value:'1888',   reason:'Built year out of valid range',      severity:'warn'  },
    { id:'FR005', imo:'9341122', name:'OCEAN PRIDE',     field:'imo_number',    rule:'GQ01', value:'934112', reason:'IMO has only 6 digits',              severity:'error' },
    { id:'FR006', imo:'9601234', name:'PACIFIC ATLAS',   field:'vessel_name',   rule:'GQ03', value:'',       reason:'Vessel name is blank',               severity:'error' },
  ],
  6: [
    { id:'FR007', imo:'9778532', name:'MAERSK COLON',   field:'mmsi', rule:'GQ02', value:'21900123',  reason:'MMSI has only 8 digits',  severity:'error' },
    { id:'FR008', imo:'9703291', name:'MSC OSCAR',       field:'mmsi', rule:'GQ02', value:'2558030001', reason:'MMSI has 10 digits',      severity:'error' },
  ],
}

const REVIEW_ITEMS = {
  3: [
    { imo:'9412345', name:'PACIFIC STAR',    fields:4, priority:'high',   reason:'GT/DWT conflict + new class notation' },
    { imo:'9287631', name:'EASTERN PIONEER', fields:2, priority:'medium', reason:'Flag code mismatch across vendors' },
    { imo:'9534892', name:'STELLAR WIND',    fields:6, priority:'high',   reason:'Owner change detected' },
    { imo:'9412340', name:'GULF VOYAGER',    fields:1, priority:'low',    reason:'Built year discrepancy (2007 vs 2008)' },
  ],
  11: [
    { imo:'D-00123', name:'Aegean Carriers SA',      fields:3, priority:'high',   reason:'LEI mismatch across vendors' },
    { imo:'D-00441', name:'Pacific Crude Carriers',  fields:2, priority:'medium', reason:'Address update needs verification' },
  ],
}

const STATUS_CLS = { success:'stA', warn:'stD', error:'stR', running:'stB' }
const STATUS_LBL = { success:'Success', warn:'Warning', error:'Failed', running:'Running' }
const PRIO_CLS   = { high:'stR', medium:'stD', low:'stA' }

function duration(r) {
  if (!r.ended) return r.status === 'running' ? '⏳ Running…' : '—'
  const ms = new Date(r.ended) - new Date(r.started)
  const m  = Math.floor(ms / 60000)
  const s  = Math.round((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

export default function ETLRuns() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [selRun,       setSelRun]       = useState(null)
  const [detailTab,    setDetailTab]    = useState('log')   // 'log' | 'failed' | 'review'
  const [pipelineF,    setPipelineF]    = useState(location.state?.pipeline || 'All Pipelines')
  const [statusF,      setStatusF]      = useState('All')
  const [entityF,      setEntityF]      = useState('All')
  const [sortKey,      setSortKey]      = useState('started')
  const [sortDir,      setSortDir]      = useState('desc')
  const [selectedRows, setSelectedRows] = useState(new Set())

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  function SortIcon({ col }) {
    if (sortKey !== col) return <span style={{opacity:.25,marginLeft:3}}>↕</span>
    return <span style={{marginLeft:3}}>{sortDir==='asc'?'▲':'▼'}</span>
  }

  const filtered = useMemo(() => {
    let list = RUNS.filter(r => {
      if (pipelineF !== 'All Pipelines' && r.pipeline !== pipelineF) return false
      if (statusF !== 'All' && r.status !== statusF) return false
      if (entityF !== 'All' && r.entity !== entityF) return false
      return true
    })
    list = [...list].sort((a, b) => {
      let av, bv
      if (sortKey === 'started')   { av = a.started;   bv = b.started   }
      if (sortKey === 'pipeline')  { av = a.pipeline;  bv = b.pipeline  }
      if (sortKey === 'status')    { av = a.status;    bv = b.status    }
      if (sortKey === 'processed') { av = a.processed; bv = b.processed }
      if (sortKey === 'qcFailed')  { av = a.qcFailed;  bv = b.qcFailed  }
      if (sortKey === 'review')    { av = a.review;    bv = b.review    }
      if (sortKey === 'duration')  { av = duration(a); bv = duration(b) }
      if (av === undefined) return 0
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return list
  }, [pipelineF, statusF, entityF, sortKey, sortDir])

  const failedRecords = selRun ? (FAILED_RECORDS[selRun.seq] || []) : []
  const reviewItems   = selRun ? (REVIEW_ITEMS[selRun.seq]   || []) : []

  function selectRun(r) {
    setSelRun(r)
    setDetailTab('log')
    setSelectedRows(new Set())
  }

  function toggleRow(id) {
    setSelectedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const Th = ({ col, children, style }) => (
    <th style={{cursor:'pointer',userSelect:'none',...style}} onClick={() => handleSort(col)}>
      {children}<SortIcon col={col}/>
    </th>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>

      <ETLSubNav/>

      {/* Filter bar */}
      <div className="sBar" style={{flexWrap:'wrap',rowGap:4}}>
        <select className="fSel" style={{flex:'1 1 200px',minWidth:180}}
          value={pipelineF} onChange={e => setPipelineF(e.target.value)}>
          {PIPELINES_LIST.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="fSel" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="All">All Status</option>
          {['success','warn','error','running'].map(o => <option key={o} value={o}>{STATUS_LBL[o]}</option>)}
        </select>
        <select className="fSel" value={entityF} onChange={e => setEntityF(e.target.value)}>
          {['All','Vessel','Port','Company','Market'].map(o => <option key={o}>{o}</option>)}
        </select>
        <div style={{marginLeft:'auto',fontSize:11,color:'var(--txt3)',alignSelf:'center',whiteSpace:'nowrap'}}>
          <strong style={{color:'var(--txt)'}}>{filtered.length}</strong> runs
        </div>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0}}>

        {/* Runs table */}
        <div className="tWrap" style={{flex:1,borderRight:selRun?'1px solid var(--bd)':'none'}}>
          <table className="vt">
            <thead>
              <tr>
                <Th col="started" style={{whiteSpace:'nowrap'}}>Started</Th>
                <Th col="pipeline">Pipeline</Th>
                <th>Entity</th>
                <Th col="duration">Duration</Th>
                <Th col="status">Status</Th>
                <Th col="processed" className="mn">Processed</Th>
                <Th col="qcFailed" className="mn">QC Failed</Th>
                <Th col="review" className="mn">Need Review</Th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}
                  style={{cursor:'pointer',background:selRun?.id===r.id?'var(--selBg)':undefined}}
                  onClick={() => selectRun(r)}>
                  <td style={{whiteSpace:'nowrap'}}>
                    {/* Airflow-style run ID as hyperlink */}
                    <button
                      className="etlRunIdLink"
                      onClick={e => { e.stopPropagation(); selectRun(r) }}
                      title={r.id}
                    >
                      {r.mode === 'manual' ? '🔧' : '⏱'} {r.started}
                    </button>
                    <div style={{fontSize:9,color:'var(--txt3)',fontFamily:'monospace',marginTop:1,
                      maxWidth:190,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                      title={r.id}>{r.id}</div>
                  </td>
                  <td>
                    <div style={{fontWeight:600,fontSize:11}}>{r.pipeline}</div>
                  </td>
                  <td><span className="tag tN" style={{fontSize:9}}>{r.entity}</span></td>
                  <td style={{fontSize:11,color:'var(--txt2)',whiteSpace:'nowrap'}}>{duration(r)}</td>
                  <td><span className={`stBadge ${STATUS_CLS[r.status]||'stI'}`}><span className="stDot"/>{STATUS_LBL[r.status]}</span></td>
                  <td className="mn">{r.processed.toLocaleString()}</td>
                  <td className="mn">
                    {r.qcFailed > 0
                      ? <button className="etlLinkBtn etlRed"
                          onClick={e => { e.stopPropagation(); selectRun(r); setDetailTab('failed') }}>
                          {r.qcFailed.toLocaleString()}
                        </button>
                      : <span style={{color:'var(--txt3)'}}>—</span>}
                  </td>
                  <td className="mn">
                    {r.review > 0
                      ? <button className="etlLinkBtn etlAmber"
                          onClick={e => { e.stopPropagation(); navigate('/etl-review', { state: { pipeline: r.pipeline, run: r } }) }}>
                          {r.review.toLocaleString()}
                        </button>
                      : <span style={{color:'var(--txt3)'}}>—</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btnS btnSm" onClick={() => navigate('/etl-raw', { state: { run: r } })}>📦 Raw</button>
                      <button className="btn btnS btnSm">↺ Re-run</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selRun && (
          <div style={{width:500,flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden',borderLeft:'1px solid var(--bd)'}}>

            {/* Panel header */}
            <div className="etlRunDetailHdr">
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontWeight:700,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selRun.pipeline}</div>
                <div style={{fontSize:9,color:'var(--txt3)',fontFamily:'monospace',marginTop:3,wordBreak:'break-all'}}>{selRun.id}</div>
              </div>
              <button className="btn btnS btnSm" style={{flexShrink:0,marginLeft:8}} onClick={() => setSelRun(null)}>✕</button>
            </div>

            {/* KPIs */}
            <div className="etlRunKpis">
              <div className="etlRunKpi"><span className="etlKpiVal">{selRun.processed.toLocaleString()}</span><span className="etlKpiLbl">Processed</span></div>
              <div className="etlRunKpi etlKpiErr"><span className="etlKpiVal">{selRun.qcFailed.toLocaleString()}</span><span className="etlKpiLbl">QC Failed</span></div>
              <div className="etlRunKpi etlKpiWarn"><span className="etlKpiVal">{selRun.review.toLocaleString()}</span><span className="etlKpiLbl">Need Review</span></div>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid var(--bd)',background:'var(--bg2)',flexShrink:0}}>
              {[
                ['log',    'Run Log'],
                ['failed', `QC Failures${selRun.qcFailed>0?' ('+selRun.qcFailed+')':''}`],
                ['review', `Review Queue${selRun.review>0?' ('+selRun.review+')':''}`],
              ].map(([t,l]) => (
                <button key={t}
                  className={`etlNavTab${detailTab===t?' on':''}`}
                  style={{flex:1,borderRadius:0,fontSize:10,padding:'7px 4px'}}
                  onClick={() => setDetailTab(t)}>{l}</button>
              ))}
            </div>

            {/* Tab: Run Log */}
            {detailTab==='log' && (
              <div style={{flex:1,overflowY:'auto',padding:14}}>
                <div className="etlLogLine etlLogOk">✓ {selRun.started.split(' ')[1]}:00  Pipeline triggered ({selRun.mode})</div>
                <div className="etlLogLine etlLogOk">✓ {selRun.started.split(' ')[1]}:12  Source BigQuery connection established</div>
                <div className="etlLogLine etlLogOk">✓ {selRun.started.split(' ')[1]}:48  Reading from <code style={{fontSize:10}}>{selRun.pipeline.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,25)}</code></div>
                <div className="etlLogLine etlLogOk">✓ {selRun.ended?.split(' ')[1]||'??:??'}  Read complete — {selRun.processed.toLocaleString()} records ingested</div>
                <div className="etlLogLine etlLogOk">✓ Applying global transformation rules (GT01–GT10)</div>
                <div className="etlLogLine etlLogOk">✓ Transformations applied</div>
                <div className="etlLogLine etlLogOk">✓ Running QC rules (global + pipeline-specific)</div>
                {selRun.qcFailed>0 && <div className="etlLogLine etlLogWarn">⚠ QC complete — {selRun.qcFailed.toLocaleString()} records failed QC, written to etl_ops.qc_failures</div>}
                {selRun.review>0   && <div className="etlLogLine etlLogWarn">⚠ {selRun.review.toLocaleString()} records routed to review queue (confidence &lt; 90% or conflict)</div>}
                {selRun.status==='error'
                  ? <div className="etlLogLine etlLogErr">✕ Pipeline failed — source connection timed out after 180s</div>
                  : selRun.status==='running'
                    ? <div className="etlLogLine etlLogWarn">⏳ Merging records into master table (in progress…)</div>
                    : <>
                        <div className="etlLogLine etlLogOk">✓ MERGE {(selRun.processed-selRun.qcFailed).toLocaleString()} records → master table</div>
                        <div className="etlLogLine etlLogOk">✓ {selRun.ended?.split(' ')[1]}  Pipeline completed {selRun.status==='warn'?'with warnings':'successfully'}</div>
                      </>
                }
              </div>
            )}

            {/* Tab: QC Failures */}
            {detailTab==='failed' && (
              <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                {failedRecords.length===0
                  ? <div className="etlEmpty" style={{margin:16}}>No QC failures for this run.</div>
                  : <>
                      <div style={{display:'flex',gap:8,padding:'8px 12px',background:'var(--bg2)',
                        borderBottom:'1px solid var(--bd)',flexShrink:0,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,color:'var(--txt2)',alignSelf:'center'}}>
                          {selectedRows.size>0?`${selectedRows.size} selected`:`${failedRecords.length} failed records`}
                        </span>
                        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                          <button className="btn btnS btnSm">⬇ Export CSV</button>
                          <button className="btn btnS btnSm">✉ Email to Vendor</button>
                        </div>
                      </div>
                      <div className="tWrap" style={{flex:1}}>
                        <table className="vt" style={{fontSize:11}}>
                          <thead>
                            <tr>
                              <th style={{width:24}}><input type="checkbox"
                                checked={selectedRows.size===failedRecords.length && failedRecords.length>0}
                                onChange={() => setSelectedRows(
                                  selectedRows.size===failedRecords.length ? new Set() : new Set(failedRecords.map(r=>r.id))
                                )}/></th>
                              <th>IMO</th><th>Vessel</th><th>Field</th><th>Rule</th><th>Value</th><th>Sev.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {failedRecords.map(r=>(
                              <tr key={r.id}>
                                <td><input type="checkbox" checked={selectedRows.has(r.id)} onChange={() => toggleRow(r.id)}/></td>
                                <td><code className="etlCode" style={{fontSize:9}}>{r.imo}</code></td>
                                <td style={{fontWeight:600}}>{r.name}</td>
                                <td><code className="etlCode" style={{fontSize:9}}>{r.field}</code></td>
                                <td><code className="etlCode" style={{fontSize:9}}>{r.rule}</code></td>
                                <td style={{color:'var(--red)',fontFamily:'monospace',fontSize:10,
                                  maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                                  title={r.reason}>{r.value||'(blank)'}</td>
                                <td><span className={`stBadge ${r.severity==='error'?'stR':'stD'}`} style={{fontSize:8}}><span className="stDot"/>{r.severity}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                }
              </div>
            )}

            {/* Tab: Review Queue */}
            {detailTab==='review' && (
              <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                {reviewItems.length===0
                  ? <div className="etlEmpty" style={{margin:16}}>No items in review queue for this run.</div>
                  : <>
                      <div style={{display:'flex',gap:8,padding:'8px 12px',background:'var(--bg2)',
                        borderBottom:'1px solid var(--bd)',flexShrink:0}}>
                        <span style={{fontSize:11,color:'var(--txt2)',alignSelf:'center'}}>
                          {reviewItems.length} records need human review
                        </span>
                        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                          <button className="btn btnP btnSm" onClick={() => navigate('/etl-review', { state: { pipeline: selRun.pipeline, run: selRun } })}>
                            👁 Open Review Workspace →
                          </button>
                        </div>
                      </div>
                      <div className="tWrap" style={{flex:1}}>
                        <table className="vt" style={{fontSize:11}}>
                          <thead>
                            <tr><th>IMO / ID</th><th>Name</th><th>Fields</th><th>Priority</th><th>Reason</th></tr>
                          </thead>
                          <tbody>
                            {reviewItems.map((r,i)=>(
                              <tr key={i}>
                                <td><code className="etlCode" style={{fontSize:9}}>{r.imo}</code></td>
                                <td style={{fontWeight:600}}>{r.name}</td>
                                <td style={{textAlign:'center'}}>{r.fields}</td>
                                <td><span className={`stBadge ${PRIO_CLS[r.priority]}`} style={{fontSize:8}}><span className="stDot"/>{r.priority}</span></td>
                                <td style={{fontSize:10,color:'var(--txt3)'}}>{r.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                }
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
