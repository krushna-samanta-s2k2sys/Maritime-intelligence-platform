import { useState, useMemo } from 'react';

const QUEUE_INIT = [
  {id:'q01',name:'MT GOLDEN STAR',type:'vessel',imo:'9234567',status:'ESCALATED',time:'09:42',hit:true},
  {id:'q02',name:'Shandong Shipping Co.',type:'company',imo:'—',status:'REVIEWING',time:'09:31',hit:true},
  {id:'q03',name:'MV CASPIAN WIND',type:'vessel',imo:'9345678',status:'NEW',time:'09:18',hit:false},
  {id:'q04',name:'Pacific Ocean Tankers',type:'company',imo:'—',status:'CLEARED',time:'09:05',hit:false},
  {id:'q05',name:'Ahmed Al-Rashidi',type:'individual',imo:'—',status:'NEW',time:'08:54',hit:true},
  {id:'q06',name:'MV BALTICA',type:'vessel',imo:'9456789',status:'REVIEWING',time:'08:40',hit:false},
  {id:'q07',name:'Sun Maritime Ltd',type:'company',imo:'—',status:'FALSE POSITIVE',time:'08:22',hit:false},
  {id:'q08',name:'MT IRAN DELIGHT',type:'vessel',imo:'9112233',status:'ESCALATED',time:'07:58',hit:true},
  {id:'q09',name:'Eastern Bulk Corp',type:'company',imo:'—',status:'CLEARED',time:'07:30',hit:false},
  {id:'q10',name:'Pyongyang Cargo Lines',type:'company',imo:'—',status:'ESCALATED',time:'07:15',hit:true},
];

