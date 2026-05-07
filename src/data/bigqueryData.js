export const DEFAULT_QUERY = `-- Bi-temporal point-in-time query
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
ORDER BY am.entity, am.attribute_name;`

export const BQ_SCHEMA = {
  project: 'sp-maritime-prod',
  datasets: [
    {
      id: 'raw_ingest', label: 'raw_ingest', dsClass: 'ds-raw', icon: '📥',
      desc: 'Every attribute value received from every vendor — the immutable ledger',
      tables: [
        { name:'attr_vendor', kind:'table', rows:'412M',
          desc:'One row per IMO × attribute × vendor × received_timestamp',
          cols:[
            {n:'feed_run_id',      t:'STRING',          d:'FK → etl_run_log.run_id'},
            {n:'imo_number',       t:'STRING',          d:'7-digit IMO identifier'},
            {n:'source_vendor',    t:'STRING',          d:'IHS_FAIRPLAY, DNV_GL, LR, BV, CLASSNK, KR, CCS, AIS_EXACTEARTH, AIS_SPIRE, LIBERIA_FLAG, PANAMA_FLAG, EQUASIS_PSC, OFAC, EU_SANCTIONS, BALTIC_EXCHANGE'},
            {n:'entity',           t:'STRING',          d:'identity | dimensions | construction | flag | ownership | class | propulsion | cargo | certs | ais | portcalls | inspections | incidents | sanctions | finance | crew'},
            {n:'attribute_name',   t:'STRING',          d:'e.g. vessel_name, dwt, registered_owner, gross_tonnage'},
            {n:'raw_value',        t:'STRING',          d:'Exactly as received from vendor, before any transformation'},
            {n:'normalised_value', t:'STRING',          d:'After parse/normalise transforms'},
            {n:'data_type',        t:'STRING',          d:'STRING | NUMERIC | DATE | BOOLEAN | JSON'},
            {n:'match_score',      t:'FLOAT64',         d:'0.0–1.0 confidence vs current master; NULL if no master yet'},
            {n:'score_breakdown',  t:'JSON',            d:'{"exact_match":0.0,"format_diff":0.1,"range_score":0.9}'},
            {n:'qc_passed',        t:'BOOL',            d:'Whether this value passed all QC rules'},
            {n:'qc_flags',         t:'ARRAY<STRING>',   d:"['FORMAT_VALID','RANGE_CHECK_FAIL','CROSS_FIELD_CONFLICT']"},
            {n:'reject_reason',    t:'STRING',          d:'QC rule ID if rejected; NULL if passed'},
            {n:'valid_from',       t:'TIMESTAMP', temporal:true, d:'BI-TEMPORAL — when this value became true in the real world (as stated by vendor)'},
            {n:'valid_to',         t:'TIMESTAMP', temporal:true, d:'BI-TEMPORAL — NULL = still current per this vendor'},
            {n:'transaction_time', t:'TIMESTAMP', temporal:true, d:'BI-TEMPORAL — when WE ingested/processed this row — NEVER changes'},
            {n:'file_name',        t:'STRING',          d:'Source file that delivered this data'},
            {n:'batch_id',         t:'STRING',          d:'Processing batch identifier'},
          ]
        }
      ]
    },
    {
      id: 'master', label: 'master', dsClass: 'ds-master', icon: '⭐',
      desc: 'Golden records with full bi-temporal history — the authoritative source of truth',
      tables: [
        { name:'attr_master', kind:'table', rows:'28M',
          desc:'Golden record per IMO × entity × attribute — every change creates a new row',
          cols:[
            {n:'imo_number',          t:'STRING',    d:'7-digit IMO identifier'},
            {n:'entity',              t:'STRING',    d:'Same values as attr_vendor.entity'},
            {n:'attribute_name',      t:'STRING',    d:'Attribute being mastered'},
            {n:'master_value',        t:'STRING',    d:'The winning value (displayed in Vessel Detail)'},
            {n:'premaster_value',     t:'STRING',    d:'The value BEFORE the last update (audit/comparison)'},
            {n:'master_source',       t:'STRING',    d:'Which vendor won, or MANUAL_OVERRIDE, or MAJORITY_VOTE, or AUTO_SCORE'},
            {n:'master_score',        t:'FLOAT64',   d:'Confidence of winning value; NULL if MANUAL_OVERRIDE'},
            {n:'auto_updated',        t:'BOOL',      d:'TRUE = auto-promoted (score >= 0.95); FALSE = analyst decision'},
            {n:'hil_required',        t:'BOOL',      d:'Flagged for Human-in-Loop review'},
            {n:'hil_status',          t:'STRING',    d:'NULL | Pending | Reviewing | Approved | Rejected'},
            {n:'override_value',      t:'STRING',    d:'Analyst-set value if MANUAL_OVERRIDE'},
            {n:'override_user',       t:'STRING',    d:'FK → users.username'},
            {n:'override_comment',    t:'STRING',    d:'Rationale; stored as ML training signal for scoring model'},
            {n:'valid_from',          t:'TIMESTAMP', temporal:true, d:'BI-TEMPORAL — when this master value became effective (real-world time)'},
            {n:'valid_to',            t:'TIMESTAMP', temporal:true, d:'BI-TEMPORAL — NULL = currently the active golden record'},
            {n:'transaction_time',    t:'TIMESTAMP', temporal:true, d:'BI-TEMPORAL — when this record was written to master — NEVER changes'},
            {n:'transaction_end_time',t:'TIMESTAMP', temporal:true, d:'BI-TEMPORAL — when this master record was superseded in our system'},
          ]
        }
      ]
    },
    {
      id: 'entity_views', label: 'entity_views', dsClass: 'ds-views', icon: '👁',
      desc: 'Pre-joined entity-specific views for application use (materialized views)',
      tables: [
        {name:'vessel_identity',    kind:'view', rows:'~104K',  desc:'Current identity — imo_number, vessel_name, mmsi, call_sign, ship_type, vessel_status', cols:[{n:'imo_number',t:'STRING'},{n:'vessel_name',t:'STRING'},{n:'mmsi',t:'STRING'},{n:'call_sign',t:'STRING'},{n:'ship_type',t:'STRING'},{n:'vessel_status',t:'STRING'},{n:'imo_ship_type',t:'STRING'},{n:'flag_code',t:'STRING'}]},
        {name:'vessel_dimensions',  kind:'view', rows:'~104K',  desc:'Physical dimensions — gross_tonnage, net_tonnage, dwt, loa, lbp, beam, depth, draught', cols:[{n:'imo_number',t:'STRING'},{n:'gross_tonnage',t:'NUMERIC'},{n:'net_tonnage',t:'NUMERIC'},{n:'dwt',t:'NUMERIC'},{n:'loa',t:'NUMERIC'},{n:'lbp',t:'NUMERIC'},{n:'beam',t:'NUMERIC'},{n:'depth',t:'NUMERIC'},{n:'max_draught',t:'NUMERIC'},{n:'summer_draught',t:'NUMERIC'}]},
        {name:'vessel_ownership',   kind:'view', rows:'~280K',  desc:'Ownership with valid-time history — supports vessels.html + companies.html', cols:[{n:'imo_number',t:'STRING'},{n:'registered_owner',t:'STRING'},{n:'beneficial_owner',t:'STRING'},{n:'commercial_operator',t:'STRING'},{n:'technical_manager',t:'STRING'},{n:'doc_company',t:'STRING'},{n:'pi_club',t:'STRING'},{n:'valid_from',t:'TIMESTAMP',temporal:true},{n:'valid_to',t:'TIMESTAMP',temporal:true}]},
        {name:'vessel_class',       kind:'view', rows:'~110K',  desc:'Classification society, notation, survey dates', cols:[{n:'imo_number',t:'STRING'},{n:'class_society',t:'STRING'},{n:'class_notation',t:'STRING'},{n:'last_annual_survey',t:'DATE'},{n:'next_annual_survey',t:'DATE'},{n:'last_special_survey',t:'DATE'},{n:'next_special_survey',t:'DATE'},{n:'drydock_date',t:'DATE'}]},
        {name:'vessel_certs',       kind:'view', rows:'~2.1M',  desc:'Certificate portfolio — expiry tracking, supports compliance.html', cols:[{n:'imo_number',t:'STRING'},{n:'cert_type',t:'STRING'},{n:'cert_number',t:'STRING'},{n:'issued_by',t:'STRING'},{n:'issue_date',t:'DATE'},{n:'expiry_date',t:'DATE'},{n:'status',t:'STRING'}]},
        {name:'ais_position',       kind:'view', rows:'~148K',  desc:'Latest AIS positions — supports gis-ais.html', cols:[{n:'imo_number',t:'STRING'},{n:'mmsi',t:'STRING'},{n:'latitude',t:'FLOAT64'},{n:'longitude',t:'FLOAT64'},{n:'speed',t:'FLOAT64'},{n:'heading',t:'INT64'},{n:'nav_status',t:'STRING'},{n:'timestamp',t:'TIMESTAMP'},{n:'source_ais_provider',t:'STRING'},{n:'valid_from',t:'TIMESTAMP',temporal:true}]},
        {name:'port_call',          kind:'view', rows:'~284M',  desc:'Port arrival/departure sequence — supports movements.html', cols:[{n:'imo_number',t:'STRING'},{n:'port_unlocode',t:'STRING'},{n:'port_name',t:'STRING'},{n:'arrival_time',t:'TIMESTAMP'},{n:'departure_time',t:'TIMESTAMP'},{n:'terminal',t:'STRING'},{n:'agent',t:'STRING'},{n:'cargo_type',t:'STRING'},{n:'voyage_number',t:'STRING'}]},
        {name:'psc_inspection',     kind:'view', rows:'~4.2M',  desc:'PSC inspection + deficiency data — supports psc.html', cols:[{n:'imo_number',t:'STRING'},{n:'inspection_id',t:'STRING'},{n:'port',t:'STRING'},{n:'mou_region',t:'STRING'},{n:'inspection_date',t:'DATE'},{n:'inspector',t:'STRING'},{n:'deficiency_count',t:'INT64'},{n:'detention',t:'BOOL'},{n:'deficiencies',t:'ARRAY<STRING>'},{n:'status',t:'STRING'}]},
        {name:'company',            kind:'view', rows:'~380K',  desc:'Company master — supports companies.html', cols:[{n:'company_id',t:'STRING'},{n:'company_name',t:'STRING'},{n:'company_type',t:'STRING'},{n:'country',t:'STRING'},{n:'vessels_owned',t:'INT64'},{n:'vessels_operated',t:'INT64'},{n:'pi_club',t:'STRING'},{n:'last_updated',t:'TIMESTAMP'}]},
        {name:'fixture',            kind:'view', rows:'~2.8M',  desc:'Chartering fixtures — supports fixtures.html', cols:[{n:'fixture_id',t:'STRING'},{n:'vessel_imo',t:'STRING'},{n:'charterer',t:'STRING'},{n:'fixture_type',t:'STRING'},{n:'laycan_from',t:'DATE'},{n:'laycan_to',t:'DATE'},{n:'cargo_type',t:'STRING'},{n:'load_port',t:'STRING'},{n:'discharge_port',t:'STRING'},{n:'freight_rate',t:'FLOAT64'},{n:'status',t:'STRING'}]},
        {name:'maritime_event',     kind:'view', rows:'~1.4M',  desc:'Maritime events (casualties, incidents) — supports events.html', cols:[{n:'event_id',t:'STRING'},{n:'imo_number',t:'STRING'},{n:'event_type',t:'STRING'},{n:'event_date',t:'DATE'},{n:'location',t:'STRING'},{n:'severity',t:'STRING'},{n:'description',t:'STRING'},{n:'casualties',t:'INT64'},{n:'status',t:'STRING'}]},
        {name:'sanctions_screening',kind:'view', rows:'~22K',   desc:'Sanctions screening results — supports compliance.html', cols:[{n:'imo_number',t:'STRING'},{n:'screening_date',t:'DATE'},{n:'list_name',t:'STRING'},{n:'match_type',t:'STRING'},{n:'match_score',t:'FLOAT64'},{n:'vessel_name',t:'STRING'},{n:'owner',t:'STRING'},{n:'status',t:'STRING'},{n:'screened_by',t:'STRING'}]},
        {name:'vessel_valuation',   kind:'view', rows:'~4.9M',  desc:'Market valuations — supports vessels.html Finance entity', cols:[{n:'imo_number',t:'STRING'},{n:'valuation_date',t:'DATE'},{n:'market_value_usd',t:'FLOAT64'},{n:'charter_rate',t:'FLOAT64'},{n:'sale_price_estimate',t:'FLOAT64'},{n:'valuation_source',t:'STRING'}]},
      ]
    },
    {
      id: 'etl_ops', label: 'etl_ops', dsClass: 'ds-etl', icon: '⚙',
      desc: 'ETL operational tables — feed configs, run logs, QC rules, HIL queue, audit',
      tables: [
        {name:'etl_feed',    kind:'table', rows:'114',   desc:'Feed configurations — 114 active vendor feeds', cols:[{n:'feed_id',t:'STRING'},{n:'feed_name',t:'STRING'},{n:'category',t:'STRING'},{n:'vendor',t:'STRING'},{n:'connection_type',t:'STRING'},{n:'file_format',t:'STRING'},{n:'frequency',t:'STRING'},{n:'is_active',t:'BOOL'},{n:'priority',t:'INT64'},{n:'last_run_at',t:'TIMESTAMP'},{n:'phase',t:'STRING'}]},
        {name:'etl_run_log', kind:'table', rows:'8.2M',  desc:'Immutable run history — every feed run ever executed', cols:[{n:'run_id',t:'STRING'},{n:'feed_id',t:'STRING'},{n:'started_at',t:'TIMESTAMP'},{n:'completed_at',t:'TIMESTAMP'},{n:'status',t:'STRING'},{n:'records_received',t:'INT64'},{n:'records_qc_passed',t:'INT64'},{n:'records_auto_promoted',t:'INT64'},{n:'records_hil_queued',t:'INT64'},{n:'records_rejected',t:'INT64'},{n:'triggered_by',t:'STRING'}]},
        {name:'etl_qc_rule', kind:'table', rows:'250',   desc:'QC rule definitions — 250 active rules across all feeds', cols:[{n:'rule_id',t:'STRING'},{n:'feed_id_pattern',t:'STRING'},{n:'field_name',t:'STRING'},{n:'rule_type',t:'STRING'},{n:'rule_expression',t:'STRING'},{n:'severity',t:'STRING'},{n:'action_on_fail',t:'STRING'},{n:'is_active',t:'BOOL'}]},
        {name:'hil_queue',   kind:'table', rows:'48K',   desc:'Human-in-Loop review items awaiting analyst decision', cols:[{n:'hil_id',t:'STRING'},{n:'imo_number',t:'STRING'},{n:'entity',t:'STRING'},{n:'attribute_name',t:'STRING'},{n:'master_value',t:'STRING'},{n:'feed_value',t:'STRING'},{n:'match_score',t:'FLOAT64'},{n:'conflict_type',t:'STRING'},{n:'status',t:'STRING'},{n:'assigned_to',t:'STRING'},{n:'created_at',t:'TIMESTAMP'}]},
        {name:'audit_log',   kind:'table', rows:'180M',  desc:'Immutable compliance audit trail — every attribute change ever made', cols:[{n:'audit_id',t:'STRING'},{n:'event_ts',t:'TIMESTAMP'},{n:'event_type',t:'STRING'},{n:'actor',t:'STRING'},{n:'imo_number',t:'STRING'},{n:'entity',t:'STRING'},{n:'attribute_name',t:'STRING'},{n:'old_value',t:'STRING'},{n:'new_value',t:'STRING'},{n:'source_feed_id',t:'STRING'},{n:'hil_id',t:'STRING'},{n:'ip_address',t:'STRING'},{n:'metadata',t:'JSON'}]},
      ]
    }
  ]
}

