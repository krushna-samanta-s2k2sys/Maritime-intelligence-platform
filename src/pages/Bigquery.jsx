import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/* ─── Schema ─── */
const SCHEMA = {
  datasets: [
    { id:'raw_ingest', label:'raw_ingest', dsClass:'raw', icon:'📥', desc:'Every attribute value received from every vendor — the immutable ledger',
      tables:[{name:'attr_vendor',kind:'table',rows:'412M',desc:'One row per IMO × attribute × vendor × received_timestamp',cols:[
        {n:'feed_run_id',t:'STRING',d:'FK → etl_run_log.run_id'},
        {n:'imo_number',t:'STRING',d:'7-digit IMO identifier'},
        {n:'source_vendor',t:'STRING',d:'IHS_FAIRPLAY, DNV_GL, LR, BV, CLASSNK, EQUASIS_PSC, OFAC, EU_SANCTIONS'},
        {n:'entity',t:'STRING',d:'identity | dimensions | flag | ownership | class | ais | portcalls | sanctions'},
        {n:'attribute_name',t:'STRING',d:'e.g. vessel_name, dwt, registered_owner, gross_tonnage'},
        {n:'raw_value',t:'STRING',d:'Exactly as received from vendor, before any transformation'},
        {n:'normalised_value',t:'STRING',d:'After parse/normalise transforms'},
        {n:'data_type',t:'STRING',d:'STRING | NUMERIC | DATE | BOOLEAN | JSON'},
        {n:'match_score',t:'FLOAT64',d:'0.0–1.0 confidence vs current master; NULL if no master yet'},
        {n:'qc_passed',t:'BOOL',d:'Whether this value passed all QC rules'},
        {n:'qc_flags',t:'ARRAY<STRING>',d:"['FORMAT_VALID','RANGE_CHECK_FAIL','CROSS_FIELD_CONFLICT']"},
        {n:'valid_from',t:'TIMESTAMP',d:'BI-TEMPORAL — when this value became true in the real world',temporal:true},
        {n:'valid_to',t:'TIMESTAMP',d:'BI-TEMPORAL — NULL = still current per this vendor',temporal:true},
        {n:'transaction_time',t:'TIMESTAMP',d:'BI-TEMPORAL — when WE ingested this row — NEVER changes',temporal:true},
        {n:'file_name',t:'STRING',d:'Source file that delivered this data'},
        {n:'batch_id',t:'STRING',d:'Processing batch identifier'},
      ]}]},
    { id:'master', label:'master', dsClass:'master', icon:'⭐', desc:'Golden records with full bi-temporal history — the authoritative source of truth',
      tables:[{name:'attr_master',kind:'table',rows:'28M',desc:'Golden record per IMO × entity × attribute — every change creates a new row',cols:[
        {n:'imo_number',t:'STRING',d:'7-digit IMO identifier'},
        {n:'entity',t:'STRING',d:'Same values as attr_vendor.entity'},
        {n:'attribute_name',t:'STRING',d:'Attribute being mastered'},
        {n:'master_value',t:'STRING',d:'The winning value (displayed in Vessel Detail)'},
        {n:'premaster_value',t:'STRING',d:'The value BEFORE the last update (audit/comparison)'},
        {n:'master_source',t:'STRING',d:'Which vendor won, or MANUAL_OVERRIDE, or MAJORITY_VOTE, or AUTO_SCORE'},
        {n:'master_score',t:'FLOAT64',d:'Confidence of winning value; NULL if MANUAL_OVERRIDE'},
        {n:'auto_updated',t:'BOOL',d:'TRUE = auto-promoted (score ≥ 0.95); FALSE = analyst decision'},
        {n:'hil_required',t:'BOOL',d:'Flagged for Human-in-Loop review'},
        {n:'hil_status',t:'STRING',d:'NULL | Pending | Reviewing | Approved | Rejected'},
        {n:'override_value',t:'STRING',d:'Analyst-set value if MANUAL_OVERRIDE'},
        {n:'override_comment',t:'STRING',d:'Rationale; stored as ML training signal for scoring model'},
        {n:'valid_from',t:'TIMESTAMP',d:'BI-TEMPORAL — when this master value became effective',temporal:true},
        {n:'valid_to',t:'TIMESTAMP',d:'BI-TEMPORAL — NULL = currently the active golden record',temporal:true},
        {n:'transaction_time',t:'TIMESTAMP',d:'BI-TEMPORAL — when this record was written to master — NEVER changes',temporal:true},
        {n:'transaction_end_time',t:'TIMESTAMP',d:'BI-TEMPORAL — when this master record was superseded in our system',temporal:true},
      ]}]},
    { id:'entity_views', label:'entity_views', dsClass:'views', icon:'👁', desc:'Pre-joined entity-specific views for application use (materialized views)',
      tables:[
        {name:'vessel_identity',kind:'view',rows:'~104K',desc:'Current identity — imo_number, vessel_name, mmsi, flag_code',cols:[{n:'imo_number',t:'STRING'},{n:'vessel_name',t:'STRING'},{n:'mmsi',t:'STRING'},{n:'call_sign',t:'STRING'},{n:'ship_type',t:'STRING'},{n:'vessel_status',t:'STRING'},{n:'flag_code',t:'STRING'}]},
        {name:'vessel_dimensions',kind:'view',rows:'~104K',desc:'Physical dimensions — gt, nt, dwt, loa, beam, draught',cols:[{n:'imo_number',t:'STRING'},{n:'gross_tonnage',t:'NUMERIC'},{n:'net_tonnage',t:'NUMERIC'},{n:'dwt',t:'NUMERIC'},{n:'loa',t:'NUMERIC'},{n:'beam',t:'NUMERIC'},{n:'max_draught',t:'NUMERIC'}]},
        {name:'vessel_ownership',kind:'view',rows:'~280K',desc:'Ownership with valid-time history',cols:[{n:'imo_number',t:'STRING'},{n:'registered_owner',t:'STRING'},{n:'beneficial_owner',t:'STRING'},{n:'technical_manager',t:'STRING'},{n:'pi_club',t:'STRING'},{n:'valid_from',t:'TIMESTAMP',temporal:true},{n:'valid_to',t:'TIMESTAMP',temporal:true}]},
        {name:'vessel_class',kind:'view',rows:'~110K',desc:'Classification society, notation, survey dates',cols:[{n:'imo_number',t:'STRING'},{n:'class_society',t:'STRING'},{n:'class_notation',t:'STRING'},{n:'last_annual_survey',t:'DATE'},{n:'next_annual_survey',t:'DATE'},{n:'next_special_survey',t:'DATE'}]},
        {name:'vessel_certs',kind:'view',rows:'~2.1M',desc:'Certificate portfolio — expiry tracking',cols:[{n:'imo_number',t:'STRING'},{n:'cert_type',t:'STRING'},{n:'cert_number',t:'STRING'},{n:'issued_by',t:'STRING'},{n:'issue_date',t:'DATE'},{n:'expiry_date',t:'DATE'},{n:'status',t:'STRING'}]},
        {name:'ais_position',kind:'view',rows:'~148K',desc:'Latest AIS positions',cols:[{n:'imo_number',t:'STRING'},{n:'mmsi',t:'STRING'},{n:'latitude',t:'FLOAT64'},{n:'longitude',t:'FLOAT64'},{n:'speed',t:'FLOAT64'},{n:'heading',t:'INT64'},{n:'nav_status',t:'STRING'},{n:'timestamp',t:'TIMESTAMP'},{n:'valid_from',t:'TIMESTAMP',temporal:true}]},
        {name:'port_call',kind:'view',rows:'~284M',desc:'Port arrival/departure sequence',cols:[{n:'imo_number',t:'STRING'},{n:'port_name',t:'STRING'},{n:'arrival_time',t:'TIMESTAMP'},{n:'departure_time',t:'TIMESTAMP'},{n:'cargo_type',t:'STRING'},{n:'voyage_number',t:'STRING'}]},
        {name:'psc_inspection',kind:'view',rows:'~4.2M',desc:'PSC inspection + deficiency data',cols:[{n:'imo_number',t:'STRING'},{n:'port',t:'STRING'},{n:'mou_region',t:'STRING'},{n:'inspection_date',t:'DATE'},{n:'deficiency_count',t:'INT64'},{n:'detention',t:'BOOL'},{n:'status',t:'STRING'}]},
        {name:'sanctions_screening',kind:'view',rows:'~22K',desc:'Sanctions screening results',cols:[{n:'imo_number',t:'STRING'},{n:'list_name',t:'STRING'},{n:'match_type',t:'STRING'},{n:'match_score',t:'FLOAT64'},{n:'status',t:'STRING'},{n:'screening_date',t:'DATE'}]},
        {name:'fixture',kind:'view',rows:'~2.8M',desc:'Chartering fixtures',cols:[{n:'fixture_id',t:'STRING'},{n:'vessel_imo',t:'STRING'},{n:'charterer',t:'STRING'},{n:'fixture_type',t:'STRING'},{n:'freight_rate',t:'FLOAT64'},{n:'status',t:'STRING'}]},
        {name:'maritime_event',kind:'view',rows:'~1.4M',desc:'Maritime events (casualties, incidents)',cols:[{n:'event_id',t:'STRING'},{n:'imo_number',t:'STRING'},{n:'event_type',t:'STRING'},{n:'event_date',t:'DATE'},{n:'severity',t:'STRING'},{n:'description',t:'STRING'}]},
      ]},
    { id:'etl_ops', label:'etl_ops', dsClass:'etl', icon:'⚙', desc:'ETL operational tables — feed configs, run logs, QC rules, HIL queue, audit',
      tables:[
        {name:'etl_feed',kind:'table',rows:'114',desc:'Feed configurations — 114 active vendor feeds',cols:[{n:'feed_id',t:'STRING'},{n:'feed_name',t:'STRING'},{n:'category',t:'STRING'},{n:'connection_type',t:'STRING'},{n:'frequency',t:'STRING'},{n:'is_active',t:'BOOL'},{n:'last_run_at',t:'TIMESTAMP'}]},
        {name:'etl_run_log',kind:'table',rows:'8.2M',desc:'Immutable run history',cols:[{n:'run_id',t:'STRING'},{n:'feed_id',t:'STRING'},{n:'started_at',t:'TIMESTAMP'},{n:'status',t:'STRING'},{n:'records_received',t:'INT64'},{n:'records_auto_promoted',t:'INT64'},{n:'records_hil_queued',t:'INT64'}]},
        {name:'hil_queue',kind:'table',rows:'48K',desc:'Human-in-Loop review items awaiting analyst decision',cols:[{n:'hil_id',t:'STRING'},{n:'imo_number',t:'STRING'},{n:'entity',t:'STRING'},{n:'attribute_name',t:'STRING'},{n:'master_value',t:'STRING'},{n:'feed_value',t:'STRING'},{n:'match_score',t:'FLOAT64'},{n:'status',t:'STRING'}]},
        {name:'audit_log',kind:'table',rows:'180M',desc:'Immutable compliance audit trail — every attribute change ever made',cols:[{n:'audit_id',t:'STRING'},{n:'event_ts',t:'TIMESTAMP'},{n:'event_type',t:'STRING'},{n:'actor',t:'STRING'},{n:'imo_number',t:'STRING'},{n:'attribute_name',t:'STRING'},{n:'old_value',t:'STRING'},{n:'new_value',t:'STRING'},{n:'hil_id',t:'STRING'}]},
      ]},
  ]
};

