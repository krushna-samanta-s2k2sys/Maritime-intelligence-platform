import vesselData    from './json/vessels.json';
import routeData     from './json/routes.json';
import portData      from './json/ports.json';
import chokeData     from './json/choke_points.json';
import aisData       from './json/ais_positions.json';
import gisPortData   from './json/gis_ports.json';
import gisCo         from './json/gis_companies.json';
import mouZoneData   from './json/mou_zones.json';

// ── Master-database GeoJSON (Vessels, Ports, Routes, Choke) ──────────────────

export const VESSEL_GEO = {
  type: 'FeatureCollection',
  features: vesselData
    .filter(v => v.current_position?.latitude != null)
    .map(v => ({
      type: 'Feature',
      properties: {
        // short keys (used by GisAis sidebar)
        nm:  v.name,
        imo: v.imo_number,
        ty:  v.vessel_type,
        st:  v.status,
        sog: v.current_position.speed_over_ground,
        cog: v.current_position.course_over_ground,
        // long keys (used by DashboardGrid popup + vesselColor)
        name:   v.name,
        type:   v.vessel_type,
        status: v.status,
        speed:  v.current_position.speed_over_ground,
      },
      geometry: {
        type: 'Point',
        coordinates: [v.current_position.longitude, v.current_position.latitude],
      },
    })),
};

export const ROUTE_GEO = routeData;

export const PORT_GEO = {
  type: 'FeatureCollection',
  features: portData.map(p => ({
    type: 'Feature',
    properties: {
      name:       p.name,
      country:    p.country_name,
      rank:       p.global_rank,
      throughput: p.throughput_label,
      unlocode:   p.unlocode,
      // DashboardGrid uses these for sizing and popup
      type:  p.global_rank <= 3 ? 'mega' : p.global_rank <= 7 ? 'major' : 'regional',
      calls: p.throughput_teu,
    },
    geometry: {
      type: 'Point',
      coordinates: [p.longitude, p.latitude],
    },
  })),
};

export const CHOKE_POINTS = chokeData.map(cp => ({
  name: cp.name,
  lat:  cp.latitude,
  lng:  cp.longitude,
}));

// ── AIS / GIS layer — live tracking map (GisAis.jsx) ────────────────────────

export const AIS_VESSELS = aisData.map(v => ({
  id:     v.id,
  name:   v.name,
  imo:    v.imo,
  mmsi:   v.mmsi,
  type:   v.type,
  flagN:  v.flag_name,
  fl:     v.flag_emoji,
  spd:    v.speed_kn,
  hdg:    v.heading_deg,
  lat:    v.latitude,
  lon:    v.longitude,
  dest:   v.destination,
  eta:    v.eta,
  status: v.ais_status,
  dwt:    v.dwt,
  owner:  v.owner,
  cargo:  v.cargo,
}));

export const GIS_PORTS = gisPortData.map(p => ({
  id:      p.id,
  n:       p.name,
  lat:     p.latitude,
  lon:     p.longitude,
  country: p.country,
  locode:  p.locode,
  size:    p.size_tier,
  teu:     p.throughput_label,
  calls:   p.annual_calls,
  draft:   `${p.max_draft_m}m`,
  mou:     p.mou_region,
}));

export const GIS_COMPANIES = gisCo.map(c => ({
  id:      c.id,
  name:    c.name,
  type:    c.type,
  country: c.country,
  lat:     c.hq_lat,
  lon:     c.hq_lon,
  vessels: c.vessel_count,
  dwt:     c.dwt_label,
  fleet:   c.fleet_type,
}));

// Routes converted from GeoJSON [lon, lat] → Leaflet [lat, lon]
export const AIS_ROUTES = routeData.features.map(f =>
  f.geometry.coordinates.map(([lon, lat]) => [lat, lon])
);

export const AIS_CHOKE = chokeData.map(cp => ({
  n:    cp.name,
  lat:  cp.latitude,
  lon:  cp.longitude,
  vol:  cp.volume_label,
  risk: cp.risk_level,
}));

export const MOU_ZONES = mouZoneData.map(z => ({
  name:   z.name,
  color:  z.color,
  coords: z.bounds,
}));

export const AIS_STATUS_COLORS = {
  Underway:   '#4ade80',
  'In Port':  '#60a5fa',
  'At Anchor':'#fbbf24',
  'AIS Dark': '#f87171',
};
