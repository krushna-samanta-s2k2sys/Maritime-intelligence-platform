import { useState, useRef, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { usePreferences } from '../../contexts/PreferencesContext'
import { CARD_CATALOG } from '../../data/dashboardCards'
import CardCatalog from './CardCatalog'

// ── Static data ────────────────────────────────────────────
const KPIS = [
  { id:'kpi-fleet',    v:'847,392', l:'Total Vessels',       delta:'+1,243 this month',      up:true,  color:'#1558d6' },
  { id:'kpi-active',   v:'94.3%',   l:'Active Fleet',        delta:'−0.4% vs last month',    up:false, color:'#137333' },
  { id:'kpi-ports',    v:'9,241',   l:'Ports Tracked',       delta:'+18 new ports',           up:true,  color:'#0094b3' },
  { id:'kpi-psc',      v:'283',     l:'PSC Detentions YTD',  delta:'+12 vs same period',      up:false, color:'#c8102e' },
  { id:'kpi-certs',    v:'1,047',   l:'Certs Expiring (30d)',delta:'247 critical (<7d)',       up:false, color:'#b45309' },
  { id:'kpi-sanctions',v:'62',      l:'Active Sanctions',    delta:'+4 new designations',     up:false, color:'#6200ea' },
  { id:'kpi-companies',v:'42,881',  l:'Companies',           delta:'+312 this quarter',       up:true,  color:'#ea580c' },
  { id:'kpi-ais',      v:'94.2B',   l:'AIS Points (total)',  delta:'+1.4B this month',        up:true,  color:'#137333' },
]

const FLEET_TYPES = [
  ['Bulk Carrier',210841,'#1558d6'],['General Cargo',198422,'#0094b3'],['Oil Tanker',96384,'#c8102e'],
  ['Container Ship',55912,'#137333'],['Chemical Tanker',48271,'#b45309'],['Offshore Supply',37885,'#6200ea'],
  ['LNG / LPG Carrier',14022,'#ea580c'],['Passenger / Cruise',11244,'#d93025'],
  ['RoRo / Car Carrier',9812,'#717a85'],['Other',164599,'#aab2bd'],
]

const FLAGS = [
  ['🇵🇦','Panama',91244],['🇱🇷','Liberia',77881],['🇲🇭','Marshall Isls',60129],
  ['🇭🇰','Hong Kong',43887],['🇸🇬','Singapore',36204],['🇧🇸','Bahamas',29441],
  ['🇲🇹','Malta',26882],['🇨🇾','Cyprus',22144],['🇬🇷','Greece',17208],['🇨🇳','China',16844],
]

const CERTS = [
  { icon:'📄', name:'SMC (ISM)',       sub:'Safety Management Certificate',              count:'312 vessels', cls:'tR' },
  { icon:'🛡', name:'ISPS / AISSC',   sub:'International Ship & Port Facility Security', count:'218 vessels', cls:'tR' },
  { icon:'⚓', name:'Load Line Cert', sub:'International Load Line Convention',          count:'197 vessels', cls:'tA' },
  { icon:'🛢', name:'IOPP (MARPOL I)',sub:'Oil Pollution Prevention Certificate',        count:'156 vessels', cls:'tA' },
  { icon:'🌊', name:'BWM Certificate',sub:'Ballast Water Management Convention',         count:'89 vessels',  cls:'tA' },
  { icon:'📊', name:'CII / EEXI',     sub:'Energy Efficiency Existing Ship Index',       count:'75 vessels',  cls:'tN' },
]

const PSC_DATA = [
  { vessel:'OCEAN PRIDE',     imo:'9341122', port:'Port of Rotterdam',   mou:'Paris MOU',    defs:14, date:'2024-01-30', status:'Detained' },
  { vessel:'SUNRISE CARRIER', imo:'9412888', port:'Qingdao, China',      mou:'Tokyo MOU',    defs:8,  date:'2024-01-29', status:'Detained' },
  { vessel:'PIONEER TRADER',  imo:'9499283', port:'Singapore',           mou:'Tokyo MOU',    defs:11, date:'2024-01-28', status:'Released' },
  { vessel:'GULF VOYAGER',    imo:'9412340', port:'Port of Houston',     mou:'USCG',         defs:6,  date:'2024-01-27', status:'Released' },
  { vessel:'NORDIC GRACE',    imo:'9388021', port:'Durban, South Africa',mou:'Indian Ocean', defs:9,  date:'2024-01-25', status:'Released' },
]

const MARKET = [
  { idx:'BDI',  name:'Baltic Dry Index',      val:'2,847',  delta:'+124', up:true,  desc:'General dry bulk sentiment' },
  { idx:'BCI',  name:'Baltic Capesize Index', val:'4,122',  delta:'+88',  up:true,  desc:'Capesize rates (180k+ DWT)' },
  { idx:'BDTI', name:'Baltic Dirty Tanker',   val:'1,284',  delta:'−36',  up:false, desc:'Dirty tanker freight' },
  { idx:'BCTI', name:'Baltic Clean Tanker',   val:'924',    delta:'+12',  up:true,  desc:'Clean product tanker' },
  { idx:'BLNG', name:'Baltic LNG Index',      val:'56,100', delta:'+850', up:true,  desc:'LNG spot rate (USD/day)' },
  { idx:'SCFI', name:'SCFI Composite',        val:'1,881',  delta:'−44',  up:false, desc:'Shanghai Container Freight' },
]

const ACT_POOL = [
  { color:'#c8102e', txt:'PSC detention issued to <strong>OCEAN PRIDE</strong> at Rotterdam — 14 deficiencies' },
  { color:'#c8102e', txt:'Sanctions alert: <strong>IRAN STAR I</strong> identified via dark activity pattern' },
  { color:'#c8102e', txt:'PSC detention issued to <strong>SUNRISE CARRIER</strong> at Qingdao — 8 deficiencies' },
  { color:'#137333', txt:'<strong>MAERSK COLON</strong> arrived at Port of Los Angeles (ATA: 14:32 UTC)' },
  { color:'#137333', txt:'Certificate renewed: SMC for <strong>STELLAR WIND</strong> — valid to 2029-02-01' },
  { color:'#137333', txt:'<strong>MSC OSCAR</strong> departed Singapore — Destination: Rotterdam' },
  { color:'#137333', txt:'<strong>QUEEN MARY 2</strong> departed Southampton — Voyage 2024-Q — Destination: NY' },
  { color:'#1558d6', txt:'AIS position update: <strong>PACIFIC STAR</strong> — 35.2°N 142.5°E — 18.4 kn' },
  { color:'#1558d6', txt:'Ownership transfer filed: <strong>ATLANTIC BULKER</strong> — Star Bulk → Diana Shipping' },
  { color:'#1558d6', txt:'Flag change: <strong>PIONEER TRADER</strong> — Marshall Islands → Liberia' },
  { color:'#1558d6', txt:'<strong>EASTERN PIONEER</strong> at anchor off Colombo — Est. port entry in 12h' },
  { color:'#b45309', txt:'Certificate expiry alert: IOPP for <strong>GULF VOYAGER</strong> expires in 8 days' },
  { color:'#b45309', txt:'Special survey due: <strong>NORDIC GRACE</strong> — next survey 2024-03-15' },
  { color:'#b45309', txt:'Class condition raised: <strong>BOREALIS</strong> — underwater inspection required within 30 days' },
]
const ACT_TIMES = ['Just now','2m ago','4m ago','7m ago','11m ago','15m ago','18m ago','22m ago','28m ago','35m ago','41m ago','48m ago','1h ago','1h 12m ago']

const VESSEL_GEO = { type:'FeatureCollection', features:[
  {type:'Feature',geometry:{type:'Point',coordinates:[142.5,35.2]},  properties:{name:'PACIFIC STAR',    type:'Container Ship',   speed:18.4,flag:'GR',status:'Underway',   imo:'9412345'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-122.4,37.8]}, properties:{name:'MAERSK COLON',    type:'Container Ship',   speed:0,   flag:'DK',status:'At Port',     imo:'9778532'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[125.0,-8.5]},  properties:{name:'STELLAR WIND',    type:'LNG Carrier',      speed:14.2,flag:'JP',status:'Underway',   imo:'9534892'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[159.0,-15.0]}, properties:{name:'COSCO UNIVERSE',  type:'Container Ship',   speed:19.1,flag:'CN',status:'Underway',   imo:'9871234'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-168.0,24.0]}, properties:{name:'MSC OSCAR',       type:'Container Ship',   speed:17.8,flag:'PT',status:'Underway',   imo:'9703291'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[80.5,8.0]},    properties:{name:'EASTERN PIONEER', type:'Oil Tanker',       speed:0,   flag:'SG',status:'At Anchor',   imo:'9287631'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[65.0,14.0]},   properties:{name:'GULF VOYAGER',    type:'Container Ship',   speed:12.4,flag:'SA',status:'Underway',   imo:'9412340'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[72.8,19.5]},   properties:{name:'LNG JAMAL',       type:'LNG Carrier',      speed:16.1,flag:'KR',status:'Underway',   imo:'9234567'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[5.0,43.5]},    properties:{name:'OCEAN PRIDE',     type:'Bulk Carrier',     speed:0,   flag:'PA',status:'Detained',    imo:'9341122'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[27.0,39.0]},   properties:{name:'BOREALIS',        type:'Research Vessel',  speed:6.2, flag:'DE',status:'Underway',   imo:'9484948'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-35.0,47.0]},  properties:{name:'NORTHERN STAR',   type:'Chemical Tanker',  speed:14.8,flag:'NO',status:'Underway',   imo:'9188741'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-20.0,52.0]},  properties:{name:'NORDERNEY',       type:'RoRo',             speed:18.2,flag:'DE',status:'Underway',   imo:'9388042'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-55.0,40.0]},  properties:{name:'ATLANTIC BULKER', type:'Bulk Carrier',     speed:0,   flag:'BS',status:'In Drydock',  imo:'9501238'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-40.0,55.0]},  properties:{name:'QUEEN MARY 2',    type:'Passenger/Cruise', speed:22.1,flag:'GB',status:'Underway',   imo:'9241061'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[4.2,51.9]},    properties:{name:'PACIFIC ATLAS',   type:'Bulk Carrier',     speed:0,   flag:'HK',status:'At Port',     imo:'9601234'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[103.8,1.3]},   properties:{name:'PIONEER TRADER',  type:'General Cargo',    speed:0,   flag:'LR',status:'At Port',     imo:'9499283'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[54.5,25.5]},   properties:{name:'GLOVIS CAPTAIN',  type:'Car Carrier',      speed:15.4,flag:'KR',status:'Underway',   imo:'9680042'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-43.0,-23.0]}, properties:{name:'SUNRISE CARRIER', type:'Bulk Carrier',     speed:12.8,flag:'PA',status:'Underway',   imo:'9412888'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-15.0,-30.0]}, properties:{name:'NORDIC GRACE',    type:'Bulk Carrier',     speed:0,   flag:'MH',status:'Laid Up',     imo:'9388021'}},
]}