/* ─── Templates ─── */
const TEMPLATES = [
  {n:1,title:'Point-in-Time Vessel State',desc:'Bi-temporal master query — valid-time + transaction-time',badge:'bt',badgeLabel:'Bi-Temporal',sql:`-- Bi-temporal point-in-time query
-- Returns what we KNEW about vessel 9412345 at system time 2023-06-01,
-- for values that were true in the real world on 2022-12-31

SELECT
  am.imo_number,
  am.entity,
  am.attribute_name,
  am.master_value,
  am.master_source,
  am.master_score,
  am.valid_from,
  am.valid_to,
  am.transaction_time,
  am.override_comment
FROM \`sp-maritime-prod.master.attr_master\` am
WHERE am.imo_number = '9412345'
  -- Valid-time predicate: value was true on this date
  AND am.valid_from <= TIMESTAMP('2022-12-31')
  AND (am.valid_to IS NULL OR am.valid_to > TIMESTAMP('2022-12-31'))
  -- Transaction-time predicate: we knew about it by this system date
  AND am.transaction_time <= TIMESTAMP('2023-06-01')
  AND (am.transaction_end_time IS NULL OR am.transaction_end_time > TIMESTAMP('2023-06-01'))
ORDER BY am.entity, am.attribute_name;`},
  {n:2,title:'Vendor Conflict Analysis',desc:'All vendors\' values for an attribute with scores',badge:'t',badgeLabel:'Temporal',sql:`-- Vendor conflict analysis
-- Show all vendors' raw values for a specific attribute
-- and how they scored against the master

SELECT
  av.source_vendor,
  av.raw_value,
  av.normalised_value,
  av.match_score,
  av.qc_passed,
  av.valid_from,
  av.transaction_time,
  am.master_value,
  am.master_source
FROM \`sp-maritime-prod.raw_ingest.attr_vendor\` av
LEFT JOIN \`sp-maritime-prod.master.attr_master\` am
  ON av.imo_number = am.imo_number
  AND av.attribute_name = am.attribute_name
  AND am.valid_to IS NULL
WHERE av.imo_number = '9412345'
  AND av.attribute_name = 'registered_owner'
ORDER BY av.match_score DESC, av.transaction_time DESC;`},
  {n:3,title:'Ownership History Timeline',desc:'All ownership changes for a vessel in chronological order',badge:'t',badgeLabel:'Temporal',sql:`-- Ownership history timeline
-- All ownership changes with duration of each ownership period

SELECT
  am.imo_number,
  am.attribute_name,
  am.master_value,
  am.master_source,
  am.master_score,
  am.valid_from,
  am.valid_to,
  TIMESTAMP_DIFF(
    COALESCE(am.valid_to, CURRENT_TIMESTAMP()),
    am.valid_from, DAY
  ) AS days_held,
  am.premaster_value AS previous_value,
  am.override_comment
FROM \`sp-maritime-prod.master.attr_master\` am
WHERE am.imo_number = '9412345'
  AND am.entity = 'ownership'
  AND am.attribute_name IN (
    'registered_owner', 'beneficial_owner',
    'technical_manager', 'commercial_operator'
  )
ORDER BY am.attribute_name, am.valid_from DESC;`},
  {n:4,title:'Certificate Expiry Forecast',desc:'Vessels with certificates expiring in the next 30/60/90 days',badge:'t',badgeLabel:'Temporal',sql:`-- Certificate expiry forecast
-- Vessels with certificates expiring within the next 90 days

SELECT
  vc.imo_number,
  vi.vessel_name,
  vi.flag_code,
  vc.cert_type,
  vc.cert_number,
  vc.issued_by,
  vc.expiry_date,
  DATE_DIFF(vc.expiry_date, CURRENT_DATE(), DAY) AS days_until_expiry,
  CASE
    WHEN DATE_DIFF(vc.expiry_date, CURRENT_DATE(), DAY) <= 30 THEN 'CRITICAL'
    WHEN DATE_DIFF(vc.expiry_date, CURRENT_DATE(), DAY) <= 60 THEN 'WARNING'
    ELSE 'ADVISORY'
  END AS urgency
FROM \`sp-maritime-prod.entity_views.vessel_certs\` vc
JOIN \`sp-maritime-prod.entity_views.vessel_identity\` vi
  ON vc.imo_number = vi.imo_number
WHERE vc.expiry_date BETWEEN CURRENT_DATE()
  AND DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)
  AND vc.status = 'Active'
ORDER BY vc.expiry_date ASC
LIMIT 500;`},
  {n:5,title:'PSC Detention History',desc:'PSC inspection and deficiency history for a vessel',badge:'t',badgeLabel:'Temporal',sql:`-- PSC detention history for a vessel

SELECT
  pi.imo_number,
  vi.vessel_name,
  pi.inspection_id,
  pi.port,
  pi.mou_region,
  pi.inspection_date,
  pi.deficiency_count,
  pi.detention,
  pi.status
FROM \`sp-maritime-prod.entity_views.psc_inspection\` pi
JOIN \`sp-maritime-prod.entity_views.vessel_identity\` vi
  ON pi.imo_number = vi.imo_number
WHERE pi.imo_number = '9412345'
ORDER BY pi.inspection_date DESC;`},
  {n:6,title:'AIS Position History',desc:'Vessel track over a time period from AIS',badge:'t',badgeLabel:'Temporal',sql:`-- AIS position history (vessel track)
-- Positions for a vessel over a specific date range

SELECT
  ap.imo_number,
  ap.mmsi,
  ap.latitude,
  ap.longitude,
  ap.speed,
  ap.heading,
  ap.nav_status,
  ap.timestamp,
  ap.source_ais_provider
FROM \`sp-maritime-prod.entity_views.ais_position\` ap
WHERE ap.imo_number = '9412345'
  AND ap.timestamp BETWEEN TIMESTAMP('2026-04-01')
                       AND TIMESTAMP('2026-04-30')
ORDER BY ap.timestamp DESC
LIMIT 1000;`},
  {n:7,title:'Port Call Sequence',desc:'Arrival/departure sequence with time-in-port durations',badge:'t',badgeLabel:'Temporal',sql:`-- Port call sequence with durations

SELECT
  pc.imo_number,
  pc.voyage_number,
  pc.port_name,
  pc.arrival_time,
  pc.departure_time,
  ROUND(TIMESTAMP_DIFF(
    COALESCE(pc.departure_time, CURRENT_TIMESTAMP()),
    pc.arrival_time, HOUR
  ) / 24.0, 2) AS days_in_port,
  pc.cargo_type,
  LAG(pc.port_name) OVER (PARTITION BY pc.imo_number ORDER BY pc.arrival_time) AS prev_port,
  LEAD(pc.port_name) OVER (PARTITION BY pc.imo_number ORDER BY pc.arrival_time) AS next_port
FROM \`sp-maritime-prod.entity_views.port_call\` pc
WHERE pc.imo_number = '9412345'
ORDER BY pc.arrival_time DESC
LIMIT 200;`},
  {n:8,title:'Fleet Snapshot at Date',desc:'Full fleet state as of any historical date (bi-temporal)',badge:'bt',badgeLabel:'Bi-Temporal',sql:`-- Fleet snapshot at a specific historical date

SELECT
  am.imo_number,
  MAX(CASE WHEN am.attribute_name = 'vessel_name'       THEN am.master_value END) AS vessel_name,
  MAX(CASE WHEN am.attribute_name = 'flag_code'         THEN am.master_value END) AS flag_code,
  MAX(CASE WHEN am.attribute_name = 'ship_type'         THEN am.master_value END) AS ship_type,
  MAX(CASE WHEN am.attribute_name = 'dwt'               THEN am.master_value END) AS dwt,
  MAX(CASE WHEN am.attribute_name = 'registered_owner'  THEN am.master_value END) AS registered_owner,
  MAX(am.transaction_time) AS last_updated
FROM \`sp-maritime-prod.master.attr_master\` am
WHERE am.entity IN ('identity','dimensions','flag','ownership')
  AND am.valid_from <= TIMESTAMP('2024-01-01')
  AND (am.valid_to IS NULL OR am.valid_to > TIMESTAMP('2024-01-01'))
  AND am.transaction_time <= TIMESTAMP('2024-02-01')
  AND (am.transaction_end_time IS NULL OR am.transaction_end_time > TIMESTAMP('2024-02-01'))
GROUP BY am.imo_number
ORDER BY am.imo_number
LIMIT 1000;`},
  {n:9,title:'Sanctions Cross-Reference',desc:'Cross-reference vessels and owners against sanctions lists',badge:'t',badgeLabel:'Temporal',sql:`-- Sanctions screening cross-reference

SELECT
  ss.imo_number,
  ss.vessel_name,
  ss.owner,
  ss.list_name,
  ss.match_type,
  ss.match_score,
  ss.screening_date,
  ss.status,
  vi.flag_code,
  vo.beneficial_owner,
  vo.registered_owner
FROM \`sp-maritime-prod.entity_views.sanctions_screening\` ss
LEFT JOIN \`sp-maritime-prod.entity_views.vessel_identity\` vi ON ss.imo_number = vi.imo_number
LEFT JOIN \`sp-maritime-prod.entity_views.vessel_ownership\` vo
  ON ss.imo_number = vo.imo_number AND vo.valid_to IS NULL
WHERE ss.status IN ('HIT', 'POTENTIAL_HIT', 'UNDER_REVIEW')
  AND ss.screening_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
ORDER BY ss.match_score DESC, ss.screening_date DESC
LIMIT 200;`},
  {n:10,title:'Audit Trail for Attribute',desc:'Full audit log — who changed what, when, and why',badge:'bt',badgeLabel:'Bi-Temporal',sql:`-- Full audit trail for an attribute
-- Immutable compliance log: every change to registered_owner

SELECT
  al.audit_id,
  al.event_ts,
  al.event_type,
  al.actor,
  al.imo_number,
  al.attribute_name,
  al.old_value,
  al.new_value,
  al.source_feed_id,
  al.hil_id
FROM \`sp-maritime-prod.etl_ops.audit_log\` al
WHERE al.imo_number = '9412345'
  AND al.attribute_name = 'registered_owner'
ORDER BY al.event_ts DESC
LIMIT 500;`},
];

