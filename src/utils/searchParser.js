// Smart vessel search parser — converts free-text to structured filters

const TYPE_MAP = {
  'container ship':'Container Ship','container':'Container Ship','feeder':'Container Ship',
  'oil tanker':'Oil Tanker','crude':'Oil Tanker','vlcc':'Oil Tanker','ulcc':'Oil Tanker',
  'suezmax':'Oil Tanker','aframax':'Oil Tanker','tanker':'Oil Tanker',
  'chemical tanker':'Chemical Tanker','chemical':'Chemical Tanker','product tanker':'Chemical Tanker',
  'lng carrier':'LNG Carrier','lng':'LNG Carrier',
  'lpg carrier':'LPG Carrier','lpg':'LPG Carrier',
  'bulk carrier':'Bulk Carrier','bulker':'Bulk Carrier','capesize':'Bulk Carrier',
  'panamax':'Bulk Carrier','supramax':'Bulk Carrier','handymax':'Bulk Carrier','handysize':'Bulk Carrier',
  'general cargo':'General Cargo','general':'General Cargo',
  'car carrier':'Car Carrier','pctc':'Car Carrier','roro':'RoRo','ro-ro':'RoRo','ro ro':'RoRo',
  'offshore supply':'Offshore Supply','psv':'Offshore Supply','ahts':'Offshore Supply',
  'offshore wind':'Offshore Wind','wiv':'Offshore Wind',
  'passenger':'Passenger/Cruise','cruise':'Passenger/Cruise',
  'research vessel':'Research Vessel','research':'Research Vessel',
}

const DWT_RANGES = {
  'vlcc':[200000,350000],'ulcc':[320000,550000],'suezmax':[120000,200000],
  'aframax':[80000,120000],'panamax':[65000,80000],'supramax':[45000,65000],
  'handymax':[35000,50000],'handysize':[15000,35000],'capesize':[100000,400000],
}

const STATUS_MAP = {
  'detained':'Detained','detention':'Detained',
  'drydock':'In Drydock','dry dock':'In Drydock','in drydock':'In Drydock',
  'laid up':'Laid Up','laidup':'Laid Up',
  'in service':'In Service','active':'In Service',
  'total loss':'Total Loss','scrapped':'Total Loss',
}

const FLAG_MAP = {
  'panama':'Panama','liberia':'Liberia','marshall islands':'Marshall Islands','marshall':'Marshall Islands',
  'hong kong':'Hong Kong','singapore':'Singapore','bahamas':'Bahamas','malta':'Malta',
  'cyprus':'Cyprus','greece':'Greece','china':'China','denmark':'Denmark','norway':'Norway',
  'japan':'Japan','south korea':'South Korea','korea':'South Korea','germany':'Germany',
  'uk':'United Kingdom','united kingdom':'United Kingdom','france':'France','belgium':'Belgium',
  'saudi arabia':'Saudi Arabia','saudi':'Saudi Arabia','portugal':'Portugal',
}

const CLASS_MAP = {
  "lloyd's register":"Lloyd's Register",'lloyds':"Lloyd's Register",'lr':"Lloyd's Register",
  'dnv gl':'DNV GL','dnv':'DNV GL','bureau veritas':'Bureau Veritas','bv':'Bureau Veritas',
  'classnk':'ClassNK','nk':'ClassNK','korean register':'Korean Register','kr':'Korean Register',
  'china classification':'China Classification','ccs':'China Classification',
}

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