const ROUTE_GEO = { type:'FeatureCollection', features:[
  {type:'Feature',properties:{name:'Asia–Europe (Suez)',trade:'container'},geometry:{type:'LineString',coordinates:[[121.5,31.2],[103.8,1.3],[80.5,8],[55,12],[43,23.5],[32.5,29.9],[28,34.5],[5,44],[4.2,51.9]]}},
  {type:'Feature',properties:{name:'Trans-Pacific',trade:'container'},geometry:{type:'LineString',coordinates:[[121.5,25],[150,35],[-170,35],[-118.5,34]]}},
  {type:'Feature',properties:{name:'Trans-Atlantic',trade:'container'},geometry:{type:'LineString',coordinates:[[4.2,51.9],[-25,47],[-74,40.7]]}},
  {type:'Feature',properties:{name:'Persian Gulf–Asia',trade:'tanker'},geometry:{type:'LineString',coordinates:[[50,26.5],[72,10],[103.8,1.3],[121.5,25]]}},
]}

const PORT_GEO = { type:'FeatureCollection', features:[
  {type:'Feature',geometry:{type:'Point',coordinates:[103.8,1.3]},  properties:{name:'Singapore',  calls:82442,type:'mega'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[121.6,31.2]}, properties:{name:'Shanghai',   calls:43888,type:'mega'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[4.5,51.9]},   properties:{name:'Rotterdam',  calls:29441,type:'major'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-118.2,33.7]},properties:{name:'Los Angeles',calls:18022,type:'major'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[55.3,25.3]},  properties:{name:'Jebel Ali',  calls:15882,type:'major'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[10,53.5]},    properties:{name:'Hamburg',    calls:12441,type:'major'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[129,35.1]},   properties:{name:'Busan',      calls:10442,type:'major'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-74,40.7]},   properties:{name:'New York/NJ',calls:8882, type:'major'}},
]}

