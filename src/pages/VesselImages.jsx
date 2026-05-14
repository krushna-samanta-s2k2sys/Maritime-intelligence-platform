import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { VESSELS, STATUS_CLASSES } from '../data/vessels'
import { VESSEL_TYPES, VESSEL_STATUSES } from '../data/fieldTypes'

const TYPE_OPTS   = ['All Types', ...VESSEL_TYPES.map(t => t.name)]
const STATUS_OPTS = ['All Status', ...VESSEL_STATUSES.map(s => s.name)]

// Deterministic photo via picsum.photos — seed keeps the same image per vessel/slide
function photoUrl(imo, idx) {
  return `https://picsum.photos/seed/${imo}_${idx}/400/240`
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

  const filtered = useMemo(() => VESSELS.filter(v => {
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
          <strong style={{ color:'var(--txt)' }}>{filtered.length}</strong> / {VESSELS.length} vessels
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
                      src={photoUrl(v.imo, idx)}
                      alt={v.nm}
                      className="viCardImg"
                      loading="lazy"
                      onError={e => { e.target.src = `https://picsum.photos/seed/${v.id}/400/240` }}
                    />
                    <div className="viCardNavOverlay">
                      <button className="viCardNavBtn" onClick={e => { e.stopPropagation(); prevSlide(v.imo) }}>‹</button>
                      <span className="viCardNavCount">{idx + 1} / 5</span>
                      <button className="viCardNavBtn" onClick={e => { e.stopPropagation(); nextSlide(v.imo) }}>›</button>
                    </div>
                    <span className={`stBadge ${STATUS_CLASSES[v.st] || 'stI'}`}
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