/* ─── Result Sets ─── */
const RESULT_SETS = {
  default_res: {
    cols:['entity','attribute_name','master_value','master_source','valid_from','valid_to','transaction_time','master_score'],
    rows:[
      ['class','class_notation','100A1 +LMC UMS','DNV_GL','2021-08-01 00:00:00 UTC','NULL','2021-08-01 09:12:44 UTC','0.98'],
      ['class','class_society','DNV GL','DNV_GL','2021-08-01 00:00:00 UTC','NULL','2021-08-01 09:12:44 UTC','0.99'],
      ['dimensions','dwt','81412','IHS_FAIRPLAY','2009-06-22 00:00:00 UTC','NULL','2009-06-22 07:38:11 UTC','0.97'],
      ['dimensions','gross_tonnage','44199','IHS_FAIRPLAY','2009-06-22 00:00:00 UTC','NULL','2009-06-22 07:38:11 UTC','0.97'],
      ['flag','flag_code','MH','LIBERIA_FLAG','2019-03-15 00:00:00 UTC','NULL','2019-03-15 14:08:31 UTC','1.00'],
      ['identity','vessel_name','PACIFIC VOYAGER','IHS_FAIRPLAY','2009-06-22 00:00:00 UTC','NULL','2009-06-22 07:38:11 UTC','1.00'],
      ['identity','vessel_status','In Service','IHS_FAIRPLAY','2009-06-22 00:00:00 UTC','NULL','2009-06-22 07:38:11 UTC','0.96'],
      ['ownership','registered_owner','Seaspan Corp','IHS_FAIRPLAY','2023-04-12 00:00:00 UTC','NULL','2023-04-12 09:14:22 UTC','0.95'],
    ]
  },
  vendor_conflict: {
    cols:['source_vendor','raw_value','normalised_value','match_score','qc_passed','valid_from','transaction_time','master_value'],
    rows:[
      ['IHS_FAIRPLAY','Seaspan Corp','Seaspan Corp','0.95','true','2023-04-12 00:00','2023-04-12 09:14:22','Seaspan Corp'],
      ['DNV_GL','Seaspan Corporation','Seaspan Corp','0.92','true','2023-04-14 00:00','2023-04-14 11:22:07','Seaspan Corp'],
      ['LR','SEASPAN CORP','Seaspan Corp','0.91','true','2023-05-01 00:00','2023-05-01 08:44:51','Seaspan Corp'],
      ['BV','Seaspan Corp Ltd','Seaspan Corp','0.88','true','2023-04-18 00:00','2023-04-18 14:32:17','Seaspan Corp'],
      ['PANAMA_FLAG','SEASPAN CORPORATION','Seaspan Corp','0.87','true','2023-04-20 00:00','2023-04-20 07:14:44','Seaspan Corp'],
    ]
  },
  ownership_history: {
    cols:['imo_number','attribute_name','master_value','master_source','master_score','valid_from','valid_to','days_held','previous_value'],
    rows:[
      ['9412345','registered_owner','Seaspan Corp','IHS_FAIRPLAY','0.95','2023-04-12 00:00','NULL','748','Ocean Star Holdings'],
      ['9412345','registered_owner','Ocean Star Holdings','IHS_FAIRPLAY','0.94','2019-03-15 00:00','2023-04-11 23:59:59','1488','Orient Bulk Carriers'],
      ['9412345','registered_owner','Orient Bulk Carriers','LR','0.93','2013-06-08 00:00','2019-03-14 23:59:59','2105','NULL'],
      ['9412345','technical_manager','BSM Crew Services','IHS_FAIRPLAY','0.97','2021-08-01 00:00','NULL','1373','V.Ships'],
      ['9412345','technical_manager','V.Ships','IHS_FAIRPLAY','0.96','2016-11-22 00:00','2021-07-31 23:59:59','1713','Columbia Shipmanagement'],
    ]
  },
  cert_expiry: {
    cols:['imo_number','vessel_name','flag_code','cert_type','issued_by','expiry_date','days_until_expiry','urgency'],
    rows:[
      ['9412345','PACIFIC VOYAGER','MH','SMC','DNV GL','2026-05-14','9','CRITICAL'],
      ['9551474','ATLAS CARRIER','LR','DOC','Bureau Veritas','2026-05-28','23','CRITICAL'],
      ['9187288','OCEAN PIONEER','BS','ISM',"Lloyd's Register",'2026-06-01','27','ADVISORY'],
      ['9334082','NORDIC SPIRIT','PA','IOPP','ClassNK','2026-05-19','14','CRITICAL'],
      ['9819570','MAERSK EINDHOVEN','DK','CLC','DNV GL','2026-06-12','38','WARNING'],
    ]
  },
  psc_history: {
    cols:['imo_number','vessel_name','port','mou_region','inspection_date','deficiency_count','detention','status'],
    rows:[
      ['9412345','PACIFIC VOYAGER','Singapore','Tokyo MOU','2026-02-28','4','false','Completed'],
      ['9412345','PACIFIC VOYAGER','Rotterdam','Paris MOU','2025-09-14','7','true','Completed'],
      ['9412345','PACIFIC VOYAGER','Piraeus','Paris MOU','2025-03-22','2','false','Completed'],
      ['9412345','PACIFIC VOYAGER','Shanghai','Tokyo MOU','2024-11-08','5','false','Completed'],
      ['9412345','PACIFIC VOYAGER','Port Klang','Tokyo MOU','2024-06-17','9','true','Completed'],
    ]
  },
  ais_track: {
    cols:['imo_number','mmsi','latitude','longitude','speed','nav_status','timestamp','source_ais_provider'],
    rows:[
      ['9412345','636015441','25.0844','55.1412','0.1','At Anchor','2026-04-30 18:44:00','AIS_EXACTEARTH'],
      ['9412345','636015441','25.0211','55.0188','8.2','Under Way','2026-04-29 14:12:00','AIS_SPIRE'],
      ['9412345','636015441','24.8812','54.7441','10.4','Under Way','2026-04-28 22:08:00','AIS_EXACTEARTH'],
      ['9412345','636015441','24.4412','54.1882','11.8','Under Way','2026-04-27 08:44:00','AIS_SPIRE'],
      ['9412345','636015441','23.8212','53.4141','12.1','Under Way','2026-04-26 16:22:00','AIS_EXACTEARTH'],
    ]
  },
  port_calls: {
    cols:['imo_number','voyage_number','port_name','arrival_time','departure_time','days_in_port','cargo_type'],
    rows:[
      ['9412345','V-2026-042','Jebel Ali','2026-04-30 20:00','NULL','4.8','Iron Ore'],
      ['9412345','V-2026-041','Fujairah','2026-04-22 14:00','2026-04-28 06:00','5.7','Bunkers'],
      ['9412345','V-2026-040','Rotterdam','2026-04-08 08:00','2026-04-20 16:00','12.3','Iron Ore'],
      ['9412345','V-2026-039','Singapore','2026-03-24 18:00','2026-04-04 10:00','10.7','General Cargo'],
      ['9412345','V-2026-038','Qingdao','2026-03-10 06:00','2026-03-21 14:00','11.3','Coal'],
    ]
  },
  fleet_snapshot: {
    cols:['imo_number','vessel_name','flag_code','ship_type','dwt','registered_owner','last_updated'],
    rows:[
      ['9412345','PACIFIC VOYAGER','MH','Bulk Carrier','81412','Seaspan Corp','2023-04-12 09:14:22'],
      ['9441894','ENERGY TITAN','PA','Crude Oil Tanker','159882','Ocean Star Holdings','2022-07-18 11:22:08'],
      ['9551474','ATLAS CARRIER','LR','Product Tanker','48412','Nordic Tankers AS','2021-02-04 08:44:51'],
      ['9187288','OCEAN PIONEER','BS','LNG Carrier','98441','Pacific Ventures','2023-11-30 14:32:17'],
      ['9819570','MAERSK EINDHOVEN','DK','Container Ship','22118','A.P. Moller - Maersk','2020-03-22 07:14:44'],
    ]
  },
  sanctions: {
    cols:['imo_number','vessel_name','owner','list_name','match_type','match_score','screening_date','status','flag_code'],
    rows:[
      ['9412345','PACIFIC VOYAGER','Seaspan Corp','OFAC SDN','VESSEL_IMO','0.00','2026-05-05','CLEAR','MH'],
      ['9334082','NORDIC SPIRIT','Nordic Chem AS','OFAC SDN','OWNER_NAME','0.34','2026-05-04','POTENTIAL_HIT','PA'],
      ['9187288','OCEAN PIONEER','Pacific Ventures LLC','UK OFSI','VESSEL_IMO','0.00','2026-05-03','CLEAR','BS'],
    ]
  },
  audit: {
    cols:['audit_id','event_ts','event_type','actor','old_value','new_value','source_feed_id','hil_id'],
    rows:[
      ['AUD-2023-08841','2023-04-12 09:14:22','MASTER_UPDATE','system@sp-maritime','Ocean Star Holdings','Seaspan Corp','IHS_FP_2023_0412','NULL'],
      ['AUD-2021-04412','2021-08-01 09:12:44','MASTER_UPDATE','system@sp-maritime','Orient Bulk Carriers','Ocean Star Holdings','IHS_FP_2021_0801','HIL-2021-0312'],
      ['AUD-2019-01882','2019-03-15 14:08:31','MANUAL_OVERRIDE','a.chen@sp-maritime','NULL','Orient Bulk Carriers','LR_2019_0315','HIL-2019-0088'],
    ]
  },
};

