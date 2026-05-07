import { useState, useEffect, useRef, useMemo } from 'react'
import L from 'leaflet'

const PORTS = [
  {id:1, name:'Singapore',            locode:'SGSIN',country:'Singapore',    lat:1.3,  lon:103.8,type:'Commercial / Container',calls:82442,congest:0.72,mou:'Tokyo MOU',        maxLoa:400,maxBeam:65, maxDraft:20.5,maxAirDraft:63,berths:74, pscAuth:'Maritime and Port Authority',         tugboats:32,draft:'Singapore Strait draught limit 20.5m'},
  {id:2, name:'Shanghai (Yangshan)',   locode:'CNSHA',country:'China',        lat:30.6, lon:121.9,type:'Commercial / Container',calls:43888,congest:0.81,mou:'Tokyo MOU',        maxLoa:400,maxBeam:65, maxDraft:17.5,maxAirDraft:55,berths:52, pscAuth:'China MSA',                           tugboats:28,draft:'Channel depth 17.5m MLWS'},
  {id:3, name:'Rotterdam (Europoort)', locode:'NLRTM',country:'Netherlands', lat:51.9, lon:4.5,  type:'Commercial / Container',calls:29441,congest:0.55,mou:'Paris MOU',        maxLoa:420,maxBeam:80, maxDraft:23.0,maxAirDraft:68,berths:112,pscAuth:'Netherlands ILT / Paris MOU PSCO',     tugboats:44,draft:'Eurogeul channel 23.0m LAT'},
  {id:4, name:'Los Angeles / Long Beach',locode:'USLAX',country:'USA',       lat:33.7, lon:-118.2,type:'Commercial / Container',calls:18022,congest:0.64,mou:'USCG',            maxLoa:400,maxBeam:65, maxDraft:16.5,maxAirDraft:58,berths:38, pscAuth:'US Coast Guard District 11',           tugboats:18,draft:'Main channel 16.5m MLLW'},
  {id:5, name:'Jebel Ali (DP World)', locode:'AEJEA',country:'UAE',          lat:25.0, lon:55.1, type:'Commercial / Container',calls:15882,congest:0.58,mou:'Riyadh MOU',       maxLoa:400,maxBeam:65, maxDraft:17.0,maxAirDraft:55,berths:68, pscAuth:'UAE Federal Transport Authority',      tugboats:22,draft:'Jebel Ali approach 17.0m CD'},
  {id:6, name:'Port of Houston',       locode:'USHON',country:'USA',         lat:29.7, lon:-95.0,type:'Oil Terminal',          calls:12441,congest:0.62,mou:'USCG',            maxLoa:300,maxBeam:56, maxDraft:14.3,maxAirDraft:58,berths:44, pscAuth:'US Coast Guard District 8',            tugboats:16,draft:'Houston Ship Channel 14.3m'},
  {id:7, name:'Antwerp (DP World)',    locode:'BEANR',country:'Belgium',      lat:51.2, lon:4.3,  type:'Commercial / Container',calls:11882,congest:0.60,mou:'Paris MOU',        maxLoa:400,maxBeam:62, maxDraft:15.5,maxAirDraft:51,berths:88, pscAuth:'Belgian Marine Environment Service',   tugboats:36,draft:'Schelde river 15.5m TAW'},
  {id:8, name:'Busan New Port',        locode:'KRBSN',country:'South Korea',  lat:35.1, lon:129.0,type:'Commercial / Container',calls:10442,congest:0.49,mou:'Tokyo MOU',        maxLoa:400,maxBeam:65, maxDraft:17.0,maxAirDraft:55,berths:31, pscAuth:'Korea Coast Guard / MOF',              tugboats:18,draft:'Basin depth 17.0m CD'},
  {id:9, name:'Hong Kong (Kwai Tsing)',locode:'HKHKG',country:'Hong Kong',    lat:22.3, lon:114.2,type:'Commercial / Container',calls:9882, congest:0.47,mou:'Tokyo MOU',        maxLoa:380,maxBeam:62, maxDraft:14.5,maxAirDraft:55,berths:24, pscAuth:'Marine Department Hong Kong',          tugboats:14,draft:'Approach channel 14.5m CD'},
  {id:10,name:'Hamburg (HPA)',          locode:'DEHAM',country:'Germany',     lat:53.5, lon:10.0, type:'Commercial / Container',calls:12441,congest:0.52,mou:'Paris MOU',        maxLoa:400,maxBeam:65, maxDraft:15.1,maxAirDraft:55,berths:56, pscAuth:'Waterways and Shipping Office Hamburg', tugboats:28,draft:'Elbe dredged to 15.1m NAP'},
  {id:11,name:'Port Said (Suez Canal)',locode:'EGPSD',country:'Egypt',        lat:31.2, lon:32.3, type:'Commercial / Container',calls:6882, congest:0.88,mou:'Mediterranean MOU',maxLoa:400,maxBeam:77, maxDraft:20.1,maxAirDraft:68,berths:18, pscAuth:'Suez Canal Authority / PSCO',          tugboats:20,draft:'Canal max 20.1m at SW'},
  {id:12,name:'Qingdao (Qianwan)',     locode:'CNTAO',country:'China',        lat:36.1, lon:120.3,type:'Bulk Terminal',         calls:8441, congest:0.66,mou:'Tokyo MOU',        maxLoa:350,maxBeam:55, maxDraft:18.5,maxAirDraft:50,berths:35, pscAuth:'China MSA Qingdao',                    tugboats:14,draft:'Ore terminal 18.5m LAT'},
  {id:13,name:'Ras Tanura',            locode:'SARTN',country:'Saudi Arabia', lat:26.6, lon:50.1, type:'Oil Terminal',          calls:4882, congest:0.45,mou:'Riyadh MOU',       maxLoa:350,maxBeam:60, maxDraft:21.3,maxAirDraft:0, berths:22, pscAuth:'Saudi Arabia PMSA',                    tugboats:18,draft:'Sea island berths 21.3m'},
  {id:14,name:'Gate LNG Terminal',     locode:'NLRTM',country:'Netherlands', lat:51.95,lon:4.0,  type:'LNG Terminal',          calls:892,  congest:0.30,mou:'Paris MOU',        maxLoa:345,maxBeam:55, maxDraft:13.2,maxAirDraft:52,berths:3,  pscAuth:'Netherlands ILT',                      tugboats:8, draft:'Gate T1–T3 jetty 13.2m LAT'},
  {id:15,name:'Port of Mombasa',       locode:'KEMBA',country:'Kenya',        lat:-4.0, lon:39.7, type:'Commercial / Container',calls:3441, congest:0.77,mou:'Indian Ocean MOU', maxLoa:250,maxBeam:40, maxDraft:12.0,maxAirDraft:44,berths:21, pscAuth:'Kenya Maritime Authority / IOMOU',     tugboats:6, draft:'Main berths max 12.0m CD'},
  {id:16,name:'Port of Cape Town',     locode:'ZACPT',country:'South Africa', lat:-33.9,lon:18.4, type:'Commercial / Container',calls:2882, congest:0.38,mou:'Indian Ocean MOU', maxLoa:300,maxBeam:48, maxDraft:14.5,maxAirDraft:55,berths:16, pscAuth:'South African MRCC / IOMOU',           tugboats:8, draft:'E-Quay 14.5m CD'},
  {id:17,name:'Port of Santos',        locode:'BRSSZ',country:'Brazil',       lat:-23.9,lon:-46.3,type:'Bulk Terminal',         calls:5441, congest:0.71,mou:'Caribbean MOU',    maxLoa:320,maxBeam:55, maxDraft:15.0,maxAirDraft:50,berths:60, pscAuth:'Brazilian Navy DPCA',                  tugboats:14,draft:'Inner channel 15.0m LAT'},
  {id:18,name:'Gothenburg (GPH)',       locode:'SEGOT',country:'Sweden',      lat:57.7, lon:11.9, type:'RoRo / Ferry',          calls:7441, congest:0.35,mou:'Paris MOU',        maxLoa:250,maxBeam:36, maxDraft:11.6,maxAirDraft:48,berths:28, pscAuth:'Swedish Transport Agency',              tugboats:10,draft:'Hisingen fairway 11.6m LAT'},
  {id:19,name:'Colombo (CICT)',         locode:'LKCMB',country:'Sri Lanka',   lat:6.9,  lon:79.9, type:'Commercial / Container',calls:6882, congest:0.62,mou:'Indian Ocean MOU', maxLoa:400,maxBeam:65, maxDraft:18.0,maxAirDraft:52,berths:11, pscAuth:'Sri Lanka Ports Authority / IOMOU',    tugboats:10,draft:'SLPA South Harbour 18.0m'},
  {id:20,name:'Piraeus (PCT)',          locode:'GRPIR',country:'Greece',      lat:37.9, lon:23.6, type:'Commercial / Container',calls:5882, congest:0.54,mou:'Paris MOU',        maxLoa:400,maxBeam:65, maxDraft:15.5,maxAirDraft:52,berths:38, pscAuth:'Hellenic Coast Guard / PSCO',          tugboats:16,draft:'Piers I-III 15.5m LAT'},
]

