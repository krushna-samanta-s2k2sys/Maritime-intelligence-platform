import fleetKpis    from './json/fleet_kpis.json';
import pscData      from './json/psc_inspections.json';
import certData     from './json/certificates.json';
import marketData   from './json/market_indices.json';
import activityData from './json/activity_feed.json';

// KPI cards — {id, v, l, delta, up, color}
export const KPIS = fleetKpis.kpis.map(k => ({
  id:    k.id,
  v:     k.value_formatted,
  l:     k.label,
  delta: k.delta_formatted,
  up:    k.direction === 'up',
  color: k.color,
}));

// Fleet breakdown by vessel type — [name, count, color]
export const FLEET_TYPES = fleetKpis.fleet_by_type.map(t => [t.vessel_type, t.count, t.color]);

// Top flag states — [emoji, name, count]
export const FLAGS = fleetKpis.top_flag_states.map(f => [f.flag_emoji, f.flag_name, f.vessel_count]);

// Certificate compliance summary — {icon, name, sub, count, cls}
export const CERTS = fleetKpis.cert_compliance_summary.map(c => ({
  icon:  c.icon,
  name:  c.name,
  sub:   c.description,
  count: `${c.expiring_count} vessels`,
  cls:   c.css_class,
}));

// PSC detentions — {vessel, imo, port, mou, defs, date, status}
export const PSC_DATA = pscData.map(i => ({
  vessel: i.vessel_name,
  imo:    i.imo_number,
  port:   i.port_name,
  mou:    i.mou_region,
  defs:   i.total_deficiencies,
  date:   i.inspection_date,
  status: i.status,
}));

// Market indices — {idx, name, val, prev, w52lo, w52hi, col, delta, up, desc, bars}
export const MARKET = marketData.map(m => ({
  idx:   m.code,
  name:  m.name,
  val:   m.value,
  prev:  m.prev,
  w52lo: m.w52_low,
  w52hi: m.w52_high,
  col:   m.color,
  delta: m.delta > 0 ? `+${m.delta}` : String(m.delta),
  up:    m.direction === 'up',
  desc:  m.description,
  bars:  m.sparkline,
}));

// Activity feed — {color, txt} + relative time labels derived from timestamps
export const ACT_POOL = activityData.map(a => ({
  color: a.color,
  txt:   a.description,
}));

function relTime(iso) {
  const diff = (new Date(activityData[0].timestamp) - new Date(iso)) / 60000; // minutes behind newest
  if (diff < 1)   return 'Just now';
  if (diff < 60)  return `${Math.round(diff)}m ago`;
  return `${Math.round(diff / 60)}h ${Math.round(diff % 60)}m ago`;
}
export const ACT_TIMES = activityData.map(a => relTime(a.timestamp));

// Certificates expiring soon (for detailed cert widgets)
export const CERTS_EXPIRING = certData
  .filter(c => c.days_until_expiry <= 60)
  .map(c => ({
    vessel: c.vessel_name,
    imo:    c.imo_number,
    cert:   c.certificate_type,
    exp:    c.expiry_date,
    days:   c.days_until_expiry,
  }));