const INIT_HISTORY = [
  {sql:'-- Bi-temporal point-in-time query\nSELECT am.imo_number, am.entity...',rows:8,ms:342,ts:'2026-05-05 16:44',status:'ok'},
  {sql:'SELECT av.source_vendor, av.raw_value, av.match_score...',rows:5,ms:1247,ts:'2026-05-05 16:38',status:'ok'},
  {sql:'SELECT am.imo_number, am.attribute_name, am.master_value...',rows:5,ms:884,ts:'2026-05-05 16:22',status:'ok'},
  {sql:'SELECT pc.imo_number, pc.port_name, pc.arrival_time...',rows:5,ms:2103,ts:'2026-05-05 15:58',status:'ok'},
  {sql:'SELECT * FROM `sp-maritime-prod.master.attr_master` WHERE...',rows:0,ms:412,ts:'2026-05-05 15:44',status:'err'},
  {sql:'SELECT vc.imo_number, vc.cert_type, vc.expiry_date...',rows:5,ms:3281,ts:'2026-05-05 15:31',status:'ok'},
  {sql:'SELECT ss.imo_number, ss.list_name, ss.match_type...',rows:4,ms:1441,ts:'2026-05-05 14:52',status:'ok'},
];

/* ─── Syntax Highlighting ─── */
function highlightSQL(code) {
  const RE_KW = /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|DISTINCT|UNION ALL|UNION|WITH|CASE|WHEN|THEN|ELSE|END|IS|NULL|LIKE|BETWEEN|EXISTS|OVER|PARTITION BY|ROWS|PRECEDING|CURRENT ROW|FOLLOWING|ASC|DESC|TRUE|FALSE|INSERT|UPDATE|DELETE|CREATE|TABLE|VIEW|INTERVAL|BY)\b/gi;
  const RE_FN = /\b(COUNT|SUM|AVG|MAX|MIN|ROUND|COALESCE|TIMESTAMP_DIFF|DATE_DIFF|DATE_SUB|DATE_ADD|CURRENT_DATE|CURRENT_TIMESTAMP|TIMESTAMP|DATE|EXTRACT|CAST|CONCAT|LOWER|UPPER|TRIM|LENGTH|IFNULL|IF|NULLIF|LAG|LEAD|RANK|ROW_NUMBER|ST_DISTANCE|ST_GEOGPOINT|ANY_VALUE)\b(?=\s*\()/gi;
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function processLine(line) {
    line = line.replace(/`[^`]+`/g, m => `<span style="color:#e5c07b">${m}</span>`);
    line = line.replace(/'([^']*)'/g, (m, g) => `<span style="color:#98c379">'${g}'</span>`);
    line = line.replace(RE_FN, m => `<span style="color:#61afef">${m}</span>`);
    line = line.replace(RE_KW, m => `<span style="color:#c678dd">${m}</span>`);
    line = line.replace(/\b(\d+(?:\.\d+)?)\b/g, m => `<span style="color:#d19a66">${m}</span>`);
    return line;
  }
  return esc(code).split('\n').map(line => {
    const ci = line.indexOf('--');
    if (ci !== -1) return processLine(line.slice(0, ci)) + `<span style="color:rgba(255,255,255,.35);font-style:italic">${line.slice(ci)}</span>`;
    return processLine(line);
  }).join('\n');
}

const DS_COLORS = { raw: '#d19a66', master: '#c678dd', views: '#61afef', etl: '#98c379' };

export default function Bigquery() {
  const [project, setProject] = useState('sp-maritime-prod');
  const [dsSel, setDsSel] = useState('');
  const [schOpen, setSchOpen] = useState(true);
  const [schSrch, setSchSrch] = useState('');
  const [expandedDs, setExpandedDs] = useState({ raw_ingest: true, master: true, entity_views: true, etl_ops: true });
  const [expandedTbl, setExpandedTbl] = useState({});
  const [selTbl, setSelTbl] = useState(null);
  const [sql, setSql] = useState(TEMPLATES[0].sql);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [resLabel, setResLabel] = useState('No query run');
  const [mBytes, setMBytes] = useState('—');
  const [mTime, setMTime] = useState('—');
  const [mRows, setMRows] = useState('—');
  const [cursor, setCursor] = useState('1:1');
  const [history, setHistory] = useState(INIT_HISTORY);
  const [toast, setToast] = useState('');
  const [toastVis, setToastVis] = useState(false);
  const toastTimer = useRef(null);
  const taRef = useRef(null);
  const hlRef = useRef(null);
  const lnRef = useRef(null);
  const progTimer = useRef(null);

  function showToast(msg) {
    setToast(msg);
    setToastVis(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVis(false), 2500);
  }

  function updateLineNums(s) {
    const count = (s.match(/\n/g) || []).length + 1;
    if (lnRef.current) {
      lnRef.current.innerHTML = Array.from({ length: count }, (_, i) => `<div style="padding:0 8px;height:19.2px">${i + 1}</div>`).join('');
    }
  }

  function updateHL(s) {
    if (hlRef.current) hlRef.current.innerHTML = highlightSQL(s);
    updateLineNums(s);
  }

  function updateCursor() {
    if (!taRef.current) return;
    const txt = taRef.current.value.slice(0, taRef.current.selectionStart);
    const ls = txt.split('\n');
    setCursor(`${ls.length}:${ls[ls.length - 1].length + 1}`);
  }

  useEffect(() => { updateHL(sql); }, [sql]);

  function onSqlChange(e) {
    setSql(e.target.value);
  }

  function syncScroll() {
    if (!taRef.current || !hlRef.current || !lnRef.current) return;
    const ta = taRef.current;
    hlRef.current.style.transform = `translate(-${ta.scrollLeft}px, -${ta.scrollTop}px)`;
    lnRef.current.style.transform = `translateY(-${ta.scrollTop}px)`;
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target, s = ta.selectionStart;
      const newVal = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
      setSql(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2; updateCursor(); }, 0);
    }
    setTimeout(updateCursor, 0);
  }

  function pickResults(s) {
    const sl = s.toLowerCase();
    if (sl.includes('transaction_end_time') || (sl.includes('transaction_time') && sl.includes('valid_from') && sl.includes('entity'))) return RESULT_SETS.default_res;
    if (sl.includes('source_vendor') || (sl.includes('match_score') && sl.includes('raw_value'))) return RESULT_SETS.vendor_conflict;
    if (sl.includes('premaster_value') || (sl.includes('ownership') && sl.includes('days_held'))) return RESULT_SETS.ownership_history;
    if (sl.includes('expiry_date') && sl.includes('cert')) return RESULT_SETS.cert_expiry;
    if (sl.includes('psc') || sl.includes('detention') || sl.includes('mou_region')) return RESULT_SETS.psc_history;
    if (sl.includes('latitude') && sl.includes('longitude')) return RESULT_SETS.ais_track;
    if (sl.includes('port_name') || sl.includes('arrival_time')) return RESULT_SETS.port_calls;
    if (sl.includes('master_value') && sl.includes('group by')) return RESULT_SETS.fleet_snapshot;
    if (sl.includes('sanctions') || sl.includes('match_type')) return RESULT_SETS.sanctions;
    if (sl.includes('audit_log') || sl.includes('old_value')) return RESULT_SETS.audit;
    return RESULT_SETS.default_res;
  }

  function runQuery() {
    if (!sql.trim()) { showToast('Nothing to run — editor is empty'); return; }
    setRunning(true);
    setResults(null);
    setProgress(0);
    setResLabel('Executing…');
    let pct = 0;
    if (progTimer.current) clearInterval(progTimer.current);
    progTimer.current = setInterval(() => {
      pct = Math.min(pct + Math.random() * 22, 88);
      setProgress(pct);
    }, 180);
    const delay = 480 + Math.random() * 600;
    setTimeout(() => {
      clearInterval(progTimer.current);
      setProgress(100);
      const rs = pickResults(sql);
      const ms = Math.round(delay);
      const bytes = (Math.random() * 800 + 80).toFixed(0) + ' MB';
      setMBytes(bytes); setMTime(ms + ' ms'); setMRows(rs.rows.length + ' rows');
      setResLabel(`${rs.rows.length} row${rs.rows.length !== 1 ? 's' : ''} · ${ms} ms · ${bytes} processed`);
      setResults(rs);
      setRunning(false);
      const now = new Date();
      const ts = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB').slice(0, 5);
      const short = sql.replace(/\s+/g, ' ').slice(0, 80) + (sql.length > 80 ? '…' : '');
      setHistory(prev => [{ sql: short, rows: rs.rows.length, ms, ts, status: 'ok' }, ...prev].slice(0, 20));
    }, delay);
  }

  function loadTemplate(idx) {
    setSql(TEMPLATES[idx].sql);
    showToast(`Loaded: ${TEMPLATES[idx].title}`);
  }

  function selectTable(dsId, tblName) {
    const key = dsId + '.' + tblName;
    setSelTbl(key);
    setExpandedTbl(prev => ({ ...prev, [key]: !prev[key] }));
    setSql(`SELECT *\nFROM \`${project}.${dsId}.${tblName}\`\nLIMIT 100;`);
  }

  const schemaFiltered = useMemo(() => {
    const q = schSrch.toLowerCase();
    return SCHEMA.datasets.filter(ds => {
      if (dsSel && ds.id !== dsSel) return false;
      if (!q) return true;
      return ds.tables.some(t =>
        t.name.toLowerCase().includes(q) ||
        ds.id.toLowerCase().includes(q) ||
        t.cols.some(c => c.n.toLowerCase().includes(q) || (c.d || '').toLowerCase().includes(q))
      );
    });
  }, [schSrch, dsSel]);

  function renderCell(cell, colName) {
    if (cell === 'NULL') return <td key={colName} style={{ color: '#aaa', fontStyle: 'italic' }}>NULL</td>;
    if (colName === 'master_score' || colName === 'match_score') {
      const v = parseFloat(cell);
      const c = v >= 0.9 ? '#137333' : v >= 0.7 ? '#b45309' : '#c8102e';
      return <td key={colName} style={{ color: c, fontWeight: 700 }}>{cell}</td>;
    }
    if (colName === 'master_source' || colName === 'source_vendor') return <td key={colName} style={{ color: '#0094b3' }}>{cell}</td>;
    if (colName === 'entity') return <td key={colName} style={{ color: '#6200ea', fontWeight: 600 }}>{cell}</td>;
    return <td key={colName}>{cell}</td>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <style>{`
        .bq-trow:hover td { background: #fffbe6; }
        @keyframes bq-spin { to { transform: rotate(360deg); } }
        @keyframes bq-blink { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes bq-prog { 0%{width:30%} 100%{width:85%} }
        @keyframes bq-toast { from{opacity:0;transform:translateX(-50%) translateY(6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--bdr)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, height: 38 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Project</span>
        <select value={project} onChange={e => { setProject(e.target.value); showToast('Switched to ' + e.target.value); }} style={{ border: '1px solid var(--bdr)', borderRadius: 4, fontSize: 11.5, fontFamily: 'inherit', color: 'var(--txt)', background: '#fff', padding: '3px 8px', cursor: 'pointer', outline: 'none' }}>
          <option value="sp-maritime-prod">sp-maritime-prod</option>
          <option value="sp-maritime-dev">sp-maritime-dev</option>
          <option value="sp-maritime-staging">sp-maritime-staging</option>
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--bdr)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Dataset</span>
        <select value={dsSel} onChange={e => setDsSel(e.target.value)} style={{ border: '1px solid var(--bdr)', borderRadius: 4, fontSize: 11.5, fontFamily: 'inherit', color: 'var(--txt)', background: '#fff', padding: '3px 8px', cursor: 'pointer', outline: 'none' }}>
          <option value="">All datasets</option>
          {SCHEMA.datasets.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--bdr)' }} />
        <button onClick={() => setSchOpen(p => !p)} style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, padding: '4px 11px', cursor: 'pointer', border: '1px solid var(--bdr)', background: '#fff', color: 'var(--txt)', fontFamily: 'inherit' }}>
          {schOpen ? '◀' : '▶'} Schema
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>Billing: <strong style={{ color: 'var(--txt)' }}>sp-maritime-prod</strong></span>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>Region: <strong style={{ color: 'var(--txt)' }}>us-central1</strong></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#137333' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#137333', display: 'inline-block', animation: 'bq-blink 2.4s infinite' }} />
            Connected
          </span>
        </div>
      </div>

      {/* Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Schema browser */}
        {schOpen && (
          <div style={{ width: 320, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.18s' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)' }}>Schema Browser</span>
              <button onClick={() => setSchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, lineHeight: 1 }}>✕</button>
            </div>
            <input
              placeholder="Search tables, columns, descriptions…"
              value={schSrch}
              onChange={e => setSchSrch(e.target.value)}
              style={{ border: '1px solid var(--bdr)', borderRadius: 4, fontSize: 11, padding: '4px 8px', margin: '7px 10px 4px', outline: 'none', color: 'var(--txt)' }}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0 8px' }}>
              <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#d19a66' }}>◆</span> {project}
              </div>
              {schemaFiltered.map(ds => (
                <div key={ds.id}>
                  <div
                    onClick={() => setExpandedDs(prev => ({ ...prev, [ds.id]: !prev[ds.id] }))}
                    style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: 'var(--txt)', borderLeft: `3px solid ${DS_COLORS[ds.dsClass]}` }}
                  >
                    <span style={{ fontSize: 9, color: 'var(--muted)', transition: 'transform 0.15s', transform: expandedDs[ds.id] ? 'rotate(90deg)' : 'none', display: 'inline-block', width: 10 }}>▶</span>
                    <span>{ds.icon}</span>
                    <span style={{ flex: 1 }}>{ds.label}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)' }}>{ds.tables.length} obj</span>
                  </div>
                  {expandedDs[ds.id] && ds.tables.filter(t => {
                    const q = schSrch.toLowerCase();
                    if (!q) return true;
                    return t.name.toLowerCase().includes(q) || t.cols.some(c => c.n.toLowerCase().includes(q) || (c.d || '').toLowerCase().includes(q));
                  }).map(t => {
                    const key = ds.id + '.' + t.name;
                    const isSel = selTbl === key;
                    const isExpanded = expandedTbl[key];
                    const isView = t.kind === 'view';
                    return (
                      <div key={t.name}>
                        <div
                          onClick={() => selectTable(ds.id, t.name)}
                          style={{
                            padding: '4px 12px 4px 32px', display: 'flex', alignItems: 'center', gap: 6,
                            cursor: 'pointer', fontSize: 11,
                            color: isSel ? (isView ? '#0094b3' : '#1558d6') : 'var(--txt)',
                            background: isSel ? (isView ? '#e0f7fa' : '#e8f0fe') : 'transparent',
                            transition: 'background 0.1s',
                          }}
                        >
                          <span style={{ fontSize: 9, color: 'var(--muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', display: 'inline-block', width: 10, transition: 'transform 0.15s' }}>▶</span>
                          <span>{isView ? '👁' : '📋'}</span>
                          <span style={{ flex: 1 }}>{t.name}</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>{t.rows}</span>
                        </div>
                        {isExpanded && t.cols.map(c => {
                          const hl = schSrch && (c.n.toLowerCase().includes(schSrch.toLowerCase()) || (c.d || '').toLowerCase().includes(schSrch.toLowerCase()));
                          return (
                            <div key={c.n} style={{ padding: '2px 12px 2px 50px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', background: c.temporal ? 'rgba(200,16,46,.04)' : hl ? '#fef3c7' : 'transparent' }}>
                              <span style={{ fontSize: 9 }}>○</span>
                              <span>{c.n}</span>
                              <span style={{ fontSize: 9, background: 'var(--bg)', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>{c.t}</span>
                              {c.temporal && <span style={{ fontSize: 8, background: 'rgba(200,16,46,.12)', color: '#c8102e', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>BT</span>}
                              {c.d && <span style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={c.d}>{c.d}</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center: Editor + Results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Editor toolbar */}
          <div style={{ background: '#1a1d1f', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, borderBottom: '1px solid #2d3136' }}>
            <button
              onClick={runQuery}
              disabled={running}
              style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, padding: '4px 11px', cursor: running ? 'default' : 'pointer', border: '1px solid #c8102e', background: '#c8102e', color: '#fff', fontFamily: 'inherit', opacity: running ? 0.5 : 1 }}
            >
              {running ? '⏳ Running…' : '▶ Run Query'} <span style={{ fontSize: 9, opacity: 0.6 }}>Ctrl+Enter</span>
            </button>
            {[
              ['⌨ Format', () => { const KWS = ['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING','LEFT JOIN','INNER JOIN','JOIN','ON','LIMIT','WITH']; let s = sql; KWS.forEach(kw => { s = s.replace(new RegExp('\\b'+kw+'\\b','gi'), m => '\n'+m.toUpperCase()+' '); }); setSql(s.replace(/\n{3,}/g,'\n\n').trim()); showToast('SQL formatted'); }],
              ['📋 Copy', () => navigator.clipboard.writeText(sql).then(() => showToast('Copied to clipboard'))],
              ['✕ Clear', () => { setSql(''); setResults(null); setResLabel('No query run'); setMBytes('—'); setMTime('—'); setMRows('—'); }],
            ].map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, padding: '4px 11px', cursor: 'pointer', border: '1px solid #3d4248', background: '#2d3136', color: 'rgba(255,255,255,.7)', fontFamily: 'inherit' }}>{lbl}</button>
            ))}
            <div style={{ width: 1, height: 20, background: '#3d4248', margin: '0 2px' }} />
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
              <span>Bytes: <strong style={{ color: 'rgba(255,255,255,.8)' }}>{mBytes}</strong></span>
              <span>Time: <strong style={{ color: 'rgba(255,255,255,.8)' }}>{mTime}</strong></span>
              <span>Rows: <strong style={{ color: 'rgba(255,255,255,.8)' }}>{mRows}</strong></span>
            </div>
          </div>

          {/* SQL Editor */}
          <div style={{ position: 'relative', display: 'flex', background: '#1a1d1f', flexShrink: 0, height: 260, overflow: 'hidden', borderBottom: '1px solid #2d3136' }}>
            <div ref={lnRef} style={{ width: 42, flexShrink: 0, background: '#141618', paddingTop: 10, textAlign: 'right', fontFamily: 'monospace', fontSize: 12, lineHeight: '19.2px', color: '#3d4248', userSelect: 'none', overflow: 'hidden' }} />
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} onScroll={syncScroll}>
              <div ref={hlRef} style={{ position: 'relative', minHeight: '100%', padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, lineHeight: '19.2px', color: '#abb2bf', whiteSpace: 'pre', minWidth: 'fit-content', pointerEvents: 'none' }} />
              <textarea
                ref={taRef}
                value={sql}
                onChange={onSqlChange}
                onKeyDown={handleKeyDown}
                onScroll={syncScroll}
                onClick={updateCursor}
                onKeyUp={updateCursor}
                spellCheck={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, lineHeight: '19.2px', color: 'transparent', background: 'transparent', border: 'none', outline: 'none', resize: 'none', caretColor: '#abb2bf', zIndex: 2, whiteSpace: 'pre', overflow: 'auto', minWidth: '100%', tabSize: 2 }}
              />
            </div>
          </div>

          {/* Results toolbar */}
          <div style={{ background: '#1a1d1f', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderBottom: '1px solid #2d3136' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>Results: <strong style={{ color: 'rgba(255,255,255,.8)' }}>{resLabel}</strong></span>
            {running && (
              <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 2, height: 3, overflow: 'hidden', width: 160 }}>
                <div style={{ height: '100%', background: '#c8102e', borderRadius: 2, width: progress + '%', transition: 'width .2s ease' }} />
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {results && ['⬇ CSV', '⬇ JSON'].map(lbl => (
                <button key={lbl} onClick={() => showToast(`Exporting ${lbl.replace('⬇ ', '')}…`)} style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, padding: '4px 11px', cursor: 'pointer', border: '1px solid #3d4248', background: '#2d3136', color: 'rgba(255,255,255,.7)', fontFamily: 'inherit' }}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Results body */}
          <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
            {running ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', gap: 10 }}>
                <div style={{ width: 28, height: 28, border: '3px solid rgba(0,0,0,.1)', borderTopColor: '#c8102e', borderRadius: '50%', animation: 'bq-spin .7s linear infinite' }} />
                <div style={{ fontSize: 11 }}>Executing query…</div>
              </div>
            ) : results ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>{results.cols.map(c => <th key={c} style={{ background: 'var(--bg)', borderBottom: '2px solid var(--bdr)', borderRight: '1px solid var(--bdr)', padding: '6px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 1, fontFamily: 'monospace' }}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {results.rows.map((row, ri) => (
                    <tr key={ri} className="bq-trow">
                      {row.map((cell, ci) => {
                        const colName = results.cols[ci];
                        const base = { borderBottom: '1px solid var(--bdr)', borderRight: '1px solid #f0f2f5', padding: '5px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--txt)', whiteSpace: 'nowrap' };
                        if (cell === 'NULL') return <td key={ci} style={{ ...base, color: '#aaa', fontStyle: 'italic' }}>NULL</td>;
                        if (colName === 'master_score' || colName === 'match_score') { const v = parseFloat(cell); const c = v >= 0.9 ? '#137333' : v >= 0.7 ? '#b45309' : '#c8102e'; return <td key={ci} style={{ ...base, color: c, fontWeight: 700 }}>{cell}</td>; }
                        if (colName === 'master_source' || colName === 'source_vendor') return <td key={ci} style={{ ...base, color: '#0094b3' }}>{cell}</td>;
                        if (colName === 'entity') return <td key={ci} style={{ ...base, color: '#6200ea', fontWeight: 600 }}>{cell}</td>;
                        return <td key={ci} style={base}>{cell}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', gap: 10 }}>
                <div style={{ fontSize: 32, opacity: 0.4 }}>🔬</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Run a query to see results</div>
                <div style={{ fontSize: 11 }}>Press Ctrl+Enter or click Run Query</div>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div style={{ padding: '3px 10px', background: '#2d3136', fontSize: 10, color: 'rgba(255,255,255,.45)', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            <span>sp-maritime-prod · us-central1 · BigQuery</span>
            <span>{running ? 'Running query…' : results ? `Complete — ${results.rows.length} rows` : 'Ready'}</span>
            <span style={{ marginLeft: 'auto' }}>Cursor: {cursor}</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 340, flexShrink: 0, background: '#fff', borderLeft: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Templates */}
          <div style={{ borderBottom: '1px solid var(--bdr)', flexShrink: 0 }}>
            <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Query Templates
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {TEMPLATES.map(t => (
                <div key={t.n} onClick={() => loadTemplate(t.n - 1)} style={{ padding: '8px 12px', borderBottom: '1px solid var(--bdr)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 10, fontWeight: 700, minWidth: 16 }}>{t.n}.</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt)' }}>{t.title}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.3, background: t.badge === 'bt' ? 'rgba(200,16,46,.12)' : 'rgba(21,88,214,.1)', color: t.badge === 'bt' ? '#c8102e' : '#1558d6', flexShrink: 0 }}>{t.badgeLabel}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', background: 'var(--bg)', flexShrink: 0 }}>
              Query History
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {history.map((h, i) => (
                <div key={i} style={{ padding: '7px 12px', borderBottom: '1px solid var(--bdr)' }}>
                  <div
                    onClick={() => { setSql(h.fullSql || h.sql); showToast('Query loaded from history'); }}
                    style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1558d6'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--txt)'}
                  >{h.sql}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: 'var(--muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9, letterSpacing: 0.3, textTransform: 'uppercase', background: h.status === 'ok' ? '#e6f4ea' : '#fce8e6', color: h.status === 'ok' ? '#137333' : '#c5221f' }}>{h.status === 'ok' ? 'OK' : 'ERR'}</span>
                    <span>{h.rows} rows</span>
                    <span>{h.ms} ms</span>
                    <span style={{ marginLeft: 'auto' }}>{h.ts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastVis && (
        <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: '#1a1d1f', color: '#fff', padding: '8px 18px', borderRadius: 20, fontSize: 11, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,.35)', pointerEvents: 'none', animation: 'bq-toast .18s ease' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
