import { useState } from 'react';

const FIXTURES = [
  {id:'F001',vessel:'MT NORDIC STAR',imo:'9234567',type:'VLCC',dwt:298000,charterer:'Vitol SA',owner:'Nordic Tankers AS',cargo:'Arabian Heavy Crude',qty:'2,000,000 BBL',load:'Kharg Island',disch:'Mailiao',laycan:'05-08 May 2025',rate:'WS 82',tce:19200,status:'Fixed',broker:'Barry Rogliano Salles',date:'2025-05-03'},
  {id:'F002',vessel:'MT AEGEAN GLORY',imo:'9456789',type:'Suezmax',dwt:158000,charterer:'Shell Trading',owner:'Aegean Marine SA',cargo:'Urals Crude',qty:'135,000 MT',load:'Novorossiysk',disch:'Augusta',laycan:'07-09 May 2025',rate:'WS 110',tce:14800,status:'Fixed',broker:'Poten & Partners',date:'2025-05-04'},
  {id:'F003',vessel:'MV OCEAN PIONEER',imo:'9345678',type:'Capesize',dwt:180000,charterer:'Rio Tinto',owner:'Pacific Carriers',cargo:'Iron Ore',qty:'175,000 MT',load:'Port Hedland',disch:'Qingdao',laycan:'12-15 May 2025',rate:'$14.50/MT',tce:31500,status:'Fixed',broker:'Clarksons',date:'2025-05-04'},
  {id:'F004',vessel:'MV ATLANTIC HAWK',imo:'9223366',type:'Panamax',dwt:76000,charterer:'Bunge',owner:'Scorpio Bulkers',cargo:'Wheat',qty:'70,000 MT',load:'Santos',disch:'Alexandria',laycan:'10-12 May 2025',rate:'$22.00/MT',tce:12500,status:'On Subjects',broker:'Simpson Spence Young',date:'2025-05-05'},
  {id:'F005',vessel:'MV CASPIAN STAR',imo:'9789012',type:'Supramax',dwt:57000,charterer:'ADM',owner:'Ultramar SA',cargo:'Corn',qty:'55,000 MT',load:'Paranaguá',disch:'Casablanca',laycan:'08-10 May 2025',rate:'$31.50/MT',tce:8400,status:'Fixed',broker:'Fearnleys',date:'2025-05-03'},
  {id:'F006',vessel:'LNG ARCTIC SPIRIT',imo:'9678901',type:'LNG',dwt:95000,charterer:'Tokyo Gas',owner:'TotalEnergies',cargo:'LNG',qty:'135,000 CBM',load:'Ras Laffan',disch:'Negishi',laycan:'05-07 May 2025',rate:'$85,000/day TC',tce:71000,status:'Fixed',broker:'Poten & Partners',date:'2025-05-01'},
  {id:'F007',vessel:'MT CASPIAN QUEEN',imo:'9876543',type:'Aframax',dwt:115000,charterer:'BP',owner:'Dynagas',cargo:'Naphtha',qty:'80,000 MT',load:'Rotterdam',disch:'Houston',laycan:'14-16 May 2025',rate:'WS 125',tce:22100,status:'Rumoured',broker:'E.A. Gibson',date:'2025-05-05'},
  {id:'F008',vessel:'MV PACIFIC BRIDGE',imo:'9567890',type:'Container',dwt:65000,charterer:'MSC',owner:'Pacific International',cargo:'General Cargo',qty:'4,200 TEU',load:'Yokohama',disch:'Long Beach',laycan:'01-03 May 2025',rate:'$3,200/TEU',tce:58000,status:'Fixed',broker:'—',date:'2025-04-28'},
  {id:'F009',vessel:'MV SOUTHERN CROSS',imo:'9334455',type:'Panamax',dwt:82000,charterer:'Cargill',owner:'Borealis Maritime',cargo:'Soybeans',qty:'78,000 MT',load:'Tubarão',disch:'Tianjin',laycan:'15-18 May 2025',rate:'$25.50/MT',tce:13200,status:'On Subjects',broker:'Arrow Shipbroking',date:'2025-05-04'},
  {id:'F010',vessel:'MT VOLGA PRIDE',imo:'9332211',type:'Aframax',dwt:115000,charterer:'Glencore',owner:'Tsakos Group',cargo:'Crude Oil',qty:'90,000 MT',load:'Ust-Luga',disch:'Rotterdam',laycan:'09-11 May 2025',rate:'WS 103',tce:18900,status:'Fixed',broker:'Braemar Shipping',date:'2025-05-04'},
];