export const QUERY_TEMPLATES = [
  {n:1,  title:'Point-in-Time Vessel State',   desc:'Bi-temporal master query — valid-time + transaction-time', badge:'bt', badgeLabel:'Bi-Temporal'},
  {n:2,  title:'Vendor Conflict Analysis',      desc:'All vendors values for an attribute with scores',           badge:'t',  badgeLabel:'Temporal'},
  {n:3,  title:'Ownership History Timeline',    desc:'All ownership changes for a vessel in chronological order', badge:'t',  badgeLabel:'Temporal'},
  {n:4,  title:'Certificate Expiry Forecast',   desc:'Vessels with certificates expiring in the next 30/60/90 days', badge:'t', badgeLabel:'Temporal'},
  {n:5,  title:'PSC Detention History',         desc:'PSC inspection and deficiency history for a vessel',        badge:'t',  badgeLabel:'Temporal'},
  {n:6,  title:'AIS Position History',          desc:'Vessel track over a time period from AIS',                  badge:'t',  badgeLabel:'Temporal'},
  {n:7,  title:'Port Call Sequence',            desc:'Arrival/departure sequence with time-in-port durations',    badge:'t',  badgeLabel:'Temporal'},
  {n:8,  title:'Fleet Snapshot at Date',        desc:'Full fleet state as of any historical date (bi-temporal)',  badge:'bt', badgeLabel:'Bi-Temporal'},
  {n:9,  title:'Sanctions Cross-Reference',     desc:'Cross-reference vessels and owners against sanctions lists', badge:'t', badgeLabel:'Temporal'},
  {n:10, title:'Audit Trail for Attribute',     desc:'Full audit log — who changed what, when, and why',         badge:'bt', badgeLabel:'Bi-Temporal'},
]

