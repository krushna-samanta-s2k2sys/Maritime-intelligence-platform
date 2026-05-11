import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import GenAttrTreeSidebar from '../components/shared/GenAttrTreeSidebar'
import GenAttrContentPanel from '../components/shared/GenAttrContentPanel'
import FieldEditPanel from '../components/vessels/FieldEditPanel'
import { PORT_ATTRIBUTE_TREE } from '../data/portAttributeTree'
import { getPortAttrValue, generatePortHistory } from '../data/portAttrValueMap'

// ── Port Data ────────────────────────────────────────────────────────────────
const INIT_PORTS = [
  {
    id: 1, name: 'Rotterdam', fullName: 'Port of Rotterdam', unlocode: 'NLRTM', wpi: '55280',
    country: 'Netherlands', region: 'South Holland', type: 'Commercial', mou: 'Paris MOU',
    lat: 51.9225, lon: 4.4792, timezone: 'CET', utcOffset: 1,
    status: 'Active', authority: 'Port of Rotterdam Authority', authorityType: 'Port Authority',
    owner: 'Port of Rotterdam Authority', established: 1872,
    coastline: 'North Sea / Rhine Delta', ecaZone: true, secaZone: true,
    functions: ['Container', 'Bulk', 'Tanker', 'RoRo', 'Passenger'],
    contact: { phone: '+31 10 252 1111', fax: '+31 10 252 1199', email: 'info@portofrotterdam.com', website: 'www.portofrotterdam.com' },
    vhf: { working: 71, pilot: 69 }, mmsi: '002442000', callsign: 'ROTTERDAM HAVEN RADIO',
    agents: ['Marsman Keesen', 'Roompot Maritime Services', 'Peel Ports'],
    harbour: { totalArea: 12600, waterArea: 7200, landArea: 5400, anchArea: 800, tideRange: 1.8, tideType: 'Semi-diurnal', maxCurrent: 1.2, salinity: 'Brackish', bottomType: 'Sand/Clay', shelter: 'Excellent' },
    channel: { maxDraft: 23.9, maxLoa: 400, maxBeam: 67, maxDwt: '500,000 MT', maxAirDraft: 44, width: 600, length: 32, depthMLWS: 23.9, depthMHWS: 25.7, dredgedDepth: 24.0, lastDredge: '2023-09-01', nightEntry: true },
    berths: { count: 1212, maxLoa: 400, maxDraft: 23, maxDwt: '500,000 MT', totalLength: 89000, types: ['Bulk', 'Container', 'Tanker', 'RoRo', 'General Cargo'], dolphins: 42, mooringBuoys: 28, swl: 200, bollardPull: 150 },
    anchorage: { spots: 85, maxDraft: 22, maxLoa: 400, holdingGround: 'Good', avgWaiting: 0.5 },
    terminals: {
      container: { exists: true, operator: 'ECT / APM Terminals / EUROMAX', capacity: '15.3M TEU/yr', berths: 22, cranes: 94, rtg: 180, rmg: 42, reefer: 2800, area: 420, maxLoa: 400, maxDraft: 16.65 },
      bulk: { exists: true, operator: 'EMO / EECV / OBA', types: ['Coal', 'Iron Ore', 'Grain', 'Agribulk'], capacity: '120M MT/yr', storage: '12M MT', loaderRate: 12000, unloaderRate: 8000, conveyors: 25000, silos: '1.8M MT' },
      tanker: { exists: true, operator: 'VOPAK / Koole Terminals', types: ['Crude Oil', 'Refined Products', 'Chemical', 'LNG'], capacity: '250M MT/yr', storage: '50M m³', arms: 64, maxDwt: '500,000 MT', maxDraft: 24, slop: true, pumpRate: 12000 },
      roro: { exists: true, operator: 'PCTC / Cobelfret', ramps: 28, rampCap: 200, laneMeters: '180,000 LM' },
      passenger: { exists: true, berths: 8, maxLoa: 360, paxCap: '12,000/day', ferry: true },
    },
    equipment: { mobileCranes: 180, maxCraneSWL: 1200, forklifts: true, reachStackers: true, bulkGrabbers: true, heavyLift: true, heavyLiftSWL: 1200, reeferPower: '380V/50Hz', hazmat: true },
    services: { pilotage: true, pilotageCompulsory: true, towage: true, tugs: 28, tugMaxBP: 120, freshwater: true, freshwaterRate: 500, provisions: true, medical: true, garbage: true, waste: true, quarantine: true },
    bunker: { available: true, hfo: true, vlsfo: true, mdo: true, mgo: true, lng: true, methanol: true, rate: 800, barge: true, pipe: true, truck: true },
    repair: { drydock: true, drydockCount: 8, drydockMaxLoa: 400, drydockMaxBeam: 90, drydockMaxDwt: '500,000 MT', slipway: true, floatingDock: true, workshops: true, spares: 'Full', diving: true, uwRepair: true },
    navAids: { lighthouse: true, lightBuoys: true, vts: true, vtsRange: 40, aisBase: true, radar: true, tideGauge: true, weatherBuoy: true },
    restrictions: { maxLoa: 400, maxBeam: 67, maxDraft: 23.9, maxDwt: '500,000 MT', maxAirDraft: 44, daylightOnly: false, closed: false },
    envRestrictions: { ecaMember: true, secaMember: true, nox: 'Tier III', so2Limit: 0.1, coldIroning: true, ballast: 'BWMC compliant required', sewage: 'No discharge within 3nm' },
    traffic: { year: 2023, totalCalls: 28400, totalCargo: '467M MT', teu: '14.5M TEU', liquidBulk: '215M MT', dryBulk: '84M MT', generalCargo: '22M MT', roro: '2.1M units', passengers: '1.8M', cruiseCalls: 128, worldRank: 11, nationalRank: 1 },
    congestion: { avgWaiting: 4.2, avgTurnaround: 22, berthOccupancy: 68, atAnchor: 24, risk: 'Low', peakSeason: 'Oct–Dec' },
    operations: { hours: '24/7', holidays: 'None (24/7)', workingRate: 'Varies by terminal', gangs: 280, customsHours: '24/7', healthHours: '24/7', clearanceTime: '2–4 hours' },
    psc: { mou: 'Paris MOU', authName: 'Netherlands ILT', authContact: '+31 88 489 0000', active: true, totalInsp: 1840, detentions: 82, detRate: 4.5, totalDef: 4280, avgDef: 2.3, inspectors: 38, targetRate: 25, lastReport: '2024-01-15', defFire: 620, defLSA: 780, defNav: 420, defISM: 340, defMARPOL: 580, defCrew: 890, defSTCW: 420, defStructure: 180, defCert: 650 },
    regulatory: { customsOffice: true, ftz: true, cabotage: 'EU regulations apply', immigration: 'Schengen rules', healthAuth: true, preArrivalDocs: ['NOA 24h', 'DPG Declaration', 'Crew List', 'Cargo Manifest'], ispsLevel: 1 },
    tariffs: { currency: 'EUR', portDue: 'Per GT basis', pilotage: 'Per meter draft', towage: 'Per tug/hour', berth: 'Per meter LOA/day', cargo: 'Per MT', freshwater: 'EUR 2.80/MT', overtime: true },
  },
  {
    id: 2, name: 'Singapore', fullName: 'Port of Singapore', unlocode: 'SGSIN', wpi: '48300',
    country: 'Singapore', region: 'Singapore', type: 'Commercial', mou: 'Tokyo MOU',
    lat: 1.2897, lon: 103.8501, timezone: 'SGT', utcOffset: 8,
    status: 'Active', authority: 'Maritime and Port Authority of Singapore (MPA)', authorityType: 'Government Authority',
    owner: 'MPA / PSA International', established: 1819,
    coastline: 'Strait of Malacca / South China Sea', ecaZone: false, secaZone: false,
    functions: ['Container', 'Bulk', 'Tanker', 'Bunkering Hub'],
    contact: { phone: '+65 6375 1600', fax: '+65 6375 1654', email: 'mpa_ops@mpa.gov.sg', website: 'www.mpa.gov.sg' },
    vhf: { working: 22, pilot: 14 }, mmsi: '005633000', callsign: 'SINGAPORE PORT RADIO',
    harbour: { totalArea: 6600, waterArea: 4000, landArea: 2600, tideRange: 2.5, tideType: 'Semi-diurnal', maxCurrent: 1.8, salinity: 'Saltwater', bottomType: 'Mud', shelter: 'Good' },
    channel: { maxDraft: 22, maxLoa: 400, maxBeam: 60, maxDwt: '500,000 MT', maxAirDraft: 55, width: 400, length: 5.5, depthMLWS: 22, depthMHWS: 24, dredgedDepth: 22, nightEntry: true },
    berths: { count: 900, maxLoa: 400, maxDraft: 22, maxDwt: '400,000 MT', totalLength: 60000, types: ['Container', 'Bulk', 'Tanker', 'General Cargo'], dolphins: 60, mooringBuoys: 150 },
    anchorage: { spots: 280, maxDraft: 20, maxLoa: 400, holdingGround: 'Good', avgWaiting: 0.3 },
    terminals: {
      container: { exists: true, operator: 'PSA International', capacity: '50M TEU/yr', berths: 52, cranes: 220, rtg: 600, rmg: 80, reefer: 6000, area: 900, maxLoa: 400, maxDraft: 16 },
      bulk: { exists: true, operator: 'Jurong Port', types: ['Agribulk', 'Steel', 'Wood Pulp'], capacity: '45M MT/yr' },
      tanker: { exists: true, operator: 'Various (Jurong Island)', types: ['Crude', 'Products', 'LNG', 'Chemical'], capacity: '130M MT/yr', storage: '18M m³', arms: 120, maxDwt: '500,000 MT', maxDraft: 22, slop: true },
      roro: { exists: true, operator: 'Various', ramps: 12 },
      passenger: { exists: true, berths: 6, paxCap: '5,000/day', ferry: true },
    },
    equipment: { mobileCranes: 240, maxCraneSWL: 1800, forklifts: true, reachStackers: true, bulkGrabbers: true, heavyLift: true, heavyLiftSWL: 1800, reeferPower: '440V/60Hz', hazmat: true },
    services: { pilotage: true, pilotageCompulsory: true, towage: true, tugs: 60, tugMaxBP: 120, freshwater: true, freshwaterRate: 300, provisions: true, medical: true, garbage: true, waste: true, quarantine: true },
    bunker: { available: true, hfo: true, vlsfo: true, mdo: true, mgo: true, lng: true, methanol: false, rate: 2000, barge: true, pipe: true, truck: true },
    repair: { drydock: true, drydockCount: 12, drydockMaxLoa: 400, drydockMaxBeam: 80, drydockMaxDwt: '500,000 MT', slipway: false, floatingDock: true, workshops: true, spares: 'Excellent', diving: true, uwRepair: true },
    navAids: { lighthouse: true, lightBuoys: true, vts: true, vtsRange: 45, aisBase: true, radar: true, tideGauge: true },
    restrictions: { maxLoa: 400, maxBeam: 60, maxDraft: 22, daylightOnly: false, closed: false },
    envRestrictions: { ecaMember: false, secaMember: false, nox: 'No local restriction', so2Limit: 0.5, coldIroning: false, ballast: 'BWMC guidelines' },
    traffic: { year: 2023, totalCalls: 140000, totalCargo: '630M MT', teu: '37.3M TEU', liquidBulk: '380M MT', dryBulk: '80M MT', worldRank: 2, nationalRank: 1 },
    congestion: { avgWaiting: 1.8, avgTurnaround: 18, berthOccupancy: 72, atAnchor: 80, risk: 'Low', peakSeason: 'Jan, Mar, Oct' },
    operations: { hours: '24/7', customsHours: '24/7', healthHours: '24/7', clearanceTime: '1–2 hours' },
    psc: { mou: 'Tokyo MOU', authName: 'Maritime Port Authority Singapore', active: true, totalInsp: 3200, detentions: 128, detRate: 4.0, totalDef: 7040, avgDef: 2.2, inspectors: 52, targetRate: 20 },
    regulatory: { customsOffice: true, ftz: true, cabotage: 'Singapore cabotage law', immigration: 'Singapore Immigration', healthAuth: true, preArrivalDocs: ['NOA 24h', 'Crew List', 'ISPS Declaration'], ispsLevel: 1 },
    tariffs: { currency: 'SGD', portDue: 'Per GT', freshwater: 'SGD 2.20/MT', overtime: false },
  },
  {
    id: 3, name: 'Shanghai', fullName: 'Shanghai International Port', unlocode: 'CNSHA', wpi: '62830',
    country: 'China', region: 'Shanghai Municipality', type: 'Commercial', mou: 'Tokyo MOU',
    lat: 31.2304, lon: 121.4737, timezone: 'CST', utcOffset: 8,
    status: 'Active', authority: 'Shanghai International Port (Group) Co., Ltd', authorityType: 'State-owned Enterprise',
    established: 1843,
    coastline: 'East China Sea / Yangtze River Delta', ecaZone: true, secaZone: false,
    functions: ['Container', 'Bulk', 'Tanker', 'General Cargo'],
    contact: { phone: '+86 21 6329 6868', website: 'www.portshanghai.com.cn' },
    vhf: { working: 16, pilot: 12 },
    harbour: { tideRange: 3.8, tideType: 'Irregular semi-diurnal', maxCurrent: 2.5, salinity: 'Brackish', bottomType: 'Mud', shelter: 'Good' },
    channel: { maxDraft: 17, maxLoa: 400, maxBeam: 64, nightEntry: true, depthMLWS: 17, dredgedDepth: 17 },
    berths: { count: 1500, maxLoa: 400, maxDraft: 17, totalLength: 120000, types: ['Container', 'Bulk', 'Tanker'] },
    anchorage: { spots: 200, maxDraft: 15, avgWaiting: 0.8 },
    terminals: {
      container: { exists: true, operator: 'SIPG', capacity: '49.5M TEU/yr', berths: 60, cranes: 252, area: 1100, maxLoa: 400, maxDraft: 16 },
      bulk: { exists: true, operator: 'SIPG Bulk', types: ['Coal', 'Iron Ore', 'Grain'], capacity: '80M MT/yr' },
      tanker: { exists: true, operator: 'Yangshan Petrochemical', types: ['Crude', 'Products'], capacity: '120M MT/yr' },
    },
    equipment: { mobileCranes: 300, maxCraneSWL: 2500, forklifts: true, reachStackers: true, heavyLift: true, hazmat: true },
    services: { pilotage: true, pilotageCompulsory: true, towage: true, tugs: 80, freshwater: true, provisions: true, medical: true, garbage: true, waste: true },
    bunker: { available: true, hfo: true, vlsfo: true, mdo: true, mgo: true, lng: true, rate: 1000, barge: true },
    repair: { drydock: true, drydockCount: 15, drydockMaxLoa: 400, workshops: true, spares: 'Excellent', diving: true },
    navAids: { lighthouse: true, lightBuoys: true, vts: true, vtsRange: 50, aisBase: true, radar: true, tideGauge: true },
    restrictions: { maxLoa: 400, maxDraft: 17, daylightOnly: false, closed: false },
    envRestrictions: { ecaMember: true, nox: 'Domestic ECA', so2Limit: 0.1, coldIroning: true },
    traffic: { year: 2023, totalCalls: 185000, totalCargo: '760M MT', teu: '49.5M TEU', worldRank: 1, nationalRank: 1 },
    congestion: { avgWaiting: 6.4, avgTurnaround: 28, berthOccupancy: 82, atAnchor: 120, risk: 'Medium', peakSeason: 'Nov–Jan' },
    operations: { hours: '24/7', customsHours: '24/7', clearanceTime: '3–6 hours' },
    psc: { mou: 'Tokyo MOU', active: true, totalInsp: 4200, detentions: 252, detRate: 6.0, totalDef: 11760, avgDef: 2.8, inspectors: 65 },
    regulatory: { customsOffice: true, ftz: true, cabotage: 'Chinese cabotage', immigration: 'Chinese visa required', healthAuth: true, preArrivalDocs: ['NOA 24h', 'CIQ Declaration', 'Crew List', 'Cargo Manifest'], ispsLevel: 1 },
    tariffs: { currency: 'CNY', portDue: 'Per GT', freshwater: 'CNY 18/MT', overtime: true },
  },
  {
    id: 4, name: 'Antwerp', fullName: 'Port of Antwerp-Bruges', unlocode: 'BEANR', wpi: '54890',
    country: 'Belgium', region: 'Flanders', type: 'Commercial', mou: 'Paris MOU',
    lat: 51.2213, lon: 4.4051, timezone: 'CET', utcOffset: 1,
    status: 'Active', authority: 'Port of Antwerp-Bruges', authorityType: 'Port Authority',
    established: 1500, coastline: 'Scheldt Estuary / North Sea',
    ecaZone: true, secaZone: true,
    functions: ['Container', 'Bulk', 'Tanker', 'RoRo', 'Chemical'],
    contact: { phone: '+32 3 205 2011', email: 'info@portofantwerpbruges.com', website: 'www.portofantwerpbruges.com' },
    vhf: { working: 74, pilot: 68 },
    harbour: { totalArea: 12000, tideRange: 5.1, tideType: 'Semi-diurnal', maxCurrent: 2.0, salinity: 'Brackish', bottomType: 'Sand/Mud', shelter: 'Very Good' },
    channel: { maxDraft: 16.0, maxLoa: 400, maxBeam: 64, nightEntry: false, tidalRestrict: 'Draft-dependent tidal window', depthMLWS: 14.5, dredgedDepth: 16.0 },
    berths: { count: 820, maxLoa: 400, maxDraft: 16, totalLength: 72000, types: ['Container', 'Bulk', 'Tanker', 'Chemical', 'RoRo'] },
    anchorage: { spots: 45, maxDraft: 15, avgWaiting: 1.2 },
    terminals: {
      container: { exists: true, operator: 'PSA / DP World / MSC PSA', capacity: '14M TEU/yr', berths: 18, cranes: 80, area: 380, maxLoa: 400, maxDraft: 16 },
      bulk: { exists: true, operator: 'Various', types: ['Coal', 'Grain', 'Steel', 'Fertilizers'], capacity: '60M MT/yr' },
      tanker: { exists: true, operator: 'VOPAK / Oiltanking', types: ['Crude', 'Products', 'Chemical', 'LPG'], capacity: '80M MT/yr', storage: '12M m³', slop: true },
      roro: { exists: true, operator: 'Grimaldi / Baltic RoRo', ramps: 16 },
    },
    equipment: { mobileCranes: 120, maxCraneSWL: 900, forklifts: true, reachStackers: true, heavyLift: true, heavyLiftSWL: 900, hazmat: true },
    services: { pilotage: true, pilotageCompulsory: true, towage: true, tugs: 22, tugMaxBP: 90, freshwater: true, provisions: true, medical: true, garbage: true, waste: true },
    bunker: { available: true, hfo: true, vlsfo: true, mdo: true, mgo: true, lng: true, rate: 600, barge: true, pipe: true },
    repair: { drydock: true, drydockCount: 6, drydockMaxLoa: 380, workshops: true, spares: 'Good', diving: true },
    navAids: { lighthouse: true, lightBuoys: true, vts: true, vtsRange: 35, aisBase: true, radar: true, tideGauge: true },
    restrictions: { maxLoa: 400, maxDraft: 16.0, tidalWindow: 'Draft >14.5m: tidal window required', daylightOnly: false, closed: false },
    envRestrictions: { ecaMember: true, secaMember: true, nox: 'Tier III', so2Limit: 0.1, coldIroning: true, ballast: 'D-2 required' },
    traffic: { year: 2023, totalCalls: 21800, totalCargo: '287M MT', teu: '13.8M TEU', worldRank: 14, nationalRank: 1 },
    congestion: { avgWaiting: 5.8, avgTurnaround: 26, berthOccupancy: 74, atAnchor: 18, risk: 'Low', peakSeason: 'Oct–Dec' },
    operations: { hours: '24/7', customsHours: '24/7', clearanceTime: '2–4 hours' },
    psc: { mou: 'Paris MOU', authName: 'Belgian Coast Guard', active: true, totalInsp: 1240, detentions: 62, detRate: 5.0, totalDef: 2976, avgDef: 2.4 },
    regulatory: { customsOffice: true, ftz: false, cabotage: 'EU regulations', immigration: 'Schengen', healthAuth: true, preArrivalDocs: ['NOA 24h', 'DPG', 'Crew List'], ispsLevel: 1 },
    tariffs: { currency: 'EUR', portDue: 'Per GT', freshwater: 'EUR 3.20/MT', overtime: true },
  },
  {
    id: 5, name: 'Fujairah', fullName: 'Port of Fujairah', unlocode: 'AEFJR', wpi: '48530',
    country: 'United Arab Emirates', region: 'Fujairah Emirate', type: 'Commercial', mou: 'Indian Ocean MOU',
    lat: 25.1288, lon: 56.3383, timezone: 'GST', utcOffset: 4,
    status: 'Active', authority: 'Fujairah Port Authority', authorityType: 'Government Authority',
    established: 1983, coastline: 'Gulf of Oman / Indian Ocean',
    ecaZone: false, secaZone: false,
    functions: ['Tanker', 'Bunkering Hub', 'Container', 'General Cargo'],
    contact: { phone: '+971 9 222 8800', email: 'info@fujairahport.ae', website: 'www.fujairahport.ae' },
    vhf: { working: 16, pilot: 12 },
    harbour: { tideRange: 0.8, tideType: 'Mixed', maxCurrent: 0.5, salinity: 'Saltwater', bottomType: 'Sand', shelter: 'Good' },
    channel: { maxDraft: 18, maxLoa: 380, maxBeam: 60, nightEntry: true, depthMLWS: 18 },
    berths: { count: 32, maxLoa: 380, maxDraft: 18, totalLength: 6800, types: ['Tanker', 'Container', 'General Cargo', 'Bulk'] },
    anchorage: { spots: 120, maxDraft: 18, maxLoa: 380, holdingGround: 'Good', avgWaiting: 1.5 },
    terminals: {
      container: { exists: true, operator: 'ICTSI', capacity: '800K TEU/yr', berths: 4, cranes: 10, maxLoa: 350, maxDraft: 14 },
      tanker: { exists: true, operator: 'VOPAK / Emirates National Oil', types: ['Crude', 'Products', 'LNG', 'LPG'], capacity: '80M MT/yr', storage: '12M m³', arms: 24, maxDwt: '500,000 MT', maxDraft: 18 },
    },
    equipment: { mobileCranes: 20, maxCraneSWL: 300, heavyLift: true, hazmat: true },
    services: { pilotage: true, pilotageCompulsory: false, towage: true, tugs: 12, tugMaxBP: 80, freshwater: true, provisions: true, medical: true, garbage: true },
    bunker: { available: true, hfo: true, vlsfo: true, mdo: true, mgo: true, lng: false, rate: 1200, barge: true, truck: true },
    repair: { drydock: false, workshops: true, spares: 'Limited', diving: true },
    navAids: { lighthouse: true, lightBuoys: true, vts: true, aisBase: true, radar: true },
    restrictions: { maxLoa: 380, maxDraft: 18, daylightOnly: false, closed: false },
    envRestrictions: { ecaMember: false, so2Limit: 0.5, coldIroning: false },
    traffic: { year: 2023, totalCalls: 8200, totalCargo: '120M MT', liquidBulk: '100M MT', worldRank: 35, nationalRank: 2 },
    congestion: { avgWaiting: 8.2, avgTurnaround: 16, berthOccupancy: 65, atAnchor: 45, risk: 'Medium', peakSeason: 'Nov–Feb' },
    operations: { hours: '24/7', customsHours: '24/7', clearanceTime: '4–8 hours' },
    psc: { mou: 'Indian Ocean MOU', authName: 'UAE Maritime Administration', active: true, totalInsp: 380, detentions: 22, detRate: 5.8, totalDef: 1140, avgDef: 3.0 },
    regulatory: { customsOffice: true, ftz: true, cabotage: 'UAE regulations', immigration: 'UAE visa', healthAuth: true, ispsLevel: 1 },
    tariffs: { currency: 'USD', portDue: 'Per GT', freshwater: 'USD 4.50/MT', overtime: false },
  },
]