const BERTHS = {
  1: [['T1 Pasir Panjang','Container','420m','20.0m','2×65t cranes'],['T2 Pasir Panjang','Container','380m','18.5m','4x40t cranes'],['Jurong Island','Bulk/Oil','340m','21.0m','Pipeline only'],['Tanjong Pagar','RoRo','220m','10.5m','Ro-Ro ramp']],
  2: [['Yangshan D1','Container','400m','17.5m','3×65t cranes'],['Yangshan D2','Container','400m','17.5m','3×65t cranes'],['Waigaoqiao','Container','350m','15.0m','2×50t cranes'],['Wusong Bulk','Bulk','300m','18.0m','4 grabs']],
  3: [['Maasvlakte II (APM)','Container','420m','23.0m','6×65t STS cranes'],['Europoort Oil','Oil','350m','23.0m','Pipeline SPM'],['Brittanniehaven','Bulk','280m','18.0m','Belt conveyors'],['Prinses Amaliahaven','RoRo','250m','10.0m','Ramps x3']],
}
const MOU_COLORS = {'Paris MOU':'#1558d6','Tokyo MOU':'#137333','Indian Ocean MOU':'#0094b3','Mediterranean MOU':'#6200ea','Black Sea MOU':'#b45309','USCG':'#c8102e','Caribbean MOU':'#ea580c','Abuja MOU':'#64748b','Riyadh MOU':'#d97706'}
const PORT_TABS = ['overview','facilities','berths','restrictions','traffic','psc']
const TAB_LABELS = {overview:'Overview',facilities:'Facilities',berths:'Berths',restrictions:'Restrictions',traffic:'Vessel Traffic',psc:'PSC'}

