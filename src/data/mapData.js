// GeoJSON for dashboard map and GIS/AIS page

export const VESSEL_GEO = {
  type: 'FeatureCollection',
  features: [
    {type:'Feature', properties:{nm:'PACIFIC STAR',     imo:'9412345',ty:'Container Ship', st:'In Service'}, geometry:{type:'Point',coordinates:[103.8,1.29]}},
    {type:'Feature', properties:{nm:'EASTERN PIONEER',  imo:'9287631',ty:'Oil Tanker',       st:'In Service'}, geometry:{type:'Point',coordinates:[55.3,25.2]}},
    {type:'Feature', properties:{nm:'STELLAR WIND',     imo:'9534892',ty:'LNG Carrier',      st:'In Service'}, geometry:{type:'Point',coordinates:[121.4,31.2]}},
    {type:'Feature', properties:{nm:'GULF VOYAGER',     imo:'9412340',ty:'Container Ship', st:'In Service'}, geometry:{type:'Point',coordinates:[56.3,24.5]}},
    {type:'Feature', properties:{nm:'OCEAN PRIDE',      imo:'9341122',ty:'Bulk Carrier',     st:'Detained'},   geometry:{type:'Point',coordinates:[4.47,51.9]}},
    {type:'Feature', properties:{nm:'PACIFIC ATLAS',    imo:'9601234',ty:'Bulk Carrier',     st:'In Service'}, geometry:{type:'Point',coordinates:[114.2,22.3]}},
    {type:'Feature', properties:{nm:'NORTHERN STAR',    imo:'9188741',ty:'Chemical Tanker',  st:'In Service'}, geometry:{type:'Point',coordinates:[10.7,59.9]}},
    {type:'Feature', properties:{nm:'MAERSK COLON',     imo:'9778532',ty:'Container Ship', st:'In Service'}, geometry:{type:'Point',coordinates:[32.6,30.0]}},
    {type:'Feature', properties:{nm:'ATLANTIC BULKER',  imo:'9501238',ty:'Bulk Carrier',     st:'In Drydock'}, geometry:{type:'Point',coordinates:[-8.7,37.9]}},
    {type:'Feature', properties:{nm:'MSC OSCAR',        imo:'9703291',ty:'Container Ship', st:'In Service'}, geometry:{type:'Point',coordinates:[-5.2,36.1]}},
    {type:'Feature', properties:{nm:'QUEEN MARY 2',     imo:'9241061',ty:'Passenger/Cruise',st:'In Service'}, geometry:{type:'Point',coordinates:[-1.4,50.9]}},
    {type:'Feature', properties:{nm:'PIONEER MAX',      imo:'9612988',ty:'LPG Carrier',      st:'In Service'}, geometry:{type:'Point',coordinates:[51.5,24.9]}},
    {type:'Feature', properties:{nm:'EURONAV NINA',     imo:'9320116',ty:'Oil Tanker',       st:'In Service'}, geometry:{type:'Point',coordinates:[4.3,51.3]}},
    {type:'Feature', properties:{nm:'GLOVIS CAPTAIN',   imo:'9680042',ty:'Car Carrier',      st:'In Service'}, geometry:{type:'Point',coordinates:[129.0,35.1]}},
    {type:'Feature', properties:{nm:'NORDIC GRACE',     imo:'9388021',ty:'Bulk Carrier',     st:'Laid Up'},    geometry:{type:'Point',coordinates:[5.3,60.4]}},
    {type:'Feature', properties:{nm:'BRAVE TERN',       imo:'9593513',ty:'Offshore Wind',    st:'In Service'}, geometry:{type:'Point',coordinates:[8.0,55.5]}},
    {type:'Feature', properties:{nm:'COSCO UNIVERSE',   imo:'9871234',ty:'Container Ship', st:'In Service'}, geometry:{type:'Point',coordinates:[121.5,29.9]}},
    {type:'Feature', properties:{nm:'SUNRISE CARRIER',  imo:'9412888',ty:'Bulk Carrier',     st:'In Service'}, geometry:{type:'Point',coordinates:[141.3,35.7]}},
    {type:'Feature', properties:{nm:'NORDERNEY',        imo:'9388042',ty:'RoRo',             st:'In Service'}, geometry:{type:'Point',coordinates:[10.0,53.5]}},
    {type:'Feature', properties:{nm:'BOURBON LIBERTY',  imo:'9450993',ty:'Offshore Supply',  st:'In Service'}, geometry:{type:'Point',coordinates:[3.2,4.3]}},
    {type:'Feature', properties:{nm:'LNG JAMAL',        imo:'9234567',ty:'LNG Carrier',      st:'In Service'}, geometry:{type:'Point',coordinates:[128.9,37.5]}},
    {type:'Feature', properties:{nm:'DIANA BULKER',     imo:'9501882',ty:'Bulk Carrier',     st:'In Service'}, geometry:{type:'Point',coordinates:[-73.9,40.6]}},
    {type:'Feature', properties:{nm:'ADRIATIC SPIRIT',  imo:'9445677',ty:'Car Carrier',      st:'In Service'}, geometry:{type:'Point',coordinates:[14.5,45.3]}},
    {type:'Feature', properties:{nm:'BOREALIS',         imo:'9484948',ty:'Research Vessel',  st:'In Service'}, geometry:{type:'Point',coordinates:[10.2,63.4]}},
    {type:'Feature', properties:{nm:'PIONEER TRADER',   imo:'9499283',ty:'General Cargo',    st:'In Service'}, geometry:{type:'Point',coordinates:[2.9,6.4]}},
  ]
}

