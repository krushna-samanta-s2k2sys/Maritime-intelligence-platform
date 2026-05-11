import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';

const EVENTS = [
  {id:'e01',cat:'Casualty',sev:'CRITICAL',title:'MT PACIFIC MARINER — Structural Fire',sub:'Engine room fire, cargo at risk | Crew evacuated',lat:22.8,lon:114.3,loc:'South China Sea, 40nm SE Hong Kong',date:'2025-05-05',time:'06:42 UTC',icon:'🔥',imo:'9445566',vessel:'MT PACIFIC MARINER',type:'Product Tanker',flag:'Marshall Islands',dwt:52000,crew:24,injuries:3,missing:0,fatalities:0,desc:'Engine room fire broke out at 06:42 UTC while vessel was en route from Singapore to Kaohsiung. Crew of 24 abandoned ship; 3 crew members treated for smoke inhalation. Singapore MRCC coordinating rescue. Cargo: 42,000 MT unleaded gasoline.',affVessels:['MV RESCUE DAWN (SAR vessel)','COAST GUARD KD LEKIR'],source:'IMO GISIS / Singapore MRCC'},
  {id:'e02',cat:'Casualty',sev:'HIGH',title:'MV ARCTIC TRADER — Grounding',sub:'Aground on uncharted reef | Hull breach confirmed',lat:69.2,lon:18.5,loc:'Norwegian Sea, off Tromsø',date:'2025-05-04',time:'22:17 UTC',icon:'⚓',imo:'9334455',vessel:'MV ARCTIC TRADER',type:'General Cargo',flag:'Norway',dwt:8500,crew:11,injuries:0,missing:0,fatalities:0,desc:'Bulk carrier ran aground on uncharted reef in poor visibility conditions. Hull breach in cargo hold 2. Norwegian Coast Guard on scene. Vessel not in immediate danger of sinking but salvage operation underway.',source:'Norwegian Maritime Authority'},
  {id:'e03',cat:'Casualty',sev:'HIGH',title:'MV EASTERN PROMISE — Collision',sub:'Struck bulk carrier in TSS | Both vessels damaged',lat:51.4,lon:1.8,loc:'Dover Strait, Traffic Separation Scheme',date:'2025-05-03',time:'03:31 UTC',icon:'💥',imo:'9223344',vessel:'MV EASTERN PROMISE',type:'Container Feeder',flag:'Cyprus',dwt:18000,crew:19,injuries:1,missing:0,fatalities:0,desc:'Container feeder collided with an inbound bulk carrier in the Dover Strait TSS in reduced visibility. Vessel sustained damage to bow section. Minor flooding reported. CROSS Gris-Nez coordinating.',source:'CROSS Gris-Nez / MCA UK'},
  {id:'e04',cat:'Piracy',sev:'CRITICAL',title:'Armed Attack — Gulf of Guinea',sub:'MT STENA INTEGRITY boarded | 5 crew kidnapped',lat:3.5,lon:3.2,loc:'Gulf of Guinea, 80nm off Lagos',date:'2025-05-05',time:'01:15 UTC',icon:'🏴‍☠️',imo:'9556677',vessel:'MT STENA INTEGRITY',type:'Chemical Tanker',flag:'Sweden',crew:22,kidnapped:5,desc:'Armed attack on chemical tanker 80nm south of Lagos. Approximately 10 armed individuals boarded the vessel using a speedboat. 5 crew members kidnapped. Vessel now proceeding under own power. Nigerian Navy coordinating response.',source:'IMB PRC / ReCAAP ISC'},
  {id:'e05',cat:'Piracy',sev:'HIGH',title:'Suspicious Approach — Gulf of Aden',sub:'Fast craft following containership | Evasive action taken',lat:12.5,lon:48.7,loc:'Gulf of Aden, near Alula',date:'2025-05-04',time:'16:22 UTC',icon:'🚨',desc:'Containership reported being followed by 2 fast craft for approx. 45 minutes. Vessel increased speed and took evasive action. Aircraft from CTF-151 responded. Craft abandoned pursuit.',source:'ReCAAP ISC / EUNAVFOR Atalanta'},
  {id:'e06',cat:'Piracy',sev:'HIGH',title:'Robbery at Anchor — Chittagong',sub:'MV OCEAN GLORY robbed at anchor | No injuries',lat:22.3,lon:91.8,loc:'Chittagong Anchorage, Bangladesh',date:'2025-05-04',time:'23:40 UTC',icon:'⚠️',desc:'Vessel at anchor was boarded by 4 persons armed with knives who stole ship stores and crew personal effects. No crew injuries. Local police notified.',source:'IMB PRC'},
  {id:'e07',cat:'Piracy',sev:'MEDIUM',title:'Suspicious Craft — Strait of Malacca',sub:'Low-profile vessel shadowing tanker',lat:2.3,lon:103.5,loc:'Strait of Malacca, near Riau Islands',date:'2025-05-03',time:'09:15 UTC',icon:'👁',desc:'Low-profile vessel observed shadowing laden VLCC for 30 minutes. Vessel turned away after VTIS alert. Indonesian Navy patrol dispatched.',source:'ReCAAP ISC'},
  {id:'e08',cat:'Weather',sev:'CRITICAL',title:'Typhoon Mawar — Warning Zone',sub:'Cat 4 typhoon | Track: Philippines → South China Sea',lat:17.5,lon:128.3,loc:'Philippine Sea / Luzon Strait',date:'2025-05-05',time:'00:00 UTC',icon:'🌀',windKts:130,pressHpa:928,surge:'4-6m',track:'WNW at 12kts',desc:'Super Typhoon Mawar (Category 4) with maximum sustained winds of 130 knots and central pressure 928 hPa. Forecast track takes storm through Luzon Strait and into South China Sea over next 48 hours. All vessels advised to remain well clear of the danger zone.',affVessels:['MT ASIA EAGLE (ETA Manila 07 May)','MV PACIFIC BRIDGE (en route to Hong Kong)','MV SOUTHERN CROSS (en route from Kaohsiung)'],source:'JTWC / PAGASA'},
  {id:'e09',cat:'Weather',sev:'HIGH',title:'North Atlantic Storm — Force 10',sub:'165 vessels potentially affected | 8-12m seas',lat:50.5,lon:-35.2,loc:'North Atlantic, 45-55°N',date:'2025-05-04',time:'12:00 UTC',icon:'🌊',desc:'Deep Atlantic low pressure system generating Force 10 winds and seas of 8-12m. All vessels on North Atlantic routes advised to exercise extreme caution. Significant routing changes expected.',source:'UK Met Office / NOAA'},
  {id:'e10',cat:'Weather',sev:'HIGH',title:'Dense Fog Advisory — Dover Strait',sub:'Visibility < 200m | TSS suspended temporarily',lat:51.1,lon:1.5,loc:'Dover Strait / English Channel',date:'2025-05-05',time:'04:00 UTC',icon:'🌫',desc:'Dense fog reducing visibility to below 200m in Dover Strait area. CROSS Gris-Nez has issued navigational warnings. Vessels advised to proceed at safe speed with sound signals and radar watch.',source:'MCA UK / CROSS Gris-Nez'},
  {id:'e11',cat:'Congestion',sev:'HIGH',title:'Port Klang — 11d Average Wait',sub:'68 vessels at anchor | Congestion index: 84%',lat:3.0,lon:101.3,loc:'Port Klang, Malaysia',date:'2025-05-05',time:'—',icon:'⏳',waitDays:11,vessels:68,congest:84,desc:'Port Klang experiencing severe congestion due to combination of labor disruptions and peak season cargo surge. Container terminals operating at 94% capacity. Average waiting time at anchor 11 days.',source:'S&P Global Port Intelligence'},
  {id:'e12',cat:'Congestion',sev:'HIGH',title:'Shanghai Yangshan — Backlog 9d',sub:'124 vessels waiting | Labour dispute ongoing',lat:30.6,lon:122.1,loc:'Yangshan, Shanghai, China',date:'2025-05-04',time:'—',icon:'⏳',waitDays:9,vessels:124,congest:91,desc:'Yangshan Port facing severe berth congestion following labor dispute. 124 container vessels at anchor awaiting berth. Terminal operators expect resolution within 3-5 days.',source:'S&P Global Port Intelligence'},
  {id:'e13',cat:'Congestion',sev:'MEDIUM',title:'Rotterdam ECT Delta — Berth Shortage',sub:'Crane maintenance — 6 berths unavailable',lat:51.9,lon:4.1,loc:'Port of Rotterdam, Netherlands',date:'2025-05-03',time:'—',icon:'⚙️',waitDays:3,vessels:22,congest:67,desc:'Planned maintenance on 4 ship-to-shore cranes at ECT Delta Terminal has reduced capacity by approximately 35%. Port Authority expects full restoration by 8 May.',source:'Port of Rotterdam Authority'},
  {id:'e14',cat:'Geopolitical',sev:'CRITICAL',title:'Houthi Attack — Red Sea Corridor',sub:'Anti-ship missile fired | All shipping advised to avoid',lat:14.5,lon:42.8,loc:'Red Sea, Bab-el-Mandeb region',date:'2025-05-05',time:'08:22 UTC',icon:'🚀',desc:'Houthi forces launched anti-ship ballistic missile targeting merchant shipping in the Bab-el-Mandeb strait. All vessels advised to avoid the area. UKMTO has issued Maritime Security Threat Alert Level 3.',source:'UKMTO / IMB / Operation Prosperity Guardian'},
  {id:'e15',cat:'Geopolitical',sev:'HIGH',title:'Strait of Hormuz — Iranian Naval Exercise',sub:'NOTAM issued | Transit delays expected',lat:26.5,lon:56.4,loc:'Strait of Hormuz',date:'2025-05-04',time:'—',icon:'⚓',desc:'Islamic Revolutionary Guard Corps Navy announced 3-day naval exercise in the Strait of Hormuz. NOTAM and nautical charts advisory issued. Vessel transits may experience delays.',source:'Iranian Maritime Authority / UKMTO'},
  {id:'e16',cat:'Environmental',sev:'HIGH',title:'Fuel Oil Spill — Singapore Strait',sub:'~200 MT IFO380 discharged | Response activated',lat:1.15,lon:103.8,loc:'Singapore Strait, Western anchorage',date:'2025-05-04',time:'14:30 UTC',icon:'🛢',spillVol:'~200 MT IFO 380',cause:'Tank overflow during bunkering',desc:'Fuel oil spill of approximately 200 MT IFO380 occurred during bunkering operations at Western Anchorage. MPA Singapore Oil Spill Response Team and NEA deployed. 3 oil spill response vessels on scene. Vessel detained pending investigation.',source:'MPA Singapore / OSRL'},
  {id:'e17',cat:'Environmental',sev:'MEDIUM',title:'Ballast Water Violation — Rotterdam',sub:'Non-compliant discharge | €450,000 fine proposed',lat:51.9,lon:4.05,loc:'Port of Rotterdam',date:'2025-05-03',time:'—',icon:'💧',desc:'Bulk carrier found to have discharged untreated ballast water in violation of BWM Convention. Port State Control inspection confirmed non-compliant treatment system. Detention issued and proposed fine of €450,000.',source:'Netherlands Human Environment and Transport Inspectorate'},
];