export const SAMPLE_RESULTS = {
  cols: ['entity','attribute_name','master_value','master_source','valid_from','valid_to','transaction_time','master_score'],
  rows: [
    ['class',      'class_notation',  '100A1 +LMC UMS',          'DNV_GL',          '2021-08-01 00:00:00 UTC','NULL',                    '2021-08-01 09:12:44 UTC', '0.98'],
    ['class',      'class_society',   'DNV GL',                  'DNV_GL',          '2021-08-01 00:00:00 UTC','NULL',                    '2021-08-01 09:12:44 UTC', '0.99'],
    ['dimensions', 'dwt',             '81412',                   'IHS_FAIRPLAY',    '2009-06-22 00:00:00 UTC','NULL',                    '2009-06-22 07:38:11 UTC', '0.97'],
    ['dimensions', 'gross_tonnage',   '44199',                   'IHS_FAIRPLAY',    '2009-06-22 00:00:00 UTC','NULL',                    '2009-06-22 07:38:11 UTC', '0.97'],
    ['flag',       'flag_code',       'MH',                      'LIBERIA_FLAG',    '2019-03-15 00:00:00 UTC','NULL',                    '2019-03-15 14:08:31 UTC', '1.00'],
    ['identity',   'vessel_name',     'PACIFIC VOYAGER',         'IHS_FAIRPLAY',    '2009-06-22 00:00:00 UTC','NULL',                    '2009-06-22 07:38:11 UTC', '1.00'],
    ['identity',   'vessel_status',   'In Service',              'IHS_FAIRPLAY',    '2009-06-22 00:00:00 UTC','NULL',                    '2009-06-22 07:38:11 UTC', '0.96'],
    ['ownership',  'registered_owner','Seaspan Corp',            'IHS_FAIRPLAY',    '2023-04-12 00:00:00 UTC','NULL',                    '2023-04-12 09:14:22 UTC', '0.95'],
  ]
}
