import portsData from './json/ports_detail.json'

export const PORTS = portsData

// ─── Attribute value getter ───────────────────────────────────────────────────

const MAP = {
  // Identity → Basic
  'po-name':           p => p.name,
  'po-fullname':       p => p.fullName || p.name,
  'po-altname':        p => p.altName || '—',
  'po-unlocode':       p => p.unlocode,
  'po-wpi':            p => p.wpi || '—',
  'po-country':        p => p.country,
  'po-region':         p => p.region || '—',
  'po-type':           p => p.type,
  'po-function':       p => Array.isArray(p.functions) ? p.functions.join(', ') : (p.functions || '—'),
  'po-status':         p => p.status || 'Active',
  'po-authority':      p => p.authority || '—',
  'po-authority-type': p => p.authorityType || '—',
  'po-owner':          p => p.owner || '—',
  'po-established':    p => p.established ? String(p.established) : '—',

  // Identity → Location
  'po-lat':            p => p.lat ? p.lat.toFixed(4) + '°' : '—',
  'po-lon':            p => p.lon ? p.lon.toFixed(4) + '°' : '—',
  'po-timezone':       p => p.timezone || '—',
  'po-utcoffset':      p => p.utcOffset != null ? 'UTC ' + (p.utcOffset >= 0 ? '+' : '') + p.utcOffset : '—',
  'po-coastline':      p => p.coastline || '—',
  'po-mou':            p => p.mou,
  'po-eca':            p => p.ecaZone ? 'Yes' : 'No',
  'po-seca':           p => p.secaZone ? 'Yes' : 'No',
  'po-locode-area':    p => p.unlocode ? p.unlocode.slice(0, 2) : '—',

  // Identity → Contact
  'po-phone':          p => p.contact?.phone || '—',
  'po-fax':            p => p.contact?.fax || '—',
  'po-email':          p => p.contact?.email || '—',
  'po-website':        p => p.contact?.website || '—',
  'po-vhf-ch':         p => p.vhf?.working ? 'Ch ' + p.vhf.working : '—',
  'po-vhf-pilot':      p => p.vhf?.pilot ? 'Ch ' + p.vhf.pilot : '—',
  'po-mmsi':           p => p.mmsi || '—',
  'po-callsign':       p => p.callsign || '—',
  'po-agents':         p => p.agents?.join(', ') || '—',

  // Physical → Harbour
  'po-harbour-area':   p => p.harbour?.totalArea ? p.harbour.totalArea + ' ha' : '—',
  'po-water-area':     p => p.harbour?.waterArea ? p.harbour.waterArea + ' ha' : '—',
  'po-land-area':      p => p.harbour?.landArea ? p.harbour.landArea + ' ha' : '—',
  'po-anch-area':      p => p.harbour?.anchArea ? p.harbour.anchArea + ' ha' : '—',
  'po-tide-range':     p => p.harbour?.tideRange ? p.harbour.tideRange + ' m' : '—',
  'po-tide-type':      p => p.harbour?.tideType || '—',
  'po-current-max':    p => p.harbour?.maxCurrent ? p.harbour.maxCurrent + ' kts' : '—',
  'po-salinity':       p => p.harbour?.salinity || '—',
  'po-bottom-type':    p => p.harbour?.bottomType || '—',
  'po-shelter':        p => p.harbour?.shelter || '—',

  // Physical → Channel
  'po-ch-maxdraft':    p => p.channel?.maxDraft ? p.channel.maxDraft + ' m' : '—',
  'po-ch-maxloa':      p => p.channel?.maxLoa ? p.channel.maxLoa + ' m' : '—',
  'po-ch-maxbeam':     p => p.channel?.maxBeam ? p.channel.maxBeam + ' m' : '—',
  'po-ch-maxdwt':      p => p.channel?.maxDwt || '—',
  'po-ch-maxairdraft': p => p.channel?.maxAirDraft ? p.channel.maxAirDraft + ' m' : '—',
  'po-ch-width':       p => p.channel?.width ? p.channel.width + ' m' : '—',
  'po-ch-length':      p => p.channel?.length ? p.channel.length + ' nm' : '—',
  'po-ch-depth-mlws':  p => p.channel?.depthMLWS ? p.channel.depthMLWS + ' m' : '—',
  'po-ch-depth-mhws':  p => p.channel?.depthMHWS ? p.channel.depthMHWS + ' m' : '—',
  'po-ch-dredged':     p => p.channel?.dredgedDepth ? p.channel.dredgedDepth + ' m' : '—',
  'po-ch-dredge-date': p => p.channel?.lastDredge || '—',
  'po-approach-notes': p => p.channel?.notes || '—',
  'po-bar-draft':      p => p.channel?.barDraft ? p.channel.barDraft + ' m' : '—',
  'po-tidal-restrict': p => p.channel?.tidalRestrict || '—',
  'po-night-entry':    p => p.channel?.nightEntry ? 'Yes' : 'No',

  // Physical → Berths
  'po-berth-count':    p => p.berths?.count ? String(p.berths.count) : '—',
  'po-berth-max-loa':  p => p.berths?.maxLoa ? p.berths.maxLoa + ' m' : '—',
  'po-berth-max-draft':p => p.berths?.maxDraft ? p.berths.maxDraft + ' m' : '—',
  'po-berth-max-dwt':  p => p.berths?.maxDwt || '—',
  'po-berth-totallen': p => p.berths?.totalLength ? p.berths.totalLength + ' m' : '—',
  'po-berth-types':    p => p.berths?.types?.join(', ') || '—',
  'po-dolphins':       p => p.berths?.dolphins ? String(p.berths.dolphins) : '—',
  'po-mooring-buoys':  p => p.berths?.mooringBuoys ? String(p.berths.mooringBuoys) : '—',
  'po-swl':            p => p.berths?.swl ? p.berths.swl + ' MT' : '—',
  'po-bollard-pull':   p => p.berths?.bollardPull ? p.berths.bollardPull + ' MT' : '—',

  // Physical → Anchorage
  'po-anch-spots':     p => p.anchorage?.spots ? String(p.anchorage.spots) : '—',
  'po-anch-max-draft': p => p.anchorage?.maxDraft ? p.anchorage.maxDraft + ' m' : '—',
  'po-anch-max-loa':   p => p.anchorage?.maxLoa ? p.anchorage.maxLoa + ' m' : '—',
  'po-anch-holding':   p => p.anchorage?.holdingGround || '—',
  'po-anch-waiting':   p => p.anchorage?.avgWaiting ? p.anchorage.avgWaiting + ' days' : '—',

  // Terminals → Container
  'po-ct-exists':      p => p.terminals?.container?.exists ? 'Yes' : 'No',
  'po-ct-operator':    p => p.terminals?.container?.operator || '—',
  'po-ct-capacity':    p => p.terminals?.container?.capacity || '—',
  'po-ct-berths':      p => p.terminals?.container?.berths ? String(p.terminals.container.berths) : '—',
  'po-ct-cranes':      p => p.terminals?.container?.cranes ? String(p.terminals.container.cranes) : '—',
  'po-ct-rtg':         p => p.terminals?.container?.rtg ? String(p.terminals.container.rtg) : '—',
  'po-ct-rmg':         p => p.terminals?.container?.rmg ? String(p.terminals.container.rmg) : '—',
  'po-ct-reefer':      p => p.terminals?.container?.reefer ? String(p.terminals.container.reefer) : '—',
  'po-ct-area':        p => p.terminals?.container?.area ? p.terminals.container.area + ' ha' : '—',
  'po-ct-max-loa':     p => p.terminals?.container?.maxLoa ? p.terminals.container.maxLoa + ' m' : '—',
  'po-ct-max-draft':   p => p.terminals?.container?.maxDraft ? p.terminals.container.maxDraft + ' m' : '—',

  // Terminals → Bulk
  'po-bt-exists':      p => p.terminals?.bulk?.exists ? 'Yes' : 'No',
  'po-bt-operator':    p => p.terminals?.bulk?.operator || '—',
  'po-bt-types':       p => p.terminals?.bulk?.types?.join(', ') || '—',
  'po-bt-capacity':    p => p.terminals?.bulk?.capacity || '—',
  'po-bt-storage':     p => p.terminals?.bulk?.storage || '—',
  'po-bt-loader-rate': p => p.terminals?.bulk?.loaderRate ? p.terminals.bulk.loaderRate + ' MT/hr' : '—',
  'po-bt-unloader':    p => p.terminals?.bulk?.unloaderRate ? p.terminals.bulk.unloaderRate + ' MT/hr' : '—',
  'po-bt-conveyors':   p => p.terminals?.bulk?.conveyors ? p.terminals.bulk.conveyors + ' m' : '—',
  'po-bt-silos':       p => p.terminals?.bulk?.silos || '—',

  // Terminals → Tanker
  'po-tt-exists':      p => p.terminals?.tanker?.exists ? 'Yes' : 'No',
  'po-tt-operator':    p => p.terminals?.tanker?.operator || '—',
  'po-tt-types':       p => p.terminals?.tanker?.types?.join(', ') || '—',
  'po-tt-capacity':    p => p.terminals?.tanker?.capacity || '—',
  'po-tt-storage':     p => p.terminals?.tanker?.storage || '—',
  'po-tt-arms':        p => p.terminals?.tanker?.arms ? String(p.terminals.tanker.arms) : '—',
  'po-tt-max-dwt':     p => p.terminals?.tanker?.maxDwt || '—',
  'po-tt-max-draft':   p => p.terminals?.tanker?.maxDraft ? p.terminals.tanker.maxDraft + ' m' : '—',
  'po-tt-slop':        p => p.terminals?.tanker?.slop ? 'Yes' : 'No',
  'po-tt-pumprate':    p => p.terminals?.tanker?.pumpRate ? p.terminals.tanker.pumpRate + ' m³/hr' : '—',

  // Terminals → RoRo / Passenger
  'po-rt-exists':      p => p.terminals?.roro?.exists ? 'Yes' : 'No',
  'po-rt-operator':    p => p.terminals?.roro?.operator || '—',
  'po-rt-ramps':       p => p.terminals?.roro?.ramps ? String(p.terminals.roro.ramps) : '—',
  'po-rt-ramp-cap':    p => p.terminals?.roro?.rampCap ? p.terminals.roro.rampCap + ' MT' : '—',
  'po-rt-lane-meters': p => p.terminals?.roro?.laneMeters || '—',
  'po-pt-exists':      p => p.terminals?.passenger?.exists ? 'Yes' : 'No',
  'po-pt-berths':      p => p.terminals?.passenger?.berths ? String(p.terminals.passenger.berths) : '—',
  'po-pt-max-loa':     p => p.terminals?.passenger?.maxLoa ? p.terminals.passenger.maxLoa + ' m' : '—',
  'po-pt-pax-cap':     p => p.terminals?.passenger?.paxCap || '—',
  'po-pt-ferry':       p => p.terminals?.passenger?.ferry ? 'Yes' : 'No',

  // Facilities → Cargo Handling
  'po-cranes-mobile':  p => p.equipment?.mobileCranes ? String(p.equipment.mobileCranes) : '—',
  'po-cranes-max-swl': p => p.equipment?.maxCraneSWL ? p.equipment.maxCraneSWL + ' MT' : '—',
  'po-forklifts':      p => p.equipment?.forklifts ? 'Yes' : 'No',
  'po-reach-stackers': p => p.equipment?.reachStackers ? 'Yes' : 'No',
  'po-bulk-grabbers':  p => p.equipment?.bulkGrabbers ? 'Yes' : 'No',
  'po-heavylift':      p => p.equipment?.heavyLift ? 'Yes' : 'No',
  'po-heavylift-swl':  p => p.equipment?.heavyLiftSWL ? p.equipment.heavyLiftSWL + ' MT' : '—',
  'po-reefer-pwr':     p => p.equipment?.reeferPower || '—',
  'po-hazmat':         p => p.equipment?.hazmat ? 'Yes' : 'No',

  // Facilities → Marine Services
  'po-pilotage':       p => p.services?.pilotage ? 'Yes' : 'No',
  'po-pilotage-comp':  p => p.services?.pilotageCompulsory ? 'Yes' : 'No',
  'po-towage':         p => p.services?.towage ? 'Yes' : 'No',
  'po-tugs':           p => p.services?.tugs ? String(p.services.tugs) : '—',
  'po-tug-max-bp':     p => p.services?.tugMaxBP ? p.services.tugMaxBP + ' MT' : '—',
  'po-freshwater':     p => p.services?.freshwater ? 'Yes' : 'No',
  'po-freshwater-rate':p => p.services?.freshwaterRate ? p.services.freshwaterRate + ' MT/hr' : '—',
  'po-provisions':     p => p.services?.provisions ? 'Yes' : 'No',
  'po-medical':        p => p.services?.medical ? 'Yes' : 'No',
  'po-garbage':        p => p.services?.garbage ? 'Yes' : 'No',
  'po-waste':          p => p.services?.waste ? 'Yes' : 'No',
  'po-quarantine':     p => p.services?.quarantine ? 'Yes' : 'No',

  // Facilities → Bunkering
  'po-bunker-avail':   p => p.bunker?.available ? 'Yes' : 'No',
  'po-bunker-hfo':     p => p.bunker?.hfo ? 'Yes' : 'No',
  'po-bunker-vlsfo':   p => p.bunker?.vlsfo ? 'Yes' : 'No',
  'po-bunker-mdo':     p => p.bunker?.mdo ? 'Yes' : 'No',
  'po-bunker-mgo':     p => p.bunker?.mgo ? 'Yes' : 'No',
  'po-bunker-lng':     p => p.bunker?.lng ? 'Yes' : 'No',
  'po-bunker-methanol':p => p.bunker?.methanol ? 'Yes' : 'No',
  'po-bunker-rate':    p => p.bunker?.rate ? p.bunker.rate + ' MT/hr' : '—',
  'po-bunker-barge':   p => p.bunker?.barge ? 'Yes' : 'No',
  'po-bunker-pipe':    p => p.bunker?.pipe ? 'Yes' : 'No',
  'po-bunker-truck':   p => p.bunker?.truck ? 'Yes' : 'No',

  // Repair
  'po-drydock':        p => p.repair?.drydock ? 'Yes' : 'No',
  'po-drydock-count':  p => p.repair?.drydockCount ? String(p.repair.drydockCount) : '—',
  'po-drydock-max-loa':p => p.repair?.drydockMaxLoa ? p.repair.drydockMaxLoa + ' m' : '—',
  'po-drydock-max-beam':p=> p.repair?.drydockMaxBeam ? p.repair.drydockMaxBeam + ' m' : '—',
  'po-drydock-max-dwt':p => p.repair?.drydockMaxDwt || '—',
  'po-slipway':        p => p.repair?.slipway ? 'Yes' : 'No',
  'po-float-dock':     p => p.repair?.floatingDock ? 'Yes' : 'No',
  'po-workshops':      p => p.repair?.workshops ? 'Yes' : 'No',
  'po-spares':         p => p.repair?.spares || '—',
  'po-diving':         p => p.repair?.diving ? 'Yes' : 'No',
  'po-uw-repair':      p => p.repair?.uwRepair ? 'Yes' : 'No',

  // Navigation Aids
  'po-lighthouse':     p => p.navAids?.lighthouse ? 'Yes' : 'No',
  'po-light-buoys':    p => p.navAids?.lightBuoys ? 'Yes' : 'No',
  'po-vts':            p => p.navAids?.vts ? 'Yes' : 'No',
  'po-vts-range':      p => p.navAids?.vtsRange ? p.navAids.vtsRange + ' nm' : '—',
  'po-ais-base':       p => p.navAids?.aisBase ? 'Yes' : 'No',
  'po-radar-station':  p => p.navAids?.radar ? 'Yes' : 'No',
  'po-tide-gauge':     p => p.navAids?.tideGauge ? 'Yes' : 'No',
  'po-weather-buoy':   p => p.navAids?.weatherBuoy ? 'Yes' : 'No',

  // Entry Restrictions
  'po-restr-max-loa':  p => p.restrictions?.maxLoa ? p.restrictions.maxLoa + ' m' : '—',
  'po-restr-max-beam': p => p.restrictions?.maxBeam ? p.restrictions.maxBeam + ' m' : '—',
  'po-restr-max-draft':p => p.restrictions?.maxDraft ? p.restrictions.maxDraft + ' m' : '—',
  'po-restr-max-dwt':  p => p.restrictions?.maxDwt || '—',
  'po-restr-airdraft': p => p.restrictions?.maxAirDraft ? p.restrictions.maxAirDraft + ' m' : '—',
  'po-restr-tidal':    p => p.restrictions?.tidalWindow || '—',
  'po-restr-daylight': p => p.restrictions?.daylightOnly ? 'Yes' : 'No',
  'po-restr-ice':      p => p.restrictions?.icebreakerReq || '—',
  'po-restr-closed':   p => p.restrictions?.closed ? 'Yes' : 'No',
  'po-restr-notes':    p => p.restrictions?.notes || '—',
  'po-restr-flags':    p => p.restrictions?.flags?.join(', ') || '—',
  'po-restr-types':    p => p.restrictions?.vesselTypes?.join(', ') || '—',

  // Environmental
  'po-env-eca':        p => p.envRestrictions?.ecaMember ? 'Yes' : 'No',
  'po-env-seca':       p => p.envRestrictions?.secaMember ? 'Yes' : 'No',
  'po-env-nox':        p => p.envRestrictions?.nox || '—',
  'po-env-so2':        p => p.envRestrictions?.so2Limit ? p.envRestrictions.so2Limit + '%' : '—',
  'po-env-cold-iron':  p => p.envRestrictions?.coldIroning ? 'Yes' : 'No',
  'po-env-ballast':    p => p.envRestrictions?.ballast || '—',
  'po-env-antifouling':p => p.envRestrictions?.antifouling || '—',
  'po-env-noise':      p => p.envRestrictions?.noise || '—',
  'po-env-sewage':     p => p.envRestrictions?.sewage || '—',

  // Traffic
  'po-traffic-year':   p => p.traffic?.year ? String(p.traffic.year) : '—',
  'po-traffic-calls':  p => p.traffic?.totalCalls ? p.traffic.totalCalls.toLocaleString() : '—',
  'po-traffic-cargo-mt':p=> p.traffic?.totalCargo || '—',
  'po-traffic-teu':    p => p.traffic?.teu || '—',
  'po-traffic-tanker': p => p.traffic?.liquidBulk || '—',
  'po-traffic-dry':    p => p.traffic?.dryBulk || '—',
  'po-traffic-general':p => p.traffic?.generalCargo || '—',
  'po-traffic-roro':   p => p.traffic?.roro || '—',
  'po-traffic-pax':    p => p.traffic?.passengers || '—',
  'po-traffic-cruise': p => p.traffic?.cruiseCalls ? String(p.traffic.cruiseCalls) : '—',
  'po-traffic-rank':   p => p.traffic?.worldRank ? '#' + p.traffic.worldRank : '—',
  'po-traffic-natrank':p => p.traffic?.nationalRank ? '#' + p.traffic.nationalRank : '—',

  // Congestion
  'po-cong-waiting':   p => p.congestion?.avgWaiting ? p.congestion.avgWaiting + ' hrs' : '—',
  'po-cong-turnaround':p => p.congestion?.avgTurnaround ? p.congestion.avgTurnaround + ' hrs' : '—',
  'po-cong-occupancy': p => p.congestion?.berthOccupancy ? p.congestion.berthOccupancy + '%' : '—',
  'po-cong-at-anch':   p => p.congestion?.atAnchor ? String(p.congestion.atAnchor) : '—',
  'po-cong-risk':      p => p.congestion?.risk || '—',
  'po-cong-peak':      p => p.congestion?.peakSeason || '—',

  // Operations
  'po-ops-hours':      p => p.operations?.hours || '24/7',
  'po-ops-holidays':   p => p.operations?.holidays || '—',
  'po-ops-workrate':   p => p.operations?.workingRate || '—',
  'po-ops-gangs':      p => p.operations?.gangs ? String(p.operations.gangs) : '—',
  'po-ops-customs-hrs':p => p.operations?.customsHours || '—',
  'po-ops-health-hrs': p => p.operations?.healthHours || '—',
  'po-ops-clearance':  p => p.operations?.clearanceTime || '—',

  // PSC
  'po-psc-mou':        p => p.psc?.mou || p.mou,
  'po-psc-auth-name':  p => p.psc?.authName || '—',
  'po-psc-auth-contact':p=> p.psc?.authContact || '—',
  'po-psc-active':     p => p.psc?.active ? 'Yes' : 'No',
  'po-psc-total-insp': p => p.psc?.totalInsp ? String(p.psc.totalInsp) : '—',
  'po-psc-detentions': p => p.psc?.detentions ? String(p.psc.detentions) : '—',
  'po-psc-det-rate':   p => p.psc?.detRate ? p.psc.detRate + '%' : '—',
  'po-psc-total-def':  p => p.psc?.totalDef ? String(p.psc.totalDef) : '—',
  'po-psc-avg-def':    p => p.psc?.avgDef ? p.psc.avgDef.toFixed(1) : '—',
  'po-psc-inspectors': p => p.psc?.inspectors ? String(p.psc.inspectors) : '—',
  'po-psc-target-rate':p => p.psc?.targetRate ? p.psc.targetRate + '%' : '—',
  'po-psc-last-report':p => p.psc?.lastReport || '—',
  'po-psc-def-fire':   p => p.psc?.defFire ? String(p.psc.defFire) : '—',
  'po-psc-def-lsa':    p => p.psc?.defLSA ? String(p.psc.defLSA) : '—',
  'po-psc-def-nav':    p => p.psc?.defNav ? String(p.psc.defNav) : '—',
  'po-psc-def-ism':    p => p.psc?.defISM ? String(p.psc.defISM) : '—',
  'po-psc-def-marpol': p => p.psc?.defMARPOL ? String(p.psc.defMARPOL) : '—',
  'po-psc-def-crew':   p => p.psc?.defCrew ? String(p.psc.defCrew) : '—',
  'po-psc-def-stcw':   p => p.psc?.defSTCW ? String(p.psc.defSTCW) : '—',
  'po-psc-def-struct': p => p.psc?.defStructure ? String(p.psc.defStructure) : '—',
  'po-psc-def-cert':   p => p.psc?.defCert ? String(p.psc.defCert) : '—',

  // Customs / Regulatory
  'po-customs-office': p => p.regulatory?.customsOffice ? 'Yes' : 'No',
  'po-customs-ftz':    p => p.regulatory?.ftz ? 'Yes' : 'No',
  'po-customs-cabotage':p=> p.regulatory?.cabotage || '—',
  'po-immigration':    p => p.regulatory?.immigration || '—',
  'po-health-auth':    p => p.regulatory?.healthAuth ? 'Yes' : 'No',
  'po-pre-arrival':    p => p.regulatory?.preArrivalDocs?.join(', ') || '—',
  'po-flag-restr':     p => p.regulatory?.flagRestrictions?.join(', ') || '—',
  'po-isps-level':     p => p.regulatory?.ispsLevel ? 'Level ' + p.regulatory.ispsLevel : '—',

  // Tariffs
  'po-tariff-currency':p => p.tariffs?.currency || 'USD',
  'po-tariff-portdue': p => p.tariffs?.portDue || '—',
  'po-tariff-pilotage':p => p.tariffs?.pilotage || '—',
  'po-tariff-towage':  p => p.tariffs?.towage || '—',
  'po-tariff-berth':   p => p.tariffs?.berth || '—',
  'po-tariff-cargo':   p => p.tariffs?.cargo || '—',
  'po-tariff-storage': p => p.tariffs?.storage || '—',
  'po-tariff-water':   p => p.tariffs?.freshwater || '—',
  'po-tariff-garbage': p => p.tariffs?.garbage || '—',
  'po-tariff-overtime':p => p.tariffs?.overtime ? 'Yes' : 'No',
}

