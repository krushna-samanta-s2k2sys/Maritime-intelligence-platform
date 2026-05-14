import fixtureData    from './json/fixtures.json';
import freightData    from './json/freight_routes.json';
import tcData         from './json/tc_contracts.json';
import marketData     from './json/market_indices.json';

export const FIXTURES = fixtureData;

export const INDICES = marketData.map(m => ({
  name:  m.code,
  full:  m.name,
  val:   m.value,
  prev:  m.prev,
  w52lo: m.w52_low,
  w52hi: m.w52_high,
  col:   m.color,
  desc:  m.description,
  bars:  m.sparkline,
}));

// Freight rate routes — {route, ws, tceDollar, prev, lo, hi, seg}
export const ROUTES = freightData.map(r => ({
  route:      r.route,
  ws:         r.ws,
  tceDollar:  r.tce,
  prev:       r.prev_tce,
  lo:         r.lo,
  hi:         r.hi,
  seg:        r.segment,
}));

export const TC_CONTRACTS = tcData;
