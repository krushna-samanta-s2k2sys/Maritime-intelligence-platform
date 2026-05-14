import { useState, useMemo } from 'react';
import { INSPECTIONS, PSC_KPIS, MOU_STATS, DEF_CATS } from '../data/pscData';

const MOU_TABS = [
  {id:'all',label:'All MOU Regions'},
  {id:'paris',label:'Paris MOU'},
  {id:'tokyo',label:'Tokyo MOU'},
  {id:'uscg',label:'USCG'},
  {id:'indian',label:'Indian Ocean MOU'},
  {id:'med',label:'Mediterranean MOU'},
  {id:'riyadh',label:'Riyadh MOU'},
];

const MOU_MAP = {paris:'Paris MOU',tokyo:'Tokyo MOU',uscg:'USCG',indian:'Indian Ocean MOU',med:'Mediterranean MOU',riyadh:'Riyadh MOU'};

export default function Psc() {
  const [srch, setSrch] = useState('');
  const [mouFil, setMouFil] = useState('');
  const [resFil, setResFil] = useState('');
  const [mouTab, setMouTab] = useState('all');
  const [selInsp, setSelInsp] = useState(null);

  const filtered = useMemo(() => INSPECTIONS.filter(r => {
    if (srch) {
      const s = srch.toLowerCase();
      if (!r.v.toLowerCase().includes(s) && !r.imo.includes(s) && !r.port.toLowerCase().includes(s)) return false;
    }
    if (mouFil && r.mou !== mouFil) return false;
    if (resFil && r.res !== resFil) return false;
    if (mouTab !== 'all' && r.mou !== MOU_MAP[mouTab]) return false;
    return true;
  }), [srch, mouFil, resFil, mouTab]);

  const insp = selInsp;
  const riskScore = insp ? Math.min(100, insp.defs * 6 + (insp.res === 'DETENTION' ? 25 : 0)) : 0;
  const riskColor = riskScore > 60 ? '#c8102e' : riskScore > 30 ? '#b45309' : '#137333';
  const maxDef = DEF_CATS[0].cnt;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Search bar */}
      <div className="sBar">
        <div className="siWrap">
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search vessel, IMO, port, flag, deficiency code…" value={srch} onChange={e=>setSrch(e.target.value)}/>
        </div>
        <select className="fSel" value={mouFil} onChange={e=>setMouFil(e.target.value)}>
          <option value="">All MOU Regions</option>
          <option>Paris MOU</option><option>Tokyo MOU</option><option>Indian Ocean MOU</option>
          <option>Mediterranean MOU</option><option>USCG</option><option>Riyadh MOU</option>
        </select>
        <select className="fSel" value={resFil} onChange={e=>setResFil(e.target.value)}>
          <option value="">All Results</option><option>DETENTION</option><option>No detention</option>
        </select>
        <select className="fSel">
          <option value="">All Years</option><option>2024</option><option>2023</option><option>2022</option>
        </select>
        <button className="btn btnP">🔍 Search</button>
        <button className="btn btnT">🚨 Sanctions →</button>
      </div>

      {/* MOU Tabs */}
      <div style={{display:'flex',gap:0,padding:'10px 20px',overflowX:'auto',flexShrink:0,background:'var(--bg2)',borderBottom:'1px solid var(--bd)'}}>
        {MOU_TABS.map(t => (
          <div key={t.id} onClick={()=>setMouTab(t.id)}
            style={{padding:'6px 14px',fontSize:11,fontWeight:600,cursor:'pointer',borderRadius:3,
              color:mouTab===t.id?'#fff':'var(--txt3)',background:mouTab===t.id?'var(--nav-bg)':'transparent',
              whiteSpace:'nowrap',flexShrink:0,marginRight:4,transition:'all .12s'}}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Page Main */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>
        {/* KPI Row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:10}}>
          {PSC_KPIS.map((k,i) => (
            <div key={i} className="kpi" style={{'--kc':k.c}}>
              <div className="kpiV">{k.v}</div>
              <div className="kpiL">{k.l}</div>
              {k.d && <div className={`kpiDelta ${k.dn?'kpiDn':'kpiNt'}`}>{k.d}</div>}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:14}}>
          {/* Inspections Table */}
          <div className="panel" style={{minHeight:400}}>
            <div className="panelH">
              <span className="panelT">PSC Inspection Records</span>
              <span style={{fontSize:10,color:'var(--txt3)',marginLeft:4}}>{filtered.length} records</span>
              <button className="btn btnS btnSm" style={{marginLeft:'auto'}}>↗ Export CSV</button>
            </div>
            <div className="tWrap">
              <table className="dt">
                <thead><tr>
                  <th>Vessel</th><th>IMO</th><th>Flag</th><th>Port of Inspection</th>
                  <th>MOU Region</th><th>Date</th><th>No. Deficiencies</th><th>Result</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {filtered.map(r => {
                    const rc = r.res === 'DETENTION' ? 'tR' : r.defs > 0 ? 'tA' : 'tG';
                    return (
                      <tr key={r.id} style={{cursor:'pointer'}} onClick={()=>setSelInsp(r)}>
                        <td><span style={{color:'var(--blue)',fontWeight:600}}>{r.v}</span></td>
                        <td style={{fontFamily:'monospace',fontSize:10}}>{r.imo}</td>
                        <td>{r.flag}</td>
                        <td>{r.port}</td>
                        <td><span className="tag tN" style={{fontSize:8}}>{r.mou}</span></td>
                        <td style={{fontSize:10}}>{r.date}</td>
                        <td style={{textAlign:'center'}}><span className={`tag ${r.defs>=10?'tR':r.defs>0?'tA':'tG'}`}>{r.defs}</span></td>
                        <td><span className={`tag ${rc}`}>{r.res}</span></td>
                        <td><button className="btn btnS btnSm" onClick={e=>{e.stopPropagation();setSelInsp(r);}}>Detail</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: MOU Stats + Deficiency Breakdown */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="panel">
              <div className="panelH"><span className="panelT">MOU Region — Detention Rates</span></div>
              {MOU_STATS.map((m,i) => {
                const pct = Math.round(m.det/m.insp*100);
                return (
                  <div key={i} style={{padding:'8px 14px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                    <span style={{fontSize:10,fontWeight:600,color:'var(--txt2)',width:140,flexShrink:0}}>{m.n}</span>
                    <div style={{flex:1,height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:3,background:m.c,width:`${pct}%`}}/>
                    </div>
                    <span className="tag" style={{background:`${m.c}22`,color:m.c,marginLeft:6}}>{m.rate}%</span>
                    <span style={{fontSize:9,color:'var(--txt3)',marginLeft:6,fontFamily:'monospace'}}>{m.det} det.</span>
                  </div>
                );
              })}
            </div>

            <div className="panel">
              <div className="panelH"><span className="panelT">Top Deficiency Categories</span></div>
              {DEF_CATS.map((d,i) => {
                const pct = Math.round(d.cnt/maxDef*100);
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 14px',borderBottom:'1px solid var(--bd)',fontSize:11}}>
                    <div style={{fontSize:16,fontWeight:700,color:'var(--red)',width:40,flexShrink:0,fontFamily:'monospace'}}>{d.cnt}</div>
                    <div style={{width:200,flexShrink:0,color:'var(--txt2)',fontSize:10}}>{d.n}</div>
                    <div style={{flex:1,height:8,background:'var(--bg3)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',background:d.c,borderRadius:4,width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspection Detail */}
        {insp && (
          <div style={{background:'#fff',border:'1px solid var(--bd)',borderRadius:6,overflow:'hidden'}}>
            <div style={{background:'var(--nav-bg)',padding:'12px 16px'}}>
              <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>{insp.v} — PSC Inspection</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.5)',marginTop:2}}>IMO {insp.imo} · {insp.port} · {insp.date} · {insp.mou}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 180px'}}>
              <div>
                {[
                  ['PSCO Authority', insp.mou],
                  ['Port of Inspection', insp.port],
                  ['Date', insp.date],
                  ['Result', <span className={`tag ${insp.res==='DETENTION'?'tR':'tG'}`}>{insp.res}</span>],
                  ['Total Deficiencies', insp.defs],
                  ['Detention Released', insp.res==='DETENTION'?'2024-02-05 (after rectification)':'N/A'],
                  ['Follow-up Required', insp.defs>5?'Yes — re-inspection before departure':'No'],
                  ['Action Taken', insp.res==='DETENTION'?'Vessel detained — flag state notified':'No action — deficiencies to be rectified'],
                ].map(([lbl,val],i) => (
                  <div key={i} style={{padding:'7px 14px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'flex-start',gap:8,fontSize:11}}>
                    <span style={{color:'var(--txt3)',fontWeight:600,width:160,flexShrink:0}}>{lbl}</span>
                    <span style={{color:'var(--txt)',flex:1}}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{borderLeft:'1px solid var(--bd)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:14}}>
                <div style={{fontSize:36,fontWeight:700,color:riskColor}}>{riskScore}</div>
                <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>PSC Risk Score</div>
                <div style={{fontSize:9,color:'var(--txt3)',marginTop:4}}>Paris MOU Targeting</div>
              </div>
            </div>
            <div style={{padding:'10px 14px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.8,borderTop:'1px solid var(--bd)',borderBottom:'1px solid var(--bd)'}}>
              Deficiencies Recorded
            </div>
            {insp.codes.length === 0
              ? <div style={{padding:20,textAlign:'center',fontSize:11,color:'var(--txt3)'}}>No deficiencies recorded — satisfactory inspection</div>
              : insp.codes.map((code,i) => (
                <div key={i} style={{padding:'6px 14px',borderBottom:'1px solid var(--bd)',fontSize:11}}>
                  <div style={{fontWeight:700,fontFamily:'monospace',color:'var(--red)',fontSize:10,marginBottom:2}}>Code: {code} &nbsp;·&nbsp; Category: {insp.cats[i]}</div>
                  <div style={{color:'var(--txt2)'}}>{insp.descs[i]}</div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
