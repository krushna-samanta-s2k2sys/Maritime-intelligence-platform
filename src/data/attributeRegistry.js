/**
 * attributeRegistry.js — Data-driven replacement for hardcoded attribute JS files.
 *
 * Imports attribute_definitions.json and derives all exports dynamically.
 * This is additive — it does NOT modify attributeTree.js, filterConfig.js,
 * or vesselColumns.js. Consumers can migrate to these exports progressively.
 *
 * Exports (matching the shapes of the files they replace):
 *   attributeTree.js  → ATTRIBUTE_TREE, flattenFilterable, flattenAll, hasAnyFilterable
 *   filterConfig.js   → FILTER_GROUPS, FILTER_CONFIGS, FILTER_MAP, applyFilters
 *   vesselColumns.js  → ALL_VESSEL_COLUMNS, COLUMN_GROUPS
 *   new              → getAttrDefs(entityType), buildAttrTree(entityType)
 */

import defs from './json/attribute_definitions.json'
import { getEntityFieldsAtDate } from './vesselTimeline'

// ─── Internal helpers ────────────────────────────────────────────────────────

function numOf(str) {
  return Number(String(str ?? '').replace(/[,km]/gi, ''))
}

function allAttrs(entityType) {
  const entity = defs.entities[entityType]
  if (!entity) return []
  return entity.sections.flatMap(s =>
    s.groups.flatMap(g =>
      g.attributes.map(a => ({
        ...a,
        _section: s.id,
        _sectionLabel: s.label,
        _group: g.id,
        _groupLabel: g.label,
      }))
    )
  )
}

// ─── getAttrDefs / buildAttrTree ─────────────────────────────────────────────

/** Returns flat array of all attribute defs for an entity type. */
export function getAttrDefs(entityType) {
  return allAttrs(entityType)
}

/** Returns the nested section→group→attribute tree for any entity type. */
export function buildAttrTree(entityType) {
  const entity = defs.entities[entityType]
  if (!entity) return []
  return entity.sections
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(section => ({
      id: section.id,
      label: section.label,
      icon: section.icon,
      children: section.groups
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(group => ({
          id: group.id,
          label: group.label,
          children: group.attributes
            .slice()
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map(attr => ({
              id: attr.id,
              label: attr.label,
              filterId: attr.is_filterable ? attr.key : undefined,
            })),
        })),
    }))
}

// ─── ATTRIBUTE_TREE (vessel — matches attributeTree.js shape) ────────────────

export const ATTRIBUTE_TREE = buildAttrTree('vessel')

/** Flatten only filterable leaves; mirrors the function from attributeTree.js */
export function flattenFilterable(nodes, path = []) {
  const result = []
  for (const node of nodes) {
    const newPath = [...path, node.label]
    if (node.children) {
      result.push(...flattenFilterable(node.children, newPath))
    } else if (node.filterId) {
      result.push({ ...node, path: newPath })
    }
  }
  return result
}

/** Flatten all leaves regardless of filterId */
export function flattenAll(nodes, path = []) {
  const result = []
  for (const node of nodes) {
    const newPath = [...path, node.label]
    if (node.children) {
      result.push(...flattenAll(node.children, newPath))
    } else {
      result.push({ ...node, path: newPath })
    }
  }
  return result
}

/** Returns true if a node or any descendant is filterable */
export function hasAnyFilterable(node) {
  if (node.filterId) return true
  if (node.children) return node.children.some(hasAnyFilterable)
  return false
}

// ─── FILTER_GROUPS ───────────────────────────────────────────────────────────

export const FILTER_GROUPS = defs.filter_groups

// ─── FILTER_CONFIGS ──────────────────────────────────────────────────────────

// Typeahead helpers — mirrors filterConfig.js
function taTerms(f) {
  return f.values?.length ? f.values : (f.query ? [f.query] : [])
}
function taDescribe(label, f) {
  const terms = taTerms(f)
  if (terms.length === 0) return label
  if (terms.length === 1) return `${label}: "${terms[0]}"`
  return `${label}: ${terms.map(t => `"${t}"`).join(', ')}`
}