function mkRow(l, v) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',padding:'6px 12px',borderBottom:'1px solid var(--bd)'}}>
      <span style={{minWidth:160,flexShrink:0,fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.3}}>{l}</span>
      <span style={{fontSize:12,color:'var(--txt)'}} dangerouslySetInnerHTML={{__html:v}}/>
    </div>
  )
}

export default function Ports() {
  const mapRef = useRef(null)
  const mapElRef = useRef(null)
  const markersRef = useRef({})
  const [search, setSearch] = useState('')
  const [mouFilter, setMouFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selPort, setSelPort] = useState(null)
  const [pdTab, setPdTab] = useState('overview')

  const filtered = useMemo(() => {
    let ps = PORTS
    if (search) { const q=search.toLowerCase(); ps=ps.filter(p=>p.name.toLowerCase().includes(q)||p.locode.toLowerCase().includes(q)||p.country.toLowerCase().includes(q)||p.mou.toLowerCase().includes(q)) }
    if (mouFilter) ps=ps.filter(p=>p.mou===mouFilter)
    if (typeFilter) ps=ps.filter(p=>p.type===typeFilter)
    return ps
  }, [search, mouFilter, typeFilter])

  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(mapElRef.current, { center:[20,20], zoom:2, attributionControl:false })
    mapRef.current = map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains:'abcd', maxZoom:19 }).addTo(map)

    PORTS.forEach(p => {
      const sz = p.calls > 30000 ? 10 : p.calls > 10000 ? 7 : 5
      const cl = p.calls > 30000 ? '#f59e0b' : p.calls > 10000 ? '#0094b3' : '#717a85'
      const m = L.circleMarker([p.lat, p.lon], { radius:sz, fillColor:cl, color:'#fff', weight:1.5, fillOpacity:0.9 })
        .bindPopup(`<div class="vpop"><div class="vpop-name">⚓ ${p.name}</div><div class="vpop-row"><span class="vpop-lbl">Country</span><span class="vpop-val">${p.country}</span></div><div class="vpop-row"><span class="vpop-lbl">Port Calls/yr</span><span class="vpop-val">${p.calls.toLocaleString()}</span></div><div class="vpop-row"><span class="vpop-lbl">MOU Region</span><span class="vpop-val">${p.mou}</span></div></div>`)
        .on('click', () => { setSelPort(p); setPdTab('overview') })
        .addTo(map)
      markersRef.current[p.id] = m
    })

    return () => { map.remove(); mapRef.current = null }
  }, [])

  function selectPort(p) {
    setSelPort(p); setPdTab('overview')
    const m = markersRef.current[p.id]
    if (m && mapRef.current) { mapRef.current.setView([p.lat, p.lon], 8); m.openPopup() }
  }

  function renderTabContent(p) {
    const cPct = Math.round(p.congest * 100)
    const cClr = p.congest > 0.75 ? '#c8102e' : p.congest > 0.5 ? '#b45309' : '#137333'
    const mouClr = MOU_COLORS[p.mou] || '#717a85'
    switch (pdTab) {
      case 'overview': return (
        <div>
          <div style={{padding:'12px 14px',background:'var(--bg2)',borderBottom:'1px solid var(--bd)',marginBottom:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>Congestion Index</span>
              <span style={{fontSize:18,fontWeight:700,color:cClr}}>{cPct}%</span>
            </div>
            <div style={{height:8,background:'var(--bg3)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',background:cClr,width:`${cPct}%`,borderRadius:4}}/></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--txt3)',marginTop:4}}>
              <span>{p.congest>0.75?'HIGH — significant delays possible':p.congest>0.5?'MEDIUM — moderate delays':'LOW — normal operations'}</span>
              <span>Updated: Today 14:30</span>
            </div>
          </div>
          <div style={{padding:'8px 0',borderBottom:'1px solid var(--bd)'}}>
            <div style={{padding:'6px 12px 4px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>Port Identification</div>
            {mkRow('Port Name', p.name)}
            {mkRow('UN/LOCODE', `<span style="font-family:monospace;font-weight:700">${p.locode}</span>`)}
            {mkRow('Country', p.country)}
            {mkRow('Port Type', p.type)}
            {mkRow('MOU Region', `<span style="background:${mouClr}33;color:${mouClr};font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px">${p.mou}</span>`)}
            {mkRow('Coordinates', `${p.lat.toFixed(4)}°${p.lat>=0?'N':'S'}, ${Math.abs(p.lon).toFixed(4)}°${p.lon>=0?'E':'W'}`)}
            {mkRow('PSC Authority', p.pscAuth)}
            {mkRow('Annual Port Calls', p.calls.toLocaleString())}
          </div>
          <div style={{padding:'8px 0'}}>
            <div style={{padding:'6px 12px 4px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>Physical Limits</div>
            {mkRow('Max Vessel LOA', p.maxLoa + ' m')}
            {mkRow('Max Beam', p.maxBeam + ' m')}
            {mkRow('Max Draft', p.maxDraft + ' m')}
            {mkRow('Max Air Draft', p.maxAirDraft > 0 ? p.maxAirDraft + ' m' : 'No restriction')}
            {mkRow('No. of Berths', String(p.berths))}
            {mkRow('Tugboats Available', String(p.tugboats))}
          </div>
        </div>
      )
      case 'facilities': return (
        <div>
          <div style={{padding:'8px 0',borderBottom:'1px solid var(--bd)'}}>
            <div style={{padding:'6px 12px 4px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>Port Services</div>
            {mkRow('VTS / VTMS', 'VTS operational 24/7')}
            {mkRow('Pilotage', `Compulsory — ${p.name} Pilotage District`)}
            {mkRow('Towage', `${p.tugboats} tugs available (24/7)`)}
            {mkRow('Bunker Supply', 'HFO, VLSFO, MDO, LNG (selected berths)')}
            {mkRow('Fresh Water', 'Available at all berths')}
            {mkRow('Waste Reception', 'MARPOL Annex I–VI compliant')}
            {mkRow('Customs / Border', 'Full customs + quarantine')}
            {mkRow('Medical Facilities', 'Port clinic + hospital access')}
            {mkRow('Agent Roster', '12 approved ship agents')}
          </div>
          <div style={{padding:'8px 0'}}>
            <div style={{padding:'6px 12px 4px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>Digital & Communications</div>
            {mkRow('Port Community System', 'PortNet / INTTRA')}
            {mkRow('AIS Coverage', 'Class A & B — 24/7 monitoring')}
            {mkRow('VHF Working Channel', 'Ch 16 (distress), Ch 12 (working)')}
            {mkRow('SafetyNET / NAVTEX', `NAVTEX station ${p.locode.slice(0,2)}`)}
          </div>
        </div>
      )
      case 'berths': {
        const bData = BERTHS[p.id] || [['Main Berth 1','Multi-purpose','300m','14.0m','General'],['Main Berth 2','Bulk','280m','12.5m','Belt conv.']]
        return (
          <div style={{padding:'10px 12px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Berth Directory ({bData.length + 4} berths)</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
              <thead><tr>{['Berth Name','Type','LOA','Draft','Gear / Notes'].map(h=><th key={h} style={{padding:'5px 8px',background:'var(--bg3)',borderBottom:'1px solid var(--bd)',fontSize:8,fontWeight:700,textTransform:'uppercase',color:'var(--txt3)',textAlign:'left'}}>{h}</th>)}</tr></thead>
              <tbody>
                {bData.map((b,i)=>(
                  <tr key={i}><td style={{padding:'5px 8px',borderBottom:'1px solid var(--bd)',fontWeight:600}}>{b[0]}</td><td style={{padding:'5px 8px',borderBottom:'1px solid var(--bd)'}}><span className="tag tN" style={{fontSize:8}}>{b[1]}</span></td><td style={{padding:'5px 8px',borderBottom:'1px solid var(--bd)',fontFamily:'monospace'}}>{b[2]}</td><td style={{padding:'5px 8px',borderBottom:'1px solid var(--bd)',fontFamily:'monospace'}}>{b[3]}</td><td style={{padding:'5px 8px',borderBottom:'1px solid var(--bd)',fontSize:9,color:'var(--txt3)'}}>{b[4]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      case 'restrictions': return (
        <div>
          <div style={{padding:'8px 0',borderBottom:'1px solid var(--bd)'}}>
            <div style={{padding:'6px 12px 4px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>Navigational Restrictions</div>
            {mkRow('Channel Depth', p.maxDraft + ' m (' + p.draft + ')')}
            {mkRow('Max LOA', p.maxLoa + ' m')}
            {mkRow('Max Beam', p.maxBeam + ' m')}
            {mkRow('Air Draft Limit', p.maxAirDraft > 0 ? p.maxAirDraft + ' m (bridge clearance)' : 'No overhead restrictions')}
            {mkRow('Tidal Window', 'HW ± 2h recommended for VLCC')}
            {mkRow('Tide Range', '1.2 – 3.8 m (spring/neap)')}
            {mkRow('Current Strength', 'Up to 3.5 kn in channel')}
            {mkRow('DWT Limit', 'No DWT restriction — draft limiting')}
          </div>
          <div style={{padding:'8px 0'}}>
            <div style={{padding:'6px 12px 4px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>Environmental Restrictions</div>
            {mkRow('ECA Status', 'SOx ECA — 0.1% sulphur cap')}
            {mkRow('NOx Tier', 'Tier III — 2016 onwards')}
            {mkRow('Ballast Water', 'D-2 standard — treatment required')}
            {mkRow('Cold Ironing', 'Available at selected berths')}
          </div>
        </div>
      )
      case 'traffic': return (
        <div style={{padding:'10px 12px'}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Current Vessel Traffic</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr>{['Vessel Name','IMO','Type','Status','ETA/ETD'].map(h=><th key={h} style={{padding:'6px 8px',background:'var(--bg3)',borderBottom:'1px solid var(--bd)',fontSize:8,fontWeight:700,textTransform:'uppercase',color:'var(--txt3)',textAlign:'left'}}>{h}</th>)}</tr></thead>
            <tbody>
              {[['MAERSK COLON','9778532','Container Ship','At Berth','Departed 06:00'],['EURONAV NINA','9320116','Oil Tanker','At Anchor','ETA +4h'],['STELLAR WIND','9534892','LNG Carrier','Inbound','ETA 18:00'],['NORDIC GRACE','9388021','Bulk Carrier','At Berth','ETD 22:00'],['PIONEER MAX','9612988','LPG Carrier','Outbound','Departed 12:30']].map((r,i)=>(
                <tr key={i}><td style={{padding:'6px 8px',borderBottom:'1px solid var(--bd)',fontWeight:600,color:'var(--blue)'}}>{r[0]}</td><td style={{padding:'6px 8px',borderBottom:'1px solid var(--bd)',fontFamily:'monospace',fontSize:10}}>{r[1]}</td><td style={{padding:'6px 8px',borderBottom:'1px solid var(--bd)'}}><span className="tag tN" style={{fontSize:8}}>{r[2]}</span></td><td style={{padding:'6px 8px',borderBottom:'1px solid var(--bd)'}}><span className={`tag ${r[3]==='At Berth'?'tG':'tA'}`} style={{fontSize:8}}>{r[3]}</span></td><td style={{padding:'6px 8px',borderBottom:'1px solid var(--bd)',fontSize:10,color:'var(--txt3)'}}>{r[4]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      case 'psc': return (
        <div>
          <div style={{padding:'8px 0',borderBottom:'1px solid var(--bd)'}}>
            <div style={{padding:'6px 12px 4px',fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5}}>PSC Overview</div>
            {mkRow('PSC Authority', p.pscAuth)}
            {mkRow('MOU Region', p.mou)}
            {mkRow('Total Inspections YTD', '847 inspections')}
            {mkRow('Detentions YTD', '23 detentions (2.7% detention rate)')}
            {mkRow('Priority Vessel Profile', 'Vessels >15 years, previous deficiencies')}
          </div>
          <div style={{padding:'10px 12px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Recent Detentions at {p.name}</div>
            {[['OCEAN PRIDE','9341122','14 deficiencies','2024-01-30','Detained'],['SUNRISE CARRIER','9412888','8 deficiencies','2024-01-15','Released'],['PIONEER TRADER','9499283','11 deficiencies','2023-12-20','Released']].map((r,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--bd)'}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--blue)',flex:1}}>{r[0]}</span>
                <span style={{fontSize:9,fontFamily:'monospace',color:'var(--txt3)'}}>{r[1]}</span>
                <span className="tag tA" style={{fontSize:8}}>{r[2]}</span>
                <span style={{fontSize:10,color:'var(--txt3)'}}>{r[3]}</span>
                <span className={`tag ${r[4]==='Detained'?'tR':'tG'}`} style={{fontSize:8}}>{r[4]}</span>
              </div>
            ))}
          </div>
        </div>
      )
      default: return null
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
      {/* Search */}
      <div className="sBar">
        <div className="siWrap"><span className="siIc">🔍</span><input className="si" placeholder="Search port name, LOCODE, country, MOU region…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="fSel" value={mouFilter} onChange={e=>setMouFilter(e.target.value)}>
          <option value="">All MOU Regions</option>
          {Object.keys(MOU_COLORS).map(m=><option key={m}>{m}</option>)}
        </select>
        <select className="fSel" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="">All Port Types</option>
          {['Commercial / Container','Oil Terminal','Bulk Terminal','LNG Terminal','RoRo / Ferry','Passenger / Cruise'].map(t=><option key={t}>{t}</option>)}
        </select>
        <button className="btn btnP">🔍 Search</button>
        <button className="btn btnT">🗺 Map View</button>
      </div>
      {/* KPI chips */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'8px 14px',background:'var(--bg2)',borderBottom:'1px solid var(--bd)'}}>
        {[['9,241','Total Ports'],['2,144','Terminals'],['847','Anchorages'],['73%','Avg Congestion'],['4,882','PSC Authorities'],['12','MOU Regions']].map(([v,l])=>(
          <div key={l} style={{display:'flex',flexDirection:'column',gap:1,background:'#fff',border:'1px solid var(--bd)',borderRadius:4,padding:'6px 10px',minWidth:80}}>
            <div style={{fontSize:16,fontWeight:700,color:'var(--txt)'}}>{v}</div>
            <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.3}}>{l}</div>
          </div>
        ))}
      </div>
      {/* 3-column layout */}
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr 380px',flex:1,minHeight:0,overflow:'hidden'}}>
        {/* Port List */}
        <div style={{borderRight:'1px solid var(--bd)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'8px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--bd)',background:'var(--bg3)',flexShrink:0}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--txt)'}}>PORTS & TERMINALS</span>
            <span style={{fontSize:10,color:'var(--txt3)'}}>{filtered.length} ports</span>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {filtered.map(p => {
              const cPct = Math.round(p.congest*100)
              const cClr = p.congest>0.75?'#c8102e':p.congest>0.5?'#b45309':'#137333'
              const mouClr = MOU_COLORS[p.mou]||'#717a85'
              return (
                <div key={p.id} onClick={()=>selectPort(p)} style={{padding:'10px 12px',borderBottom:'1px solid var(--bd)',cursor:'pointer',background:selPort?.id===p.id?'var(--bg2)':'#fff',borderLeft:selPort?.id===p.id?'3px solid var(--sp-red)':'3px solid transparent'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--txt)',flex:1}}>⚓ {p.name}</span>
                    <span style={{background:mouClr+'22',color:mouClr,fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:4}}>{p.mou.replace(' MOU','')}</span>
                  </div>
                  <div style={{display:'flex',gap:8,fontSize:10,color:'var(--txt3)',marginBottom:4}}>
                    <span>{p.country}</span>
                    <span style={{fontFamily:'monospace'}}>{p.locode}</span>
                    <span className="tag tN" style={{fontSize:8}}>{p.type.split('/')[0].trim()}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{flex:1,height:4,background:'var(--bg3)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',background:cClr,width:`${cPct}%`}}/></div>
                    <span style={{fontSize:9,color:cClr,fontWeight:600}}>{cPct}%</span>
                    <span style={{fontSize:9,color:'var(--txt3)',marginLeft:'auto'}}>{p.calls.toLocaleString()} calls/yr</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Map */}
        <div style={{position:'relative'}}>
          <div ref={mapElRef} style={{width:'100%',height:'100%'}}/>
          <div style={{position:'absolute',bottom:8,left:8,background:'rgba(26,29,31,.85)',color:'rgba(255,255,255,.85)',fontSize:10,fontWeight:600,padding:'4px 10px',borderRadius:4,backdropFilter:'blur(4px)',zIndex:1000,pointerEvents:'none'}}>
            ⚓ 9,241 ports · 847 anchorages · 2,144 terminals
          </div>
        </div>
        {/* Port Detail */}
        <div style={{borderLeft:'1px solid var(--bd)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {!selPort ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:40,color:'var(--txt3)',flex:1}}>
              <span style={{fontSize:40}}>⚓</span>
              <span style={{fontSize:13,fontWeight:600}}>Select a port</span>
              <span style={{fontSize:11,textAlign:'center'}}>Click a port in the list or on the map to view detailed information</span>
            </div>
          ) : (
            <>
              <div style={{padding:'12px 14px',borderBottom:'1px solid var(--bd)',flexShrink:0,background:'var(--nav-bg)'}}>
                <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>⚓ {selPort.name}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:2}}>{selPort.country} · {selPort.locode} · <span style={{background:MOU_COLORS[selPort.mou]+'44',color:MOU_COLORS[selPort.mou],fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3}}>{selPort.mou}</span></div>
              </div>
              <div style={{display:'flex',borderBottom:'1px solid var(--bd)',flexShrink:0,background:'var(--bg2)'}}>
                {PORT_TABS.map(t=>(
                  <div key={t} onClick={()=>setPdTab(t)} style={{padding:'8px 10px',fontSize:10,fontWeight:600,cursor:'pointer',borderBottom:`2px solid ${pdTab===t?'var(--sp-red)':'transparent'}`,color:pdTab===t?'var(--txt)':'var(--txt3)',whiteSpace:'nowrap'}}>
                    {TAB_LABELS[t]}
                  </div>
                ))}
              </div>
              <div style={{flex:1,overflowY:'auto'}}>{renderTabContent(selPort)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
