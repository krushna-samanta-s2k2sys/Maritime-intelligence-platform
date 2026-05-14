import movementData  from './json/movements.json';
import portCallData  from './json/port_calls.json';

export const MOVEMENT_VESSELS = movementData.map(v => ({
  id:       v.id,
  name:     v.name,
  imo:      v.imo,
  type:     v.type,
  flag:     v.flag,
  status:   v.status,
  spd:      v.speed_kn,
  hdg:      v.heading_deg,
  lat:      v.latitude,
  lon:      v.longitude,
  dest:     v.destination,
  eta:      v.eta,
  lastPort: v.last_port,
  ata:      v.ata  ?? null,
  atd:      v.atd  ?? null,
  cargo:    v.cargo,
  dwt:      v.dwt,
  route:    v.route,
}));

export const PORT_CALLS = portCallData.map(p => ({
  vessel: p.vessel,
  imo:    p.imo,
  port:   p.port,
  locode: p.locode,
  ata:    p.ata,
  atd:    p.atd,
  purpose:p.purpose,
  vol:    p.volume,
  berth:  p.berth,
}));
