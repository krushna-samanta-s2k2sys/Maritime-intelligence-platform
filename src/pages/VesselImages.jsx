import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const VESSEL_DATA = [
  {id:1,  nm:'PACIFIC STAR',    imo:'9412345',mmsi:'240987654',ty:'Container Ship',  fn:'Greece',         flag:'🇬🇷',yr:2008,dwt:'59,100', st:'In Service'},
  {id:2,  nm:'EASTERN PIONEER', imo:'9287631',mmsi:'566234567',ty:'Oil Tanker',       fn:'Singapore',      flag:'🇸🇬',yr:2004,dwt:'319,000',st:'In Service'},
  {id:3,  nm:'STELLAR WIND',    imo:'9534892',mmsi:'431445566',ty:'LNG Carrier',      fn:'Japan',          flag:'🇯🇵',yr:2011,dwt:'81,200', st:'In Service'},
  {id:4,  nm:'GULF VOYAGER',    imo:'9412340',mmsi:'403123456',ty:'Container Ship',   fn:'Saudi Arabia',   flag:'🇸🇦',yr:2008,dwt:'58,200', st:'In Service'},
  {id:5,  nm:'OCEAN PRIDE',     imo:'9341122',mmsi:'352001234',ty:'Bulk Carrier',     fn:'Panama',         flag:'🇵🇦',yr:2006,dwt:'82,500', st:'Detained'},
  {id:6,  nm:'PACIFIC ATLAS',   imo:'9601234',mmsi:'477881234',ty:'Bulk Carrier',     fn:'Hong Kong',      flag:'🇭🇰',yr:2015,dwt:'82,000', st:'In Service'},
  {id:7,  nm:'NORTHERN STAR',   imo:'9188741',mmsi:'257891234',ty:'Chemical Tanker',  fn:'Norway',         flag:'🇳🇴',yr:2002,dwt:'38,200', st:'In Service'},
  {id:8,  nm:'MAERSK COLON',    imo:'9778532',mmsi:'219001231',ty:'Container Ship',   fn:'Denmark',        flag:'🇩🇰',yr:2017,dwt:'214,000',st:'In Service'},
  {id:9,  nm:'ATLANTIC BULKER', imo:'9501238',mmsi:'311041122',ty:'Bulk Carrier',     fn:'Bahamas',        flag:'🇧🇸',yr:2012,dwt:'176,400',st:'In Drydock'},
  {id:10, nm:'MSC OSCAR',       imo:'9703291',mmsi:'255803000',ty:'Container Ship',   fn:'Portugal',       flag:'🇵🇹',yr:2015,dwt:'197,362',st:'In Service'},
  {id:11, nm:'QUEEN MARY 2',    imo:'9241061',mmsi:'310627000',ty:'Passenger/Cruise', fn:'United Kingdom', flag:'🇬🇧',yr:2004,dwt:'15,809', st:'In Service'},
  {id:12, nm:'PIONEER MAX',     imo:'9612988',mmsi:'538006000',ty:'LPG Carrier',      fn:'Marshall Islands',flag:'🇲🇭',yr:2014,dwt:'48,200', st:'In Service'},
  {id:13, nm:'EURONAV NINA',    imo:'9320116',mmsi:'205001122',ty:'Oil Tanker',        fn:'Belgium',        flag:'🇧🇪',yr:2003,dwt:'308,491',st:'In Service'},
  {id:14, nm:'GLOVIS CAPTAIN',  imo:'9680042',mmsi:'440301122',ty:'Car Carrier',       fn:'South Korea',    flag:'🇰🇷',yr:2014,dwt:'23,900', st:'In Service'},
  {id:15, nm:'NORDIC GRACE',    imo:'9388021',mmsi:'257641122',ty:'Bulk Carrier',      fn:'Marshall Islands',flag:'🇲🇭',yr:2008,dwt:'82,000', st:'Laid Up'},
  {id:16, nm:'BRAVE TERN',      imo:'9593513',mmsi:'259511000',ty:'Offshore Wind',     fn:'Norway',         flag:'🇳🇴',yr:2012,dwt:'18,000', st:'In Service'},
  {id:17, nm:'COSCO UNIVERSE',  imo:'9871234',mmsi:'477111234',ty:'Container Ship',    fn:'China',          flag:'🇨🇳',yr:2020,dwt:'197,800',st:'In Service'},
  {id:18, nm:'SUNRISE CARRIER', imo:'9412888',mmsi:'351881234',ty:'Bulk Carrier',      fn:'Panama',         flag:'🇵🇦',yr:2007,dwt:'76,200', st:'In Service'},
  {id:19, nm:'NORDERNEY',       imo:'9388042',mmsi:'211222000',ty:'RoRo',              fn:'Germany',        flag:'🇩🇪',yr:2008,dwt:'16,200', st:'In Service'},
  {id:20, nm:'BOURBON LIBERTY', imo:'9450993',mmsi:'228082000',ty:'Offshore Supply',   fn:'France',         flag:'🇫🇷',yr:2010,dwt:'4,200',  st:'In Service'},
  {id:21, nm:'LNG JAMAL',       imo:'9234567',mmsi:'441001234',ty:'LNG Carrier',       fn:'South Korea',    flag:'🇰🇷',yr:2008,dwt:'78,900', st:'In Service'},
  {id:22, nm:'DIANA BULKER',    imo:'9501882',mmsi:'538081234',ty:'Bulk Carrier',      fn:'Marshall Islands',flag:'🇲🇭',yr:2013,dwt:'82,100', st:'In Service'},
  {id:23, nm:'ADRIATIC SPIRIT', imo:'9445677',mmsi:'229001122',ty:'Car Carrier',        fn:'Greece',         flag:'🇬🇷',yr:2009,dwt:'21,200', st:'In Service'},
  {id:24, nm:'BOREALIS',        imo:'9484948',mmsi:'218001122',ty:'Research Vessel',   fn:'Germany',        flag:'🇩🇪',yr:2010,dwt:'3,200',  st:'In Service'},
  {id:25, nm:'PIONEER TRADER',  imo:'9499283',mmsi:'636018000',ty:'General Cargo',     fn:'Liberia',        flag:'🇱🇷',yr:2011,dwt:'9,880',  st:'In Service'},
]

