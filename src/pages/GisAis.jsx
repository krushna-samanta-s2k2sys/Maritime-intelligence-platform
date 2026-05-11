import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FilterBuilder from '../components/vessels/FilterBuilder';
import { applyFilters } from '../data/filterConfig';

// ── Static data ───────────────────────────────────────────────────────────────
const VESSELS = [
  {id:'v01',name:'MT NORDIC STAR',imo:'9234567',mmsi:'319000001',type:'Crude Oil Tanker',flagN:'Marshall Islands',fl:'🇲🇭',spd:13.2,hdg:285,lat:25.5,lon:58.2,dest:'SINGAPORE',eta:'2025-05-10',status:'Underway',dwt:298000,owner:'Nordic Tankers AS',cargo:'Crude Oil'},
  {id:'v02',name:'MV OCEAN PIONEER',imo:'9345678',mmsi:'636000002',type:'Bulk Carrier',flagN:'Liberia',fl:'🇱🇷',spd:0,hdg:0,lat:22.5,lon:114.1,dest:'PORT HEDLAND',eta:'2025-05-15',status:'In Port',dwt:180000,owner:'Pacific Carriers',cargo:'Iron Ore'},
  {id:'v03',name:'MT AEGEAN GLORY',imo:'9456789',mmsi:'241000003',type:'Product Tanker',flagN:'Greece',fl:'🇬🇷',spd:14.8,hdg:330,lat:36.5,lon:24.2,dest:'ROTTERDAM',eta:'2025-05-08',status:'Underway',dwt:52000,owner:'Aegean Marine SA',cargo:'Naphtha'},
  {id:'v04',name:'MV PACIFIC BRIDGE',imo:'9567890',mmsi:'370000004',type:'Container',flagN:'Panama',fl:'🇵🇦',spd:18.4,hdg:270,lat:28.3,lon:155.2,dest:'LONG BEACH',eta:'2025-05-09',status:'Underway',dwt:65000,owner:'Pacific International',cargo:'4,200 TEU'},
  {id:'v05',name:'LNG ARCTIC SPIRIT',imo:'9678901',mmsi:'310000005',type:'LNG Carrier',flagN:'Bermuda',fl:'🇧🇲',spd:0,hdg:180,lat:22.3,lon:113.6,dest:'TOKYO',eta:'2025-05-12',status:'At Anchor',dwt:95000,owner:'TotalEnergies',cargo:'135,000 CBM LNG'},
  {id:'v06',name:'MV CASPIAN STAR',imo:'9789012',mmsi:'209000006',type:'Bulk Carrier',flagN:'Cyprus',fl:'🇨🇾',spd:11.5,hdg:200,lat:12.2,lon:44.5,dest:'DJIBOUTI',eta:'2025-05-06',status:'Underway',dwt:76000,owner:'Ultramar SA',cargo:'Grain'},
  {id:'v07',name:'MT PERSEVERANCE',imo:'9890123',mmsi:'241000007',type:'Crude Oil Tanker',flagN:'Greece',fl:'🇬🇷',spd:0,hdg:0,lat:51.95,lon:4.13,dest:'NOVOROSSIYSK',eta:'2025-05-20',status:'In Port',dwt:105000,owner:'Dynagas',cargo:'Ballast'},
  {id:'v08',name:'MV GLOBAL HARMONY',imo:'9901234',mmsi:'566000008',type:'Container',flagN:'Singapore',fl:'🇸🇬',spd:0.3,hdg:45,lat:1.5,lon:105.0,dest:'SINGAPORE',eta:'2025-05-06',status:'Underway',dwt:38000,owner:'Pacific Line',cargo:'2,800 TEU'},
  {id:'v09',name:'MT CASPIAN QUEEN',imo:'9012345',mmsi:'205000009',type:'Aframax',flagN:'Belgium',fl:'🇧🇪',spd:12.1,hdg:290,lat:42.5,lon:-18.2,dest:'HOUSTON',eta:'2025-05-14',status:'Underway',dwt:115000,owner:'Euronav',cargo:'Naphtha'},
  {id:'v10',name:'MV SOUTHERN CROSS',imo:'9123456',mmsi:'503000010',type:'Bulk Carrier',flagN:'Australia',fl:'🇦🇺',spd:13.8,hdg:340,lat:-23.5,lon:-42.8,dest:'TIANJIN',eta:'2025-05-24',status:'Underway',dwt:82000,owner:'Borealis Maritime',cargo:'Soybeans'},
  {id:'v11',name:'MT VOLGA PRIDE',imo:'9332211',mmsi:'273000011',type:'Crude Oil Tanker',flagN:'Russia',fl:'🇷🇺',spd:10.2,hdg:260,lat:48.5,lon:14.3,dest:'ROTTERDAM',eta:'2025-05-09',status:'Underway',dwt:115000,owner:'Tsakos Group',cargo:'Urals Crude'},
  {id:'v12',name:'MV ATLAS PEAK',imo:'9221100',mmsi:'636000012',type:'Capesize',flagN:'Liberia',fl:'🇱🇷',spd:14.1,hdg:70,lat:-33.2,lon:27.8,dest:'PORT HEDLAND',eta:'2025-05-18',status:'Underway',dwt:176000,owner:'Star Bulk',cargo:'Ballast'},
  {id:'v13',name:'MT SUEZ GLORY',imo:'9445566',mmsi:'229000013',type:'VLCC',flagN:'Malta',fl:'🇲🇹',spd:15.2,hdg:130,lat:27.5,lon:33.2,dest:'FUJAIRAH',eta:'2025-05-07',status:'Underway',dwt:298000,owner:'Maran Tankers',cargo:'Crude Oil'},
  {id:'v14',name:'MV ARCTIC TRADER',imo:'9334455',mmsi:'257000014',type:'General Cargo',flagN:'Norway',fl:'🇳🇴',spd:0,hdg:90,lat:69.2,lon:18.5,dest:'TROMSØ',eta:'—',status:'At Anchor',dwt:8500,owner:'Nor Lines',cargo:'General Cargo'},
  {id:'v15',name:'MT POSEIDON QUEEN',imo:'9667788',mmsi:'224000015',type:'Product Tanker',flagN:'Cameroon',fl:'🇨🇲',spd:0,hdg:0,lat:14.5,lon:42.8,dest:'UNKNOWN',eta:'UNKNOWN',status:'AIS Dark',dwt:45000,owner:'Unknown',cargo:'Unknown'},
  {id:'v16',name:'MV PIONEER SPIRIT',imo:'9556677',mmsi:'255000016',type:'Heavy Lift',flagN:'Portugal',fl:'🇵🇹',spd:7.8,hdg:170,lat:44.5,lon:-14.3,dest:'LAS PALMAS',eta:'2025-05-08',status:'Underway',dwt:24000,owner:'Heerema Marine',cargo:'Subsea Equipment'},
  {id:'v17',name:'MT HORIZON',imo:'9778844',mmsi:'311000017',type:'Chemical Tanker',flagN:'Bahamas',fl:'🇧🇸',spd:13.5,hdg:220,lat:19.5,lon:65.8,dest:'MUMBAI',eta:'2025-05-06',status:'Underway',dwt:39000,owner:'Stolt-Nielsen',cargo:'Chemicals'},
  {id:'v18',name:'MV PACIFIC GLORY',imo:'9889900',mmsi:'311000018',type:'Container',flagN:'Bahamas',fl:'🇧🇸',spd:20.1,hdg:95,lat:7.8,lon:155.2,dest:'SYDNEY',eta:'2025-05-10',status:'Underway',dwt:82000,owner:'Hapag-Lloyd',cargo:'8,500 TEU'},
  {id:'v19',name:'MT GULF STAR',imo:'9334466',mmsi:'447000019',type:'Product Tanker',flagN:'Kuwait',fl:'🇰🇼',spd:0,hdg:0,lat:29.2,lon:48.5,dest:'LOADING',eta:'2025-05-07',status:'At Anchor',dwt:50000,owner:'KOTC',cargo:'Awaiting'},
  {id:'v20',name:'LNG MERIDIAN',imo:'9445577',mmsi:'419000020',type:'LNG Carrier',flagN:'India',fl:'🇮🇳',spd:17.2,hdg:280,lat:19.8,lon:78.5,dest:'KOCHI',eta:'2025-05-05',status:'Underway',dwt:92000,owner:'Petronet LNG',cargo:'LNG'},
  {id:'v21',name:'MV CAPE ENTERPRISE',imo:'9556688',mmsi:'503000021',type:'Capesize',flagN:'Australia',fl:'🇦🇺',spd:13.3,hdg:50,lat:-12.5,lon:128.8,dest:'DAMPIER',eta:'2025-05-06',status:'Underway',dwt:179000,owner:'BHP',cargo:'Iron Ore'},
  {id:'v22',name:'MT STELLAR',imo:'9667799',mmsi:'477000022',type:'VLCC',flagN:'Hong Kong',fl:'🇭🇰',spd:14.5,hdg:205,lat:8.5,lon:76.5,dest:'SINGAPORE',eta:'2025-05-09',status:'Underway',dwt:310000,owner:'CNOOC',cargo:'Crude Oil'},
  {id:'v23',name:'MV WESTBOUND',imo:'9778810',mmsi:'636000023',type:'Container',flagN:'Liberia',fl:'🇱🇷',spd:16.8,hdg:270,lat:34.5,lon:-55.2,dest:'ROTTERDAM',eta:'2025-05-09',status:'Underway',dwt:75000,owner:'MSC',cargo:'6,200 TEU'},
  {id:'v24',name:'MT NORTHERN GHOST',imo:'9778899',mmsi:'351000024',type:'Crude Oil Tanker',flagN:'St Kitts & Nevis',fl:'🏴',spd:0,hdg:0,lat:55.5,lon:20.8,dest:'UNKNOWN',eta:'AIS DARK 23d',status:'AIS Dark',dwt:115000,owner:'Northsea Trading Ltd',cargo:'Unknown'},
  {id:'v25',name:'MV STAR PRINCESS',imo:'9889911',mmsi:'215000025',type:'RoRo',flagN:'Malta',fl:'🇲🇹',spd:18.5,hdg:305,lat:37.5,lon:10.8,dest:'MARSEILLE',eta:'2025-05-06',status:'Underway',dwt:28000,owner:'DFDS',cargo:'RoRo Cargo'},
];