function buildFilterConfig(attr) {
  const { key, label, filter_type, filter_group, vessel_field, filter_field,
          filter_field_transform, data_type } = attr

  const getField = v => v[filter_field ?? vessel_field] ?? ''

  if (filter_type === 'typeahead') {
    const exact = data_type === 'text' && (key === 'imo_number' || key === 'mmsi_number')
    return {
      id: key,
      label,
      group: filter_group,
      filterType: 'typeahead',
      getFieldValue: getField,
      describe: f => taDescribe(label, f),
      apply: (vs, f) => {
        const terms = taTerms(f)
        if (!terms.length) return vs
        if (exact) {
          return vs.filter(v => {
            const field = String(getField(v))
            return terms.some(t => field.includes(t))
          })
        }
        return vs.filter(v => {
          const field = String(getField(v)).toLowerCase()
          return terms.some(t => field.includes(t.toLowerCase()))
        })
      },
    }
  }

  if (filter_type === 'multiselect') {
    // Special: flag_name adds emoji prefix
    const isFlag = key === 'flag_name'
    return {
      id: key,
      label,
      group: filter_group,
      filterType: 'multiselect',
      getValues: vs => {
        if (isFlag) {
          const m = {}
          vs.forEach(v => {
            const val = v[vessel_field ?? filter_field]
            if (val) {
              if (!m[val]) m[val] = { count: 0, emoji: v.flag }
              m[val].count++
            }
          })
          return Object.entries(m)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([value, { count, emoji }]) => ({ value, label: `${emoji} ${value}`, count }))
        }
        // Boolean multiselects: ffCap, heli, bowDisch, sternDisch, cow, igs, bwmp
        if (data_type === 'boolean') {
          const m = { Yes: 0, No: 0 }
          vs.forEach(v => { m[getField(v) ? 'Yes' : 'No']++ })
          return [
            { value: 'Yes', label: 'Yes', count: m.Yes },
            { value: 'No',  label: 'No',  count: m.No },
          ].filter(o => o.count > 0)
        }
        const m = {}
        vs.forEach(v => {
          const val = getField(v)
          if (val) m[val] = (m[val] ?? 0) + 1
        })
        return Object.entries(m)
          .sort((a, b) => b[1] - a[1])
          .map(([value, count]) => ({ value, label: value, count }))
      },
      describe: f => `${label}: ${f.values.join(', ')}`,
      apply: (vs, f) => {
        if (data_type === 'boolean') {
          return vs.filter(v => f.values.includes(getField(v) ? 'Yes' : 'No'))
        }
        return vs.filter(v => f.values.includes(getField(v)))
      },
    }
  }

  if (filter_type === 'range') {
    // Determine numeric accessor
    const getNum = (() => {
      if (filter_field_transform === 'numOf') return v => numOf(v[filter_field ?? vessel_field])
      if (filter_field_transform === 'parseFloat') return v => parseFloat(String(v[filter_field ?? vessel_field] ?? '').replace(/,/g, ''))
      // filter_field points directly to a raw numeric (dwtNum, gtNum, mcrNum, spdNum, etc.)
      return v => v[filter_field ?? vessel_field] ?? 0
    })()
    const unit = attr.unit ? ` ${attr.unit}` : ''
    return {
      id: key,
      label,
      group: filter_group,
      filterType: 'range',
      describe: f => `${label}: ${f.min ?? '0'}${unit} – ${f.max ?? '∞'}${unit}`,
      apply: (vs, f) => vs.filter(v => {
        const val = getField(v)
        // Skip null/undefined/empty for optional cargo fields
        if ((val == null || val === '') && (f.min != null || f.max != null)) return false
        const n = getNum(v)
        if (f.min != null && n < f.min) return false
        if (f.max != null && n > f.max) return false
        return true
      }),
    }
  }

  return null
}

export const FILTER_CONFIGS = allAttrs('vessel')
  .filter(a => a.is_filterable)
  .sort((a, b) => {
    const gi = defs.filter_groups.findIndex(g => g.id === a.filter_group)
    const gj = defs.filter_groups.findIndex(g => g.id === b.filter_group)
    if (gi !== gj) return gi - gj
    return (a.display_order ?? 0) - (b.display_order ?? 0)
  })
  .map(buildFilterConfig)
  .filter(Boolean)

