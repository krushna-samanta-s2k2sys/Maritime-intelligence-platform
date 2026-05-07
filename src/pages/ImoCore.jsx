import { useState, useMemo } from 'react';

const RECORDS = [
  {
    imo: '9234567',
    name: 'MT NORDIC STAR',
    type: 'Tanker',
    status: 'Active',
    flag: 'Norway',
    built: 2008,
    changes: 5,
    owner: 'Nordic Tankers AS',
    benefOwner: 'Nordic Capital Group',
    classSoc: 'DNV GL',
    gt: 81204,
    dwt: 159800,
    loa: 274.0,
    beam: 48.0,
    draught: 17.0,
    engine: 'MAN B&W 7S80ME-C9.2',
    power: 20580,
    speed: 15.4,
    nameHistory: [
      { val: 'OSLO SPIRIT', valid_from: '2008-03-15', valid_to: '2012-06-20', transaction_time: '2012-06-21T09:14:22Z', source: 'Lloyd\'s Register' },
      { val: 'NORDIC SUN', valid_from: '2012-06-20', valid_to: '2019-11-03', transaction_time: '2019-11-04T14:32:11Z', source: 'IHS Markit' },
      { val: 'NORDIC STAR', valid_from: '2019-11-03', valid_to: '9999-12-31', transaction_time: '2019-11-05T08:17:44Z', source: 'IMO GISIS' },
    ],
    flagHistory: [
      { val: 'Marshall Islands', valid_from: '2008-03-15', valid_to: '2011-04-18', transaction_time: '2011-04-19T11:02:33Z', source: 'Flag State Registry' },
      { val: 'Panama', valid_from: '2011-04-18', valid_to: '2019-11-03', transaction_time: '2019-11-04T14:32:11Z', source: 'Panama Registry' },
      { val: 'Norway', valid_from: '2019-11-03', valid_to: '9999-12-31', transaction_time: '2019-11-05T08:17:44Z', source: 'Norwegian Maritime Authority' },
    ],
    ownerHistory: [
      { val: 'Oslo Shipping AS', valid_from: '2008-03-15', valid_to: '2015-07-22', transaction_time: '2015-07-23T10:11:05Z', source: 'Lloyd\'s Register' },
      { val: 'Nordic Tankers AS', valid_from: '2015-07-22', valid_to: '9999-12-31', transaction_time: '2015-07-24T09:30:00Z', source: 'IHS Markit' },
    ],
    benefOwnerHistory: [
      { val: 'Scandinavian Maritime Holdings', valid_from: '2008-03-15', valid_to: '2019-11-03', transaction_time: '2019-11-04T14:32:11Z', source: 'Beneficial Ownership DB' },
      { val: 'Nordic Capital Group', valid_from: '2019-11-03', valid_to: '9999-12-31', transaction_time: '2019-11-05T08:17:44Z', source: 'Beneficial Ownership DB' },
    ],
    classSocHistory: [
      { val: 'Bureau Veritas', valid_from: '2008-03-15', valid_to: '2014-09-30', transaction_time: '2014-10-01T12:00:00Z', source: 'BV Registry' },
      { val: 'DNV GL', valid_from: '2014-09-30', valid_to: '9999-12-31', transaction_time: '2014-10-02T08:45:00Z', source: 'DNV GL Registry' },
    ],
    formerNames: ['OSLO SPIRIT', 'NORDIC SUN'],
    changeSummary: { name: 2, flag: 2, owner: 1, beneficial: 1, class: 1 },
  },
  {
    imo: '9112233',
    name: 'MT IRAN DELIGHT',
    type: 'Tanker',
    status: 'Sanctioned',
    flag: 'Panama',
    built: 2003,
    changes: 7,
    owner: 'National Iranian Tanker Co.',
    benefOwner: 'National Iranian Oil Co.',
    classSoc: 'IRISL Classification',
    gt: 79800,
    dwt: 157200,
    loa: 270.0,
    beam: 46.0,
    draught: 16.8,
    engine: 'B&W 6S70MC',
    power: 18660,
    speed: 14.8,
    nameHistory: [
      { val: 'IRAN DELIGHT', valid_from: '2003-08-10', valid_to: '2012-03-14', transaction_time: '2012-03-15T07:22:11Z', source: 'Lloyd\'s Register' },
      { val: 'DELIGHT', valid_from: '2012-03-14', valid_to: '2018-09-22', transaction_time: '2018-09-23T14:05:33Z', source: 'IHS Markit' },
      { val: 'NATIONAL IRANIAN 14', valid_from: '2018-09-22', valid_to: '9999-12-31', transaction_time: '2018-09-24T09:00:00Z', source: 'OFAC Designation' },
    ],
    flagHistory: [
      { val: 'Iran', valid_from: '2003-08-10', valid_to: '2012-03-14', transaction_time: '2012-03-15T07:22:11Z', source: 'Flag State Registry' },
      { val: 'Malta', valid_from: '2012-03-14', valid_to: '2016-11-30', transaction_time: '2016-12-01T10:30:00Z', source: 'Malta Registry' },
      { val: 'Panama', valid_from: '2016-11-30', valid_to: '9999-12-31', transaction_time: '2016-12-02T08:00:00Z', source: 'Panama Registry' },
    ],
    ownerHistory: [
      { val: 'NITC (National Iranian Tanker Co.)', valid_from: '2003-08-10', valid_to: '2012-03-14', transaction_time: '2012-03-15T07:22:11Z', source: 'Lloyd\'s Register' },
      { val: 'Delmare Shipping Ltd', valid_from: '2012-03-14', valid_to: '2018-09-22', transaction_time: '2018-09-23T14:05:33Z', source: 'IHS Markit' },
      { val: 'National Iranian Tanker Co.', valid_from: '2018-09-22', valid_to: '9999-12-31', transaction_time: '2018-09-24T09:00:00Z', source: 'OFAC Designation' },
    ],
    benefOwnerHistory: [
      { val: 'National Iranian Oil Co.', valid_from: '2003-08-10', valid_to: '9999-12-31', transaction_time: '2018-09-24T09:00:00Z', source: 'OFAC SDN List' },
    ],
    classSocHistory: [
      { val: 'Lloyd\'s Register', valid_from: '2003-08-10', valid_to: '2012-03-14', transaction_time: '2012-03-15T07:22:11Z', source: 'LR Registry' },
      { val: 'IRISL Classification', valid_from: '2012-03-14', valid_to: '9999-12-31', transaction_time: '2012-03-16T10:00:00Z', source: 'IRISL' },
    ],
    formerNames: ['IRAN DELIGHT', 'DELIGHT'],
    changeSummary: { name: 2, flag: 2, owner: 2, beneficial: 0, class: 1 },
  },
  {
    imo: '9345678',
    name: 'MV OCEAN PIONEER',
    type: 'Bulk Carrier',
    status: 'Active',
    flag: 'Greece',
    built: 2011,
    changes: 3,
    owner: 'Pioneer Bulk Carriers Ltd',
    benefOwner: 'Ocean Holdings SA',
    classSoc: 'Bureau Veritas',
    gt: 43250,
    dwt: 76800,
    loa: 228.9,
    beam: 32.3,
    draught: 14.4,
    engine: 'MAN B&W 6S50MC-C8',
    power: 11060,
    speed: 14.5,
    nameHistory: [
      { val: 'OCEAN PIONEER', valid_from: '2011-04-22', valid_to: '9999-12-31', transaction_time: '2011-04-23T11:00:00Z', source: 'IMO GISIS' },
    ],
    flagHistory: [
      { val: 'Liberia', valid_from: '2011-04-22', valid_to: '2017-08-14', transaction_time: '2017-08-15T09:00:00Z', source: 'Liberia Registry' },
      { val: 'Greece', valid_from: '2017-08-14', valid_to: '9999-12-31', transaction_time: '2017-08-15T09:00:00Z', source: 'Hellenic Registry' },
    ],
    ownerHistory: [
      { val: 'Atlantic Bulk Carriers', valid_from: '2011-04-22', valid_to: '2020-02-01', transaction_time: '2020-02-02T08:30:00Z', source: 'IHS Markit' },
      { val: 'Pioneer Bulk Carriers Ltd', valid_from: '2020-02-01', valid_to: '9999-12-31', transaction_time: '2020-02-02T08:30:00Z', source: 'IHS Markit' },
    ],
    benefOwnerHistory: [
      { val: 'Ocean Holdings SA', valid_from: '2011-04-22', valid_to: '9999-12-31', transaction_time: '2020-02-02T08:30:00Z', source: 'Beneficial Ownership DB' },
    ],
    classSocHistory: [
      { val: 'Bureau Veritas', valid_from: '2011-04-22', valid_to: '9999-12-31', transaction_time: '2011-04-23T11:00:00Z', source: 'BV Registry' },
    ],
    formerNames: [],
    changeSummary: { name: 0, flag: 1, owner: 1, beneficial: 0, class: 0 },
  },
  {
    imo: '9456789',
    name: 'MT AEGEAN GLORY',
    type: 'Tanker',
    status: 'Active',
    flag: 'Marshall Islands',
    built: 2014,
    changes: 2,
    owner: 'Aegean Marine SA',
    benefOwner: 'Aegean Capital Group',
    classSoc: 'American Bureau of Shipping',
    gt: 62440,
    dwt: 115000,
    loa: 250.0,
    beam: 44.0,
    draught: 15.8,
    engine: 'MAN B&W 6G70ME-C9.5',
    power: 15820,
    speed: 15.1,
    nameHistory: [
      { val: 'AEGEAN GLORY', valid_from: '2014-07-18', valid_to: '9999-12-31', transaction_time: '2014-07-19T10:00:00Z', source: 'IMO GISIS' },
    ],
    flagHistory: [
      { val: 'Bahamas', valid_from: '2014-07-18', valid_to: '2021-03-10', transaction_time: '2021-03-11T08:00:00Z', source: 'Bahamas Registry' },
      { val: 'Marshall Islands', valid_from: '2021-03-10', valid_to: '9999-12-31', transaction_time: '2021-03-11T08:00:00Z', source: 'RMMI' },
    ],
    ownerHistory: [
      { val: 'Aegean Marine SA', valid_from: '2014-07-18', valid_to: '9999-12-31', transaction_time: '2014-07-19T10:00:00Z', source: 'IHS Markit' },
    ],
    benefOwnerHistory: [
      { val: 'Aegean Capital Group', valid_from: '2014-07-18', valid_to: '9999-12-31', transaction_time: '2014-07-19T10:00:00Z', source: 'Beneficial Ownership DB' },
    ],
    classSocHistory: [
      { val: 'American Bureau of Shipping', valid_from: '2014-07-18', valid_to: '9999-12-31', transaction_time: '2014-07-19T10:00:00Z', source: 'ABS Registry' },
    ],
    formerNames: [],
    changeSummary: { name: 0, flag: 1, owner: 0, beneficial: 0, class: 0 },
  },
  {
    imo: '9778899',
    name: 'MT NORTHERN GHOST',
    type: 'Tanker',
    status: 'AIS Dark',
    flag: 'St Kitts & Nevis',
    built: 2006,
    changes: 6,
    owner: 'Northsea Trading Ltd',
    benefOwner: 'Unknown',
    classSoc: 'Russian Maritime Register',
    gt: 80100,
    dwt: 158400,
    loa: 272.0,
    beam: 46.0,
    draught: 16.9,
    engine: 'B&W 7S70MC-C',
    power: 18810,
    speed: 14.9,
    nameHistory: [
      { val: 'ARCTIC PIONEER', valid_from: '2006-05-30', valid_to: '2014-08-17', transaction_time: '2014-08-18T07:00:00Z', source: 'Lloyd\'s Register' },
      { val: 'VLADIVOSTOK', valid_from: '2014-08-17', valid_to: '2022-01-14', transaction_time: '2022-01-15T09:00:00Z', source: 'IHS Markit' },
      { val: 'SOKOL', valid_from: '2022-01-14', valid_to: '2023-11-08', transaction_time: '2023-11-09T06:30:00Z', source: 'OFAC SDN List' },
      { val: 'NORTHERN GHOST', valid_from: '2023-11-08', valid_to: '9999-12-31', transaction_time: '2023-11-10T11:00:00Z', source: 'AIS Monitoring' },
    ],
    flagHistory: [
      { val: 'Russia', valid_from: '2006-05-30', valid_to: '2014-08-17', transaction_time: '2014-08-18T07:00:00Z', source: 'Russian Maritime Registry' },
      { val: 'St Kitts & Nevis', valid_from: '2014-08-17', valid_to: '9999-12-31', transaction_time: '2014-08-18T07:00:00Z', source: 'SKN Registry' },
    ],
    ownerHistory: [
      { val: 'Sovcomflot', valid_from: '2006-05-30', valid_to: '2014-08-17', transaction_time: '2014-08-18T07:00:00Z', source: 'Lloyd\'s Register' },
      { val: 'Northsea Energy Ltd', valid_from: '2014-08-17', valid_to: '2022-09-30', transaction_time: '2022-10-01T08:00:00Z', source: 'IHS Markit' },
      { val: 'Northsea Trading Ltd', valid_from: '2022-09-30', valid_to: '9999-12-31', transaction_time: '2022-10-02T10:00:00Z', source: 'IHS Markit' },
    ],
    benefOwnerHistory: [
      { val: 'Sovcomflot (State-owned)', valid_from: '2006-05-30', valid_to: '2014-08-17', transaction_time: '2014-08-18T07:00:00Z', source: 'Beneficial Ownership DB' },
      { val: 'Unknown', valid_from: '2014-08-17', valid_to: '9999-12-31', transaction_time: '2022-10-02T10:00:00Z', source: 'Investigation' },
    ],
    classSocHistory: [
      { val: 'Russian Maritime Register', valid_from: '2006-05-30', valid_to: '9999-12-31', transaction_time: '2006-05-31T08:00:00Z', source: 'RS Registry' },
    ],
    formerNames: ['ARCTIC PIONEER', 'VLADIVOSTOK', 'SOKOL'],
    changeSummary: { name: 3, flag: 1, owner: 2, beneficial: 1, class: 0 },
  },
];

