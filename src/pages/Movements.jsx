import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';

const VESSELS = [
  {id:'v01',name:'MT NORDIC STAR',imo:'9234567',type:'Crude Oil Tanker',flag:'Marshall Islands',status:'Underway',spd:13.2,hdg:285,lat:25.5,lon:58.2,dest:'SINGAPORE',eta:'2025-05-10',lastPort:'KHARG ISLAND',atd:'2025-04-28',cargo:'2,000,000 BBL Crude',dwt:298000,
   route:[{port:'Kharg Island',locode:'IR KHK',lat:29.2,lon:50.3,atd:'2025-04-28',type:'done'},
          {port:'Fujairah',locode:'AE FUJ',lat:25.1,lon:56.3,ata:'2025-04-30',atd:'2025-05-01',type:'done'},
          {port:'Singapore',locode:'SG SIN',lat:1.26,lon:103.8,eta:'2025-05-10',type:'future'}]},
  {id:'v02',name:'MV OCEAN PIONEER',imo:'9345678',type:'Bulk Carrier',flag:'Liberia',status:'In Port',spd:0,hdg:0,lat:22.5,lon:114.1,dest:'PORT HEDLAND',eta:'2025-05-15',lastPort:'HONG KONG',ata:'2025-05-03',cargo:'Iron Ore',dwt:180000,
   route:[{port:'Port Hedland',locode:'AU PHE',lat:-20.3,lon:118.6,atd:'2025-04-20',type:'done'},
          {port:'Hong Kong',locode:'HK HKG',lat:22.3,lon:114.2,ata:'2025-05-03',type:'current'},
          {port:'Port Hedland',locode:'AU PHE',lat:-20.3,lon:118.6,eta:'2025-05-15',type:'future'}]},
  {id:'v03',name:'MT AEGEAN GLORY',imo:'9456789',type:'Product Tanker',flag:'Greece',status:'Underway',spd:14.8,hdg:330,lat:36.5,lon:24.2,dest:'ROTTERDAM',eta:'2025-05-08',lastPort:'PORTSAID',atd:'2025-05-04',cargo:'Naphtha 45,000 MT',dwt:52000,
   route:[{port:'Yanbu',locode:'SA YNB',lat:24.1,lon:38.1,atd:'2025-04-30',type:'done'},
          {port:'Port Said',locode:'EG PSD',lat:31.3,lon:32.3,ata:'2025-05-04',atd:'2025-05-04',type:'done'},
          {port:'Rotterdam',locode:'NL RTM',lat:51.9,lon:4.5,eta:'2025-05-08',type:'future'}]},
  {id:'v04',name:'MV PACIFIC BRIDGE',imo:'9567890',type:'Container',flag:'Panama',status:'Underway',spd:18.4,hdg:270,lat:28.3,lon:155.2,dest:'LONG BEACH',eta:'2025-05-09',lastPort:'YOKOHAMA',atd:'2025-05-03',cargo:'4,200 TEU',dwt:65000,
   route:[{port:'Shanghai',locode:'CN SHA',lat:31.2,lon:121.5,atd:'2025-04-29',type:'done'},
          {port:'Yokohama',locode:'JP YOK',lat:35.4,lon:139.7,ata:'2025-05-01',atd:'2025-05-03',type:'done'},
          {port:'Long Beach',locode:'US LGB',lat:33.75,lon:-118.2,eta:'2025-05-09',type:'future'}]},
  {id:'v05',name:'LNG ARCTIC SPIRIT',imo:'9678901',type:'LNG Carrier',flag:'Bermuda',status:'At Anchor',spd:0,hdg:180,lat:22.3,lon:113.6,dest:'TOKYO',eta:'2025-05-12',lastPort:'QATAR RAS LAFFAN',atd:'2025-04-25',cargo:'135,000 CBM LNG',dwt:95000,
   route:[{port:'Ras Laffan',locode:'QA RAS',lat:25.9,lon:51.6,atd:'2025-04-25',type:'done'},
          {port:'Guangzhou Anchorage',locode:'CN CAN',lat:22.3,lon:113.6,ata:'2025-05-04',type:'current'},
          {port:'Tokyo LNG Terminal',locode:'JP TKO',lat:35.6,lon:139.8,eta:'2025-05-12',type:'future'}]},
  {id:'v06',name:'MV CASPIAN STAR',imo:'9789012',type:'Bulk Carrier',flag:'Cyprus',status:'Underway',spd:11.5,hdg:200,lat:12.2,lon:44.5,dest:'DJIBOUTI',eta:'2025-05-06',lastPort:'SUEZ',atd:'2025-05-04',cargo:'Grain 60,000 MT',dwt:76000,
   route:[{port:'Nikolaev',locode:'UA NLK',lat:46.9,lon:32.0,atd:'2025-04-26',type:'done'},
          {port:'Suez',locode:'EG SUE',lat:29.9,lon:32.5,ata:'2025-05-04',atd:'2025-05-04',type:'done'},
          {port:'Djibouti',locode:'DJ JIB',lat:11.6,lon:43.1,eta:'2025-05-06',type:'future'}]},
  {id:'v07',name:'MT PERSEVERANCE',imo:'9890123',type:'Crude Oil Tanker',flag:'Greece',status:'In Port',spd:0,hdg:0,lat:51.95,lon:4.13,dest:'NOVOROSSIYSK',eta:'2025-05-20',lastPort:'ROTTERDAM',ata:'2025-05-02',cargo:'Ballast',dwt:105000,
   route:[{port:'Rotterdam',locode:'NL RTM',lat:51.9,lon:4.5,ata:'2025-05-02',type:'current'},
          {port:'Novorossiysk',locode:'RU NOV',lat:44.7,lon:37.8,eta:'2025-05-20',type:'future'}]},
  {id:'v08',name:'MV GLOBAL HARMONY',imo:'9901234',type:'Container',flag:'Singapore',status:'Drifting',spd:0.3,hdg:45,lat:1.5,lon:105.0,dest:'SINGAPORE',eta:'2025-05-06',lastPort:'MANILA',atd:'2025-05-03',cargo:'2,800 TEU',dwt:38000,
   route:[{port:'Manila',locode:'PH MNL',lat:14.6,lon:120.9,atd:'2025-05-03',type:'done'},
          {port:'Singapore',locode:'SG SIN',lat:1.26,lon:103.8,eta:'2025-05-06',type:'future'}]},
];

