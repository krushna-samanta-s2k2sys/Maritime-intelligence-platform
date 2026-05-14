import companiesData from './json/companies_detail.json'

export const COMPANIES = companiesData

// ─── Attribute value getter ───────────────────────────────────────────────────

const MAP = {
  // Identity → Legal
  'co-name':           c => c.name,
  'co-shortname':      c => c.shortName || '—',
  'co-prevname':       c => c.prevName || '—',
  'co-lrnumber':       c => c.lrNumber,
  'co-lei':            c => c.lei || '—',
  'co-dunsnumber':     c => c.duns || '—',
  'co-regnum':         c => c.regNumber || '—',
  'co-vatid':          c => c.vatId || '—',
  'co-type':           c => c.type,
  'co-legalform':      c => c.legalForm || '—',
  'co-country':        c => c.country,
  'co-jurisdiction':   c => c.jurisdiction || c.country,
  'co-incorpordate':   c => c.incorporationDate || '—',
  'co-dissolutiondate':c => '—',
  'co-status':         c => c.status,
  'co-exchange':       c => c.exchange || '—',
  'co-ticker':         c => c.ticker || '—',
  'co-publicprivate':  c => c.publicPrivate || 'Private',
  'co-seccodes':       c => c.secCodes || '—',

  // Identity → Contact
  'co-regaddr':        c => c.address || '—',
  'co-regcity':        c => c.city,
  'co-regpostcode':    c => c.postcode || '—',
  'co-regcountry':     c => c.country,
  'co-opaddr':         c => c.opAddress || c.address || '—',
  'co-opcity':         c => c.opCity || c.city || '—',
  'co-phone':          c => c.phone || '—',
  'co-fax':            c => c.fax || '—',
  'co-email':          c => c.email || '—',
  'co-website':        c => c.website || '—',
  'co-telex':          c => '—',
  'co-comms':          c => c.comms || '—',

  // Identity → Roles
  'co-role-regowner':  c => c.roles?.includes('Registered Owner') ? 'Yes' : '—',
  'co-role-techman':   c => c.roles?.includes('Technical Manager') ? 'Yes' : '—',
  'co-role-shipman':   c => c.roles?.includes('Ship Manager') ? 'Yes' : '—',
  'co-role-docco':     c => c.roles?.includes('DOC Company') ? 'Yes' : '—',
  'co-role-bareboat':  c => c.roles?.includes('Bareboat Charterer') ? 'Yes' : '—',
  'co-role-charterer': c => c.roles?.includes('Charterer') ? 'Yes' : '—',
  'co-role-broker':    c => c.roles?.includes('Broker') ? 'Yes' : '—',
  'co-role-insurer':   c => c.roles?.includes('Insurer') ? 'Yes' : '—',
  'co-role-surveyor':  c => c.roles?.includes('Surveyor') ? 'Yes' : '—',
  'co-role-agent':     c => c.roles?.includes('Agent') ? 'Yes' : '—',
  'co-role-portop':    c => c.roles?.includes('Port Operator') ? 'Yes' : '—',
  'co-role-terminal':  c => c.roles?.includes('Terminal Operator') ? 'Yes' : '—',
  'co-role-sp':        c => c.roles?.includes('S&P Principal') ? 'Yes' : '—',

  // Corporate Structure → Beneficial Ownership
  'co-ubo-name':       c => c.ubo?.name || '—',
  'co-ubo-country':    c => c.ubo?.country || '—',
  'co-ubo-pct':        c => c.ubo?.pct ? c.ubo.pct + '%' : '—',
  'co-ubo-type':       c => c.ubo?.type || '—',
  'co-ubo-dob':        c => c.ubo?.dob || '—',
  'co-ubo-nationality':c => c.ubo?.nationality || '—',
  'co-ubo2-name':      c => c.ubo2?.name || '—',
  'co-ubo2-pct':       c => c.ubo2?.pct ? c.ubo2.pct + '%' : '—',
  'co-ubo2-country':   c => c.ubo2?.country || '—',
  'co-ownstructure':   c => c.ownershipStructure || '—',
  'co-ownchangedate':  c => c.ownershipChangeDate || '—',
  'co-ownconfidence':  c => c.ownershipConfidence || '—',

  // Corporate Structure → Parent
  'co-parent-name':    c => c.parent?.name || '—',
  'co-parent-country': c => c.parent?.country || '—',
  'co-parent-pct':     c => c.parent?.pct ? c.parent.pct + '%' : '—',
  'co-parent-lrnum':   c => c.parent?.lrNumber || '—',
  'co-parent-lei':     c => c.parent?.lei || '—',
  'co-group-name':     c => c.group?.name || '—',
  'co-group-hq':       c => c.group?.hq || '—',
  'co-holding-name':   c => c.holding?.name || '—',
  'co-holding-country':c => c.holding?.country || '—',
  'co-holding-pct':    c => c.holding?.pct ? c.holding.pct + '%' : '—',

  // Corporate Structure → Subsidiaries
  'co-sub-count':      c => c.subsidiaries?.length ? String(c.subsidiaries.length) : '—',
  'co-sub-names':      c => c.subsidiaries?.map(s => s.name).join(', ') || '—',
  'co-sub-countries':  c => c.subsidiaries?.map(s => s.country).join(', ') || '—',
  'co-affiliate-names':c => c.affiliates?.join(', ') || '—',
  'co-jv-partners':    c => c.jvPartners?.join(', ') || '—',
  'co-jv-pct':         c => '—',

  // Key Personnel
  'co-ceo':            c => c.personnel?.ceo || '—',
  'co-coo':            c => c.personnel?.coo || '—',
  'co-cfo':            c => c.personnel?.cfo || '—',
  'co-cto':            c => c.personnel?.cto || '—',
  'co-chairman':       c => c.personnel?.chairman || '—',
  'co-md':             c => c.personnel?.md || c.personnel?.ceo || '—',
  'co-fleetdirector':  c => c.personnel?.fleetDirector || '—',
  'co-dpa':            c => c.personnel?.dpa || '—',
  'co-legalcontact':   c => c.personnel?.legal || '—',
  'co-complianceofficer': c => c.personnel?.compliance || '—',
  'co-employees':      c => c.employees ? String(c.employees) : '—',
  'co-foundedyear':    c => c.foundedYear ? String(c.foundedYear) : '—',

  // Fleet Overview
  'co-fleet-total':    c => c.fleet?.total ? String(c.fleet.total) : '—',
  'co-fleet-owned':    c => c.fleet?.owned ? String(c.fleet.owned) : '—',
  'co-fleet-managed':  c => c.fleet?.managed ? String(c.fleet.managed) : '—',
  'co-fleet-avgdwt':   c => c.fleet?.avgDwt || '—',
  'co-fleet-totaldwt': c => c.fleet?.totalDwt || '—',
  'co-fleet-avgage':   c => c.fleet?.avgage ? c.fleet.avgage + ' yrs' : '—',
  'co-fleet-newbuild': c => c.fleet?.newbuildOrders ? String(c.fleet.newbuildOrders) : '—',
  'co-fleet-scrapped': c => c.fleet?.scrapped ? String(c.fleet.scrapped) : '—',
  'co-fleet-sold':     c => c.fleet?.sold ? String(c.fleet.sold) : '—',
  'co-fleet-acquired': c => c.fleet?.acquired ? String(c.fleet.acquired) : '—',

  // Fleet by Type
  'co-fl-bulkers':     c => c.fleetByType?.bulkers ? String(c.fleetByType.bulkers) : '—',
  'co-fl-tankers':     c => c.fleetByType?.tankers ? String(c.fleetByType.tankers) : '—',
  'co-fl-containers':  c => c.fleetByType?.containers ? String(c.fleetByType.containers) : '—',
  'co-fl-lng':         c => c.fleetByType?.lng ? String(c.fleetByType.lng) : '—',
  'co-fl-lpg':         c => c.fleetByType?.lpg ? String(c.fleetByType.lpg) : '—',
  'co-fl-chemical':    c => c.fleetByType?.chemical ? String(c.fleetByType.chemical) : '—',
  'co-fl-general':     c => c.fleetByType?.general ? String(c.fleetByType.general) : '—',
  'co-fl-roro':        c => c.fleetByType?.roro ? String(c.fleetByType.roro) : '—',
  'co-fl-cruise':      c => c.fleetByType?.cruise ? String(c.fleetByType.cruise) : '—',
  'co-fl-offshore':    c => c.fleetByType?.offshore ? String(c.fleetByType.offshore) : '—',
  'co-fl-other':       c => c.fleetByType?.other ? String(c.fleetByType.other) : '—',

  // ISM & DOC
  'co-doc-number':     c => c.doc?.number || '—',
  'co-doc-issdate':    c => c.doc?.issDate || '—',
  'co-doc-expdate':    c => c.doc?.expDate || '—',
  'co-doc-issauth':    c => c.doc?.issAuth || '—',
  'co-doc-shiptypes':  c => c.doc?.shipTypes?.join(', ') || '—',
  'co-ism-auditor':    c => c.ism?.auditor || '—',
  'co-ism-lastaudit':  c => c.ism?.lastAudit || '—',
  'co-ism-nextaudit':  c => c.ism?.nextAudit || '—',
  'co-ism-nc':         c => c.ism?.openNC !== undefined ? String(c.ism.openNC) : '—',
  'co-ism-obs':        c => c.ism?.openObs !== undefined ? String(c.ism.openObs) : '—',
  'co-dpa-name':       c => c.dpa?.name || '—',
  'co-dpa-phone':      c => c.dpa?.phone || '—',
  'co-dpa-email':      c => c.dpa?.email || '—',
  'co-emergency':      c => c.emergency || '—',

  // PSC Performance
  'co-psc-totalinsp':  c => c.psc?.totalInsp ? String(c.psc.totalInsp) : '—',
  'co-psc-detentions': c => c.psc?.detentions ? String(c.psc.detentions) : '—',
  'co-psc-detrate':    c => c.psc?.detRate || '—',
  'co-psc-deficiencies':c=> c.psc?.deficiencies ? String(c.psc.deficiencies) : '—',
  'co-psc-defrate':    c => c.psc?.defRate ? c.psc.defRate.toFixed(1) : '—',
  'co-psc-lastinsp':   c => c.psc?.lastInsp || '—',
  'co-psc-lastport':   c => c.psc?.lastPort || '—',
  'co-psc-lastresult': c => c.psc?.lastResult || '—',
  'co-psc-risk':       c => c.psc?.risk || '—',
  'co-psc-blacklisted':c => c.psc?.blacklisted ? 'Yes' : 'No',
  'co-psc-def-fire':   c => c.psc?.defFire ? String(c.psc.defFire) : '—',
  'co-psc-def-lsa':    c => c.psc?.defLSA ? String(c.psc.defLSA) : '—',
  'co-psc-def-ism':    c => c.psc?.defISM ? String(c.psc.defISM) : '—',
  'co-psc-def-nav':    c => c.psc?.defNav ? String(c.psc.defNav) : '—',
  'co-psc-def-poll':   c => c.psc?.defPoll ? String(c.psc.defPoll) : '—',
  'co-psc-def-marpol': c => c.psc?.defMARPOL ? String(c.psc.defMARPOL) : '—',
  'co-psc-def-crew':   c => c.psc?.defCrew ? String(c.psc.defCrew) : '—',
  'co-psc-def-stcw':   c => c.psc?.defSTCW ? String(c.psc.defSTCW) : '—',
  'co-psc-def-cert':   c => c.psc?.defCert ? String(c.psc.defCert) : '—',
  'co-psc-def-hull':   c => c.psc?.defHull ? String(c.psc.defHull) : '—',

  // Financial Overview
  'co-fin-revenue':    c => c.financial?.revenue || '—',
  'co-fin-revyear':    c => c.financial?.revYear ? String(c.financial.revYear) : '—',
  'co-fin-ebitda':     c => c.financial?.ebitda || '—',
  'co-fin-netincome':  c => c.financial?.netIncome || '—',
  'co-fin-assets':     c => c.financial?.assets || '—',
  'co-fin-liabilities':c => c.financial?.liabilities || '—',
  'co-fin-equity':     c => c.financial?.equity || '—',
  'co-fin-marketcap':  c => c.financial?.marketCap || '—',
  'co-fin-currency':   c => c.financial?.currency || 'USD',
  'co-fin-fiscalyear': c => c.financial?.fiscalYearEnd || '—',
  'co-fin-auditor':    c => c.financial?.auditor || '—',
  'co-fin-bank':       c => c.financial?.bank || '—',

  // Credit
  'co-credit-moodys':  c => c.credit?.moodys || '—',
  'co-credit-sp':      c => c.credit?.sp || '—',
  'co-credit-fitch':   c => c.credit?.fitch || '—',
  'co-credit-dnb':     c => c.credit?.dnb || '—',
  'co-credit-outlook': c => c.credit?.outlook || '—',
  'co-credit-score':   c => c.credit?.score || '—',
  'co-credit-limit':   c => c.credit?.limit || '—',
  'co-credit-payrisk': c => c.credit?.payRisk || '—',
  'co-credit-payday':  c => c.credit?.payDays ? c.credit.payDays + ' days' : '—',

  // Sanctions
  'co-sanc-ofac':      c => c.sanctions?.ofac ? 'Yes' : 'No',
  'co-sanc-un':        c => c.sanctions?.un ? 'Yes' : 'No',
  'co-sanc-eu':        c => c.sanctions?.eu ? 'Yes' : 'No',
  'co-sanc-uk':        c => c.sanctions?.uk ? 'Yes' : 'No',
  'co-sanc-australia': c => c.sanctions?.australia ? 'Yes' : 'No',
  'co-sanc-japan':     c => c.sanctions?.japan ? 'Yes' : 'No',
  'co-sanc-canada':    c => c.sanctions?.canada ? 'Yes' : 'No',
  'co-sanc-lastscreened': c => c.sanctions?.lastScreened || '—',
  'co-sanc-risk':      c => c.sanctions?.risk || 'Low',

  // KYC
  'co-kyc-status':     c => c.kyc?.status || '—',
  'co-kyc-date':       c => c.kyc?.date || '—',
  'co-kyc-tier':       c => c.kyc?.tier || '—',
  'co-kyc-reviewer':   c => c.kyc?.reviewer || '—',
  'co-pep-exposure':   c => c.kyc?.pepExposure ? 'Yes' : 'No',
  'co-pep-name':       c => c.kyc?.pepName || '—',
  'co-aml-risk':       c => c.kyc?.amlRisk || 'Low',
  'co-adverse-media':  c => c.kyc?.adverseMedia ? 'Yes' : 'No',
  'co-adverse-notes':  c => c.kyc?.adverseNotes || '—',
  'co-court-cases':    c => c.kyc?.courtCases ? String(c.kyc.courtCases) : '—',
  'co-court-notes':    c => c.kyc?.courtNotes || '—',

  // ESG
  'co-esg-poseidon':   c => c.esg?.poseidon ? 'Yes' : 'No',
  'co-esg-eexi-avg':   c => c.esg?.eexiAvg || '—',
  'co-esg-cii-avg':    c => c.esg?.ciiAvg || '—',
  'co-esg-ghg-target': c => c.esg?.ghgTarget || '—',
  'co-esg-ghg-base':   c => c.esg?.ghgBase ? String(c.esg.ghgBase) : '—',
  'co-esg-strategy':   c => c.esg?.strategy || '—',
  'co-esg-altfuel-pct':c => c.esg?.altFuelPct ? c.esg.altFuelPct + '%' : '—',
  'co-esg-iso14001':   c => c.esg?.iso14001 ? 'Yes' : 'No',
  'co-esg-envrating':  c => c.esg?.envRating || '—',
  'co-esg-mlc':        c => c.esg?.mlc || '—',
  'co-esg-sire':       c => c.esg?.sire || '—',
  'co-esg-crewwelfare':c => c.esg?.crewWelfare || '—',
  'co-esg-diversity':  c => c.esg?.diversity ? 'Yes' : 'No',
  'co-esg-community':  c => c.esg?.community || '—',
  'co-esg-iso45001':   c => c.esg?.iso45001 ? 'Yes' : 'No',
  'co-esg-boardsize':  c => c.esg?.boardSize ? String(c.esg.boardSize) : '—',
  'co-esg-boardindep': c => c.esg?.boardIndep ? c.esg.boardIndep + '%' : '—',
  'co-esg-boarddiv':   c => c.esg?.boardDiv ? c.esg.boardDiv + '%' : '—',
  'co-esg-anticorr':   c => c.esg?.antiCorruption ? 'Yes' : 'No',
  'co-esg-whistle':    c => c.esg?.whistleblower ? 'Yes' : 'No',
  'co-esg-csrreport':  c => c.esg?.csrReport ? 'Yes' : 'No',
  'co-esg-iso37001':   c => c.esg?.iso37001 ? 'Yes' : 'No',

  // Historical
  'co-hist-prevname1':      c => c.history?.names?.[0]?.name || '—',
  'co-hist-prevname1-date': c => c.history?.names?.[0]?.date || '—',
  'co-hist-prevname2':      c => c.history?.names?.[1]?.name || '—',
  'co-hist-prevname2-date': c => c.history?.names?.[1]?.date || '—',
  'co-hist-own1-date':      c => c.history?.ownership?.[0]?.date || '—',
  'co-hist-own1-from':      c => c.history?.ownership?.[0]?.from || '—',
  'co-hist-own2-date':      c => c.history?.ownership?.[1]?.date || '—',
  'co-hist-own2-from':      c => c.history?.ownership?.[1]?.from || '—',
  'co-ma-type':             c => c.history?.ma?.type || '—',
  'co-ma-date':             c => c.history?.ma?.date || '—',
  'co-ma-counterparty':     c => c.history?.ma?.counterparty || '—',
  'co-ma-value':            c => c.history?.ma?.value || '—',
  'co-ma-notes':            c => c.history?.ma?.notes || '—',
  'co-insol-date':          c => c.history?.insolvency?.date || '—',
  'co-insol-type':          c => c.history?.insolvency?.type || '—',
  'co-insol-status':        c => c.history?.insolvency?.status || '—',
}

