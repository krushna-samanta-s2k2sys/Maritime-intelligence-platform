export const ENTITIES = [
  { key:'imo',         label:'IMO Core Identity',        icon:'🆔', color:'#1558d6', cnt:8  },
  { key:'dimensions',  label:'Physical Dimensions',      icon:'📐', color:'#0094b3', cnt:14 },
  { key:'construction',label:'Construction Details',     icon:'🏗',  color:'#137333', cnt:8  },
  { key:'flag',        label:'Flag & Registry',          icon:'🏴', color:'#6200ea', cnt:8  },
  { key:'ownership',   label:'Ownership & Management',   icon:'🤝', color:'#c8102e', cnt:10 },
  { key:'class',       label:'Classification & Surveys', icon:'📋', color:'#b45309', cnt:10 },
  { key:'propulsion',  label:'Propulsion & Machinery',   icon:'⚙️', color:'#ea580c', cnt:13 },
  { key:'cargo',       label:'Cargo & Capacity',         icon:'📦', color:'#0891b2', cnt:9  },
  { key:'safety',      label:'Safety Equipment',         icon:'🛡️', color:'#137333', cnt:10 },
  { key:'certs',       label:'Safety Certificates',      icon:'📄', color:'#0094b3', cnt:12 },
  { key:'ais',         label:'AIS & Position',           icon:'📡', color:'#1558d6', cnt:8  },
  { key:'portcalls',   label:'Port Calls & Voyages',     icon:'⚓', color:'#0094b3', cnt:6  },
  { key:'inspections', label:'Inspections & PSC',        icon:'🔍', color:'#c8102e', cnt:8  },
  { key:'incidents',   label:'Incidents & Casualties',   icon:'⚠️', color:'#d93025', cnt:5  },
  { key:'sanctions',   label:'Sanctions & Screening',    icon:'🚨', color:'#c8102e', cnt:6  },
  { key:'finance',     label:'Finance & Valuation',      icon:'💰', color:'#b45309', cnt:7  },
  { key:'crew',        label:'Crew & Manning',           icon:'👤', color:'#6200ea', cnt:7  }
]