const PORT_CALLS = [
  {vessel:'MT NORDIC STAR',imo:'9234567',port:'Fujairah Anchorage',locode:'AE FUJ',ata:'2025-04-30 08:15',atd:'2025-05-01 14:30',purpose:'Bunkering',vol:'800 MT IFO380',berth:'Anchorage A4'},
  {vessel:'MV OCEAN PIONEER',imo:'9345678',port:'Hong Kong',locode:'HK HKG',ata:'2025-05-03 06:00',atd:'ETA 2025-05-05',purpose:'Discharging',vol:'180,000 MT Iron Ore',berth:'Kwai Tsing T9'},
  {vessel:'MT AEGEAN GLORY',imo:'9456789',port:'Port Said',locode:'EG PSD',ata:'2025-05-04 10:20',atd:'2025-05-04 22:45',purpose:'Transit / Suez',vol:'—',berth:'Roads'},
  {vessel:'MV PACIFIC BRIDGE',imo:'9567890',port:'Yokohama',locode:'JP YOK',ata:'2025-05-01 18:00',atd:'2025-05-03 07:30',purpose:'Loading/Discharging',vol:'1,200 TEU loaded / 800 discharged',berth:'Honmoku C-2'},
  {vessel:'LNG ARCTIC SPIRIT',imo:'9678901',port:'Guangzhou Anchorage',locode:'CN CAN',ata:'2025-05-04 00:00',atd:'ETA 2025-05-07',purpose:'Waiting berth',vol:'—',berth:'Outer Anchorage'},
  {vessel:'MV CASPIAN STAR',imo:'9789012',port:'Suez',locode:'EG SUE',ata:'2025-05-04 06:30',atd:'2025-05-04 09:15',purpose:'Canal transit',vol:'—',berth:'Waiting anchorage'},
  {vessel:'MT PERSEVERANCE',imo:'9890123',port:'Rotterdam',locode:'NL RTM',ata:'2025-05-02 14:00',atd:'ETA 2025-05-06',purpose:'Loading',vol:'105,000 MT Crude',berth:'Europoort T11'},
];

