// Filter configuration — describes every filterable vessel attribute.
// filterType: 'multiselect' | 'range' | 'typeahead'
// getValues(vessels) — for multiselect: returns [{value, label, count}]
// apply(vessels, f)  — filters vessel array by filter object f
// describe(f)        — human-readable chip label for the filter

function numOf(str) { return Number(String(str).replace(/[,km]/gi, '')) }

export const FILTER_GROUPS = [
  { id: 'identity',    label: 'Identity' },
  { id: 'type',        label: 'Vessel Type' },
  { id: 'status',      label: 'Status & Compliance' },
  { id: 'tonnage',     label: 'Tonnage & Size' },
  { id: 'dimensions',  label: 'Dimensions' },
  { id: 'ownership',   label: 'Ownership & Management' },
  { id: 'class',       label: 'Classification' },
  { id: 'technical',   label: 'Technical' },
]

export const FILTER_CONFIGS = [
  // ── Identity ──────────────────────────────────────────────
  {
    id: 'name', label: 'Vessel Name', group: 'identity', filterType: 'typeahead',
    describe: f => `Name: "${f.query}"`,
    apply: (vs, f) => vs.filter(v => v.nm.toLowerCase().includes(f.query.toLowerCase())),
  },
  {
    id: 'imo', label: 'IMO Number', group: 'identity', filterType: 'typeahead',
    describe: f => `IMO: ${f.query}`,
    apply: (vs, f) => vs.filter(v => v.imo.includes(f.query)),
  },
  {
    id: 'mmsi', label: 'MMSI', group: 'identity', filterType: 'typeahead',
    describe: f => `MMSI: ${f.query}`,
    apply: (vs, f) => vs.filter(v => v.mmsi.includes(f.query)),
  },
  {
    id: 'callsign', label: 'Call Sign', group: 'identity', filterType: 'typeahead',
    describe: f => `Call Sign: ${f.query}`,
    apply: (vs, f) => vs.filter(v => (v.cs||'').toLowerCase().includes(f.query.toLowerCase())),
  },

  // ── Vessel Type ───────────────────────────────────────────
  {
    id: 'type', label: 'Ship Type', group: 'type', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.forEach(v => { m[v.ty] = (m[v.ty]||0)+1 })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: value, count }))
    },
    describe: f => `Type: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.ty)),
  },
  {
    id: 'flag', label: 'Flag State', group: 'identity', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.forEach(v => { if (!m[v.fn]) m[v.fn] = { count:0, emoji: v.flag }; m[v.fn].count++ })
      return Object.entries(m).sort((a,b) => b[1].count-a[1].count)
        .map(([value, {count,emoji}]) => ({ value, label: `${emoji} ${value}`, count }))
    },
    describe: f => `Flag: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.fn)),
  },

  // ── Status ────────────────────────────────────────────────
  {
    id: 'status', label: 'Vessel Status', group: 'status', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.forEach(v => { m[v.st] = (m[v.st]||0)+1 })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: value, count }))
    },
    describe: f => `Status: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.st)),
  },

  // ── Tonnage & Size ─────────────────────────────────────────
  {
    id: 'dwt', label: 'DWT (tonnes)', group: 'tonnage', filterType: 'range',
    describe: f => `DWT: ${f.min!=null?f.min.toLocaleString():'0'} – ${f.max!=null?f.max.toLocaleString():'∞'}`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.dwt)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },
  {
    id: 'gt', label: 'Gross Tonnage', group: 'tonnage', filterType: 'range',
    describe: f => `GT: ${f.min!=null?f.min.toLocaleString():'0'} – ${f.max!=null?f.max.toLocaleString():'∞'}`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.gt)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },
  {
    id: 'nt', label: 'Net Tonnage', group: 'tonnage', filterType: 'range',
    describe: f => `NT: ${f.min!=null?f.min.toLocaleString():'0'} – ${f.max!=null?f.max.toLocaleString():'∞'}`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.nt)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },
  {
    id: 'builtYear', label: 'Year Built', group: 'tonnage', filterType: 'range',
    describe: f => `Built: ${f.min??''} – ${f.max??''}`,
    apply: (vs, f) => vs.filter(v => {
      if (f.min != null && v.yr < f.min) return false
      if (f.max != null && v.yr > f.max) return false
      return true
    }),
  },

  // ── Dimensions ────────────────────────────────────────────
  {
    id: 'loa', label: 'LOA (m)', group: 'dimensions', filterType: 'range',
    describe: f => `LOA: ${f.min??'0'}m – ${f.max??'∞'}m`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.loa)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },
  {
    id: 'beam', label: 'Beam (m)', group: 'dimensions', filterType: 'range',
    describe: f => `Beam: ${f.min??'0'}m – ${f.max??'∞'}m`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.beam)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },
  {
    id: 'depth', label: 'Depth (m)', group: 'dimensions', filterType: 'range',
    describe: f => `Depth: ${f.min??'0'}m – ${f.max??'∞'}m`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.depth)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },
  {
    id: 'maxDraft', label: 'Max Draft (m)', group: 'dimensions', filterType: 'range',
    describe: f => `Max Draft: ${f.min??'0'}m – ${f.max??'∞'}m`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.maxDraft)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },

  // ── Ownership ─────────────────────────────────────────────
  {
    id: 'owner', label: 'Owner', group: 'ownership', filterType: 'typeahead',
    describe: f => `Owner: "${f.query}"`,
    apply: (vs, f) => vs.filter(v => (v.ow||'').toLowerCase().includes(f.query.toLowerCase())),
  },
  {
    id: 'operator', label: 'Operator', group: 'ownership', filterType: 'typeahead',
    describe: f => `Operator: "${f.query}"`,
    apply: (vs, f) => vs.filter(v => (v.op||'').toLowerCase().includes(f.query.toLowerCase())),
  },
  {
    id: 'manager', label: 'Manager', group: 'ownership', filterType: 'typeahead',
    describe: f => `Manager: "${f.query}"`,
    apply: (vs, f) => vs.filter(v => (v.mg||'').toLowerCase().includes(f.query.toLowerCase())),
  },
  {
    id: 'pi', label: 'P&I Club', group: 'ownership', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.forEach(v => { if (v.pi) { m[v.pi] = (m[v.pi]||0)+1 } })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: value, count }))
    },
    describe: f => `P&I: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.pi)),
  },

  // ── Classification ────────────────────────────────────────
  {
    id: 'class', label: 'Classification Society', group: 'class', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.forEach(v => { m[v.cls] = (m[v.cls]||0)+1 })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: value, count }))
    },
    describe: f => `Class: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.cls)),
  },
  {
    id: 'iceClass', label: 'Ice Class', group: 'class', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.filter(v => v.ice && v.ice !== 'None').forEach(v => { m[v.ice] = (m[v.ice]||0)+1 })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: value, count }))
    },
    describe: f => `Ice Class: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.ice)),
  },

  // ── Technical ─────────────────────────────────────────────
  {
    id: 'propulsion', label: 'Propulsion Type', group: 'technical', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.forEach(v => { if (v.prp) { m[v.prp] = (m[v.prp]||0)+1 } })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: value, count }))
    },
    describe: f => `Propulsion: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.prp)),
  },
  {
    id: 'fuel', label: 'Fuel Type', group: 'technical', filterType: 'multiselect',
    getValues: vs => {
      const m = {}
      vs.forEach(v => { if (v.fuel) { m[v.fuel] = (m[v.fuel]||0)+1 } })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: value, count }))
    },
    describe: f => `Fuel: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.fuel)),
  },
  {
    id: 'builtCountry', label: 'Country Built', group: 'technical', filterType: 'multiselect',
    getValues: vs => {
      const LABELS = { KR:'South Korea', JP:'Japan', CN:'China', DE:'Germany', NO:'Norway', SG:'Singapore', FR:'France' }
      const m = {}
      vs.forEach(v => { if (v.builtYard) { m[v.builtYard] = (m[v.builtYard]||0)+1 } })
      return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([value,count]) => ({ value, label: LABELS[value]||value, count }))
    },
    describe: f => `Built In: ${f.values.join(', ')}`,
    apply: (vs, f) => vs.filter(v => f.values.includes(v.builtYard)),
  },
  {
    id: 'mcr', label: 'Power (MCR kW)', group: 'technical', filterType: 'range',
    describe: f => `MCR: ${f.min??'0'}kW – ${f.max??'∞'}kW`,
    apply: (vs, f) => vs.filter(v => {
      const n = numOf(v.mcr)
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    }),
  },
]

// Indexed by id for quick lookup
export const FILTER_MAP = Object.fromEntries(FILTER_CONFIGS.map(f => [f.id, f]))

function isEmptyFilter(f) {
  if (f.type === 'multiselect') return !f.values || f.values.length === 0
  if (f.type === 'range')       return f.min == null && f.max == null
  if (f.type === 'typeahead')   return !f.query || !f.query.trim()
  return false
}

// Apply an array of active filter objects to a vessel array
export function applyFilters(vessels, activeFilters) {
  return activeFilters.reduce((vs, f) => {
    if (isEmptyFilter(f)) return vs
    const cfg = FILTER_MAP[f.fieldId]
    return cfg ? cfg.apply(vs, f) : vs
  }, vessels)
}
