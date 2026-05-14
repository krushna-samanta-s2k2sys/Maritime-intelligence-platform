import feedsData from './json/etl_feeds.json';
import runsData from './json/etl_runs.json';
import conflictsData from './json/etl_conflicts.json';

// Feed categories derived from the feed data
export const FEED_CATEGORIES = [...new Set(feedsData.map(f => f.category))];

// ETL feeds — shape preserved for backward compatibility
export const FEEDS = feedsData.map(f => ({
  id:      f.id,
  name:    f.name,
  cat:     f.category,
  freq:    f.frequency,
  status:  f.status,
  enabled: f.enabled,
  conn: {
    type:     f.connection.type,
    host:     f.connection.host,
    user:     f.connection.user,
    pattern:  f.connection.file_pattern,
    encoding: f.connection.encoding,
  },
  sched: {
    cron:    f.schedule.cron,
    freq:    f.schedule.frequency,
    mode:    f.schedule.mode,
    timeout: `${f.schedule.timeout_s}s`,
    retry:   f.schedule.retry_count,
  },
  qc:  f.qc_rules.map(r => ({ id: r.id, field: r.field, sev: r.severity, expr: r.expression })),
  map: f.field_mappings.map(m => ({ src: m.source_field, tgt: `${m.target_entity}.${m.target_field}`, xfm: m.transform })),
}));

// ETL run history — shape preserved for backward compatibility
export const INITIAL_RUNS = runsData.map(r => ({
  id:      r.id,
  feed:    r.feed_name,
  status:  r.status,
  stage:   r.stage,
  rec:     r.records_received,
  pass:    r.records_passed,
  promo:   r.records_promoted,
  hil:     r.hil_count,
  rej:     r.records_rejected,
  dur:     r.duration_min,
  trigger: r.trigger,
}));

// Human-in-loop conflict items — shape preserved for backward compatibility
export const HIL_ITEMS_INITIAL = conflictsData.map(c => ({
  id:       c.id,
  vessel:   c.vessel_name,
  imo:      c.imo_number,
  entity:   c.entity_type,
  severity: c.severity,
  attr:     c.attribute_name,
  master:   c.master_value,
  incoming: c.incoming_value,
  score:    c.confidence_score,
  vendor:   c.data_source,
  reason:   c.reason,
}));
