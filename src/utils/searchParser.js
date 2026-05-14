// Smart vessel search parser — converts free-text to structured filters

import searchConfig from '../data/json/search_config.json'

const TYPE_MAP   = searchConfig.type_map
const DWT_RANGES = searchConfig.dwt_ranges
const STATUS_MAP = searchConfig.status_map
const FLAG_MAP   = searchConfig.flag_map
const CLASS_MAP  = searchConfig.class_map

// Parse token key:value pairs and range expressions, returns { textQuery, filters }
export function parseSearch(raw) {
  if (!raw || !raw.trim()) return { textQuery: '', filters: {} }

  const filters = {}
  let q = raw.trim()

  // Extract explicit key:value tokens  e.g. type:container  flag:panama  dwt:50000-100000
  q = q.replace(/\b(type|shiptype|flag|country|status|class|owner|manager|imo|mmsi):([^\s]+)/gi, (_, k, v) => {
    const key = k.toLowerCase(), val = v.toLowerCase()
    if (key === 'type' || key === 'shiptype') filters.type = TYPE_MAP[val] || v
    else if (key === 'flag' || key === 'country') filters.flag = FLAG_MAP[val] || v
    else if (key === 'status') filters.status = STATUS_MAP[val] || v
    else if (key === 'class') filters.cls = CLASS_MAP[val] || v
    else if (key === 'owner') filters.owner = v
    else if (key === 'manager') filters.manager = v
    return ''
  })

  // Range tokens: dwt>50000  gt<=100000  built>2010  year:2015-2020
  q = q.replace(/\b(dwt|gt|loa|built|year|yr)([<>]=?)(\d+)/gi, (_, k, op, n) => {
    const key = k.toLowerCase(), num = Number(n)
    if (key === 'dwt') {
      if (op === '>' || op === '>=') filters.dwtMin = op === '>=' ? num : num + 1
      else filters.dwtMax = op === '<=' ? num : num - 1
    } else if (key === 'gt') {
      if (op === '>' || op === '>=') filters.gtMin = op === '>=' ? num : num + 1
      else filters.gtMax = op === '<=' ? num : num - 1
    } else if (key === 'built' || key === 'year' || key === 'yr') {
      if (op === '>' || op === '>=') filters.yearMin = op === '>=' ? num : num + 1
      else filters.yearMax = op === '<=' ? num : num - 1
    }
    return ''
  })

  const lower = q.toLowerCase()

  // Detect ship type keywords in remaining text (longest match first)
  if (!filters.type) {
    const sorted = Object.keys(TYPE_MAP).sort((a, b) => b.length - a.length)
    for (const alias of sorted) {
      if (lower.includes(alias)) {
        filters.type = TYPE_MAP[alias]
        q = q.replace(new RegExp(alias, 'gi'), '')
        break
      }
    }
  }

  // DWT range from vessel class keywords
  if (filters.dwtMin === undefined && filters.dwtMax === undefined) {
    for (const [alias, [min, max]] of Object.entries(DWT_RANGES)) {
      if (lower.includes(alias)) {
        filters.dwtMin = min; filters.dwtMax = max
        q = q.replace(new RegExp(alias, 'gi'), '')
        break
      }
    }
  }

  // Status keywords
  if (!filters.status) {
    const sorted = Object.keys(STATUS_MAP).sort((a, b) => b.length - a.length)
    for (const alias of sorted) {
      if (lower.includes(alias)) {
        filters.status = STATUS_MAP[alias]
        q = q.replace(new RegExp(alias, 'gi'), '')
        break
      }
    }
  }

  // Flag keywords
  if (!filters.flag) {
    const sorted = Object.keys(FLAG_MAP).sort((a, b) => b.length - a.length)
    for (const alias of sorted) {
      if (lower.includes(alias)) {
        filters.flag = FLAG_MAP[alias]
        q = q.replace(new RegExp(alias, 'gi'), '')
        break
      }
    }
  }

  return { textQuery: q.replace(/\s+/g, ' ').trim(), filters }
}

// Apply parsed search result to a vessel array
export function applySearch(vessels, { textQuery, filters }) {
  let res = vessels

  if (filters.type)
    res = res.filter(v => v.ty === filters.type || v.ty.toLowerCase().includes(filters.type.toLowerCase()))
  if (filters.status)
    res = res.filter(v => v.st === filters.status)
  if (filters.flag)
    res = res.filter(v => v.fn.toLowerCase().includes(filters.flag.toLowerCase()))
  if (filters.cls)
    res = res.filter(v => v.cls.toLowerCase().includes(filters.cls.toLowerCase()))
  if (filters.owner)
    res = res.filter(v => v.ow.toLowerCase().includes(filters.owner.toLowerCase()))
  if (filters.manager)
    res = res.filter(v => v.mg.toLowerCase().includes(filters.manager.toLowerCase()))
  if (filters.dwtMin !== undefined)
    res = res.filter(v => Number(v.dwt.replace(/,/g,'')) >= filters.dwtMin)
  if (filters.dwtMax !== undefined)
    res = res.filter(v => Number(v.dwt.replace(/,/g,'')) <= filters.dwtMax)
  if (filters.yearMin !== undefined)
    res = res.filter(v => v.yr >= filters.yearMin)
  if (filters.yearMax !== undefined)
    res = res.filter(v => v.yr <= filters.yearMax)

  if (textQuery) {
    const q = textQuery.toLowerCase()
    res = res.filter(v =>
      v.nm.toLowerCase().includes(q) || v.imo.includes(q) || v.mmsi.includes(q) ||
      v.fn.toLowerCase().includes(q) || v.ow.toLowerCase().includes(q) ||
      v.mg.toLowerCase().includes(q) || v.ty.toLowerCase().includes(q)
    )
  }

  return res
}

// Human-readable summary of what the search parsed
export function describeFilters({ textQuery, filters }) {
  const parts = []
  if (filters.type)   parts.push(`Type: ${filters.type}`)
  if (filters.flag)   parts.push(`Flag: ${filters.flag}`)
  if (filters.status) parts.push(`Status: ${filters.status}`)
  if (filters.cls)    parts.push(`Class: ${filters.cls}`)
  if (filters.owner)  parts.push(`Owner: "${filters.owner}"`)
  if (filters.manager) parts.push(`Manager: "${filters.manager}"`)
  if (filters.dwtMin !== undefined || filters.dwtMax !== undefined)
    parts.push(`DWT: ${filters.dwtMin ?? '0'} – ${filters.dwtMax ?? '∞'}`)
  if (filters.yearMin !== undefined || filters.yearMax !== undefined)
    parts.push(`Built: ${filters.yearMin ?? ''} – ${filters.yearMax ?? ''}`)
  if (textQuery) parts.push(`Text: "${textQuery}"`)
  return parts
}