const INDICES = [
  {name:'BDI',full:'Baltic Dry Index',val:1284,prev:1237,w52lo:892,w52hi:1893,col:'var(--blue)',desc:'Overall dry bulk freight index',bars:[45,52,38,61,55,48,67,58,71,63,68,72,75,70,68]},
  {name:'BCI',full:'Capesize Index',val:1842,prev:1756,w52lo:580,w52hi:3120,col:'var(--purple)',desc:'Capesize vessel freight rates',bars:[55,48,62,70,58,65,72,68,80,74,78,82,85,79,77]},
  {name:'BPI',full:'Baltic Panamax Index',val:1156,prev:1142,w52lo:780,w52hi:1650,col:'var(--teal)',desc:'Panamax vessel freight rates',bars:[50,55,48,60,52,58,65,62,70,66,68,72,74,70,68]},
  {name:'BDTI',full:'Dirty Tanker Index',val:781,prev:798,w52lo:542,w52hi:1124,col:'var(--orange)',desc:'Dirty petroleum products tankers',bars:[60,58,65,70,55,62,68,60,72,65,70,68,65,63,60]},
  {name:'BCTI',full:'Clean Tanker Index',val:643,prev:631,w52lo:410,w52hi:980,col:'var(--green)',desc:'Clean petroleum products tankers',bars:[45,50,55,60,52,58,65,62,68,64,66,70,72,68,66]},
  {name:'BLNG',full:'Baltic LNG Index',val:54200,prev:52100,w52lo:38000,w52hi:78000,col:'var(--teal)',desc:'LNG carrier freight rates ($/day)',bars:[40,45,55,60,52,48,58,65,70,62,68,72,75,70,68]},
];

const ROUTES = [
  {route:'TD3C — AG/China (VLCC)',ws:82,tceDollar:19200,prev:80,lo:60,hi:120,seg:'VLCC'},
  {route:'TD20 — AG/Japan (VLCC)',ws:78,tceDollar:17400,prev:79,lo:58,hi:115,seg:'VLCC'},
  {route:'TD6 — BLS/Med (Suezmax)',ws:110,tceDollar:14800,prev:108,lo:75,hi:145,seg:'Suezmax'},
  {route:'TD7 — NS/Cont (Aframax)',ws:103,tceDollar:18900,prev:100,lo:70,hi:140,seg:'Aframax'},
  {route:'TD17 — BALT/UKC (Aframax)',ws:125,tceDollar:22100,prev:120,lo:80,hi:160,seg:'Aframax'},
  {route:'TC1 — AG/Japan (LR2)',ws:88,tceDollar:11200,prev:90,lo:60,hi:130,seg:'Product'},
  {route:'TC2 — Cont/USAC (MR)',ws:145,tceDollar:14500,prev:138,lo:90,hi:200,seg:'Product'},
  {route:'5TC — Capesize Avg',ws:null,tceDollar:31500,prev:32300,lo:8000,hi:55000,seg:'Capesize'},
  {route:'4TC — Panamax Avg',ws:null,tceDollar:12500,prev:12200,lo:7000,hi:22000,seg:'Panamax'},
  {route:'10TC — Supramax Avg',ws:null,tceDollar:8400,prev:8450,lo:5500,hi:17000,seg:'Supramax'},
];

const TC_CONTRACTS = [
  {vessel:'MT NORDIC STAR',type:'Time Charter',term:'12 months',start:'2025-01-01',end:'2025-12-31',rate:24500,charterer:'Trafigura',redelivery:'Worldwide',options:'2×6M at $23,000/day'},
  {vessel:'MV OCEAN PIONEER',type:'Time Charter',term:'3 years',start:'2024-07-01',end:'2027-06-30',rate:18000,charterer:'Rio Tinto',redelivery:'Pacific',options:'1×1Y at $17,500/day'},
  {vessel:'LNG ARCTIC SPIRIT',type:'Time Charter',term:'15 years',start:'2022-03-01',end:'2037-02-28',rate:85000,charterer:'Tokyo Gas',redelivery:'Japan',options:'—'},
  {vessel:'MV PACIFIC BRIDGE',type:'Bareboat Charter',term:'5 years',start:'2023-06-01',end:'2028-05-31',rate:12000,charterer:'MSC',redelivery:'DWWD',options:'Purchase option at $45M'},
  {vessel:'MV CASPIAN STAR',type:'Time Charter',term:'6 months',start:'2025-02-01',end:'2025-07-31',rate:11200,charterer:'ADM',redelivery:'Atlantic',options:'1×3M at $10,500/day'},
];

