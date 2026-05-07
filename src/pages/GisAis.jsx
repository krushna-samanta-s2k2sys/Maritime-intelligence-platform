import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const VESSELS = [
  {id:'v01',name:'MT NORDIC STAR',imo:'9234567',mmsi:'319000001',type:'Crude Oil Tanker',flagN:'Marshall Islands',spd:13.2,hdg:285,lat:25.5,lon:58.2,dest:'SINGAPORE',eta:'2025-05-10',status:'Underway',dwt:298000,owner:'Nordic Tankers AS',cargo:'Crude Oil'},
  {id:'v02',name:'MV OCEAN PIONEER',imo:'9345678',mmsi:'636000002',type:'Bulk Carrier',flagN:'Liberia',spd:0,hdg:0,lat:22.5,lon:114.1,dest:'PORT HEDLAND',eta:'2025-05-15',status:'In Port',dwt:180000,owner:'Pacific Carriers',cargo:'Iron Ore'},
  {id:'v03',name:'MT AEGEAN GLORY',imo:'9456789',mmsi:'241000003',type:'Product Tanker',flagN:'Greece',spd:14.8,hdg:330,lat:36.5,lon:24.2,dest:'ROTTERDAM',eta:'2025-05-08',status:'Underway',dwt:52000,owner:'Aegean Marine SA',cargo:'Naphtha'},
  {id:'v04',name:'MV PACIFIC BRIDGE',imo:'9567890',mmsi:'370000004',type:'Container',flagN:'Panama',spd:18.4,hdg:270,lat:28.3,lon:155.2,dest:'LONG BEACH',eta:'2025-05-09',status:'Underway',dwt:65000,owner:'Pacific International',cargo:'4,200 TEU'},
  {id:'v05',name:'LNG ARCTIC SPIRIT',imo:'9678901',mmsi:'310000005',type:'LNG Carrier',flagN:'Bermuda',spd:0,hdg:180,lat:22.3,lon:113.6,dest:'TOKYO',eta:'2025-05-12',status:'At Anchor',dwt:95000,owner:'TotalEnergies',cargo:'135,000 CBM LNG'},
  {id:'v06',name:'MV CASPIAN STAR',imo:'9789012',mmsi:'209000006',type:'Bulk Carrier',flagN:'Cyprus',spd:11.5,hdg:200,lat:12.2,lon:44.5,dest:'DJIBOUTI',eta:'2025-05-06',status:'Underway',dwt:76000,owner:'Ultramar SA',cargo:'Grain'},
  {id:'v07',name:'MT PERSEVERANCE',imo:'9890123',mmsi:'241000007',type:'Crude Oil Tanker',flagN:'Greece',spd:0,hdg:0,lat:51.95,lon:4.13,dest:'NOVOROSSIYSK',eta:'2025-05-20',status:'In Port',dwt:105000,owner:'Dynagas',cargo:'Ballast'},
  {id:'v08',name:'MV GLOBAL HARMONY',imo:'9901234',mmsi:'566000008',type:'Container',flagN:'Singapore',spd:0.3,hdg:45,lat:1.5,lon:105.0,dest:'SINGAPORE',eta:'2025-05-06',status:'Underway',dwt:38000,owner:'Pacific Line',cargo:'2,800 TEU'},
  {id:'v09',name:'MT CASPIAN QUEEN',imo:'9012345',mmsi:'205000009',type:'Aframax',flagN:'Belgium',spd:12.1,hdg:290,lat:42.5,lon:-18.2,dest:'HOUSTON',eta:'2025-05-14',status:'Underway',dwt:115000,owner:'Euronav',cargo:'Naphtha'},
  {id:'v10',name:'MV SOUTHERN CROSS',imo:'9123456',mmsi:'503000010',type:'Bulk Carrier',flagN:'Australia',spd:13.8,hdg:340,lat:-23.5,lon:-42.8,dest:'TIANJIN',eta:'2025-05-24',status:'Underway',dwt:82000,owner:'Borealis Maritime',cargo:'Soybeans'},
  {id:'v11',name:'MT VOLGA PRIDE',imo:'9332211',mmsi:'273000011',type:'Crude Oil Tanker',flagN:'Russia',spd:10.2,hdg:260,lat:48.5,lon:14.3,dest:'ROTTERDAM',eta:'2025-05-09',status:'Underway',dwt:115000,owner:'Tsakos Group',cargo:'Urals Crude'},
  {id:'v12',name:'MV ATLAS PEAK',imo:'9221100',mmsi:'636000012',type:'Capesize',flagN:'Liberia',spd:14.1,hdg:70,lat:-33.2,lon:27.8,dest:'PORT HEDLAND',eta:'2025-05-18',status:'Underway',dwt:176000,owner:'Star Bulk',cargo:'Ballast'},
  {id:'v13',name:'MT SUEZ GLORY',imo:'9445566',mmsi:'229000013',type:'VLCC',flagN:'Malta',spd:15.2,hdg:130,lat:27.5,lon:33.2,dest:'FUJAIRAH',eta:'2025-05-07',status:'Underway',dwt:298000,owner:'Maran Tankers',cargo:'Crude Oil'},
  {id:'v14',name:'MV ARCTIC TRADER',imo:'9334455',mmsi:'257000014',type:'General Cargo',flagN:'Norway',spd:0,hdg:90,lat:69.2,lon:18.5,dest:'TROMSØ',eta:'—',status:'At Anchor',dwt:8500,owner:'Nor Lines',cargo:'General Cargo'},
  {id:'v15',name:'MT POSEIDON QUEEN',imo:'9667788',mmsi:'224000015',type:'Product Tanker',flagN:'Cameroon',spd:0,hdg:0,lat:14.5,lon:42.8,dest:'UNKNOWN',eta:'UNKNOWN',status:'AIS Dark',dwt:45000,owner:'Unknown',cargo:'Unknown'},
  {id:'v16',name:'MV PIONEER SPIRIT',imo:'9556677',mmsi:'255000016',type:'Heavy Lift',flagN:'Portugal',spd:7.8,hdg:170,lat:44.5,lon:-14.3,dest:'LAS PALMAS',eta:'2025-05-08',status:'Underway',dwt:24000,owner:'Heerema Marine',cargo:'Subsea Equipment'},
  {id:'v17',name:'MT HORIZON',imo:'9778844',mmsi:'311000017',type:'Chemical Tanker',flagN:'Bahamas',spd:13.5,hdg:220,lat:19.5,lon:65.8,dest:'MUMBAI',eta:'2025-05-06',status:'Underway',dwt:39000,owner:'Stolt-Nielsen',cargo:'Chemicals'},
  {id:'v18',name:'MV PACIFIC GLORY',imo:'9889900',mmsi:'311000018',type:'Container',flagN:'Bahamas',spd:20.1,hdg:95,lat:7.8,lon:155.2,dest:'SYDNEY',eta:'2025-05-10',status:'Underway',dwt:82000,owner:'Hapag-Lloyd',cargo:'8,500 TEU'},
  {id:'v19',name:'MT GULF STAR',imo:'9334466',mmsi:'447000019',type:'Product Tanker',flagN:'Kuwait',spd:0,hdg:0,lat:29.2,lon:48.5,dest:'LOADING',eta:'2025-05-07',status:'At Anchor',dwt:50000,owner:'KOTC',cargo:'Awaiting'},
  {id:'v20',name:'LNG MERIDIAN',imo:'9445577',mmsi:'419000020',type:'LNG Carrier',flagN:'India',spd:17.2,hdg:280,lat:19.8,lon:78.5,dest:'KOCHI',eta:'2025-05-05',status:'Underway',dwt:92000,owner:'Petronet LNG',cargo:'LNG'},
  {id:'v21',name:'MV CAPE ENTERPRISE',imo:'9556688',mmsi:'503000021',type:'Capesize',flagN:'Australia',spd:13.3,hdg:50,lat:-12.5,lon:128.8,dest:'DAMPIER',eta:'2025-05-06',status:'Underway',dwt:179000,owner:'BHP',cargo:'Iron Ore'},
  {id:'v22',name:'MT STELLAR',imo:'9667799',mmsi:'477000022',type:'VLCC',flagN:'Hong Kong',spd:14.5,hdg:205,lat:8.5,lon:76.5,dest:'SINGAPORE',eta:'2025-05-09',status:'Underway',dwt:310000,owner:'CNOOC',cargo:'Crude Oil'},
  {id:'v23',name:'MV WESTBOUND',imo:'9778810',mmsi:'636000023',type:'Container',flagN:'Liberia',spd:16.8,hdg:270,lat:34.5,lon:-55.2,dest:'ROTTERDAM',eta:'2025-05-09',status:'Underway',dwt:75000,owner:'MSC',cargo:'6,200 TEU'},
  {id:'v24',name:'MT NORTHERN GHOST',imo:'9778899',mmsi:'351000024',type:'Crude Oil Tanker',flagN:'St Kitts & Nevis',spd:0,hdg:0,lat:55.5,lon:20.8,dest:'UNKNOWN',eta:'AIS DARK 23d',status:'AIS Dark',dwt:115000,owner:'Northsea Trading Ltd',cargo:'Unknown'},
  {id:'v25',name:'MV STAR PRINCESS',imo:'9889911',mmsi:'215000025',type:'RoRo',flagN:'Malta',spd:18.5,hdg:305,lat:37.5,lon:10.8,dest:'MARSEILLE',eta:'2025-05-06',status:'Underway',dwt:28000,owner:'DFDS',cargo:'RoRo Cargo'},
];