const PORT_FILTER_FIELDS = [
  // Identity & Location
  { id: 'mou',        label: 'PSC MOU',              filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.mou).filter(Boolean))].map(v => ({ value: v, label: v, count: ps.filter(p => p.mou === v).length })) },
  { id: 'type',       label: 'Port Type',            filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.type))].map(v => ({ value: v, label: v, count: ps.filter(p => p.type === v).length })) },
  { id: 'country',    label: 'Country',              filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.country))].map(v => ({ value: v, label: v, count: ps.filter(p => p.country === v).length })) },
  { id: 'status',     label: 'Status',               filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.status))].map(v => ({ value: v, label: v, count: ps.filter(p => p.status === v).length })) },
  { id: 'functions',  label: 'Port Functions',       filterType: 'multiselect', getValues: ps => { const all = [...new Set(ps.flatMap(p => p.functions||[]))]; return all.map(v => ({ value: v, label: v, count: ps.filter(p => (p.functions||[]).includes(v)).length })) } },
  // Physical / Navigation
  { id: 'maxDraft',   label: 'Max Draft (m)',        filterType: 'range' },
  { id: 'maxLoa',     label: 'Max LOA (m)',          filterType: 'range' },
  { id: 'maxBeam',    label: 'Max Beam (m)',         filterType: 'range' },
  { id: 'berthCount', label: 'No. of Berths',        filterType: 'range' },
  { id: 'ecaZone',    label: 'ECA Zone',             filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'ECA Zone', count: 0 }, { value: 'No', label: 'Non-ECA', count: 0 }] },
  // Traffic & Operations
  { id: 'calls',      label: 'Annual Calls',         filterType: 'range' },
  { id: 'congestion', label: 'Congestion Risk',      filterType: 'multiselect', getValues: ps => [...new Set(ps.map(p => p.congestion?.risk).filter(Boolean))].map(v => ({ value: v, label: v, count: ps.filter(p => p.congestion?.risk === v).length })) },
  { id: 'avgWaiting', label: 'Avg Waiting (hrs)',    filterType: 'range' },
  // Terminals & Services
  { id: 'container',  label: 'Container Terminal',   filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Has Container Terminal', count: 0 }, { value: 'No', label: 'No Container Terminal', count: 0 }] },
  { id: 'drydock',    label: 'Drydock Available',    filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Has Drydock', count: 0 }, { value: 'No', label: 'No Drydock', count: 0 }] },
  { id: 'pilotage',   label: 'Pilotage Compulsory',  filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Compulsory', count: 0 }, { value: 'No', label: 'Not Compulsory', count: 0 }] },
  { id: 'vts',        label: 'VTS Available',        filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'VTS Available', count: 0 }, { value: 'No', label: 'No VTS', count: 0 }] },
  // Bunkering
  { id: 'bunker',     label: 'Bunker Available',     filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Available', count: 0 }, { value: 'No', label: 'Not Available', count: 0 }] },
  { id: 'lngBunker',  label: 'LNG Bunkering',        filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'LNG Available', count: 0 }, { value: 'No', label: 'No LNG', count: 0 }] },
  // PSC
  { id: 'detRate',    label: 'PSC Detention Rate %', filterType: 'range' },
]