const STATUS_COLOR = {Underway:'#137333','In Port':'#1558d6','At Anchor':'#b45309',Drifting:'#888'};
const SC = {Underway:'sdG','In Port':'sdB','At Anchor':'sdA',Drifting:'sdR'};

const MAP_PORTS = [
  {n:'Singapore',lat:1.26,lon:103.8},{n:'Rotterdam',lat:51.9,lon:4.5},{n:'Hong Kong',lat:22.3,lon:114.2},
  {n:'Fujairah',lat:25.1,lon:56.3},{n:'Kharg Island',lat:29.2,lon:50.3},{n:'Ras Laffan',lat:25.9,lon:51.6},
  {n:'Long Beach',lat:33.75,lon:-118.2},{n:'Yokohama',lat:35.4,lon:139.7},{n:'Djibouti',lat:11.6,lon:43.1},
  {n:'Port Hedland',lat:-20.3,lon:118.6},{n:'Manila',lat:14.6,lon:120.9},{n:'Novorossiysk',lat:44.7,lon:37.8},
];
const CHOKE = [
  {n:'Suez Canal',lat:30.2,lon:32.5},{n:'Strait of Hormuz',lat:26.6,lon:56.2},
  {n:'Strait of Malacca',lat:2.3,lon:103.5},{n:'Bab-el-Mandeb',lat:12.6,lon:43.3},
];

