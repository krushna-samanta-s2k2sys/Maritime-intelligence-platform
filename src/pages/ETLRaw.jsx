import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/* ─── Mock raw landing-table records ─────────────────────────────────────── */
const RAW_RECORDS = [
  { _row:'R0001', IMO:'9412345',  VESSEL_NAME:'PACIFIC STAR',         FLAG:'GR', GROSS_TONNAGE:'62400',  DWT:'66000',  LOA:'294.1', YR:'2002', TYPE:'19 Container Ship', CALL:'SVCD3',  MMSI:'240123456', _ts:'2026-05-11T03:45:22Z', _qc:'fail',    _err:'GQ04: gross_tonnage=62400 exceeds max (82,500). GQ04 threshold violation.' },
  { _row:'R0002', IMO:'9287631',  VESSEL_NAME:'EASTERN PIONEER',      FLAG:'XX', GROSS_TONNAGE:'81000',  DWT:'145000', LOA:'274.0', YR:'2009', TYPE:'09 Oil Tanker',     CALL:'9V2340', MMSI:'563123456', _ts:'2026-05-11T03:45:23Z', _qc:'fail',    _err:'GQ07: flag_code=XX not in ISO 3166-1 alpha-2 reference table.' },
  { _row:'R0003', IMO:'9534892',  VESSEL_NAME:'STELLAR WIND',         FLAG:'JP', GROSS_TONNAGE:'152000', DWT:'71000',  LOA:'299.0', YR:'2015', TYPE:'21 LNG Carrier',    CALL:'7JQS',   MMSI:'431123456', _ts:'2026-05-11T03:45:24Z', _qc:'pass',    _err:'' },
  { _row:'R0004', IMO:'9412340',  VESSEL_NAME:'GULF VOYAGER',         FLAG:'SA', GROSS_TONNAGE:'87500',  DWT:'96000',  LOA:'299.9', YR:'1888', TYPE:'19 Container Ship', CALL:'7JAS9',  MMSI:'403123456', _ts:'2026-05-11T03:45:25Z', _qc:'warn',    _err:'GQ06: year_built=1888 outside valid range 1900–2028.' },
  { _row:'R0005', IMO:'9341122',  VESSEL_NAME:'OCEAN PRIDE',          FLAG:'PA', GROSS_TONNAGE:'43000',  DWT:'76000',  LOA:'229.0', YR:'2005', TYPE:'17 Bulk Carrier',   CALL:'HP2340', MMSI:'352123456', _ts:'2026-05-11T03:45:26Z', _qc:'pass',    _err:'' },
  { _row:'R0006', IMO:'9601234',  VESSEL_NAME:'PACIFIC ATLAS',        FLAG:'HK', GROSS_TONNAGE:'82400',  DWT:'163000', LOA:'229.2', YR:'2012', TYPE:'17 Bulk Carrier',   CALL:'VRQM8',  MMSI:'477123456', _ts:'2026-05-11T03:45:27Z', _qc:'pass',    _err:'' },
  { _row:'R0007', IMO:'9188741',  VESSEL_NAME:'NORTHERN STAR',        FLAG:'NO', GROSS_TONNAGE:'24800',  DWT:'39000',  LOA:'183.5', YR:'2000', TYPE:'12 Chemical Tanker',CALL:'LDAS3',  MMSI:'257123456', _ts:'2026-05-11T03:45:28Z', _qc:'pass',    _err:'' },
  { _row:'R0008', IMO:'9778532',  VESSEL_NAME:'MAERSK COLON',         FLAG:'DK', GROSS_TONNAGE:'194849', DWT:'199023', LOA:'399.0', YR:'2015', TYPE:'19 Container Ship', CALL:'OXQF2',  MMSI:'219123456', _ts:'2026-05-11T03:45:29Z', _qc:'pass',    _err:'' },
  { _row:'R0009', IMO:'9501238',  VESSEL_NAME:'ATLANTIC BULKER',      FLAG:'BS', GROSS_TONNAGE:'93000',  DWT:'180000', LOA:'292.0', YR:'2010', TYPE:'17 Bulk Carrier',   CALL:'C6QR4',  MMSI:'308123456', _ts:'2026-05-11T03:45:30Z', _qc:'pass',    _err:'' },
  { _row:'R0010', IMO:'9703291',  VESSEL_NAME:'MSC OSCAR',            FLAG:'PT', GROSS_TONNAGE:'193000', DWT:'199023', LOA:'395.4', YR:'2015', TYPE:'19 Container Ship', CALL:'CQEP5',  MMSI:'255123456', _ts:'2026-05-11T03:45:31Z', _qc:'pass',    _err:'' },
  { _row:'R0011', IMO:'9241061',  VESSEL_NAME:'QUEEN MARY 2',         FLAG:'GB', GROSS_TONNAGE:'148215', DWT:'15000',  LOA:'345.0', YR:'2003', TYPE:'44 Passenger/Cruise',CALL:'GBQM2', MMSI:'232123456', _ts:'2026-05-11T03:45:32Z', _qc:'pass',    _err:'' },
  { _row:'R0012', IMO:'9612988',  VESSEL_NAME:'PIONEER MAX',          FLAG:'MH', GROSS_TONNAGE:'82600',  DWT:'82000',  LOA:'229.0', YR:'2013', TYPE:'15 LPG Carrier',    CALL:'V7QP6',  MMSI:'538123456', _ts:'2026-05-11T03:45:33Z', _qc:'pass',    _err:'' },
  { _row:'R0013', IMO:'9345612',  VESSEL_NAME:'SEA EAGLE',            FLAG:'GR', GROSS_TONNAGE:'57200',  DWT:'105000', LOA:'249.9', YR:'2007', TYPE:'09 Oil Tanker',     CALL:'SVAB1',  MMSI:'241123456', _ts:'2026-05-11T03:45:34Z', _qc:'pass',    _err:'' },
  { _row:'R0014', IMO:'9423301',  VESSEL_NAME:'ARCTIC VOYAGER',       FLAG:'NO', GROSS_TONNAGE:'31000',  DWT:'49500',  LOA:'183.0', YR:'2008', TYPE:'12 Chemical Tanker',CALL:'LAAR9',  MMSI:'258123456', _ts:'2026-05-11T03:45:35Z', _qc:'pass',    _err:'' },
  { _row:'R0015', IMO:'9589012',  VESSEL_NAME:'TROPICAL BREEZE',      FLAG:'PA', GROSS_TONNAGE:'50400',  DWT:'92000',  LOA:'228.9', YR:'2011', TYPE:'17 Bulk Carrier',   CALL:'3EQZ4',  MMSI:'353123456', _ts:'2026-05-11T03:45:36Z', _qc:'warn',    _err:'GQ05: dwt=92000 near upper warning threshold (650,000 check passed but cross-field GT/DWT ratio unusual).' },
  { _row:'R0016', IMO:'9234501',  VESSEL_NAME:'BLUE DIAMOND',         FLAG:'LR', GROSS_TONNAGE:'159000', DWT:'317000', LOA:'333.0', YR:'2006', TYPE:'09 Oil Tanker',     CALL:'A8XZ2',  MMSI:'636123456', _ts:'2026-05-11T03:45:37Z', _qc:'pass',    _err:'' },
  { _row:'R0017', IMO:'9101234',  VESSEL_NAME:'GOLDEN HORIZON',       FLAG:'CY', GROSS_TONNAGE:'28900',  DWT:'47000',  LOA:'182.9', YR:'1999', TYPE:'12 Chemical Tanker',CALL:'5BMQ3',  MMSI:'212123456', _ts:'2026-05-11T03:45:38Z', _qc:'pass',    _err:'' },
  { _row:'R0018', IMO:'9678901',  VESSEL_NAME:'EMERALD SEA',          FLAG:'SG', GROSS_TONNAGE:'98600',  DWT:'182000', LOA:'290.0', YR:'2014', TYPE:'09 Oil Tanker',     CALL:'9VSQ1',  MMSI:'564123456', _ts:'2026-05-11T03:45:39Z', _qc:'pass',    _err:'' },
  { _row:'R0019', IMO:'9456789',  VESSEL_NAME:'SILVER CLOUD',         FLAG:'BS', GROSS_TONNAGE:'75000',  DWT:'140000', LOA:'260.0', YR:'2009', TYPE:'09 Oil Tanker',     CALL:'C6RQ2',  MMSI:'309123456', _ts:'2026-05-11T03:45:40Z', _qc:'pass',    _err:'' },
  { _row:'R0020', IMO:'9312456',  VESSEL_NAME:'NEPTUNE GLORY',        FLAG:'PA', GROSS_TONNAGE:'43200',  DWT:'76500',  LOA:'228.5', YR:'2004', TYPE:'17 Bulk Carrier',   CALL:'3EZQ8',  MMSI:'354123456', _ts:'2026-05-11T03:45:41Z', _qc:'pass',    _err:'' },
]