function buildCargoFields(v) {
  const ty = v.ty
  const cs = v.cls
  let base = [['Cargo Category',
    ty.includes('Container') ? 'Unitised (TEU)' :
    (ty.includes('Tanker') || ty.includes('LNG') || ty.includes('LPG') || ty.includes('Chemical')) ? 'Liquid Bulk' :
    ty.includes('Bulk') ? 'Dry Bulk' :
    (ty.includes('Car') || ty.includes('RoRo')) ? 'RoRo / Vehicle' :
    ty.includes('Passenger') ? 'Passengers' : 'General Cargo',
    'IHS Fairplay', 'High-level cargo category']]

  if (ty.includes('Container')) {
    base = base.concat([
      ['TEU Capacity',       v.teu ? v.teu + ' TEU' : '—',          cs, 'Twenty-foot Equivalent Units (max)'],
      ['Reefer TEU',         v.teu_r ? v.teu_r + ' TEU' : '—',      cs, 'Refrigerated container positions'],
      ['Crane SWL',          'Ship-gear fitted — 2×40 t',            cs, "Ships' cranes if fitted"],
      ['Hatch Covers',       'Pontoon type — MacGregor',             cs, 'Hatch cover type'],
    ])
  } else if (ty.includes('Oil Tanker')) {
    base = base.concat([
      ['No. of Cargo Tanks', '14 tanks (2C, 3×4L)',                  cs, 'Number and arrangement of cargo tanks'],
      ['Total Tank Capacity','~350,000 m³',                          cs, 'Total cargo tank volume'],
      ['SBT (Segregated BT)','Yes — MARPOL Reg 18',                  cs, 'Segregated ballast tanks fitted'],
      ['COW System',         v.cow ? 'Fitted' : 'Not fitted',        cs, 'Crude oil washing system'],
      ['Vapour Recovery',    'VRS fitted',                           cs, 'Vapour recovery system'],
    ])
  } else if (ty.includes('Bulk')) {
    base = base.concat([
      ['Number of Holds',    v.holds ? String(v.holds) : '—',        cs, 'Number of cargo holds'],
      ['Number of Hatches',  v.hatches ? String(v.hatches) : '—',    cs, 'Number of cargo hatch covers'],
      ['Grain Capacity',     '~95,000 m³',                           cs, 'Total grain volumetric capacity'],
      ['Bale Capacity',      '~92,400 m³',                           cs, 'Total bale volumetric capacity'],
      ['Cranes / Grabs',     '4×30 t cranes',                        cs, 'Cargo gear fitted'],
    ])
  } else if (ty.includes('LNG')) {
    base = base.concat([
      ['No. of Tanks',       '4 membrane tanks',                     cs, 'Number of LNG cargo tanks'],
      ['Tank Capacity',      '~150,000 m³',                          cs, 'Total LNG cargo capacity'],
      ['Containment System', 'GTT Mark III Flex',                    cs, 'LNG containment membrane type'],
      ['Boil-off Rate',      '~0.1 % / day',                         cs, 'Normal boil-off gas rate'],
      ['Reliquefaction',     'Fitted',                               cs, 'Boil-off gas reliquefaction system'],
    ])
  } else if (ty.includes('LPG')) {
    base = base.concat([
      ['No. of Tanks',       '4 pressure tanks',                     cs, 'Number of LPG cargo tanks'],
      ['Tank Capacity',      '~78,000 m³',                           cs, 'Total LPG cargo capacity'],
      ['Tank Design Temp',   '−48 °C',                               cs, 'Minimum design temperature'],
      ['Tank Design Press',  '0.25 MPa',                             cs, 'Tank design pressure'],
    ])
  } else if (ty.includes('Chemical')) {
    base = base.concat([
      ['No. of Cargo Tanks', '26 stainless-steel tanks',             cs, 'Number and material of cargo tanks'],
      ['Tank Capacity',      '~35,000 m³',                           cs, 'Total cargo tank volume'],
      ['IMO Cert Type',      'IBC Code — Type II',                   cs, 'IMO chemical certificate type'],
      ['Heating Coils',      'Fitted in all tanks',                  cs, 'Cargo tank heating coils'],
    ])
  } else if (ty.includes('Car') || ty.includes('RoRo')) {
    base = base.concat([
      ['CEU Capacity',       v.ceu ? v.ceu + ' CEU' : '—',          cs, 'Car Equivalent Unit capacity'],
      ['Lane Metres',        v.lanm ? String(v.lanm) : '—',         cs, 'Total lane metres'],
      ['Number of Decks',    '12 hoistable car decks',               cs, 'Vehicle decks including hoistable'],
      ['Ramp Config',        'Stern ramp + side port',               cs, 'Ramp configuration and access'],
    ])
  } else if (ty.includes('Passenger')) {
    base = base.concat([
      ['Passenger Capacity', v.pax ? String(v.pax) : '—',           cs, 'Total passenger berths'],
      ['Cabin Count',        '1,347 cabins',                         cs, 'Number of passenger cabins'],
      ['Crew Complement',    '1,253 crew',                           cs, 'Full complement including hotel staff'],
      ['Passenger Decks',    '13 passenger decks',                   cs, 'Number of passenger decks'],
    ])
  }
  return base
}