const ROUTES = [
  [[25.5,58.2],[10.5,64.5],[1.26,103.8]],
  [[28.3,155.2],[22.0,160.0],[36.5,180],[33.75,-118.2]],
  [[36.5,24.2],[36.5,15.0],[38.5,9.0],[43.5,-5.0],[51.9,4.5]],
  [[12.2,44.5],[11.6,43.1]],
  [[42.5,-18.2],[33.5,-18.5],[36.8,-8.5],[36.5,-6.3],[29.5,-13.2],[28.0,-14.5]],
  [[-23.5,-42.8],[-33.5,-28.5],[-35.5,-20.5],[-34.5,-5.5],[-26.5,5.5],[-12.5,30.5],[8.5,76.5],[19.8,78.5]],
];

const PORTS = [
  {n:'Singapore',lat:1.26,lon:103.8,size:'mega'},{n:'Rotterdam',lat:51.9,lon:4.5,size:'mega'},
  {n:'Shanghai',lat:31.2,lon:121.5,size:'mega'},{n:'Ningbo',lat:29.9,lon:121.8,size:'mega'},
  {n:'Shenzhen',lat:22.5,lon:114.1,size:'large'},{n:'Busan',lat:35.1,lon:129.0,size:'large'},
  {n:'Dubai (Jebel Ali)',lat:25.0,lon:55.1,size:'large'},{n:'Fujairah',lat:25.1,lon:56.3,size:'medium'},
  {n:'Kharg Island',lat:29.2,lon:50.3,size:'medium'},{n:'Ras Laffan',lat:25.9,lon:51.6,size:'medium'},
  {n:'Houston',lat:29.7,lon:-95.0,size:'large'},{n:'Long Beach',lat:33.75,lon:-118.2,size:'large'},
  {n:'New York/New Jersey',lat:40.7,lon:-74.1,size:'large'},{n:'Antwerp',lat:51.3,lon:4.3,size:'large'},
  {n:'Hamburg',lat:53.5,lon:10.0,size:'large'},{n:'Yokohama',lat:35.4,lon:139.7,size:'large'},
  {n:'Manila',lat:14.6,lon:120.9,size:'medium'},{n:'Colombo',lat:6.9,lon:79.9,size:'medium'},
  {n:'Mumbai',lat:18.9,lon:72.8,size:'large'},{n:'Port Klang',lat:3.0,lon:101.3,size:'large'},
];