export function getPortAttrValue(port, leafId) {
  if (!port || !leafId) return '—'
  const fn = MAP[leafId]
  if (!fn) return '—'
  try {
    const v = fn(port)
    return v == null || v === '' ? '—' : String(v)
  } catch { return '—' }
}

export function generatePortHistory(label, port, fallbackVal) {
  const val = fallbackVal || '—'
  const rows = []
  rows.push({ val, from: '2024-01-01', to: null, src: 'IHS Fairplay' })
  if (val !== '—') {
    rows.push({ val: val + ' (prev)', from: '2022-01-01', to: '2023-12-31', src: 'IHS Fairplay' })
  }
  return rows
}

// ─── Column / filter config ───────────────────────────────────────────────────

export const PORT_COL_GROUPS = [
  { key: 'identity',   label: 'Identity & Location' },
  { key: 'physical',   label: 'Physical & Navigation' },
  { key: 'traffic',    label: 'Traffic & Operations' },
  { key: 'services',   label: 'Services & Facilities' },
  { key: 'psc',        label: 'PSC & Regulatory' },
]

export const PORT_COLUMNS = [
  { id: 'name',       label: 'Port Name',    always: true },
  { id: 'unlocode',   label: 'UN/LOCODE',    always: true },
  { id: 'country',    label: 'Country',      group: 'identity' },
  { id: 'type',       label: 'Type',         group: 'identity' },
  { id: 'maxDraft',   label: 'Max Draft',    group: 'physical' },
  { id: 'mou',        label: 'MOU',          group: 'psc' },
  { id: 'totalCalls', label: 'Annual Calls', group: 'traffic' },
  { id: 'teu',        label: 'TEU',          group: 'traffic' },
  { id: 'worldRank',  label: 'World Rank',   group: 'traffic' },
  { id: 'congestion', label: 'Congestion',   group: 'services' },
]