export function getCompanyAttrValue(company, leafId) {
  if (!company || !leafId) return '—'
  const fn = MAP[leafId]
  if (!fn) return '—'
  try {
    const v = fn(company)
    return v == null || v === '' ? '—' : String(v)
  } catch { return '—' }
}

export function generateCompanyHistory(label, company, fallbackVal) {
  const val = fallbackVal || '—'
  const baseYear = company.foundedYear || 2010
  const rows = []
  rows.push({ val, from: '2024-01-01', to: null, src: 'IHS Fairplay' })
  if (val !== '—') {
    const prevYear = Math.max(baseYear, new Date().getFullYear() - 4)
    rows.push({ val: val + ' (prev)', from: `${prevYear}-01-01`, to: '2023-12-31', src: 'IHS Fairplay' })
  }
  return rows
}

// ─── Column / filter config ───────────────────────────────────────────────────

export const CO_COL_GROUPS = [
  { key: 'identity',   label: 'Identity & Location' },
  { key: 'fleet',      label: 'Fleet & Operations' },
  { key: 'financial',  label: 'Financial' },
  { key: 'psc',        label: 'PSC & Safety' },
  { key: 'compliance', label: 'Sanctions & Compliance' },
]

export const CO_COLUMNS = [
  { id: 'name',      label: 'Company Name', always: true },
  { id: 'lrnum',     label: 'LR Number',    always: true },
  { id: 'type',      label: 'Type',         group: 'identity' },
  { id: 'country',   label: 'Country',      group: 'identity' },
  { id: 'city',      label: 'City',         group: 'identity' },
  { id: 'status',    label: 'Status',       group: 'identity' },
  { id: 'fleet',     label: 'Fleet',        group: 'fleet' },
  { id: 'employees', label: 'Employees',    group: 'fleet' },
  { id: 'revenue',   label: 'Revenue',      group: 'financial' },
  { id: 'pscRisk',   label: 'PSC Risk',     group: 'psc' },
  { id: 'sanc',      label: 'Sanctions',    group: 'compliance' },
]

