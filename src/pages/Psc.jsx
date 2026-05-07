import { useState, useMemo } from 'react';

const INSPECTIONS = [
  {id:1,v:'OCEAN PRIDE',imo:'9341122',flag:'🇵🇦 Panama',port:'Rotterdam',mou:'Paris MOU',date:'2024-01-30',defs:14,res:'DETENTION',codes:['01111','01113','07106','02111','04101','07114'],descs:['ISM — ship-specific SMS not implemented','ISM — non-conformities not corrected','Fire damper defective','Stability information not available','Bilge system defective','Emergency lighting — not operational'],cats:['ISM','ISM','Fire safety','Stability','Machinery','Life-saving appliances']},
  {id:2,v:'SUNRISE CARRIER',imo:'9412888',flag:'🇵🇦 Panama',port:'Qingdao',mou:'Tokyo MOU',date:'2024-01-29',defs:8,res:'DETENTION',codes:['07101','04108','06104'],descs:['Fire main pressure insufficient','Bilge pump inoperative','Hygiene — accommodation'],cats:['Fire safety','Bilge','MARPOL']},
  {id:3,v:'PIONEER TRADER',imo:'9499283',flag:'🇱🇷 Liberia',port:'Singapore',mou:'Tokyo MOU',date:'2024-01-28',defs:3,res:'No detention',codes:['01101','04201','07201'],descs:['ISPS — drill records incomplete','Garbage management plan — minor','Fire door — damaged'],cats:['ISPS','MARPOL','Fire safety']},
  {id:4,v:'GULF VOYAGER',imo:'9412340',flag:'🇸🇦 Saudi Arabia',port:'Houston',mou:'USCG',date:'2024-01-27',defs:6,res:'No detention',codes:['02114','07108','04101'],descs:['Crew rest hours — violation','Portable extinguisher — not recharged','Bilge system — minor defect'],cats:['MLC','Fire safety','Machinery']},
  {id:5,v:'NORDIC GRACE',imo:'9388021',flag:'🇲🇭 Marshall Islands',port:'Durban',mou:'Indian Ocean MOU',date:'2024-01-25',defs:9,res:'DETENTION',codes:['01111','04109','07116','02101'],descs:['ISM — safety management deficiencies','Lifeboat — release mechanism stiff','Fire detection — sensor faulty','Manning — officer watch certificate'],cats:['ISM','Life-saving','Fire safety','Manning']},
  {id:6,v:'BOREALIS',imo:'9484948',flag:'🇩🇪 Germany',port:'Piraeus',mou:'Paris MOU',date:'2024-01-24',defs:0,res:'No detention',codes:[],descs:[],cats:[]},
  {id:7,v:'NORTHERN STAR',imo:'9188741',flag:'🇳🇴 Norway',port:'Marseille',mou:'Mediterranean MOU',date:'2024-01-22',defs:2,res:'No detention',codes:['04201','07201'],descs:['SOPEP plan minor amendment required','Foam applicator — nozzle condition'],cats:['MARPOL','Fire safety']},
  {id:8,v:'EURONAV NINA',imo:'9320116',flag:'🇧🇪 Belgium',port:'Singapore',mou:'Tokyo MOU',date:'2024-01-20',defs:1,res:'No detention',codes:['01101'],descs:['ISPS — drill log minor discrepancy'],cats:['ISPS']},
  {id:9,v:'GLOVIS CAPTAIN',imo:'9680042',flag:'🇰🇷 South Korea',port:'Jebel Ali',mou:'Riyadh MOU',date:'2024-01-18',defs:4,res:'No detention',codes:['07101','04202','01112','02201'],descs:['Fire hose — coupling damaged','Waste management log — missing entry','SMS non-conformity record','Work/rest hours — recording'],cats:['Fire safety','MARPOL','ISM','MLC']},
  {id:10,v:'PIONEER MAX',imo:'9612988',flag:'🇲🇭 Marshall Islands',port:'Rotterdam',mou:'Paris MOU',date:'2024-01-15',defs:0,res:'No detention',codes:[],descs:[],cats:[]},
];

const KPIS = [
  {v:'283',l:'Detentions YTD',d:'↑ +12 vs 2023',dn:true,c:'#c8102e'},
  {v:'8,841',l:'Inspections YTD',d:'',dn:false,c:'#1558d6'},
  {v:'3.2%',l:'Detention Rate',d:'Paris MOU avg',dn:false,c:'#b45309'},
  {v:'2.4',l:'Avg Deficiencies',d:'per inspection',dn:false,c:'#6200ea'},
  {v:'68',l:'Active Detentions',d:'currently held',dn:true,c:'#c8102e'},
  {v:'124',l:'0-Deficiency Insp.',d:'↑ improving',dn:false,c:'#137333'},
  {v:'97.8%',l:'MLC Compliance',d:'of inspected vessels',dn:false,c:'#137333'},
];

const MOU_STATS = [
  {n:'Paris MOU',insp:3241,det:98,rate:3.0,c:'#1558d6'},
  {n:'Tokyo MOU',insp:2882,det:87,rate:3.0,c:'#137333'},
  {n:'USCG',insp:1441,det:42,rate:2.9,c:'#c8102e'},
  {n:'Indian Ocean MOU',insp:682,det:28,rate:4.1,c:'#0094b3'},
  {n:'Mediterranean MOU',insp:441,det:18,rate:4.1,c:'#6200ea'},
  {n:'Riyadh MOU',insp:282,det:10,rate:3.5,c:'#b45309'},
];

const DEF_CATS = [
  {n:'Fire safety',cnt:1884,c:'#c8102e'},
  {n:'Life-saving appliances',cnt:1441,c:'#ea580c'},
  {n:'ISM / Safety management',cnt:1282,c:'#b45309'},
  {n:'MARPOL / Pollution prev.',cnt:981,c:'#137333'},
  {n:'Crew / MLC compliance',cnt:841,c:'#1558d6'},
  {n:'Navigation equipment',cnt:622,c:'#6200ea'},
  {n:'ISPS security',cnt:441,c:'#0094b3'},
  {n:'Certificates',cnt:382,c:'#717a85'},
];

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
          {KPIS.map((k,i) => (
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