export function getPortCellValue(port, colId) {
  switch (colId) {
    case 'name':       return port.name
    case 'unlocode':   return port.unlocode
    case 'country':    return port.country
    case 'type':       return port.type
    case 'mou':        return port.mou
    case 'maxDraft':   return port.channel?.maxDraft ? port.channel.maxDraft + ' m' : '—'
    case 'totalCalls': return port.traffic?.totalCalls ? port.traffic.totalCalls.toLocaleString() : '—'
    case 'teu':        return port.traffic?.teu || '—'
    case 'worldRank':  return port.traffic?.worldRank ? '#' + port.traffic.worldRank : '—'
    case 'congestion': return port.congestion?.risk || '—'
    default:           return '—'
  }
}

export const PORT_FILTER_FIELDS = [
  { id: 'mou',        label: 'PSC MOU',              filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.mou).filter(Boolean))].map(v => ({ value: v, label: v, count: ps.filter(p => p.mou === v).length })) },
  { id: 'type',       label: 'Port Type',            filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.type))].map(v => ({ value: v, label: v, count: ps.filter(p => p.type === v).length })) },
  { id: 'country',    label: 'Country',              filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.country))].map(v => ({ value: v, label: v, count: ps.filter(p => p.country === v).length })) },
  { id: 'status',     label: 'Status',               filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.status))].map(v => ({ value: v, label: v, count: ps.filter(p => p.status === v).length })) },
  { id: 'functions',  label: 'Port Functions',       filterType: 'multiselect', getValues: ps => { const all = [...new Set(ps.flatMap(p => p.functions||[]))]; return all.map(v => ({ value: v, label: v, count: ps.filter(p => (p.functions||[]).includes(v)).length })) } },
  { id: 'maxDraft',   label: 'Max Draft (m)',        filterType: 'range' },
  { id: 'maxLoa',     label: 'Max LOA (m)',          filterType: 'range' },
  { id: 'maxBeam',    label: 'Max Beam (m)',         filterType: 'range' },
  { id: 'berthCount', label: 'No. of Berths',        filterType: 'range' },
  { id: 'ecaZone',    label: 'ECA Zone',             filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'ECA Zone', count: 0 }, { value: 'No', label: 'Non-ECA', count: 0 }] },
  { id: 'calls',      label: 'Annual Calls',         filterType: 'range' },
  { id: 'congestion', label: 'Congestion Risk',      filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.congestion?.risk).filter(Boolean))].map(v => ({ value: v, label: v, count: ps.filter(p => p.congestion?.risk === v).length })) },
  { id: 'avgWaiting', label: 'Avg Waiting (hrs)',    filterType: 'range' },
  { id: 'container',  label: 'Container Terminal',   filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Has Container Terminal', count: 0 }, { value: 'No', label: 'No Container Terminal', count: 0 }] },
  { id: 'drydock',    label: 'Drydock Available',    filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Has Drydock', count: 0 }, { value: 'No', label: 'No Drydock', count: 0 }] },
  { id: 'pilotage',   label: 'Pilotage Compulsory',  filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Compulsory', count: 0 }, { value: 'No', label: 'Not Compulsory', count: 0 }] },
  { id: 'vts',        label: 'VTS Available',        filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'VTS Available', count: 0 }, { value: 'No', label: 'No VTS', count: 0 }] },
  { id: 'bunker',     label: 'Bunker Available',     filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Available', count: 0 }, { value: 'No', label: 'Not Available', count: 0 }] },
  { id: 'lngBunker',  label: 'LNG Bunkering',        filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'LNG Available', count: 0 }, { value: 'No', label: 'No LNG', count: 0 }] },
  { id: 'detRate',    label: 'PSC Detention Rate %', filterType: 'range' },
]