const TYPE_OPTS   = ['All Types','Container Ship','Oil Tanker','LNG Carrier','LPG Carrier','Bulk Carrier','Chemical Tanker','Car Carrier','Passenger/Cruise','Offshore Wind','Offshore Supply','RoRo','Research Vessel','General Cargo']
const STATUS_OPTS = ['All Status','In Service','Detained','In Drydock','Laid Up']
const STCLS = {'In Service':'stA','Detained':'stR','In Drydock':'stD','Laid Up':'stI'}

// Vessel-type → Flickr search tags (loremflickr returns real tagged photos)
const TYPE_TAGS = {
  'Container Ship':   'container,ship',
  'Oil Tanker':       'oil,tanker,ship',
  'LNG Carrier':      'lng,tanker,vessel',
  'LPG Carrier':      'lpg,tanker,vessel',
  'Bulk Carrier':     'bulk,carrier,ship',
  'Chemical Tanker':  'chemical,tanker,ship',
  'Car Carrier':      'car,carrier,ship,roro',
  'Passenger/Cruise': 'cruise,ship,passenger',
  'Offshore Wind':    'offshore,wind,vessel',
  'Offshore Supply':  'offshore,supply,vessel',
  'RoRo':             'roro,ferry,ship',
  'Research Vessel':  'research,vessel,ship',
  'General Cargo':    'cargo,ship,vessel',
}

// Deterministic ship photo via loremflickr — pulls real Flickr photos by tag
function photoUrl(ty, imo, idx) {
  const tags = TYPE_TAGS[ty] || 'cargo,ship'
  const lock  = (parseInt(imo.replace(/\D/g,'').slice(-4), 10) * 7 + idx * 31) % 200 + 1
  return `https://loremflickr.com/400/240/${tags}?lock=${lock}`
}