export const STATUS_CLS = { Active: 'stA', Inactive: 'stI', Dissolved: 'stR', Dormant: 'stI' }

export function getCompanyCellValue(co, colId) {
  switch (colId) {
    case 'name':      return co.name
    case 'lrnum':     return co.lrNumber
    case 'type':      return co.type
    case 'country':   return co.country
    case 'city':      return co.city
    case 'status':    return co.status
    case 'fleet':     return co.fleet?.total ? String(co.fleet.total) : '—'
    case 'employees': return co.employees ? co.employees.toLocaleString() : '—'
    case 'revenue':   return co.financial?.revenue || '—'
    case 'pscRisk':   return co.psc?.risk || '—'
    case 'sanc':      return [co.sanctions?.ofac, co.sanctions?.un, co.sanctions?.eu].some(Boolean) ? 'Listed' : 'Clear'
    default:          return '—'
  }
}

export const CO_FILTER_FIELDS = [
  { id: 'type',       label: 'Company Type',          filterType: 'multiselect', getValues: cos => [...new Set(cos.map(c => c.type))].map(v => ({ value: v, label: v, count: cos.filter(c => c.type === v).length })) },
  { id: 'country',    label: 'Country',               filterType: 'multiselect', getValues: cos => [...new Set(cos.map(c => c.country))].map(v => ({ value: v, label: v, count: cos.filter(c => c.country === v).length })) },
  { id: 'status',     label: 'Status',                filterType: 'multiselect', getValues: cos => [...new Set(cos.map(c => c.status))].map(v => ({ value: v, label: v, count: cos.filter(c => c.status === v).length })) },
  { id: 'pp',         label: 'Public / Private',      filterType: 'multiselect', getValues: () => [{ value: 'Public', label: 'Public', count: 0 }, { value: 'Private', label: 'Private', count: 0 }] },
  { id: 'roles',      label: 'Company Role',          filterType: 'multiselect', getValues: cos => { const all = [...new Set(cos.flatMap(c => c.roles || []))]; return all.map(v => ({ value: v, label: v, count: cos.filter(c => (c.roles||[]).includes(v)).length })) } },
  { id: 'foundedYear',label: 'Founded Year',          filterType: 'range' },
  { id: 'employees',  label: 'Employees',             filterType: 'range' },
  { id: 'fleet',      label: 'Fleet Size (vessels)',  filterType: 'range' },
  { id: 'avgage',     label: 'Fleet Avg Age (years)', filterType: 'range' },
  { id: 'psc-risk',   label: 'PSC Risk',              filterType: 'multiselect', getValues: cos => [...new Set(cos.map(c => c.psc?.risk).filter(Boolean))].map(v => ({ value: v, label: v, count: cos.filter(c => c.psc?.risk === v).length })) },
  { id: 'detRate',    label: 'PSC Detention Rate %',  filterType: 'range' },
  { id: 'ism-auditor',label: 'ISM Auditor',           filterType: 'multiselect', getValues: cos => [...new Set(cos.map(c => c.ism?.auditor).filter(Boolean))].map(v => ({ value: v, label: v, count: cos.filter(c => c.ism?.auditor === v).length })) },
  { id: 'mlc',        label: 'MLC Status',            filterType: 'multiselect', getValues: () => [{ value: 'Compliant', label: 'Compliant', count: 0 }, { value: 'Non-compliant', label: 'Non-compliant', count: 0 }] },
  { id: 'sanctions',  label: 'Sanctions',             filterType: 'multiselect', getValues: () => [{ value: 'Clear', label: 'Clear', count: 0 }, { value: 'Listed', label: 'Listed', count: 0 }] },
  { id: 'ofac',       label: 'OFAC Listed',           filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Yes', count: 0 }, { value: 'No', label: 'No', count: 0 }] },
  { id: 'amlRisk',    label: 'AML Risk',              filterType: 'multiselect', getValues: cos => [...new Set(cos.map(c => c.kyc?.amlRisk).filter(Boolean))].map(v => ({ value: v, label: v, count: cos.filter(c => c.kyc?.amlRisk === v).length })) },
  { id: 'kycTier',    label: 'KYC Tier',              filterType: 'multiselect', getValues: cos => [...new Set(cos.map(c => c.kyc?.tier).filter(Boolean))].map(v => ({ value: v, label: v, count: cos.filter(c => c.kyc?.tier === v).length })) },
  { id: 'cii',        label: 'Average CII Rating',   filterType: 'multiselect', getValues: () => ['A','B','C','D','E'].map(v => ({ value: v, label: 'CII ' + v, count: 0 })) },
  { id: 'poseidon',   label: 'Poseidon Principles',  filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Signatory', count: 0 }, { value: 'No', label: 'Non-signatory', count: 0 }] },
  { id: 'iso14001',   label: 'ISO 14001',             filterType: 'multiselect', getValues: () => [{ value: 'Yes', label: 'Certified', count: 0 }, { value: 'No', label: 'Not Certified', count: 0 }] },
  { id: 'creditRisk', label: 'Payment Risk',         filterType: 'multiselect', getValues: () => ['Very Low','Low','Medium','High'].map(v => ({ value: v, label: v, count: 0 })) },
]
