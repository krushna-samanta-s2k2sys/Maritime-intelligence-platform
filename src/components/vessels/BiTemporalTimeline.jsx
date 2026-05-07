import { useRef } from 'react'

export default function BiTemporalTimeline({
  vessel, curDate, onDateChange,
  dateToPct, jumpToMilestone, events,
  TL_START_YR, TL_END_YR
}) {
  const trackRef = useRef(null)

  if (!vessel) return null

  const cp = dateToPct(curDate)

  // Year labels
  const years = []
  for (let y = TL_START_YR; y <= TL_END_YR; y++) {
    years.push({ y, pct: dateToPct(y + '-01-01') })
  }

  // Find last milestone at or before curDate, and next milestone after
  let lastMilestone = null
  let nextMilestone = null
  events.forEach(e => { if (e.date <= curDate) lastMilestone = e })
  for (let j = 0; j < events.length; j++) {
    if (events[j].date > curDate) { nextMilestone = events[j]; break }
  }

  function handleTrackClick(e) {
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onDateChange && onDateChange(pctToDate(pct))
  }

  function pctToDate(pct) {
    const TL_START_MS = new Date(TL_START_YR + '-01-01').getTime()
    const TL_END_MS = new Date(TL_END_YR + '-01-01').getTime()
    const ms = TL_START_MS + pct * (TL_END_MS - TL_START_MS)
    const d = new Date(ms)
    const pad = n => n < 10 ? '0' + n : String(n)
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
  }

  return (
    <div className="tlZone">
      <div className="tlZoneHdr">
        <span className="tlZoneLabel">Bi-Temporal Calendar</span>
        <span className="tlDateDisp">{curDate}</span>
      </div>

      <div className="tlRulerWrap">
        <div
          className="tlTrack"
          ref={trackRef}
          onClick={handleTrackClick}
        >
          <div
            className="tlProgress"
            style={{ width: cp.toFixed(1) + '%' }}
          />

          {/* Milestone pins */}
          <div id="tlPins" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none' }}>
            {events.map((ev, i) => {
              const ep = dateToPct(ev.date)
              const past = ev.date <= curDate
              return (
                <div
                  key={i}
                  className={'tlPin' + (past ? ' past' : '')}
                  style={{ left: ep.toFixed(1) + '%', pointerEvents: 'all' }}
                  title={ev.label + ' (' + ev.date + ')'}
                  onClick={e => { e.stopPropagation(); jumpToMilestone(i) }}
                >
                  <div className="tlPinNode" style={{ background: ev.color }}>{ev.icon}</div>
                  <div className="tlPinLabel">{ev.label}</div>
                </div>
              )
            })}
          </div>

          {/* Cursor */}
          <div className="tlCursor" style={{ left: cp.toFixed(1) + '%' }}>
            <div className="tlCursorLine" />
            <div className="tlCursorLabel">{curDate}</div>
          </div>
        </div>

        {/* Year labels */}
        <div className="tlYears">
          {years.map(({ y, pct }) => (
            <div
              key={y}
              className="tlYrLbl"
              style={{ left: pct.toFixed(1) + '%' }}
            >{y}</div>
          ))}
        </div>
      </div>

      {/* Info bar */}
      <div className="tlInfoBar">
        <span style={{ color: 'var(--txt3)' }}>At:&nbsp;</span>
        <strong style={{ fontFamily: 'monospace' }}>{curDate}</strong>
        {lastMilestone && (
          <>
            &nbsp;&nbsp;<span style={{ color: 'var(--bd2)' }}>|</span>&nbsp;&nbsp;
            {lastMilestone.icon}&nbsp;
            <span style={{ color: 'var(--txt2)' }}>{lastMilestone.label}</span>
          </>
        )}
        {nextMilestone && (
          <span style={{ color: 'var(--txt3)', fontSize: 9 }}>
            &nbsp;&nbsp;→ Next: {nextMilestone.label} ({nextMilestone.date})
          </span>
        )}
      </div>
    </div>
  )
}