const CHOKE_POINTS = [
  { latlng:[30.8,32.3], name:'Suez Canal', stat:'47 vessels/day'  },
  { latlng:[26.6,56.4], name:'Hormuz',     stat:'21Mb oil/day'    },
  { latlng:[1.2,103.9], name:'Malacca',    stat:'84k vessels/yr'  },
  { latlng:[9.1,-79.5], name:'Panama',     stat:'14k vessels/yr'  },
  { latlng:[55.0,-13.0],name:'Dover',      stat:'500 vessels/day' },
]

function vesselColor(p) {
  if (p.status === 'Detained')  return '#c8102e'
  if (p.status === 'Laid Up')   return '#717a85'
  if (p.status === 'At Port' || p.status === 'At Anchor') return '#f59e0b'
  const m = { 'Container Ship':'#1558d6','Oil Tanker':'#c8102e','LNG Carrier':'#ea580c',
    'LPG Carrier':'#f59e0b','Bulk Carrier':'#137333','Chemical Tanker':'#6200ea',
    'Offshore Supply':'#0094b3','Car Carrier':'#717a85','Passenger/Cruise':'#d93025',
    'Research Vessel':'#059669','RoRo':'#b45309','General Cargo':'#64748b' }
  return m[p.type] || '#717a85'
}

