import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { MOVEMENT_VESSELS, PORT_CALLS } from '../data/movementsData';
import { AIS_STATUS_COLORS, AIS_CHOKE, GIS_PORTS } from '../data/mapData';

export default function Movements() {
  const [srch, setSrch] = useState('');
  const [typFil, setTypFil] = useState('');
  const [stFil, setStFil] = useState('');
  const [lTab, setLTab] = useState('vessels');
  const [selId, setSelId] = useState(null);
  const [layers, setLayers] = useState({routes:true,vessels:true,ports:true,choke:false,dark:false});

  const [mapTile, setMapTile] = useState('light');

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layerRefs = useRef({});
  const markersRef = useRef({});
  const tileRef = useRef({});

  const filtered = useMemo(() => MOVEMENT_VESSELS.filter(v => {
    if (typFil && v.type !== typFil) return false;
    if (stFil && v.status !== stFil) return false;
    if (srch) {
      const s = srch.toLowerCase();
      if (!v.name.toLowerCase().includes(s) && !v.imo.includes(s) && !(v.dest||'').toLowerCase().includes(s)) return false;
    }
    return true;
  }), [srch, typFil, stFil]);

  const selVessel = MOVEMENT_VESSELS.find(v => v.id === selId);

  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, {zoomControl:true}).setView([20,80],3);
    tileRef.current.light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'CartoDB',maxZoom:19});
    tileRef.current.dark  = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'CartoDB',maxZoom:19});
    tileRef.current.light.addTo(map);
    mapInst.current = map;

    const rLayer = L.layerGroup().addTo(map);
    const vLayer = L.layerGroup().addTo(map);
    const pLayer = L.layerGroup().addTo(map);
    const cLayer = L.layerGroup();
    const dkLayer = L.layerGroup();
    layerRefs.current = {routes:rLayer,vessels:vLayer,ports:pLayer,choke:cLayer,dark:dkLayer};

    MOVEMENT_VESSELS.forEach(v => {
      const coords = v.route.map(r => [r.lat, r.lon]);
      if (coords.length > 1) {
        L.polyline(coords, {color:'#4d7ef7',weight:1.5,opacity:0.5,dashArray:'4 4'}).addTo(rLayer);
      }
    });

    MOVEMENT_VESSELS.forEach(v => {
      const col = AIS_STATUS_COLORS[v.status] || '#888';
      const m = L.circleMarker([v.lat, v.lon], {radius:7,color:col,fillColor:col,fillOpacity:.85,weight:2});
      m.bindTooltip(`<strong>${v.name}</strong><br>IMO ${v.imo}<br>${v.status} · ${v.spd} kts<br>→ ${v.dest}`, {sticky:true});
      m.on('click', () => setSelId(v.id));
      vLayer.addLayer(m);
      markersRef.current[v.id] = {marker: m, lat: v.lat, lon: v.lon};
    });

    GIS_PORTS.forEach(p => {
      L.circleMarker([p.lat, p.lon], {radius:5,color:'#f59e0b',fillColor:'#f59e0b',fillOpacity:.9,weight:1})
       .bindTooltip(p.n).addTo(pLayer);
    });

    AIS_CHOKE.forEach(c => {
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
    const tiles = tileRef.current;
    if (mapTile === 'light') { if (map.hasLayer(tiles.dark)) map.removeLayer(tiles.dark); if (!map.hasLayer(tiles.light)) tiles.light.addTo(map); }
    else { if (map.hasLayer(tiles.light)) map.removeLayer(tiles.light); if (!map.hasLayer(tiles.dark)) tiles.dark.addTo(map); }
  }, [mapTile]);

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
    const v = MOVEMENT_VESSELS.find(x => x.id === selId);
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
                        <div style={{width:7,height:7,borderRadius:'50%',background:AIS_STATUS_COLORS[v.status]||'#888',flexShrink:0}}/>
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
                {MOVEMENT_VESSELS.map(v => (
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
            <div style={{position:'absolute',top:10,right:10,zIndex:1000,background:'rgba(26,29,31,.92)',borderRadius:6,padding:'10px 14px',backdropFilter:'blur(4px)'}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'rgba(255,255,255,.5)',marginBottom:7}}>Layers</div>
              {[['routes','AIS Routes'],['vessels','Vessels'],['ports','Ports'],['choke','Chokepoints'],['dark','AIS Dark Zones']].map(([key,label]) => (
                <label key={key} style={{display:'flex',alignItems:'center',gap:7,fontSize:10,color:'rgba(255,255,255,.75)',cursor:'pointer',padding:'2px 0'}}>
                  <input type="checkbox" checked={layers[key]} onChange={()=>toggleLayer(key)} style={{cursor:'pointer'}}/>
                  {label}
                </label>
              ))}
              <div style={{borderTop:'1px solid rgba(255,255,255,.12)',marginTop:7,paddingTop:7}}>
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
