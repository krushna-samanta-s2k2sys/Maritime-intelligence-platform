import { useState, useMemo, useEffect, useRef } from 'react';

const CAT_LABELS = { flag: 'Flag', class: 'Class', ais: 'AIS', comp: 'Compl.', market: 'Market', pni: 'P&I' };
const CAT_CATS = ['all', 'flag', 'class', 'ais', 'comp', 'market', 'pni'];

const FEEDS = [
  {id:'f01',name:'Liberia Registry',cat:'flag',freq:'Daily',status:'green',enabled:true,conn:{type:'SFTP',host:'ftp.liscr.com',user:'sp_extract',pattern:'vessels_*.csv',encoding:'UTF-8'},sched:{cron:'0 2 * * *',freq:'Daily',mode:'Delta',timeout:'120s',retry:3},qc:[{id:'QC-F01',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-F02',field:'vessel_name',sev:'warn',expr:'len>1 && len<100'},{id:'QC-F03',field:'gross_tonnage',sev:'warn',expr:'val>0 && val<500000'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'VESSEL_NAME',tgt:'vessel.name',xfm:'titlecase'},{src:'GT',tgt:'vessel.gross_tonnage',xfm:'to_int'},{src:'FLAG',tgt:'vessel.flag_code',xfm:'iso3166'}]},
  {id:'f02',name:'Panama Registry',cat:'flag',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'api.segumar.com',user:'sp_api',pattern:'N/A',encoding:'JSON'},sched:{cron:'0 3 * * *',freq:'Daily',mode:'Full',timeout:'180s',retry:2},qc:[{id:'QC-F04',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-F05',field:'registration_date',sev:'warn',expr:'isdate && not_future'}],map:[{src:'imoNo',tgt:'vessel.imo_number',xfm:'trim'},{src:'vesselName',tgt:'vessel.name',xfm:'titlecase'},{src:'flagState',tgt:'vessel.flag_code',xfm:'iso3166'}]},
  {id:'f03',name:'Marshall Islands',cat:'flag',freq:'Daily',status:'amber',enabled:true,conn:{type:'SFTP',host:'ftp.register.marshallislands-mahi.com',user:'sp_mahi',pattern:'MI_vessels_*.csv',encoding:'UTF-8'},sched:{cron:'0 4 * * *',freq:'Daily',mode:'Delta',timeout:'90s',retry:3},qc:[{id:'QC-F06',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'Name',tgt:'vessel.name',xfm:'titlecase'}]},
  {id:'f04',name:'Bahamas Registry',cat:'flag',freq:'Daily',status:'green',enabled:true,conn:{type:'EMAIL',host:'mail.bahamasmaritimeauthority.com',user:'extracts@',pattern:'BMA_*.xlsx',encoding:'UTF-8'},sched:{cron:'0 6 * * *',freq:'Daily',mode:'Full',timeout:'60s',retry:2},qc:[{id:'QC-F07',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO Number',tgt:'vessel.imo_number',xfm:'trim'},{src:'Vessel Name',tgt:'vessel.name',xfm:'titlecase'}]},
  {id:'f05',name:'Singapore MPA',cat:'flag',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'api.mpa.gov.sg',user:'sp_mpa',pattern:'N/A',encoding:'JSON'},sched:{cron:'30 1 * * *',freq:'Daily',mode:'Delta',timeout:'120s',retry:3},qc:[{id:'QC-F08',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-F09',field:'port_of_registry',sev:'info',expr:'not_empty'}],map:[{src:'imoNumber',tgt:'vessel.imo_number',xfm:'trim'},{src:'vesselName',tgt:'vessel.name',xfm:'titlecase'},{src:'portOfRegistry',tgt:'vessel.port_of_registry',xfm:'trim'}]},
  {id:'f06',name:'Malta Maritime Authority',cat:'flag',freq:'Daily',status:'green',enabled:true,conn:{type:'SFTP',host:'ftp.transport.gov.mt',user:'sp_mma',pattern:'MMA_*.csv',encoding:'ISO-8859-1'},sched:{cron:'0 5 * * *',freq:'Daily',mode:'Delta',timeout:'90s',retry:2},qc:[{id:'QC-F10',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'NAME',tgt:'vessel.name',xfm:'titlecase'}]},
  {id:'f07',name:'Cyprus Shipping Deputy',cat:'flag',freq:'Weekly',status:'green',enabled:true,conn:{type:'EMAIL',host:'mail.shipping.gov.cy',user:'extracts@',pattern:'CY_*.xlsx',encoding:'UTF-8'},sched:{cron:'0 8 * * 1',freq:'Weekly',mode:'Full',timeout:'60s',retry:2},qc:[{id:'QC-F11',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'Vessel',tgt:'vessel.name',xfm:'titlecase'}]},
  {id:'f08',name:'Greek Flag Register',cat:'flag',freq:'Daily',status:'amber',enabled:false,conn:{type:'SFTP',host:'ftp.yen.gr',user:'sp_yen',pattern:'GR_*.csv',encoding:'UTF-8'},sched:{cron:'0 7 * * *',freq:'Daily',mode:'Full',timeout:'120s',retry:3},qc:[{id:'QC-F12',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'Name',tgt:'vessel.name',xfm:'titlecase'}]},
  {id:'f09',name:'Hong Kong Shipping Registry',cat:'flag',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'api.mardep.gov.hk',user:'sp_hkmard',pattern:'N/A',encoding:'JSON'},sched:{cron:'30 2 * * *',freq:'Daily',mode:'Delta',timeout:'90s',retry:2},qc:[{id:'QC-F13',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'imo',tgt:'vessel.imo_number',xfm:'trim'},{src:'name',tgt:'vessel.name',xfm:'titlecase'}]},
  {id:'f10',name:'UK Ship Register',cat:'flag',freq:'Daily',status:'green',enabled:true,conn:{type:'SFTP',host:'ftp.ukshipregister.co.uk',user:'sp_uksr',pattern:'UKSR_*.csv',encoding:'UTF-8'},sched:{cron:'0 6 * * *',freq:'Daily',mode:'Delta',timeout:'120s',retry:3},qc:[{id:'QC-F14',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-F15',field:'official_number',sev:'info',expr:'not_empty'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'ShipName',tgt:'vessel.name',xfm:'titlecase'},{src:'OfficialNo',tgt:'vessel.official_number',xfm:'trim'}]},
  {id:'f11',name:'Norway NIS/NOR Register',cat:'flag',freq:'Daily',status:'grey',enabled:false,conn:{type:'SFTP',host:'ftp.sdir.no',user:'sp_sdir',pattern:'NOR_*.csv',encoding:'UTF-8'},sched:{cron:'0 5 * * *',freq:'Daily',mode:'Full',timeout:'90s',retry:2},qc:[{id:'QC-F16',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'Name',tgt:'vessel.name',xfm:'titlecase'}]},
  {id:'c01',name:'DNV GL',cat:'class',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'api.dnv.com',user:'sp_dnv',pattern:'N/A',encoding:'JSON'},sched:{cron:'0 1 * * *',freq:'Daily',mode:'Delta',timeout:'300s',retry:3},qc:[{id:'QC-C01',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-C02',field:'class_notation',sev:'warn',expr:'not_empty'},{id:'QC-C03',field:'survey_due',sev:'warn',expr:'isdate'}],map:[{src:'imoNumber',tgt:'vessel.imo_number',xfm:'trim'},{src:'classNotation',tgt:'classification.class_notation',xfm:'trim'},{src:'surveyDue',tgt:'classification.survey_due',xfm:'to_date'},{src:'classStatus',tgt:'classification.status',xfm:'enum_map'}]},
  {id:'c02',name:"Lloyd's Register",cat:'class',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'api.lr.org',user:'sp_lr',pattern:'N/A',encoding:'JSON'},sched:{cron:'30 1 * * *',freq:'Daily',mode:'Delta',timeout:'240s',retry:3},qc:[{id:'QC-C04',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-C05',field:'class_status',sev:'warn',expr:'in_enum'}],map:[{src:'imo',tgt:'vessel.imo_number',xfm:'trim'},{src:'className',tgt:'classification.class_notation',xfm:'trim'},{src:'status',tgt:'classification.status',xfm:'enum_map'}]},
  {id:'c03',name:'Bureau Veritas',cat:'class',freq:'Daily',status:'amber',enabled:true,conn:{type:'SFTP',host:'ftp.bureauveritas.com',user:'sp_bv',pattern:'BV_fleet_*.csv',encoding:'UTF-8'},sched:{cron:'0 2 * * *',freq:'Daily',mode:'Full',timeout:'180s',retry:2},qc:[{id:'QC-C06',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'Class',tgt:'classification.class_notation',xfm:'trim'}]},
  {id:'c04',name:'ClassNK',cat:'class',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'api.classnk.or.jp',user:'sp_nk',pattern:'N/A',encoding:'JSON'},sched:{cron:'0 3 * * *',freq:'Daily',mode:'Delta',timeout:'180s',retry:3},qc:[{id:'QC-C07',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'imoNo',tgt:'vessel.imo_number',xfm:'trim'},{src:'classNotation',tgt:'classification.class_notation',xfm:'trim'}]},
  {id:'a01',name:'ExactEarth',cat:'ais',freq:'Real-time',status:'green',enabled:true,conn:{type:'REST',host:'api.exactearth.com',user:'sp_ee',pattern:'N/A',encoding:'JSON'},sched:{cron:'*/5 * * * *',freq:'Real-time',mode:'Delta',timeout:'30s',retry:5},qc:[{id:'QC-A01',field:'mmsi',sev:'error',expr:'len==9 && isdigit'},{id:'QC-A02',field:'latitude',sev:'error',expr:'val>=-90 && val<=90'},{id:'QC-A03',field:'longitude',sev:'error',expr:'val>=-180 && val<=180'},{id:'QC-A04',field:'sog',sev:'warn',expr:'val>=0 && val<=50'}],map:[{src:'mmsi',tgt:'position.mmsi',xfm:'trim'},{src:'lat',tgt:'position.latitude',xfm:'to_float'},{src:'lon',tgt:'position.longitude',xfm:'to_float'},{src:'sog',tgt:'position.speed_over_ground',xfm:'to_float'},{src:'cog',tgt:'position.course_over_ground',xfm:'to_float'}]},
  {id:'a02',name:'Spire Maritime',cat:'ais',freq:'Real-time',status:'green',enabled:true,conn:{type:'REST',host:'api.spire.com',user:'sp_spire',pattern:'N/A',encoding:'JSON'},sched:{cron:'*/5 * * * *',freq:'Real-time',mode:'Delta',timeout:'30s',retry:5},qc:[{id:'QC-A05',field:'mmsi',sev:'error',expr:'len==9 && isdigit'},{id:'QC-A06',field:'latitude',sev:'error',expr:'val>=-90 && val<=90'}],map:[{src:'mmsi',tgt:'position.mmsi',xfm:'trim'},{src:'latitude',tgt:'position.latitude',xfm:'to_float'},{src:'longitude',tgt:'position.longitude',xfm:'to_float'}]},
  {id:'a03',name:'MarineTraffic',cat:'ais',freq:'Real-time',status:'amber',enabled:true,conn:{type:'REST',host:'api.marinetraffic.com',user:'sp_mt',pattern:'N/A',encoding:'JSON'},sched:{cron:'*/10 * * * *',freq:'Real-time',mode:'Delta',timeout:'45s',retry:3},qc:[{id:'QC-A07',field:'mmsi',sev:'error',expr:'len==9 && isdigit'},{id:'QC-A08',field:'speed',sev:'warn',expr:'val>=0 && val<=50'}],map:[{src:'MMSI',tgt:'position.mmsi',xfm:'trim'},{src:'LAT',tgt:'position.latitude',xfm:'to_float'},{src:'LON',tgt:'position.longitude',xfm:'to_float'}]},
  {id:'co01',name:'OFAC Sanctions List',cat:'comp',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'ofac.treasury.gov',user:'public',pattern:'N/A',encoding:'XML'},sched:{cron:'30 0 * * *',freq:'Daily',mode:'Full',timeout:'120s',retry:3},qc:[{id:'QC-CO01',field:'imo_number',sev:'warn',expr:'len==7 || empty'},{id:'QC-CO02',field:'program',sev:'error',expr:'not_empty'},{id:'QC-CO03',field:'list_type',sev:'error',expr:'in_enum'}],map:[{src:'ID_VALUE',tgt:'sanction.imo_number',xfm:'extract_imo'},{src:'PROGRAMS',tgt:'sanction.programs',xfm:'split_pipe'},{src:'SDN_TYPE',tgt:'sanction.entity_type',xfm:'enum_map'}]},
  {id:'co02',name:'EU Consolidated List',cat:'comp',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'webgate.ec.europa.eu',user:'public',pattern:'N/A',encoding:'XML'},sched:{cron:'0 1 * * *',freq:'Daily',mode:'Full',timeout:'90s',retry:3},qc:[{id:'QC-CO04',field:'entity_id',sev:'error',expr:'not_empty'},{id:'QC-CO05',field:'regulation',sev:'warn',expr:'not_empty'}],map:[{src:'euReferenceNumber',tgt:'sanction.eu_ref',xfm:'trim'},{src:'subjectType',tgt:'sanction.entity_type',xfm:'enum_map'}]},
  {id:'co03',name:'UN Sanctions List',cat:'comp',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'scsanctions.un.org',user:'public',pattern:'N/A',encoding:'XML'},sched:{cron:'0 2 * * *',freq:'Daily',mode:'Full',timeout:'60s',retry:3},qc:[{id:'QC-CO06',field:'reference_number',sev:'error',expr:'not_empty'}],map:[{src:'REFERENCE_NUMBER',tgt:'sanction.un_ref',xfm:'trim'},{src:'FIRST_NAME',tgt:'sanction.name',xfm:'titlecase'}]},
  {id:'co04',name:'Equasis PSC',cat:'comp',freq:'Weekly',status:'green',enabled:true,conn:{type:'SFTP',host:'ftp.equasis.org',user:'sp_equasis',pattern:'PSC_*.csv',encoding:'UTF-8'},sched:{cron:'0 3 * * 1',freq:'Weekly',mode:'Full',timeout:'180s',retry:2},qc:[{id:'QC-CO07',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-CO08',field:'deficiency_code',sev:'warn',expr:'not_empty'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'DefCode',tgt:'psc_deficiency.code',xfm:'trim'},{src:'DetainDate',tgt:'psc_detention.date',xfm:'to_date'}]},
  {id:'m01',name:'Baltic Exchange',cat:'market',freq:'Daily',status:'green',enabled:true,conn:{type:'REST',host:'api.balticexchange.com',user:'sp_baltic',pattern:'N/A',encoding:'JSON'},sched:{cron:'30 16 * * 1-5',freq:'Daily',mode:'Full',timeout:'60s',retry:3},qc:[{id:'QC-M01',field:'index_value',sev:'error',expr:'val>0'},{id:'QC-M02',field:'trade_date',sev:'error',expr:'isdate && is_business_day'}],map:[{src:'indexCode',tgt:'market_index.code',xfm:'trim'},{src:'value',tgt:'market_index.value',xfm:'to_float'},{src:'date',tgt:'market_index.trade_date',xfm:'to_date'}]},
  {id:'m02',name:'Platts Shipping',cat:'market',freq:'Daily',status:'amber',enabled:true,conn:{type:'REST',host:'api.spglobal.com',user:'sp_platts',pattern:'N/A',encoding:'JSON'},sched:{cron:'0 17 * * 1-5',freq:'Daily',mode:'Full',timeout:'90s',retry:2},qc:[{id:'QC-M03',field:'assessment_value',sev:'error',expr:'val>0'},{id:'QC-M04',field:'currency',sev:'warn',expr:'in_iso4217'}],map:[{src:'assessmentCode',tgt:'freight_rate.code',xfm:'trim'},{src:'value',tgt:'freight_rate.value',xfm:'to_float'},{src:'currency',tgt:'freight_rate.currency',xfm:'upper'}]},
  {id:'p01',name:'Gard P&I Club',cat:'pni',freq:'Weekly',status:'green',enabled:true,conn:{type:'EMAIL',host:'mail.gard.no',user:'extracts@',pattern:'Gard_*.xlsx',encoding:'UTF-8'},sched:{cron:'0 8 * * 1',freq:'Weekly',mode:'Full',timeout:'60s',retry:2},qc:[{id:'QC-P01',field:'imo_number',sev:'error',expr:'len==7 && isdigit'},{id:'QC-P02',field:'certificate_expiry',sev:'warn',expr:'isdate && not_past'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'ExpiryDate',tgt:'certificate.expiry',xfm:'to_date'},{src:'CertType',tgt:'certificate.type',xfm:'trim'}]},
  {id:'p02',name:'UK P&I Club',cat:'pni',freq:'Weekly',status:'grey',enabled:false,conn:{type:'SFTP',host:'ftp.ukpandi.com',user:'sp_ukpi',pattern:'UKPI_*.csv',encoding:'UTF-8'},sched:{cron:'0 9 * * 1',freq:'Weekly',mode:'Full',timeout:'60s',retry:2},qc:[{id:'QC-P03',field:'imo_number',sev:'error',expr:'len==7 && isdigit'}],map:[{src:'IMO',tgt:'vessel.imo_number',xfm:'trim'},{src:'Expiry',tgt:'certificate.expiry',xfm:'to_date'}]},
];

const STAGES = ['Connect','Download','Parse','QC','Transform','Match','Promote'];

const SEED_RUNS = [
  {id:'run-7741',feed:'DNV GL',status:'running',stage:4,rec:142880,pass:141230,promo:133470,hil:1024,rej:136,dur:'02:14',trigger:'SCHEDULER'},
  {id:'run-7740',feed:'ExactEarth',status:'running',stage:5,rec:890400,pass:886200,promo:840210,hil:3200,rej:1790,dur:'01:48',trigger:'SCHEDULER'},
  {id:'run-7739',feed:'Liberia Registry',status:'success',stage:7,rec:38420,pass:38200,promo:37800,hil:280,rej:120,dur:'01:12',trigger:'SCHEDULER'},
  {id:'run-7738',feed:'OFAC Sanctions List',status:'success',stage:7,rec:12041,pass:12041,promo:11980,hil:41,rej:0,dur:'00:34',trigger:'SCHEDULER'},
  {id:'run-7737',feed:"Lloyd's Register",status:'warning',stage:6,rec:95600,pass:92400,promo:87300,hil:4200,rej:900,dur:'02:55',trigger:'SCHEDULER'},
  {id:'run-7736',feed:'Baltic Exchange',status:'success',stage:7,rec:2480,pass:2480,promo:2480,hil:0,rej:0,dur:'00:18',trigger:'MANUAL'},
  {id:'run-7735',feed:'MarineTraffic',status:'failed',stage:2,rec:0,pass:0,promo:0,hil:0,rej:0,dur:'00:08',trigger:'SCHEDULER'},
  {id:'run-7734',feed:'Panama Registry',status:'success',stage:7,rec:29010,pass:28880,promo:28600,hil:190,rej:90,dur:'01:44',trigger:'SCHEDULER'},
  {id:'run-7733',feed:'Bureau Veritas',status:'success',stage:7,rec:51200,pass:50900,promo:49800,hil:720,rej:380,dur:'02:01',trigger:'SCHEDULER'},
  {id:'run-7732',feed:'Spire Maritime',status:'running',stage:3,rec:622000,pass:619800,promo:0,hil:0,rej:0,dur:'00:52',trigger:'SCHEDULER'},
];

const INIT_HIL = [
  {id:'h01',vessel:'Maersk Edinburg',imo:'9632179',entity:'identity',severity:'high',attr:'Vessel Name',master:'MAERSK EDINBURG',incoming:'MAERSK EDINBURGH',score:0.72,vendor:"Lloyd's Register",reason:'Possible spelling discrepancy in vessel name — differs by 1 character'},
  {id:'h02',vessel:'Nord Tiger',imo:'9814203',entity:'ownership',severity:'high',attr:'Registered Owner',master:'Nordic Tankers AS',incoming:'Nordic Tankers A/S',score:0.88,vendor:'DNV GL',reason:'Legal name formatting difference — may be same entity with abbreviated suffix'},
  {id:'h03',vessel:'Pacific Pearl',imo:'9445821',entity:'class',severity:'medium',attr:'Class Notation',master:'★ 1A1 Tanker',incoming:'1A1 TANKER ESP',score:0.79,vendor:'Bureau Veritas',reason:'Notation includes additional ESP suffix not present in master record'},
  {id:'h04',vessel:'Atlantic Condor',imo:'9201447',entity:'dimensions',severity:'medium',attr:'Gross Tonnage',master:'42,800',incoming:'42,819',score:0.94,vendor:'Panama Registry',reason:'Minor GT discrepancy of 19 tonnes — possibly due to measurement rounding convention'},
  {id:'h05',vessel:'Golden Horizon',imo:'9562834',entity:'certificates',severity:'high',attr:'SOLAS Certificate Expiry',master:'2025-09-14',incoming:'2025-03-14',score:0.61,vendor:'Malta Maritime Authority',reason:'Certificate expiry date differs by 6 months — potential data entry transposition'},
  {id:'h06',vessel:'Olympia Spirit',imo:'9388201',entity:'identity',severity:'medium',attr:'Call Sign',master:'SVBB8',incoming:'SVBB 8',score:0.91,vendor:'Greek Flag Register',reason:'Call sign formatting difference — space character present in incoming data'},
  {id:'h07',vessel:'Seabreeze Trader',imo:'9731045',entity:'ownership',severity:'high',attr:'Technical Manager',master:'Bernhard Schulte Shipmanagement',incoming:'BSM GmbH',score:0.64,vendor:'ClassNK',reason:'Technical manager recorded as abbreviated trading name — entity matching inconclusive'},
  {id:'h08',vessel:'Cape Valiant',imo:'9120389',entity:'dimensions',severity:'low',attr:'Net Tonnage',master:'24,100',incoming:'24,086',score:0.97,vendor:'Liberia Registry',reason:'NT discrepancy of 14 tonnes within acceptable variance threshold'},
  {id:'h09',vessel:'Star Polaris',imo:'9681234',entity:'class',severity:'high',attr:'Survey Due Date',master:'2025-06-30',incoming:'2025-12-31',score:0.58,vendor:'Korean Register',reason:'Survey due date differs significantly — possible periodic vs. annual survey date confusion'},
  {id:'h10',vessel:'Emerald Sea',imo:'9294551',entity:'certificates',severity:'medium',attr:'ISM Certificate Status',master:'Valid',incoming:'CONDITIONAL',score:0.55,vendor:'Bureau Veritas',reason:'Conditional ISM status from class feed — does not match flag state record; requires review'},
  {id:'h11',vessel:'Nordic Breeze',imo:'9502871',entity:'identity',severity:'low',attr:'IMO Number (cross-check)',master:'9502871',incoming:'9502817',score:0.68,vendor:'Spire Maritime',reason:'Possible digit transposition in IMO cross-reference field within AIS feed'},
  {id:'h12',vessel:'Horizon Pioneer',imo:'9447110',entity:'ownership',severity:'medium',attr:'Disponent Owner',master:'Tsakos Columbia Shipmanagement',incoming:'TCM S.A.',score:0.71,vendor:'Platts Shipping',reason:'Abbreviated entity name — may be same legal person; manual confirmation required'},
  {id:'h13',vessel:'Southern Cross',imo:'9316740',entity:'dimensions',severity:'low',attr:'LOA (metres)',master:'228.60',incoming:'228.6',score:0.99,vendor:'Singapore MPA',reason:'Formatting difference only — same numeric value, no decimal padding'},
  {id:'h14',vessel:'Phoenix Arrow',imo:'9598034',entity:'class',severity:'high',attr:'Class Status',master:'In Class',incoming:'SUSPENDED',score:0.42,vendor:"Lloyd's Register",reason:'Class suspension flag received — critical conflict requiring immediate human review'},
  {id:'h15',vessel:'Baltic Dawn',imo:'9712603',entity:'certificates',severity:'medium',attr:'MARPOL Annex I Certificate',master:'Valid to 2026-01-15',incoming:'Valid to 2025-10-15',score:0.73,vendor:'UK Ship Register',reason:'Certificate expiry 3 months earlier in incoming data — possible renewal not yet reflected in registry'},
  {id:'h16',vessel:'Iron Empress',imo:'9385492',entity:'ownership',severity:'high',attr:'Registered Owner',master:'Iron Ore Shipping Ltd',incoming:'Iron Ore Shipping Pte Ltd',score:0.85,vendor:'Hong Kong Shipping Registry',reason:'Jurisdictional suffix differs (Ltd vs Pte Ltd) — may indicate re-registration to Singapore'},
  {id:'h17',vessel:'Crystal Harmony',imo:'9094103',entity:'identity',severity:'low',attr:'Port of Registry',master:'NASSAU',incoming:'Nassau, Bahamas',score:0.96,vendor:'Bahamas Registry',reason:'Port of registry format includes country name — normalisation difference only'},
  {id:'h18',vessel:'Arctic Thunder',imo:'9654219',entity:'certificates',severity:'high',attr:'DOC Company',master:'Stena Teknik AB',incoming:'Stena Line AB',score:0.66,vendor:'DNV GL',reason:'DOC company name appears to be sibling entity within Stena Group — ownership structure may have changed'},
  {id:'h19',vessel:'Mount Everest',imo:'9470388',entity:'class',severity:'medium',attr:'Class Notation',master:'BV I ✠ BULK CARRIER',incoming:'BV HULL MACH BULK CARRIER ESP',score:0.78,vendor:'Bureau Veritas',reason:'Class notation includes ESP program suffix and expanded format — verify against original class certificate'},
  {id:'h20',vessel:'Rio Sunrise',imo:'9541672',entity:'ownership',severity:'low',attr:'Group Beneficial Owner',master:'Maran Ventures Inc',incoming:'Maran Ventures',score:0.94,vendor:'Baltic Exchange',reason:'Minor name truncation — "Inc" suffix absent from market data feed; likely same entity'},
];

const FEED_NAMES_CYCLE = ['ClassNK','Singapore MPA','UK Ship Register','EU Consolidated List','Gard P&I Club','Platts Shipping','Bahamas Registry','Malta Maritime Authority'];

function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function statusDot(s) {
  const colors = { green: '#137333', amber: '#b45309', grey: '#bbb' };
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[s] || '#bbb', flexShrink: 0, display: 'inline-block' }} />;
}

function CfgSection({ title, open: initOpen, children }) {
  const [open, setOpen] = useState(initOpen !== false);
  return (
    <div style={{ background: '#fff', border: '1px solid var(--bdr)', borderRadius: 6, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(p => !p)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
      </div>
      {open && (
        <div style={{ padding: 12, borderTop: '1px solid var(--bdr)' }}>{children}</div>
      )}
    </div>
  );
}

export default function Etl() {
  const [cat, setCat] = useState('all');
  const [feedSrch, setFeedSrch] = useState('');
  const [selFeedId, setSelFeedId] = useState(null);
  const [feeds, setFeeds] = useState(FEEDS.map(f => ({ ...f })));
  const [rTab, setRTab] = useState('liveRuns');
  const [runs, setRuns] = useState(SEED_RUNS.map((r, i) => ({ ...r, _ts: Date.now() - i * 90000 })));
  const [openRunId, setOpenRunId] = useState(null);
  const [hil, setHil] = useState(INIT_HIL);
  const [hilPending, setHilPending] = useState(347);
  const [entityFil, setEntityFil] = useState('all');
  const [sevFil, setSevFil] = useState('all');
  const [overrideOpen, setOverrideOpen] = useState(null);
  const cycleIdx = useRef(0);
  const runCounter = useRef(7742);

  // Auto-refresh runs
  useEffect(() => {
    const id = setInterval(() => {
      const newRun = {
        id: 'run-' + runCounter.current++,
        feed: FEED_NAMES_CYCLE[cycleIdx.current % FEED_NAMES_CYCLE.length],
        status: 'running', stage: 1, rec: 0, pass: 0, promo: 0, hil: 0, rej: 0, dur: '00:00',
        trigger: 'SCHEDULER', _ts: Date.now(),
      };
      cycleIdx.current++;
      setRuns(prev => {
        const next = [newRun, ...prev].slice(0, 14).map(r => {
          if (r.status !== 'running' || r.stage >= 7) return r;
          const stage = Math.min(r.stage + 1, 7);
          const e = Math.floor((Date.now() - r._ts) / 1000);
          const dur = Math.floor(e / 60).toString().padStart(2, '0') + ':' + (e % 60).toString().padStart(2, '0');
          let rec = r.rec, pass = r.pass, promo = r.promo, hilC = r.hil, rej = r.rej;
          if (stage > 1) rec += Math.floor(Math.random() * 12000 + 5000);
          if (stage > 3) pass = Math.floor(rec * 0.987);
          if (stage > 5) { promo = Math.floor(pass * 0.942); hilC = Math.floor(pass * 0.047); rej = rec - pass; }
          const status = stage === 7 ? 'success' : 'running';
          return { ...r, stage, dur, rec, pass, promo, hil: hilC, rej, status };
        });
        return next;
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const filteredFeeds = useMemo(() => {
    return feeds.filter(f => {
      if (cat !== 'all' && f.cat !== cat) return false;
      if (feedSrch && !f.name.toLowerCase().includes(feedSrch.toLowerCase())) return false;
      return true;
    });
  }, [feeds, cat, feedSrch]);

  const filteredHil = useMemo(() => {
    return hil.filter(h => {
      if (entityFil !== 'all' && h.entity !== entityFil) return false;
      if (sevFil !== 'all' && h.severity !== sevFil) return false;
      return true;
    });
  }, [hil, entityFil, sevFil]);

  const selFeed = feeds.find(f => f.id === selFeedId);

  function toggleFeedEnabled(id, val) {
    setFeeds(prev => prev.map(f => f.id === id ? { ...f, enabled: val } : f));
  }

  function hilAction(id) {
    setHil(prev => prev.filter(h => h.id !== id));
    setHilPending(prev => Math.max(0, prev - 1));
    setOverrideOpen(null);
  }

  const catBgColor = { flag: '#e8f0fe', class: '#e6f4ea', ais: '#fce8e6', comp: '#fff3e0', market: '#f3e8fd', pni: '#e0f7f9' };
  const catTxtColor = { flag: '#1558d6', class: '#137333', ais: '#c8102e', comp: '#b45309', market: '#6200ea', pni: '#0094b3' };

  function RunCard({ r }) {
    const isOpen = openRunId === r.id;
    const stageColors = { running: '#1558d6', success: '#137333', warning: '#b45309', failed: '#c8102e' };

    function makeLog() {
      const lines = [];
      const ts = (off) => new Date(r._ts + off).toTimeString().slice(0, 8);
      lines.push({ ts: ts(0), cls: 'ok', msg: `Pipeline ${r.id} started — trigger: ${r.trigger}` });
      if (r.stage > 0) lines.push({ ts: ts(4000), cls: 'ok', msg: `Connection established to ${r.feed} endpoint` });
      if (r.stage > 1) lines.push({ ts: ts(12000), cls: 'ok', msg: `Downloaded ${fmtNum(r.rec)} raw records` });
      if (r.stage > 2) lines.push({ ts: ts(28000), cls: 'ok', msg: 'Parse complete — schema validation passed' });
      if (r.stage > 3) lines.push({ ts: ts(42000), cls: r.status === 'warning' ? 'warn' : 'ok', msg: `QC applied — ${fmtNum(r.pass)}/${fmtNum(r.rec)} passed${r.rej > 0 ? ' (' + fmtNum(r.rej) + ' rejected)' : ''}` });
      if (r.stage > 4) lines.push({ ts: ts(58000), cls: 'ok', msg: 'Transform complete — field mappings applied' });
      if (r.stage > 5) lines.push({ ts: ts(74000), cls: 'ok', msg: `Entity match complete — ${fmtNum(r.promo)} auto-promoted, ${fmtNum(r.hil)} queued for HIL` });
      if (r.stage > 6) lines.push({ ts: ts(90000), cls: 'ok', msg: 'Pipeline complete — golden record updated' });
      if (r.status === 'failed') {
        lines.push({ ts: ts(8000), cls: 'err', msg: 'Connection timeout after 30s — retrying (1/5)…' });
        lines.push({ ts: ts(38000), cls: 'err', msg: 'Max retries exceeded — pipeline aborted' });
      }
      return lines;
    }

    const stCl = { ok: '#137333', warn: '#b45309', err: '#c8102e' };

    return (
      <div style={{ background: '#fff', border: '1px solid var(--bdr)', borderRadius: 6, marginBottom: 6, overflow: 'hidden' }}>
        <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>{r.feed}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)' }}>{r.id}</div>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 10,
            background: r.status === 'running' ? '#e8f0fe' : r.status === 'success' ? '#e6f4ea' : r.status === 'warning' ? '#fff3e0' : '#fce8e6',
            color: stageColors[r.status] || '#333',
          }}>
            {r.status === 'running' && <span style={{ width: 7, height: 7, borderRadius: '50%', border: '2px solid #1558d6', borderTopColor: 'transparent', display: 'inline-block', animation: 'etl-spin 0.7s linear infinite' }} />}
            {r.status === 'running' ? 'Running' : r.status === 'success' ? '✓ Success' : r.status === 'warning' ? '⚠ Warning' : '✕ Failed'}
          </span>
        </div>
        {r.status === 'running' && (
          <div style={{ height: 3, background: 'var(--bdr)', margin: '0 12px 6px', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#1558d6,#4285f4)', borderRadius: 2, animation: 'etl-progress 2s ease-in-out infinite alternate' }} />
          </div>
        )}
        {/* Stage timeline */}
        <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'center', gap: 0 }}>
          {STAGES.map((s, i) => {
            let dotBg = 'var(--bdr)';
            if (i < r.stage) dotBg = '#137333';
            else if (i === r.stage && r.status === 'running') dotBg = '#1558d6';
            else if (r.status === 'failed' && i === r.stage) dotBg = '#c8102e';
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotBg }} />
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{s}</div>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < r.stage ? '#137333' : 'var(--bdr)', marginBottom: 12, marginLeft: 2, marginRight: 2 }} />
                )}
              </div>
            );
          })}
        </div>
        {/* Stats */}
        <div style={{ padding: '4px 12px 8px', display: 'flex', gap: 12 }}>
          {[['Received', fmtNum(r.rec), '#1a1d1f'], ['QC Pass', fmtNum(r.pass), '#1a1d1f'], ['Promoted', fmtNum(r.promo), '#1a1d1f'], ['HIL', fmtNum(r.hil), '#b45309'], ['Rejected', fmtNum(r.rej), '#c8102e']].map(([l, v, c]) => (
            <div key={l}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div
          onClick={() => setOpenRunId(p => p === r.id ? null : r.id)}
          style={{ padding: '4px 12px 7px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--bdr)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>⏱ {r.dur}</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: r.trigger === 'MANUAL' ? '#fce8e6' : 'var(--bg)', color: r.trigger === 'MANUAL' ? '#c8102e' : 'var(--muted)' }}>{r.trigger}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>{isOpen ? '▲' : '▼'} View log</span>
        </div>
        {/* Log */}
        {isOpen && (
          <div style={{ borderTop: '1px solid var(--bdr)', background: 'var(--bg)', padding: '8px 12px', maxHeight: 120, overflowY: 'auto' }}>
            {makeLog().map((l, i) => (
              <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--txt)', lineHeight: 1.7 }}>
                <span style={{ color: 'var(--muted)', marginRight: 6 }}>{l.ts}</span>
                <span style={{ color: stCl[l.cls], marginRight: 6 }}>[{l.cls.toUpperCase()}]</span>
                {l.msg}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <style>{`
        @keyframes etl-spin{to{transform:rotate(360deg)}}
        @keyframes etl-progress{0%{width:30%}100%{width:85%}}
        @keyframes etl-dot{0%,100%{box-shadow:0 0 0 2px rgba(19,115,51,.2)}50%{box-shadow:0 0 0 5px rgba(19,115,51,.05)}}
      `}</style>

      {/* Stats Strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--bdr)', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0, overflowX: 'auto' }}>
        {[
          { v: '114', sub: '42 live / 72 planned', l: 'Total Feeds' },
          { v: '2.4M', l: 'Records Today' },
          { v: '98.7%', l: 'QC Pass Rate', c: '#137333' },
          { v: '94.2%', l: 'Auto-Promoted', c: '#137333' },
          { v: String(hilPending), l: 'HIL Pending', c: '#b45309' },
          { v: '4m ago', l: 'Last Run' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {i > 0 && <div style={{ width: 1, height: 32, background: 'var(--bdr)', flexShrink: 0, margin: '0 20px' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.c || 'var(--txt)', lineHeight: 1.1 }}>
                {s.v}{s.sub && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', marginLeft: 4 }}>{s.sub}</span>}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT PANEL: Pipeline Config Manager */}
        <div style={{ width: '55%', flexShrink: 0, display: 'flex', borderRight: '1px solid var(--bdr)', overflow: 'hidden' }}>

          {/* Feed list */}
          <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--bdr)', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 8 }}>Pipeline Config Manager</div>
              <input
                className="sBar"
                placeholder="Search feeds…"
                value={feedSrch}
                onChange={e => setFeedSrch(e.target.value)}
                style={{ width: '100%', marginBottom: 7 }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {CAT_CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    padding: '2px 7px', fontSize: 10, fontWeight: 600, borderRadius: 3, cursor: 'pointer',
                    border: '1px solid var(--bdr)',
                    background: cat === c ? '#1558d6' : 'transparent',
                    color: cat === c ? '#fff' : 'var(--muted)',
                    fontFamily: 'inherit',
                  }}>
                    {c === 'all' ? 'All' : CAT_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredFeeds.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelFeedId(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    cursor: 'pointer', borderBottom: '1px solid var(--bdr)',
                    background: f.id === selFeedId ? '#e8f0fe' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.status === 'green' ? '#137333' : f.status === 'amber' ? '#b45309' : '#bbb', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{f.freq}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.3, background: catBgColor[f.cat], color: catTxtColor[f.cat] }}>{CAT_LABELS[f.cat]}</span>
                    <div
                      onClick={e => { e.stopPropagation(); toggleFeedEnabled(f.id, !f.enabled); }}
                      style={{ position: 'relative', width: 28, height: 15, flexShrink: 0, cursor: 'pointer' }}
                    >
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 15, background: f.enabled ? '#137333' : '#ccc', transition: 'background 0.15s' }} />
                      <div style={{ position: 'absolute', width: 11, height: 11, background: '#fff', borderRadius: '50%', top: 2, left: f.enabled ? 15 : 2, transition: 'left 0.15s' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feed config */}
          <div style={{ flex: 1, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selFeed ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--muted)' }}>
                <div style={{ fontSize: 36, opacity: 0.3 }}>⚙️</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Select a feed to view configuration</div>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bdr)', background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', flex: 1 }}>{selFeed.name}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: selFeed.status === 'green' ? '#e6f4ea' : selFeed.status === 'amber' ? '#fff3e0' : 'var(--bg)', color: selFeed.status === 'green' ? '#137333' : selFeed.status === 'amber' ? '#b45309' : 'var(--muted)' }}>
                    {selFeed.status === 'green' ? 'Live' : selFeed.status === 'amber' ? 'Delayed' : 'Idle'}
                  </span>
                  <button style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, background: '#1558d6', color: '#fff', border: 'none', cursor: 'pointer' }}>Run Now</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <CfgSection title="Source Connection" open>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[['Connection Type', selFeed.conn.type], ['Host / Endpoint', selFeed.conn.host], ['Credentials', selFeed.conn.user + '  ••••••••'], ['File Pattern', selFeed.conn.pattern], ['Encoding', selFeed.conn.encoding]].map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{l}</div>
                          <div style={{ fontSize: 12, color: 'var(--txt)', fontFamily: 'monospace', background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 3, padding: '4px 7px', wordBreak: 'break-all' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </CfgSection>
                  <CfgSection title="Schedule & Mode" open>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[['Cron Expression', selFeed.sched.cron], ['Frequency', selFeed.sched.freq], ['Ingest Mode', selFeed.sched.mode], ['Timeout', selFeed.sched.timeout], ['Retry Count', String(selFeed.sched.retry)]].map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{l}</div>
                          <div style={{ fontSize: 12, color: 'var(--txt)', fontFamily: 'monospace', background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 3, padding: '4px 7px' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </CfgSection>
                  <CfgSection title={`QC Rules (${selFeed.qc.length} active)`}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr>{['Rule ID', 'Field', 'Severity', 'Expression'].map(h => <th key={h} style={{ background: 'var(--bg)', padding: '5px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--muted)', textAlign: 'left', borderBottom: '1px solid var(--bdr)' }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {selFeed.qc.map(r => (
                          <tr key={r.id}>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bdr)', fontFamily: 'monospace' }}>{r.id}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bdr)', fontFamily: 'monospace' }}>{r.field}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bdr)' }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: r.sev === 'error' ? '#fce8e6' : r.sev === 'warn' ? '#fff3e0' : '#e8f0fe', color: r.sev === 'error' ? '#c8102e' : r.sev === 'warn' ? '#b45309' : '#1558d6' }}>{r.sev.toUpperCase()}</span>
                            </td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bdr)', fontFamily: 'monospace', fontSize: 10 }}>{r.expr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CfgSection>
                  <CfgSection title={`Field Mappings (${selFeed.map.length} mappings)`}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr>{['Source Field', 'Target Entity.Attribute', 'Transform'].map(h => <th key={h} style={{ background: 'var(--bg)', padding: '5px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--muted)', textAlign: 'left', borderBottom: '1px solid var(--bdr)' }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {selFeed.map.map((m, i) => (
                          <tr key={i}>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bdr)', fontFamily: 'monospace' }}>{m.src}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bdr)', fontFamily: 'monospace', color: '#1558d6' }}>{m.tgt}</td>
                            <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bdr)', fontFamily: 'monospace', color: '#6200ea' }}>{m.xfm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CfgSection>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Run Monitor + HIL Queue */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', background: '#fff', flexShrink: 0 }}>
            {[
              { id: 'liveRuns', label: '● Live Runs', badge: null },
              { id: 'hilQueue', label: 'HIL Queue', badge: hilPending },
            ].map(t => (
              <div key={t.id} onClick={() => setRTab(t.id)} style={{
                padding: '10px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: rTab === t.id ? '#1558d6' : 'var(--muted)',
                borderBottom: rTab === t.id ? '2px solid #1558d6' : '2px solid transparent',
                background: rTab === t.id ? '#fff' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.12s',
              }}>
                {t.label}
                {t.badge != null && <span style={{ background: '#c8102e', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>{t.badge}</span>}
              </div>
            ))}
          </div>

          {/* Live Runs Panel */}
          {rTab === 'liveRuns' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--bdr)', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#137333', animation: 'etl-dot 1.5s infinite' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>Live Pipeline Runs</div>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{runs.filter(r => r.status === 'running').length} active</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                {runs.map(r => <RunCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {/* HIL Queue Panel */}
          {rTab === 'hilQueue' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--bdr)', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Filter:</span>
                <select value={entityFil} onChange={e => setEntityFil(e.target.value)} style={{ padding: '4px 9px', fontSize: 11, border: '1px solid var(--bdr)', borderRadius: 4, background: 'var(--bg)', color: 'var(--txt)', outline: 'none', cursor: 'pointer' }}>
                  <option value="all">All Entities</option>
                  <option value="identity">Identity</option>
                  <option value="ownership">Ownership</option>
                  <option value="class">Classification</option>
                  <option value="dimensions">Dimensions</option>
                  <option value="certificates">Certificates</option>
                </select>
                <select value={sevFil} onChange={e => setSevFil(e.target.value)} style={{ padding: '4px 9px', fontSize: 11, border: '1px solid var(--bdr)', borderRadius: 4, background: 'var(--bg)', color: 'var(--txt)', outline: 'none', cursor: 'pointer' }}>
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                {filteredHil.map(h => {
                  const scoreW = Math.round(h.score * 100);
                  const scoreFill = h.score < 0.7 ? '#c8102e' : h.score < 0.95 ? '#b45309' : '#137333';
                  const sevBg = h.severity === 'high' ? '#fff3e0' : h.severity === 'medium' ? '#f3e8fd' : '#e8f0fe';
                  const sevC = h.severity === 'high' ? '#b45309' : h.severity === 'medium' ? '#6200ea' : '#1558d6';
                  const isOvOpen = overrideOpen === h.id;
                  return (
                    <div key={h.id} style={{ background: '#fff', border: '1px solid var(--bdr)', borderRadius: 6, marginBottom: 7, overflow: 'hidden' }}>
                      <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1558d6', cursor: 'pointer' }}>{h.vessel}</span>
                            <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>IMO {h.imo}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--txt)', marginTop: 2 }}>
                            <strong>{h.attr}</strong> · {h.entity.charAt(0).toUpperCase() + h.entity.slice(1)} conflict
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: sevBg, color: sevC }}>{h.severity.toUpperCase()}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'var(--bg)', color: 'var(--muted)' }}>{h.vendor}</span>
                        </div>
                      </div>
                      {/* Values */}
                      <div style={{ padding: '0 12px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div style={{ border: '1px solid var(--bdr)', borderRadius: 4, padding: '7px 9px' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--muted)', marginBottom: 3 }}>Master (Golden Record)</div>
                          <div style={{ fontSize: 11, color: 'var(--txt)', fontWeight: 600 }}>{h.master}</div>
                        </div>
                        <div style={{ border: '1px solid #1558d6', borderRadius: 4, padding: '7px 9px' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#1558d6', marginBottom: 3 }}>Incoming ({h.vendor})</div>
                          <div style={{ fontSize: 11, color: '#1558d6', fontWeight: 600 }}>{h.incoming}</div>
                        </div>
                      </div>
                      {/* Score */}
                      <div style={{ padding: '0 12px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, width: 80, flexShrink: 0 }}>Match Score</div>
                        <div style={{ flex: 1, height: 6, background: 'var(--bdr)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: scoreFill, width: scoreW + '%', transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: scoreFill, width: 36, textAlign: 'right', flexShrink: 0 }}>{scoreW}%</div>
                      </div>
                      <div style={{ padding: '0 12px 8px', fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>"{h.reason}"</div>
                      {/* Actions */}
                      <div style={{ padding: '6px 12px 9px', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--bdr)', background: 'var(--bg)' }}>
                        <button onClick={() => hilAction(h.id)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer', border: '1px solid var(--bdr)', background: '#fff', color: 'var(--muted)' }}>Keep Master</button>
                        <button onClick={() => hilAction(h.id)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer', border: '1px solid #137333', background: '#e6f4ea', color: '#137333' }}>Promote Feed Value</button>
                        <button
                          onClick={() => setOverrideOpen(p => p === h.id ? null : h.id)}
                          style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer', border: '1px solid #1558d6', background: isOvOpen ? '#1558d6' : '#e8f0fe', color: isOvOpen ? '#fff' : '#1558d6' }}
                        >Manual Override</button>
                      </div>
                      {isOvOpen && (
                        <div style={{ padding: '6px 12px 10px', borderTop: '1px solid var(--bdr)', background: '#fff' }}>
                          <input placeholder="Enter override value…" style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--bdr)', borderRadius: 4, fontSize: 12, marginBottom: 5, outline: 'none' }} />
                          <input placeholder="Comment / reason for override…" style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--bdr)', borderRadius: 4, fontSize: 12, marginBottom: 5, outline: 'none' }} />
                          <button onClick={() => hilAction(h.id)} style={{ padding: '5px 14px', fontSize: 11, fontWeight: 700, borderRadius: 4, background: '#1558d6', color: '#fff', border: 'none', cursor: 'pointer' }}>Save Override</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
