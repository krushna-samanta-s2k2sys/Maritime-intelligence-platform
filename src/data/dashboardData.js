export const KPIS = [
  {v:'847,392', l:'Total Vessels',       delta:'+1,204', up:true,  c:'#1558d6'},
  {v:'23,841',  l:'Active Today',        delta:'+127',   up:true,  c:'#137333'},
  {v:'1,847',   l:'Port Arrivals',       delta:'+83',    up:true,  c:'#0094b3'},
  {v:'1,203',   l:'Departures',          delta:'+61',    up:true,  c:'#6200ea'},
  {v:'283',     l:'PSC Detentions YTD',  delta:'+12',    up:false, c:'#c8102e'},
  {v:'1,047',   l:'Certs Expiring 30d',  delta:'-124',   up:true,  c:'#b45309'},
  {v:'94.2%',   l:'Data Quality',        delta:'+0.3%',  up:true,  c:'#137333'},
  {v:'114',     l:'Active Feeds',        delta:'0',      up:null,  c:'#717a85'},
]

export const FLEET_TYPES = [
  ['Bulk Carrier',      231842, '#1558d6'],
  ['Oil Tanker',         61843, '#c8102e'],
  ['Container Ship',     56234, '#137333'],
  ['General Cargo',      89234, '#b45309'],
  ['Chemical Tanker',    42891, '#6200ea'],
  ['LNG/LPG Carrier',    8234,  '#0094b3'],
  ['Passenger/Cruise',   7291,  '#ea580c'],
  ['Other',             349823, '#717a85'],
]

export const FLAGS = [
  ['🇵🇦','Panama',         234891],
  ['🇱🇷','Liberia',        183421],
  ['🇲🇭','Marshall Islands',162834],
  ['🇧🇸','Bahamas',         74291],
  ['🇸🇬','Singapore',       68234],
  ['🇲🇹','Malta',           67123],
  ['🇨🇳','China',           61829],
  ['🇨🇾','Cyprus',          48291],
  ['🇬🇧','United Kingdom',  31284],
  ['🇬🇷','Greece',          28143],
]

export const PSC_DETENTIONS = [
  {vessel:'OCEAN PRIDE',      imo:'9341122',port:'Rotterdam', mou:'Paris', def:8,date:'2024-01-30',status:'Detained'},
  {vessel:'SUNRISE CARRIER',  imo:'9412888',port:'Shanghai',  mou:'Tokyo', def:5,date:'2024-01-29',status:'Detained'},
  {vessel:'NORTHERN STAR',    imo:'9188741',port:'Busan',      mou:'Tokyo', def:3,date:'2024-01-28',status:'Released'},
  {vessel:'PIONEER TRADER',   imo:'9499283',port:'Antwerp',   mou:'Paris', def:6,date:'2024-01-27',status:'Detained'},
  {vessel:'EURONAV NINA',     imo:'9320116',port:'Singapore', mou:'Tokyo', def:2,date:'2024-01-26',status:'Released'},
]

export const MARKET_INDICES = [
  {name:'BDI',  full:'Baltic Dry Index',    val:'1,847', delta:'+23', up:true},
  {name:'BDTI', full:'Baltic Dirty Tanker', val:'1,124', delta:'-8',  up:false},
  {name:'BCTI', full:'Baltic Clean Tanker', val:'892',   delta:'+12', up:true},
  {name:'BCI',  full:'Baltic Capesize',     val:'2,341', delta:'+41', up:true},
  {name:'BPI',  full:'Baltic Panamax',      val:'1,623', delta:'-19', up:false},
  {name:'BSI',  full:'Baltic Supramax',     val:'1,089', delta:'+7',  up:true},
]

export const ACTIVITY_TYPES = [
  {color:'#137333',txt:'PACIFIC STAR departed Rotterdam → Singapore (ballast)'},
  {color:'#1558d6',txt:'MAERSK COLON arrived Suez Canal northbound'},
  {color:'#c8102e',txt:'OCEAN PRIDE detained by Paris MOU — 8 deficiencies'},
  {color:'#b45309',txt:'STELLAR WIND completed annual survey — ClassNK'},
  {color:'#6200ea',txt:'COSCO UNIVERSE ownership updated by IHS Fairplay feed'},
  {color:'#137333',txt:'EASTERN PIONEER anchored off Singapore OPL'},
  {color:'#0094b3',txt:'ATLANTIC BULKER entered drydock — Bureau Veritas survey'},
  {color:'#c8102e',txt:'PIONEER TRADER detained by Tokyo MOU — 6 deficiencies'},
  {color:'#137333',txt:'QUEEN MARY 2 departed Southampton on transatlantic voyage'},
  {color:'#b45309',txt:'LNG JAMAL certificate SMC renewed — flag Korea'},
]

export const CERTS_EXPIRING = [
  {vessel:'OCEAN PRIDE',     imo:'9341122',cert:'IOPP',         exp:'2024-02-14',days:15},
  {vessel:'NORTHERN STAR',   imo:'9188741',cert:'Safety Mgmt',  exp:'2024-02-19',days:20},
  {vessel:'SUNRISE CARRIER', imo:'9412888',cert:'Load Line',    exp:'2024-02-22',days:23},
  {vessel:'PIONEER TRADER',  imo:'9499283',cert:'ISSC',         exp:'2024-03-01',days:31},
  {vessel:'ATLANTIC BULKER', imo:'9501238',cert:'Class Annual', exp:'2024-03-10',days:40},
  {vessel:'BOREALIS',        imo:'9484948',cert:'Radio Safety', exp:'2024-03-15',days:45},
]