export const FILTER_MAP = Object.fromEntries(FILTER_CONFIGS.map(f => [f.id, f]))

function isEmptyFilter(f) {
  if (f.type === 'multiselect') return !f.values || f.values.length === 0
  if (f.type === 'range')       return f.min == null && f.max == null
  if (f.type === 'typeahead')   return (!f.values?.length) && (!f.query?.trim())
  return false
}

/** Apply an array of active filter objects to a vessel array */
export function applyFilters(vessels, activeFilters) {
  return activeFilters.reduce((vs, f) => {
    if (isEmptyFilter(f)) return vs
    const cfg = FILTER_MAP[f.fieldId]
    return cfg ? cfg.apply(vs, f) : vs
  }, vessels)
}

// ─── ALL_VESSEL_COLUMNS / COLUMN_GROUPS ──────────────────────────────────────

// Maps af-* attribute IDs → short column IDs used in personas.json and render code.
// Keeps persona preferences and column picker backward-compatible.
const COL_ID_MAP = {
  'af-name':       'name',
  'af-imo':        'imo',
  'af-mmsi':       'mmsi',
  'af-callsign':   'callsign',
  'af-flag':       'flag',
  'af-type':       'type',
  'af-status':     'status',
  'af-loa':        'loa',
  'af-lbp':        'lbp',
  'af-beam':       'beam',
  'af-depth':      'depth',
  'af-maxdraft':   'max-draft',
  'af-sumdraft':   'sum-draft',
  'af-dwt':        'dwt',
  'af-gt':         'gt',
  'af-nt':         'nt',
  'af-yr':         'built',
  'af-yard':       'yard',
  'af-ice':        'ice',
  'af-eng':        'engine',
  'af-mcr':        'mcr',
  'af-spd':        'speed',
  'af-prp':        'propulsion',
  'af-fuel':       'fuel',
  'af-dp':         'dp',
  'af-scrubber':   'scrubber',
  'af-cls':        'class',
  'af-clsnot':     'class-notation',
  'af-owner':      'owner',
  'af-bo':         'beneficial-owner',
  'af-mg':         'manager',
  'af-op':         'operator',
  'af-pi':         'pi',
  'af-teu':        'teu',
  'af-teur':       'teu-reefer',
  'af-holds':      'holds',
  'af-hatches':    'hatches',
  'af-pax':        'passengers',
  'af-ceu':        'ceu',
  'af-lanm':       'lane-metres',
  'af-ffcap':      'firefighting',
  'af-heli':       'helideck',
  'af-bowdisch':   'bow-discharge',
  'af-sterndisch': 'stern-discharge',
  'af-cow':        'cow',
  'af-igs':        'igs',
  'af-bwmp':       'bwmp',
}

export const ALL_VESSEL_COLUMNS = allAttrs('vessel')
  .filter(a => a.is_column)
  .sort((a, b) => {
    const gi = defs.column_groups.findIndex(g => g.key === a.column_group)
    const gj = defs.column_groups.findIndex(g => g.key === b.column_group)
    if (gi !== gj) return gi - gj
    return (a.display_order ?? 0) - (b.display_order ?? 0)
  })
  .map(a => ({
    id:           COL_ID_MAP[a.id] ?? a.id,
    vessel_field: a.vessel_field ?? null,
    label:        a.label,
    group:        a.column_group,
    always:       a.column_always ?? false,
    width:        a.column_width  ?? 100,
  }))

export const COLUMN_GROUPS = defs.column_groups

// ─── ATTR_BY_ID — internal lookup by af-* id ─────────────────────────────────

const ATTR_BY_ID = {}
allAttrs('vessel').forEach(a => { if (a.id) ATTR_BY_ID[a.id] = a })

// ─── getAttrValue / getCellValue ─────────────────────────────────────────────

/** Return a string value for a vessel attribute by its af-* node id. */
export function getAttrValue(vessel, nodeId) {
  if (!vessel || !nodeId) return ''
  const attr = ATTR_BY_ID[nodeId]
  if (!attr?.vessel_field) return ''
  try {
    const val = vessel[attr.vessel_field]
    return val == null ? '' : String(val)
  } catch { return '' }
}

