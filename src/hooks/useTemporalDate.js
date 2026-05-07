import { useState, useCallback } from 'react'
import { buildTimeline } from '../data/vesselTimeline'

export function useTemporalDate(vessel) {
  const [curDate, setCurDate] = useState('2024-01-30')

  const TL_START_YR = vessel ? vessel.yr - 1 : 2000
  const TL_END_YR = 2025
  const TL_START_MS = new Date(TL_START_YR + '-01-01').getTime()
  const TL_END_MS = new Date(TL_END_YR + '-01-01').getTime()

  const dateToPct = useCallback((ds) => {
    return Math.max(0, Math.min(100,
      (new Date(ds).getTime() - TL_START_MS) / (TL_END_MS - TL_START_MS) * 100
    ))
  }, [TL_START_MS, TL_END_MS])

  const clickTimeline = useCallback((pct) => {
    const ms = TL_START_MS + pct * (TL_END_MS - TL_START_MS)
    const d = new Date(ms)
    const pad = n => n < 10 ? '0' + n : String(n)
    setCurDate(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()))
  }, [TL_START_MS, TL_END_MS])

  const jumpToMilestone = useCallback((idx) => {
    if (!vessel) return
    const evts = buildTimeline(vessel)
    setCurDate(evts[idx].date)
  }, [vessel])

  const events = vessel ? buildTimeline(vessel) : []

  return {
    curDate, setCurDate, dateToPct, clickTimeline, jumpToMilestone,
    events, TL_START_YR, TL_END_YR, TL_START_MS, TL_END_MS
  }
}