function shuffled(arr) { return arr.slice().sort(() => Math.random() - 0.5) }

// ── Individual card components ──────────────────────────────

function KpiRowCard() {
  return (
    <div className="kpiRow" style={{gap:8}}>
      {KPIS.map(k => (
        <div key={k.id} className="kpi" style={{'--kc': k.color}}>
          <div className="kpiV">{k.v}</div>
          <div className="kpiL">{k.l}</div>
          <div className={`kpiDelta ${k.up?'kpiUp':'kpiDn'}`}>{k.up?'▲':'▼'} {k.delta}</div>
        </div>
      ))}
    </div>
  )
}

function SingleKpiCard({ cardId }) {
  const kpi = KPIS.find(k => k.id === cardId)
  if (!kpi) return null
  return (
    <div className="kpi" style={{'--kc': kpi.color, flex:1}}>
      <div className="kpiV">{kpi.v}</div>
      <div className="kpiL">{kpi.l}</div>
      <div className={`kpiDelta ${kpi.up?'kpiUp':'kpiDn'}`}>{kpi.up?'▲':'▼'} {kpi.delta}</div>
    </div>
  )
}

const LiveMapCard = memo(function LiveMapCard() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const elRef  = useRef(null)
  const layersRef = useRef({})
  const [layersOn, setLayersOn] = useState({ vessels:true, routes:true, ports:true, choke:true })

  useEffect(() => {
    if (mapRef.current || !elRef.current) return
    const map = L.map(elRef.current, { center:[20,20], zoom:2, zoomControl:true, attributionControl:false })
    mapRef.current = map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19}).addTo(map)

    const routeLayer = L.geoJSON(ROUTE_GEO, {
      style: f => {
        const c = f.properties.trade==='container'?'#1558d6':f.properties.trade==='tanker'?'#c8102e':'#137333'
        return { color:c, weight:1.5, opacity:0.45, dashArray:'4,6' }
      }
    }).addTo(map)

    const portLayer = L.geoJSON(PORT_GEO, {
      pointToLayer: (f, ll) => {
        const sz = f.properties.type==='mega'?10:f.properties.type==='major'?7:5
        const cl = f.properties.type==='mega'?'#f59e0b':f.properties.type==='major'?'#0094b3':'#717a85'
        return L.circleMarker(ll, { radius:sz, fillColor:cl, color:'#fff', weight:1.5, fillOpacity:0.9 })
      },
      onEachFeature: (f, layer) => layer.bindPopup(
        `<div class="vpop"><div class="vpop-name">⚓ ${f.properties.name}</div>` +
        `<div class="vpop-row"><span class="vpop-lbl">Port Calls (annual)</span><span class="vpop-val">${f.properties.calls.toLocaleString()}</span></div></div>`
      )
    }).addTo(map)

    const vesselLayer = L.geoJSON(VESSEL_GEO, {
      pointToLayer: (f, ll) => L.circleMarker(ll, { radius:5, fillColor:vesselColor(f.properties), color:'#fff', weight:1.2, fillOpacity:0.92 }),
      onEachFeature: (f, layer) => {
        const p = f.properties
        layer.bindPopup(
          `<div class="vpop"><div class="vpop-name">🚢 ${p.name}</div>` +
          `<div class="vpop-row"><span class="vpop-lbl">Type</span><span class="vpop-val">${p.type}</span></div>` +
          `<div class="vpop-row"><span class="vpop-lbl">IMO</span><span class="vpop-val mn">${p.imo}</span></div>` +
          `<div class="vpop-row"><span class="vpop-lbl">Speed</span><span class="vpop-val mn">${p.speed} kn</span></div>` +
          `<div class="vpop-row"><span class="vpop-lbl">Status</span><span class="vpop-val">${p.status}</span></div>` +
          `<a href="#" class="vpop-link" onclick="event.preventDefault()">Open Vessel Record →</a></div>`
        )
      }
    }).addTo(map)

    const chokeLayer = L.layerGroup()
    CHOKE_POINTS.forEach(c => {
      L.marker(c.latlng, { icon:L.divIcon({ className:'', html:`<div class="chokeLabel">${c.name}</div>`, iconAnchor:[0,0] }) })
        .bindTooltip(c.stat, { direction:'top' }).addTo(chokeLayer)
    })
    chokeLayer.addTo(map)

    layersRef.current = { vessels:vesselLayer, routes:routeLayer, ports:portLayer, choke:chokeLayer }
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Invalidate map size when container resizes
  useEffect(() => {
    if (!elRef.current) return
    const obs = new ResizeObserver(() => mapRef.current?.invalidateSize())
    obs.observe(elRef.current)
    return () => obs.disconnect()
  }, [])

  function toggleLayer(name) {
    const lyr = layersRef.current[name]
    if (!lyr || !mapRef.current) return
    setLayersOn(prev => {
      const next = { ...prev, [name]: !prev[name] }
      if (next[name]) mapRef.current.addLayer(lyr)
      else mapRef.current.removeLayer(lyr)
      return next
    })
  }

  return (
    <div className="panel" style={{minHeight:380}}>
      <div className="panelH">
        <span className="panelT">Global Fleet — Live AIS</span>
        <span className="liveBadge">LIVE</span>
        <span style={{marginLeft:'auto',fontSize:10,color:'var(--txt3)'}}>{VESSEL_GEO.features.length} sample vessels shown</span>
        <button className="btn btnS btnSm" style={{marginLeft:6}} onClick={() => navigate('/gis-ais')}>Full GIS →</button>
      </div>
      <div style={{position:'relative',flex:1,minHeight:0}}>
        <div ref={elRef} style={{height:340,borderRadius:'0 0 6px 6px'}} />
        <div className="mapOverlay" style={{bottom:8,left:8}}>
          <div className="mapStat">● 847,392 vessels tracked · 94.3% active</div>
        </div>
        <div className="mapOverlay mapLayerCtl" style={{top:8,right:8,pointerEvents:'all'}}>
          {['vessels','routes','ports','choke'].map(n => (
            <button key={n} className={`mapLayerBtn${layersOn[n]?' on':''}`} onClick={() => toggleLayer(n)}>
              {n==='vessels'?'🚢 Vessels':n==='routes'?'〰 Routes':n==='ports'?'⚓ Ports':'⚠ Choke'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

function ActivityCard() {
  const navigate = useNavigate()
  const [activity, setActivity] = useState(() => shuffled(ACT_POOL).slice(0,14))
  useEffect(() => {
    const id = setInterval(() => setActivity(shuffled(ACT_POOL).slice(0,14)), 30000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="panel" style={{minHeight:380}}>
      <div className="panelH">
        <span className="panelT">Live Activity</span>
        <span className="liveBadge" style={{marginLeft:4}}>LIVE</span>
        <span style={{marginLeft:'auto',fontSize:10,color:'var(--txt3)'}}>Updates every 30s</span>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {activity.map((a,i) => (
          <div key={i} className="actItem">
            <div className="actDot" style={{background:a.color}} />
            <div className="actTxt" dangerouslySetInnerHTML={{__html:a.txt}} />
            <div className="actTime">{ACT_TIMES[i]||'1h ago'}</div>
          </div>
        ))}
      </div>
      <div className="panelFoot">
        <span style={{fontSize:10,color:'var(--txt3)'}}>Showing last 50 events</span>
        <button className="btn btnS btnSm" style={{marginLeft:'auto'}} onClick={() => navigate('/events')}>All Events →</button>
      </div>
    </div>
  )
}

function FleetTypesCard() {
  const max = FLEET_TYPES[0][1]
  return (
    <div className="panel">
      <div className="panelH">
        <span className="panelT">Fleet by Ship Type</span>
        <span className="tag tB" style={{marginLeft:'auto'}}>847,392 vessels</span>
      </div>
      <div className="panelB">
        {FLEET_TYPES.map(([label,count,color]) => (
          <div key={label} className="barRow">
            <div style={{width:110,flexShrink:0,color:'var(--txt2)',fontSize:10,textAlign:'right',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
            <div style={{flex:1,background:'var(--bg3)',borderRadius:2,height:14,overflow:'hidden'}}>
              <div style={{width:`${Math.round(count/max*100)}%`,background:color,height:'100%',borderRadius:2}} />
            </div>
            <div className="barN mn">{(count/1000).toFixed(0)}k</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FlagStatesCard() {
  const navigate = useNavigate()
  const max = FLAGS[0][2]
  return (
    <div className="panel">
      <div className="panelH">
        <span className="panelT">Top Flag States</span>
        <button className="btn btnS btnSm" style={{marginLeft:'auto'}} onClick={() => navigate('/compliance')}>View all →</button>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {FLAGS.map(([flag,name,count]) => (
          <div key={name} className="fRow">
            <span className="fFlag">{flag}</span>
            <span className="fName">{name}</span>
            <div className="fBar"><div className="fBarFl" style={{width:`${Math.round(count/max*100)}%`}} /></div>
            <span className="fNum mn">{(count/1000).toFixed(1)}k</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CertsCard() {
  const navigate = useNavigate()
  return (
    <div className="panel">
      <div className="panelH">
        <span className="panelT">Certificates Expiring</span>
        <span className="tag tR" style={{marginLeft:'auto'}}>1,047 in 30d</span>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {CERTS.map((c,i) => (
          <div key={i} className="certRow">
            <span className="certIcon">{c.icon}</span>
            <div className="certInfo">
              <div className="certName">{c.name}</div>
              <div className="certSub">{c.sub}</div>
            </div>
            <span className={`tag ${c.cls}`}>{c.count}</span>
          </div>
        ))}
      </div>
      <div className="panelFoot">
        <button className="btn btnS btnSm" style={{marginLeft:'auto'}} onClick={() => navigate('/compliance')}>View All Certs →</button>
      </div>
    </div>
  )
}

function PscCard() {
  const navigate = useNavigate()
  return (
    <div className="panel">
      <div className="panelH">
        <span className="panelT">Recent PSC Detentions</span>
        <span className="tag tR" style={{marginLeft:'auto'}}>283 YTD</span>
        <button className="btn btnS btnSm" style={{marginLeft:8}} onClick={() => navigate('/psc')}>All PSC →</button>
      </div>
      <div className="tWrap">
        <table className="dt">
          <thead><tr><th>Vessel</th><th>Port</th><th>MOU Region</th><th>Defs</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {PSC_DATA.map((p,i) => (
              <tr key={i}>
                <td>
                  <button className="vLnk" style={{background:'none',border:'none',padding:0,cursor:'pointer'}} onClick={() => navigate('/vessels')}>{p.vessel}</button>
                  <div style={{fontSize:9,color:'var(--txt3)',fontFamily:'monospace'}}>{p.imo}</div>
                </td>
                <td style={{fontSize:11}}>{p.port}</td>
                <td><span className="tag tN">{p.mou}</span></td>
                <td style={{textAlign:'center'}}><span className={`tag ${p.defs>=10?'tR':'tA'}`}>{p.defs}</span></td>
                <td style={{fontSize:10,color:'var(--txt3)'}}>{p.date}</td>
                <td><span className={`tag ${p.status==='Detained'?'tR':'tG'}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MarketCard() {
  const navigate = useNavigate()
  return (
    <div className="panel">
      <div className="panelH">
        <span className="panelT">Market Snapshot</span>
        <span style={{marginLeft:'auto',fontSize:10,color:'var(--txt3)'}}>Baltic Indices · Today</span>
        <button className="btn btnS btnSm" style={{marginLeft:8}} onClick={() => navigate('/fixtures')}>Fixtures →</button>
      </div>
      <div className="panelB">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {MARKET.map((m,i) => (
            <div key={i} style={{padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:4,background:'var(--bg2)'}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>{m.idx}</div>
              <div style={{fontSize:15,fontWeight:700,color:'var(--txt)',margin:'2px 0'}}>{m.val}</div>
              <div style={{fontSize:10,color:m.up?'var(--green)':'var(--red)'}}>{m.up?'▲':'▼'} {m.delta}</div>
              <div style={{fontSize:9,color:'var(--txt3)',marginTop:2}}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CardRenderer({ cardId, editMode }) {
  if (cardId === 'kpi-row')         return <KpiRowCard />
  if (cardId.startsWith('kpi-'))    return <div className="panel" style={{height:'100%'}}><SingleKpiCard cardId={cardId} /></div>
  if (cardId === 'live-map')        return <LiveMapCard />
  if (cardId === 'live-activity')   return <ActivityCard />
  if (cardId === 'fleet-types')     return <FleetTypesCard />
  if (cardId === 'flag-states')     return <FlagStatesCard />
  if (cardId === 'certs-expiring')  return <CertsCard />
  if (cardId === 'psc-detentions')  return <PscCard />
  if (cardId === 'market-snapshot') return <MarketCard />
  return <div className="panel"><div className="panelH"><span className="panelT">{cardId}</span></div><div className="empty">Card not found</div></div>
}

const VALID_WIDTHS = [3, 4, 6, 8, 12]
const GRID_GAP = 14

// ── Main DashboardGrid ──────────────────────────────────────
export default function DashboardGrid() {
  const { dashboardLayout, updateDashboardLayout, resetDashboardLayout } = usePreferences()
  const [editMode, setEditMode] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [dragId, setDragId]         = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [liveResize, setLiveResize] = useState(null) // { id, w?, h? } — ephemeral during drag

  const gridRef       = useRef(null)
  const layoutRef     = useRef(dashboardLayout)
  const resizingRef   = useRef(null)
  const liveResizeRef = useRef(null)

  useEffect(() => { layoutRef.current = dashboardLayout }, [dashboardLayout])

  // ── Drag-to-reorder ──
  function handleDragStart(e, id) {
    if (resizingRef.current) return
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  function handleDragOver(e, id) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) setDragOverId(id)
  }
  function handleDrop(e, targetId) {
    e.preventDefault()
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const next = [...layoutRef.current]
    const fi = next.findIndex(c => c.id === dragId)
    const ti = next.findIndex(c => c.id === targetId)
    const [moved] = next.splice(fi, 1)
    next.splice(ti, 0, moved)
    updateDashboardLayout(next)
    setDragId(null); setDragOverId(null)
  }
  function handleDragEnd() { setDragId(null); setDragOverId(null) }

  // ── Corner resize (bottom-right handle — controls width + height together) ──
  function startCResize(e, cardId) {
    e.preventDefault(); e.stopPropagation()
    const gridW   = gridRef.current?.getBoundingClientRect().width || 1200
    const colUnit = (gridW + GRID_GAP) / 12
    const el      = e.currentTarget.closest('.dashCardWrap')
    const card    = layoutRef.current.find(c => c.id === cardId)
    resizingRef.current = {
      id: cardId,
      startX: e.clientX, startY: e.clientY,
      startW: card?.w || 6,
      startH: el?.offsetHeight || 300,
      colUnit,
    }

    function onMove(ev) {
      const r = resizingRef.current
      if (!r) return
      const rawCols = r.startW + (ev.clientX - r.startX) / r.colUnit
      const bestW   = VALID_WIDTHS.reduce((a, b) =>
        Math.abs(rawCols - a) <= Math.abs(rawCols - b) ? a : b)
      const newH    = Math.max(80, r.startH + (ev.clientY - r.startY))
      const val     = { id: r.id, w: bestW, h: newH }
      liveResizeRef.current = val
      setLiveResize(val)
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.classList.remove('c-resizing')
      const live = liveResizeRef.current
      if (live) {
        updateDashboardLayout(layoutRef.current.map(c =>
          c.id === live.id ? { ...c, w: live.w, h: Math.round(live.h) } : c
        ))
      }
      resizingRef.current = null; liveResizeRef.current = null
      setLiveResize(null)
    }

    document.body.classList.add('c-resizing')
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function removeCard(id) {
    updateDashboardLayout(dashboardLayout.filter(c => c.id !== id))
  }

  function addCard(cardId) {
    const meta = CARD_CATALOG[cardId]
    if (!meta) return
    updateDashboardLayout([...dashboardLayout, { id: cardId, w: meta.defaultW }])
    setShowCatalog(false)
  }

  const activeCardIds = dashboardLayout.map(c => c.id)

  return (
    <div>
      {/* Toolbar */}
      {editMode ? (
        <div className="dashEditBar">
          <span className="dashEditTitle">✎ Edit Mode — drag to reorder · drag handles to resize · click ✕ to remove</span>
          <button className="btn btnS btnSm" onClick={() => setShowCatalog(true)}>+ Add Cards</button>
          <button className="btn btnS btnSm" onClick={() => { resetDashboardLayout(); setEditMode(false) }}>↺ Reset Default</button>
          <button className="btn btnP btnSm" onClick={() => setEditMode(false)}>✓ Done</button>
        </div>
      ) : (
        <div className="dashTopBar">
          <button className="btn btnS btnSm dashCustomBtn" onClick={() => setEditMode(true)}>⚙ Customize</button>
        </div>
      )}

      {/* Grid */}
      <div className="dashGrid" ref={gridRef}>
        {dashboardLayout.map(card => {
          const meta       = CARD_CATALOG[card.id]
          const isDragging = dragId === card.id
          const isDragOver = dragOverId === card.id
          const isResizing = liveResize?.id === card.id
          const cardW      = (isResizing && liveResize.w != null) ? liveResize.w : card.w
          const cardH      = (isResizing && liveResize.h != null) ? liveResize.h : (card.h || null)
          return (
            <div
              key={card.id}
              className={`dashCardWrap w${cardW}${isDragging ? ' dash-dragging' : ''}${isDragOver && !isDragging ? ' dash-dragover' : ''}${isResizing ? ' dash-resizing' : ''}`}
              style={cardH ? { height: cardH } : undefined}
              draggable={editMode && !resizingRef.current}
              onDragStart={editMode ? e => handleDragStart(e, card.id) : undefined}
              onDragOver={editMode ? e => handleDragOver(e, card.id) : undefined}
              onDrop={editMode ? e => handleDrop(e, card.id) : undefined}
              onDragEnd={editMode ? handleDragEnd : undefined}
              onDragLeave={editMode ? () => setDragOverId(null) : undefined}
            >
              {editMode && (
                <div className="dashCardToolbar">
                  <span className="dashDragHandle" title="Drag to reorder">⠿</span>
                  <span className="dashCardLabel">{meta?.title || card.id}</span>
                  <button className="dashRemoveBtn" title="Remove card" onClick={() => removeCard(card.id)}>✕</button>
                </div>
              )}
              <div className={editMode ? 'dashCardBody' : ''} style={cardH ? { height: cardH - (editMode ? 34 : 0), overflow: 'hidden' } : undefined}>
                <CardRenderer cardId={card.id} />
              </div>
              {editMode && (
                <>
                  <div className="dashCardEditOverlay" />
                  <div className="dashResizeHandleC" onMouseDown={e => startCResize(e, card.id)} title="Drag to resize" />
                </>
              )}
            </div>
          )
        })}

        {/* Empty state */}
        {editMode && dashboardLayout.length === 0 && (
          <div className="dashCardWrap w12">
            <div className="empty" style={{border:'2px dashed var(--bd)',borderRadius:6,padding:40}}>
              No cards on dashboard. Click <strong>+ Add Cards</strong> to add some.
            </div>
          </div>
        )}
      </div>

      {showCatalog && (
        <CardCatalog
          activeCardIds={activeCardIds}
          onAdd={addCard}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  )
}