export function getEntityFields(v, key) {
  const cs = v.cls
  switch (key) {

    case 'imo': return [
      ['IMO Number',             v.imo,                                           'IHS Fairplay',  'Unique 7-digit lifetime identifier — never changes'],
      ['Vessel Name (Current)',  v.nm,                                            'IHS Fairplay',  'Current registered name'],
      ['MMSI',                   v.mmsi,                                          'AIS',           'Maritime Mobile Service Identity (9 digits)'],
      ['Call Sign',              v.cs,                                            'AIS',           'International radio call sign'],
      ['Ship Type (Coarse)',     v.ty,                                            'IHS Fairplay',  'IHS coarse type classification'],
      ['Ship Type (Granular)',   v.ty + ' / Post-Panamax',                       'IHS Fairplay',  'Detailed sub-type classification'],
      ['IMO Ship Type',          'Cargo Ship',                                    'IMO GISIS',     'IMO official classification category'],
      ['Vessel Status',          v.st,                                            'IHS Fairplay',  'Current operational status']
    ]

    case 'dimensions': return [
      ['Gross Tonnage (GT)',       v.gt + ' GT',                                  cs,              'Enclosed volume measurement (ITC 69)'],
      ['Net Tonnage (NT)',         v.nt + ' NT',                                  cs,              'Gross minus crew/machinery spaces'],
      ['Deadweight (DWT)',         v.dwt + ' DWT',                                cs,              'Max cargo + fuel + stores + crew (MT)'],
      ['Length Overall (LOA)',     v.loa,                                         cs,              'End-to-end length including all projections'],
      ['Length BP (LBP)',          v.lbp,                                         cs,              'Keel to rudder post (rule length)'],
      ['Breadth (Moulded)',        v.beam,                                        cs,              'Maximum beam, moulded measurement'],
      ['Depth (Moulded)',          v.depth,                                       cs,              'Depth at midship to main deck, moulded'],
      ['Max Draught',              v.maxDraft,                                    cs,              'Maximum permissible draught'],
      ['Summer Draught',           v.sumDraft,                                    cs,              'Load line summer zone draught'],
      ['Freeboard (Summer)',       '2.8 m',                                       cs,              'Deck to waterline at summer load line'],
      ['Air Draught',              '47.5 m',                                      cs,              'Height above waterline at summer draught'],
      ['Gross Register Tonnage',   '~' + Math.round(parseInt((v.gt||'0').replace(/,/g,''))*0.92).toLocaleString() + ' GRT', 'Flag Registry', 'Legacy GRT measurement'],
      ['Full Load Displacement',   '~' + Math.round(parseInt((v.dwt||'0').replace(/,/g,''))*1.35/1000).toLocaleString() + ' k MT', cs, 'Total displacement at full load'],
      ['Light Ship Displacement',  '~' + Math.round(parseInt((v.dwt||'0').replace(/,/g,''))*0.22/1000).toLocaleString() + ' k MT', cs, 'Weight of vessel without cargo/fuel']
    ]

    case 'construction': return [
      ['Build Year',         String(v.yr),                                        'IHS Fairplay',  'Year vessel was delivered to owner'],
      ['Keel Laid',          v.yr + '-03-01',                                     'IHS Fairplay',  'Date keel was laid at shipyard'],
      ['Launch Date',        v.yr + '-07-15',                                     'IHS Fairplay',  'Date hull was launched into water'],
      ['Delivery Date',      v.yr + '-09-30',                                     'IHS Fairplay',  'Date delivered to original owner'],
      ['Shipyard',           v.yard,                                              'IHS Fairplay',  'Yard where vessel was constructed'],
      ['Build Country',      ({'KR':'South Korea','JP':'Japan','CN':'China','DE':'Germany','FR':'France','SG':'Singapore','NO':'Norway'})[v.builtYard]||'South Korea', 'IHS Fairplay', 'Country of construction'],
      ['Hull Number',        v.hn || '—',                                         'IHS Fairplay',  'Shipyard build/hull number'],
      ["Builder's Design",   v.ty + ' Mk.2',                                      'IHS Fairplay',  'Yard design reference / model']
    ]

    case 'flag': return [
      ['Flag State',           v.fn,                                              'IHS Fairplay',  'Current flag state of registration'],
      ['Port of Registry',     ({'GR':'Piraeus','SG':'Singapore','JP':'Tokyo','PA':'Panama','SA':'Jeddah','HK':'Hong Kong','DK':'Copenhagen','BS':'Nassau','PT':'Lisbon','GB':'London','MH':'Majuro','BE':'Brussels','KR':'Seoul','NO':'Oslo','CN':'Shanghai','FR':'Marseille','DE':'Hamburg','LR':'Monrovia'})[v.fl]||'Piraeus', 'Flag Registry', 'Port where vessel is officially registered'],
      ['Registration Number',  'REG-' + v.imo,                                   'Flag Registry', 'Official number assigned by flag state'],
      ['IMO CSR Number',       'CSR-' + (((v.imo.charCodeAt(0)*31+v.imo.charCodeAt(1))*31)%900000+100000), 'IMO GISIS', 'Continuous Synopsis Record number'],
      ['Flag Code (ISO)',       v.fl,                                             'IHS Fairplay',  'ISO 3166-1 alpha-2 country code'],
      ['Previous Flag 1',      'Marshall Islands (2015–2018)',                   'IHS Fairplay',  'Prior flag state registration'],
      ['Previous Flag 2',      v.fn === 'Panama' ? 'Liberia (2009–2015)' : '—', 'IHS Fairplay',  'Earlier flag state registration'],
      ['Dangerous Goods Auth', 'DG Authorised — IMDG compliant',                 'Flag Registry', 'Authorization for carriage of dangerous goods']
    ]

    case 'ownership': return [
      ['Registered Owner',    v.ow,                                               'IHS Fairplay',  'Legal owner registered with flag state'],
      ['Beneficial Owner',    v.bo,                                               'IHS Fairplay',  'Ultimate controlling person or entity'],
      ['Commercial Operator', v.op,                                               'IHS Fairplay',  'Entity operating vessel commercially'],
      ['Technical Manager',   v.mg,                                               'IHS Fairplay',  'Responsible for ISM / technical operations'],
      ['Ship Manager',        v.mg,                                               'IHS Fairplay',  'Overall management company'],
      ['Crew Manager',        v.mg === v.ow ? v.mg : 'Synergy Marine Group',     'IHS Fairplay',  'Seafarer supply and crewing manager'],
      ['DOC Company',         v.mg,                                               'IHS Fairplay',  'ISM Document of Compliance holder'],
      ['P&I Club',            v.pi,                                               'IHS Fairplay',  'Protection & Indemnity insurance club'],
      ['H&M Underwriter',     'Skuld (Norway)',                                   'IHS Fairplay',  'Hull & Machinery insurance underwriter'],
      ['Ownership Structure', 'Single-vessel Company',                            'IHS Fairplay',  'Corporate ownership structure type']
    ]

    case 'class': return [
      ['Classification Society',  cs,                                             cs,              'Recognised classification organisation (RO)'],
      ['Class Notation',          v.clsNot,                                       cs,              'Full class notation string'],
      ['Ice Class',               v.ice,                                          cs,              'Ice strengthening notation (if any)'],
      ['DP Class',                (v.ty.includes('Offshore')||v.ty.includes('Research')) ? 'DP2' : 'N/A', cs, 'Dynamic Positioning class notation'],
      ['Last Annual Survey',      '2023-09-' + (10 + (v.id % 18)),              cs,              'Date of most recent annual survey'],
      ['Last Intermediate Survey','2021-06-01',                                  cs,              'Date of last intermediate (2.5-year) survey'],
      ['Last Special Survey',     (v.yr + 10) + '-06-01',                        cs,              'Date of last 5-year renewal survey'],
      ['Next Annual Due',         '2024-09-30',                                  cs,              'Date next annual survey is due'],
      ['Next Special Due',        (v.yr + 15) + '-06-01',                        cs,              'Date next special survey is due'],
      ['Class Status',            'Class Maintained',                             cs,              'Current class maintenance status']
    ]

    case 'propulsion': return [
      ['Main Engine Maker',   v.eng.split(' ')[0] + (v.eng.includes('B&W') ? ' B&W' : v.eng.includes('Wärtsilä') ? ' Wärtsilä' : ''), cs, 'Main engine manufacturer'],
      ['Main Engine Model',   v.eng,                                             cs,              'Engine model and designation'],
      ['Engine Type',         v.fuel.includes('LNG') ? 'Dual-fuel 4-stroke' : '2-stroke slow-speed diesel', cs, 'Engine cycle type'],
      ['No. of Engines',      v.eng.includes('x4') ? '4' : v.eng.includes('x2') ? '2' : '1', cs, 'Number of main propulsion engines'],
      ['MCR (kW)',            v.mcr,                                             cs,              'Maximum Continuous Rating in kilowatts'],
      ['NCR / Service Power', v.mcr.replace('kW','').trim() ? Math.round(parseInt(v.mcr.replace(/[^0-9]/g,''))*0.85).toLocaleString() + ' kW' : 'N/A', cs, 'Normal Continuous Rating (85 % MCR)'],
      ['Design Speed',        v.spd,                                             cs,              'Speed at design draught and MCR'],
      ['Service Speed',       v.spd.replace('kn','').trim() ? (parseFloat(v.spd)-1.5).toFixed(1) + ' kn' : 'N/A', cs, 'Speed at NCR in loaded service conditions'],
      ['Propulsion Type',     v.prp,                                             cs,              'FP = Fixed Pitch, CP = Controllable Pitch'],
      ['No. of Propellers',   v.prp === 'Azimuth DP2' ? '2 azimuth pods' : v.prp === 'Podded' ? '4 pods' : '1', cs, 'Propeller count and type'],
      ['Main Fuel Type',      v.fuel,                                            cs,              'Primary fuel type(s)'],
      ['Scrubber',            v.scrubberFitted || 'Not fitted',                  cs,              'Exhaust gas cleaning system (EGCS)'],
      ['Tier III Compliant',  v.yr >= 2016 ? 'Yes — IMO Tier III' : 'No — pre-Tier III', cs,    'IMO NOx Tier III compliance status']
    ]

    case 'cargo': return buildCargoFields(v)

    case 'safety': return [
      ['Fire-fighting Cap.',  v.ffCap ? 'Fitted' : 'Not fitted',                 cs,              'External fire-fighting capability (FiFi)'],
      ['DP Notation',         v.dp || 'None',                                     cs,              'Dynamic Positioning class and notation'],
      ['Scrubber (EGCS)',     v.scrubberFitted || 'Not fitted',                   cs,              'Exhaust gas cleaning / scrubber system'],
      ['Helicopter Facility', v.heli ? 'Fitted' : 'Not fitted',                  cs,              'Helicopter landing/operating facility'],
      ['Bow Loading Facility',v.bowDisch ? 'Fitted' : 'Not fitted',              cs,              'Bow loading / discharge facility'],
      ['Stern Discharge',     v.sternDisch ? 'Fitted' : 'Not fitted',            cs,              'Stern discharge facility'],
      ['Crude Oil Washing',   v.cow ? 'Fitted' : 'Not fitted',                   cs,              'COW system for cargo tank cleaning'],
      ['Inert Gas System',    v.igs ? 'Fitted' : 'Not fitted',                   cs,              'IGS for cargo tank atmosphere control'],
      ['BWMP',               v.bwmp ? 'Approved BWMP(T)' : 'BWMP(E) — pending', 'Flag Registry', 'Ballast Water Management Plan type and status'],
      ['Anchor Handling',     (v.ahts || v.ty === 'Offshore Supply') ? 'AHTS capability fitted' : 'Not applicable', cs, 'Anchor handling winch and gear']
    ]

    case 'certs': return [
      ['SMC (ISM)',          'Valid to 2028-03-01',                               cs,              'Safety Management Certificate (ISM Code)'],
      ['DOC',                'Valid to 2028-03-01',                               cs,              'Document of Compliance (ISM company cert)'],
      ['ISPS / AISSC',       'Valid to 2028-09-15',                               'Flag Registry', 'International Ship & Port Facility Security cert'],
      ['Load Line Cert',     'Valid to 2026-08-20',                               'Flag Registry', 'International Load Line Certificate'],
      ['Tonnage Cert',       'Permanent',                                          'Flag Registry', 'International Tonnage Certificate (ITC 69)'],
      ['IOPP (MARPOL I)',    'Valid to 2026-12-01',                               'Flag Registry', "Int'l Oil Pollution Prevention Certificate"],
      ['MARPOL Annex II',    v.ty.includes('Chemical') ? 'Valid to 2027-04-01' : 'N/A', 'Flag Registry', 'Noxious Liquid Substances certificate'],
      ['BWM Certificate',    'Valid to 2027-06-01',                               'Flag Registry', 'Ballast Water Management Certificate'],
      ['EEXI Certificate',   'Issued 2023-01-01',                                 'Flag Registry', 'Energy Efficiency Existing Ship Index cert'],
      ['CII Rating',         'B (2023 reporting year)',                            'Flag Registry', 'Carbon Intensity Indicator annual rating'],
      ['CLC / Bunker Cert',  v.ty.includes('Tanker') ? 'CLC — Valid to 2025-02-01' : 'Bunker — Valid to 2025-02-01', 'Flag Registry', 'Civil Liability / Bunker Convention cert'],
      ['High Voltage Cert',  'N/A',                                               cs,              'High voltage electrical system certificate']
    ]

    case 'ais': return [
      ['Last AIS Position',   '35.18°N, 142.52°E',                               'AIS',           'Latest received AIS position fix'],
      ['Last Update (UTC)',   '2024-01-30 14:32:45',                              'AIS',           'Timestamp of last AIS message received'],
      ['Speed Over Ground',   v.st === 'In Service' ? (10 + v.id % 12).toFixed(1) + ' kn' : '0.0 kn', 'AIS', 'SOG in knots from AIS transponder'],
      ['Course Over Ground',  (v.id * 37 % 360) + '°',                           'AIS',           'COG in degrees true from AIS'],
      ['True Heading',        (v.id * 41 % 360) + '°',                           'AIS',           'Gyrocompass heading from AIS transponder'],
      ['Navigation Status',   v.st === 'In Service' ? 'Underway Using Engine' : 'At Anchor', 'AIS', 'IMO navigation status code'],
      ['Reported Draught',    v.sumDraft,                                         'AIS',           'Draught reported via AIS type B voyage data'],
      ['AIS Destination',     v.st === 'In Service' ? 'SGSIN' : 'NRTRD',         'AIS',           'Destination text reported in AIS voyage data']
    ]

    case 'portcalls': return [
      ['Last Port (ATD)',       'Singapore — 2024-01-28 06:00 UTC',               'IHS Fairplay',  'Last port actual time of departure'],
      ['Destination',          'Rotterdam (NLRTM)',                               'AIS',           'Current AIS-reported destination'],
      ['ETA (AIS)',             '2024-02-14 12:00 UTC',                           'AIS',           'Estimated time of arrival via AIS report'],
      ['Voyage Number',         'VOY-' + (2024000 + v.id),                       'IHS Fairplay',  'Operator voyage reference number'],
      ['Trade Route',          v.ty.includes('Container') ? 'Asia–Europe (AEX)' : v.ty.includes('Tanker') ? 'Middle East–Asia (MEG)' : 'Tramping / Spot', 'IHS Fairplay', 'Regular trade lane or spot charter type'],
      ['Port Calls (last 12m)','24 port calls in 12 months',                     'IHS Fairplay',  'Number of port calls in rolling 12-month window']
    ]

    case 'inspections': return [
      ['Last PSC Inspection',    '2023-11-15 — Rotterdam',                        'IHS Fairplay',  'Most recent PSC inspection date and port'],
      ['PSC Result',             v.st === 'Detained' ? 'DETENTION — 14 deficiencies' : 'No deficiencies', 'IHS Fairplay', 'Outcome of last PSC inspection'],
      ['MOU Region',             'Paris MOU',                                     'IHS Fairplay',  'PSC MOU region of last inspection'],
      ['Total Inspections',      (12 + v.id * 2) + ' (lifetime)',                'IHS Fairplay',  'Lifetime PSC inspection count'],
      ['Detentions (lifetime)',  v.st === 'Detained' ? '3 detentions' : '0 detentions', 'IHS Fairplay', 'Total number of PSC detentions recorded'],
      ['ISM Audit Status',       'DOC Valid — Next audit 2025-Q2',               'IHS Fairplay',  'Internal Safety Management System audit status'],
      ['SIRE Vetting',           v.ty.includes('Tanker') ? 'SIRE — Last 2023-08-20' : 'N/A', 'OCIMF', 'SIRE vetting inspection (tankers only)'],
      ['CDI Inspection',         v.ty.includes('Chemical') ? 'CDI — Last 2023-05-12' : 'N/A', 'CDI', 'CDI chemical tanker inspection (chemical only)']
    ]

    case 'incidents': return [
      ['Marine Casualties',    v.st === 'Detained' ? '1 incident (2019 — minor collision)' : 'None recorded', 'MAIB / IMO GISIS', 'Recorded marine casualties and serious incidents'],
      ['Pollution Incidents',  'None recorded',                                   'MAIB / IMO GISIS', 'Oil or chemical pollution discharge events'],
      ['Piracy / Security',    'None recorded',                                   'IMO GISIS',     'Piracy or maritime security incidents'],
      ['Near-Miss Reports',    '2 near-miss reports (2021, 2022)',                'ISM SMS',       'Near-miss reports submitted via ISM SMS'],
      ['Groundings',           'None recorded',                                   'MAIB / IMO GISIS', 'Grounding or stranding incidents']
    ]

    case 'sanctions': return [
      ['OFAC SDN Status',      'Not Listed',                                      'OFAC',          'US Treasury OFAC Specially Designated Nationals list'],
      ['EU Consolidated List', 'Not Listed',                                      'EU Sanctions',  'EU consolidated sanctions and asset freeze list'],
      ['UN Security Council',  'Not Listed',                                      'UN SCPFC',      'UN Security Council sanctions screening'],
      ['UK OFSI List',         'Not Listed',                                      'UK OFSI',       'UK Office of Financial Sanctions Implementation'],
      ['Dark Activity Alert',  'None — AIS gap < 2 h (normal)',                  'AIS Analytics', 'AIS transponder dark period detection alert'],
      ['STS Transfer Alert',   'None detected (last 90 days)',                    'AIS Analytics', 'Ship-to-ship transfer monitoring alert']
    ]

    case 'finance': return [
      ['Market Value (est.)',  '$' + (10 + v.id * 3) + 'M (Jan 2024)',           'VesselsValue',  'Independent current market valuation estimate'],
      ['Last Sale Price',      '$' + (8 + v.id * 2) + 'M (' + (v.yr + 5) + ')', 'IHS Fairplay',  'Most recent recorded sale transaction price'],
      ['Last Sale Date',       (v.yr + 5) + '-06-01',                            'IHS Fairplay',  'Date of most recent sale transaction'],
      ['Mortgage Holder',      'DNB Bank ASA — Oslo',                             'IHS Fairplay',  'Current registered ship mortgage holder'],
      ['Insurance Value',      '$' + (12 + v.id * 3) + 'M (H&M)',               'IHS Fairplay',  'Hull & Machinery insured value'],
      ['Scrap Value',          '$' + Math.round(parseInt((v.dwt||'0').replace(/,/g,''))*250/1000000).toFixed(1) + 'M (LDT)', 'IHS Fairplay', 'Estimated demolition / scrap value at current LDT rates'],
      ['Charter Rate (TCE)',   '$' + (8000 + v.id * 1200).toLocaleString() + '/day', 'Clarksons', 'Latest time charter equivalent fixture rate']
    ]

    case 'crew': return [
      ['Crew Complement',      (18 + v.id % 8) + ' seafarers (contracted)',      'IHS Fairplay',  'Total crew as per safe manning certificate'],
      ['Manning Agent',        v.mg === v.ow ? v.mg : 'Synergy Marine Group',    'IHS Fairplay',  'Primary seafarer supply and crewing agent'],
      ['Crew Nationalities',   'Filipino (12), Ukrainian (4), Greek (2)',         'IHS Fairplay',  'Crew nationality breakdown by number'],
      ['Master Nationality',   'Greek',                                           'IHS Fairplay',  'Nationality of current vessel master'],
      ['MLC 2006 Compliance',  'MLC Compliant — cert valid to 2026-04-01',       'Flag Registry', 'Maritime Labour Convention compliance status'],
      ['Collective Agreement', 'ITF/JSU CBA — valid to 2025-12-31',              'IHS Fairplay',  'Collective bargaining agreement in place'],
      ['STCW Cert Status',     'All certs valid — next renewal 2025-Q3',         'Flag Registry', 'STCW seafarer certification overview']
    ]

    default: return []
  }
}

