export const CARD_CATALOG = {
  'kpi-row':        { id:'kpi-row',        title:'All KPI Summary',         icon:'▦',  category:'kpi',    defaultW:12, description:'Full row of all 8 KPI cards side-by-side' },
  'kpi-fleet':      { id:'kpi-fleet',      title:'Total Vessels',           icon:'🚢', category:'kpi',    defaultW:3,  description:'Total vessels tracked globally' },
  'kpi-active':     { id:'kpi-active',     title:'Active Fleet',            icon:'✅', category:'kpi',    defaultW:3,  description:'Percentage of fleet currently in service' },
  'kpi-ports':      { id:'kpi-ports',      title:'Ports Tracked',           icon:'⚓', category:'kpi',    defaultW:3,  description:'Number of ports in the database' },
  'kpi-psc':        { id:'kpi-psc',        title:'PSC Detentions YTD',      icon:'🔍', category:'kpi',    defaultW:3,  description:'Port State Control detentions year-to-date' },
  'kpi-certs':      { id:'kpi-certs',      title:'Certs Expiring (30d)',     icon:'📄', category:'kpi',    defaultW:3,  description:'Certificates expiring within 30 days' },
  'kpi-sanctions':  { id:'kpi-sanctions',  title:'Active Sanctions',        icon:'🚨', category:'kpi',    defaultW:3,  description:'Active sanctions designations' },
  'kpi-companies':  { id:'kpi-companies',  title:'Companies',               icon:'🏢', category:'kpi',    defaultW:3,  description:'Total companies in registry' },
  'kpi-ais':        { id:'kpi-ais',        title:'AIS Points (total)',       icon:'📡', category:'kpi',    defaultW:3,  description:'Total AIS data points ingested' },
  'live-map':       { id:'live-map',       title:'Global Fleet — Live AIS', icon:'🌍', category:'map',    defaultW:8,  description:'World map with live AIS vessel positions and trade routes' },
  'live-activity':  { id:'live-activity',  title:'Live Activity Feed',      icon:'⚡', category:'feed',   defaultW:4,  description:'Real-time stream of maritime events' },
  'fleet-types':    { id:'fleet-types',    title:'Fleet by Ship Type',      icon:'📊', category:'chart',  defaultW:4,  description:'Vessel count distribution by ship type' },
  'flag-states':    { id:'flag-states',    title:'Top Flag States',         icon:'🏴', category:'chart',  defaultW:4,  description:'Largest flag state registries by vessel count' },
  'certs-expiring': { id:'certs-expiring', title:'Certificates Expiring',   icon:'⚠️', category:'table',  defaultW:4,  description:'Upcoming certificate expirations by type' },
  'psc-detentions': { id:'psc-detentions', title:'Recent PSC Detentions',   icon:'🔍', category:'table',  defaultW:6,  description:'Latest Port State Control detention records' },
  'market-snapshot':{ id:'market-snapshot',title:'Market Snapshot',         icon:'📈', category:'market', defaultW:6,  description:'Baltic freight indices and shipping market rates' },
}

export const CARD_CATEGORIES = [
  { key:'kpi',    label:'KPI Cards',  icon:'▦'  },
  { key:'map',    label:'Maps',       icon:'🌍' },
  { key:'feed',   label:'Feeds',      icon:'⚡' },
  { key:'chart',  label:'Charts',     icon:'📊' },
  { key:'table',  label:'Tables',     icon:'📋' },
  { key:'market', label:'Market',     icon:'📈' },
]