const QC_META = {
  pass: { cls:'stA', label:'Pass',    dot:'#16a34a' },
  warn: { cls:'stD', label:'Warning', dot:'#d97706' },
  fail: { cls:'stR', label:'Failed',  dot:'#dc2626' },
}

const COLS = [
  { key:'_row',         label:'Row ID',       w:64,  mono:true  },
  { key:'IMO',          label:'IMO',          w:80,  mono:true  },
  { key:'VESSEL_NAME',  label:'Vessel Name',  w:180, mono:false },
  { key:'FLAG',         label:'Flag',         w:48,  mono:true  },
  { key:'GROSS_TONNAGE',label:'Gross Ton.',   w:90,  mono:true  },
  { key:'DWT',          label:'DWT',          w:80,  mono:true  },
  { key:'LOA',          label:'LOA',          w:64,  mono:true  },
  { key:'YR',           label:'Year',         w:52,  mono:true  },
  { key:'TYPE',         label:'Vessel Type',  w:160, mono:false },
  { key:'CALL',         label:'Call Sign',    w:70,  mono:true  },
  { key:'MMSI',         label:'MMSI',         w:90,  mono:true  },
  { key:'_ts',          label:'Ingested At',  w:140, mono:true  },
  { key:'_qc',          label:'QC Status',    w:80,  mono:false },
]