const FIELD_TABS = [
  { key: 'name', label: 'Vessel Name' },
  { key: 'flag', label: 'Flag State' },
  { key: 'owner', label: 'Registered Owner' },
  { key: 'benefOwner', label: 'Beneficial Owner' },
  { key: 'classSoc', label: 'Classification Society' },
];

const HISTORY_KEYS = {
  name: 'nameHistory',
  flag: 'flagHistory',
  owner: 'ownerHistory',
  benefOwner: 'benefOwnerHistory',
  classSoc: 'classSocHistory',
};

function statusTag(s) {
  if (s === 'Active') return <span className="tag tG">{s}</span>;
  if (s === 'Sanctioned') return <span className="tag tR">{s}</span>;
  if (s === 'AIS Dark') return <span className="tag tA">{s}</span>;
  return <span className="tag tN">{s}</span>;
}

function fmtDate(d) {
  if (!d || d === '9999-12-31') return 'Present';
  return d;
}

export default function ImoCore() {
  const [srch, setSrch] = useState('');
  const [typFil, setTypFil] = useState('All');
  const [stFil, setStFil] = useState('All');
  const [selImo, setSelImo] = useState(RECORDS[0].imo);
  const [fieldTab, setFieldTab] = useState('name');

  const filtered = useMemo(() => {
    return RECORDS.filter(r => {
      if (srch && !r.name.toLowerCase().includes(srch.toLowerCase()) && !r.imo.includes(srch)) return false;
      if (typFil !== 'All' && r.type !== typFil) return false;
      if (stFil !== 'All' && r.status !== stFil) return false;
      return true;
    });
  }, [srch, typFil, stFil]);

  const selRec = RECORDS.find(r => r.imo === selImo) || RECORDS[0];
  const histKey = HISTORY_KEYS[fieldTab];
  const history = selRec[histKey] || [];

  const sqlQuery = `-- Bi-temporal query: ${FIELD_TABS.find(f => f.key === fieldTab)?.label || ''}
-- IMO: ${selRec.imo} | ${selRec.name}
SELECT
  imo_number,
  ${fieldTab === 'name' ? 'vessel_name' : fieldTab === 'flag' ? 'flag_state' : fieldTab === 'owner' ? 'registered_owner' : fieldTab === 'benefOwner' ? 'beneficial_owner' : 'classification_society'} AS value,
  valid_from,
  valid_to,
  transaction_time,
  data_source
FROM imo_register_history
WHERE imo_number = '${selRec.imo}'
  AND valid_to > CURRENT_DATE          -- valid in real world
  AND transaction_time <= NOW()        -- known as of now
ORDER BY valid_from ASC;`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--bdr)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>IMO Core Registry</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Bi-temporal vessel identity &amp; history tracking</div>
          </div>
          <div className="kpiRow" style={{ gap: 8 }}>
            {[
              { l: 'Total Records', v: '94,281' },
              { l: 'Active', v: '71,440' },
              { l: 'Sanctioned', v: '1,284' },
              { l: 'AIS Dark', v: '847' },
              { l: 'Name Changes', v: '12,841' },
              { l: 'Flag Changes', v: '8,492' },
            ].map(k => (
              <div key={k.l} className="kpi" style={{ minWidth: 80 }}>
                <div className="kpiV">{k.v}</div>
                <div className="kpiL">{k.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 400px', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left: IMO Register List */}
        <div style={{ borderRight: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--bdr)', flexShrink: 0 }}>
            <input
              className="sBar"
              placeholder="Search IMO, vessel name..."
              value={srch}
              onChange={e => setSrch(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="fSel" value={typFil} onChange={e => setTypFil(e.target.value)} style={{ flex: 1 }}>
                <option>All</option>
                <option>Tanker</option>
                <option>Bulk Carrier</option>
                <option>Container</option>
                <option>LNG</option>
              </select>
              <select className="fSel" value={stFil} onChange={e => setStFil(e.target.value)} style={{ flex: 1 }}>
                <option>All</option>
                <option>Active</option>
                <option>Sanctioned</option>
                <option>AIS Dark</option>
              </select>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(r => (
              <div
                key={r.imo}
                onClick={() => setSelImo(r.imo)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--bdr)',
                  cursor: 'pointer',
                  background: selImo === r.imo ? 'var(--selBg, #e8f0fe)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#1a73e8', fontWeight: 600 }}>
                      IMO {r.imo}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginTop: 2 }}>{r.name}</div>
                  </div>
                  <div style={{
                    background: '#1a73e8',
                    color: '#fff',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    minWidth: 20,
                    textAlign: 'center',
                  }}>
                    {r.changes}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="tag tN" style={{ fontSize: 10 }}>{r.type}</span>
                  {statusTag(r.status)}
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{r.flag}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Built {r.built}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No records found</div>
            )}
          </div>
        </div>

        {/* Center: Bi-temporal History Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--bdr)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bdr)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 10 }}>
              Bi-temporal History — {selRec.name}
            </div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bdr)' }}>
              {FIELD_TABS.map(ft => (
                <button
                  key={ft.key}
                  onClick={() => setFieldTab(ft.key)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: fieldTab === ft.key ? 600 : 400,
                    color: fieldTab === ft.key ? '#1a73e8' : 'var(--muted)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: fieldTab === ft.key ? '2px solid #1a73e8' : '2px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* Timeline */}
            <div style={{ position: 'relative', paddingLeft: 24, marginBottom: 24 }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: 8,
                top: 8,
                bottom: 8,
                width: 2,
                background: 'var(--bdr)',
              }} />

              {history.map((entry, i) => {
                const isCurrent = entry.valid_to === '9999-12-31';
                return (
                  <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute',
                      left: -20,
                      top: 14,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: isCurrent ? '#34a853' : '#1a73e8',
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 1px ' + (isCurrent ? '#34a853' : '#1a73e8'),
                    }} />

                    <div style={{
                      background: isCurrent ? '#e8f0fe' : 'var(--panel, #f8f9fa)',
                      border: '1px solid ' + (isCurrent ? '#1a73e8' : 'var(--bdr)'),
                      borderRadius: 6,
                      padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)' }}>{entry.val}</div>
                        {isCurrent && <span className="tag tG" style={{ fontSize: 10 }}>Current</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
                        <div>
                          <span style={{ color: 'var(--muted)' }}>Valid From: </span>
                          <span style={{ color: 'var(--txt)', fontFamily: 'monospace' }}>{entry.valid_from}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--muted)' }}>Valid To: </span>
                          <span style={{ color: 'var(--txt)', fontFamily: 'monospace' }}>{fmtDate(entry.valid_to)}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--muted)' }}>Transaction Time: </span>
                          <span style={{ color: 'var(--txt)', fontFamily: 'monospace', fontSize: 11 }}>{entry.transaction_time}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--muted)' }}>Source: </span>
                          <span style={{ color: 'var(--txt)' }}>{entry.source}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SQL Query Display */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Generated Query
              </div>
              <div style={{
                background: '#1e1e2e',
                borderRadius: 6,
                padding: '14px 16px',
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.7,
                color: '#cdd6f4',
                overflowX: 'auto',
                whiteSpace: 'pre',
              }}>
                {sqlQuery.split('\n').map((line, i) => {
                  let color = '#cdd6f4';
                  if (line.startsWith('--')) color = '#6c7086';
                  else if (/^(SELECT|FROM|WHERE|AND|ORDER BY)/.test(line.trim())) color = '#cba6f7';
                  else if (line.includes("'")) color = '#a6e3a1';
                  return <div key={i} style={{ color }}>{line}</div>;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Entity Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Dark header */}
          <div style={{
            background: '#1e2a3a',
            color: '#e8eaed',
            padding: '14px 16px',
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#8ab4f8', marginBottom: 4 }}>
              IMO {selRec.imo}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{selRec.name}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {statusTag(selRec.status)}
              <span className="tag tN" style={{ fontSize: 10 }}>{selRec.type}</span>
              <span style={{ fontSize: 11, color: '#9aa0a6' }}>{selRec.flag}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginTop: 10, fontSize: 12 }}>
              <div><span style={{ color: '#9aa0a6' }}>Built: </span><span>{selRec.built}</span></div>
              <div><span style={{ color: '#9aa0a6' }}>GT: </span><span>{selRec.gt.toLocaleString()}</span></div>
              <div><span style={{ color: '#9aa0a6' }}>DWT: </span><span>{selRec.dwt.toLocaleString()}</span></div>
              <div><span style={{ color: '#9aa0a6' }}>LOA: </span><span>{selRec.loa}m</span></div>
              <div><span style={{ color: '#9aa0a6' }}>Speed: </span><span>{selRec.speed} kn</span></div>
              <div><span style={{ color: '#9aa0a6' }}>Power: </span><span>{selRec.power.toLocaleString()} kW</span></div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {/* Current Identity */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Current Identity
              </div>
              {[
                { l: 'Vessel Name', v: selRec.name },
                { l: 'Flag State', v: selRec.flag },
                { l: 'Reg. Owner', v: selRec.owner },
                { l: 'Benef. Owner', v: selRec.benefOwner },
                { l: 'Class Society', v: selRec.classSoc },
                { l: 'Engine', v: selRec.engine },
                { l: 'Beam', v: selRec.beam + 'm' },
                { l: 'Draught', v: selRec.draught + 'm' },
              ].map(f => (
                <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--bdr)', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>{f.l}</span>
                  <span style={{ color: 'var(--txt)', fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{f.v}</span>
                </div>
              ))}
            </div>

            {/* Former Names */}
            {selRec.formerNames.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Former Names
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selRec.formerNames.map(n => (
                    <span key={n} style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--bdr)',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: 12,
                      color: 'var(--txt)',
                      fontFamily: 'monospace',
                    }}>{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Change Summary */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Change Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Name Changes', v: selRec.changeSummary.name, c: '#ea4335' },
                  { l: 'Flag Changes', v: selRec.changeSummary.flag, c: '#fbbc04' },
                  { l: 'Owner Changes', v: selRec.changeSummary.owner, c: '#1a73e8' },
                  { l: 'Benef. Changes', v: selRec.changeSummary.beneficial, c: '#9c27b0' },
                  { l: 'Class Changes', v: selRec.changeSummary.class, c: '#0097a7' },
                  { l: 'Total Changes', v: selRec.changes, c: '#34a853' },
                ].map(cs => (
                  <div key={cs.l} style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--bdr)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: cs.c }}>{cs.v}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cs.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Quick Actions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn btnS" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  View Full Audit Trail
                </button>
                <button className="btn btnS" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  Export History (CSV)
                </button>
                <button className="btn btnS" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  Run Compliance Screen
                </button>
                <button className="btn btnT" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  Flag for Review
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