/** Return a display value for a column. col.vessel_field is the direct vessel property. */
export function getCellValue(col, vessel) {
  if (!vessel || !col) return ''
  if (col.vessel_field) {
    const val = vessel[col.vessel_field]
    return val == null ? '' : String(val)
  }
  return ''
}

// ─── LEAF_TEMPORAL_MAP ───────────────────────────────────────────────────────

export const LEAF_TEMPORAL_MAP = {
  'af-status':       { entity: 'imo',       label: 'Vessel Status'            },
  'af-mmsi':         { entity: 'imo',       label: 'MMSI'                     },
  'af-callsign':     { entity: 'imo',       label: 'Call Sign'                },
  'af-name':         { entity: 'imo',       label: 'Vessel Name (Current)'    },
  'af-flag':         { entity: 'flag',      label: 'Flag State'               },
  'af-por':          { entity: 'flag',      label: 'Port of Registry'         },
  'af-owner':        { entity: 'ownership', label: 'Registered Owner'         },
  'af-benowner':     { entity: 'ownership', label: 'Beneficial Owner'         },
  'af-operator':     { entity: 'ownership', label: 'Commercial Operator'      },
  'af-manager':      { entity: 'ownership', label: 'Technical Manager'        },
  'af-docco':        { entity: 'ownership', label: 'DOC Company'              },
  'af-pi':           { entity: 'ownership', label: 'P&I Club'                 },
  'af-class':        { entity: 'class',     label: 'Classification Society'   },
  'af-classnot':     { entity: 'class',     label: 'Class Notation'           },
  'af-specsurvlast': { entity: 'class',     label: 'Last Special Survey'      },
  'af-specsurvnext': { entity: 'class',     label: 'Next Special Due'         },
  'af-annsurvlast':  { entity: 'class',     label: 'Last Annual Survey'       },
  'af-annsurvnext':  { entity: 'class',     label: 'Next Annual Due'          },
  'af-drydocklast':  { entity: 'class',     label: 'Last Intermediate Survey' },
  'af-smcissued':    { entity: 'certs',     label: 'SMC (ISM)'                },
  'af-docissued':    { entity: 'certs',     label: 'DOC'                      },
}

// ─── NODE_ENTITY_KEYS ────────────────────────────────────────────────────────

export const NODE_ENTITY_KEYS = {
  'general':          ['imo', 'flag'],
  'gen-identity':     ['imo', 'flag'],
  'gen-status':       ['imo'],
  'gen-crew':         ['crew'],
  'ownership':        ['ownership', 'finance'],
  'own-regowner':     ['ownership'],
  'own-techman':      ['ownership'],
  'own-shipman':      ['ownership'],
  'own-docco':        ['ownership'],
  'own-bareboat':     ['ownership'],
  'own-charterer':    ['ownership'],
  'own-sp':           ['finance'],
  'classification':   ['class', 'certs'],
  'class-society':    ['class'],
  'class-notation':   ['class'],
  'class-surveys':    ['class', 'certs'],
  'safety':           ['certs'],
  'safety-doc':       ['certs'],
  'safety-smc':       ['certs'],
  'safety-iopp':      ['certs'],
  'safety-insurance': ['ownership'],
  'compliance':       ['sanctions'],
  'comp-sanctions':   ['sanctions'],
}

// ─── getAttrValueAtDate ───────────────────────────────────────────────────────

export function getAttrValueAtDate(vessel, nodeId, curDate) {
  if (!curDate || curDate >= '2024-01-30' || !vessel) return getAttrValue(vessel, nodeId)
  const m = LEAF_TEMPORAL_MAP[nodeId]
  if (!m) return getAttrValue(vessel, nodeId)
  try {
    const hist = getEntityFieldsAtDate(vessel, m.entity, curDate)
    const fld  = hist.find(f => f[0] === m.label)
    return fld ? String(fld[1]) : getAttrValue(vessel, nodeId)
  } catch {
    return getAttrValue(vessel, nodeId)
  }
}