const PORT_COL_GROUPS = [
  { key: 'identity',   label: 'Identity & Location' },
  { key: 'physical',   label: 'Physical & Navigation' },
  { key: 'traffic',    label: 'Traffic & Operations' },
  { key: 'services',   label: 'Services & Facilities' },
  { key: 'psc',        label: 'PSC & Regulatory' },
]

const PORT_COLUMNS = [
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

function getPortCellValue(port, colId) {
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

// ── Filter Bar ────────────────────────────────────────────────────────────────
function PoFilterEditor({ cfg, filter, ports, onUpdate, onRemove, onClose, anchorEl }) {
  const [localVal, setLocalVal] = useState(() => {
    if (cfg.filterType === 'multiselect') return filter?.values || []
    if (cfg.filterType === 'range') return { min: filter?.min ?? '', max: filter?.max ?? '' }
    return ''
  })
  const rect = anchorEl?.getBoundingClientRect() || { bottom: 0, left: 0 }
  const pos = { top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 320) }

  const availableValues = useMemo(() =>
    cfg.filterType === 'multiselect' && cfg.getValues ? cfg.getValues(ports) : [],
  [cfg, ports])

  function toggleValue(val) {
    setLocalVal(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  function commit() {
    if (cfg.filterType === 'multiselect') {
      if (localVal.length === 0) { onRemove(); return }
      onUpdate({ fieldId: cfg.id, type: 'multiselect', values: localVal })
    } else if (cfg.filterType === 'range') {
      const min = localVal.min !== '' ? Number(localVal.min) : null
      const max = localVal.max !== '' ? Number(localVal.max) : null
      if (min == null && max == null) { onRemove(); return }
      onUpdate({ fieldId: cfg.id, type: 'range', min, max })
    }
    onClose()
  }

  return (
    <div className="fePop" style={{ top: pos.top, left: pos.left }} onMouseDown={e => e.stopPropagation()}>
      <div className="feHead">
        <span className="feTitle">{cfg.label}</span>
        <button className="feClose" onClick={onClose}>✕</button>
      </div>
      {cfg.filterType === 'multiselect' && (
        <div className="feOptList">
          {availableValues.map(opt => {
            const on = localVal.includes(opt.value)
            return (
              <label key={opt.value} className={`feOpt${on ? ' feOptOn' : ''}`} onClick={() => toggleValue(opt.value)}>
                <span className={`feChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                <span className="feOptLabel">{opt.label}</span>
                <span className="feOptCount">{opt.count}</span>
              </label>
            )
          })}
        </div>
      )}
      {cfg.filterType === 'range' && (
        <div className="feRangePair">
          <div className="feRangeField">
            <div className="feRangeLabel">From</div>
            <input className="feRangeInp" type="number" placeholder="Min" value={localVal.min} onChange={e => setLocalVal(p => ({ ...p, min: e.target.value }))} />
          </div>
          <div className="feRangeSep">—</div>
          <div className="feRangeField">
            <div className="feRangeLabel">To</div>
            <input className="feRangeInp" type="number" placeholder="Max" value={localVal.max} onChange={e => setLocalVal(p => ({ ...p, max: e.target.value }))} />
          </div>
        </div>
      )}
      <div className="feFoot">
        <button className="btn btnS btnSm" onClick={() => { onRemove(); onClose() }}>Remove</button>
        <button className="btn btnP btnSm" onClick={commit}>Apply</button>
      </div>
    </div>
  )
}

function PoFilterBar({ filters, onChange, ports }) {
  const [showAdd, setShowAdd]       = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [editAnchor, setEditAnchor] = useState(null)
  const addRef = useRef(null)

  const activeIds = filters.map(f => f.fieldId)

  function addFilter(fieldId) {
    const cfg = PORT_FILTER_FIELDS.find(f => f.id === fieldId)
    if (!cfg) return
    setShowAdd(false)
    if (!filters.find(f => f.fieldId === fieldId)) {
      onChange([...filters, { fieldId, type: cfg.filterType, values: [], min: null, max: null }])
    }
    setEditingId(fieldId)
    setEditAnchor(addRef.current)
  }

  function removeFilter(fieldId) {
    onChange(filters.filter(f => f.fieldId !== fieldId))
    if (editingId === fieldId) setEditingId(null)
  }

  function updateFilter(updated) {
    onChange(filters.map(f => f.fieldId === updated.fieldId ? updated : f))
  }

  function describeFilter(f) {
    const cfg = PORT_FILTER_FIELDS.find(c => c.id === f.fieldId)
    if (!cfg) return f.fieldId
    if (f.type === 'multiselect') return `${cfg.label}: ${f.values.join(', ')}`
    if (f.type === 'range') {
      const parts = []
      if (f.min != null) parts.push(`≥${f.min}`)
      if (f.max != null) parts.push(`≤${f.max}`)
      return `${cfg.label}: ${parts.join(' ')}`
    }
    return cfg.label
  }

  const hasActive = filters.some(f =>
    !(f.type === 'multiselect' && (!f.values || !f.values.length)) &&
    !(f.type === 'range' && f.min == null && f.max == null)
  )

  const editingCfg    = editingId ? PORT_FILTER_FIELDS.find(f => f.id === editingId) : null
  const editingFilter = editingId ? filters.find(f => f.fieldId === editingId) : null

  return (
    <div className="fbBar">
      {filters.map(f => {
        const isEmpty = (f.type === 'multiselect' && (!f.values || !f.values.length)) ||
                        (f.type === 'range' && f.min == null && f.max == null)
        if (isEmpty) return null
        return (
          <div key={f.fieldId} className={`fbChip${editingId === f.fieldId ? ' fbChipActive' : ''}`}>
            <button className="fbChipLabel" onClick={e => { setEditingId(f.fieldId); setEditAnchor(e.currentTarget) }}>
              {describeFilter(f)}
            </button>
            <button className="fbChipRemove" onClick={() => removeFilter(f.fieldId)}>✕</button>
          </div>
        )
      })}
      <button ref={addRef} className="fbAddBtn" onClick={() => setShowAdd(v => !v)}>+ Add Filter</button>
      {hasActive && <button className="fbClearAll" onClick={() => onChange([])}>Clear all</button>}

      {showAdd && (
        <div className="fePop" style={{ top: (addRef.current?.getBoundingClientRect().bottom || 0) + 8, left: (addRef.current?.getBoundingClientRect().left || 0) }}>
          <div className="feHead">
            <span className="feTitle">Add Filter</span>
            <button className="feClose" onClick={() => setShowAdd(false)}>✕</button>
          </div>
          <div className="feOptList">
            {PORT_FILTER_FIELDS.filter(f => !activeIds.includes(f.id)).map(f => (
              <button key={f.id} className="ftLeaf" style={{ paddingLeft: 10 }} onClick={() => addFilter(f.id)}>
                <span className="ftLeafLabel">{f.label}</span>
                <span className="ftLeafType">{f.filterType}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingCfg && editingFilter && (
        <PoFilterEditor
          cfg={editingCfg} filter={editingFilter} ports={ports}
          anchorEl={editAnchor}
          onUpdate={updateFilter}
          onRemove={() => removeFilter(editingId)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}

// ── Column Picker ─────────────────────────────────────────────────────────────
function PoColumnPicker({ visible, onClose, selected, onChange }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(PORT_COL_GROUPS.map(g => g.key)))

  if (!visible) return null

  const optCols = PORT_COLUMNS.filter(c => !c.always)
  const alwaysCols = PORT_COLUMNS.filter(c => c.always)
  const visibleCols = PORT_COLUMNS.filter(c => c.always || selected.includes(c.id))

  const searchMatches = search.trim()
    ? optCols.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : null

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  function toggleGroup(key) {
    setExpanded(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  return (
    <div className="cpModalOverlay" onMouseDown={onClose}>
      <div className="cpModal" onMouseDown={e => e.stopPropagation()}>
        <div className="cpModalHead">
          <div>
            <div className="cpModalTitle">Column Configuration</div>
            <div className="cpModalSub">
              {selected.length} columns selected · Always visible: {alwaysCols.map(c => c.label).join(', ')}
            </div>
          </div>
          <button className="cpModalClose" onClick={onClose}>✕</button>
        </div>

        <div className="cpModalBody">
          <div className="cpLeft">
            <div className="cpLeftHead">
              <div className="cpSectionTitle">Available Columns</div>
              <div className="cpTreeSearch">
                <span className="cpTreeSearchIcon">⌕</span>
                <input autoFocus className="cpTreeSearchInp" placeholder="Search columns…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="cpTreeSearchClear" onClick={() => setSearch('')}>✕</button>}
              </div>
            </div>
            <div className="cpLeftList">
              {searchMatches ? (
                searchMatches.length > 0 ? searchMatches.map(col => {
                  const on = selected.includes(col.id)
                  const grp = PORT_COL_GROUPS.find(g => g.key === col.group)
                  return (
                    <button key={col.id} className={`cpTreeResult${on ? ' cpTreeResultOn' : ''}`} onClick={() => toggle(col.id)}>
                      <div className="cpTreeResultMeta">
                        <div className="cpTreeResultPath">{grp?.label || ''}</div>
                        <div className="cpTreeResultLabel">{col.label}</div>
                      </div>
                      <span className={`cpTreeChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                    </button>
                  )
                }) : <div style={{padding:'16px',textAlign:'center',color:'var(--txt3)',fontSize:12}}>No columns found</div>
              ) : (
                <div className="cpTree">
                  {PORT_COL_GROUPS.map(g => {
                    const cols = optCols.filter(c => c.group === g.key)
                    if (!cols.length) return null
                    const isOpen = expanded.has(g.key)
                    const selInGrp = cols.filter(c => selected.includes(c.id)).length
                    return (
                      <div key={g.key} className="cpGroup">
                        <button className={`cpTreeBranch${isOpen ? ' cpTreeOpen' : ''}`} onClick={() => toggleGroup(g.key)}>
                          <span className="cpTreeArrow">{isOpen ? '▾' : '▸'}</span>
                          <span className="cpTreeBranchLabel">{g.label}</span>
                          {selInGrp > 0
                            ? <span className="cpTreeBadge">{selInGrp}/{cols.length}</span>
                            : <span className="cpTreeCount">{cols.length}</span>
                          }
                        </button>
                        {isOpen && (
                          <div className="cpTreeChildren">
                            {cols.map(col => {
                              const on = selected.includes(col.id)
                              return (
                                <button key={col.id} className={`cpTreeLeaf${on ? ' cpTreeLeafOn' : ''}`} onClick={() => toggle(col.id)}>
                                  <span className={`cpTreeChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                                  <span className="cpTreeLeafLabel">{col.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="cpRight">
            <div className="cpRightHead">
              <div className="cpSectionTitle">Visible Columns ({visibleCols.length})</div>
              <div className="cpRightSub">Click a column to toggle · Fixed columns always shown</div>
            </div>
            <div className="cpRightList">
              {visibleCols.map(col => (
                <div key={col.id} className={`cpVisRow${col.always ? ' cpVisFixed' : ''}`}>
                  {col.always ? <span className="cpVisLock">🔒</span> : <span className="cpVisHandle">⠿</span>}
                  <span className="cpVisLabel">{col.label}</span>
                  <span className="cpVisGroup">{PORT_COL_GROUPS.find(g => g.key === col.group)?.label || ''}</span>
                  {!col.always && <button className="cpVisRemove" onClick={() => toggle(col.id)} title="Remove">✕</button>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cpModalFoot">
          <button className="btn btnS btnSm" onClick={() => onChange([])}>Clear All</button>
          <div style={{flex:1}}/>
          <button className="btn btnS btnSm" onClick={onClose}>Cancel</button>
          <button className="btn btnP btnSm" onClick={onClose}>Done ({visibleCols.length} columns)</button>
        </div>
      </div>
    </div>
  )
}

// ── Map Component ─────────────────────────────────────────────────────────────
function PortMap({ ports, selectedId, onSelectPort }) {
  const mapRef    = useRef(null)
  const leafletRef = useRef(null)
  const markersRef = useRef({})

  useEffect(() => {
    if (leafletRef.current) return
    leafletRef.current = L.map(mapRef.current, { center: [20, 0], zoom: 2, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18
    }).addTo(leafletRef.current)
  }, [])

  useEffect(() => {
    if (!leafletRef.current) return
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    ports.forEach(p => {
      const m = L.circleMarker([p.lat, p.lon], {
        radius: 7, color: selectedId === p.id ? '#c8102e' : '#1558d6',
        fillColor: selectedId === p.id ? '#c8102e' : '#4f8ef7', fillOpacity: 0.85, weight: 2,
      }).bindPopup(`<b>${p.name}</b><br>${p.unlocode} · ${p.country}`)
        .on('click', () => onSelectPort(p.id))
        .addTo(leafletRef.current)
      markersRef.current[p.id] = m
    })
  }, [ports, selectedId, onSelectPort])

  return <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Ports() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search,        setSearch]        = useState('')
  const [filters,       setFilters]       = useState([])
  const [selColumns,    setSelColumns]    = useState(['country', 'type', 'mou', 'maxDraft', 'totalCalls'])
  const [showColPicker, setShowColPicker] = useState(false)
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [ports]                           = useState(INIT_PORTS)
  const [sortKey,       setSortKey]       = useState('name')
  const [sortDir,       setSortDir]       = useState('asc')
  const [listTab,       setListTab]       = useState('table')
  const [activeNode,    setActiveNode]    = useState('po-identity')
  const [selLeafId,     setSelLeafId]     = useState(null)
  const [selLeafLabel,  setSelLeafLabel]  = useState(null)
  const [editMode,      setEditMode]      = useState(false)
  const [detailTab,     setDetailTab]     = useState('attrs')
  const [histPanelW,    setHistPanelW]    = useState(320)
  const [histCollapsed, setHistCollapsed] = useState(false)
  const histWidthRef = useRef(320)

  function startHistResize(e) {
    e.preventDefault()
    const startX = e.clientX, startW = histWidthRef.current
    function onMove(ev) {
      const w = Math.max(240, Math.min(600, startW - (ev.clientX - startX)))
      histWidthRef.current = w; setHistPanelW(w)
    }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.classList.remove('ew-resizing') }
    document.body.classList.add('ew-resizing')
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const detailId = searchParams.get('id')
  const port     = detailId ? ports.find(p => String(p.id) === detailId) || null : null

  const filtered = useMemo(() => {
    let list = ports
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.unlocode.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) || p.mou?.toLowerCase().includes(q)
      )
    }
    for (const f of filters) {
      if (f.type === 'multiselect' && f.values?.length) {
        if (f.fieldId === 'mou')       list = list.filter(p => f.values.includes(p.mou))
        if (f.fieldId === 'type')      list = list.filter(p => f.values.includes(p.type))
        if (f.fieldId === 'country')   list = list.filter(p => f.values.includes(p.country))
        if (f.fieldId === 'status')    list = list.filter(p => f.values.includes(p.status))
        if (f.fieldId === 'functions') list = list.filter(p => f.values.some(v => (p.functions||[]).includes(v)))
        if (f.fieldId === 'ecaZone')   list = list.filter(p => f.values.includes(p.ecaZone ? 'Yes' : 'No'))
        if (f.fieldId === 'container') list = list.filter(p => f.values.includes(p.terminals?.container?.exists ? 'Yes' : 'No'))
        if (f.fieldId === 'drydock')   list = list.filter(p => f.values.includes(p.repair?.drydock ? 'Yes' : 'No'))
        if (f.fieldId === 'lngBunker') list = list.filter(p => f.values.includes(p.bunker?.lng ? 'Yes' : 'No'))
        if (f.fieldId === 'bunker')    list = list.filter(p => f.values.includes(p.bunker?.available ? 'Yes' : 'No'))
        if (f.fieldId === 'congestion')list = list.filter(p => f.values.includes(p.congestion?.risk))
        if (f.fieldId === 'pilotage')  list = list.filter(p => f.values.includes(p.services?.pilotageCompulsory ? 'Yes' : 'No'))
        if (f.fieldId === 'vts')       list = list.filter(p => f.values.includes(p.navAids?.vts ? 'Yes' : 'No'))
      }
      if (f.type === 'range') {
        if (f.fieldId === 'calls')      { if (f.min != null) list = list.filter(p => (p.traffic?.totalCalls||0) >= f.min); if (f.max != null) list = list.filter(p => (p.traffic?.totalCalls||0) <= f.max) }
        if (f.fieldId === 'maxDraft')   { if (f.min != null) list = list.filter(p => (p.channel?.maxDraft||0) >= f.min); if (f.max != null) list = list.filter(p => (p.channel?.maxDraft||0) <= f.max) }
        if (f.fieldId === 'maxLoa')     { if (f.min != null) list = list.filter(p => (p.channel?.maxLoa||0) >= f.min); if (f.max != null) list = list.filter(p => (p.channel?.maxLoa||0) <= f.max) }
        if (f.fieldId === 'maxBeam')    { if (f.min != null) list = list.filter(p => (p.channel?.maxBeam||0) >= f.min); if (f.max != null) list = list.filter(p => (p.channel?.maxBeam||0) <= f.max) }
        if (f.fieldId === 'berthCount') { if (f.min != null) list = list.filter(p => (p.berths?.count||0) >= f.min); if (f.max != null) list = list.filter(p => (p.berths?.count||0) <= f.max) }
        if (f.fieldId === 'detRate')    { if (f.min != null) list = list.filter(p => (p.psc?.detRate||0) >= f.min); if (f.max != null) list = list.filter(p => (p.psc?.detRate||0) <= f.max) }
        if (f.fieldId === 'avgWaiting') { if (f.min != null) list = list.filter(p => (p.congestion?.avgWaiting||0) >= f.min); if (f.max != null) list = list.filter(p => (p.congestion?.avgWaiting||0) <= f.max) }
      }
    }
    return [...list].sort((a, b) => {
      let av = a.name, bv = b.name
      if (sortKey === 'country') { av = a.country; bv = b.country }
      if (sortKey === 'rank')    { av = a.traffic?.worldRank || 9999; bv = b.traffic?.worldRank || 9999 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [ports, search, filters, sortKey, sortDir])

  const visibleCols = useMemo(() => PORT_COLUMNS.filter(c => c.always || selColumns.includes(c.id)), [selColumns])

  function openDetail(id) {
    setActiveNode('po-identity'); setSelLeafId(null); setSelLeafLabel(null); setEditMode(false); setDetailTab('attrs')
    setSearchParams({ id: String(id) })
  }
  function closeDetail() { setSearchParams({}) }

  function handleSortCol(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleSelectLeaf(leafId, leafLabel) {
    setSelLeafId(prev => prev === leafId ? null : leafId)
    setSelLeafLabel(leafLabel)
  }

  const congCls = { Low: 'tG', Medium: 'tA', High: 'tR', 'Very High': 'tR' }

  // ── Detail View ──────────────────────────────────────────────────────────
  if (port) {
    const histRows = selLeafLabel
      ? generatePortHistory(selLeafLabel, port, getPortAttrValue(port, selLeafId))
      : []

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        <div className="dHead">
          <button className="backBtn" onClick={closeDetail}>← Ports</button>
          <div className="dHeadDiv"/>
          <span className="vNm">{port.name}</span>
          <span className="vdHdrMono">{port.unlocode}</span>
          <span className="tag tN" style={{ fontSize: 9 }}>{port.type}</span>
          <span className="stBadge stA" style={{ flexShrink: 0 }}><span className="stDot"/>{port.status || 'Active'}</span>
          <div className="dHeadDiv"/>
          <span className="vdHdrKpi">Country<strong>{port.country}</strong></span>
          <span className="vdHdrKpi">Max Draft<strong>{port.channel?.maxDraft ? port.channel.maxDraft + ' m' : '—'}</strong></span>
          <span className="vdHdrKpi">Annual Calls<strong>{port.traffic?.totalCalls?.toLocaleString() ?? '—'}</strong></span>
          <span className="vdHdrKpi">MOU<strong>{port.mou}</strong></span>
          <div className="dActs">
            <button className={`btn btnSm${editMode ? ' btnP' : ' btnT'}`} onClick={() => setEditMode(e => !e)}>
              {editMode ? '✕ Cancel' : '✎ Edit'}
            </button>
            <button className="btn btnT btnSm">↗ Export</button>
          </div>
        </div>

        {editMode && <div className="eBan">⚠ Edit mode — all changes versioned in bi-temporal audit log</div>}

        <div style={{ display: 'flex', gap: 0, padding: '0 16px', background: 'var(--bg)', borderBottom: '1px solid var(--bd)' }}>
          {[['attrs', 'Attributes'], ['map', 'Map View']].map(([t, l]) => (
            <button key={t}
              style={{ padding: '6px 16px', border: 'none', borderBottom: detailTab === t ? '2px solid var(--sp-red)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: detailTab === t ? 600 : 400, color: detailTab === t ? 'var(--sp-red)' : 'var(--txt2)', marginBottom: -1 }}
              onClick={() => setDetailTab(t)}>{l}</button>
          ))}
        </div>

        {detailTab === 'attrs' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <GenAttrTreeSidebar
              tree={PORT_ATTRIBUTE_TREE}
              activeNode={activeNode}
              onSelectNode={setActiveNode}
            />
            <GenAttrContentPanel
              entity={port}
              tree={PORT_ATTRIBUTE_TREE}
              getVal={getPortAttrValue}
              activeNode={activeNode}
              editMode={editMode}
              selLeafId={selLeafId}
              onSelectLeaf={handleSelectLeaf}
            />
            {selLeafId && (
              <div style={{ display: 'flex', flexShrink: 0, position: 'relative' }}>
                {!histCollapsed && (
                  <div style={{ width: histPanelW, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--bd)', overflow: 'hidden' }}>
                    <FieldEditPanel
                      vessel={port}
                      leaf={{ id: selLeafId, label: selLeafLabel }}
                      editMode={editMode}
                      curDate={null}
                      histRows={histRows}
                      onClose={() => { setSelLeafId(null); setSelLeafLabel(null) }}
                      onJumpDate={() => {}}
                    />
                  </div>
                )}
                <div className="atSbResizeHandle" style={{ position: 'absolute', left: histCollapsed ? 0 : -4, top: 0, bottom: 0, width: 8, cursor: 'ew-resize' }} onMouseDown={startHistResize} />
                <button
                  style={{ position: 'absolute', left: histCollapsed ? 4 : -14, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 4, padding: '4px 3px', fontSize: 11, cursor: 'pointer', lineHeight: 1 }}
                  onClick={() => setHistCollapsed(c => !c)}
                >{histCollapsed ? '‹' : '›'}</button>
              </div>
            )}
          </div>
        )}

        {detailTab === 'map' && (
          <div style={{ flex: 1, position: 'relative' }}>
            <PortMap ports={[port]} selectedId={port.id} onSelectPort={() => {}} />
          </div>
        )}
      </div>
    )
  }

  // ── List View ────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>

      <div className="kpiRow" style={{padding:'10px 16px',flexShrink:0,gap:10}}>
        <div className="kpi"><div className="kpiV">{ports.length}</div><div className="kpiL">Total Ports</div></div>
        <div className="kpi"><div className="kpiV">{ports.filter(p => p.ecaZone).length}</div><div className="kpiL">ECA Zones</div></div>
        <div className="kpi"><div className="kpiV">{ports.reduce((s, p) => s + (p.traffic?.totalCalls || 0), 0).toLocaleString()}</div><div className="kpiL">Annual Calls</div></div>
        <div className="kpi"><div className="kpiV">{[...new Set(ports.map(p => p.country))].length}</div><div className="kpiL">Countries</div></div>
        <div className="kpi"><div className="kpiV">{ports.filter(p => p.bunker?.lng).length}</div><div className="kpiL">LNG Bunkering</div></div>
      </div>

      <div className="sBar">
        <div className="siWrap" style={{flex:1,minWidth:260}}>
          <span className="siIc">🔍</span>
          <input className="si" placeholder="Search ports by name, LOCODE, country, MOU…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="siClear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <button className="btn btnS btnSm" onClick={() => setSearch(search.trim())}>Search</button>
        <select className="fSel" value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="name">Sort: Name A→Z</option>
          <option value="country">Sort: Country</option>
          <option value="rank">Sort: World Rank</option>
        </select>
        <div style={{display:'flex',gap:2,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:6,padding:2}}>
          {[['table','☰ Table'],['map','⬡ Map']].map(([t,l]) => (
            <button key={t} className={`btn btnSm${listTab===t?' btnP':' btnT'}`} onClick={() => setListTab(t)} style={{padding:'4px 10px'}}>{l}</button>
          ))}
        </div>
        <button className="btn btnP btnSm">+ New Port</button>
      </div>

      <div className="fbBarWrap">
        <PoFilterBar filters={filters} onChange={setFilters} ports={ports} />
        <button className="btn btnS btnSm fbColsBtn" onClick={() => setShowColPicker(true)} title="Customise columns">⊞ Columns</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0,position:'relative'}}>
        {/* Map view — always mounted to preserve Leaflet state */}
        <div style={{display:listTab==='map'?'flex':'none',flexDirection:'column',flex:1,overflow:'hidden'}}>
          <PortMap ports={filtered} selectedId={null} onSelectPort={openDetail} />
        </div>

        {/* Table view */}
        {listTab === 'table' && (
          <>
            <div className="rBar">
              <div>Showing <strong>{filtered.length}</strong> of <strong>{ports.length}</strong> ports</div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {selectedIds.size > 0 && (
                  <>
                    <span style={{fontSize:11,color:'var(--txt2)'}}><strong>{selectedIds.size}</strong> selected</span>
                    <button className="btn btnSm" style={{background:'var(--red)',color:'#fff',border:'none',padding:'3px 10px'}}
                      onClick={() => setSelectedIds(new Set())}>
                      🗑 Delete ({selectedIds.size})
                    </button>
                    <button className="btn btnS btnSm" onClick={() => setSelectedIds(new Set())}>Deselect All</button>
                  </>
                )}
                <div style={{fontSize:10,color:'var(--txt3)'}}>{visibleCols.length} columns</div>
              </div>
            </div>
            <div className="tWrap">
              <table className="vt">
                <thead>
                  <tr>
                    <th style={{width:26}}>
                      <input type="checkbox"
                        checked={filtered.length > 0 && filtered.every(p => selectedIds.has(p.id))}
                        ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !filtered.every(p => selectedIds.has(p.id)) }}
                        onChange={() => {
                          const allSel = filtered.every(p => selectedIds.has(p.id))
                          setSelectedIds(allSel ? new Set() : new Set(filtered.map(p => p.id)))
                        }}
                      />
                    </th>
                    {visibleCols.map(c => (
                      <th key={c.id} onClick={() => handleSortCol(c.id)} style={{cursor:'pointer',userSelect:'none'}}>
                        {c.label}{sortKey===c.id?(sortDir==='asc'?' ▲':' ▼'):''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} onClick={() => openDetail(p.id)} style={{cursor:'pointer'}}>
                      <td><input type="checkbox" checked={selectedIds.has(p.id)}
                          onChange={() => setSelectedIds(prev => { const s=new Set(prev); s.has(p.id)?s.delete(p.id):s.add(p.id); return s })}
                          onClick={e => e.stopPropagation()}
                        /></td>
                      {visibleCols.map(c => {
                        const v = getPortCellValue(p, c.id)
                        if (c.id === 'name')       return <td key={c.id} style={{whiteSpace:'nowrap'}}><button className="vLnk">{v}</button></td>
                        if (c.id === 'congestion') return <td key={c.id}><span className={`tag ${congCls[v]||'tN'}`}>{v}</span></td>
                        return <td key={c.id} style={{fontSize:11}}>{v}</td>
                      })}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={visibleCols.length+1} style={{textAlign:'center',padding:32,color:'var(--txt3)'}}>No ports match the current filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <PoColumnPicker visible={showColPicker} onClose={() => setShowColPicker(false)} selected={selColumns} onChange={setSelColumns} />
    </div>
  )
}
