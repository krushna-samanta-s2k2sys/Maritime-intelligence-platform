import vesselData from './json/vessels.json';

// Map normalized JSON fields to the abbreviated field names the rest of the app uses.
// When the API is live, update this mapping to reflect the API response shape.
export const VESSELS = vesselData.map(v => ({
  id:          v.id,
  nm:          v.name,
  imo:         v.imo_number,
  mmsi:        v.mmsi_number,
  cs:          v.call_sign,
  fl:          v.flag_code,
  fn:          v.flag_name,
  flag:        v.flag_emoji,
  ty:          v.vessel_type,
  st:          v.status,
  up:          v.last_updated,
  // dimensions
  loa:         `${v.dimensions.length_overall_m}m`,
  lbp:         `${v.dimensions.length_between_perp_m}m`,
  beam:        `${v.dimensions.beam_m}m`,
  depth:       `${v.dimensions.depth_m}m`,
  maxDraft:    `${v.dimensions.max_draft_m}m`,
  sumDraft:    `${v.dimensions.summer_draft_m}m`,
  // tonnage — formatted strings for display, raw numbers for filtering
  dwt:         v.tonnage.deadweight_t.toLocaleString(),
  gt:          v.tonnage.gross_t.toLocaleString(),
  nt:          v.tonnage.net_t.toLocaleString(),
  dwtNum:      v.tonnage.deadweight_t,
  gtNum:       v.tonnage.gross_t,
  ntNum:       v.tonnage.net_t,
  // construction
  yr:          v.construction.year_built,
  yard:        v.construction.shipyard,
  hn:          v.construction.hull_number,
  builtYard:   v.construction.build_country_code,
  // machinery
  eng:         v.machinery.main_engine,
  mcr:         `${v.machinery.mcr_kw.toLocaleString()} kW`,
  mcrNum:      v.machinery.mcr_kw,
  spd:         `${v.machinery.service_speed_kn} kn`,
  spdNum:      v.machinery.service_speed_kn,
  fuel:        v.machinery.fuel_type,
  prp:         v.machinery.propulsion_type,
  // cargo
  teu:         v.cargo.teu_nominal ? v.cargo.teu_nominal.toLocaleString() : null,
  teu_r:       v.cargo.teu_reefer  ? v.cargo.teu_reefer.toLocaleString()  : null,
  ceu:         v.cargo.car_equivalent_units ? v.cargo.car_equivalent_units.toLocaleString() : null,
  pax:         v.cargo.passengers  ? v.cargo.passengers.toLocaleString()  : null,
  holds:       v.cargo.cargo_holds  ? String(v.cargo.cargo_holds)  : null,
  hatches:     v.cargo.cargo_hatches? String(v.cargo.cargo_hatches): null,
  lanm:        v.cargo.lane_metres  ? `${v.cargo.lane_metres.toLocaleString()} lm` : null,
  // ownership
  ow:          v.ownership.registered_owner,
  bo:          v.ownership.beneficial_owner,
  op:          v.ownership.commercial_operator,
  mg:          v.ownership.technical_manager,
  pi:          v.ownership.pi_club,
  // classification
  cls:         v.classification.class_society,
  clsNot:      v.classification.class_notation,
  ice:         v.classification.ice_class   || 'None',
  dp:          v.classification.dp_class    || null,
  // safety
  ffCap:       v.safety.firefighting_capacity,
  bowDisch:    v.safety.bow_discharge,
  sternDisch:  v.safety.stern_discharge,
  cow:         v.safety.crude_oil_washing,
  igs:         v.safety.inert_gas_system,
  scrubberFitted: v.safety.scrubber_type || null,
  heli:        v.safety.helideck,
  bwmp:        v.safety.ballast_water_mgmt_plan,
  // position (available for map/AIS use)
  lat:         v.current_position?.latitude  ?? null,
  lon:         v.current_position?.longitude ?? null,
  sog:         v.current_position?.speed_over_ground ?? null,
  cog:         v.current_position?.course_over_ground ?? null,
}));

export const STATUS_CLASSES = {
  'In Service': 'stA',
  'Detained':   'stR',
  'In Drydock': 'stD',
  'Laid Up':    'stI',
  'Total Loss': 'stR',
};

export const SRC_SHORT_CLASSES = {
  IHS: 'sIHS', AIS: 'sAIS', LR: 'sLR', BV: 'sBV',
  DNV: 'sDNV', NK: 'sNK', KR: 'sKR', CC: 'sNK', FLAG: 'sFLAG',
}

const SRC_BADGE_MAP = {
  'IHS Fairplay': { cls: 'sIHS', label: 'IHS' },
  'AIS':          { cls: 'sAIS', label: 'AIS' },
  'DNV GL':       { cls: 'sDNV', label: 'DNV' },
  "Lloyd's Register": { cls: 'sLR', label: 'LR' },
  'Bureau Veritas': { cls: 'sBV', label: 'BV' },
  'ClassNK':      { cls: 'sNK', label: 'NK' },
  'Korean Register': { cls: 'sKR', label: 'KR' },
  'China Classification': { cls: 'sNK', label: 'CC' },
  'Flag Registry': { cls: 'sFLAG', label: 'FLAG' },
};

export function srcBadgeClass(src) {
  return SRC_BADGE_MAP[src]?.cls || 'sIHS';
}

export function srcBadgeLabel(src) {
  return SRC_BADGE_MAP[src]?.label || src.slice(0, 3).toUpperCase();
}
