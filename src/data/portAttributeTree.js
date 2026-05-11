export const PORT_ATTRIBUTE_TREE = [
  {
    id: 'po-identity',
    label: 'Identity & Location',
    children: [
      {
        id: 'po-basic',
        label: 'Basic Identity',
        children: [
          { id: 'po-name',           label: 'Port Name' },
          { id: 'po-fullname',       label: 'Full Official Name' },
          { id: 'po-altname',        label: 'Alternative Name(s)' },
          { id: 'po-unlocode',       label: 'UN/LOCODE' },
          { id: 'po-wpi',            label: 'World Port Index (WPI) Number' },
          { id: 'po-country',        label: 'Country' },
          { id: 'po-region',         label: 'Region / Province / State' },
          { id: 'po-type',           label: 'Port Type' },
          { id: 'po-function',       label: 'Port Function(s)' },
          { id: 'po-status',         label: 'Port Status' },
          { id: 'po-authority',      label: 'Port Authority Name' },
          { id: 'po-authority-type', label: 'Port Authority Type' },
          { id: 'po-owner',          label: 'Port Owner / Operator' },
          { id: 'po-established',    label: 'Year Established' },
        ]
      },
      {
        id: 'po-location',
        label: 'Geographic Position',
        children: [
          { id: 'po-lat',            label: 'Latitude' },
          { id: 'po-lon',            label: 'Longitude' },
          { id: 'po-timezone',       label: 'Time Zone' },
          { id: 'po-utcoffset',      label: 'UTC Offset (hours)' },
          { id: 'po-coastline',      label: 'Coastline / Sea Area' },
          { id: 'po-mou',            label: 'PSC MOU Region' },
          { id: 'po-eca',            label: 'ECA Zone' },
          { id: 'po-seca',           label: 'SECA Zone' },
          { id: 'po-locode-area',    label: 'LOCODE Area' },
        ]
      },
      {
        id: 'po-contact',
        label: 'Contact & Communications',
        children: [
          { id: 'po-phone',          label: 'Port Authority Phone' },
          { id: 'po-fax',            label: 'Port Authority Fax' },
          { id: 'po-email',          label: 'Port Authority Email' },
          { id: 'po-website',        label: 'Port Authority Website' },
          { id: 'po-vhf-ch',         label: 'VHF Working Channel' },
          { id: 'po-vhf-pilot',      label: 'Pilot VHF Channel' },
          { id: 'po-mmsi',           label: 'Port Authority MMSI' },
          { id: 'po-callsign',       label: 'Port Radio Call Sign' },
          { id: 'po-agents',         label: 'Recommended Agents' },
        ]
      },
    ]
  },
  {
    id: 'po-physical',
    label: 'Physical Characteristics',
    children: [
      {
        id: 'po-harbour',
        label: 'Harbour Overview',
        children: [
          { id: 'po-harbour-area',   label: 'Harbour Total Area (ha)' },
          { id: 'po-water-area',     label: 'Water Area (ha)' },
          { id: 'po-land-area',      label: 'Land Area (ha)' },
          { id: 'po-anch-area',      label: 'Anchorage Area (ha)' },
          { id: 'po-tide-range',     label: 'Tidal Range (m)' },
          { id: 'po-tide-type',      label: 'Tidal Type' },
          { id: 'po-current-max',    label: 'Max Current (kts)' },
          { id: 'po-salinity',       label: 'Water Salinity' },
          { id: 'po-bottom-type',    label: 'Harbour Bottom Type' },
          { id: 'po-shelter',        label: 'Shelter Quality' },
        ]
      },
      {
        id: 'po-channel',
        label: 'Channels & Approaches',
        children: [
          { id: 'po-ch-maxdraft',    label: 'Max Channel Draft (m)' },
          { id: 'po-ch-maxloa',      label: 'Max Vessel LOA (m)' },
          { id: 'po-ch-maxbeam',     label: 'Max Vessel Beam (m)' },
          { id: 'po-ch-maxdwt',      label: 'Max Vessel DWT' },
          { id: 'po-ch-maxairdraft', label: 'Max Air Draft (m)' },
          { id: 'po-ch-width',       label: 'Channel Width (m)' },
          { id: 'po-ch-length',      label: 'Channel Length (nm)' },
          { id: 'po-ch-depth-mlws',  label: 'Channel Depth MLWS (m)' },
          { id: 'po-ch-depth-mhws',  label: 'Channel Depth MHWS (m)' },
          { id: 'po-ch-dredged',     label: 'Dredged Depth (m)' },
          { id: 'po-ch-dredge-date', label: 'Last Dredging Date' },
          { id: 'po-approach-notes', label: 'Approach Notes' },
          { id: 'po-bar-draft',      label: 'Bar Draft (m)' },
          { id: 'po-tidal-restrict', label: 'Tidal Restriction' },
          { id: 'po-night-entry',    label: 'Night Entry Permitted' },
        ]
      },
      {
        id: 'po-berths',
        label: 'Berths & Quays',
        children: [
          { id: 'po-berth-count',    label: 'Total Berths' },
          { id: 'po-berth-max-loa',  label: 'Max Berth LOA (m)' },
          { id: 'po-berth-max-draft',label: 'Max Berth Draft (m)' },
          { id: 'po-berth-max-dwt',  label: 'Max Berth DWT' },
          { id: 'po-berth-totallen', label: 'Total Quay Length (m)' },
          { id: 'po-berth-types',    label: 'Berth Types' },
          { id: 'po-dolphins',       label: 'Dolphin Berths' },
          { id: 'po-mooring-buoys',  label: 'Mooring Buoys' },
          { id: 'po-swl',            label: 'Berth Max SWL (MT)' },
          { id: 'po-bollard-pull',   label: 'Max Bollard Pull (MT)' },
        ]
      },
      {
        id: 'po-anchorage',
        label: 'Anchorage',
        children: [
          { id: 'po-anch-spots',     label: 'Anchorage Spots' },
          { id: 'po-anch-max-draft', label: 'Anchorage Max Draft (m)' },
          { id: 'po-anch-max-loa',   label: 'Anchorage Max LOA (m)' },
          { id: 'po-anch-holding',   label: 'Holding Ground Quality' },
          { id: 'po-anch-waiting',   label: 'Average Waiting Anchorage (days)' },
        ]
      },
    ]
  },
  {
    id: 'po-terminals',
    label: 'Terminals',
    children: [
      {
        id: 'po-term-container',
        label: 'Container Terminal',
        children: [
          { id: 'po-ct-exists',      label: 'Container Terminal Exists' },
          { id: 'po-ct-operator',    label: 'Terminal Operator' },
          { id: 'po-ct-capacity',    label: 'Annual Capacity (TEU)' },
          { id: 'po-ct-berths',      label: 'Container Berths' },
          { id: 'po-ct-cranes',      label: 'Ship-to-Shore Cranes' },
          { id: 'po-ct-rtg',         label: 'RTG Cranes' },
          { id: 'po-ct-rmg',         label: 'RMG Cranes' },
          { id: 'po-ct-reefer',      label: 'Reefer Plugs' },
          { id: 'po-ct-area',        label: 'Terminal Area (ha)' },
          { id: 'po-ct-max-loa',     label: 'Max Vessel LOA (m)' },
          { id: 'po-ct-max-draft',   label: 'Max Draft (m)' },
        ]
      },
      {
        id: 'po-term-bulk',
        label: 'Bulk Terminal',
        children: [
          { id: 'po-bt-exists',      label: 'Bulk Terminal Exists' },
          { id: 'po-bt-operator',    label: 'Bulk Terminal Operator' },
          { id: 'po-bt-types',       label: 'Bulk Types Handled' },
          { id: 'po-bt-capacity',    label: 'Annual Throughput (MT)' },
          { id: 'po-bt-storage',     label: 'Storage Capacity (MT)' },
          { id: 'po-bt-loader-rate', label: 'Loader Rate (MT/hr)' },
          { id: 'po-bt-unloader',    label: 'Unloader Rate (MT/hr)' },
          { id: 'po-bt-conveyors',   label: 'Conveyor Length (m)' },
          { id: 'po-bt-silos',       label: 'Grain Silos (MT)' },
        ]
      },
      {
        id: 'po-term-tanker',
        label: 'Liquid Bulk / Tanker Terminal',
        children: [
          { id: 'po-tt-exists',      label: 'Tanker Terminal Exists' },
          { id: 'po-tt-operator',    label: 'Tanker Terminal Operator' },
          { id: 'po-tt-types',       label: 'Liquid Types Handled' },
          { id: 'po-tt-capacity',    label: 'Annual Throughput (MT)' },
          { id: 'po-tt-storage',     label: 'Shore Tank Capacity (m³)' },
          { id: 'po-tt-arms',        label: 'Loading Arms' },
          { id: 'po-tt-max-dwt',     label: 'Max Tanker DWT' },
          { id: 'po-tt-max-draft',   label: 'Max Draft (m)' },
          { id: 'po-tt-slop',        label: 'Slop Reception Facility' },
          { id: 'po-tt-pumprate',    label: 'Pump Rate (m³/hr)' },
        ]
      },
      {
        id: 'po-term-roro',
        label: 'RoRo / Passenger Terminal',
        children: [
          { id: 'po-rt-exists',      label: 'RoRo Terminal Exists' },
          { id: 'po-rt-operator',    label: 'RoRo Terminal Operator' },
          { id: 'po-rt-ramps',       label: 'Number of Ramps' },
          { id: 'po-rt-ramp-cap',    label: 'Ramp Capacity (MT)' },
          { id: 'po-rt-lane-meters', label: 'Lane Meters Available' },
          { id: 'po-pt-exists',      label: 'Passenger / Cruise Terminal Exists' },
          { id: 'po-pt-berths',      label: 'Cruise Berths' },
          { id: 'po-pt-max-loa',     label: 'Max Cruise Vessel LOA (m)' },
          { id: 'po-pt-pax-cap',     label: 'Passenger Throughput (daily)' },
          { id: 'po-pt-ferry',       label: 'Ferry Terminal Exists' },
        ]
      },
    ]
  },
  {
    id: 'po-facilities',
    label: 'Facilities & Services',
    children: [
      {
        id: 'po-cargo-handling',
        label: 'Cargo Handling',
        children: [
          { id: 'po-cranes-mobile',  label: 'Mobile Cranes (count)' },
          { id: 'po-cranes-max-swl', label: 'Largest Crane SWL (MT)' },
          { id: 'po-forklifts',      label: 'Forklifts Available' },
          { id: 'po-reach-stackers', label: 'Reach Stackers' },
          { id: 'po-bulk-grabbers',  label: 'Bulk Grab Cranes' },
          { id: 'po-heavylift',      label: 'Heavy Lift Capability' },
          { id: 'po-heavylift-swl',  label: 'Heavy Lift Max SWL (MT)' },
          { id: 'po-reefer-pwr',     label: 'Reefer Power Supply (V/Hz)' },
          { id: 'po-hazmat',         label: 'Hazmat Handling Capability' },
        ]
      },
      {
        id: 'po-marine-svc',
        label: 'Marine Services',
        children: [
          { id: 'po-pilotage',       label: 'Pilotage Available' },
          { id: 'po-pilotage-comp',  label: 'Pilotage Compulsory' },
          { id: 'po-towage',         label: 'Towage Available' },
          { id: 'po-tugs',           label: 'Number of Tugs' },
          { id: 'po-tug-max-bp',     label: 'Largest Tug Bollard Pull (MT)' },
          { id: 'po-freshwater',     label: 'Freshwater Supply' },
          { id: 'po-freshwater-rate',label: 'Freshwater Rate (MT/hr)' },
          { id: 'po-provisions',     label: 'Provisions Available' },
          { id: 'po-medical',        label: 'Medical Facilities Nearby' },
          { id: 'po-garbage',        label: 'Garbage Collection' },
          { id: 'po-waste',          label: 'Waste Reception Facility' },
          { id: 'po-quarantine',     label: 'Quarantine Facilities' },
        ]
      },
      {
        id: 'po-bunker',
        label: 'Bunkering',
        children: [
          { id: 'po-bunker-avail',   label: 'Bunkering Available' },
          { id: 'po-bunker-hfo',     label: 'HFO Available' },
          { id: 'po-bunker-vlsfo',   label: 'VLSFO Available' },
          { id: 'po-bunker-mdo',     label: 'MDO Available' },
          { id: 'po-bunker-mgo',     label: 'MGO Available' },
          { id: 'po-bunker-lng',     label: 'LNG Available' },
          { id: 'po-bunker-methanol',label: 'Methanol Available' },
          { id: 'po-bunker-rate',    label: 'Max Bunker Rate (MT/hr)' },
          { id: 'po-bunker-barge',   label: 'Bunker by Barge' },
          { id: 'po-bunker-pipe',    label: 'Bunker by Pipeline' },
          { id: 'po-bunker-truck',   label: 'Bunker by Truck' },
        ]
      },
      {
        id: 'po-repair',
        label: 'Repair & Drydock',
        children: [
          { id: 'po-drydock',        label: 'Drydock Available' },
          { id: 'po-drydock-count',  label: 'Number of Drydocks' },
          { id: 'po-drydock-max-loa',label: 'Drydock Max LOA (m)' },
          { id: 'po-drydock-max-beam',label:'Drydock Max Beam (m)' },
          { id: 'po-drydock-max-dwt',label: 'Drydock Max DWT' },
          { id: 'po-slipway',        label: 'Slipway Available' },
          { id: 'po-float-dock',     label: 'Floating Dock Available' },
          { id: 'po-workshops',      label: 'Repair Workshops' },
          { id: 'po-spares',         label: 'Spare Parts Availability' },
          { id: 'po-diving',         label: 'Diving Services' },
          { id: 'po-uw-repair',      label: 'Underwater Repair Capability' },
        ]
      },
    ]
  },
  {
    id: 'po-navigation',
    label: 'Navigation & Restrictions',
    children: [
      {
        id: 'po-nav-aids',
        label: 'Navigation Aids',
        children: [
          { id: 'po-lighthouse',     label: 'Lighthouse Present' },
          { id: 'po-light-buoys',    label: 'Light Buoys Present' },
          { id: 'po-vts',            label: 'VTS / VTMS Exists' },
          { id: 'po-vts-range',      label: 'VTS Coverage Range (nm)' },
          { id: 'po-ais-base',       label: 'AIS Base Station' },
          { id: 'po-radar-station',  label: 'Radar Station' },
          { id: 'po-tide-gauge',     label: 'Tide Gauge Present' },
          { id: 'po-weather-buoy',   label: 'Weather Buoy' },
        ]
      },
      {
        id: 'po-restrictions',
        label: 'Entry Restrictions',
        children: [
          { id: 'po-restr-max-loa',  label: 'Restriction Max LOA (m)' },
          { id: 'po-restr-max-beam', label: 'Restriction Max Beam (m)' },
          { id: 'po-restr-max-draft',label: 'Restriction Max Draft (m)' },
          { id: 'po-restr-max-dwt',  label: 'Restriction Max DWT' },
          { id: 'po-restr-airdraft', label: 'Restriction Max Air Draft (m)' },
          { id: 'po-restr-tidal',    label: 'Tidal Window Restrictions' },
          { id: 'po-restr-daylight', label: 'Daylight Entry Only' },
          { id: 'po-restr-ice',      label: 'Icebreaker Required (Season)' },
          { id: 'po-restr-closed',   label: 'Port Restricted / Closed' },
          { id: 'po-restr-notes',    label: 'Restriction Notes' },
          { id: 'po-restr-flags',    label: 'Restricted Flag States' },
          { id: 'po-restr-types',    label: 'Restricted Vessel Types' },
        ]
      },
      {
        id: 'po-env-restr',
        label: 'Environmental Restrictions',
        children: [
          { id: 'po-env-eca',        label: 'ECA Zone Membership' },
          { id: 'po-env-seca',       label: 'SECA Zone Membership' },
          { id: 'po-env-nox',        label: 'NOx Emission Restrictions' },
          { id: 'po-env-so2',        label: 'SOx Emission Limits (%)' },
          { id: 'po-env-cold-iron',  label: 'Cold Ironing / Shore Power' },
          { id: 'po-env-ballast',    label: 'Ballast Water Management Requirements' },
          { id: 'po-env-antifouling',label: 'Anti-Fouling Paint Restrictions' },
          { id: 'po-env-noise',      label: 'Noise Restrictions' },
          { id: 'po-env-sewage',     label: 'Sewage Discharge Restrictions' },
        ]
      },
    ]
  },
  {
    id: 'po-traffic',
    label: 'Traffic & Operations',
    children: [
      {
        id: 'po-traffic-overview',
        label: 'Annual Traffic',
        children: [
          { id: 'po-traffic-year',    label: 'Traffic Data Year' },
          { id: 'po-traffic-calls',   label: 'Total Vessel Calls (annual)' },
          { id: 'po-traffic-cargo-mt',label: 'Total Cargo Throughput (MT/year)' },
          { id: 'po-traffic-teu',     label: 'Container Throughput (TEU/year)' },
          { id: 'po-traffic-tanker',  label: 'Liquid Bulk Throughput (MT/year)' },
          { id: 'po-traffic-dry',     label: 'Dry Bulk Throughput (MT/year)' },
          { id: 'po-traffic-general', label: 'General Cargo Throughput (MT/year)' },
          { id: 'po-traffic-roro',    label: 'RoRo Units (annual)' },
          { id: 'po-traffic-pax',     label: 'Passenger Throughput (annual)' },
          { id: 'po-traffic-cruise',  label: 'Cruise Ship Calls (annual)' },
          { id: 'po-traffic-rank',    label: 'World Port Ranking' },
          { id: 'po-traffic-natrank', label: 'National Port Ranking' },
        ]
      },
      {
        id: 'po-congestion',
        label: 'Port Congestion',
        children: [
          { id: 'po-cong-waiting',    label: 'Avg Port Waiting Time (hours)' },
          { id: 'po-cong-turnaround', label: 'Avg Turnaround Time (hours)' },
          { id: 'po-cong-occupancy',  label: 'Berth Occupancy Rate (%)' },
          { id: 'po-cong-at-anch',    label: 'Vessels at Anchor (current)' },
          { id: 'po-cong-risk',       label: 'Congestion Risk Level' },
          { id: 'po-cong-peak',       label: 'Peak Season Months' },
        ]
      },
      {
        id: 'po-operations',
        label: 'Operational Details',
        children: [
          { id: 'po-ops-hours',       label: 'Operating Hours' },
          { id: 'po-ops-holidays',    label: 'Holiday Restrictions' },
          { id: 'po-ops-workrate',    label: 'Cargo Working Rate' },
          { id: 'po-ops-gangs',       label: 'Labour Gangs Available' },
          { id: 'po-ops-customs-hrs', label: 'Customs Office Hours' },
          { id: 'po-ops-health-hrs',  label: 'Health Authority Hours' },
          { id: 'po-ops-clearance',   label: 'Average Customs Clearance Time' },
        ]
      },
    ]
  },
  {
    id: 'po-psc',
    label: 'Port State Control',
    children: [
      {
        id: 'po-psc-authority',
        label: 'PSC Authority',
        children: [
          { id: 'po-psc-mou',         label: 'PSC MOU' },
          { id: 'po-psc-auth-name',   label: 'PSC Authority Name' },
          { id: 'po-psc-auth-contact',label: 'PSC Authority Contact' },
          { id: 'po-psc-auth-email',  label: 'PSC Authority Email' },
          { id: 'po-psc-active',      label: 'PSC Inspections Active' },
        ]
      },
      {
        id: 'po-psc-stats',
        label: 'Inspection Statistics',
        children: [
          { id: 'po-psc-total-insp',  label: 'Total Inspections (last 12 months)' },
          { id: 'po-psc-detentions',  label: 'Detentions (last 12 months)' },
          { id: 'po-psc-det-rate',    label: 'Detention Rate (%)' },
          { id: 'po-psc-total-def',   label: 'Total Deficiencies (last 12 months)' },
          { id: 'po-psc-avg-def',     label: 'Avg Deficiencies per Inspection' },
          { id: 'po-psc-inspectors',  label: 'Number of PSC Officers' },
          { id: 'po-psc-target-rate', label: 'Targeting / Inspection Rate (%)' },
          { id: 'po-psc-last-report', label: 'Last Published PSC Report Date' },
        ]
      },
      {
        id: 'po-psc-defcats',
        label: 'Deficiency Categories',
        children: [
          { id: 'po-psc-def-fire',    label: 'Fire Safety' },
          { id: 'po-psc-def-lsa',     label: 'Life-Saving Appliances' },
          { id: 'po-psc-def-nav',     label: 'Navigation Equipment' },
          { id: 'po-psc-def-ism',     label: 'ISM Code' },
          { id: 'po-psc-def-marpol',  label: 'MARPOL' },
          { id: 'po-psc-def-crew',    label: 'Crew Certification' },
          { id: 'po-psc-def-stcw',    label: 'STCW' },
          { id: 'po-psc-def-struct',  label: 'Structural Condition' },
          { id: 'po-psc-def-cert',    label: 'Documentation & Certificates' },
        ]
      },
    ]
  },
  {
    id: 'po-regulatory',
    label: 'Regulatory & Administrative',
    children: [
      {
        id: 'po-customs',
        label: 'Customs & Documentation',
        children: [
          { id: 'po-customs-office',  label: 'Customs Office Present' },
          { id: 'po-customs-ftz',     label: 'Free Trade Zone' },
          { id: 'po-customs-cabotage',label: 'Cabotage Restrictions' },
          { id: 'po-immigration',     label: 'Immigration / Visa Requirements' },
          { id: 'po-health-auth',     label: 'Port Health Authority Present' },
          { id: 'po-pre-arrival',     label: 'Pre-Arrival Documents Required' },
          { id: 'po-flag-restr',      label: 'Flag State Restrictions' },
          { id: 'po-isps-level',      label: 'Current ISPS Security Level' },
        ]
      },
      {
        id: 'po-tariffs',
        label: 'Port Dues & Tariffs',
        children: [
          { id: 'po-tariff-currency', label: 'Tariff Currency' },
          { id: 'po-tariff-portdue',  label: 'Port Dues (basis)' },
          { id: 'po-tariff-pilotage', label: 'Pilotage Fees (basis)' },
          { id: 'po-tariff-towage',   label: 'Towage Fees (basis)' },
          { id: 'po-tariff-berth',    label: 'Berth Dues (basis)' },
          { id: 'po-tariff-cargo',    label: 'Cargo Handling Fees (basis)' },
          { id: 'po-tariff-storage',  label: 'Storage Fees (basis)' },
          { id: 'po-tariff-water',    label: 'Freshwater Price (per MT)' },
          { id: 'po-tariff-garbage',  label: 'Garbage Collection Fees' },
          { id: 'po-tariff-overtime', label: 'Overtime Rates Applicable' },
        ]
      },
    ]
  },
]

export function flattenAllPort(nodes, path = []) {
  const results = []
  for (const n of nodes) {
    if (n.children) {
      results.push(...flattenAllPort(n.children, [...path, n.label]))
    } else {
      results.push({ ...n, path: [...path, n.label] })
    }
  }
  return results
}