const CHOKE = [
  {n:'Strait of Hormuz',lat:26.6,lon:56.2,vol:'17M BPD',risk:'High'},
  {n:'Strait of Malacca',lat:2.3,lon:103.5,vol:'900 vessels/day',risk:'Medium'},
  {n:'Suez Canal',lat:30.2,lon:32.5,vol:'12% global trade',risk:'Critical'},
  {n:'Bab-el-Mandeb',lat:12.6,lon:43.3,vol:'6M BPD',risk:'Critical'},
  {n:'Turkish Straits',lat:41.1,lon:29.0,vol:'3M BPD',risk:'Medium'},
  {n:'Dover Strait',lat:51.1,lon:1.5,vol:'500+ vessels/day',risk:'Low'},
  {n:'Panama Canal',lat:9.1,lon:-79.7,vol:'5% global trade',risk:'Low'},
];

const MOU_ZONES = [
  {name:'Paris MOU',color:'#3b82f6',coords:[[72,32],[72,-15],[36,-15],[36,32]]},
  {name:'Tokyo MOU',color:'#a855f7',coords:[[60,108],[60,180],[0,180],[0,108]]},
  {name:'Indian Ocean MOU',color:'#ec4899',coords:[[30,60],[30,115],[0,115],[0,60],[10,44]]},
  {name:'USCG',color:'#f59e0b',coords:[[75,-50],[75,-168],[15,-168],[15,-50]]},
  {name:'Mediterranean MOU',color:'#10b981',coords:[[48,8],[48,42],[30,42],[30,8]]},
];