export default function VesselImages() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const [nameQ,   setNameQ]   = useState('')
  const [imoQ,    setImoQ]    = useState(() => searchParams.get('imo') || '')
  const [mmsiQ,   setMmsiQ]   = useState('')
  const [typeQ,   setTypeQ]   = useState('')
  const [statusQ, setStatusQ] = useState('')
  const [slides,  setSlides]  = useState({})  // { imo: currentIndex }

  const filtered = useMemo(() => VESSEL_DATA.filter(v => {
    if (nameQ   && !v.nm.toLowerCase().includes(nameQ.toLowerCase().trim()))  return false
    if (imoQ    && !v.imo.includes(imoQ.trim()))                               return false
    if (mmsiQ   && !v.mmsi.includes(mmsiQ.trim()))                             return false
    if (typeQ   && v.ty !== typeQ)                                              return false
    if (statusQ && v.st !== statusQ)                                            return false
    return true
  }), [nameQ, imoQ, mmsiQ, typeQ, statusQ])

  function prevSlide(imo) { setSlides(p => ({ ...p, [imo]: ((p[imo] || 0) + 4) % 5 })) }
  function nextSlide(imo) { setSlides(p => ({ ...p, [imo]: ((p[imo] || 0) + 1) % 5 })) }

  function clearAll() { setNameQ(''); setImoQ(''); setMmsiQ(''); setTypeQ(''); setStatusQ('') }
  const hasFilters = nameQ || imoQ || mmsiQ || typeQ || statusQ

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', minHeight:0 }}>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="sBar" style={{ flexWrap:'wrap', rowGap:6 }}>
        <div className="siWrap" style={{ flex:'1 1 180px', minWidth:150 }}>
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Vessel name…" value={nameQ}
            onChange={e => setNameQ(e.target.value)} />
          {nameQ && <button className="siClear" onClick={() => setNameQ('')}>✕</button>}
        </div>
        <div className="siWrap" style={{ flex:'0 0 130px' }}>
          <span className="siIc" style={{ fontSize:10 }}>IMO</span>
          <input className="si" placeholder="9XXXXXX…" value={imoQ}
            onChange={e => setImoQ(e.target.value)} />
          {imoQ && <button className="siClear" onClick={() => setImoQ('')}>✕</button>}
        </div>
        <div className="siWrap" style={{ flex:'0 0 145px' }}>
          <span className="siIc" style={{ fontSize:10 }}>MMSI</span>
          <input className="si" placeholder="MMSI…" value={mmsiQ}
            onChange={e => setMmsiQ(e.target.value)} />
          {mmsiQ && <button className="siClear" onClick={() => setMmsiQ('')}>✕</button>}
        </div>
        <select className="fSel" value={typeQ} onChange={e => setTypeQ(e.target.value)}>
          {TYPE_OPTS.map(t => <option key={t} value={t === 'All Types' ? '' : t}>{t}</option>)}
        </select>
        <select className="fSel" value={statusQ} onChange={e => setStatusQ(e.target.value)}>
          {STATUS_OPTS.map(s => <option key={s} value={s === 'All Status' ? '' : s}>{s}</option>)}
        </select>
        {hasFilters && (
          <button className="btn btnS btnSm" onClick={clearAll}>✕ Clear</button>
        )}
        <div style={{ marginLeft:'auto', fontSize:11, color:'var(--txt3)', whiteSpace:'nowrap', alignSelf:'center' }}>
          <strong style={{ color:'var(--txt)' }}>{filtered.length}</strong> / {VESSEL_DATA.length} vessels
        </div>
      </div>

      {/* ── Image grid ────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 28px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--txt3)' }}>
            <div style={{ fontSize:40, marginBottom:14, opacity:.4 }}>🚢</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--txt2)', marginBottom:6 }}>No vessels found</div>
            <div style={{ fontSize:11, lineHeight:1.6 }}>Try adjusting your filters or clearing the search</div>
          </div>
        ) : (
          <div className="viGrid">
            {filtered.map(v => {
              const idx = slides[v.imo] || 0
              return (
                <div key={v.id} className="viCard">
                  {/* Photo with prev/next nav */}
                  <div className="viCardImgWrap">
                    <img
                      src={photoUrl(v.ty, v.imo, idx)}
                      alt={v.nm}
                      className="viCardImg"
                      loading="lazy"
                      onError={e => { e.target.src = `https://loremflickr.com/400/240/ship,vessel?lock=${v.id}` }}
                    />
                    <div className="viCardNavOverlay">
                      <button className="viCardNavBtn" onClick={e => { e.stopPropagation(); prevSlide(v.imo) }}>‹</button>
                      <span className="viCardNavCount">{idx + 1} / 5</span>
                      <button className="viCardNavBtn" onClick={e => { e.stopPropagation(); nextSlide(v.imo) }}>›</button>
                    </div>
                    <span className={`stBadge ${STCLS[v.st] || 'stI'}`}
                      style={{ position:'absolute', top:9, right:9, fontSize:8.5, zIndex:2 }}>
                      <span className="stDot" />{v.st}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="viCardBody" onClick={() => navigate(`/vessels?imo=${v.imo}`)}>
                    <div className="viCardTop">
                      <span className="viCardFlag">{v.flag}</span>
                      <span className="viCardType">{v.ty}</span>
                    </div>
                    <div className="viCardName">{v.nm}</div>
                    <div className="viCardMeta">
                      <span><span className="viMetaLbl">IMO</span>{v.imo}</span>
                      <span><span className="viMetaLbl">MMSI</span>{v.mmsi}</span>
                    </div>
                    <div className="viCardMeta" style={{ marginTop:3 }}>
                      <span><span className="viMetaLbl">Flag</span>{v.fn}</span>
                      <span><span className="viMetaLbl">Built</span>{v.yr}</span>
                      <span><span className="viMetaLbl">DWT</span>{v.dwt} MT</span>
                    </div>
                    <button className="viProfileBtn">📋 View Full Profile →</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