const ALERTS_DATA = [
  {id:'a01',title:'MT GOLDEN STAR — OFAC SDN List',sub:'Vessel name match 94% | Flag: Iran | IMO 9234567',sev:'CRITICAL',status:'ESCALATED',list:'OFAC SDN',entity:'Vessel',time:'2h ago',icon:'🚢',imo:'9234567',flag:'Iran',type:'Oil Tanker',built:2008,dwt:105000,owner:'Golden Maritime Corp',matches:[{list:'OFAC SDN',name:'GOLDEN STAR',score:94,ref:'SDN-IR-2023-0441',alias:'GOLDEN SUN, SHINING STAR',address:'Tehran, Iran',reason:'Designated under Iranian Sanctions: EO 13846 — Involved in illicit petroleum shipments for NIOC'},{list:'EU Consolidated',name:'GOLDEN STAR I',score:87,ref:'EU-2023/1847',alias:'GOLDEN STAR I',address:'Bandar Abbas, Iran',reason:'Listed for supporting Iranian petroleum exports in violation of EU restrictive measures'}],ais:[{gap:'72h',loc:'Persian Gulf',date:'2025-04-18'},{gap:'48h',loc:'Strait of Hormuz',date:'2025-03-02'}],sts:[{partner:'UNKNOWN VESSEL',lat:25.3,lon:56.8,date:'2025-04-20',vol:'85,000 MT crude',location:'Persian Gulf — 18nm off UAE coast'}]},
  {id:'a02',title:'Shandong Shipping Co — OFAC SDN Match',sub:'Entity name match 91% | Registered: PRC | Controlled company',sev:'CRITICAL',status:'REVIEWING',list:'OFAC SDN',entity:'Company',time:'3h ago',icon:'🏢',country:'CN',matches:[{list:'OFAC SDN',name:'SHANDONG SHIPPING GROUP',score:91,ref:'SDN-CN-2024-0082',alias:'SHANDONG MARITIME SHIPPING',address:'Qingdao, Shandong Province, China',reason:'Designated for facilitating sanctioned Russian crude oil exports; operating shadow fleet vessels'}],vessels:['MT SHANDONG GLORY (IMO 9876543)','MV EASTERN PROMISE (IMO 9765432)','MT PACIFIC LIGHT (IMO 9654321)']},
  {id:'a03',title:'Ahmed Al-Rashidi — OFAC SDN',sub:'Individual | DOB 12 Mar 1971 | Nationality: UAE',sev:'HIGH',status:'NEW',list:'OFAC SDN',entity:'Individual',time:'5h ago',icon:'👤',country:'AE',matches:[{list:'OFAC SDN',name:'AL-RASHIDI, AHMED BIN KHALID',score:88,ref:'SDN-AE-2023-0219',alias:'AHMED KHALID AL-RASHIDI; A. AL-RASHIDI',address:'Dubai, UAE; P.O. Box 44521',reason:'Designated for acting on behalf of sanctioned entity; facilitating fund transfers for IRGC-QF procurement network'}]},
  {id:'a04',title:'MT IRAN DELIGHT — OFAC SDN (Confirmed)',sub:'Vessel exact match | Flag: Panama (prev. Iran) | IMO 9112233',sev:'CRITICAL',status:'ESCALATED',list:'OFAC SDN',entity:'Vessel',time:'1d ago',icon:'🚢',imo:'9112233',flag:'Panama',type:'Crude Oil Tanker',built:2001,dwt:298000,matches:[{list:'OFAC SDN',name:'IRAN DELIGHT',score:100,ref:'SDN-IR-2022-0118',alias:'DELIGHT; IRAN DELIGHT I',address:'—',reason:'VLCC operated by NITC; designated under EO 13846 for transport of Iranian crude oil to Syria; flag changed from IR to PA in 2022'}],ais:[{gap:'21 days',loc:'Gulf of Oman',date:'2025-02-11'}]},
  {id:'a05',title:'Pyongyang Cargo Lines — UN SC + OFAC',sub:'Entity match | DPRK-linked | 14 vessels associated',sev:'CRITICAL',status:'ESCALATED',list:'OFAC SDN',entity:'Company',time:'1d ago',icon:'🏢',country:'KP',matches:[{list:'OFAC SDN',name:'PYONGYANG CARGO LINES',score:97,ref:'SDN-KP-2023-0007',alias:'PCL; PRGYANG CARGO',address:'Pyongyang, DPRK',reason:'Designated DPRK entity; engaged in coal and weapons exports in violation of UNSCR 2397'},{list:'UN Security Council',name:'PYONGYANG CARGO LINES',score:97,ref:'UNSCR-1718-KP-014',alias:'PCL',address:'DPRK',reason:'UN Security Council DPRK Panel of Experts Annex listing — coal and commodities trade'}]},
  {id:'a06',title:'MT BALTIC STORM — EU Consolidated',sub:'MMSI 271000445 | Flag: Turkey | Prev. owner: Russia',sev:'HIGH',status:'NEW',list:'EU Consolidated',entity:'Vessel',time:'4h ago',icon:'🚢',imo:'9556677',flag:'Turkey',type:'Bulk Carrier',built:2010,dwt:78000,matches:[{list:'EU Consolidated',name:'BALTIC STORM',score:82,ref:'EU-2022/0394',alias:'БАЛТИЙСКИЙ ШТОРМ',address:'Istanbul Turkey — prev. Novorossiysk Russia',reason:'Vessel previously beneficial owned by Russian entity subject to EU Art. 5e restrictions; flag changed Jul 2022'}]},
  {id:'a07',title:'Vladivostok Ocean Services — EU Sectoral',sub:'Russian shipping entity | Oil transport restriction',sev:'HIGH',status:'REVIEWING',list:'EU Consolidated',entity:'Company',time:'6h ago',icon:'🏢',country:'RU',matches:[{list:'EU Consolidated',name:'VLADIVOSTOK OCEAN SERVICES LLC',score:89,ref:'EU-2023/1234-RU',alias:'VOS LLC',address:'Vladivostok, Russia',reason:'Listed under EU Regulation 833/2014 Art. 5aa — Russian shipping company transporting oil above G7 price cap'}]},
  {id:'a08',title:'Viktor Sokolov — EU Asset Freeze',sub:'Individual | Russian national | Beneficial owner of 6 vessels',sev:'HIGH',status:'CLEARED',list:'EU Consolidated',entity:'Individual',time:'1d ago',icon:'👤',country:'RU',matches:[{list:'EU Consolidated',name:'SOKOLOV, VIKTOR NIKOLAEVICH',score:85,ref:'EU-2022/263',alias:'V.N. SOKOLOV',address:'Moscow, Russia; Cyprus company UBO',reason:'EU asset freeze and travel ban; close associate of Kremlin; UBO of Sokolov Shipping Holdings Ltd (Cyprus)'}]},
  {id:'a09',title:'MT SILVER PEARL — UN Security Council',sub:'DPRK coal shipment suspected | AIS dark 18d',sev:'CRITICAL',status:'NEW',list:'UN Security Council',entity:'Vessel',time:'8h ago',icon:'🚢',imo:'9223344',flag:'Palau',type:'Bulk Carrier',built:1998,dwt:28000,matches:[{list:'UN Security Council',name:'SILVER PEARL',score:90,ref:'UNSCR-2397-0031',alias:'SILVER PEARL I; SHINING PEARL',address:'Nampho, DPRK (last known port)',reason:'DPRK-linked vessel; UNSCR 2397 — prohibition on export of coal, iron, and seafood'}],ais:[{gap:'18 days',loc:'East China Sea',date:'2025-04-01'}]},
  {id:'a10',title:'Libya National Petroleum Hdg — UN Freeze',sub:'Company | Libyan entity | Asset freeze',sev:'MEDIUM',status:'REVIEWING',list:'UN Security Council',entity:'Company',time:'2d ago',icon:'🏢',country:'LY',matches:[{list:'UN Security Council',name:'NATIONAL OIL CORPORATION SUBSIDIARY',score:78,ref:'UNSCR-1970-LY-007',alias:'LNPH',address:'Tripoli, Libya',reason:'Listed entity affiliated with LY regime; subject to asset freeze per UNSCR 1970'}]},
  {id:'a11',title:'MT URAL ENERGY — UK OFSI',sub:'Russian-owned VLCC | UK sanctions package 14',sev:'HIGH',status:'NEW',list:'UK OFSI',entity:'Vessel',time:'3h ago',icon:'🚢',imo:'9445566',flag:'Russia',type:'Crude Oil Tanker',built:2006,dwt:310000,matches:[{list:'UK OFSI',name:'URAL ENERGY',score:93,ref:'OFSI-RUS-2022-0344',alias:'URAL ENERGY I',address:'Russian flag; owner: Rosneft Trading SA (Switzerland)',reason:'UK sanctions package 14 — Russian energy sector; VLCC transporting Urals crude blend above G7 price cap of $60/bbl'}]},
  {id:'a12',title:'Sergei Timchenko — UK OFSI Designated',sub:'Individual | Russian oligarch | UBO maritime assets',sev:'HIGH',status:'ESCALATED',list:'UK OFSI',entity:'Individual',time:'5h ago',icon:'👤',country:'RU',matches:[{list:'UK OFSI',name:'TIMCHENKO, SERGEI VLADIMIROVICH',score:91,ref:'OFSI-RUS-IND-0012',alias:'S. TIMCHENKO',address:'Moscow, Russia; St. Petersburg, Russia',reason:'UK OFSI designation — Russian oligarch with close ties to Putin; UBO of maritime assets including 3 tankers in shadow fleet'}],vessels:['MT VOLGA PRIDE (IMO 9332211)','MT CASPIAN QUEEN (IMO 9221100)']},
  {id:'a13',title:'MT POSEIDON QUEEN — AIS Gap 11d',sub:'IMO 9667788 | Flag: Cameroon | Last seen: Red Sea',sev:'HIGH',status:'NEW',list:'Dark Activity',entity:'Vessel',time:'6h ago',icon:'🌑',dark:true,imo:'9667788',flag:'Cameroon',type:'Product Tanker',built:2007,dwt:45000,ais:[{gap:'11 days',loc:'Red Sea / Gulf of Aden',date:'2025-04-29'},{gap:'4 days',loc:'Arabian Sea',date:'2025-03-14'}],risk:'Vessel transiting high-risk area with AIS disabled for 11 days. No legitimate reason identified. Possible illicit cargo transfer suspected.'},
  {id:'a14',title:'STS Transfer — Persian Gulf Hotspot',sub:'Unidentified tanker + MT OLYMPUS | 22 Apr 2025',sev:'CRITICAL',status:'REVIEWING',list:'Dark Activity',entity:'Vessel',time:'1d ago',icon:'⛽',dark:true,type:'STS Event',sts:[{partner:'MT OLYMPUS (IMO 9334455)',lat:26.1,lon:56.4,date:'2025-04-22',vol:'120,000 MT crude',location:'Persian Gulf — 18nm off UAE coast'}],risk:'Ship-to-ship transfer of approximately 120,000 MT crude oil outside designated anchorage. MT OLYMPUS (IMO 9334455) has 2 prior OFAC-adjacent associations.'},
  {id:'a15',title:'MT NORTHERN GHOST — AIS Dark 23d',sub:'IMO 9778899 | Flag: St Kitts | Prev. Russia connection',sev:'CRITICAL',status:'ESCALATED',list:'Dark Activity',entity:'Vessel',time:'2d ago',icon:'🌑',dark:true,imo:'9778899',flag:'St Kitts & Nevis',type:'Crude Oil Tanker',built:2002,dwt:115000,ais:[{gap:'23 days',loc:'Baltic Sea / Kaliningrad',date:'2025-04-10'}],risk:'VLCC with 23-day AIS blackout in Baltic Sea corridor. Last port Primorsk (Russia). Previous flag: Russia (changed 2023). Beneficial owner traced to Cyprus SPV linked to Sovcomflot network.'},
];

