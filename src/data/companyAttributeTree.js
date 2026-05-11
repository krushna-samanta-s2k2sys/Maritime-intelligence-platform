export const COMPANY_ATTRIBUTE_TREE = [
  {
    id: 'co-identity',
    label: 'Identity & Registration',
    children: [
      {
        id: 'co-legal',
        label: 'Legal Identity',
        children: [
          { id: 'co-name',           label: 'Company Name' },
          { id: 'co-shortname',      label: 'Short Name / Trading Name' },
          { id: 'co-prevname',       label: 'Previous Name' },
          { id: 'co-lrnumber',       label: 'LR Reference Number' },
          { id: 'co-lei',            label: 'Legal Entity Identifier (LEI)' },
          { id: 'co-dunsnumber',     label: 'D&B D-U-N-S Number' },
          { id: 'co-regnum',         label: 'Company Registration Number' },
          { id: 'co-vatid',          label: 'VAT / Tax ID' },
          { id: 'co-type',           label: 'Company Type' },
          { id: 'co-legalform',      label: 'Legal Form' },
          { id: 'co-country',        label: 'Country of Registration' },
          { id: 'co-jurisdiction',   label: 'Jurisdiction' },
          { id: 'co-incorpordate',   label: 'Date of Incorporation' },
          { id: 'co-dissolutiondate',label: 'Date of Dissolution' },
          { id: 'co-status',         label: 'Company Status' },
          { id: 'co-exchange',       label: 'Stock Exchange' },
          { id: 'co-ticker',         label: 'Stock Ticker Symbol' },
          { id: 'co-publicprivate',  label: 'Public / Private' },
          { id: 'co-seccodes',       label: 'Sector Codes (SIC/NACE)' },
        ]
      },
      {
        id: 'co-contact',
        label: 'Contact & Address',
        children: [
          { id: 'co-regaddr',        label: 'Registered Address' },
          { id: 'co-regcity',        label: 'City' },
          { id: 'co-regpostcode',    label: 'Postal Code' },
          { id: 'co-regcountry',     label: 'Country' },
          { id: 'co-opaddr',         label: 'Operational HQ Address' },
          { id: 'co-opcity',         label: 'Operational HQ City' },
          { id: 'co-phone',          label: 'Phone' },
          { id: 'co-fax',            label: 'Fax' },
          { id: 'co-email',          label: 'Email' },
          { id: 'co-website',        label: 'Website' },
          { id: 'co-telex',          label: 'Telex' },
          { id: 'co-comms',          label: 'Communications Address' },
        ]
      },
      {
        id: 'co-roles',
        label: 'Roles & Classification',
        children: [
          { id: 'co-role-regowner',  label: 'Registered Owner' },
          { id: 'co-role-techman',   label: 'Technical Manager' },
          { id: 'co-role-shipman',   label: 'Ship Manager' },
          { id: 'co-role-docco',     label: 'DOC Company' },
          { id: 'co-role-bareboat',  label: 'Bareboat Charterer' },
          { id: 'co-role-charterer', label: 'Charterer' },
          { id: 'co-role-broker',    label: 'Ship Broker' },
          { id: 'co-role-insurer',   label: 'Marine Insurer' },
          { id: 'co-role-surveyor',  label: 'Marine Surveyor' },
          { id: 'co-role-agent',     label: 'Shipping Agent' },
          { id: 'co-role-portop',    label: 'Port Operator' },
          { id: 'co-role-terminal',  label: 'Terminal Operator' },
          { id: 'co-role-sp',        label: 'Sale & Purchase Principal' },
        ]
      },
    ]
  },
  {
    id: 'co-structure',
    label: 'Corporate Structure',
    children: [
      {
        id: 'co-ownership',
        label: 'Beneficial Ownership',
        children: [
          { id: 'co-ubo-name',       label: 'Ultimate Beneficial Owner Name' },
          { id: 'co-ubo-country',    label: 'UBO Country of Residence' },
          { id: 'co-ubo-pct',        label: 'UBO Ownership %' },
          { id: 'co-ubo-type',       label: 'UBO Relationship Type' },
          { id: 'co-ubo-dob',        label: 'UBO Date of Birth' },
          { id: 'co-ubo-nationality',label: 'UBO Nationality' },
          { id: 'co-ubo2-name',      label: 'UBO 2 Name' },
          { id: 'co-ubo2-pct',       label: 'UBO 2 Ownership %' },
          { id: 'co-ubo2-country',   label: 'UBO 2 Country' },
          { id: 'co-ownstructure',   label: 'Ownership Structure Description' },
          { id: 'co-ownchangedate',  label: 'Last Ownership Change Date' },
          { id: 'co-ownconfidence',  label: 'Ownership Data Confidence' },
        ]
      },
      {
        id: 'co-parent',
        label: 'Parent & Holding',
        children: [
          { id: 'co-parent-name',    label: 'Parent Company Name' },
          { id: 'co-parent-country', label: 'Parent Country' },
          { id: 'co-parent-pct',     label: 'Parent Ownership %' },
          { id: 'co-parent-lrnum',   label: 'Parent LR Reference' },
          { id: 'co-parent-lei',     label: 'Parent LEI' },
          { id: 'co-group-name',     label: 'Group / Conglomerate Name' },
          { id: 'co-group-hq',       label: 'Group Headquarters Country' },
          { id: 'co-holding-name',   label: 'Holding Company Name' },
          { id: 'co-holding-country',label: 'Holding Company Country' },
          { id: 'co-holding-pct',    label: 'Holding %' },
        ]
      },
      {
        id: 'co-subsidiaries',
        label: 'Subsidiaries & Affiliates',
        children: [
          { id: 'co-sub-count',      label: 'Number of Subsidiaries' },
          { id: 'co-sub-names',      label: 'Subsidiary Names' },
          { id: 'co-sub-countries',  label: 'Subsidiary Countries' },
          { id: 'co-affiliate-names',label: 'Affiliate Company Names' },
          { id: 'co-jv-partners',    label: 'Joint Venture Partners' },
          { id: 'co-jv-pct',         label: 'JV Ownership %' },
        ]
      },
      {
        id: 'co-personnel',
        label: 'Key Personnel',
        children: [
          { id: 'co-ceo',            label: 'Chief Executive Officer' },
          { id: 'co-coo',            label: 'Chief Operating Officer' },
          { id: 'co-cfo',            label: 'Chief Financial Officer' },
          { id: 'co-cto',            label: 'Chief Technical Officer' },
          { id: 'co-chairman',       label: 'Chairman' },
          { id: 'co-md',             label: 'Managing Director' },
          { id: 'co-fleetdirector',  label: 'Fleet Director' },
          { id: 'co-dpa',            label: 'Designated Person Ashore (DPA)' },
          { id: 'co-legalcontact',   label: 'Legal Contact' },
          { id: 'co-complianceofficer', label: 'Compliance Officer' },
          { id: 'co-employees',      label: 'Total Employees' },
          { id: 'co-foundedyear',    label: 'Founded Year' },
        ]
      },
    ]
  },
  {
    id: 'co-fleet',
    label: 'Fleet Management',
    children: [
      {
        id: 'co-fleet-overview',
        label: 'Fleet Overview',
        children: [
          { id: 'co-fleet-total',    label: 'Total Vessels Managed' },
          { id: 'co-fleet-owned',    label: 'Vessels Owned' },
          { id: 'co-fleet-managed',  label: 'Vessels Technically Managed' },
          { id: 'co-fleet-avgdwt',   label: 'Average DWT per Vessel' },
          { id: 'co-fleet-totaldwt', label: 'Total Fleet DWT' },
          { id: 'co-fleet-avgage',   label: 'Fleet Average Age (years)' },
          { id: 'co-fleet-newbuild', label: 'Newbuilding Orders on Hand' },
          { id: 'co-fleet-scrapped', label: 'Vessels Scrapped in Last 2 Years' },
          { id: 'co-fleet-sold',     label: 'Vessels Sold in Last 2 Years' },
          { id: 'co-fleet-acquired', label: 'Vessels Acquired in Last 2 Years' },
        ]
      },
      {
        id: 'co-fleet-types',
        label: 'Fleet by Type',
        children: [
          { id: 'co-fl-bulkers',     label: 'Bulk Carriers' },
          { id: 'co-fl-tankers',     label: 'Tankers (incl. VLCC)' },
          { id: 'co-fl-containers',  label: 'Container Ships' },
          { id: 'co-fl-lng',         label: 'LNG Carriers' },
          { id: 'co-fl-lpg',         label: 'LPG Carriers' },
          { id: 'co-fl-chemical',    label: 'Chemical Tankers' },
          { id: 'co-fl-general',     label: 'General Cargo' },
          { id: 'co-fl-roro',        label: 'RoRo / Car Carriers' },
          { id: 'co-fl-cruise',      label: 'Cruise / Passenger' },
          { id: 'co-fl-offshore',    label: 'Offshore Support Vessels' },
          { id: 'co-fl-other',       label: 'Other / Miscellaneous' },
        ]
      },
      {
        id: 'co-ism',
        label: 'ISM & Safety Management',
        children: [
          { id: 'co-doc-number',     label: 'DOC Certificate Number' },
          { id: 'co-doc-issdate',    label: 'DOC Issue Date' },
          { id: 'co-doc-expdate',    label: 'DOC Expiry Date' },
          { id: 'co-doc-issauth',    label: 'DOC Issuing Authority' },
          { id: 'co-doc-shiptypes',  label: 'DOC Ship Types Covered' },
          { id: 'co-ism-auditor',    label: 'ISM Auditor' },
          { id: 'co-ism-lastaudit',  label: 'Last ISM Audit Date' },
          { id: 'co-ism-nextaudit',  label: 'Next ISM Audit Due' },
          { id: 'co-ism-nc',         label: 'Open Non-Conformities' },
          { id: 'co-ism-obs',        label: 'Open Observations' },
          { id: 'co-dpa-name',       label: 'DPA Name' },
          { id: 'co-dpa-phone',      label: 'DPA 24h Contact Number' },
          { id: 'co-dpa-email',      label: 'DPA Email' },
          { id: 'co-emergency',      label: '24h Emergency Contact' },
        ]
      },
    ]
  },
  {
    id: 'co-psc',
    label: 'Port State Control',
    children: [
      {
        id: 'co-psc-perf',
        label: 'PSC Performance',
        children: [
          { id: 'co-psc-totalinsp',  label: 'Total Inspections (24 months)' },
          { id: 'co-psc-detentions', label: 'Detentions (24 months)' },
          { id: 'co-psc-detrate',    label: 'Detention Rate (%)' },
          { id: 'co-psc-deficiencies',label: 'Total Deficiencies' },
          { id: 'co-psc-defrate',    label: 'Avg Deficiencies per Inspection' },
          { id: 'co-psc-lastinsp',   label: 'Last Inspection Date' },
          { id: 'co-psc-lastport',   label: 'Last Inspection Port' },
          { id: 'co-psc-lastresult', label: 'Last Inspection Result' },
          { id: 'co-psc-risk',       label: 'PSC Risk Level' },
          { id: 'co-psc-blacklisted',label: 'Blacklisted / Banned' },
        ]
      },
      {
        id: 'co-psc-defcats',
        label: 'Deficiency Categories',
        children: [
          { id: 'co-psc-def-fire',   label: 'Fire Safety Deficiencies' },
          { id: 'co-psc-def-lsa',    label: 'Life-Saving Appliances' },
          { id: 'co-psc-def-ism',    label: 'ISM Code Deficiencies' },
          { id: 'co-psc-def-nav',    label: 'Navigation / Bridge Equipment' },
          { id: 'co-psc-def-poll',   label: 'Pollution Prevention' },
          { id: 'co-psc-def-marpol', label: 'MARPOL Deficiencies' },
          { id: 'co-psc-def-crew',   label: 'Crew-Related Deficiencies' },
          { id: 'co-psc-def-stcw',   label: 'STCW Deficiencies' },
          { id: 'co-psc-def-cert',   label: 'Certificate Deficiencies' },
          { id: 'co-psc-def-hull',   label: 'Structural / Hull Deficiencies' },
        ]
      },
    ]
  },
  {
    id: 'co-financial',
    label: 'Financial',
    children: [
      {
        id: 'co-fin-overview',
        label: 'Financial Overview',
        children: [
          { id: 'co-fin-revenue',    label: 'Annual Revenue (USD)' },
          { id: 'co-fin-revyear',    label: 'Revenue Reporting Year' },
          { id: 'co-fin-ebitda',     label: 'EBITDA (USD)' },
          { id: 'co-fin-netincome',  label: 'Net Income (USD)' },
          { id: 'co-fin-assets',     label: 'Total Assets (USD)' },
          { id: 'co-fin-liabilities',label: 'Total Liabilities (USD)' },
          { id: 'co-fin-equity',     label: "Shareholders' Equity (USD)" },
          { id: 'co-fin-marketcap',  label: 'Market Capitalization (USD)' },
          { id: 'co-fin-currency',   label: 'Reporting Currency' },
          { id: 'co-fin-fiscalyear', label: 'Fiscal Year End' },
          { id: 'co-fin-auditor',    label: 'Auditor / Accounting Firm' },
          { id: 'co-fin-bank',       label: 'Primary Banking Relationship' },
        ]
      },
      {
        id: 'co-credit',
        label: 'Credit & Ratings',
        children: [
          { id: 'co-credit-moodys',  label: "Moody's Credit Rating" },
          { id: 'co-credit-sp',      label: 'S&P Credit Rating' },
          { id: 'co-credit-fitch',   label: 'Fitch Credit Rating' },
          { id: 'co-credit-dnb',     label: 'D&B Credit Rating' },
          { id: 'co-credit-outlook', label: 'Rating Outlook' },
          { id: 'co-credit-score',   label: 'Internal Credit Score' },
          { id: 'co-credit-limit',   label: 'Credit Limit (USD)' },
          { id: 'co-credit-payrisk', label: 'Payment Risk' },
          { id: 'co-credit-payday',  label: 'Average Days to Pay' },
        ]
      },
    ]
  },
  {
    id: 'co-sanctions',
    label: 'Sanctions & Compliance',
    children: [
      {
        id: 'co-sanctions-screen',
        label: 'Sanctions Screening',
        children: [
          { id: 'co-sanc-ofac',      label: 'OFAC SDN Listed' },
          { id: 'co-sanc-un',        label: 'UN Sanctions Listed' },
          { id: 'co-sanc-eu',        label: 'EU Sanctions Listed' },
          { id: 'co-sanc-uk',        label: 'UK HMT Sanctions Listed' },
          { id: 'co-sanc-australia', label: 'Australia DFAT Listed' },
          { id: 'co-sanc-japan',     label: 'Japan METI Listed' },
          { id: 'co-sanc-canada',    label: 'Canada SEMA Listed' },
          { id: 'co-sanc-date',      label: 'Sanction Designation Date' },
          { id: 'co-sanc-reason',    label: 'Sanction Reason / Program' },
          { id: 'co-sanc-notes',     label: 'Sanction Notes' },
          { id: 'co-sanc-lastscreened', label: 'Last Screened Date' },
          { id: 'co-sanc-risk',      label: 'Overall Sanctions Risk' },
        ]
      },
      {
        id: 'co-kyc',
        label: 'KYC & Due Diligence',
        children: [
          { id: 'co-kyc-status',     label: 'KYC Status' },
          { id: 'co-kyc-date',       label: 'KYC Last Updated' },
          { id: 'co-kyc-tier',       label: 'KYC Risk Tier' },
          { id: 'co-kyc-reviewer',   label: 'KYC Reviewer' },
          { id: 'co-pep-exposure',   label: 'PEP Exposure' },
          { id: 'co-pep-name',       label: 'PEP Name (if applicable)' },
          { id: 'co-aml-risk',       label: 'AML Risk Level' },
          { id: 'co-adverse-media',  label: 'Adverse Media Flags' },
          { id: 'co-adverse-notes',  label: 'Adverse Media Notes' },
          { id: 'co-court-cases',    label: 'Active Court Cases' },
          { id: 'co-court-notes',    label: 'Court Case Notes' },
        ]
      },
    ]
  },
  {
    id: 'co-esg',
    label: 'ESG & Sustainability',
    children: [
      {
        id: 'co-esg-env',
        label: 'Environmental',
        children: [
          { id: 'co-esg-poseidon',   label: 'Poseidon Principles Signatory' },
          { id: 'co-esg-eexi-avg',   label: 'Fleet Average EEXI' },
          { id: 'co-esg-cii-avg',    label: 'Fleet Average CII Rating' },
          { id: 'co-esg-ghg-target', label: 'GHG Reduction Target' },
          { id: 'co-esg-ghg-base',   label: 'GHG Baseline Year' },
          { id: 'co-esg-strategy',   label: 'Green Shipping Strategy' },
          { id: 'co-esg-altfuel-pct',label: 'Alt-Fuel Fleet % (LNG/Methanol/etc.)' },
          { id: 'co-esg-iso14001',   label: 'ISO 14001 Certified' },
          { id: 'co-esg-envrating',  label: 'Environmental Rating / Score' },
        ]
      },
      {
        id: 'co-esg-social',
        label: 'Social',
        children: [
          { id: 'co-esg-mlc',        label: 'MLC 2006 Compliance' },
          { id: 'co-esg-sire',       label: 'SIRE Inspection Score' },
          { id: 'co-esg-crewwelfare',label: 'Crew Welfare Rating' },
          { id: 'co-esg-diversity',  label: 'Diversity & Inclusion Policy' },
          { id: 'co-esg-community',  label: 'Community Programs' },
          { id: 'co-esg-iso45001',   label: 'ISO 45001 Certified' },
        ]
      },
      {
        id: 'co-esg-governance',
        label: 'Governance',
        children: [
          { id: 'co-esg-boardsize',  label: 'Board Size' },
          { id: 'co-esg-boardindep', label: 'Independent Board Members (%)' },
          { id: 'co-esg-boarddiv',   label: 'Board Diversity (% Female)' },
          { id: 'co-esg-anticorr',   label: 'Anti-Corruption Policy' },
          { id: 'co-esg-whistle',    label: 'Whistleblower Mechanism' },
          { id: 'co-esg-csrreport',  label: 'CSR / Sustainability Report Published' },
          { id: 'co-esg-iso37001',   label: 'ISO 37001 Certified (Anti-Bribery)' },
        ]
      },
    ]
  },
  {
    id: 'co-history',
    label: 'Historical Events',
    children: [
      {
        id: 'co-hist-name',
        label: 'Name Changes',
        children: [
          { id: 'co-hist-prevname1',      label: 'Previous Name 1' },
          { id: 'co-hist-prevname1-date', label: 'Previous Name 1 Effective Date' },
          { id: 'co-hist-prevname2',      label: 'Previous Name 2' },
          { id: 'co-hist-prevname2-date', label: 'Previous Name 2 Effective Date' },
        ]
      },
      {
        id: 'co-hist-ownership',
        label: 'Ownership Changes',
        children: [
          { id: 'co-hist-own1-date',  label: 'Last Ownership Change Date' },
          { id: 'co-hist-own1-from',  label: 'Previous Owner Name' },
          { id: 'co-hist-own2-date',  label: 'Ownership Change -2 Date' },
          { id: 'co-hist-own2-from',  label: 'Ownership Change -2 From' },
        ]
      },
      {
        id: 'co-hist-ma',
        label: 'M&A Activity',
        children: [
          { id: 'co-ma-type',         label: 'Last M&A Event Type' },
          { id: 'co-ma-date',         label: 'M&A Event Date' },
          { id: 'co-ma-counterparty', label: 'M&A Counterparty' },
          { id: 'co-ma-value',        label: 'M&A Transaction Value (USD)' },
          { id: 'co-ma-notes',        label: 'M&A Notes' },
          { id: 'co-insol-date',      label: 'Insolvency / Administration Date' },
          { id: 'co-insol-type',      label: 'Insolvency Type' },
          { id: 'co-insol-status',    label: 'Insolvency Status' },
        ]
      },
    ]
  },
]

export function flattenAllCompany(nodes, path = []) {
  const results = []
  for (const n of nodes) {
    if (n.children) {
      results.push(...flattenAllCompany(n.children, [...path, n.label]))
    } else {
      results.push({ ...n, path: [...path, n.label] })
    }
  }
  return results
}