export default function Movements() {
  const [srch, setSrch] = useState('');
  const [typFil, setTypFil] = useState('');
  const [stFil, setStFil] = useState('');
  const [lTab, setLTab] = useState('vessels');
  const [selId, setSelId] = useState(null);
  const [layers, setLayers] = useState({routes:true,vessels:true,ports:true,choke:false,dark:false});

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layerRefs = useRef({});
  const markersRef = useRef({});

  const filtered = useMemo(() => VESSELS.filter(v => {
    if (typFil && v.type !== typFil) return false;
    if (stFil && v.status !== stFil) return false;
    if (srch) {
      const s = srch.toLowerCase();
      if (!v.name.toLowerCase().includes(s) && !v.imo.includes(s) && !(v.dest||'').toLowerCase().includes(s)) return false;
    }
    return true;
  }), [srch, typFil, stFil]);

  const selVessel = VESSELS.find(v => v.id === selId);

  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, {zoomControl:true}).setView([20,80],3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'CartoDB',maxZoom:19}).addTo(map);
    mapInst.current = map;

    const rLayer = L.layerGroup().addTo(map);
    const vLayer = L.layerGroup().addTo(map);
    const pLayer = L.layerGroup().addTo(map);
    const cLayer = L.layerGroup();
    const dkLayer = L.layerGroup();
    layerRefs.current = {routes:rLayer,vessels:vLayer,ports:pLayer,choke:cLayer,dark:dkLayer};

    VESSELS.forEach(v => {
      const coords = v.route.map(r => [r.lat, r.lon]);
      if (coords.length > 1) {
        L.polyline(coords, {color:'#4d7ef7',weight:1.5,opacity:0.5,dashArray:'4 4'}).addTo(rLayer);
      }
    });

    VESSELS.forEach(v => {
      const col = STATUS_COLOR[v.status] || '#888';
      const m = L.circleMarker([v.lat, v.lon], {radius:7,color:col,fillColor:col,fillOpacity:.85,weight:2});
      m.bindTooltip(`<strong>${v.name}</strong><br>IMO ${v.imo}<br>${v.status} · ${v.spd} kts<br>→ ${v.dest}`, {sticky:true});
      m.on('click', () => setSelId(v.id));
      vLayer.addLayer(m);
      markersRef.current[v.id] = {marker: m, lat: v.lat, lon: v.lon};
    });

    MAP_PORTS.forEach(p => {
      L.circleMarker([p.lat, p.lon], {radius:5,color:'#f59e0b',fillColor:'#f59e0b',fillOpacity:.9,weight:1})
       .bindTooltip(p.n).addTo(pLayer);
    });

    CHOKE.forEach(c => {
      L.circleMarker([c.lat, c.lon], {radius:8,color:'#ea580c',fillColor:'#ea580c',fillOpacity:.3,weight:2,dashArray:'3 3'}).addTo(cLayer);
      L.circleMarker([c.lat, c.lon], {radius:3,color:'#ea580c',fillColor:'#ea580c',fillOpacity:1,weight:1})
       .bindTooltip(`⛔ ${c.n}`, {sticky:true}).addTo(cLayer);
    });

    L.polygon([[12,42],[14,44],[13,46],[11,44]], {color:'#9333ea',fillColor:'#9333ea',fillOpacity:.15,weight:1,dashArray:'4 4'})
     .bindTooltip('AIS Dark Zone — Gulf of Aden').addTo(dkLayer);
    L.polygon([[25,55],[27,57],[26,59],[24,57]], {color:'#9333ea',fillColor:'#9333ea',fillOpacity:.15,weight:1,dashArray:'4 4'})
     .bindTooltip('AIS Dark Zone — Persian Gulf').addTo(dkLayer);

    return () => { map.remove(); mapInst.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const lr = layerRefs.current;
    Object.entries(layers).forEach(([key, on]) => {
      const l = lr[key];
      if (!l) return;
      if (on) map.addLayer(l); else map.removeLayer(l);
    });
  }, [layers]);

  useEffect(() => {
    if (!selId || !mapInst.current) return;
    const v = VESSELS.find(x => x.id === selId);
    if (v) mapInst.current.setView([v.lat, v.lon], 6, {animate:true});
  }, [selId]);

  function toggleLayer(key) {
    setLayers(prev => ({...prev, [key]: !prev[key]}));
  }

  function renderVoyageTimeline() {
    if (!selVessel) return (
      <div style={{color:'var(--txt3)',fontSize:11,padding:'10px 0'}}>No vessel selected</div>
    );
    const items = [];
    selVessel.route.forEach((r, i) => {
      const dotStyle = r.type === 'current'
        ? {width:12,height:12,borderRadius:'50%',background:'#137333',border:'2px solid #fff',boxShadow:'0 0 0 2px #137333',flexShrink:0}
        : r.type === 'future'
        ? {width:12,height:12,borderRadius:'50%',background:'#d5d9de',border:'2px solid #fff',boxShadow:'0 0 0 2px #d5d9de',flexShrink:0}
        : {width:12,height:12,borderRadius:'50%',background:'#1558d6',border:'2px solid #fff',boxShadow:'0 0 0 2px #1558d6',flexShrink:0};
      items.push(
        <div key={`p${i}`} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <div style={dotStyle}/>
          <div style={{fontSize:9,fontWeight:700,color:'var(--txt)',textAlign:'center',maxWidth:60,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={r.port}>{r.port}</div>
          <div style={{fontSize:8,color:'var(--txt3)',textAlign:'center',whiteSpace:'nowrap'}}>{r.ata||r.atd||r.eta||''}</div>
          <div style={{fontSize:8,color:'var(--txt3)',fontFamily:'monospace'}}>{r.locode||''}</div>
        </div>
      );
      if (i < selVessel.route.length - 1) {
        const isDone = r.type === 'done', isCurr = r.type === 'current';
        const lineColor = isDone ? '#1558d6' : isCurr ? 'linear-gradient(90deg,#1558d6,#d5d9de)' : '#d5d9de';
        items.push(
          <div key={`l${i}`} style={{flex:1,height:2,background:lineColor,position:'relative',minWidth:30}}>
            {isCurr && <span style={{position:'absolute',top:'50%',left:'40%',transform:'translateY(-50%)',fontSize:14,whiteSpace:'nowrap'}}>🚢</span>}
          </div>
        );
      }
    });
    return items;
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Search bar */}
      <div className="sBar">
        <div className="siWrap">
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search vessel name, IMO, voyage ID, port…" value={srch} onChange={e=>setSrch(e.target.value)}/>
        </div>
        <select className="fSel" value={typFil} onChange={e=>setTypFil(e.target.value)}>
          <option value="">All Types</option>
          <option>Crude Oil Tanker</option>
          <option>Product Tanker</option>
          <option>Bulk Carrier</option>
          <option>Container</option>
          <option>LNG Carrier</option>
        </select>
        <select className="fSel" value={stFil} onChange={e=>setStFil(e.target.value)}>
          <option value="">All Status</option>
          <option>Underway</option>
          <option>At Anchor</option>
          <option>In Port</option>
          <option>Drifting</option>
        </select>
        <select className="fSel">
          <option value="">All Zones</option>
          <option>Pacific Ocean</option>
          <option>Indian Ocean</option>
          <option>Atlantic Ocean</option>
          <option>Mediterranean</option>
          <option>Persian Gulf</option>
          <option>Red Sea</option>
          <option>North Sea</option>
        </select>
        <button className="btn btnP">🔍 Track</button>
        <button className="btn btnT">🌍 Full AIS Map →</button>
      </div>

      {/* KPI Row */}
      <div className="kpiRow" style={{gridTemplateColumns:'repeat(8,1fr)'}}>
        <div className="kpi" style={{'--kc':'var(--green)'}}><div className="kpiV">1,284</div><div className="kpiL">Underway</div><div className="kpiDelta kpiNt">→ AIS reporting</div></div>
        <div className="kpi" style={{'--kc':'var(--amber)'}}><div className="kpiV">342</div><div className="kpiL">At Anchor</div><div className="kpiDelta kpiNt">→ Waiting berth</div></div>
        <div className="kpi" style={{'--kc':'var(--blue)'}}><div className="kpiV">876</div><div className="kpiL">In Port</div><div className="kpiDelta kpiUp">▲ Loading/disch.</div></div>
        <div className="kpi" style={{'--kc':'var(--red)'}}><div className="kpiV">23</div><div className="kpiL">AIS Dark</div><div className="kpiDelta kpiDn">▲ +5 today</div></div>
        <div className="kpi" style={{'--kc':'var(--teal)'}}><div className="kpiV">4,821</div><div className="kpiL">Port Calls (30d)</div><div className="kpiDelta kpiUp">▲ +3.2%</div></div>
        <div className="kpi" style={{'--kc':'var(--purple)'}}><div className="kpiV">12.4d</div><div className="kpiL">Avg Voyage</div><div className="kpiDelta kpiNt">→ all segments</div></div>
        <div className="kpi" style={{'--kc':'var(--orange)'}}><div className="kpiV">14.2</div><div className="kpiL">Avg Kts (fleet)</div><div className="kpiDelta kpiNt">→ weighted avg</div></div>
        <div className="kpi" style={{'--kc':'var(--txt3)'}}><div className="kpiV">847</div><div className="kpiL">ETA Updates</div><div className="kpiDelta kpiNt">→ Today</div></div>
      </div>

      {/* Page Body */}
      <div style={{flex:1,overflow:'hidden',display:'grid',gridTemplateColumns:'360px 1fr',gap:0}}>
        {/* Left Panel */}
        <div style={{borderRight:'1px solid var(--bd)',background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{display:'flex',borderBottom:'2px solid var(--bd)',flexShrink:0}}>
            {['vessels','portcalls','voyages'].map((t,i) => (
              <div key={t} onClick={()=>setLTab(t)}
                style={{flex:1,padding:'9px 10px',fontSize:11,fontWeight:600,color:lTab===t?'var(--txt)':'var(--txt3)',cursor:'pointer',borderBottom:lTab===t?'2px solid var(--sp-red)':'2px solid transparent',marginBottom:-2,textAlign:'center',transition:'color .12s',background:lTab===t?'transparent':'transparent'}}>
                {t==='vessels'?'🚢 Vessels':t==='portcalls'?'⚓ Port Calls':'📋 Voyages'}
              </div>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {lTab === 'vessels' && (
              filtered.length === 0
                ? <div style={{padding:30,textAlign:'center',color:'var(--txt3)',fontSize:12}}>No vessels found</div>
                : filtered.map(v => (
                  <div key={v.id} onClick={()=>setSelId(v.id)}
                    style={{padding:'9px 14px',borderBottom:'1px solid var(--bd)',cursor:'pointer',display:'flex',alignItems:'center',gap:10,background:selId===v.id?'#e8f0fe':'transparent',borderLeft:selId===v.id?'3px solid #1558d6':'3px solid transparent',transition:'background .1s'}}>
                    <div style={{width:34,height:34,borderRadius:6,background:'var(--nav-bg)',color:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>🚢</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--txt)'}}>{v.name}</div>
                      <div style={{fontSize:10,color:'var(--txt3)',marginTop:1}}>IMO {v.imo} · {v.type}</div>
                      <div style={{fontSize:10,marginTop:3,display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                        <div style={{width:7,height:7,borderRadius:'50%',background:STATUS_COLOR[v.status]||'#888',flexShrink:0}}/>
                        <span style={{fontSize:10,color:'var(--txt2)'}}>{v.status}</span>
                        {v.spd > 0 && <span style={{fontSize:10,color:'var(--txt3)'}}>{v.spd} kts</span>}
                        {v.dest && <span className="tag tB" style={{fontSize:9}}>→ {v.dest}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0}}>
                      <span style={{fontSize:9,color:'var(--txt3)'}}>{v.flag}</span>
                      {v.eta && <span style={{fontSize:9,color:'#1558d6',fontWeight:600}}>ETA {v.eta.split('-').slice(1).join('/')}</span>}
                    </div>
                  </div>
                ))
            )}
            {lTab === 'portcalls' && (
              <div style={{overflowX:'auto'}}>
                <table className="dt" style={{fontSize:10}}>
                  <thead><tr>
                    <th>Vessel</th><th>Port</th><th>ATA</th><th>ATD</th><th>Purpose</th>
                  </tr></thead>
                  <tbody>
                    {PORT_CALLS.map((pc,i) => (
                      <tr key={i}>
                        <td><div style={{fontWeight:600}}>{pc.vessel}</div><div style={{color:'var(--txt3)',fontSize:9}}>{pc.imo}</div></td>
                        <td><div style={{fontWeight:600}}>{pc.port}</div><div style={{color:'var(--txt3)',fontSize:9,fontFamily:'monospace'}}>{pc.locode}</div></td>
                        <td><span style={{background:'#e6f4ea',color:'#137333',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3}}>{pc.ata.split(' ')[0]}</span></td>
                        <td>{pc.atd.startsWith('ETA')
                          ? <span style={{background:'#e8f0fe',color:'#1558d6',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3}}>{pc.atd}</span>
                          : <span style={{background:'var(--bg3)',color:'var(--txt3)',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3}}>{pc.atd.split(' ')[0]}</span>}
                        </td>
                        <td><div>{pc.purpose}</div><div style={{color:'var(--txt3)',fontSize:9}}>{pc.vol !== '—' ? pc.vol : ''}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {lTab === 'voyages' && (
              <div style={{padding:10}}>
                {VESSELS.map(v => (
                  <div key={v.id} onClick={()=>setSelId(v.id)}
                    style={{background:'#fff',border:'1px solid var(--bd)',borderRadius:5,padding:10,marginBottom:8,cursor:'pointer'}}>
                    <div style={{fontSize:11,fontWeight:700,marginBottom:4}}>🚢 {v.name}</div>
                    <div style={{fontSize:10,color:'var(--txt3)'}}>{v.lastPort||'—'} → {v.dest||'—'}</div>
                    <div style={{fontSize:10,marginTop:3,display:'flex',gap:8}}>
                      <span>{v.cargo}</span>
                      {v.eta && <span className="tag tB">ETA {v.eta}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map + Voyage Timeline */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{flex:1,position:'relative',overflow:'hidden'}}>
            <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
            {/* Map Controls */}
            <div style={{position:'absolute',top:10,right:10,zIndex:1000,background:'rgba(26,29,31,.92)',borderRadius:6,padding:'10px 14px'}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'rgba(255,255,255,.5)',marginBottom:7}}>Layers</div>
              {[['routes','AIS Routes'],['vessels','Vessels'],['ports','Ports'],['choke','Chokepoints'],['dark','AIS Dark Zones']].map(([key,label]) => (
                <label key={key} style={{display:'flex',alignItems:'center',gap:7,fontSize:10,color:'rgba(255,255,255,.75)',cursor:'pointer',padding:'2px 0'}}>
                  <input type="checkbox" checked={layers[key]} onChange={()=>toggleLayer(key)} style={{cursor:'pointer'}}/>
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Voyage Timeline */}
          <div style={{background:'#fff',borderTop:'1px solid var(--bd)',padding:'12px 16px',flexShrink:0,overflowX:'auto'}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:8}}>
              {selVessel ? `Voyage — ${selVessel.name} (IMO ${selVessel.imo}) · ${selVessel.cargo}` : 'Current Voyage — Select a vessel to view route'}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:0,minWidth:600}}>
              {renderVoyageTimeline()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