const GIS_PORTS = [
  {id:'p01',n:'Singapore',lat:1.26,lon:103.8,country:'Singapore',locode:'SGSIN',size:'mega',teu:'37M TEU',calls:82442,draft:'20.5m',mou:'Tokyo MOU'},
  {id:'p02',n:'Rotterdam',lat:51.9,lon:4.5,country:'Netherlands',locode:'NLRTM',size:'mega',teu:'14.5M TEU',calls:30000,draft:'23.0m',mou:'Paris MOU'},
  {id:'p03',n:'Shanghai',lat:31.2,lon:121.5,country:'China',locode:'CNSHA',size:'mega',teu:'47M TEU',calls:45000,draft:'17.0m',mou:'Tokyo MOU'},
  {id:'p04',n:'Dubai (Jebel Ali)',lat:25.0,lon:55.1,country:'UAE',locode:'AEJEA',size:'large',teu:'14M TEU',calls:20000,draft:'17.0m',mou:'Indian Ocean MOU'},
  {id:'p05',n:'Houston',lat:29.7,lon:-95.0,country:'USA',locode:'USHOU',size:'large',teu:'2.8M TEU',calls:8000,draft:'13.7m',mou:'USCG'},
  {id:'p06',n:'Antwerp',lat:51.3,lon:4.3,country:'Belgium',locode:'BEANR',size:'large',teu:'12M TEU',calls:15000,draft:'16.0m',mou:'Paris MOU'},
  {id:'p07',n:'Fujairah',lat:25.1,lon:56.3,country:'UAE',locode:'AEFJR',size:'medium',teu:'1M TEU',calls:9000,draft:'18.0m',mou:'Indian Ocean MOU'},
  {id:'p08',n:'Busan',lat:35.1,lon:129.0,country:'South Korea',locode:'KRPUS',size:'large',teu:'21M TEU',calls:35000,draft:'18.0m',mou:'Tokyo MOU'},
  {id:'p09',n:'Hamburg',lat:53.5,lon:10.0,country:'Germany',locode:'DEHAM',size:'large',teu:'8.9M TEU',calls:12000,draft:'15.1m',mou:'Paris MOU'},
  {id:'p10',n:'Long Beach',lat:33.75,lon:-118.2,country:'USA',locode:'USLGB',size:'large',teu:'8.1M TEU',calls:11000,draft:'15.8m',mou:'USCG'},
  {id:'p11',n:'Ras Laffan',lat:25.9,lon:51.6,country:'Qatar',locode:'QARAS',size:'medium',teu:'0',calls:3000,draft:'14.5m',mou:'Indian Ocean MOU'},
  {id:'p12',n:'Mumbai',lat:18.9,lon:72.8,country:'India',locode:'INBOM',size:'large',teu:'5.5M TEU',calls:14000,draft:'14.0m',mou:'Indian Ocean MOU'},
];

const GIS_COMPANIES = [
  {id:'c01',name:'A.P. Moller-Maersk',type:'Shipping Line',country:'Denmark',lat:55.68,lon:12.57,vessels:700,dwt:'43M DWT',fleet:'Container'},
  {id:'c02',name:'MSC Mediterranean',type:'Shipping Line',country:'Switzerland',lat:46.20,lon:6.15,vessels:620,dwt:'40M DWT',fleet:'Container'},
  {id:'c03',name:'COSCO Shipping',type:'Shipping Line',country:'China',lat:31.23,lon:121.47,vessels:450,dwt:'48M DWT',fleet:'Mixed'},
  {id:'c04',name:'CMA CGM',type:'Shipping Line',country:'France',lat:43.30,lon:5.37,vessels:580,dwt:'32M DWT',fleet:'Container'},
  {id:'c05',name:'Euronav NV',type:'Tanker Owner',country:'Belgium',lat:51.22,lon:4.40,vessels:74,dwt:'22M DWT',fleet:'VLCC Crude'},
  {id:'c06',name:'Star Bulk Carriers',type:'Dry Bulk',country:'Greece',lat:37.98,lon:23.73,vessels:128,dwt:'14M DWT',fleet:'Dry Bulk'},
  {id:'c07',name:'Hapag-Lloyd',type:'Shipping Line',country:'Germany',lat:53.55,lon:9.99,vessels:260,dwt:'18M DWT',fleet:'Container'},
  {id:'c08',name:'Stolt-Nielsen',type:'Chemical Tanker',country:'Norway',lat:59.91,lon:10.75,vessels:150,dwt:'4M DWT',fleet:'Chemical'},
  {id:'c09',name:'Maran Tankers',type:'Tanker Owner',country:'Greece',lat:37.98,lon:23.73,vessels:60,dwt:'19M DWT',fleet:'VLCC/Suezmax'},
  {id:'c10',name:'TotalEnergies',type:'Oil Major',country:'France',lat:48.89,lon:2.24,vessels:30,dwt:'6M DWT',fleet:'LNG/Tanker'},
  {id:'c11',name:'BHP',type:'Commodity Major',country:'Australia',lat:-33.86,lon:151.21,vessels:0,dwt:'0',fleet:'Charterer'},
  {id:'c12',name:'CNOOC',type:'Oil Major',country:'China',lat:22.28,lon:114.16,vessels:45,dwt:'8M DWT',fleet:'Tanker/LNG'},
];

const ROUTES = [
  [[25.5,58.2],[10.5,64.5],[1.26,103.8]],
  [[28.3,155.2],[22.0,160.0],[36.5,180],[33.75,-118.2]],
  [[36.5,24.2],[36.5,15.0],[38.5,9.0],[43.5,-5.0],[51.9,4.5]],
  [[12.2,44.5],[11.6,43.1]],
  [[42.5,-18.2],[33.5,-18.5],[36.8,-8.5],[36.5,-6.3],[29.5,-13.2],[28.0,-14.5]],
  [[-23.5,-42.8],[-33.5,-28.5],[-35.5,-20.5],[-34.5,-5.5],[-26.5,5.5],[-12.5,30.5],[8.5,76.5],[19.8,78.5]],
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

// ── Constants ─────────────────────────────────────────────────────────────────
const TILE_URLS = {
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light:     'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const STATUS_COLOR = {
  Underway:   '#4ade80',
  'In Port':  '#60a5fa',
  'At Anchor':'#fbbf24',
  'AIS Dark': '#f87171',
};

const ENTITY_TABS = [
  { key:'vessels',   label:'Vessels',   ic:'🚢' },
  { key:'ports',     label:'Ports',     ic:'⚓' },
  { key:'companies', label:'Companies', ic:'🏢' },
];

const VESSEL_TYPES = ['All Types','Crude Oil Tanker','VLCC','Aframax','Product Tanker','Chemical Tanker','Bulk Carrier','Capesize','Container','LNG Carrier','General Cargo','Heavy Lift','RoRo'];
const PORT_SIZES   = ['All Sizes','mega','large','medium'];
const CO_TYPES     = ['All Types','Shipping Line','Tanker Owner','Dry Bulk','Chemical Tanker','Oil Major','Commodity Major'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function hdgToCompass(h) {
  const d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return d[Math.round(h / 22.5) % 16];
}
function fmtLat(v) { return `${Math.abs(v).toFixed(4)}° ${v >= 0 ? 'N' : 'S'}`; }
function fmtLon(v) { return `${Math.abs(v).toFixed(4)}° ${v >= 0 ? 'E' : 'W'}`; }

function buildVesselIcon(v, selected = false) {
  const col = STATUS_COLOR[v.status] || '#aaa';
  const sz  = selected ? 26 : 18;
  const hdg = v.hdg || 0;
  let shape;
  if (v.status === 'Underway' && v.spd > 0.5) {
    shape = `<polygon points="0,-8 -4.5,6 0,3 4.5,6" fill="${col}" fill-opacity="0.92" stroke="rgba(0,0,0,0.4)" stroke-width="1.2" stroke-linejoin="round" transform="rotate(${hdg})"/>`;
  } else if (v.status === 'AIS Dark') {
    shape = `<circle cx="0" cy="0" r="5" fill="${col}" fill-opacity="0.35" stroke="${col}" stroke-width="2" stroke-opacity="0.6"/>`;
  } else {
    shape = `<circle cx="0" cy="0" r="5.5" fill="${col}" fill-opacity="0.88" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/>`;
  }
  const ring = selected ? `<circle cx="0" cy="0" r="11" fill="none" stroke="${col}" stroke-width="1.8" stroke-opacity="0.75" stroke-dasharray="4 3"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="-13 -13 26 26">${shape}${ring}</svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] });
}

function buildPortIcon(size, selected) {
  const r = size === 'mega' ? 8 : size === 'large' ? 6 : 5;
  const col = '#f59e0b';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${r*3}" height="${r*3}" viewBox="-${r*1.5} -${r*1.5} ${r*3} ${r*3}">
    <circle cx="0" cy="0" r="${r}" fill="${col}" fill-opacity="0.85" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
    ${selected ? `<circle cx="0" cy="0" r="${r+4}" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="3 3"/>` : ''}
  </svg>`;
  const sz = r * 3;
  return L.divIcon({ html: svg, className: '', iconSize: [sz, sz], iconAnchor: [sz/2, sz/2] });
}

function buildCompanyIcon(selected) {
  const sz = selected ? 22 : 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="-10 -10 20 20">
    <rect x="-6" y="-8" width="12" height="14" rx="1" fill="#6200ea" fill-opacity="0.85" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
    <rect x="-4" y="-5" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.7)"/>
    <rect x="1" y="-5" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.7)"/>
    <rect x="-4" y="0" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.7)"/>
    <rect x="1" y="0" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.7)"/>
    ${selected ? '<circle cx="0" cy="0" r="11" fill="none" stroke="#6200ea" stroke-width="1.5" stroke-dasharray="4 3"/>' : ''}
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [sz, sz], iconAnchor: [sz/2, sz/2] });
}

