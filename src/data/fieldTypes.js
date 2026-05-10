export const COUNTRIES = [
  'Panama','Liberia','Marshall Islands','Bahamas','Hong Kong','Singapore','Malta','Cyprus',
  'Greece','China','Norway','United Kingdom','Japan','Italy','United States','Germany',
  'Denmark','Turkey','India','South Korea','Brazil','Indonesia','Malaysia','Philippines',
  'Cayman Islands','Isle of Man','Bermuda','Barbados','Antigua and Barbuda','St Kitts & Nevis',
  'Belize','Tuvalu','Cambodia','Comoros','Cook Islands','Palau','Vanuatu','Sierra Leone',
  'Mongolia','Portugal','Spain','France','Netherlands','Belgium','Sweden','Finland',
  'Russia','Ukraine','Croatia','Tanzania','Mozambique','Djibouti','Iran','Iraq',
]

const T = (type, extra = {}) => ({ type, ...extra })
const num      = (unit)    => T('number',     { unit })
const sel      = (options) => T('select',     { options })
const multi    = (options) => T('multivalue', { options })
const bool                 = T('boolean')
const date                 = T('date')
const datetime             = T('datetime')
const text                 = T('text')
const textarea             = T('textarea')
const email                = T('email')
const url                  = T('url')
const country              = T('country')
const year     = T('number', { unit: '', validate: v => v >= 1800 && v <= 2035 ? null : 'Invalid year' })