const TILE_URLS = {
  dark:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

const STATUS_COLOR = {
  Underway:'#4ade80',
  'In Port':'#60a5fa',
  'At Anchor':'#fbbf24',
  'AIS Dark':'#f87171',
};
const STATUS_SIZE = {Underway:7,'In Port':8,'At Anchor':6,'AIS Dark':9};

function hdgToCompass(h) {
  const c=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return c[Math.round(h/22.5)%16];
}

export default function GisAis() {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layerRefs = useRef({});
  const tileRefs = useRef({});
  const markerRefs = useRef({});
  const vessels = useRef(VESSELS.map(v => ({ ...v })));
  const simInterval = useRef(null);
  const toastTimer = useRef(null);

  const [srch, setSrch] = useState('');
  const [sbSrch, setSbSrch] = useState('');
  const [typeFilters, setTypeFilters] = useState(new Set(['Underway', 'Anchor', 'Port', 'Dark']));
  const [selId, setSelId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selVessel, setSelVessel] = useState(null);
  const [tile, setTileState] = useState('dark');
  const [layers, setLayers] = useState({ vessels: true, routes: true, ports: true, choke: false, mou: false, density: false });
  const [simRunning, setSimRunning] = useState(false);
  const [coords, setCoords] = useState({ lat: '—', lon: '—' });
  const [clock, setClock] = useState('--:--:-- UTC');
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg, duration = 3500) => {
    setToast(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), duration);
  }, []);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().slice(17, 25) + ' UTC');
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Map init
  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([20, 60], 3);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInst.current = map;

    // Tiles
    tileRefs.current.dark = L.tileLayer(TILE_URLS.dark, { maxZoom: 19 });
    tileRefs.current.light = L.tileLayer(TILE_URLS.light, { maxZoom: 19 });
    tileRefs.current.dark.addTo(map);

    // Layers
    const lv = L.layerGroup().addTo(map);
    const lr = L.layerGroup().addTo(map);
    const lp = L.layerGroup().addTo(map);
    const lc = L.layerGroup();
    const lm = L.layerGroup();
    layerRefs.current = { vessels: lv, routes: lr, ports: lp, choke: lc, mou: lm };

    // Routes
    ROUTES.forEach(r => {
      L.polyline(r, { color: '#4d7ef7', weight: 1.5, opacity: 0.4, dashArray: '5 8' }).addTo(lr);
    });

    // Ports
    PORTS.forEach(p => {
      const r = p.size === 'mega' ? 7 : p.size === 'large' ? 5 : 4;
      L.circleMarker([p.lat, p.lon], { radius: r, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.8, weight: 1 })
        .bindTooltip(`<strong>⚓ ${p.n}</strong>`)
        .addTo(lp);
    });

    // Chokepoints
    CHOKE.forEach(c => {
      const rc = c.risk === 'Critical' ? '#c8102e' : c.risk === 'High' ? '#ea580c' : '#f59e0b';
      L.circleMarker([c.lat, c.lon], { radius: 14, color: rc, fillColor: 'transparent', weight: 1.5, opacity: 0.5 }).addTo(lc);
      L.circleMarker([c.lat, c.lon], { radius: 6, color: rc, fillColor: rc, fillOpacity: 0.9, weight: 1 })
        .bindTooltip(`<strong>⛔ ${c.n}</strong><br>Volume: ${c.vol}<br>Risk: ${c.risk}`)
        .addTo(lc);
    });

    // MOU zones
    MOU_ZONES.forEach(m => {
      L.polygon(m.coords.map(c => [c[0], c[1]]), {
        color: m.color, fillColor: m.color, fillOpacity: 0.06, weight: 1.5, dashArray: '6 4',
      }).bindTooltip(m.name).addTo(lm);
    });

    // Vessel markers
    vessels.current.forEach(v => addVesselMarker(v, lv));

    // Mouse coords
    map.on('mousemove', e => {
      setCoords({ lat: e.latlng.lat.toFixed(4), lon: e.latlng.lng.toFixed(4) });
    });

    setTimeout(() => showToast('🚨 AIS Alert: MT NORTHERN GHOST — 23-day signal blackout detected (Baltic Sea)', 5000), 4000);

    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
      map.remove();
      mapInst.current = null;
    };
  }, [showToast]);

  function addVesselMarker(v, layer) {
    const col = STATUS_COLOR[v.status] || '#888';
    const r = STATUS_SIZE[v.status] || 7;
    const m = L.circleMarker([v.lat, v.lon], {
      radius: r, color: col, fillColor: col,
      fillOpacity: v.status === 'AIS Dark' ? 0.5 : 0.85,
      weight: 2, opacity: v.status === 'AIS Dark' ? 0.7 : 1,
    });

    if (v.status === 'Underway' && v.spd > 0) {
      const angle = v.hdg * Math.PI / 180;
      const arrowLen = 0.003 * v.spd;
      const endLat = v.lat + arrowLen * Math.cos(angle);
      const endLon = v.lon + arrowLen * Math.sin(angle) / Math.cos(v.lat * Math.PI / 180);
      L.polyline([[v.lat, v.lon], [endLat, endLon]], { color: col, weight: 2, opacity: 0.7 }).addTo(layer);
    }

    m.bindTooltip(`<strong>🚢 ${v.name}</strong><br>IMO: ${v.imo}<br>${v.status} · ${v.spd} kts<br>→ ${v.dest}`, { sticky: true });
    m.on('click', () => handleSelectVessel(v.id));
    m.addTo(layer);
    markerRefs.current[v.id] = m;
  }

  function handleSelectVessel(id) {
    const v = vessels.current.find(x => x.id === id);
    if (!v || !mapInst.current) return;
    setSelId(id);
    setSelVessel({ ...v });
    setDetailOpen(true);
    mapInst.current.setView([v.lat, v.lon], 7, { animate: true });

    // Draw AIS trail
    const lv = layerRefs.current.vessels;
    lv.clearLayers();
    vessels.current.forEach(x => addVesselMarker(x, lv));
    if (v.status === 'Underway') {
      const trail = [];
      const angle = ((v.hdg + 180) % 360) * Math.PI / 180;
      for (let i = 1; i <= 8; i++) {
        const dist = i * 0.004 * (v.spd || 10);
        trail.push([v.lat + dist * Math.cos(angle), v.lon + dist * Math.sin(angle) / Math.cos(v.lat * Math.PI / 180)]);
      }
      trail.reverse();
      trail.push([v.lat, v.lon]);
      L.polyline(trail, { color: STATUS_COLOR[v.status], weight: 2, opacity: 0.6, dashArray: '4 6' }).addTo(lv);
    }
  }

  // Layer toggles
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    Object.entries(layers).forEach(([key, on]) => {
      const l = layerRefs.current[key];
      if (!l) return;
      if (on && !map.hasLayer(l)) map.addLayer(l);
      if (!on && map.hasLayer(l)) map.removeLayer(l);
    });
  }, [layers]);

  // Tile switch
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    Object.entries(tileRefs.current).forEach(([k, t]) => {
      if (k === tile) { if (!map.hasLayer(t)) t.addTo(map); }
      else { if (map.hasLayer(t)) map.removeLayer(t); }
    });
  }, [tile]);

  function toggleLayer(key) {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleTypeFilter(type) {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  function handleSearch(q) {
    setSrch(q);
    if (!q) return;
    const v = vessels.current.find(x => x.name.toLowerCase().includes(q.toLowerCase()) || x.imo.includes(q) || x.mmsi.includes(q));
    if (v) handleSelectVessel(v.id);
  }

  function toggleSim() {
    if (simRunning) {
      clearInterval(simInterval.current);
      simInterval.current = null;
      setSimRunning(false);
      showToast('⏹ AIS simulation stopped');
    } else {
      setSimRunning(true);
      showToast('▶ AIS position simulation running…');
      simInterval.current = setInterval(() => {
        vessels.current.forEach(v => {
          if (v.status !== 'Underway') return;
          const angle = v.hdg * Math.PI / 180;
          const dt = 0.0002;
          v.lat += dt * Math.cos(angle) * (v.spd / 10);
          v.lon += dt * Math.sin(angle) * (v.spd / 10) / Math.cos(v.lat * Math.PI / 180);
          v.hdg = (v.hdg + (Math.random() - 0.5) * 2 + 360) % 360;
          if (markerRefs.current[v.id]) markerRefs.current[v.id].setLatLng([v.lat, v.lon]);
        });
        setSelVessel(prev => {
          if (!prev) return prev;
          const v = vessels.current.find(x => x.id === prev.id);
          return v && v.status === 'Underway' ? { ...v } : prev;
        });
      }, 800);
    }
  }

  function showDarkZones() {
    setLayers(prev => ({ ...prev, choke: true }));
    const lv = layerRefs.current.vessels;
    vessels.current.filter(v => v.status === 'AIS Dark').forEach(v => {
      L.circle([v.lat, v.lon], { radius: 200000, color: '#f87171', fillColor: '#f87171', fillOpacity: 0.08, weight: 1, dashArray: '6 4' }).addTo(lv);
    });
    const darkCount = vessels.current.filter(v => v.status === 'AIS Dark').length;
    showToast(`🌑 ${darkCount} AIS Dark vessels highlighted`);
  }

  const filteredVessels = useMemo(() => {
    return vessels.current.filter(v => {
      if (sbSrch && !v.name.toLowerCase().includes(sbSrch.toLowerCase()) && !v.imo.includes(sbSrch)) return false;
      return (
        (typeFilters.has('Underway') && v.status === 'Underway') ||
        (typeFilters.has('Anchor') && v.status === 'At Anchor') ||
        (typeFilters.has('Port') && v.status === 'In Port') ||
        (typeFilters.has('Dark') && v.status === 'AIS Dark')
      );
    });
  }, [sbSrch, typeFilters]);

  const counts = useMemo(() => ({
    underway: VESSELS.filter(v => v.status === 'Underway').length,
    anchor: VESSELS.filter(v => v.status === 'At Anchor').length,
    port: VESSELS.filter(v => v.status === 'In Port').length,
    dark: VESSELS.filter(v => v.status === 'AIS Dark').length,
  }), []);

  const tbBtn = (key, label) => (
    <button
      onClick={() => toggleLayer(key)}
      style={{
        padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
        background: layers[key] ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
        color: layers[key] ? '#fff' : 'rgba(255,255,255,0.6)',
        border: layers[key] ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.2)',
        fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5,
        transition: 'all 0.12s',
      }}
    >{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1d1f', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        background: 'rgba(26,29,31,0.95)', padding: '8px 16px', display: 'flex', alignItems: 'center',
        gap: 8, flexShrink: 0, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#4ade80', fontWeight: 600 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: '#4ade80',
            animation: 'gis-pulse 2s infinite',
          }} />
          LIVE AIS
        </div>
        <style>{`@keyframes gis-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}}`}</style>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>🔍</span>
          <input
            value={srch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search vessel, IMO, MMSI…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 11, padding: '5px 8px 5px 26px', borderRadius: 4, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Layers:</span>
        {tbBtn('vessels', '🚢 Vessels')}
        {tbBtn('routes', '🛤 Routes')}
        {tbBtn('ports', '⚓ Ports')}
        {tbBtn('choke', '⛔ Chokepoints')}
        {tbBtn('mou', '🗺 MOU Zones')}

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tiles:</span>
        {['dark', 'light'].map(t => (
          <button key={t} onClick={() => setTileState(t)} style={{
            padding: '4px 10px', fontSize: 10, fontWeight: 600, borderRadius: 3, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)',
            color: tile === t ? '#fff' : 'rgba(255,255,255,0.6)',
            background: tile === t ? 'rgba(255,255,255,0.15)' : 'transparent',
            fontFamily: 'inherit',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
        <button onClick={toggleSim} style={{
          padding: '3px 9px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
          background: simRunning ? '#c8102e' : 'rgba(255,255,255,0.1)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'inherit',
        }}>
          {simRunning ? '⏹ Stop Sim' : '▶ Simulate AIS'}
        </button>
        <button onClick={showDarkZones} style={{
          padding: '3px 9px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
          background: 'rgba(255,255,255,0.1)', color: '#f87171',
          border: '1px solid rgba(248,113,113,0.3)', fontFamily: 'inherit',
        }}>
          🌑 Dark Activity
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          Lat: {coords.lat} · Lon: {coords.lon}
        </div>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Left sidebar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
          background: 'rgba(26,29,31,0.92)', backdropFilter: 'blur(10px)', zIndex: 900,
          display: 'flex', flexDirection: 'column',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-252px)',
          transition: 'transform 0.25s',
        }}>
          {/* Toggle */}
          <div
            onClick={() => setSidebarOpen(p => !p)}
            style={{
              position: 'absolute', right: -28, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 50, background: 'rgba(26,29,31,0.92)', borderRadius: '0 6px 6px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontSize: 14,
              border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none',
            }}
          >{sidebarOpen ? '◀' : '▶'}</div>

          {/* Head */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Vessels <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 400 }}>({VESSELS.length} tracked)</span>
            </div>
            <input
              value={sbSrch}
              onChange={e => setSbSrch(e.target.value)}
              placeholder="Filter vessel list…"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 11, padding: '6px 8px', borderRadius: 4, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {[
                { key: 'Underway', label: 'Underway', color: '#4ade80' },
                { key: 'Anchor', label: 'Anchor', color: '#fbbf24' },
                { key: 'Port', label: 'In Port', color: '#60a5fa' },
                { key: 'Dark', label: 'AIS Dark', color: '#f87171' },
              ].map(f => (
                <button key={f.key} onClick={() => toggleTypeFilter(f.key)} style={{
                  padding: '3px 8px', fontSize: 9, fontWeight: 700, borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${f.color}`,
                  color: typeFilters.has(f.key) ? '#fff' : f.color,
                  background: typeFilters.has(f.key) ? `${f.color}22` : 'transparent',
                  fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: 0.3,
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Vessel list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredVessels.map(v => {
              const col = STATUS_COLOR[v.status] || '#888';
              return (
                <div
                  key={v.id}
                  onClick={() => handleSelectVessel(v.id)}
                  style={{
                    padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', transition: 'background 0.1s',
                    background: selId === v.id ? 'rgba(66,100,251,0.2)' : 'transparent',
                    borderLeft: selId === v.id ? '3px solid #60a5fa' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{v.name}</div>
                    {v.status === 'AIS Dark' && (
                      <span style={{ fontSize: 8, fontWeight: 700, background: '#f87171', color: '#fff', padding: '1px 5px', borderRadius: 6 }}>DARK</span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace' }}>{v.imo}</span>
                    <span>{v.type}</span>
                    <span style={{ color: col, fontWeight: 700 }}>{v.status}</span>
                    {v.spd > 0 && <span style={{ color: '#4ade80', fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>{v.spd}kts</span>}
                  </div>
                  {v.dest && (
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      → {v.dest}{v.eta && v.eta !== '—' ? ' · ETA ' + v.eta.replace('2025-', '') : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Vessel Detail Panel */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 320,
          background: 'rgba(26,29,31,0.95)', backdropFilter: 'blur(10px)', zIndex: 900,
          display: 'flex', flexDirection: 'column',
          transform: detailOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s',
        }}>
          <div
            onClick={() => { setDetailOpen(false); setSelId(null); }}
            style={{
              position: 'absolute', left: -36, top: 12, width: 32, height: 32,
              background: 'rgba(26,29,31,0.92)', borderRadius: '6px 0 0 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16,
              border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none',
            }}
          >✕</div>

          {selVessel && (() => {
            const v = selVessel;
            const col = STATUS_COLOR[v.status] || '#888';
            const aisOk = v.status !== 'AIS Dark';
            return (
              <>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{v.name}</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace' }}>{v.imo}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'monospace' }}>MMSI {v.mmsi}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {aisOk ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 4, padding: '5px 9px', fontSize: 10, color: '#4ade80', fontWeight: 700 }}>
                        🛰 AIS ACTIVE · {v.spd} kts · {v.hdg}° heading
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 4, padding: '5px 9px', fontSize: 10, color: '#f87171', fontWeight: 700 }}>
                        🌑 AIS SIGNAL LOST · {v.eta}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {/* Position */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Position & Navigation</div>
                    {[
                      ['Latitude', `${v.lat.toFixed(4)}°N`],
                      ['Longitude', `${Math.abs(v.lon).toFixed(4)}°${v.lon >= 0 ? 'E' : 'W'}`],
                      ['Speed', `${v.spd} kts`, '#4ade80'],
                      ['Heading', `${v.hdg}° ${hdgToCompass(v.hdg)}`],
                      ['Destination', v.dest || '—', '#e2e8f0', true],
                      ['ETA', v.eta || '—'],
                      ['Status', v.status, col, true],
                    ].map(([lbl, val, vc, bold]) => (
                      <div key={lbl} style={{ display: 'flex', gap: 8, padding: '3px 0', fontSize: 11 }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, width: 120, flexShrink: 0 }}>{lbl}</div>
                        <div style={{ color: vc || '#e2e8f0', flex: 1, fontWeight: bold ? 700 : 400, fontFamily: lbl === 'Latitude' || lbl === 'Longitude' ? 'monospace' : 'inherit' }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Vessel Details */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Vessel Details</div>
                    {[
                      ['Type', v.type],
                      ['DWT', `${v.dwt.toLocaleString()} MT`],
                      ['Flag', v.flagN],
                      ['Owner', v.owner],
                      ['Cargo', v.cargo || '—'],
                    ].map(([lbl, val]) => (
                      <div key={lbl} style={{ display: 'flex', gap: 8, padding: '3px 0', fontSize: 11 }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, width: 120, flexShrink: 0 }}>{lbl}</div>
                        <div style={{ color: '#e2e8f0', flex: 1 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Links */}
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Quick Links</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {['📋 Full Profile', '🚨 Sanctions', '🗺 Voyage'].map(lbl => (
                        <button key={lbl} style={{ padding: '3px 9px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'inherit' }}>{lbl}</button>
                      ))}
                      {v.status === 'AIS Dark' && (
                        <button onClick={() => showToast(`🌑 AIS Dark Alert raised for ${v.name}`)} style={{ padding: '3px 9px', fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: 'pointer', background: '#f87171', color: '#fff', border: 'none', fontFamily: 'inherit' }}>⚠️ Raise Alert</button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Layer Legend (top-right) */}
        <div style={{
          position: 'absolute', top: 10, right: detailOpen ? 330 : 10, zIndex: 900,
          background: 'rgba(26,29,31,0.92)', backdropFilter: 'blur(8px)', borderRadius: 6,
          padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', minWidth: 160,
          transition: 'right 0.25s',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Legend</div>
          {[
            { color: '#4ade80', label: 'Underway' },
            { color: '#fbbf24', label: 'At Anchor' },
            { color: '#60a5fa', label: 'In Port' },
            { color: '#f87171', label: 'AIS Dark / Alert' },
            { color: '#f59e0b', label: 'Ports / Terminals' },
            { color: '#ea580c', label: 'Chokepoints' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{l.label}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>MOU Zones</div>
            {[
              { color: '#3b82f6', label: 'Paris MOU' },
              { color: '#a855f7', label: 'Tokyo MOU' },
              { color: '#ec4899', label: 'Indian Ocean MOU' },
              { color: '#f59e0b', label: 'USCG' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, opacity: 0.6, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: sidebarOpen ? 280 : 28, right: 0, zIndex: 900,
          background: 'rgba(26,29,31,0.88)', backdropFilter: 'blur(8px)',
          padding: '6px 16px', display: 'flex', gap: 20, alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          transition: 'left 0.25s',
        }}>
          {[
            { v: counts.underway, l: 'Underway', c: '#4ade80' },
            { v: counts.anchor, l: 'At Anchor', c: '#fbbf24' },
            { v: counts.port, l: 'In Port', c: '#60a5fa' },
            { v: counts.dark, l: 'AIS Dark', c: '#f87171' },
            { v: VESSELS.length, l: 'Total Vessels' },
            { v: clock, l: 'Last Update', c: '#60a5fa', mono: true },
            { v: '1,284', l: 'BDI' },
            { v: '84', l: 'WS AG/East', c: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.c || '#fff', fontFamily: 'monospace', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Alert Toast */}
        {toastVisible && (
          <div style={{
            position: 'absolute', top: 16, right: detailOpen ? 340 : 10, zIndex: 1000,
            background: '#c8102e', color: '#fff', borderRadius: 6, padding: '10px 14px',
            fontSize: 11, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            maxWidth: 260, lineHeight: 1.5,
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