function seededRng(seed) {
  let s = (seed ^ 0x9e3779b9) >>> 0;
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
}
function strToSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h ^ str.charCodeAt(i), 16777619)) >>> 0;
  return h;
}

function generatePath(v, fromDate, toDate) {
  const now   = new Date();
  const from  = new Date(fromDate + 'T00:00:00Z');
  const toRaw = new Date(toDate + 'T23:59:59Z');
  const to    = toRaw > now ? now : toRaw;
  if (to <= from) return [];
  const STEPS = 80;
  const rnd   = seededRng(strToSeed(v.imo + fromDate));
  const hdgBack = ((v.hdg + 180) % 360) * Math.PI / 180;
  const pts   = [];
  const spd   = v.status === 'Underway' ? (v.spd || 10) : 0;
  for (let i = 0; i <= STEPS; i++) {
    const t = new Date(from.getTime() + (i / STEPS) * (to - from));
    const hoursToNow = (now - t) / 3_600_000;
    const distNm  = spd * hoursToNow;
    const distDeg = distNm / 60;
    const swing   = Math.sin(i * 0.3 + rnd() * 3) * 0.06;
    const hdgVar  = hdgBack + swing;
    const lat = v.lat + distDeg * Math.cos(hdgVar) + (rnd() - 0.5) * 0.04;
    const lon = v.lon + distDeg * Math.sin(hdgVar) / Math.cos(v.lat * Math.PI / 180) + (rnd() - 0.5) * 0.04;
    const pSpd = Math.max(0, spd + (rnd() - 0.5) * 1.5);
    pts.push({ lat, lon, t, spd: pSpd });
  }
  pts.push({ lat: v.lat, lon: v.lon, t: now, spd: v.spd, current: true });
  return pts;
}

function renderPath(layer, pts, color) {
  layer.clearLayers();
  if (pts.length < 2) return;
  const N = 14;
  const chunk = Math.floor(pts.length / N);
  for (let s = 0; s < N; s++) {
    const a = s * chunk;
    const b = s === N - 1 ? pts.length - 1 : (s + 1) * chunk;
    const opacity = 0.08 + (s / N) * 0.72;
    const weight  = 1.5 + (s / N) * 2.5;
    L.polyline(pts.slice(a, b + 1).map(p => [p.lat, p.lon]), { color, weight, opacity, lineCap: 'round' }).addTo(layer);
  }
  const p0 = pts[0];
  L.circleMarker([p0.lat, p0.lon], { radius: 5, color, fillColor: '#0d1117', fillOpacity: 1, weight: 2 })
    .bindTooltip(`<b>Path start</b><br>${p0.t.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`, { className: 'gis-tt' })
    .addTo(layer);
  const pN = pts[pts.length - 1];
  L.circleMarker([pN.lat, pN.lon], { radius: 6, color, fillColor: color, fillOpacity: 1, weight: 2 })
    .bindTooltip('<b>Current position</b>', { className: 'gis-tt' }).addTo(layer);
}