export const FIELD_DEFS = {
  // ── General → Identity ──
  'af-name':        text,
  'af-imo':         T('text', { validate: v => /^\d{7}$/.test(String(v).replace(/\D/g,'')) ? null : 'Must be 7 digits' }),
  'af-mmsi':        T('text', { validate: v => /^\d{9}$/.test(v) ? null : 'Must be 9 digits' }),
  'af-callsign':    text,
  'af-lrno':        text,
  'af-eni':         text,
  'af-offno':       text,
  'af-por':         text,
  'af-porcode':     text,

  // ── General → Status ──
  'af-status':      sel(['Active','Detained','Laid Up','Under Construction','Dead Ship','In Casualty','Decommissioned','Scrapped']),
  'af-ssc':         sel(['ISM','Non-ISM','Exempt']),
  'af-ss-effdate':  date,

  // ── General → Ship Type ──
  'af-type':        sel(['Bulk Carrier','Container Ship','Tanker','VLCC','ULCC','LNG Carrier','LPG Carrier',
                         'Car Carrier','Cruise Ship','Ferry','General Cargo','RORO','OBO','Chemical Tanker',
                         'OSV','PSV','AHTS','Dredger','Tug','Other']),
  'af-tradetypes':  multi(['Dry Bulk','Liquid Bulk','Containers','Vehicles','Break Bulk','Project Cargo','Passengers','Supply & Support','Wind Installation','Research']),
  'af-stl2':        text,
  'af-stl3':        text,
  'af-stl4':        text,
  'af-stl5':        text,
  'af-statc5':      text,

  // ── General → Dimensions ──
  'af-loa':         num('m'),
  'af-lbp':         num('m'),
  'af-lengreg':     num('m'),
  'af-beam':        num('m'),
  'af-breadthm':    num('m'),
  'af-depth':       num('m'),
  'af-maxdraft':    num('m'),
  'af-draught':     num('m'),
  'af-displacement':num('MT'),
  'af-freeboard':   num('m'),
  'af-kmheight':    num('m'),
  'af-tpci':        num('t/cm'),

  // ── General → Tonnage ──
  'af-dwt':         num('MT'),
  'af-gt':          num(''),
  'af-nt':          num(''),
  'af-pcnt':        num(''),
  'af-scnt':        num(''),
  'af-cgt':         num(''),
  'af-ldt':         num('LT'),

  // ── General → Key Dates ──
  'af-builtyear':   T('number', { unit: '', validate: v => v >= 1900 && v <= 2030 ? null : 'Invalid year' }),
  'af-delivery':    date,
  'af-keellaid':    date,
  'af-launch':      date,
  'af-contract':    date,
  'af-convdate':    date,
  'af-deathdate':   date,
  'af-newbuild':    bool,

  // ── General → Builder ──
  'af-builtcountry':country,
  'af-shipbuilder': text,
  'af-yardno':      text,
  'af-leadseries':  text,
  'af-sistership':  text,

  // ── General → Ice Class ──
  'af-iceclass':    sel(['None','Ice Class 1A Super','Ice Class 1A','Ice Class 1B','Ice Class 1C',
                         'Arc4','Arc5','Arc6','Arc7',
                         'Polar Class PC1','Polar Class PC2','Polar Class PC3','Polar Class PC4',
                         'Polar Class PC5','Polar Class PC6','Polar Class PC7']),
  'af-iceclasscode':text,
  'af-icebreak':    bool,
  'af-icestrong':   bool,
  'af-fs1a':        bool, 'af-fs1b': bool, 'af-fs1c': bool, 'af-fs1asuper': bool,
  'af-fs2':         bool,
  'af-polarpc1':    bool, 'af-polarpc2': bool, 'af-polarpc3': bool, 'af-polarpc4': bool,
  'af-polarpc5':    bool, 'af-polarpc6': bool, 'af-polarpc7': bool,
  'af-icewww':      bool,
  'af-icenarr':     text,

  // ── General → Crew ──
  'af-crewdate':    date,
  'af-totcrew':     num('persons'),
  'af-officers':    num('persons'),
  'af-ratings':     num('persons'),
  'af-cadets':      num('persons'),

  // ── Flag ──
  'af-flag':        country,

  // ── Construction → Hull ──
  'af-hullmat':     sel(['Steel','High-Tensile Steel','Aluminium','GRP','FRP','Wood','Other']),
  'af-hulltype':    sel(['Double Hull','Single Hull','Double Bottom','Double Side','Double Bottom + Side']),
  'af-bulbow':      bool,
  'af-decks':       num(''),
  'af-bowvisor':    bool,

  // ── Construction → Manifolds ──
  'af-manifball':   num('m'),
  'af-manifladen':  num('m'),
  'af-linesperside':num(''),

  // ── Machinery → Engine ──
  'af-mcr':         num('kW'),
  'af-prp':         text,
  'af-engmodel':    text,
  'af-engtype':     sel(['2-stroke diesel','4-stroke diesel','Dual-Fuel','Gas Turbine','COGAS','Electric','Steam Turbine']),
  'af-engbuild':    text,
  'af-engdesign':   text,
  'af-cylno':       num(''),
  'af-bore':        num('mm'),
  'af-stroke':      num('mm'),
  'af-stroketype':  sel(['2-stroke','4-stroke']),
  'af-rpm':         num('rpm'),
  'af-bhp':         num('bhp'),
  'af-pwrkwmax':    num('kW'),
  'af-pwrkwsvc':    num('kW'),
  'af-pwrbhpmax':   num('bhp'),
  'af-pwrbhpsvc':   num('bhp'),
  'af-noengines':   num(''),
  'af-noaux':       num(''),
  'af-nomotors':    num(''),
  'af-nopropunits': num(''),
  'af-noalleng':    num(''),
  'af-totkwmain':   num('kW'),
  'af-totpowall':   num('kW'),
  'af-totpowaux':   num('kW'),
  'af-totpowmot':   num('kW'),
  'af-boilermfr':   text,
  'af-tier3':       bool,
  'af-tier3hpegr':  bool, 'af-tier3kecos': bool, 'af-tier3icer':  bool,
  'af-tier3ecoegr': bool, 'af-tier3iscr':  bool, 'af-tier3hpscr': bool,
  'af-tier3lpscr':  bool, 'af-tier3egrtc': bool, 'af-tier3egrbp': bool,

  // ── Machinery → Fuel ──
  'af-fuel':        multi(['HFO','VLSFO','MDO','MGO','LNG','LPG','Methanol','Ammonia','Hydrogen','Biofuel']),
  'af-fuelcap':     num('MT'),
  'af-fuel2cap':    num('MT'),
  'af-bunker':      num('MT'),
  'af-consume1':    num('MT/day'),
  'af-consume2':    num('MT/day'),
  'af-consumev1':   num('kts'),
  'af-consumev2':   num('kts'),
  'af-residual':    bool, 'af-distillate': bool, 'af-lng': bool, 'af-lpg': bool,
  'af-methanol':    bool, 'af-ammonia':    bool, 'af-hydrogen': bool, 'af-biofuel': bool,
  'af-gasfuel':     bool, 'af-batpow':     bool,
  'af-ammoniaready':bool, 'af-hydrogenready': bool, 'af-methanolready': bool, 'af-gasready': bool,
  'af-coal':        bool, 'af-gasboiloff': bool, 'af-ethane': bool, 'af-lvoc': bool,
  'af-nuclear':     bool,

  // ── Machinery → Speed ──
  'af-speedmax':    num('kts'),
  'af-speedsvc':    num('kts'),

  // ── Machinery → Propeller ──
  'af-proptype':    sel(['FP','CP','CRP','Voith','Azimuth','Rim-Driven','Paddle']),
  'af-proppos':     sel(['Centre','Twin','Triple','Quadruple']),
  'af-proptcode':   text,
  'af-screw':       num(''),
  'af-propman':     text,
  'af-rpmmax':      num('rpm'),
  'af-rpmsvc':      num('rpm'),
  'af-nozzle':      bool,
  'af-auxprp':      text,

  // ── Machinery → Thrusters & DP ──
  'af-thrtype':     sel(['Tunnel','Azimuth','Retractable','Pump-jet']),
  'af-thrno':       num(''),
  'af-thrpos':      sel(['Bow','Stern','Bow + Stern']),
  'af-thrkw':       num('kW'),
  'af-thrbhp':      num('bhp'),
  'af-dp0':         bool, 'af-dp1': bool, 'af-dp2': bool, 'af-dp3': bool,
  'af-thrnarr':     text,

  // ── Machinery → Generators ──
  'af-genno':       num(''),
  'af-genkw':       num('kW'),
  'af-genvolt':     num('V'),
  'af-genvolt2':    num('V'),
  'af-genfreq':     num('Hz'),
  'af-genacdc':     sel(['AC','DC','AC/DC']),
  'af-genpos':      text,
  'af-genhpaux':    num('hp'),
  'af-genhpmain':   num('hp'),
  'af-auxnarr':     textarea,

  // ── General → Identity (unmapped) ──
  'af-flageff':     date,
  'af-flagcode':    text,
  'af-porcode':     text,
  'af-porfull':     text,
  'af-fishno':      text,
  'af-email':       email,
  'af-nationality': country,

  // ── Construction → Dimensions (unmapped) ──
  'af-breadthe':    num('m'),
  'af-altdwt':      num('MT'),
  'af-altdraught':  num('m'),
  'af-waterdepth':  num('m'),
  'af-drilldepth':  num('m'),
  'af-parbodball':  num('m'),
  'af-parbodlad':   num('m'),
  'af-parbodlight': num('m'),

  // ── Construction → Tonnage (unmapped) ──
  'af-formuladwt':  num('MT'),
  'af-tonnageeff':  date,
  'af-tonn69':      bool,

  // ── Construction → Key Dates (unmapped) ──
  'af-dateofbuild': date,
  'af-ncentry':     date,
  'af-breakstart':  date,
  'af-decommyear':  year,
  'af-newbuild':    num('USD'),

  // ── Construction → Builder (unmapped) ──
  'af-builtcountryc': text,
  'af-shipbuildcode': text,
  'af-shipbuildfull': text,
  'af-shipbuildsubc': text,
  'af-stddesign':   text,
  'af-prodindicator': bool,

  // ── Crew (unmapped) ──
  'af-trainees':    num('persons'),
  'af-ridingsquad': num('persons'),
  'af-undeclared':  num('persons'),

  // ── Ownership & Management ──
  'af-regownfull':  text,
  'af-regowncode':  text,
  'af-regowncountry': country,
  'af-regowndate':  date,
  'af-docconame':   text,
  'af-doccocode':   text,
  'af-doccofull':   text,
  'af-techmanname': text,
  'af-techmancode': text,
  'af-techmanfull': text,
  'af-shipmanname': text,
  'af-shipmancode': text,
  'af-shipmanfull': text,
  'af-bareowner':   text,
  'af-charterer':   text,
  'af-groupbenown': text,
  'af-groupbenowncode': text,

  // ── Classification & Surveys ──
  'af-clssocname':  text,
  'af-clssoccode':  text,
  'af-clsnotation': textarea,
  'af-clseffdate':  date,
  'af-clsexpdate':  date,
  'af-survanndate': date,
  'af-survdockdate': date,
  'af-survspecdate': date,
  'af-survcontinuous': bool,

  // ── Safety & Certification ──
  'af-docissdate':  date,
  'af-docexpdate':  date,
  'af-docissauth':  text,
  'af-smcissdate':  date,
  'af-smcexpdate':  date,
  'af-smcissauth':  text,
  'af-ioppissdate': date,
  'af-ioppexpdate': date,
  'af-ioppissauth': text,
  'af-piclub':      text,
  'af-piclubadr':   textarea,
  'af-piexpdate':   date,

  // ── Finance ──
  'af-saleprice':   num('USD'),
  'af-saledate':    date,
  'af-mortgaged':   bool,
  'af-mortgagee':   text,
  'af-lientype':    text,
  'af-charterrate': num('USD/day'),

  // ── Cargo / Capacity ──
  'af-teu':         num('TEU'),
  'af-teur':        num('TEU'),
  'af-teu14':       num('TEU'),
  'af-ceu':         num('CEU'),
  'af-cbm':         num('m³'),
  'af-holds':       num(''),
  'af-hatches':     num(''),
  'af-grainspace':  num('m³'),
  'af-balespace':   num('m³'),
  'af-liquid':      num('m³'),
  'af-pax':         num('persons'),
  'af-berths':      num('berths'),
  'af-cardecks':    num(''),
  'af-carheight':   num('m'),
  'af-lanemet':     num('m'),
  'af-trailerspace': num('units'),

  // ── Compliance & Sanctions ──
  'af-sanctions':   multi(['OFAC SDN','UN','EU','UK HMT','OFAC Non-SDN','Japan METI','Canada','Australia']),
  'af-sanctiondate': date,
  'af-sanctionnotes': textarea,
  'af-pscdetentions': num(''),
  'af-pscdeficiencies': num(''),
  'af-pscdate':     date,
  'af-pscrisk':     sel(['Low','Medium','High','Very High']),
}

