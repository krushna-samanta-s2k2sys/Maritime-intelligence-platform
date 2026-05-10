import { useRef, useState, useCallback, useEffect } from 'react'

export default function BiTemporalTimeline({
  vessel, curDate, onDateChange,
  dateToPct, jumpToMilestone, events,
  TL_START_YR, TL_END_YR
}) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  if (!vessel) return null

  const cp = dateToPct(curDate)

  const TL_START_MS = new Date(TL_START_YR + '-01-01').getTime()
  const TL_END_MS   = new Date(TL_END_YR   + '-01-01').getTime()

  function pctToDate(pct) {
    const ms = TL_START_MS + pct * (TL_END_MS - TL_START_MS)
    const d = new Date(ms)
    const pad = n => n < 10 ? '0' + n : String(n)
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
  }

  function posToDate(clientX) {
    if (!trackRef.current) return curDate
    const rect = trackRef.current.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return pctToDate(pct)
  }

  function handleMouseDown(e) {
    e.preventDefault()
    setDragging(true)
    onDateChange?.(posToDate(e.clientX))
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    onDateChange?.(posToDate(e.clientX))
  }, [dragging, onDateChange]) // eslint-disable-line

  const handleMouseUp = useCallback(() => setDragging(false), [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup',   handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  // Year labels
  const years = []
  for (let y = TL_START_YR; y <= TL_END_YR; y++) {
    years.push({ y, pct: dateToPct(y + '-01-01') })
  }

  // Context: which milestone phase we're in
  let lastMilestone = null, nextMilestone = null
  events.forEach(e => { if (e.date <= curDate) lastMilestone = e })
  for (let j = 0; j < events.length; j++) {
    if (events[j].date > curDate) { nextMilestone = events[j]; break }
  }

  return (
    <div className="tlZone">
      <div className="tlZoneHdr">
        <span className="tlZoneLabel">Life of Vessel</span>
        <span className="tlDateDisp">{curDate}</span>
      </div>

      <div className="tlRulerWrap">
        <div
          className={'tlTrack' + (dragging ? ' tlDragging' : '')}
          ref={trackRef}
          onMouseDown={handleMouseDown}
          style={{ cursor: dragging ? 'grabbing' : 'pointer' }}
        >
          <div className="tlProgress" style={{ width: cp.toFixed(1) + '%' }} />

          {/* Milestone pins */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'100%', pointerEvents:'none' }}>
            {events.map((ev, i) => {
              const ep   = dateToPct(ev.date)
              const past = ev.date <= curDate
              return (
                <div
                  key={i}
                  className={'tlPin' + (past ? ' past' : '')}
                  style={{ left: ep.toFixed(1) + '%', pointerEvents: 'all' }}
                  title={ev.label + ' (' + ev.date + ')'}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); jumpToMilestone(i) }}
                >
                  <div className="tlPinNode" style={{ background: ev.color }}>{ev.icon}</div>
                  <div className="tlPinLabel">{ev.label}</div>
                </div>
              )
            })}
          </div>

          {/* Draggable cursor */}
          <div
            className="tlCursor"
            style={{ left: cp.toFixed(1) + '%', cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <div className="tlCursorLine" />
            <div className="tlCursorLabel">{curDate}</div>
          </div>
        </div>

        {/* Year labels */}
        <div className="tlYears">
          {years.map(({ y, pct }) => (
            <div key={y} className="tlYrLbl" style={{ left: pct.toFixed(1) + '%' }}>{y}</div>
          ))}
        </div>
      </div>

      {/* Info bar */}
      <div className="tlInfoBar">
        <span style={{ color:'var(--txt3)' }}>Viewing:&nbsp;</span>
        <strong style={{ fontFamily:'monospace' }}>{curDate}</strong>
        {lastMilestone && (
          <>
            &nbsp;&nbsp;<span style={{ color:'var(--bd2)' }}>|</span>&nbsp;&nbsp;
            {lastMilestone.icon}&nbsp;
            <span style={{ color:'var(--txt2)' }}>{lastMilestone.label}</span>
          </>
        )}
        {nextMilestone && (
          <span style={{ color:'var(--txt3)', fontSize:9 }}>
            &nbsp;&nbsp;→ Next: {nextMilestone.label} ({nextMilestone.date})
          </span>
        )}
      </div>
    </div>
  )
}