const LIST_ICONS = {'OFAC SDN':'🇺🇸','EU Consolidated':'🇪🇺','UN Security Council':'🇺🇳','UK OFSI':'🇬🇧','DFAT Australia':'🇦🇺','EU Sectoral':'🇪🇺'};
const FLAG_EMOJI = {'Iran':'🇮🇷','Panama':'🇵🇦','Russia':'🇷🇺','China':'🇨🇳','Turkey':'🇹🇷','Palau':'🇵🇼','Cameroon':'🇨🇲','St Kitts & Nevis':'🇰🇳','UAE':'🇦🇪'};
const SEV_TAG = {CRITICAL:'tR',HIGH:'tO',MEDIUM:'tA',LOW:'tB'};
const ST_TAG = {ESCALATED:'tP',REVIEWING:'tA',NEW:'tR',CLEARED:'tG','FALSE POSITIVE':'tN'};
const QS_CLS = {ESCALATED:'qsEsc',REVIEWING:'qsRev',NEW:'qsNew',CLEARED:'qsClr','FALSE POSITIVE':'qsFp'};
const SEV_BG = {CRITICAL:'#fce8e6',HIGH:'#fff3e0',MEDIUM:'#fef3c7',LOW:'#e8f0fe'};

function calcRiskScore(a) {
  let s = 20;
  if (a.sev==='CRITICAL') s+=50; else if (a.sev==='HIGH') s+=35; else if (a.sev==='MEDIUM') s+=20; else s+=10;
  if (a.matches) s += Math.min(20, a.matches.length*8);
  if (a.ais && a.ais.length) s += Math.min(15, a.ais.reduce((acc,g)=>acc+(parseInt(g.gap)||0),0)/5);
  if (a.sts && a.sts.length) s += 10;
  return Math.min(100, Math.round(s));
}

