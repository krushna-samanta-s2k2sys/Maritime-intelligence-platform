import { getEntityFields } from './entities'

export function pad2(n) { return n < 10 ? '0' + n : String(n) }

export function buildTimeline(v) {
  const yr = v.yr
  const evts = [
    {date:yr+'-03-01',         label:'Keel Laid',    type:'build',   icon:'🏗', color:'#1558d6'},
    {date:yr+'-07-15',         label:'Launch',       type:'launch',  icon:'⛵', color:'#0094b3'},
    {date:yr+'-09-30',         label:'Delivery',     type:'delivery',icon:'🚢', color:'#137333'},
    {date:(yr+5)+'-04-10',     label:'Drydock #1',   type:'maint',   icon:'🔧', color:'#b45309'}
  ]
  if (v.st === 'Detained')  evts.push({date:(yr+10)+'-08-20',label:'PSC Detention',type:'inspect',icon:'🔍',color:'#c8102e'})
  if (yr < 2014)            evts.push({date:(yr+10)+'-07-01', label:'Drydock #2',  type:'maint',  icon:'🔧',color:'#b45309'})
  if (yr < 2010)            evts.push({date:(yr+14)+'-05-20',label:'Owner Change', type:'owner',  icon:'🤝',color:'#6200ea'})
  evts.push({date:'2024-01-30',label:'Latest',type:'current',icon:'📍',color:'#137333'})
  evts.sort((a, b) => a.date.localeCompare(b.date))
  return evts
}

export function getStateAtDate(v, ds) {
  const evts = buildTimeline(v)
  const types = []
  let maint = 0
  evts.forEach(e => {
    if (e.date <= ds) {
      types.push(e.type)
      if (e.type === 'maint') maint++
    }
  })
  return {
    afterDelivery:    types.indexOf('delivery') >= 0,
    afterDrydock1:    maint >= 1,
    afterDrydock2:    maint >= 2,
    afterOwnerChange: types.indexOf('owner')   >= 0,
    afterDetention:   types.indexOf('inspect') >= 0
  }
}

export function getEntityFieldsAtDate(v, key, ds) {
  const cur = getEntityFields(v, key)
  if (!ds || ds >= '2024-01-30') return cur
  const s = getStateAtDate(v, ds)
  if (key === 'imo') {
    return cur.map(f => {
      if (!s.afterDelivery) {
        if (f[0] === 'Vessel Status') return [f[0], 'Under Construction', f[2], f[3]]
        if (f[0] === 'MMSI')          return [f[0], 'Not Assigned', f[2], f[3]]
        if (f[0] === 'Call Sign')     return [f[0], 'Not Assigned', f[2], f[3]]
      }
      return f
    })
  }
  if (key === 'ownership') {
    if (!s.afterDelivery) {
      return cur.map(f => {
        if (f[0] === 'Registered Owner')    return [f[0], v.yard.split(',')[0] + ' (Shipyard)', f[2], f[3]]
        if (f[0] === 'Beneficial Owner')    return [f[0], '—', f[2], f[3]]
        if (f[0] === 'P&I Club')            return [f[0], 'Not Assigned', f[2], f[3]]
        if (f[0] === 'DOC Company')         return [f[0], 'Not Assigned', f[2], f[3]]
        return f
      })
    }
    if (!s.afterOwnerChange && v.yr < 2010) {
      return cur.map(f => {
        if (f[0] === 'Registered Owner')    return [f[0], 'Original Holdings SA', f[2], f[3]]
        if (f[0] === 'Beneficial Owner')    return [f[0], 'Original Holdings SA', f[2], f[3]]
        if (f[0] === 'Commercial Operator') return [f[0], 'Original Holdings SA', f[2], f[3]]
        return f
      })
    }
    return cur
  }
  if (key === 'class') {
    if (!s.afterDelivery) return cur.map(f => [f[0], 'Not Applicable', f[2], f[3]])
    if (!s.afterDrydock1) {
      return cur.map(f => {
        const l = f[0]
        if (l.indexOf('Survey')>=0||l.indexOf('Renewal')>=0||l.indexOf('Annual')>=0||l.indexOf('Due')>=0)
          return [f[0], 'Due ' + pad2(v.yr+5) + '-Q2', f[2], f[3]]
        return f
      })
    }
    return cur
  }
  if (key === 'certs') {
    if (!s.afterDelivery) return cur.map(f => [f[0], 'Not Issued', f[2], f[3]])
    if (!s.afterDrydock1) {
      return cur.map(f => {
        const m = f[1] && f[1].match(/(\d{4})-(\d{2})-(\d{2})/)
        if (m) { const y2 = parseInt(m[1]) - 5; return [f[0], f[1].replace(m[1], String(y2)), f[2], f[3]] }
        return f
      })
    }
    return cur
  }
  if (key === 'flag') {
    if (!s.afterDelivery) {
      return cur.map(f => {
        if (f[0].indexOf('Previous') >= 0) return [f[0], '—', f[2], f[3]]
        return f
      })
    }
    return cur
  }
  if (key === 'ais') {
    if (!s.afterDelivery) return cur.map(f => [f[0], '—', f[2], f[3]])
    return cur
  }
  if (key === 'finance') {
    return cur.map(f => {
      if ((f[0].indexOf('Value')>=0||f[0].indexOf('Market')>=0) && f[1].match(/\$[\d.]+M/)) {
        const num = parseFloat(f[1].replace(/[^0-9.]/g,''))
        if (!isNaN(num)) {
          const yrsAgo = 2024 - parseInt(ds.substr(0,4))
          const old = (num / Math.pow(1.04, yrsAgo)).toFixed(1)
          return [f[0], '$' + old + 'M (est.)', f[2], f[3]]
        }
      }
      return f
    })
  }
  return cur
}