const CAT_COLORS = {Casualty:'#c8102e',Piracy:'#6200ea',Weather:'#1558d6',Congestion:'#ea580c',Geopolitical:'#b45309',Environmental:'#0094b3'};
const CAT_ICON_BG = {Casualty:'#fce8e6',Piracy:'#f3e8ff',Weather:'#e8f0fe',Congestion:'#fff3e0',Geopolitical:'#fef3c7',Environmental:'#e0f7fa'};
const SEV_TAG = {CRITICAL:'tR',HIGH:'tO',MEDIUM:'tA',LOW:'tB'};

const EV_TABS = [
  {id:'all',label:'All Events',badge:47},
  {id:'Casualty',label:'⚠️ Casualties',badge:3},
  {id:'Piracy',label:'🏴‍☠️ Piracy',badge:7},
  {id:'Weather',label:'🌀 Weather',badge:12},
  {id:'Congestion',label:'⏳ Congestion',badge:18},
  {id:'Geopolitical',label:'🌐 Geopolitical',badge:5},
  {id:'Environmental',label:'🌊 Environmental',badge:2},
];

export default function Events() {
  const [srch, setSrch] = useState('');
  const [catFil, setCatFil] = useState('');
  const [sevFil, setSevFil] = useState('');
  const [evTab, setEvTab] = useState('all');
  const [selId, setSelId] = useState(null);
  const [layers, setLayers] = useState({casualty:true,piracy:true,weather:true,congestion:true,geopolitical:true,env:true});

  const [mapTile, setMapTile] = useState('light');

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layerRefs = useRef({});
  const tileRef = useRef({});

  const filtered = useMemo(() => EVENTS.filter(e => {
    if (evTab !== 'all' && e.cat !== evTab) return false;
    if (catFil && e.cat !== catFil) return false;
    if (sevFil && e.sev !== sevFil) return false;
    if (srch) { const s=srch.toLowerCase(); if (!e.title.toLowerCase().includes(s) && !e.sub.toLowerCase().includes(s) && !(e.loc||'').toLowerCase().includes(s)) return false; }
    return true;
  }), [evTab, catFil, sevFil, srch]);

  const selEv = EVENTS.find(e => e.id === selId);

  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, {zoomControl:true}).setView([20,40],3);
    tileRef.current.light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'CartoDB',maxZoom:19});
    tileRef.current.dark  = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'CartoDB',maxZoom:19});
    tileRef.current.light.addTo(map);
    mapInst.current = map;

    const CAT_KEYS = {Casualty:'casualty',Piracy:'piracy',Weather:'weather',Congestion:'congestion',Geopolitical:'geopolitical',Environmental:'env'};
    const refs = {};
    Object.values(CAT_KEYS).forEach(k => { refs[k] = L.layerGroup().addTo(map); });
    layerRefs.current = refs;

    EVENTS.forEach(ev => {
      const key = CAT_KEYS[ev.cat];
      const color = CAT_COLORS[ev.cat]||'#888';
      const sevSize = {CRITICAL:14,HIGH:11,MEDIUM:9,LOW:7}[ev.sev]||9;
      const circle = L.circleMarker([ev.lat,ev.lon], {radius:sevSize,color,fillColor:color,fillOpacity:0.75,weight:2});
      circle.on('click', () => setSelId(ev.id));
      circle.bindTooltip(`<strong>${ev.title}</strong><br>${ev.loc}<br><span style="color:#aaa;font-size:10px">${ev.date}</span>`);
      if (refs[key]) refs[key].addLayer(circle);

      if (ev.sev === 'CRITICAL') {
        const pulse = L.circleMarker([ev.lat,ev.lon], {radius:20,color,fillColor:'transparent',weight:1,opacity:0.4});
        if (refs[key]) refs[key].addLayer(pulse);
      }
    });

    return () => { map.remove(); mapInst.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const tiles = tileRef.current;
    if (mapTile === 'light') { if (map.hasLayer(tiles.dark)) map.removeLayer(tiles.dark); if (!map.hasLayer(tiles.light)) tiles.light.addTo(map); }
    else { if (map.hasLayer(tiles.light)) map.removeLayer(tiles.light); if (!map.hasLayer(tiles.dark)) tiles.dark.addTo(map); }
  }, [mapTile]);

  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const refs = layerRefs.current;
    Object.entries(layers).forEach(([key,on]) => {
      const l = refs[key]; if (!l) return;
      if (on) map.addLayer(l); else map.removeLayer(l);
    });
  }, [layers]);

  useEffect(() => {
    if (!selId || !mapInst.current) return;
    const e = EVENTS.find(x => x.id === selId);
    if (e) mapInst.current.setView([e.lat, e.lon], 6, {animate:true});
  }, [selId]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Search bar */}
      <div className="sBar">
        <div className="siWrap">
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search events by vessel, location, type, IMO…" value={srch} onChange={e=>setSrch(e.target.value)}/>
        </div>
        <select className="fSel" value={catFil} onChange={e=>setCatFil(e.target.value)}>
          <option value="">All Categories</option>
          <option>Casualty</option><option>Piracy</option><option>Weather</option>
          <option>Congestion</option><option>Geopolitical</option><option>Environmental</option>
        </select>
        <select className="fSel" value={sevFil} onChange={e=>setSevFil(e.target.value)}>
          <option value="">All Severity</option>
          <option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
        </select>
        <select className="fSel">
          <option value="">Last 7 Days</option><option>Last 24h</option><option>Last 30 Days</option><option>Last 90 Days</option>
        </select>
        <button className="btn btnP">🔍 Search</button>
        <button className="btn btnT">🔔 Subscribe</button>
      </div>

      {/* KPI Row */}
      <div className="kpiRow" style={{gridTemplateColumns:'repeat(8,1fr)'}}>
        <div className="kpi" style={{'--kc':'var(--red)'}}><div className="kpiV">3</div><div className="kpiL">Active Casualties</div><div className="kpiDelta kpiDn">▲ +1 today</div></div>
        <div className="kpi" style={{'--kc':'var(--purple)'}}><div className="kpiV">7</div><div className="kpiL">Piracy Alerts</div><div className="kpiDelta kpiNt">→ Gulf of Guinea</div></div>
        <div className="kpi" style={{'--kc':'var(--blue)'}}><div className="kpiV">12</div><div className="kpiL">Weather Warnings</div><div className="kpiDelta kpiDn">▲ Typhoon Mawar</div></div>
        <div className="kpi" style={{'--kc':'var(--orange)'}}><div className="kpiV">18</div><div className="kpiL">Port Congestion</div><div className="kpiDelta kpiNt">→ Asia-Pac focus</div></div>
        <div className="kpi" style={{'--kc':'var(--amber)'}}><div className="kpiV">5</div><div className="kpiL">Geopolitical</div><div className="kpiDelta kpiDn">▲ Red Sea route</div></div>
        <div className="kpi" style={{'--kc':'var(--teal)'}}><div className="kpiV">2</div><div className="kpiL">Env. Incidents</div><div className="kpiDelta kpiNt">→ Spills</div></div>
        <div className="kpi" style={{'--kc':'var(--green)'}}><div className="kpiV">341</div><div className="kpiL">Vessels Affected</div><div className="kpiDelta kpiDn">▲ Rerouting</div></div>
        <div className="kpi" style={{'--kc':'var(--txt3)'}}><div className="kpiV">47</div><div className="kpiL">Events (7d)</div><div className="kpiDelta kpiNt">→ Across all types</div></div>
      </div>

      {/* Event Type Tabs */}
      <div style={{display:'flex',gap:0,padding:'0 20px',background:'#fff',borderBottom:'2px solid var(--bd)',flexShrink:0,overflowX:'auto'}}>
        {EV_TABS.map(t => (
          <div key={t.id} onClick={()=>setEvTab(t.id)}
            style={{padding:'9px 14px',fontSize:11,fontWeight:600,color:evTab===t.id?'var(--txt)':'var(--txt3)',cursor:'pointer',borderBottom:evTab===t.id?'2px solid var(--sp-red)':'2px solid transparent',marginBottom:-2,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
            {t.label}
            <span style={{background:t.id==='Congestion'?'var(--amber)':'var(--red)',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:8}}>{t.badge}</span>
          </div>
        ))}
      </div>

      {/* 3-column body */}
      <div style={{flex:1,overflow:'hidden',display:'grid',gridTemplateColumns:'340px 1fr 360px',gap:0}}>
        {/* Left: Event List */}
        <div style={{borderRight:'1px solid var(--bd)',background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',flexShrink:0,background:'var(--bg2)',display:'flex',alignItems:'center',gap:8}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt)',flex:1}}>Events Feed</div>
            <span className="tag tN">{filtered.length} events</span>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {filtered.length === 0
              ? <div style={{padding:30,textAlign:'center',color:'var(--txt3)',fontSize:12}}>No events match filters</div>
              : filtered.map(e => (
                <div key={e.id} onClick={()=>setSelId(e.id)}
                  style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',cursor:'pointer',background:selId===e.id?'#fce8e6':'transparent',borderLeft:selId===e.id?'3px solid var(--red)':'3px solid transparent',transition:'background .1s'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                    <div style={{width:30,height:30,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,background:CAT_ICON_BG[e.cat]||'var(--bg3)'}}>{e.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--txt)',marginBottom:2}}>{e.title}</div>
                      <div style={{fontSize:10,color:'var(--txt3)'}}>{e.sub}</div>
                      <div style={{marginTop:5,display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                        <span className={`tag ${SEV_TAG[e.sev]||'tN'}`}>{e.sev}</span>
                        <span className="tag tN">{e.cat}</span>
                        <span style={{fontSize:9,color:'var(--txt3)',marginLeft:'auto'}}>{e.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Center: Map */}
        <div style={{position:'relative',overflow:'hidden'}}>
          <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
          {/* Legend */}
          <div style={{position:'absolute',top:10,left:10,zIndex:1000}}>
            <div style={{background:'rgba(26,29,31,.9)',borderRadius:6,padding:'8px 12px',color:'#fff'}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:6,color:'rgba(255,255,255,.5)'}}>Event Types</div>
              {Object.entries(CAT_COLORS).map(([cat,color]) => (
                <div key={cat} style={{display:'flex',alignItems:'center',gap:7,fontSize:10,marginBottom:3}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
                  {cat}
                </div>
              ))}
            </div>
          </div>
          {/* Layer Controls */}
          <div style={{position:'absolute',top:10,right:10,zIndex:1000,background:'rgba(26,29,31,.9)',borderRadius:6,padding:'8px 12px',backdropFilter:'blur(4px)'}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'rgba(255,255,255,.5)',marginBottom:6}}>Layers</div>
            {[['casualty','Casualties'],['piracy','Piracy'],['weather','Weather'],['congestion','Congestion'],['geopolitical','Geopolitical'],['env','Environmental']].map(([key,label]) => (
              <label key={key} style={{display:'flex',alignItems:'center',gap:6,fontSize:10,color:'rgba(255,255,255,.7)',cursor:'pointer',padding:'3px 0',whiteSpace:'nowrap'}}>
                <input type="checkbox" checked={layers[key]} onChange={()=>setLayers(prev=>({...prev,[key]:!prev[key]}))} style={{cursor:'pointer'}}/>
                {label}
              </label>
            ))}
            <div style={{borderTop:'1px solid rgba(255,255,255,.12)',marginTop:6,paddingTop:6}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'rgba(255,255,255,.5)',marginBottom:5}}>Map Style</div>
              <div style={{display:'flex',gap:4}}>
                {['light','dark'].map(m => (
                  <button key={m} onClick={() => setMapTile(m)} style={{fontSize:10,padding:'2px 8px',borderRadius:3,cursor:'pointer',border:'1px solid rgba(255,255,255,.2)',background:mapTile===m?'rgba(255,255,255,.25)':'transparent',color:mapTile===m?'#fff':'rgba(255,255,255,.5)',fontWeight:mapTile===m?700:400}}>
                    {m === 'light' ? '☀ Light' : '🌙 Dark'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div style={{borderLeft:'1px solid var(--bd)',background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {!selEv ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--txt3)'}}>
              <div style={{fontSize:40,opacity:.3}}>⚡</div>
              <div style={{fontSize:12}}>Select an event to view details</div>
              <div style={{fontSize:10,textAlign:'center',maxWidth:180}}>Events are sourced from IMO GISIS, ReCAAP, ITF, and S&P Global proprietary feeds</div>
            </div>
          ) : (
            <>
              <div style={{background:'var(--nav-bg)',padding:'12px 16px',flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:3}}>{selEv.icon} {selEv.title}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.45)',display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span>{selEv.cat}</span><span>·</span><span>{selEv.loc}</span><span>·</span><span>{selEv.date} {selEv.time||''}</span>
                </div>
              </div>
              <div style={{padding:'8px 14px',borderBottom:'1px solid var(--bd)',display:'flex',gap:6,alignItems:'center',background:'var(--bg2)',flexShrink:0}}>
                <span className={`tag ${SEV_TAG[selEv.sev]||'tN'}`}>{selEv.sev}</span>
                <span className="tag tN">{selEv.cat}</span>
                <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                  <button className="btn btnS btnSm">📄 Export</button>
                  <button className="btn btnS btnSm">🔔 Subscribe</button>
                  <button className="btn btnP btnSm">🗺 Show on Map</button>
                </div>
              </div>
              <div style={{flex:1,overflowY:'auto'}}>
                {/* Description */}
                <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Description</div>
                  <div style={{fontSize:11,color:'var(--txt2)',lineHeight:1.7}}>{selEv.desc}</div>
                </div>
                {/* Location */}
                <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Location</div>
                  {[['Area',selEv.loc],['Coordinates',`${selEv.lat}°N, ${selEv.lon>0?selEv.lon+'°E':Math.abs(selEv.lon)+'°W'}`]].map(([l,v],i) => (
                    <div key={i} style={{display:'flex',gap:8,padding:'3px 0',fontSize:11}}>
                      <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span>
                      <span style={{fontFamily:i===1?'monospace':'inherit'}}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Category-specific data */}
                {selEv.cat === 'Casualty' && (
                  <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Casualty Details</div>
                    {[selEv.imo&&['IMO',<span style={{fontFamily:'monospace'}}>{selEv.imo}</span>],selEv.vessel&&['Vessel',selEv.vessel],selEv.type&&['Type',selEv.type],selEv.flag&&['Flag',selEv.flag],['Crew',`${selEv.crew||'—'} persons`],['Fatalities',selEv.fatalities||0],['Injuries',selEv.injuries||0],['Missing',selEv.missing||0]].filter(Boolean).map(([l,v],i) => (
                      <div key={i} style={{display:'flex',gap:8,padding:'3px 0',fontSize:11}}>
                        <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span>
                        <span style={{fontWeight:l==='Vessel'?700:400,color:l==='Fatalities'&&v>0?'var(--red)':l==='Fatalities'?'var(--green)':'var(--txt)'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selEv.cat === 'Piracy' && (selEv.imo||selEv.kidnapped!==undefined) && (
                  <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Incident Details</div>
                    {[selEv.imo&&['IMO',<span style={{fontFamily:'monospace'}}>{selEv.imo}</span>],selEv.vessel&&['Vessel',selEv.vessel],selEv.kidnapped!==undefined&&['Crew Kidnapped',selEv.kidnapped]].filter(Boolean).map(([l,v],i) => (
                      <div key={i} style={{display:'flex',gap:8,padding:'3px 0',fontSize:11}}>
                        <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span>
                        <span style={{fontWeight:l==='Crew Kidnapped'?700:400,color:l==='Crew Kidnapped'?'var(--red)':'var(--txt)'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selEv.cat === 'Weather' && (
                  <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Meteorological Data</div>
                    {[selEv.windKts&&['Max Wind Speed',`${selEv.windKts} kts`],selEv.pressHpa&&['Central Pressure',`${selEv.pressHpa} hPa`],selEv.surge&&['Storm Surge',selEv.surge],selEv.track&&['Track',selEv.track]].filter(Boolean).map(([l,v],i) => (
                      <div key={i} style={{display:'flex',gap:8,padding:'3px 0',fontSize:11}}>
                        <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span>
                        <span style={{fontWeight:700}}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selEv.cat === 'Congestion' && (
                  <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Congestion Metrics</div>
                    {[['Vessels Waiting',selEv.vessels],['Avg Wait Time',`${selEv.waitDays} days`]].map(([l,v],i) => (
                      <div key={i} style={{display:'flex',gap:8,padding:'3px 0',fontSize:11}}>
                        <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span>
                        <span style={{fontWeight:700}}>{v}</span>
                      </div>
                    ))}
                    {selEv.congest && (
                      <div style={{display:'flex',gap:8,padding:'3px 0',fontSize:11,alignItems:'center'}}>
                        <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>Congestion Index</span>
                        <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                          <span style={{fontSize:16,fontWeight:700,color:selEv.congest>=80?'var(--red)':selEv.congest>=60?'var(--orange)':'var(--amber)'}}>{selEv.congest}%</span>
                          <div style={{flex:1,height:8,background:'var(--bg3)',borderRadius:4,overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:4,background:selEv.congest>=80?'var(--red)':selEv.congest>=60?'var(--orange)':'var(--amber)',width:`${selEv.congest}%`}}/>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {selEv.cat === 'Environmental' && (
                  <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Environmental Data</div>
                    {[selEv.spillVol&&['Spill Volume',selEv.spillVol],selEv.cause&&['Cause',selEv.cause]].filter(Boolean).map(([l,v],i) => (
                      <div key={i} style={{display:'flex',gap:8,padding:'3px 0',fontSize:11}}>
                        <span style={{color:'var(--txt3)',fontWeight:600,width:140,flexShrink:0}}>{l}</span>
                        <span style={{fontWeight:i===0?700:400,color:i===0?'var(--red)':'var(--txt)'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selEv.affVessels && selEv.affVessels.length > 0 && (
                  <div style={{borderBottom:'1px solid var(--bd)',padding:'10px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Affected Vessels ({selEv.affVessels.length})</div>
                    {selEv.affVessels.map((v,i) => (
                      <div key={i} style={{padding:'6px 0',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:8,fontSize:11,cursor:'pointer'}}>
                        🚢 <span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{padding:'10px 14px'}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Source</div>
                  <div style={{fontSize:11,color:'var(--txt2)'}}>{selEv.source||'S&P Global Maritime Intelligence'}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