export default function Compliance() {
  const [srch, setSrch] = useState('');
  const [listFil, setListFil] = useState('');
  const [entFil, setEntFil] = useState('');
  const [sevFil, setSevFil] = useState('');
  const [stFil, setStFil] = useState('');
  const [tab, setTab] = useState('all');
  const [selId, setSelId] = useState(null);
  const [alerts, setAlerts] = useState(ALERTS_DATA);
  const [queue, setQueue] = useState(QUEUE_INIT);
  const [screenVal, setScreenVal] = useState('');
  const [screenType, setScreenType] = useState('vessel');
  const [showModal, setShowModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progLabel, setProgLabel] = useState('');

  const filtered = useMemo(() => alerts.filter(a => {
    if (tab==='ofac' && a.list!=='OFAC SDN') return false;
    if (tab==='eu' && a.list!=='EU Consolidated') return false;
    if (tab==='un' && a.list!=='UN Security Council') return false;
    if (tab==='ofsi' && a.list!=='UK OFSI') return false;
    if (tab==='dark' && a.list!=='Dark Activity') return false;
    if (listFil && a.list!==listFil) return false;
    if (entFil && a.entity!==entFil) return false;
    if (sevFil && a.sev!==sevFil) return false;
    if (stFil && a.status!==stFil) return false;
    if (srch) { const s=srch.toLowerCase(); if (!a.title.toLowerCase().includes(s)&&!a.sub.toLowerCase().includes(s)) return false; }
    return true;
  }), [alerts, tab, listFil, entFil, sevFil, stFil, srch]);

  const selAlert = alerts.find(a => a.id === selId);

  function takeAction(id, newStatus) {
    setAlerts(prev => prev.map(a => a.id===id ? {...a,status:newStatus} : a));
  }

  function runScreen() {
    if (!screenVal.trim()) return;
    const typeIc = {vessel:'🚢',company:'🏢',individual:'👤'}[screenType];
    const hit = Math.random() > 0.5;
    const newQ = {id:'q'+Date.now(),name:screenVal.trim().toUpperCase(),type:screenType,imo:'—',status:hit?'NEW':'CLEARED',time:'Just now',hit};
    setQueue(prev => [newQ,...prev]);
    setScreenVal('');
  }

  function startBatchScreen() {
    setShowModal(false);
    setShowProgress(true);
    setProgress(0);
    const lists = ['OFAC SDN List','OFAC Consolidated','EU Consolidated List','UN Security Council','UK OFSI'];
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const pct = Math.min(100, Math.round(step/20*100));
      setProgress(pct);
      setProgLabel('Checking '+lists[Math.floor(step/4)%lists.length]+'…');
      if (pct >= 100) {
        clearInterval(iv);
        setProgLabel('✅ Screening complete — 247 entities checked');
        setTimeout(() => setShowProgress(false), 2000);
      }
    }, 150);
  }

  const riskScore = selAlert ? calcRiskScore(selAlert) : 0;
  const riskColor = riskScore >= 80 ? 'var(--red)' : riskScore >= 60 ? 'var(--orange)' : 'var(--amber)';

  const TABS = [
    {id:'all',label:'All Alerts',badge:alerts.filter(a=>a.status==='NEW'||a.status==='ESCALATED').length,cls:'tR'},
    {id:'ofac',label:'OFAC SDN',badge:alerts.filter(a=>a.list==='OFAC SDN').length,cls:'tR'},
    {id:'eu',label:'EU Cons.',badge:alerts.filter(a=>a.list==='EU Consolidated').length,cls:'tB'},
    {id:'un',label:'UN SC',badge:alerts.filter(a=>a.list==='UN Security Council').length,cls:'tB'},
    {id:'ofsi',label:'UK OFSI',badge:alerts.filter(a=>a.list==='UK OFSI').length,cls:'tA'},
    {id:'dark',label:'Dark Activity',badge:alerts.filter(a=>a.list==='Dark Activity').length,cls:'tR'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Search bar */}
      <div className="sBar">
        <div className="siWrap">
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Screen vessel IMO, company name, individual, flag state…" value={srch} onChange={e=>setSrch(e.target.value)}/>
        </div>
        <select className="fSel" value={listFil} onChange={e=>setListFil(e.target.value)}>
          <option value="">All Sanctions Lists</option>
          <option>OFAC SDN</option><option>EU Consolidated</option><option>UN Security Council</option>
          <option>UK OFSI</option><option>DFAT Australia</option><option>EU Sectoral</option>
        </select>
        <select className="fSel" value={entFil} onChange={e=>setEntFil(e.target.value)}>
          <option value="">All Entity Types</option><option>Vessel</option><option>Company</option><option>Individual</option>
        </select>
        <select className="fSel" value={sevFil} onChange={e=>setSevFil(e.target.value)}>
          <option value="">All Severities</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
        </select>
        <select className="fSel" value={stFil} onChange={e=>setStFil(e.target.value)}>
          <option value="">All Statuses</option><option>NEW</option><option>REVIEWING</option><option>ESCALATED</option><option>CLEARED</option><option>FALSE POSITIVE</option>
        </select>
        <button className="btn btnP">🔍 Screen</button>
        <button className="btn btnT" onClick={()=>setShowModal(true)}>+ Batch Screen</button>
      </div>

      {/* KPI Row */}
      <div className="kpiRow" style={{gridTemplateColumns:'repeat(7,1fr)'}}>
        <div className="kpi" style={{'--kc':'var(--red)'}}><div className="kpiV">62</div><div className="kpiL">Active Alerts</div><div className="kpiDelta kpiDn">▲ +8 vs last week</div></div>
        <div className="kpi" style={{'--kc':'var(--orange)'}}><div className="kpiV">14</div><div className="kpiL">OFAC SDN Hits</div><div className="kpiDelta kpiDn">▲ +3 new</div></div>
        <div className="kpi" style={{'--kc':'var(--amber)'}}><div className="kpiV">23</div><div className="kpiL">Dark Activity</div><div className="kpiDelta kpiDn">▲ +5 vessels</div></div>
        <div className="kpi" style={{'--kc':'var(--purple)'}}><div className="kpiV">8</div><div className="kpiL">STS Transfers</div><div className="kpiDelta kpiNt">→ High-risk zones</div></div>
        <div className="kpi" style={{'--kc':'var(--blue)'}}><div className="kpiV">1,847</div><div className="kpiL">Screens Today</div><div className="kpiDelta kpiUp">▲ Auto-screened</div></div>
        <div className="kpi" style={{'--kc':'var(--green)'}}><div className="kpiV">98.2%</div><div className="kpiL">Match Accuracy</div><div className="kpiDelta kpiUp">▲ AI-assisted</div></div>
        <div className="kpi" style={{'--kc':'var(--teal)'}}><div className="kpiV">4.3h</div><div className="kpiL">Avg Resolution</div><div className="kpiDelta kpiUp">▼ −0.8h vs target</div></div>
      </div>

      {/* 3-column body */}
      <div style={{flex:1,overflow:'hidden',display:'grid',gridTemplateColumns:'300px 1fr 380px',borderTop:'1px solid var(--bd)'}}>
        {/* Left: Quick Screen + Queue */}
        <div style={{display:'flex',flexDirection:'column',borderRight:'1px solid var(--bd)',background:'#fff',overflow:'hidden'}}>
          <div style={{padding:'11px 14px',borderBottom:'1px solid var(--bd)',flexShrink:0,background:'var(--bg2)'}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt)',marginBottom:8}}>Quick Screen</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <input value={screenVal} onChange={e=>setScreenVal(e.target.value)} placeholder="IMO number, company name, or person…"
                style={{width:'100%',border:'1px solid var(--bd2)',borderRadius:4,padding:'6px 9px',fontSize:12,fontFamily:'inherit',outline:'none',color:'var(--txt)'}}/>
              <div style={{display:'flex',gap:5}}>
                <select value={screenType} onChange={e=>setScreenType(e.target.value)}
                  style={{flex:1,border:'1px solid var(--bd2)',borderRadius:4,padding:'6px 6px',fontSize:11,fontFamily:'inherit',outline:'none',cursor:'pointer',color:'var(--txt)',background:'#fff'}}>
                  <option value="vessel">Vessel (IMO)</option>
                  <option value="company">Company</option>
                  <option value="individual">Individual</option>
                </select>
                <button onClick={runScreen}
                  style={{background:'var(--sp-red)',color:'#fff',border:'none',borderRadius:4,padding:'6px 14px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                  Screen →
                </button>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                <span style={{fontSize:9,color:'var(--txt3)',fontWeight:600,width:'100%',textTransform:'uppercase',letterSpacing:.3}}>Lists to check:</span>
                {['OFAC','EU','UN','OFSI','DFAT','EU Sect.'].map((l,i) => (
                  <label key={l} style={{fontSize:10,display:'flex',alignItems:'center',gap:3,cursor:'pointer'}}>
                    <input type="checkbox" defaultChecked={i<4}/> {l}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            <div style={{padding:'7px 14px 4px',fontSize:9,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5,background:'var(--bg3)',borderBottom:'1px solid var(--bd)',position:'sticky',top:0,zIndex:1}}>
              Recent Screening Queue (24h)
            </div>
            {queue.map(q => {
              const typeIc = {vessel:'🚢',company:'🏢',individual:'👤'}[q.type];
              const sc = QS_CLS[q.status]||'qsNew';
              const scStyle = {
                qsEsc:{background:'#f3e8ff',color:'#6200ea'},
                qsRev:{background:'#fef3c7',color:'#92400e'},
                qsNew:{background:'#fce8e6',color:'#c5221f'},
                qsClr:{background:'#e6f4ea',color:'#137333'},
                qsFp:{background:'var(--bg3)',color:'var(--txt3)'},
              }[sc];
              return (
                <div key={q.id} style={{padding:'9px 14px',borderBottom:'1px solid var(--bd)',cursor:'pointer',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:12}}>{q.hit?'🔴':'🟢'}</span>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--txt)',flex:1}}>{typeIc} {q.name}</div>
                  </div>
                  <div style={{fontSize:10,color:'var(--txt3)',marginTop:2,display:'flex',gap:6,alignItems:'center'}}>
                    <span>{q.imo!=='—'?'IMO '+q.imo:q.type}</span>
                    <span style={{marginLeft:'auto'}}>{q.time}</span>
                  </div>
                  <div style={{marginTop:3}}>
                    <span style={{...scStyle,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:8,textTransform:'uppercase'}}>{q.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Alert List */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{display:'flex',borderBottom:'2px solid var(--bd)',background:'#fff',flexShrink:0}}>
            {TABS.map(t => (
              <div key={t.id} onClick={()=>setTab(t.id)}
                style={{padding:'10px 14px',fontSize:11,fontWeight:600,cursor:'pointer',color:tab===t.id?'var(--txt)':'var(--txt3)',borderBottom:tab===t.id?'2px solid var(--sp-red)':'2px solid transparent',marginBottom:-2,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
                {t.label}
                <span style={{background:t.id==='eu'||t.id==='un'?'#1558d6':t.id==='ofsi'?'var(--amber)':'var(--red)',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:8}}>{t.badge}</span>
              </div>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto',background:'var(--bg)'}}>
            {filtered.length === 0
              ? <div style={{padding:40,textAlign:'center',color:'var(--txt3)',fontSize:12}}>No alerts match current filters</div>
              : filtered.map(a => {
                const sevBg = SEV_BG[a.sev]||'#e8f0fe';
                return (
                  <div key={a.id} onClick={()=>setSelId(a.id)}
                    style={{background:'#fff',margin:'8px 12px',border:selId===a.id?'1px solid var(--red)':'1px solid var(--bd)',borderLeft:a.dark?`4px solid #333`:selId===a.id?'1px solid var(--red)':'1px solid var(--bd)',borderRadius:6,cursor:'pointer',boxShadow:selId===a.id?'0 0 0 2px rgba(200,16,46,.12)':'none',transition:'box-shadow .12s',overflow:'hidden'}}>
                    <div style={{padding:'9px 12px 7px',display:'flex',alignItems:'flex-start',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,marginTop:1,background:sevBg}}>{a.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--txt)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.title}</div>
                        <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>{a.sub}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                        <span style={{fontSize:9,color:'var(--txt3)'}}>{a.time}</span>
                        <span className={`tag ${ST_TAG[a.status]||'tN'}`}>{a.status}</span>
                      </div>
                    </div>
                    <div style={{padding:'5px 12px 8px',display:'flex',alignItems:'center',gap:6,borderTop:'1px solid var(--bg3)'}}>
                      <span style={{fontSize:9,color:'var(--txt3)',fontWeight:600,textTransform:'uppercase',letterSpacing:.3}}>{a.list}</span>
                      <span style={{color:'var(--bd)'}}>·</span>
                      <span className={`tag ${SEV_TAG[a.sev]||'tN'}`}>{a.sev}</span>
                      <span style={{color:'var(--bd)'}}>·</span>
                      <span className="tag tN">{a.entity}</span>
                      {a.matches && <span style={{marginLeft:'auto',fontSize:10,color:'var(--txt3)'}}>{a.matches.length} list match{a.matches.length>1?'es':''} →</span>}
                      {a.dark && <span style={{marginLeft:'auto',fontSize:10,color:'var(--txt3)'}}>Dark activity →</span>}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div style={{borderLeft:'1px solid var(--bd)',display:'flex',flexDirection:'column',background:'#fff',overflow:'hidden'}}>
          {!selAlert ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--txt3)'}}>
              <div style={{fontSize:40,opacity:.3}}>🛡</div>
              <div style={{fontSize:12}}>Select an alert to review</div>
              <div style={{fontSize:10,color:'var(--txt3)',textAlign:'center',maxWidth:180}}>All screens are logged and auditable per MiFID II & KYC/AML requirements</div>
            </div>
          ) : (
            <>
              <div style={{background:'var(--nav-bg)',padding:'14px 16px',flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:4}}>{selAlert.icon} {selAlert.title}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.5)',display:'flex',gap:10,flexWrap:'wrap'}}>
                  <span>{selAlert.list}</span><span>·</span><span>{selAlert.entity}</span><span>·</span><span>{selAlert.time}</span>
                </div>
              </div>
              <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',display:'flex',gap:6,flexWrap:'wrap',background:'var(--bg2)',flexShrink:0}}>
                <button className="btn btnP btnSm" onClick={()=>takeAction(selAlert.id,'ESCALATED')}>⬆ Escalate</button>
                <button className="btn btnSm" style={{background:'#fff',color:'var(--amber)',borderColor:'var(--amber)'}} onClick={()=>takeAction(selAlert.id,'REVIEWING')}>👁 Review</button>
                <button className="btn btnS btnSm" style={{color:'var(--green)',borderColor:'var(--green)'}} onClick={()=>takeAction(selAlert.id,'CLEARED')}>✓ Clear</button>
                <button className="btn btnS btnSm" onClick={()=>takeAction(selAlert.id,'FALSE POSITIVE')}>✗ False Positive</button>
                <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                  <button className="btn btnS btnSm">📄 Export</button>
                </div>
              </div>
              <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{fontSize:11,color:'var(--txt3)',fontWeight:600}}>Risk Score</div>
                  <div style={{fontSize:24,fontWeight:700,color:riskColor}}>{riskScore}</div>
                  <div style={{fontSize:10,color:'var(--txt3)'}}>/100</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{height:8,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:3,background:riskColor,width:`${riskScore}%`}}/>
                  </div>
                </div>
                <span style={{background:'linear-gradient(135deg,#8b00ff,#3d00c8)',color:'#fff',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:8}}>✦ AI Score</span>
              </div>
              <div style={{flex:1,overflowY:'auto'}}>
                {selAlert.matches && (
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>Sanctions List Matches</div>
                    {selAlert.matches.map((m,i) => (
                      <div key={i} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:5,padding:'8px 10px',marginBottom:6}}>
                        <div style={{fontSize:11,fontWeight:700,color:'var(--txt)',marginBottom:4,display:'flex',alignItems:'center',gap:6}}>
                          <span>{LIST_ICONS[m.list]||'📋'}</span><span>{m.list}</span>
                          <span style={{marginLeft:'auto',fontSize:10,color:'var(--txt3)'}}>Ref: <span style={{fontFamily:'monospace'}}>{m.ref}</span></span>
                        </div>
                        <div style={{display:'flex',padding:'3px 0',fontSize:11}}><span style={{color:'var(--txt3)',fontWeight:600,width:110,flexShrink:0}}>Listed Name</span><span style={{fontWeight:700}}>{m.name}</span></div>
                        <div style={{display:'flex',padding:'3px 0',fontSize:11}}><span style={{color:'var(--txt3)',fontWeight:600,width:110,flexShrink:0}}>Match Score</span><span style={{fontSize:16,fontWeight:700,color:m.score>=90?'var(--red)':m.score>=80?'var(--orange)':'var(--amber)'}}>{m.score}%</span></div>
                        {m.alias && <div style={{display:'flex',padding:'3px 0',fontSize:11}}><span style={{color:'var(--txt3)',fontWeight:600,width:110,flexShrink:0}}>Aliases</span><span style={{color:'var(--txt3)'}}>{m.alias}</span></div>}
                        <div style={{marginTop:6,paddingTop:6,borderTop:'1px solid var(--bd)',fontSize:10,color:'var(--txt2)',lineHeight:1.6}}><strong>Designation:</strong> {m.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
                {selAlert.imo && (
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>Vessel Details</div>
                    {[['IMO Number',<span style={{fontFamily:'monospace'}}>{selAlert.imo}</span>],['Vessel Type',selAlert.type||'—'],['Flag State',`${FLAG_EMOJI[selAlert.flag]||'🏳'} ${selAlert.flag||'—'}`],selAlert.built&&['Year Built',selAlert.built],selAlert.dwt&&['DWT',`${selAlert.dwt.toLocaleString()} MT`],selAlert.owner&&['Registered Owner',selAlert.owner]].filter(Boolean).map(([l,v],i) => (
                      <div key={i} style={{display:'flex',padding:'4px 0',fontSize:11}}>
                        <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selAlert.vessels && (
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>Associated Vessels ({selAlert.vessels.length})</div>
                    {selAlert.vessels.map((v,i) => (
                      <div key={i} style={{display:'flex',padding:'4px 0',fontSize:11}}><span style={{fontWeight:600}}>🚢 {v}</span></div>
                    ))}
                  </div>
                )}
                {selAlert.ais && selAlert.ais.length > 0 && (
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>AIS Dark Activity</div>
                    {selAlert.ais.map((g,i) => (
                      <div key={i} style={{padding:'8px 0',display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:'var(--red)',flexShrink:0}}/>
                        <span style={{fontSize:10,background:'#1a1d1f',color:'#fbbf24',padding:'2px 7px',borderRadius:3,fontFamily:'monospace',whiteSpace:'nowrap'}}>{g.gap} AIS gap</span>
                        <div><div style={{fontSize:11,fontWeight:600}}>{g.loc}</div><div style={{fontSize:10,color:'var(--txt3)'}}>{g.date}</div></div>
                      </div>
                    ))}
                  </div>
                )}
                {selAlert.sts && selAlert.sts.length > 0 && (
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>Ship-to-Ship Transfers</div>
                    {selAlert.sts.map((s,i) => (
                      <div key={i}>
                        {[['Partner Vessel',s.partner],['Date',s.date],['Location',s.location||`${s.lat}, ${s.lon}`],s.vol&&['Volume',s.vol]].filter(Boolean).map(([l,v],j) => (
                          <div key={j} style={{display:'flex',padding:'4px 0',fontSize:11}}>
                            <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span><span style={{fontWeight:j===0?700:400}}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {selAlert.risk && (
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>Risk Assessment</div>
                    <div style={{background:'#fff3e0',border:'1px solid #fbbf24',borderRadius:5,padding:'9px 11px',fontSize:11,color:'var(--txt2)',lineHeight:1.6}}>{selAlert.risk}</div>
                  </div>
                )}
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)'}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>Audit Trail</div>
                  {[['Alert Generated',`${selAlert.time} — Auto-screen (batch)`],['Screened By','AI Compliance Engine v4.2'],['Status',<span className={`tag ${ST_TAG[selAlert.status]||'tN'}`}>{selAlert.status}</span>],['Last Updated','5 min ago — K. Samanta'],['Case ID',<span style={{fontFamily:'monospace'}}>COMP-2025-{selAlert.id.toUpperCase()}</span>]].map(([l,v],i) => (
                    <div key={i} style={{display:'flex',padding:'4px 0',fontSize:11}}>
                      <span style={{color:'var(--txt3)',fontWeight:600,width:150,flexShrink:0}}>{l}</span><span>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:'10px 14px'}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>Notes</div>
                  <textarea placeholder="Add compliance notes…" style={{width:'100%',border:'1px solid var(--bd2)',borderRadius:4,padding:'7px 9px',fontSize:11,fontFamily:'inherit',minHeight:60,resize:'vertical',outline:'none',color:'var(--txt)'}}/>
                  <button className="btn btnS btnSm" style={{marginTop:6}}>Save Note</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Batch Screen Modal */}
      {showModal && (
        <div onClick={e=>e.target===e.currentTarget&&setShowModal(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:8,width:520,maxHeight:'85vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <div style={{background:'var(--nav-bg)',padding:'14px 18px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff',flex:1}}>🚨 Batch Screening Configuration</div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',fontSize:18,cursor:'pointer',lineHeight:1,padding:0}}>✕</button>
            </div>
            <div style={{padding:'16px 18px',overflowY:'auto',display:'flex',flexDirection:'column',gap:12}}>
              <div style={{background:'#fce8e6',border:'1px solid #f5c6c6',borderRadius:5,padding:'10px 12px',fontSize:11,color:'#c5221f'}}>
                <strong>Important:</strong> Batch screening checks all selected entities against live sanctions databases. Results are logged with timestamps for audit trail.
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4}}>Entity Source</div>
                <select style={{border:'1px solid var(--bd2)',borderRadius:4,padding:'7px 8px',fontSize:12,fontFamily:'inherit',outline:'none',cursor:'pointer',width:'100%',color:'var(--txt)',background:'#fff'}}>
                  <option>My Fleet (all vessels)</option><option>Portfolio — Tankers</option><option>Portfolio — Bulk Carriers</option>
                  <option>Company Counterparty List</option><option>Upload CSV / Excel</option>
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4}}>Entity Count</div>
                  <input readOnly defaultValue="247 entities" style={{border:'1px solid var(--bd2)',borderRadius:4,padding:'7px 10px',fontSize:12,fontFamily:'inherit',outline:'none',color:'var(--txt)',width:'100%',background:'var(--bg2)'}}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4}}>Match Threshold</div>
                  <select style={{border:'1px solid var(--bd2)',borderRadius:4,padding:'7px 8px',fontSize:12,fontFamily:'inherit',outline:'none',cursor:'pointer',width:'100%',color:'var(--txt)',background:'#fff'}}>
                    <option>85% (Recommended)</option><option>90% (Strict)</option><option>80% (Broad)</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4}}>Sanctions Lists</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'6px 0'}}>
                  {['OFAC SDN List','OFAC Consolidated','EU Consolidated List','UN Security Council','UK OFSI','DFAT Australia','EU Sectoral Sanctions','SECO Switzerland'].map((l,i) => (
                    <label key={l} style={{fontSize:11,display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}><input type="checkbox" defaultChecked={i<5}/> {l}</label>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4}}>Include AIS Dark Activity Check</div>
                <select style={{border:'1px solid var(--bd2)',borderRadius:4,padding:'7px 8px',fontSize:12,fontFamily:'inherit',outline:'none',cursor:'pointer',width:'100%',color:'var(--txt)',background:'#fff'}}>
                  <option>Yes — flag AIS gaps &gt; 24h in last 90 days</option>
                  <option>Yes — flag AIS gaps &gt; 6h in last 30 days</option>
                  <option>No — sanctions lists only</option>
                </select>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4}}>Notification</div>
                <input defaultValue="krushna.samanta@gmail.com" placeholder="Email for results" style={{border:'1px solid var(--bd2)',borderRadius:4,padding:'7px 10px',fontSize:12,fontFamily:'inherit',outline:'none',color:'var(--txt)',width:'100%'}}/>
              </div>
            </div>
            <div style={{padding:'12px 18px',borderTop:'1px solid var(--bd)',display:'flex',justifyContent:'flex-end',gap:8,flexShrink:0,background:'var(--bg2)'}}>
              <button className="btn btnS" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btnP" onClick={startBatchScreen}>▶ Run Batch Screen</button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgress && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:8,width:420,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <div style={{background:'var(--nav-bg)',padding:'14px 18px',flexShrink:0}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>🔄 Screening in Progress…</div>
            </div>
            <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:14}}>
              <div style={{fontSize:12,color:'var(--txt2)'}}>{progLabel}</div>
              <div style={{height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:3,background:'var(--sp-red)',width:`${progress}%`,transition:'width .4s'}}/>
              </div>
              <div style={{fontSize:11,color:'var(--txt3)'}}>{Math.round(progress/100*247)} / 247 entities screened</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