export function dRand(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return Math.abs(h % 1000) / 1000
}

export function buildVendorList(vessel, sectionKey) {
  const cs = vessel ? vessel.cls : 'DNV GL'
  const csKey   = cs.includes('Lloyd') ? 'LR'  : cs.includes('Bureau') ? 'BV' : cs.includes('NK') || cs.includes('Class') ? 'NK' : cs.includes('Korean') ? 'KR' : 'DNV'
  const csBadge = cs.includes('Lloyd') ? 'sLR' : cs.includes('Bureau') ? 'sBV' : cs.includes('NK') ? 'sNK' : cs.includes('Korean') ? 'sKR' : 'sDNV'
  const csLbl   = cs.includes('Lloyd') ? 'LR'  : cs.includes('Bureau') ? 'BV' : cs.includes('NK') ? 'NK'  : cs.includes('Korean') ? 'KR' : 'DNV'
  return [
    { key:'IHS',  label:'IHS Fairplay', badgeCls:'sIHS', badgeLbl:'IHS', coverage: sectionKey==='ais' ? 0.3 : sectionKey==='portcalls' ? 0.5 : 0.95 },
    { key:csKey,  label:cs,             badgeCls:csBadge, badgeLbl:csLbl, coverage: ['imo','flag','ownership','portcalls','ais','incidents','sanctions','finance','crew'].includes(sectionKey) ? 0.3 : 0.9 },
    { key:'AIS',  label:'AIS Live',     badgeCls:'sAIS',  badgeLbl:'AIS', coverage: ['ais','portcalls'].includes(sectionKey) ? 0.99 : sectionKey==='imo' ? 0.7 : 0.1 }
  ]
}
