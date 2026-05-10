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
const num  = (unit)    => T('number', { unit })
const sel  = (options) => T('select', { options })
const bool             = T('boolean')
const date             = T('date')
const text             = T('text')
const country          = T('country')

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
  'af-fuel':        sel(['HFO','VLSFO','MDO','MGO','LNG','LPG','Methanol','Dual-Fuel HFO/LNG','Dual-Fuel HFO/MDO']),
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
  'af-auxnarr':     text,
}

export function getFieldDef(leafId) {
  return FIELD_DEFS[leafId] || { type: 'text' }
}