// ── Pattern-based inference for unmapped fields ────────────────────────────
export function getFieldDef(leafId) {
  if (FIELD_DEFS[leafId]) return FIELD_DEFS[leafId]

  const id = leafId.toLowerCase()

  // All shiptype-group indicator flags are boolean
  if (id.startsWith('af-stg-')) return bool

  // Email fields
  if (id.includes('email') || id.includes('mail')) return email

  // URL / website fields
  if (id.includes('url') || id.includes('website') || id.includes('web')) return url

  // Date patterns — ends with 'date', 'eff', 'effdate', 'expdate'
  if (/(date|effdate|expdate|issdate|effdt)$/.test(id)) return date

  // Year patterns
  if (/(year|yr)$/.test(id)) return year

  // Narrative / notes / remarks → textarea
  if (/(narr|narrative|desc|note|notes|remark|remarks|comment|comments|detail|address|adr)$/.test(id)) return textarea

  // Numeric patterns — known unit suffixes in the ID itself
  if (/(kw|bhp|rpm|dwt|gt|nt|ldt|cgt|teu|cbm|ton|tonne|knot|kts|mtr|metres|mm|cm)/.test(id)) return num('')

  // Boolean indicators — starts with common bool prefixes
  if (/^af-(has|is|fitted|equipped|capable|ready|certified)/.test(id)) return bool

  return text
}
