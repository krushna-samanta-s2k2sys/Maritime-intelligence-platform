import pscRaw     from './json/psc_inspections.json';
import pscSummary from './json/psc_summary.json';

export const INSPECTIONS = pscRaw.map(i => ({
  id:    i.id,
  v:     i.vessel_name,
  imo:   i.imo_number,
  flag:  i.flag_display ?? '',
  port:  i.port_name,
  mou:   i.mou_region === 'USCG' ? 'USCG' : `${i.mou_region} MOU`,
  date:  i.inspection_date,
  defs:  i.total_deficiencies,
  res:   i.detained ? 'DETENTION' : 'No detention',
  codes: (i.deficiencies ?? []).map(d => d.code),
  descs: (i.deficiencies ?? []).map(d => d.description),
  cats:  (i.deficiencies ?? []).map(d => d.category ?? d.severity),
}));

export const PSC_KPIS    = pscSummary.kpis;
export const MOU_STATS   = pscSummary.mou_stats;
export const DEF_CATS    = pscSummary.deficiency_categories;