export default function ETLRaw() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const run     = location.state?.run
  const runName = run?.pipeline || 'Unknown Pipeline'
  const runId   = run?.id       || '—'
  const bqTable = run ? `raw_landing.${run.pipeline.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,30)}` : 'raw_landing.unknown'

  const [qcFilter,  setQcFilter]  = useState('All')
  const [searchQ,   setSearchQ]   = useState('')
  const [selRow,    setSelRow]    = useState(null)

  const filtered = useMemo(() => RAW_RECORDS.filter(r => {
    if (qcFilter !== 'All' && r._qc !== qcFilter) return false
    if (searchQ && !Object.values(r).join(' ').toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  }), [qcFilter, searchQ])

  const passCount = RAW_RECORDS.filter(r=>r._qc==='pass').length
  const warnCount = RAW_RECORDS.filter(r=>r._qc==='warn').length
  const failCount = RAW_RECORDS.filter(r=>r._qc==='fail').length

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', minHeight:0 }}>

      {/* Header */}
      <div className="dHead" style={{ padding:'0 16px', gap:8, flexWrap:'wrap' }}>
        <button className="backBtn" onClick={() => navigate('/etl-runs')}>← Run History</button>
        <div className="dHeadDiv"/>
        <div>
          <div style={{ fontWeight:700, fontSize:13 }}>📦 Raw Landing Data</div>
          <div style={{ fontSize:9, color:'var(--txt3)', fontFamily:'monospace', marginTop:1 }}>{bqTable}</div>
        </div>
        <div className="dHeadDiv"/>

        {/* KPIs */}
        <div className="etlKpiBar">
          <div className="etlKpi"><span className="etlKpiVal">{RAW_RECORDS.length.toLocaleString()}</span><span className="etlKpiLbl">Total Rows</span></div>
          <div className="etlKpi"><span className="etlKpiVal" style={{color:'#16a34a'}}>{passCount.toLocaleString()}</span><span className="etlKpiLbl">QC Pass</span></div>
          <div className="etlKpi etlKpiWarn"><span className="etlKpiVal">{warnCount.toLocaleString()}</span><span className="etlKpiLbl">Warnings</span></div>
          <div className="etlKpi etlKpiErr"><span className="etlKpiVal">{failCount.toLocaleString()}</span><span className="etlKpiLbl">QC Fail</span></div>
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button className="btn btnT btnSm">⬇ Export CSV</button>
          <button className="btn btnT btnSm" onClick={() => navigate('/etl-review', { state: { pipeline: run?.pipeline } })}>👁 Open Review</button>
        </div>
      </div>

      {/* Run context bar */}
      {run && (
        <div style={{ padding:'6px 16px', background:'#eef3ff', borderBottom:'1px solid #c7d7fc',
          fontSize:10, color:'var(--txt3)', display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <span>Pipeline: <strong style={{color:'var(--txt2)'}}>{runName}</strong></span>
          <span style={{fontFamily:'monospace'}}>Run: {runId.slice(0,60)}{runId.length>60?'…':''}</span>
          <span>Started: <strong style={{color:'var(--txt2)'}}>{run.started}</strong></span>
          <span className={`stBadge ${run.status==='success'?'stA':run.status==='warn'?'stD':'stR'}`} style={{fontSize:9}}><span className="stDot"/>{run.status}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="sBar" style={{ flexWrap:'wrap', rowGap:4 }}>
        <div className="siWrap" style={{ flex:'1 1 200px', minWidth:160 }}>
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search any field value…" value={searchQ}
            onChange={e => setSearchQ(e.target.value)}/>
          {searchQ && <button className="siClear" onClick={() => setSearchQ('')}>✕</button>}
        </div>
        {['All','pass','warn','fail'].map(s => (
          <button key={s}
            className={`btn btnSm${qcFilter===s?' btnP':' btnS'}`}
            style={{ fontSize:10 }}
            onClick={() => setQcFilter(s)}>
            {s==='All' ? 'All QC' : QC_META[s].label}
            {s==='fail' && failCount>0 && <span style={{marginLeft:4,background:'var(--red)',color:'#fff',borderRadius:10,padding:'0 5px',fontSize:8}}>{failCount}</span>}
            {s==='warn' && warnCount>0 && <span style={{marginLeft:4,background:'#d97706',color:'#fff',borderRadius:10,padding:'0 5px',fontSize:8}}>{warnCount}</span>}
          </button>
        ))}
        <div style={{ marginLeft:'auto', fontSize:11, color:'var(--txt3)', alignSelf:'center', whiteSpace:'nowrap' }}>
          <strong style={{color:'var(--txt)'}}>{filtered.length}</strong> / {RAW_RECORDS.length} rows
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* Raw data table */}
        <div className="tWrap" style={{ flex:1, borderRight: selRow ? '1px solid var(--bd)' : 'none' }}>
          <table className="vt" style={{ fontSize:11 }}>
            <thead>
              <tr>
                {COLS.map(c => <th key={c.key} style={{ whiteSpace:'nowrap', minWidth:c.w }}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const qm = QC_META[r._qc]
                const isSelected = selRow?._row === r._row
                return (
                  <tr key={r._row}
                    style={{ cursor:'pointer', background: isSelected ? 'var(--selBg)' : r._qc==='fail' ? '#fff5f5' : r._qc==='warn' ? '#fffbeb' : undefined }}
                    onClick={() => setSelRow(isSelected ? null : r)}>
                    {COLS.map(c => (
                      <td key={c.key} style={{ whiteSpace:'nowrap' }}>
                        {c.key === '_qc' ? (
                          <span className={`stBadge ${qm.cls}`} style={{fontSize:9}}><span className="stDot"/>{qm.label}</span>
                        ) : c.mono ? (
                          <code style={{ fontSize:10, fontFamily:'monospace', color:'var(--txt2)' }}>{r[c.key]}</code>
                        ) : c.key === 'VESSEL_NAME' ? (
                          <span style={{ fontWeight:600 }}>{r[c.key]}</span>
                        ) : (
                          <span style={{ color:'var(--txt2)' }}>{r[c.key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Row detail panel */}
        {selRow && (
          <div style={{ width:380, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--bd)', background:'var(--bg2)',
              display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <span style={{ fontWeight:700, fontSize:12 }}>{selRow.VESSEL_NAME}</span>
                <code style={{ fontSize:9, color:'var(--txt3)', marginLeft:8 }}>IMO {selRow.IMO}</code>
              </div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                {selRow._qc !== 'pass' && (
                  <button className="btn btnS btnSm" onClick={() => navigate('/etl-review', { state: { imo: selRow.IMO } })}>
                    👁 Review
                  </button>
                )}
                <button className="btn btnS btnSm" onClick={() => setSelRow(null)}>✕</button>
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:14 }}>
              {/* QC status */}
              <div style={{ marginBottom:14, padding:'10px 12px', background: selRow._qc==='fail'?'#fef2f2': selRow._qc==='warn'?'#fffbeb':'#f0fdf4',
                border:`1px solid ${selRow._qc==='fail'?'#fca5a5':selRow._qc==='warn'?'#fde68a':'#86efac'}`, borderRadius:6 }}>
                <div style={{ fontWeight:700, fontSize:11, marginBottom:4 }}>
                  QC Status: <span style={{color: selRow._qc==='fail'?'#dc2626':selRow._qc==='warn'?'#d97706':'#16a34a'}}>
                    {QC_META[selRow._qc].label}
                  </span>
                </div>
                {selRow._err
                  ? <div style={{ fontSize:10, fontFamily:'monospace', color:'#92400e', lineHeight:1.6 }}>{selRow._err}</div>
                  : <div style={{ fontSize:10, color:'#16a34a' }}>All QC rules passed.</div>
                }
              </div>

              {/* All field values */}
              <div style={{ fontSize:11, fontWeight:700, color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:8 }}>Raw Field Values</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <tbody>
                  {COLS.filter(c => !c.key.startsWith('_')).map(c => (
                    <tr key={c.key} style={{ borderBottom:'1px solid var(--bg3)' }}>
                      <td style={{ padding:'5px 0', fontSize:10, color:'var(--txt3)', fontWeight:600, width:'40%' }}>{c.label}</td>
                      <td style={{ padding:'5px 0 5px 8px', fontSize:11, fontFamily:'monospace', color:'var(--txt)', fontWeight:c.key==='VESSEL_NAME'?700:400 }}>
                        {selRow[c.key] || <span style={{color:'var(--txt3)'}}>—</span>}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderBottom:'1px solid var(--bg3)' }}>
                    <td style={{ padding:'5px 0', fontSize:10, color:'var(--txt3)', fontWeight:600 }}>Ingested At</td>
                    <td style={{ padding:'5px 0 5px 8px', fontSize:11, fontFamily:'monospace', color:'var(--txt)' }}>{selRow._ts}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