export function getChangedFieldCount(v, key, ds) {
  if (!ds || ds >= '2024-01-30') return 0
  const cur = getEntityFields(v, key)
  const old = getEntityFieldsAtDate(v, key, ds)
  let n = 0
  for (let i = 0; i < Math.min(cur.length, old.length); i++) {
    if (cur[i][1] !== old[i][1]) n++
  }
  return n
}

const ALL_ENTITY_KEYS = [
  'imo','flag','ownership','class','certs','dimensions',
  'construction','propulsion','cargo','safety','ais','finance','portcalls','inspections',
]

export function generateHistory(lbl, vessel, preferredEntityKey, fallbackVal) {
  const yr = vessel ? vessel.yr : 2010

  if (preferredEntityKey) {
    // Build real history by sampling at every lifecycle milestone + vessel birth
    const evts = buildTimeline(vessel)
    const checkDates = ['2024-01-30', ...evts.map(e => e.date), yr + '-01-01']
      .filter((d, i, a) => a.indexOf(d) === i)
      .sort((a, b) => b.localeCompare(a)) // newest → oldest

    const rows = []
    let segVal = null, segSrc = 'IHS Fairplay'

    for (let i = 0; i < checkDates.length; i++) {
      const d = checkDates[i]
      const fields = getEntityFieldsAtDate(vessel, preferredEntityKey, d)
      const fld = fields?.find(f => f[0] === lbl)
      if (!fld) continue
      const v = fld[1], s = fld[2]

      if (segVal === null) {
        // First value found — start the current-era segment
        segVal = v; segSrc = s
        rows.push({ val: v, src: s, from: d, to: null })
      } else if (v !== segVal) {
        // Value changed: the running segment started at the previous date we saw this value
        rows[rows.length - 1] = { ...rows[rows.length - 1], from: checkDates[i - 1] }
        segVal = v; segSrc = s
        rows.push({ val: v, src: s, from: d, to: checkDates[i - 1] })
      }
      // Same value → extend the current segment back in time (handled at end)
    }

    if (rows.length > 0) {
      // Oldest segment extends back to the earliest date we checked
      rows[rows.length - 1] = { ...rows[rows.length - 1], from: checkDates[checkDates.length - 1] }
      return rows
    }
  }

  // Fallback for unmapped fields: synthetic history using the raw current value
  const val = (fallbackVal && fallbackVal !== '—') ? fallbackVal : '—'
  const src = 'IHS Fairplay'
  let prevVal = val
  if (val !== '—' && String(val).match(/^[\d,]+/)) {
    const num = parseFloat(String(val).replace(/,/g, ''))
    if (!isNaN(num))
      prevVal = (num * 0.98).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + String(val).replace(/^[\d,.]+/, '')
  }
  return [
    { val,         src,             from: '2024-01-15',      to: null },
    { val,         src,             from: '2022-09-01',      to: '2024-01-15' },
    { val: prevVal, src: 'IHS Fairplay', from: (yr + 5) + '-03-01', to: '2022-09-01' },
    { val: '—',    src: 'IHS Fairplay', from: yr + '-01-01',        to: (yr + 5) + '-03-01' },
  ]
}