const STATUS_CLS = {Fixed:'tG','On Subjects':'tA',Rumoured:'tN',Failed:'tR'};

function StatusTag({s}) {
  return <span className={`tag ${STATUS_CLS[s]||'tN'}`}>{s}</span>;
}

function FixturesSection() {
  return (
    <div className="tWrap">
      <table className="dt">
        <thead><tr>
          <th>Fixture ID</th><th>Vessel / IMO</th><th>Type / DWT</th>
          <th>Charterer</th><th>Cargo / Qty</th><th>Load → Disch</th>
          <th>Laycan</th><th>Rate</th><th>TCE/Day</th><th>Status</th><th>Date</th>
        </tr></thead>
        <tbody>
          {FIXTURES.map(f => (
            <tr key={f.id}>
              <td style={{fontFamily:'monospace',color:'var(--blue)',fontSize:10}}>{f.id}</td>
              <td><div style={{fontWeight:700}}>{f.vessel}</div><div style={{fontFamily:'monospace',color:'var(--txt3)',fontSize:9}}>{f.imo}</div></td>
              <td><div>{f.type}</div><div style={{color:'var(--txt3)',fontSize:9}}>{f.dwt.toLocaleString()} DWT</div></td>
              <td style={{fontWeight:600}}>{f.charterer}</td>
              <td><div>{f.cargo}</div><div style={{color:'var(--txt3)',fontSize:9}}>{f.qty}</div></td>
              <td><div style={{fontSize:10}}>{f.load}</div><div style={{fontSize:10,color:'var(--txt3)'}}>→ {f.disch}</div></td>
              <td style={{fontSize:10,whiteSpace:'nowrap'}}>{f.laycan}</td>
              <td style={{fontFamily:'monospace',fontWeight:700}}>{f.rate}</td>
              <td style={{textAlign:'right',fontWeight:700,color:'var(--green)',fontFamily:'monospace'}}>${f.tce.toLocaleString()}</td>
              <td><StatusTag s={f.status}/></td>
              <td style={{fontSize:10,color:'var(--txt3)'}}>{f.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RatesSection() {
  return (
    <div className="tWrap">
      <table className="dt">
        <thead><tr><th>Route</th><th>Segment</th><th>WS</th><th>TCE $/Day</th><th>Prev</th><th>Chg</th><th>52W Range</th></tr></thead>
        <tbody>
          {ROUTES.map((r,i) => {
            const chg = r.tceDollar - r.prev;
            const pct = (chg/r.prev*100).toFixed(1);
            const chgColor = chg>0?'var(--green)':chg<0?'var(--red)':'var(--txt3)';
            const arrow = chg>0?'▲':chg<0?'▼':'→';
            const rangePos = ((r.tceDollar-r.lo)/(r.hi-r.lo)*100).toFixed(0);
            return (
              <tr key={i}>
                <td style={{fontWeight:600}}>{r.route}</td>
                <td><span className="tag tN">{r.seg}</span></td>
                <td style={{fontFamily:'monospace'}}>{r.ws||'—'}</td>
                <td style={{textAlign:'right',fontWeight:700,fontFamily:'monospace'}}>${r.tceDollar.toLocaleString()}</td>
                <td style={{textAlign:'right',color:'var(--txt3)',fontFamily:'monospace'}}>${r.prev.toLocaleString()}</td>
                <td style={{color:chgColor,fontWeight:700,textAlign:'right'}}>{arrow} {pct>0?'+':''}{pct}%</td>
                <td style={{minWidth:120}}>
                  <div style={{fontSize:9,color:'var(--txt3)',display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <span>${(r.lo/1000).toFixed(0)}k</span><span>${(r.hi/1000).toFixed(0)}k</span>
                  </div>
                  <div style={{height:6,borderRadius:3,background:'linear-gradient(90deg,var(--green),var(--amber),var(--red))',position:'relative'}}>
                    <div style={{position:'absolute',top:-3,left:`${rangePos}%`,width:12,height:12,borderRadius:'50%',background:'#fff',border:'2px solid var(--txt)',transform:'translateX(-50%)'}}/>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IndicesSection() {
  return (
    <div style={{padding:14,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {INDICES.map(idx => {
        const chg = idx.val - idx.prev;
        const pct = (chg/idx.prev*100).toFixed(2);
        const maxBar = Math.max(...idx.bars);
        return (
          <div key={idx.name} style={{background:'#fff',border:'1px solid var(--bd)',borderRadius:6,padding:'14px 16px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:idx.col}}/>
            <div style={{fontSize:11,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4,marginBottom:6}}>
              {idx.name} <span style={{fontSize:9,fontWeight:400,textTransform:'none'}}>{idx.full}</span>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:12}}>
              <div>
                <div style={{fontSize:28,fontWeight:700,color:'var(--txt)',lineHeight:1,fontFamily:'monospace'}}>{idx.val.toLocaleString()}</div>
                <div style={{fontSize:11,fontWeight:600,marginTop:4,color:chg>0?'var(--green)':chg<0?'var(--red)':'var(--txt3)'}}>
                  {chg>0?'▲':'▼'} {Math.abs(chg).toLocaleString()} ({pct>0?'+':''}{pct}%)
                </div>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:1,height:28,flexShrink:0}}>
                {idx.bars.map((b,i) => (
                  <div key={i} style={{width:6,borderRadius:'1px 1px 0 0',height:`${(b/maxBar*100).toFixed(0)}%`,background:idx.col,opacity:.7}}/>
                ))}
              </div>
            </div>
            <div style={{marginTop:6,fontSize:9,color:'var(--txt3)',display:'flex',justifyContent:'space-between'}}>
              <span>52W Lo: {idx.w52lo.toLocaleString()}</span>
              <span>52W Hi: {idx.w52hi.toLocaleString()}</span>
            </div>
            <div style={{fontSize:9,color:'var(--txt3)',marginTop:4}}>{idx.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function EstimatorSection() {
  const [calculated, setCalculated] = useState(false);

  function Field({label, defaultValue, isSelect}) {
    if (isSelect) return (
      <div>
        <div style={{fontSize:9,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>{label}</div>
        <select style={{width:'100%',border:'1px solid var(--bd2)',borderRadius:4,padding:'6px 8px',fontSize:11,fontFamily:'inherit',outline:'none',color:'var(--txt)',background:'#fff'}}>
          <option>Crude Oil Tanker (VLCC)</option>
          <option>Product Tanker (LR2)</option>
          <option>Capesize Bulk Carrier</option>
        </select>
      </div>
    );
    return (
      <div>
        <div style={{fontSize:9,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>{label}</div>
        <input defaultValue={defaultValue} style={{width:'100%',border:'1px solid var(--bd2)',borderRadius:4,padding:'6px 8px',fontSize:11,fontFamily:'inherit',outline:'none',color:'var(--txt)'}}/>
      </div>
    );
  }

  const gross = 270000 * 7.31 * 0.82 * 0.95;
  const fuelCost = 68 * 23 * 580;
  const portCosts = 145000;
  const voyDays = 25;
  const netRevenue = gross - fuelCost - portCosts;
  const tce = netRevenue / voyDays;

  return (
    <div style={{padding:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <div className="panel">
        <div className="panelH"><div className="panelT">Voyage Parameters</div></div>
        <div style={{padding:14,display:'flex',flexDirection:'column',gap:10}}>
          <Field label="Vessel Type" isSelect/>
          <Field label="DWT" defaultValue="298,000"/>
          <Field label="Load Port" defaultValue="Kharg Island, Iran"/>
          <Field label="Discharge Port" defaultValue="Mailiao, Taiwan"/>
          <Field label="Cargo Quantity (MT)" defaultValue="270,000"/>
          <Field label="Cargo Rate (WS)" defaultValue="82"/>
          <Field label="Worldscale Flat Rate ($/MT)" defaultValue="7.31"/>
          <Field label="Fuel Price — VLSFO ($/MT)" defaultValue="580"/>
          <Field label="Fuel Price — MGO ($/MT)" defaultValue="720"/>
          <Field label="Port Costs (Load + Disch, $)" defaultValue="145,000"/>
          <Field label="Speed at Sea (kts)" defaultValue="13.5"/>
          <Field label="Fuel Cons. at Sea (MT/day)" defaultValue="68.0"/>
          <div style={{paddingTop:6,borderTop:'1px solid var(--bd)',display:'flex',justifyContent:'flex-end',gap:8}}>
            <button className="btn btnS" onClick={()=>setCalculated(false)}>Reset</button>
            <button className="btn btnP" onClick={()=>setCalculated(true)}>🧮 Calculate</button>
          </div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {!calculated ? (
          <div className="panel" style={{background:'var(--bg2)'}}>
            <div className="panelH"><div className="panelT">Voyage P&L Estimate</div></div>
            <div style={{padding:'12px 14px',fontSize:11,color:'var(--txt3)'}}>Click Calculate to generate voyage estimate</div>
          </div>
        ) : (
          <div className="panel">
            <div className="panelH" style={{background:'var(--nav-bg)'}}><div className="panelT" style={{color:'#fff'}}>Voyage P&L Estimate</div></div>
            {[
              ['Gross Freight Revenue', `$${Math.round(gross).toLocaleString()}`, null],
              ['Voyage Fuel Cost (23 days)', `−$${Math.round(fuelCost).toLocaleString()}`, 'var(--red)'],
              ['Port Costs', `−$${portCosts.toLocaleString()}`, 'var(--red)'],
            ].map(([lbl,val,col],i) => (
              <div key={i} style={{padding:'8px 14px',borderBottom:'1px solid var(--bd)',display:'flex',justifyContent:'space-between',fontSize:11}}>
                <span style={{color:'var(--txt3)'}}>{lbl}</span>
                <span style={{fontWeight:700,color:col||'var(--txt)'}}>{val}</span>
              </div>
            ))}
            <div style={{padding:'10px 14px',borderBottom:'2px solid var(--bd)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:700}}>Net Voyage Revenue</span>
              <span style={{fontSize:18,fontWeight:700,color:'var(--green)',fontFamily:'monospace'}}>${Math.round(netRevenue).toLocaleString()}</span>
            </div>
            <div style={{padding:'10px 14px',background:'#e6f4ea',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--green)'}}>TCE (Time Charter Equivalent)</div>
                <div style={{fontSize:10,color:'var(--txt3)'}}>Based on {voyDays} voyage days</div>
              </div>
              <span style={{fontSize:24,fontWeight:700,color:'var(--green)',fontFamily:'monospace'}}>${Math.round(tce).toLocaleString()}/day</span>
            </div>
          </div>
        )}
        <div className="panel">
          <div className="panelH"><div className="panelT">Route: Kharg Island → Mailiao</div></div>
          <div style={{padding:'10px 14px',fontSize:11,display:'flex',flexDirection:'column',gap:5}}>
            {[['Distance (ballast)','4,200 nm'],['Distance (laden)','4,800 nm'],['Sea Days','23 days @ 13.5 kts'],['Port Days','2 days'],['Total Voyage Days','25 days']].map(([l,v],i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',fontWeight:i===4?700:400}}>
                <span style={{color:i===4?'var(--txt)':'var(--txt3)'}}>{l}</span><span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TCSection() {
  return (
    <div className="tWrap">
      <table className="dt">
        <thead><tr>
          <th>Vessel</th><th>Charter Type</th><th>Period</th><th>Start</th><th>End</th>
          <th>Daily Rate $</th><th>Charterer</th><th>Redelivery</th><th>Options</th>
        </tr></thead>
        <tbody>
          {TC_CONTRACTS.map((c,i) => (
            <tr key={i}>
              <td style={{fontWeight:700}}>{c.vessel}</td>
              <td><span className="tag tB">{c.type}</span></td>
              <td style={{fontWeight:600}}>{c.term}</td>
              <td>{c.start}</td>
              <td>{c.end}</td>
              <td style={{textAlign:'right',fontWeight:700,color:'var(--green)',fontFamily:'monospace'}}>${c.rate.toLocaleString()}</td>
              <td>{c.charterer}</td>
              <td>{c.redelivery}</td>
              <td style={{fontSize:10,color:'var(--txt3)'}}>{c.options}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS = [
  {id:'fixtures',label:'📋 Fixture Reports'},
  {id:'rates',label:'📈 Freight Rates'},
  {id:'indices',label:'🏛 Baltic Indices'},
  {id:'estimate',label:'🧮 Voyage Estimator'},
  {id:'tct',label:'📝 TC Contracts'},
];

export default function Fixtures() {
  const [section, setSection] = useState('fixtures');

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Search bar */}
      <div className="sBar">
        <div className="siWrap">
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search fixtures by vessel, charterer, route, cargo…"/>
        </div>
        <select className="fSel">
          <option value="">All Segments</option>
          <option>VLCC</option><option>Suezmax</option><option>Aframax</option>
          <option>Capesize</option><option>Panamax</option><option>Supramax</option>
          <option>Container</option><option>LNG</option><option>LPG</option>
        </select>
        <select className="fSel">
          <option value="">All Charter Types</option>
          <option>Voyage Charter</option><option>Time Charter</option><option>Bareboat Charter</option>
        </select>
        <select className="fSel">
          <option value="">All Dates</option>
          <option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option>
        </select>
        <button className="btn btnP">🔍 Search</button>
        <button className="btn btnT">+ Add Fixture</button>
      </div>

      {/* KPI Row */}
      <div className="kpiRow" style={{gridTemplateColumns:'repeat(8,1fr)'}}>
        <div className="kpi" style={{'--kc':'var(--blue)'}}><div className="kpiV">1,284</div><div className="kpiL">BDI Today</div><div className="kpiDelta kpiUp">▲ +47 pts (+3.8%)</div></div>
        <div className="kpi" style={{'--kc':'var(--teal)'}}><div className="kpiV">$18,450</div><div className="kpiL">VLCC TCE/day</div><div className="kpiDelta kpiUp">▲ +$1,200</div></div>
        <div className="kpi" style={{'--kc':'var(--green)'}}><div className="kpiV">$14,200</div><div className="kpiL">Suezmax TCE</div><div className="kpiDelta kpiNt">→ Flat</div></div>
        <div className="kpi" style={{'--kc':'var(--orange)'}}><div className="kpiV">$31,500</div><div className="kpiL">Capesize TC</div><div className="kpiDelta kpiDn">▼ −$800</div></div>
        <div className="kpi" style={{'--kc':'var(--purple)'}}><div className="kpiV">$12,800</div><div className="kpiL">Panamax TC</div><div className="kpiDelta kpiUp">▲ +$300</div></div>
        <div className="kpi" style={{'--kc':'var(--amber)'}}><div className="kpiV">$8,400</div><div className="kpiL">Supramax TC</div><div className="kpiDelta kpiNt">→ −$50</div></div>
        <div className="kpi" style={{'--kc':'var(--red)'}}><div className="kpiV">47</div><div className="kpiL">New Fixtures (24h)</div><div className="kpiDelta kpiUp">▲ +8 vs avg</div></div>
        <div className="kpi" style={{'--kc':'var(--txt3)'}}><div className="kpiV">WS 84</div><div className="kpiL">AG-East Worldscale</div><div className="kpiDelta kpiDn">▼ −3 pts</div></div>
      </div>

      {/* Main Panel */}
      <div style={{flex:1,overflow:'hidden',padding:'14px 20px',display:'flex',flexDirection:'column'}}>
        <div className="panel" style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{display:'flex',borderBottom:'2px solid var(--bd)',background:'var(--bg2)',flexShrink:0}}>
            {TABS.map(t => (
              <div key={t.id} onClick={()=>setSection(t.id)}
                style={{padding:'10px 16px',fontSize:11,fontWeight:600,cursor:'pointer',
                  color:section===t.id?'var(--txt)':'var(--txt3)',
                  borderBottom:section===t.id?'2px solid var(--sp-red)':'2px solid transparent',
                  marginBottom:-2,whiteSpace:'nowrap',transition:'color .12s',
                  background:section===t.id?'#fff':'transparent'}}>
                {t.label}
              </div>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {section === 'fixtures' && <FixturesSection/>}
            {section === 'rates' && <RatesSection/>}
            {section === 'indices' && <IndicesSection/>}
            {section === 'estimate' && <EstimatorSection/>}
            {section === 'tct' && <TCSection/>}
          </div>
        </div>
      </div>
    </div>
  );
}