// Point-in-polygon ray casting
function ptInPoly(pt, polyPts) {
  const [lat, lon] = pt;
  let inside = false;
  for (let i = 0, j = polyPts.length - 1; i < polyPts.length; j = i++) {
    const [yi, xi] = polyPts[i];
    const [yj, xj] = polyPts[j];
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Pt in circle check [lat,lon], center [lat,lon], radiusNm
function ptInCircle(pt, center, radiusNm) {
  const dlat = (pt[0] - center[0]) * 60;
  const dlon = (pt[1] - center[1]) * 60 * Math.cos(center[0] * Math.PI / 180);
  return Math.sqrt(dlat*dlat + dlon*dlon) <= radiusNm;
}

function computePolygonAreaNm2(pts) {
  if (pts.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const x1 = pts[j][1] * 60 * Math.cos(pts[j][0] * Math.PI / 180);
    const y1 = pts[j][0] * 60;
    const x2 = pts[i][1] * 60 * Math.cos(pts[i][0] * Math.PI / 180);
    const y2 = pts[i][0] * 60;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function computePolylineLengthNm(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dlat = (pts[i][0] - pts[i-1][0]) * 60;
    const dlon = (pts[i][1] - pts[i-1][1]) * 60 * Math.cos(pts[i][0] * Math.PI / 180);
    len += Math.sqrt(dlat*dlat + dlon*dlon);
  }
  return len;
}

function exportGeoJSON(geojson, name) {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${name}.geojson`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GisAis() {
  const navigate     = useNavigate();
  const mapRef       = useRef(null);
  const mapInst      = useRef(null);
  const layerRefs    = useRef({});
  const tileRefs     = useRef({});
  const markerRefs   = useRef({});  // vessel markers: {v01: L.Marker}
  const portMarkersR = useRef({});  // port markers
  const coMarkersR   = useRef({});  // company markers
  const pathLayerRef = useRef(null);
  const drawLayerRef = useRef(null); // preview/draw layer
  const vessels      = useRef(VESSELS.map(v => ({ ...v })));
  const simInterval  = useRef(null);
  const toastTimer   = useRef(null);
  // Draw refs (avoid re-render on each click)
  const drawModeRef  = useRef(null);
  const drawPtsRef   = useRef([]);
  const drawPreviewR = useRef(null); // preview polyline/polygon layer

  // ── UI state ──────────────────────────────────────────────────────────────
  const [entityTab,    setEntityTab]    = useState('vessels');
  const [srch,         setSrch]         = useState('');
  const [sbSrch,       setSbSrch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');   // vessel type / port size / co type
  const [gisFilters,   setGisFilters]   = useState([]);
  const [selId,        setSelId]        = useState(null);
  const [sideOpen,     setSideOpen]     = useState(true);
  const [detailOpen,   setDetailOpen]   = useState(false);
  const [selEntity,    setSelEntity]    = useState(null);  // vessel | port | company object
  const [tile,         setTile]         = useState('light');
  const [layers,       setLayers]       = useState({ vessels:true, routes:false, ports:true, choke:false, mou:false });
  const [simRunning,   setSimRunning]   = useState(false);
  const [coords,       setCoords]       = useState({ lat:'—', lon:'—' });
  const [clock,        setClock]        = useState('--:--:-- UTC');
  const [toast,        setToast]        = useState('');
  const [toastVis,     setToastVis]     = useState(false);

  // Path state (vessel only)
  const today   = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const [pathFrom,     setPathFrom]     = useState(weekAgo);
  const [pathTo,       setPathTo]       = useState(today);
  const [pathShowing,  setPathShowing]  = useState(false);
  const [pathStats,    setPathStats]    = useState(null);

  // Draw state
  const [drawMode,     setDrawMode]     = useState(null);   // 'polygon'|'polyline'|'circle'|'rect'|null
  const [drawPtCount,  setDrawPtCount]  = useState(0);      // synced from drawPtsRef for display
  const [drawnShape,   setDrawnShape]   = useState(null);   // analysis result object

  const showToast = useCallback((msg, dur = 3500) => {
    setToast(msg);
    setToastVis(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVis(false), dur);
  }, []);

  // UTC clock
  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().slice(17, 25) + ' UTC');
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Map initialisation ────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([20, 45], 3);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInst.current = map;

    // Tile layers
    tileRefs.current.dark      = L.tileLayer(TILE_URLS.dark,      { maxZoom: 19 });
    tileRefs.current.light     = L.tileLayer(TILE_URLS.light,     { maxZoom: 19 });
    tileRefs.current.satellite = L.tileLayer(TILE_URLS.satellite, { maxZoom: 19 });
    tileRefs.current.light.addTo(map);

    // Feature layers
    const lv    = L.layerGroup().addTo(map);
    const lr    = L.layerGroup();
    const lp    = L.layerGroup().addTo(map);
    const lc    = L.layerGroup();
    const lm    = L.layerGroup();
    const lpath = L.layerGroup().addTo(map);
    const ldraw = L.layerGroup().addTo(map);
    pathLayerRef.current = lpath;
    drawLayerRef.current = ldraw;
    layerRefs.current = { vessels: lv, routes: lr, ports: lp, choke: lc, mou: lm };

    // Routes
    ROUTES.forEach(r =>
      L.polyline(r, { color: '#4d7ef7', weight: 1.5, opacity: 0.28, dashArray: '7 11' }).addTo(lr)
    );

    // Port markers using GIS_PORTS extended data
    GIS_PORTS.forEach(p => {
      const icon = buildPortIcon(p.size, false);
      const m = L.marker([p.lat, p.lon], { icon });
      m.bindTooltip(`<b>⚓ ${p.n}</b><br>${p.country} · ${p.locode}`, { className: 'gis-tt' });
      m.on('click', e => { L.DomEvent.stopPropagation(e); handleSelectPort(p.id); });
      m.addTo(lp);
      portMarkersR.current[p.id] = m;
    });

    // Chokepoints
    CHOKE.forEach(c => {
      const rc = c.risk === 'Critical' ? '#ef4444' : c.risk === 'High' ? '#f97316' : '#f59e0b';
      L.circleMarker([c.lat, c.lon], { radius: 16, color: rc, fillColor: 'transparent', weight: 1.5, opacity: 0.35 }).addTo(lc);
      L.circleMarker([c.lat, c.lon], { radius: 5, color: rc, fillColor: rc, fillOpacity: 0.9, weight: 1 })
        .bindTooltip(`<b>⛔ ${c.n}</b><br>Volume: ${c.vol}&nbsp;&middot;&nbsp;Risk: ${c.risk}`, { className: 'gis-tt' })
        .addTo(lc);
    });

    // MOU zones
    MOU_ZONES.forEach(m =>
      L.polygon(m.coords.map(c => [c[0], c[1]]), { color: m.color, fillColor: m.color, fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' })
        .bindTooltip(m.name, { className: 'gis-tt' }).addTo(lm)
    );

    // Vessel markers
    vessels.current.forEach(v => addVesselMarker(v, lv));

    // Company markers
    GIS_COMPANIES.forEach(co => {
      const icon = buildCompanyIcon(false);
      const m = L.marker([co.lat, co.lon], { icon });
      m.bindTooltip(`<b>🏢 ${co.name}</b><br>${co.type} · ${co.country}`, { className: 'gis-tt' });
      m.on('click', e => { L.DomEvent.stopPropagation(e); handleSelectCompany(co.id); });
      // Don't add to map by default — shown when tab = companies
      coMarkersR.current[co.id] = m;
    });

    // Coordinate readout
    map.on('mousemove', e => setCoords({ lat: e.latlng.lat.toFixed(4), lon: e.latlng.lng.toFixed(4) }));

    // Map click: draw OR deselect
    map.on('click', e => {
      if (drawModeRef.current) {
        handleDrawClick(e.latlng);
      } else {
        setDetailOpen(false);
        setSelId(null);
      }
    });

    map.on('dblclick', e => {
      if (drawModeRef.current) { L.DomEvent.stopPropagation(e); }
    });

    setTimeout(() => showToast('🚨 AIS Alert: MT NORTHERN GHOST — 23-day signal blackout detected (Baltic Sea)', 6000), 3500);

    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
      map.remove();
      mapInst.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  // ── Entity tab effect — show/hide marker groups, update opacity ───────────
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;

    // Vessel markers
    Object.values(markerRefs.current).forEach(m => {
      const el = m.getElement();
      if (el) el.style.opacity = entityTab === 'vessels' ? '1' : '0.25';
    });

    // Port markers — always added to lp, just dim when not on ports tab
    Object.values(portMarkersR.current).forEach(m => {
      const el = m.getElement();
      if (el) el.style.opacity = entityTab === 'ports' ? '1' : (entityTab === 'vessels' ? '0.6' : '0.2');
    });

    // Company markers — add/remove from map
    GIS_COMPANIES.forEach(co => {
      const m = coMarkersR.current[co.id];
      if (!m) return;
      if (entityTab === 'companies') {
        if (!map.hasLayer(m)) m.addTo(map);
        const el = m.getElement();
        if (el) el.style.opacity = '1';
      } else {
        if (map.hasLayer(m)) map.removeLayer(m);
      }
    });
  }, [entityTab]);

  // ── Vessel marker helper ──────────────────────────────────────────────────
  function addVesselMarker(v, layer) {
    const icon = buildVesselIcon(v, false);
    const m    = L.marker([v.lat, v.lon], { icon });
    m.bindTooltip(
      `<b>${v.name}</b><br>IMO ${v.imo} &middot; MMSI ${v.mmsi}<br>${v.flagN} &middot; ${v.type}<br>` +
      `${v.status}${v.spd > 0 ? ` &middot; <b>${v.spd} kts</b> &middot; ${v.hdg}° ${hdgToCompass(v.hdg)}` : ''}` +
      `${v.dest ? `<br>&#8594; ${v.dest}` : ''}`,
      { className: 'gis-tt', sticky: true }
    );
    m.on('click', e => { L.DomEvent.stopPropagation(e); handleSelectVessel(v.id); });
    m.addTo(layer);
    markerRefs.current[v.id] = m;
  }

  // ── Selection handlers ────────────────────────────────────────────────────
  function handleSelectVessel(id) {
    const v = vessels.current.find(x => x.id === id);
    if (!v || !mapInst.current) return;
    if (selId && selId !== id && markerRefs.current[selId]) {
      const prev = vessels.current.find(x => x.id === selId);
      if (prev) markerRefs.current[selId].setIcon(buildVesselIcon(prev, false));
    }
    // Also reset port/company selection icon
    if (selEntity && selEntity._type === 'port' && portMarkersR.current[selEntity.id]) {
      portMarkersR.current[selEntity.id].setIcon(buildPortIcon(selEntity.size, false));
    }
    if (selEntity && selEntity._type === 'company' && coMarkersR.current[selEntity.id]) {
      coMarkersR.current[selEntity.id].setIcon(buildCompanyIcon(false));
    }
    setEntityTab('vessels');
    setSelId(id);
    setSelEntity({ ...v, _type: 'vessel' });
    setDetailOpen(true);
    setPathShowing(false);
    setPathStats(null);
    pathLayerRef.current?.clearLayers();
    markerRefs.current[id]?.setIcon(buildVesselIcon(v, true));
    mapInst.current.setView([v.lat, v.lon], 6, { animate: true });
    showToast(`${v.name} &nbsp;·&nbsp; ${v.status}${v.spd > 0 ? ` · ${v.spd} kts · →${v.dest}` : ''}`);
  }

  function handleSelectPort(id) {
    const p = GIS_PORTS.find(x => x.id === id);
    if (!p) return;
    // Reset previously selected
    if (selEntity && selEntity._type === 'vessel' && markerRefs.current[selEntity.id]) {
      const pv = vessels.current.find(x => x.id === selEntity.id);
      if (pv) markerRefs.current[selEntity.id].setIcon(buildVesselIcon(pv, false));
    }
    if (selEntity && selEntity._type === 'port' && portMarkersR.current[selEntity.id]) {
      portMarkersR.current[selEntity.id].setIcon(buildPortIcon(selEntity.size, false));
    }
    if (selEntity && selEntity._type === 'company' && coMarkersR.current[selEntity.id]) {
      coMarkersR.current[selEntity.id].setIcon(buildCompanyIcon(false));
    }
    portMarkersR.current[id]?.setIcon(buildPortIcon(p.size, true));
    setEntityTab('ports');
    setSelId(id);
    setSelEntity({ ...p, _type: 'port' });
    setDetailOpen(true);
    pathLayerRef.current?.clearLayers();
    setPathShowing(false);
    setPathStats(null);
    mapInst.current?.setView([p.lat, p.lon], 8, { animate: true });
    showToast(`⚓ ${p.n} · ${p.country} · ${p.locode}`);
  }

  function handleSelectCompany(id) {
    const co = GIS_COMPANIES.find(x => x.id === id);
    if (!co) return;
    if (selEntity && selEntity._type === 'vessel' && markerRefs.current[selEntity.id]) {
      const pv = vessels.current.find(x => x.id === selEntity.id);
      if (pv) markerRefs.current[selEntity.id].setIcon(buildVesselIcon(pv, false));
    }
    if (selEntity && selEntity._type === 'port' && portMarkersR.current[selEntity.id]) {
      portMarkersR.current[selEntity.id].setIcon(buildPortIcon(selEntity.size, false));
    }
    if (selEntity && selEntity._type === 'company' && coMarkersR.current[selEntity.id]) {
      coMarkersR.current[selEntity.id].setIcon(buildCompanyIcon(false));
    }
    coMarkersR.current[id]?.setIcon(buildCompanyIcon(true));
    setEntityTab('companies');
    setSelId(id);
    setSelEntity({ ...co, _type: 'company' });
    setDetailOpen(true);
    pathLayerRef.current?.clearLayers();
    setPathShowing(false);
    setPathStats(null);
    mapInst.current?.setView([co.lat, co.lon], 5, { animate: true });
    showToast(`🏢 ${co.name} · ${co.type} · ${co.country}`);
  }

  function closeDetail() {
    if (selEntity && selEntity._type === 'vessel' && markerRefs.current[selEntity.id]) {
      const v = vessels.current.find(x => x.id === selEntity.id);
      if (v) markerRefs.current[selEntity.id].setIcon(buildVesselIcon(v, false));
    }
    if (selEntity && selEntity._type === 'port' && portMarkersR.current[selEntity.id]) {
      portMarkersR.current[selEntity.id].setIcon(buildPortIcon(selEntity.size, false));
    }
    if (selEntity && selEntity._type === 'company' && coMarkersR.current[selEntity.id]) {
      coMarkersR.current[selEntity.id].setIcon(buildCompanyIcon(false));
    }
    setDetailOpen(false);
    setSelId(null);
    setSelEntity(null);
    handleClearPath();
  }

  // ── Path actions ──────────────────────────────────────────────────────────
  function handleShowPath() {
    if (!selEntity || selEntity._type !== 'vessel') return;
    const v = selEntity;
    const pts = generatePath(v, pathFrom, pathTo);
    if (pts.length < 2) { showToast('No path data for this date range'); return; }
    const col = STATUS_COLOR[v.status] || '#60a5fa';
    renderPath(pathLayerRef.current, pts, col);
    let totalNm = 0;
    for (let i = 1; i < pts.length; i++) {
      const dlat = (pts[i].lat - pts[i-1].lat) * 60;
      const dlon = (pts[i].lon - pts[i-1].lon) * 60 * Math.cos(pts[i].lat * Math.PI / 180);
      totalNm += Math.sqrt(dlat * dlat + dlon * dlon);
    }
    const totalHours = Math.max((new Date(pathTo) - new Date(pathFrom)) / 3_600_000, 1);
    const days = Math.round((new Date(pathTo) - new Date(pathFrom)) / 86_400_000);
    setPathStats({ distNm: Math.round(totalNm), avgSpd: (totalNm / totalHours).toFixed(1), days });
    setPathShowing(true);
    try { mapInst.current?.fitBounds(pts.map(p => [p.lat, p.lon]), { padding: [60, 60] }); } catch (_) {}
  }

  function handleClearPath() {
    pathLayerRef.current?.clearLayers();
    setPathShowing(false);
    setPathStats(null);
  }

  // ── Draw implementation ───────────────────────────────────────────────────
  function startDraw(mode) {
    drawModeRef.current = mode;
    drawPtsRef.current  = [];
    setDrawMode(mode);
    setDrawPtCount(0);
    setDrawnShape(null);
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
    if (drawPreviewR.current) { drawPreviewR.current = null; }
    if (mapInst.current) {
      mapInst.current.getContainer().style.cursor = 'crosshair';
      mapInst.current.doubleClickZoom.disable();
    }
    showToast(`Draw mode: ${mode}. Click on map to start.`);
  }

  function cancelDraw() {
    drawModeRef.current = null;
    drawPtsRef.current  = [];
    setDrawMode(null);
    setDrawPtCount(0);
    if (drawLayerRef.current) drawLayerRef.current.clearLayers();
    if (mapInst.current) {
      mapInst.current.getContainer().style.cursor = '';
      mapInst.current.doubleClickZoom.enable();
    }
  }

  function clearDraw() {
    cancelDraw();
    setDrawnShape(null);
  }

  function handleDrawClick(latlng) {
    const mode = drawModeRef.current;
    if (!mode) return;
    const pt = [latlng.lat, latlng.lng];
    drawPtsRef.current.push(pt);
    setDrawPtCount(drawPtsRef.current.length);
    updateDrawPreview();

    // Auto-finish for circle (2pts) and rect (2pts)
    if ((mode === 'circle' || mode === 'rect') && drawPtsRef.current.length >= 2) {
      finishDraw();
    }
  }

  function updateDrawPreview() {
    const mode = drawModeRef.current;
    const pts  = drawPtsRef.current;
    const dl   = drawLayerRef.current;
    if (!dl || pts.length < 1) return;

    dl.clearLayers();

    if (mode === 'polygon' || mode === 'polyline') {
      if (pts.length >= 2) {
        const lineOpts = { color: '#60a5fa', weight: 2, dashArray: '6 4', opacity: 0.85 };
        L.polyline(pts, lineOpts).addTo(dl);
      }
      pts.forEach(p => L.circleMarker(p, { radius: 4, color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 1, weight: 1 }).addTo(dl));
    } else if (mode === 'circle' && pts.length >= 1) {
      L.circleMarker(pts[0], { radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 1 }).addTo(dl);
      if (pts.length === 2) {
        const dlat = (pts[1][0] - pts[0][0]) * 60;
        const dlon = (pts[1][1] - pts[0][1]) * 60 * Math.cos(pts[0][0] * Math.PI / 180);
        const r = Math.sqrt(dlat*dlat + dlon*dlon);
        L.circle(pts[0], { radius: r * 1852, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, weight: 2 }).addTo(dl);
      }
    } else if (mode === 'rect' && pts.length >= 1) {
      L.circleMarker(pts[0], { radius: 4, color: '#a855f7', fillColor: '#a855f7', fillOpacity: 1, weight: 1 }).addTo(dl);
      if (pts.length === 2) {
        const [lat1, lon1] = pts[0];
        const [lat2, lon2] = pts[1];
        L.rectangle([[Math.min(lat1,lat2), Math.min(lon1,lon2)], [Math.max(lat1,lat2), Math.max(lon1,lon2)]], {
          color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.1, weight: 2
        }).addTo(dl);
      }
    }
  }

  function finishDraw() {
    const mode = drawModeRef.current;
    const pts  = [...drawPtsRef.current];
    if (!mode || pts.length < (mode === 'circle' || mode === 'rect' ? 2 : 2)) {
      showToast('Not enough points to finish shape');
      return;
    }

    let geojson = null;
    let shapeInfo = {};
    let polyPts = null;    // for containment test
    let circleCenter = null;
    let circleRadiusNm = 0;

    drawLayerRef.current.clearLayers();

    if (mode === 'polygon') {
      const closed = [...pts, pts[0]];
      polyPts = pts;
      const area = computePolygonAreaNm2(pts);
      geojson = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [closed.map(p => [p[1], p[0]])] }, properties: { type: 'polygon', area_nm2: area } };
      shapeInfo = { type: 'Polygon', dims: `Area: ${area.toFixed(1)} nm²`, vertices: pts.length };
      L.polygon(pts, { color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.12, weight: 2 }).addTo(drawLayerRef.current);
    } else if (mode === 'polyline') {
      const len = computePolylineLengthNm(pts);
      geojson = { type: 'Feature', geometry: { type: 'LineString', coordinates: pts.map(p => [p[1], p[0]]) }, properties: { type: 'polyline', length_nm: len } };
      shapeInfo = { type: 'Polyline', dims: `Length: ${len.toFixed(1)} nm`, points: pts.length };
      L.polyline(pts, { color: '#4ade80', weight: 2.5, opacity: 0.9 }).addTo(drawLayerRef.current);
    } else if (mode === 'circle') {
      const dlat = (pts[1][0] - pts[0][0]) * 60;
      const dlon = (pts[1][1] - pts[0][1]) * 60 * Math.cos(pts[0][0] * Math.PI / 180);
      circleRadiusNm = Math.sqrt(dlat*dlat + dlon*dlon);
      circleCenter = pts[0];
      const rMeters = circleRadiusNm * 1852;
      geojson = { type: 'Feature', geometry: { type: 'Point', coordinates: [pts[0][1], pts[0][0]] }, properties: { type: 'circle', radius_nm: circleRadiusNm, radius_m: rMeters } };
      shapeInfo = { type: 'Circle', dims: `Radius: ${circleRadiusNm.toFixed(1)} nm` };
      L.circle(pts[0], { radius: rMeters, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, weight: 2 }).addTo(drawLayerRef.current);
    } else if (mode === 'rect') {
      const [lat1, lon1] = pts[0];
      const [lat2, lon2] = pts[1];
      const minLat = Math.min(lat1,lat2), maxLat = Math.max(lat1,lat2);
      const minLon = Math.min(lon1,lon2), maxLon = Math.max(lon1,lon2);
      polyPts = [[minLat,minLon],[maxLat,minLon],[maxLat,maxLon],[minLat,maxLon]];
      const area = computePolygonAreaNm2(polyPts);
      geojson = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...polyPts, polyPts[0]].map(p => [p[1],p[0]])] }, properties: { type: 'rectangle', area_nm2: area } };
      shapeInfo = { type: 'Rectangle', dims: `Area: ${area.toFixed(1)} nm²` };
      L.rectangle([[minLat,minLon],[maxLat,maxLon]], { color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.1, weight: 2 }).addTo(drawLayerRef.current);
    }

    // Containment analysis
    let vesselsInside = [];
    let portsInside   = [];

    vessels.current.forEach(v => {
      let inside = false;
      if (polyPts) inside = ptInPoly([v.lat, v.lon], polyPts);
      else if (circleCenter) inside = ptInCircle([v.lat, v.lon], circleCenter, circleRadiusNm);
      if (inside) vesselsInside.push(v);
    });

    GIS_PORTS.forEach(p => {
      let inside = false;
      if (polyPts) inside = ptInPoly([p.lat, p.lon], polyPts);
      else if (circleCenter) inside = ptInCircle([p.lat, p.lon], circleCenter, circleRadiusNm);
      if (inside) portsInside.push(p);
    });

    setDrawnShape({ geojson, shapeInfo, vesselsInside, portsInside, mode });

    // Reset draw state
    drawModeRef.current = null;
    drawPtsRef.current  = [];
    setDrawMode(null);
    setDrawPtCount(0);
    if (mapInst.current) {
      mapInst.current.getContainer().style.cursor = '';
      mapInst.current.doubleClickZoom.enable();
    }
    showToast(`Shape drawn. ${vesselsInside.length} vessels, ${portsInside.length} ports inside.`);
  }

  // ── Layer / tile effects ──────────────────────────────────────────────────
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

  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    Object.entries(tileRefs.current).forEach(([k, t]) => {
      if (k === tile) { if (!map.hasLayer(t)) t.addTo(map); }
      else { if (map.hasLayer(t)) map.removeLayer(t); }
    });
  }, [tile]);

  // ── Event handlers ────────────────────────────────────────────────────────
  function toggleLayer(key) { setLayers(p => ({ ...p, [key]: !p[key] })); }

  function handleSearch(q) {
    setSrch(q);
    if (!q.trim()) return;
    const v = vessels.current.find(x =>
      x.name.toLowerCase().includes(q.toLowerCase()) || x.imo.includes(q) || x.mmsi.includes(q)
    );
    const p = !v && GIS_PORTS.find(x => x.n.toLowerCase().includes(q.toLowerCase()) || x.locode.includes(q.toUpperCase()));
    if (v) handleSelectVessel(v.id);
    else if (p) handleSelectPort(p.id);
  }

  function toggleSim() {
    if (simRunning) {
      clearInterval(simInterval.current);
      simInterval.current = null;
      setSimRunning(false);
      showToast('AIS simulation stopped');
    } else {
      setSimRunning(true);
      showToast('AIS position simulation running…');
      simInterval.current = setInterval(() => {
        vessels.current.forEach(v => {
          if (v.status !== 'Underway') return;
          const angle = v.hdg * Math.PI / 180;
          const dt = 0.00018;
          v.lat += dt * Math.cos(angle) * (v.spd / 10);
          v.lon += dt * Math.sin(angle) * (v.spd / 10) / Math.cos(v.lat * Math.PI / 180);
          v.hdg  = (v.hdg + (Math.random() - 0.5) * 1.5 + 360) % 360;
          if (markerRefs.current[v.id]) {
            markerRefs.current[v.id].setLatLng([v.lat, v.lon]);
            markerRefs.current[v.id].setIcon(buildVesselIcon(v, v.id === selId));
          }
        });
        setSelEntity(prev => {
          if (!prev || prev._type !== 'vessel') return prev;
          const v = vessels.current.find(x => x.id === prev.id);
          return v && v.status === 'Underway' ? { ...v, _type: 'vessel' } : prev;
        });
      }, 800);
    }
  }

  function applyPreset(days) {
    setPathFrom(new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10));
    setPathTo(today);
  }

  // ── Filtered lists ────────────────────────────────────────────────────────
  const adaptedVessels = useMemo(() => VESSELS.map(v => ({
    id: v.id, nm: v.name, imo: v.imo, mmsi: v.mmsi,
    ty: v.type, fn: v.flagN, flag: v.fl, st: v.status,
    dwt: v.dwt, ow: v.owner, spd: v.spd,
  })), []);

  const filteredVessels = useMemo(() => {
    const base = gisFilters.length ? applyFilters(adaptedVessels, gisFilters) : adaptedVessels;
    const ids  = new Set(base.map(a => a.id));
    return vessels.current.filter(v => {
      if (!ids.has(v.id)) return false;
      if (sbSrch && !v.name.toLowerCase().includes(sbSrch.toLowerCase()) && !v.imo.includes(sbSrch)) return false;
      return true;
    });
  }, [adaptedVessels, gisFilters, sbSrch]);

  const filteredPorts = useMemo(() =>
    GIS_PORTS.filter(p => {
      if (sbSrch && !p.n.toLowerCase().includes(sbSrch.toLowerCase()) && !p.locode.includes(sbSrch.toUpperCase())) return false;
      if (typeFilter && typeFilter !== 'All Sizes' && p.size !== typeFilter) return false;
      return true;
    }), [sbSrch, typeFilter]
  );

  const filteredCompanies = useMemo(() =>
    GIS_COMPANIES.filter(co => {
      if (sbSrch && !co.name.toLowerCase().includes(sbSrch.toLowerCase())) return false;
      if (typeFilter && typeFilter !== 'All Types' && co.type !== typeFilter) return false;
      return true;
    }), [sbSrch, typeFilter]
  );

  const counts = useMemo(() => ({
    underway: VESSELS.filter(v => v.status === 'Underway').length,
    anchor:   VESSELS.filter(v => v.status === 'At Anchor').length,
    port:     VESSELS.filter(v => v.status === 'In Port').length,
    dark:     VESSELS.filter(v => v.status === 'AIS Dark').length,
  }), []);

  const typeOpts = entityTab === 'vessels' ? VESSEL_TYPES : entityTab === 'ports' ? PORT_SIZES : CO_TYPES;
  const showCount = entityTab === 'vessels' ? filteredVessels.length : entityTab === 'ports' ? filteredPorts.length : filteredCompanies.length;
  const totalCount = entityTab === 'vessels' ? VESSELS.length : entityTab === 'ports' ? GIS_PORTS.length : GIS_COMPANIES.length;
  const entityLabel = entityTab === 'vessels' ? 'vessels' : entityTab === 'ports' ? 'ports' : 'companies';

  // Show the sidebar list only when a filter has been actively applied
  const vesselFilterActive = gisFilters.some(f =>
    (f.type === 'multiselect' && f.values?.length > 0) ||
    (f.type === 'range'       && (f.min != null || f.max != null)) ||
    (f.type === 'typeahead'   && (f.values?.length > 0 || f.query?.trim()))
  ) || sbSrch.trim().length > 0;
  const listFilterActive = entityTab === 'vessels'
    ? vesselFilterActive
    : (sbSrch.trim().length > 0 || !!typeFilter);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="gisRoot">

      {/* ── Row 1: sBar — sidebar toggle + entity tabs + search + layer toggles + map + sim + draw ── */}
      <div className="sBar" style={{ gap: 6, flexWrap: 'wrap', padding: '8px 16px' }}>

        {/* Sidebar toggle */}
        <button className="gisSideToggle" onClick={() => setSideOpen(p => !p)} title={sideOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          {sideOpen ? '☰✕' : '☰'}
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--bd)', flexShrink: 0 }} />

        {/* Entity tabs */}
        <div className="gisEntityTabs">
          {ENTITY_TABS.map(t => (
            <button
              key={t.key}
              className={`gisEntityTab${entityTab === t.key ? ' on' : ''}`}
              onClick={() => { setEntityTab(t.key); setSbSrch(''); setTypeFilter(''); }}
            >{t.ic} {t.label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--bd)', flexShrink: 0 }} />

        {/* Search */}
        <div className="siWrap" style={{ maxWidth: 240 }}>
          <span className="siIc">🔍</span>
          <input
            className="si"
            value={srch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search vessel, port, IMO…"
          />
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--bd)', flexShrink: 0 }} />

        {/* Layer toggles */}
        <span className="gisCtrLbl">Layers</span>
        {[
          { key:'vessels', ic:'🚢', lbl:'Vessels'     },
          { key:'routes',  ic:'🛤', lbl:'Routes'      },
          { key:'ports',   ic:'⚓', lbl:'Ports'       },
          { key:'choke',   ic:'⛔', lbl:'Chokepoints' },
          { key:'mou',     ic:'🗺', lbl:'MOU Zones'   },
        ].map(l => (
          <button
            key={l.key}
            className={`gisLayerBtn${layers[l.key] ? ' on' : ''}`}
            onClick={() => toggleLayer(l.key)}
          >{l.ic} {l.lbl}</button>
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--bd)', flexShrink: 0 }} />

        {/* Map tile selector */}
        <span className="gisCtrLbl">Map</span>
        <select className="fSel" value={tile} onChange={e => setTile(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="satellite">Satellite</option>
        </select>

        <div style={{ width: 1, height: 20, background: 'var(--bd)', flexShrink: 0 }} />

        {/* Sim */}
        <button
          className={`btn btnSm${simRunning ? ' btnP' : ' btnS'}`}
          onClick={toggleSim}
        >{simRunning ? '⏹ Stop Sim' : '▶ Simulate'}</button>

        {/* Draw button */}
        <button
          className={`btn btnSm${drawMode ? ' btnP' : ' btnS'}`}
          onClick={() => drawMode ? cancelDraw() : startDraw('polygon')}
        >✏ {drawMode ? 'Cancel Draw' : 'Draw'}</button>
      </div>

      {/* ── Row 2: FilterBuilder (vessels) / type filter (ports, companies) ─── */}
      <div className="fbBarWrap" style={{ padding: entityTab === 'vessels' ? 0 : '6px 16px', gap: 8 }}>
        {entityTab === 'vessels' && (
          <FilterBuilder filters={gisFilters} onChange={setGisFilters} vessels={adaptedVessels} />
        )}
        {entityTab !== 'vessels' && (
          <>
            <select className="fSel" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {typeOpts.map(o => <option key={o} value={o === typeOpts[0] ? '' : o}>{o}</option>)}
            </select>
            {listFilterActive && (
              <span style={{ fontSize: 11, color: 'var(--txt3)', flexShrink: 0 }}>
                <strong style={{ color: 'var(--txt)' }}>{showCount}</strong> of {totalCount} {entityLabel} matched
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8102e', animation: 'gisPulse 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#c8102e', letterSpacing: '.4px' }}>LIVE AIS</span>
            </div>
          </>
        )}
      </div>

      {/* ── Body: light sidebar + map ────────────────────────────────────────── */}
      <div className="gisBody">

        {/* ── Left Sidebar (light panel) ───────────────────────────────────── */}
        <div className={`gisSidebar${sideOpen ? '' : ' closed'}`}>
          <div className="gisSideHead">
            <div className="gisSideTitleRow">
              <div className="gisSideTitle">
                {ENTITY_TABS.find(t => t.key === entityTab)?.ic} {ENTITY_TABS.find(t => t.key === entityTab)?.label}
                <span className="gisSideCount">{totalCount} tracked</span>
              </div>
              <button className="gisSideToggle" onClick={() => setSideOpen(p => !p)} title={sideOpen ? 'Collapse' : 'Expand'}>
                {sideOpen ? '◀' : '▶'}
              </button>
            </div>
            <input
              className="gisSideSearch"
              value={sbSrch}
              onChange={e => setSbSrch(e.target.value)}
              placeholder={`Filter ${entityLabel}…`}
            />
          </div>
          <div className="gisSideList">
            {!listFilterActive ? (
              /* ── No filter applied: prompt user ───────────────────── */
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10, opacity: .35 }}>🔍</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', marginBottom: 6 }}>
                  No filter applied
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', lineHeight: 1.65 }}>
                  All {entityLabel} are shown on the map.<br />
                  Apply a filter above to search and list results here.
                </div>
              </div>
            ) : (
              <>
                {/* VESSELS */}
                {entityTab === 'vessels' && filteredVessels.map(v => {
                  const col = STATUS_COLOR[v.status] || '#888';
                  return (
                    <div key={v.id} className={`gisVesRow${selId === v.id ? ' sel' : ''}`} onClick={() => handleSelectVessel(v.id)}>
                      <div className="gisVesRowDot" style={{ background: col }} />
                      <div className="gisVesRowBody">
                        <div className="gisVesRowName">
                          <span className="gisVesRowNameTxt">{v.name}</span>
                          {v.status === 'AIS Dark' && <span className="gisVesDarkBadge">DARK</span>}
                        </div>
                        <div className="gisVesRowMeta">
                          <span className="mono" style={{ fontSize: 9 }}>{v.imo}</span>
                          <span>{v.type}</span>
                          {v.spd > 0 && <span className="gisVesSpd" style={{ color: col }}>{v.spd} kts</span>}
                        </div>
                        {v.dest && <div className="gisVesDest">→ {v.dest}{v.eta && v.eta !== '—' ? ` · ETA ${v.eta.replace('2025-','')}` : ''}</div>}
                      </div>
                    </div>
                  );
                })}
                {entityTab === 'vessels' && filteredVessels.length === 0 && (
                  <div className="gisSideEmpty">No vessels match filters</div>
                )}

                {/* PORTS */}
                {entityTab === 'ports' && filteredPorts.map(p => (
                  <div key={p.id} className={`gisVesRow${selId === p.id ? ' sel' : ''}`} onClick={() => handleSelectPort(p.id)}>
                    <div style={{ fontSize: 14, flexShrink: 0 }}>⚓</div>
                    <div className="gisVesRowBody">
                      <div className="gisVesRowName"><span className="gisVesRowNameTxt">{p.n}</span></div>
                      <div className="gisVesRowMeta">
                        <span>{p.country}</span>
                        <span className="mono" style={{ fontSize: 9 }}>{p.locode}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: p.size === 'mega' ? '#d97706' : p.size === 'large' ? '#2563eb' : '#64748b' }}>{p.size}</span>
                      </div>
                      <div className="gisVesDest">{p.teu} · {p.calls.toLocaleString()} calls/yr</div>
                    </div>
                  </div>
                ))}
                {entityTab === 'ports' && filteredPorts.length === 0 && (
                  <div className="gisSideEmpty">No ports match filters</div>
                )}

                {/* COMPANIES */}
                {entityTab === 'companies' && filteredCompanies.map(co => (
                  <div key={co.id} className={`gisVesRow${selId === co.id ? ' sel' : ''}`} onClick={() => handleSelectCompany(co.id)}>
                    <div style={{ fontSize: 14, flexShrink: 0 }}>🏢</div>
                    <div className="gisVesRowBody">
                      <div className="gisVesRowName"><span className="gisVesRowNameTxt">{co.name}</span></div>
                      <div className="gisVesRowMeta">
                        <span>{co.type}</span>
                        <span>{co.country}</span>
                      </div>
                      <div className="gisVesDest">{co.fleet} · {co.vessels > 0 ? `${co.vessels} vessels` : 'Charterer'}</div>
                    </div>
                  </div>
                ))}
                {entityTab === 'companies' && filteredCompanies.length === 0 && (
                  <div className="gisSideEmpty">No companies match filters</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Map Area ────────────────────────────────────────────────────────── */}
        <div className="gisMapArea">
          <div ref={mapRef} className="gisMapCanvas" />

        {/* ── Draw mode indicator ──────────────────────────────────────────── */}
        {drawMode && (
          <div className="gisDrawMode">
            ✏ {drawMode.charAt(0).toUpperCase() + drawMode.slice(1)} mode
            {drawPtCount > 0 && <span style={{ marginLeft: 6, opacity: .7 }}>{drawPtCount} pt{drawPtCount !== 1 ? 's' : ''}</span>}
          </div>
        )}

        {/* ── Floating Draw Toolbar ────────────────────────────────────────── */}
        {drawMode && (
          <div className="gisDrawTb">
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Draw</div>
            {[
              { m:'polygon',  ic:'⬡', lbl:'Polygon'   },
              { m:'polyline', ic:'━', lbl:'Polyline'   },
              { m:'circle',   ic:'⊙', lbl:'Circle'    },
              { m:'rect',     ic:'▭', lbl:'Rectangle' },
            ].map(d => (
              <button
                key={d.m}
                className={`gisDrawBtn${drawMode === d.m ? ' on' : ''}`}
                onClick={() => startDraw(d.m)}
              >{d.ic} {d.lbl}</button>
            ))}
            <div style={{ height: 1, background: 'var(--bd)', margin: '6px 0' }} />
            {drawPtCount >= 2 && (
              <button className="gisDrawBtn finish" onClick={finishDraw}>✓ Finish</button>
            )}
            <button className="gisDrawBtn clear" onClick={clearDraw}>✕ Clear</button>
          </div>
        )}

        {/* Draw toolbar button when not in draw mode — triggers entering draw mode */}
        {!drawMode && drawnShape && (
          <div className="gisDrawTb" style={{ top: 'auto', bottom: 80 }}>
            <button className="gisDrawBtn clear" onClick={() => { setDrawnShape(null); drawLayerRef.current?.clearLayers(); }}>✕ Clear Shape</button>
          </div>
        )}

        {/* ── GeoJSON Analysis Panel ───────────────────────────────────────── */}
        {drawnShape && (
          <div className="gisAnalysis">
            <div className="gisAnalysisHead">
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>{drawnShape.shapeInfo.type}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{drawnShape.shapeInfo.dims}</div>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 13, padding: 0 }}
                onClick={() => { setDrawnShape(null); drawLayerRef.current?.clearLayers(); }}
              >✕</button>
            </div>
            <div className="gisAnalysisBody">
              {/* Vessels inside */}
              <div className="gisAnalysisStat">
                <span style={{ color: '#16a34a', fontWeight: 700 }}>{drawnShape.vesselsInside.length}</span>
                <span style={{ color: 'var(--txt2)', marginLeft: 4 }}>vessels inside</span>
              </div>
              {drawnShape.vesselsInside.length > 0 && (
                <div className="gisAnalysisVesList">
                  {drawnShape.vesselsInside.map(v => (
                    <div key={v.id} className="gisAnalysisVesRow" onClick={() => handleSelectVessel(v.id)}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[v.status] || '#888', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{v.name}</span>
                      <span style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'monospace', flexShrink: 0 }}>{v.imo}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ports inside */}
              <div className="gisAnalysisStat" style={{ marginTop: 6 }}>
                <span style={{ color: '#d97706', fontWeight: 700 }}>{drawnShape.portsInside.length}</span>
                <span style={{ color: 'var(--txt2)', marginLeft: 4 }}>ports inside</span>
              </div>
              {drawnShape.portsInside.length > 0 && (
                <div className="gisAnalysisVesList">
                  {drawnShape.portsInside.map(p => (
                    <div key={p.id} className="gisAnalysisVesRow" onClick={() => handleSelectPort(p.id)}>
                      <span style={{ fontSize: 10 }}>⚓</span>
                      <span style={{ flex: 1, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.n}</span>
                      <span style={{ fontSize: 9, color: 'var(--txt3)', flexShrink: 0 }}>{p.country}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* GeoJSON block */}
              <div className="gisAnalysisGeoJSON">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>GeoJSON</span>
                  <button
                    style={{ fontSize: 9, padding: '2px 7px', border: '1px solid var(--bd)', borderRadius: 3, background: 'var(--bg3)', color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => { navigator.clipboard?.writeText(JSON.stringify(drawnShape.geojson, null, 2)); showToast('GeoJSON copied to clipboard'); }}
                  >Copy</button>
                </div>
                <pre className="gisAnalysisCode">{JSON.stringify(drawnShape.geojson, null, 2).slice(0, 400)}{JSON.stringify(drawnShape.geojson, null, 2).length > 400 ? '…' : ''}</pre>
              </div>

              {/* Export */}
              <button
                style={{ width: '100%', marginTop: 8, padding: '6px 0', fontSize: 10, fontWeight: 700, borderRadius: 4, border: '1px solid #93c5fd', background: '#e8f0fe', color: '#1a56db', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => exportGeoJSON(drawnShape.geojson, `maritime-draw-${drawnShape.shapeInfo.type.toLowerCase()}`)}
              >⬇ Export GeoJSON</button>
            </div>
          </div>
        )}

        {/* ── Right Detail Panel ───────────────────────────────────────────── */}
        <div className={`gisDetail${detailOpen ? ' open' : ''}`}>
          <button className="gisDetailClose" onClick={closeDetail} title="Close">✕</button>

          {selEntity && selEntity._type === 'vessel' && (() => {
            const v   = selEntity;
            const col = STATUS_COLOR[v.status] || '#888';
            const aisOk = v.status !== 'AIS Dark';
            return (
              <>
                <div className="gisDetailHead">
                  <div className="gisDetailHdg">
                    <div className="gisDetailDot" style={{ background: col }} />
                    <div className="gisDetailHdgText">
                      <div className="gisDetailName">{v.name}</div>
                      <div className="gisDetailIds">IMO {v.imo} · MMSI {v.mmsi}</div>
                      <div className="gisDetailIds">{v.fl} {v.flagN} · {v.type}</div>
                    </div>
                  </div>
                  <div className={`gisAisBadge${aisOk ? ' ok' : ' dark'}`}>
                    {aisOk ? `🛰 AIS ACTIVE · ${v.spd} kts · ${v.hdg}° ${hdgToCompass(v.hdg)}` : `🌑 AIS SIGNAL LOST · ${v.eta}`}
                  </div>
                </div>
                <div className="gisDetailBody">
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Position &amp; Navigation</div>
                    {[
                      ['Latitude',    fmtLat(v.lat),    'mono'],
                      ['Longitude',   fmtLon(v.lon),    'mono'],
                      ['Speed',       `${v.spd} kts`,   null, '#16a34a'],
                      ['Course',      `${v.hdg}° ${hdgToCompass(v.hdg)}`],
                      ['Destination', v.dest || '—'],
                      ['ETA',         v.eta  || '—'],
                      ['Status',      v.status, null, col],
                    ].map(([lbl, val, cls, vc]) => (
                      <div key={lbl} className="gisDetailRow">
                        <span className="gisDetailRowLbl">{lbl}</span>
                        <span className={`gisDetailRowVal${cls ? ' ' + cls : ''}`} style={vc ? { color: vc, fontWeight: 600 } : {}}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Vessel Details</div>
                    {[
                      ['DWT',   `${v.dwt.toLocaleString()} MT`],
                      ['Owner', v.owner],
                      ['Cargo', v.cargo || '—'],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="gisDetailRow">
                        <span className="gisDetailRowLbl">{lbl}</span>
                        <span className="gisDetailRowVal">{val}</span>
                      </div>
                    ))}
                  </div>
                  {/* Path History */}
                  <div className="gisDetailSect gisPathSect">
                    <div className="gisDetailSectHd">Vessel Path History</div>
                    <div className="gisPathDateRow">
                      <div className="gisPathDateGrp">
                        <label className="gisPathLbl">From</label>
                        <input type="date" className="gisPathDate" value={pathFrom} max={pathTo}
                          onChange={e => { setPathFrom(e.target.value); if (pathShowing) handleClearPath(); }} />
                      </div>
                      <div className="gisPathDateGrp">
                        <label className="gisPathLbl">To</label>
                        <input type="date" className="gisPathDate" value={pathTo} min={pathFrom} max={today}
                          onChange={e => { setPathTo(e.target.value); if (pathShowing) handleClearPath(); }} />
                      </div>
                    </div>
                    <div className="gisPathPresets">
                      {[['24h',1],['3d',3],['7d',7],['14d',14],['30d',30]].map(([lbl, days]) => (
                        <button key={lbl} className="gisPathPreset"
                          onClick={() => { applyPreset(days); if (pathShowing) handleClearPath(); }}>{lbl}</button>
                      ))}
                    </div>
                    <div className="gisPathActions">
                      <button
                        className={`gisPathShowBtn${pathShowing ? ' showing' : ''}`}
                        onClick={pathShowing ? handleClearPath : handleShowPath}
                      >{pathShowing ? '✕ Clear Path' : '🛤 Show Path'}</button>
                      {pathShowing && (
                        <button className="gisPathShowBtn"
                          style={{ background: '#e8f0fe', borderColor: '#93c5fd', color: '#1a56db' }}
                          onClick={() => { handleClearPath(); setTimeout(handleShowPath, 50); }}>↺ Refresh</button>
                      )}
                    </div>
                    {pathStats && (
                      <div className="gisPathStats">
                        {[
                          { v: pathStats.distNm.toLocaleString(), l: 'nm sailed' },
                          { v: pathStats.avgSpd,                   l: 'avg kts'  },
                          { v: pathStats.days,                     l: 'days'     },
                        ].map(s => (
                          <div key={s.l} className="gisPathStat">
                            <div className="gisPathStatV">{s.v}</div>
                            <div className="gisPathStatL">{s.l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Quick Links</div>
                    <div className="gisDetailLinks">
                      <button className="gisDetailLink primary" onClick={() => navigate(`/vessels?imo=${v.imo}`)}>📋 Full Profile</button>
                      <button className="gisDetailLink">🚨 Sanctions</button>
                      <button className="gisDetailLink">📊 Voyage History</button>
                      {v.status === 'AIS Dark' && (
                        <button className="gisDetailLink danger" onClick={() => showToast(`AIS Dark Alert raised for ${v.name}`)}>⚠️ Raise Alert</button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {selEntity && selEntity._type === 'port' && (() => {
            const p = selEntity;
            return (
              <>
                <div className="gisDetailHead">
                  <div className="gisDetailHdg">
                    <div style={{ fontSize: 22, flexShrink: 0 }}>⚓</div>
                    <div className="gisDetailHdgText">
                      <div className="gisDetailName">{p.n}</div>
                      <div className="gisDetailIds">{p.locode} · {p.country}</div>
                      <div className="gisDetailIds" style={{ color: p.size === 'mega' ? '#f59e0b' : '#60a5fa' }}>{p.size.toUpperCase()} PORT</div>
                    </div>
                  </div>
                </div>
                <div className="gisDetailBody">
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Port Info</div>
                    {[
                      ['Name',    p.n],
                      ['LOCODE',  p.locode, 'mono'],
                      ['Country', p.country],
                      ['Size',    p.size],
                    ].map(([lbl, val, cls]) => (
                      <div key={lbl} className="gisDetailRow">
                        <span className="gisDetailRowLbl">{lbl}</span>
                        <span className={`gisDetailRowVal${cls ? ' ' + cls : ''}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Operations</div>
                    {[
                      ['TEU/Year',     p.teu],
                      ['Vessel Calls', p.calls.toLocaleString() + '/yr'],
                      ['Max Draft',    p.draft],
                      ['MOU Region',   p.mou],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="gisDetailRow">
                        <span className="gisDetailRowLbl">{lbl}</span>
                        <span className="gisDetailRowVal">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Location</div>
                    <div className="gisDetailRow">
                      <span className="gisDetailRowLbl">Latitude</span>
                      <span className="gisDetailRowVal mono">{fmtLat(p.lat)}</span>
                    </div>
                    <div className="gisDetailRow">
                      <span className="gisDetailRowLbl">Longitude</span>
                      <span className="gisDetailRowVal mono">{fmtLon(p.lon)}</span>
                    </div>
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Quick Links</div>
                    <div className="gisDetailLinks">
                      <button className="gisDetailLink primary" onClick={() => navigate(`/ports`)}>📋 Port Profile</button>
                      <button className="gisDetailLink">📊 Traffic History</button>
                      <button className="gisDetailLink">🚢 Vessels in Port</button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {selEntity && selEntity._type === 'company' && (() => {
            const co = selEntity;
            return (
              <>
                <div className="gisDetailHead">
                  <div className="gisDetailHdg">
                    <div style={{ fontSize: 22, flexShrink: 0 }}>🏢</div>
                    <div className="gisDetailHdgText">
                      <div className="gisDetailName">{co.name}</div>
                      <div className="gisDetailIds">{co.type}</div>
                      <div className="gisDetailIds">{co.country}</div>
                    </div>
                  </div>
                </div>
                <div className="gisDetailBody">
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Company Info</div>
                    {[
                      ['Name',    co.name],
                      ['Type',    co.type],
                      ['Country', co.country],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="gisDetailRow">
                        <span className="gisDetailRowLbl">{lbl}</span>
                        <span className="gisDetailRowVal">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Fleet Summary</div>
                    {[
                      ['Vessels',   co.vessels > 0 ? co.vessels + ' vessels' : 'Charterer only'],
                      ['Total DWT', co.dwt],
                      ['Fleet Type',co.fleet],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="gisDetailRow">
                        <span className="gisDetailRowLbl">{lbl}</span>
                        <span className="gisDetailRowVal">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">HQ Location</div>
                    <div className="gisDetailRow">
                      <span className="gisDetailRowLbl">Latitude</span>
                      <span className="gisDetailRowVal mono">{fmtLat(co.lat)}</span>
                    </div>
                    <div className="gisDetailRow">
                      <span className="gisDetailRowLbl">Longitude</span>
                      <span className="gisDetailRowVal mono">{fmtLon(co.lon)}</span>
                    </div>
                  </div>
                  <div className="gisDetailSect">
                    <div className="gisDetailSectHd">Quick Links</div>
                    <div className="gisDetailLinks">
                      <button className="gisDetailLink primary" onClick={() => navigate(`/companies`)}>📋 Company Profile</button>
                      <button className="gisDetailLink">🚢 Fleet List</button>
                      <button className="gisDetailLink">🚨 Sanctions Check</button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className={`gisLegend${detailOpen ? ' shifted' : ''}`}>
          <div className="gisLegendTitle">Legend</div>
          {[
            { col:'#4ade80', lbl:'Underway',        ic:'▲' },
            { col:'#60a5fa', lbl:'In Port',          ic:'●' },
            { col:'#fbbf24', lbl:'At Anchor',        ic:'●' },
            { col:'#f87171', lbl:'AIS Dark / Alert', ic:'○' },
            { col:'#f59e0b', lbl:'Port / Terminal',  ic:'◆' },
            { col:'#6200ea', lbl:'Company HQ',       ic:'■' },
            { col:'#ef4444', lbl:'Chokepoint',       ic:'⊕' },
          ].map(l => (
            <div key={l.lbl} className="gisLegendRow">
              <span className="gisLegendIc" style={{ color: l.col }}>{l.ic}</span>
              <span style={{ color: 'var(--txt)' }}>{l.lbl}</span>
            </div>
          ))}
          {layers.mou && (
            <>
              <div className="gisLegendDiv" />
              <div className="gisLegendTitle">MOU Zones</div>
              {MOU_ZONES.map(m => (
                <div key={m.name} className="gisLegendRow">
                  <span className="gisLegendIc" style={{ color: m.color }}>▬</span>
                  <span style={{ color: 'var(--txt2)' }}>{m.name}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Bottom Status Bar ─────────────────────────────────────────────── */}
        <div className="gisStatBar">
          {[
            { v: counts.underway,  l:'Underway',     c:'#4ade80' },
            { v: counts.anchor,    l:'At Anchor',    c:'#fbbf24' },
            { v: counts.port,      l:'In Port',      c:'#60a5fa' },
            { v: counts.dark,      l:'AIS Dark',     c:'#f87171' },
            { v: VESSELS.length,   l:'Total Tracked' },
            { v: clock,            l:'UTC',          c:'#60a5fa', mono:true },
            { v: '1,284',          l:'BDI' },
            { v: '84 WS',          l:'AG/East',      c:'#fbbf24' },
            { v: coords.lat !== '—' ? coords.lat : '· · ·', l:'Cursor Lat', mono:true },
            { v: coords.lon !== '—' ? coords.lon : '· · ·', l:'Cursor Lon', mono:true },
          ].map((s, i) => (
            <div key={i} className="gisStatItem">
              <div className="gisStatV" style={{ color: s.c || 'var(--txt)', fontFamily: s.mono ? 'monospace' : 'inherit' }}>{s.v}</div>
              <div className="gisStatL">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── Toast ─────────────────────────────────────────────────────────── */}
        <div className={`gisToast${toastVis ? ' vis' : ''}${detailOpen ? ' shifted' : ''}`}
          dangerouslySetInnerHTML={{ __html: toast }} />

        </div>{/* /gisMapArea */}
      </div>{/* /gisBody */}

      {/* Leaflet overrides */}
      <style>{`
        .gis-tt{background:#fff;border:1px solid #d1d5db;
          color:#111827;border-radius:4px;font-size:11px;line-height:1.55;
          padding:6px 10px;box-shadow:0 4px 16px rgba(0,0,0,0.12);font-family:inherit}
        .leaflet-tooltip-top.gis-tt::before{border-top-color:#d1d5db!important}
        .leaflet-control-zoom a{background:#fff!important;
          color:#374151!important;border-color:#d1d5db!important;
          transition:all .12s}
        .leaflet-control-zoom a:hover{background:#f3f4f6!important;color:#111827!important}
        .leaflet-control-zoom-in,.leaflet-control-zoom-out{font-size:16px!important}
        @keyframes gisPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.45)}}
      `}</style>

    </div>
  );
}
