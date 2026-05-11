// All available vessel list columns — id maps to persona vesselColumns arrays
export const ALL_VESSEL_COLUMNS = [
  { id:'name',            label:'Vessel Name',       group:'identity',    always:true,  width:160 },
  { id:'imo',             label:'IMO Number',         group:'identity',    always:false, width:90  },
  { id:'mmsi',            label:'MMSI',               group:'identity',    always:false, width:95  },
  { id:'call-sign',       label:'Call Sign',         group:'identity',    always:false, width:80  },
  { id:'flag',            label:'Flag / Country',    group:'identity',    always:false, width:120 },
  { id:'type',            label:'Ship Type',         group:'identity',    always:false, width:130 },
  { id:'status',          label:'Status',            group:'identity',    always:false, width:110 },
  { id:'updated',         label:'Last Updated',      group:'identity',    always:false, width:90  },
  { id:'dwt',             label:'DWT',               group:'tonnage',     always:false, width:80  },
  { id:'gt',              label:'GT',                group:'tonnage',     always:false, width:80  },
  { id:'nt',              label:'NT',                group:'tonnage',     always:false, width:80  },
  { id:'built',           label:'Year Built',        group:'dimensions',  always:false, width:70  },
  { id:'loa',             label:'LOA',               group:'dimensions',  always:false, width:80  },
  { id:'lbp',             label:'LBP',               group:'dimensions',  always:false, width:80  },
  { id:'beam',            label:'Beam',              group:'dimensions',  always:false, width:80  },
  { id:'depth',           label:'Depth',             group:'dimensions',  always:false, width:80  },
  { id:'max-draft',       label:'Max Draft',         group:'dimensions',  always:false, width:80  },
  { id:'sum-draft',       label:'Summer Draft',      group:'dimensions',  always:false, width:90  },
  { id:'owner',           label:'Registered Owner',  group:'ownership',   always:false, width:160 },
  { id:'beneficial-owner',label:'Beneficial Owner',  group:'ownership',   always:false, width:160 },
  { id:'operator',        label:'Operator',          group:'ownership',   always:false, width:150 },
  { id:'manager',         label:'Tech Manager',      group:'ownership',   always:false, width:150 },
  { id:'pi',              label:'P&I Club',          group:'ownership',   always:false, width:140 },
  { id:'class',           label:'Class Society',     group:'class',       always:false, width:130 },
  { id:'class-notation',  label:'Class Notation',    group:'class',       always:false, width:200 },
  { id:'ice',             label:'Ice Class',         group:'class',       always:false, width:80  },
  { id:'engine',          label:'Engine',            group:'machinery',   always:false, width:180 },
  { id:'mcr',             label:'MCR (kW)',           group:'machinery',   always:false, width:90  },
  { id:'speed',           label:'Speed',             group:'machinery',   always:false, width:80  },
  { id:'fuel',            label:'Fuel Type',         group:'machinery',   always:false, width:110 },
  { id:'propulsion',      label:'Propulsion',        group:'machinery',   always:false, width:110 },
  { id:'teu',             label:'TEU',               group:'cargo',       always:false, width:80  },
  { id:'teu-r',          label:'Reefer TEU',        group:'cargo',       always:false, width:80  },
  { id:'ceu',            label:'CEU (Cars)',         group:'cargo',       always:false, width:80  },
  { id:'pax',            label:'Passengers',        group:'cargo',       always:false, width:80  },
  { id:'holds',          label:'Holds',             group:'cargo',       always:false, width:60  },
  { id:'hatches',        label:'Hatches',           group:'cargo',       always:false, width:65  },
  { id:'lane-metres',    label:'Lane Metres',       group:'cargo',       always:false, width:90  },
  { id:'yard',           label:'Shipyard',          group:'construction',always:false, width:180 },
  { id:'dp',             label:'DP Notation',       group:'safety',      always:false, width:70  },
  { id:'scrubber',       label:'Scrubber',          group:'safety',      always:false, width:110 },
  { id:'ff-cap',         label:'Fire-fighting',     group:'safety',      always:false, width:90  },
  { id:'heli',           label:'Helicopter',        group:'safety',      always:false, width:80  },
  { id:'bow-disch',      label:'Bow Discharge',     group:'safety',      always:false, width:95  },
  { id:'stern-disch',    label:'Stern Discharge',   group:'safety',      always:false, width:105 },
  { id:'cow',            label:'COW',               group:'safety',      always:false, width:55  },
  { id:'igs',            label:'IGS',               group:'safety',      always:false, width:55  },
  { id:'bwmp',           label:'BWMP',              group:'safety',      always:false, width:60  },
]

export const COLUMN_GROUPS = [
  { key:'identity',     label:'Identity & Status'  },
  { key:'tonnage',      label:'Tonnage'             },
  { key:'dimensions',   label:'Dimensions'          },
  { key:'ownership',    label:'Ownership & Mgmt'   },
  { key:'class',        label:'Classification'      },
  { key:'machinery',    label:'Machinery'           },
  { key:'cargo',        label:'Cargo Capacity'      },
  { key:'construction', label:'Construction'        },
  { key:'safety',       label:'Safety & Green Tech' },
]

// Maps column id to vessel record accessor
export function getCellValue(col, v) {
  switch (col) {
    case 'name':            return { text: `${v.flag} ${v.nm}`, link: true }
    case 'imo':             return v.imo
    case 'mmsi':            return v.mmsi
    case 'call-sign':       return v.cs
    case 'flag':            return `${v.flag} ${v.fn}`
    case 'type':            return v.ty
    case 'status':          return v.st
    case 'updated':         return v.up
    case 'dwt':             return v.dwt
    case 'gt':              return v.gt
    case 'nt':              return v.nt
    case 'built':           return v.yr
    case 'loa':             return v.loa
    case 'lbp':             return v.lbp
    case 'beam':            return v.beam
    case 'depth':           return v.depth
    case 'max-draft':       return v.maxDraft
    case 'sum-draft':       return v.sumDraft
    case 'owner':           return v.ow
    case 'beneficial-owner':return v.bo
    case 'operator':        return v.op
    case 'manager':         return v.mg
    case 'pi':              return v.pi
    case 'class':           return v.cls
    case 'class-notation':  return v.clsNot
    case 'ice':             return v.ice !== 'None' ? v.ice : '—'
    case 'engine':          return v.eng
    case 'mcr':             return v.mcr
    case 'speed':           return v.spd
    case 'fuel':            return v.fuel
    case 'propulsion':      return v.prp
    case 'teu':             return v.teu || '—'
    case 'teu-r':          return v.teu_r || '—'
    case 'ceu':            return v.ceu || '—'
    case 'pax':            return v.pax || '—'
    case 'holds':          return v.holds || '—'
    case 'hatches':        return v.hatches || '—'
    case 'lane-metres':    return v.lanm || '—'
    case 'yard':           return v.yard
    case 'dp':             return v.dp || '—'
    case 'scrubber':       return v.scrubberFitted || '—'
    case 'ff-cap':         return v.ffCap ? 'Yes' : 'No'
    case 'heli':           return v.heli ? 'Yes' : 'No'
    case 'bow-disch':      return v.bowDisch ? 'Yes' : 'No'
    case 'stern-disch':    return v.sternDisch ? 'Yes' : 'No'
    case 'cow':            return v.cow ? 'Yes' : 'No'
    case 'igs':            return v.igs ? 'Yes' : 'No'
    case 'bwmp':           return v.bwmp ? 'Yes' : 'No'
    default:               return '—'
  }
}