export const ROUTE_GEO = {
  type: 'FeatureCollection',
  features: [
    {
      type:'Feature',
      properties:{name:'Asia-Europe (Suez)', color:'#1558d6'},
      geometry:{type:'LineString', coordinates:[
        [121.5,30.0],[110.0,3.0],[103.8,1.3],[80.0,6.0],[72.9,18.9],[43.3,11.6],
        [32.6,30.0],[32.3,31.3],[29.5,35.5],[22.0,37.8],[12.0,37.5],[4.5,51.9]
      ]}
    },
    {
      type:'Feature',
      properties:{name:'Trans-Pacific', color:'#137333'},
      geometry:{type:'LineString', coordinates:[
        [121.5,31.2],[140.0,35.0],[160.0,40.0],[180.0,42.0],[-160.0,44.0],
        [-140.0,46.0],[[-122.3,37.8]]
      ]}
    },
    {
      type:'Feature',
      properties:{name:'Asia-Europe (Cape of Good Hope)', color:'#b45309'},
      geometry:{type:'LineString', coordinates:[
        [121.5,30.0],[110.0,3.0],[103.8,1.3],[80.0,-5.0],[55.0,-12.0],
        [32.0,-27.0],[18.4,-33.9],[5.0,-40.0],[-10.0,-35.0],[-15.0,-10.0],
        [-10.0,5.0],[-5.0,20.0],[0.0,30.0],[4.5,51.9]
      ]}
    },
    {
      type:'Feature',
      properties:{name:'North Atlantic', color:'#6200ea'},
      geometry:{type:'LineString', coordinates:[
        [4.5,51.9],[-10.0,50.0],[-30.0,50.0],[-50.0,48.0],[-60.0,45.0],[-73.9,40.7]
      ]}
    },
    {
      type:'Feature',
      properties:{name:'Persian Gulf', color:'#c8102e'},
      geometry:{type:'LineString', coordinates:[
        [56.3,24.5],[55.5,25.4],[54.7,24.4],[52.6,27.0],[50.2,26.2],
        [49.6,26.5],[49.3,29.3],[48.0,29.0],[48.5,30.5]
      ]}
    },
    {
      type:'Feature',
      properties:{name:'Intra-Asia', color:'#0094b3'},
      geometry:{type:'LineString', coordinates:[
        [121.5,31.2],[122.0,30.0],[121.0,22.0],[116.0,9.0],[110.0,3.0],
        [103.8,1.3],[108.0,-6.9],[112.0,-7.3],[120.0,-8.5],[130.0,10.0],
        [125.0,14.0],[120.9,14.5],[121.0,16.0],[124.0,37.5],[129.0,35.1]
      ]}
    }
  ]
}

export const PORT_GEO = {
  type: 'FeatureCollection',
  features: [
    {type:'Feature', properties:{name:'Shanghai',    country:'China',         rank:1, throughput:'47.3M TEU'}, geometry:{type:'Point',coordinates:[121.47,31.23]}},
    {type:'Feature', properties:{name:'Singapore',   country:'Singapore',     rank:2, throughput:'37.5M TEU'}, geometry:{type:'Point',coordinates:[103.82,1.35]}},
    {type:'Feature', properties:{name:'Rotterdam',   country:'Netherlands',   rank:1, throughput:'14.5M TEU'}, geometry:{type:'Point',coordinates:[4.47,51.92]}},
    {type:'Feature', properties:{name:'Busan',       country:'South Korea',   rank:1, throughput:'21.7M TEU'}, geometry:{type:'Point',coordinates:[129.04,35.10]}},
    {type:'Feature', properties:{name:'Jebel Ali',   country:'UAE',           rank:1, throughput:'13.6M TEU'}, geometry:{type:'Point',coordinates:[55.04,24.98]}},
    {type:'Feature', properties:{name:'Antwerp',     country:'Belgium',       rank:2, throughput:'12.0M TEU'}, geometry:{type:'Point',coordinates:[4.40,51.25]}},
    {type:'Feature', properties:{name:'Hamburg',     country:'Germany',       rank:3, throughput:'8.7M TEU'},  geometry:{type:'Point',coordinates:[9.99,53.55]}},
    {type:'Feature', properties:{name:'Los Angeles', country:'United States', rank:1, throughput:'9.9M TEU'},  geometry:{type:'Point',coordinates:[-118.25,33.72]}},
    {type:'Feature', properties:{name:'Ningbo',      country:'China',         rank:3, throughput:'33.4M TEU'}, geometry:{type:'Point',coordinates:[121.55,29.89]}},
    {type:'Feature', properties:{name:'Tokyo',       country:'Japan',         rank:1, throughput:'4.5M TEU'},  geometry:{type:'Point',coordinates:[139.78,35.62]}},
    {type:'Feature', properties:{name:'Piraeus',     country:'Greece',        rank:1, throughput:'5.4M TEU'},  geometry:{type:'Point',coordinates:[23.63,37.94]}},
    {type:'Feature', properties:{name:'Santos',      country:'Brazil',        rank:1, throughput:'4.8M TEU'},  geometry:{type:'Point',coordinates:[-46.33,-23.96]}},
  ]
}

export const CHOKE_POINTS = [
  {name:'Strait of Malacca', lat:2.5,   lng:101.5},
  {name:'Suez Canal',        lat:30.7,  lng:32.3},
  {name:'Strait of Hormuz',  lat:26.6,  lng:56.4},
  {name:'Bab-el-Mandeb',     lat:12.6,  lng:43.4},
  {name:'Panama Canal',      lat:9.1,   lng:-79.6},
  {name:'Dover Strait',      lat:51.1,  lng:1.4},
  {name:'Turkish Straits',   lat:41.1,  lng:29.0},
]
