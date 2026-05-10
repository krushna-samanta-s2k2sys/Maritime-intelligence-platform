import { useState, useMemo, useEffect } from 'react'
import { getFieldDef, COUNTRIES } from '../../data/fieldTypes'
import { dRand } from '../../data/entities'

const TODAY = '2024-01-30'

const SRC_CLS = { IHS:'sIHS', AIS:'sAIS', LR:'sLR', BV:'sBV', DNV:'sDNV', NK:'sNK', KR:'sKR' }
function Src({ s }) {
  const cls = SRC_CLS[s] || 'sIHS'
  return <span className={`src ${cls}`} style={{ fontSize: 8 }}>{s}</span>
}

// ── Value input — renders the right control for the field type ───────────────
function FieldValueInput({ leafId, value, onChange, placeholder }) {
  const def = getFieldDef(leafId)

  if (def.type === 'boolean') {
    return (
      <div className="epBoolGroup">
        {['Yes', 'No', '—'].map(opt => (
          <button
            key={opt}
            className={'epBoolBtn' + (value === opt ? ' on' : '')}
            onClick={() => onChange(opt)}
            type="button"
          >{opt}</button>
        ))}
      </div>
    )
  }

  if (def.type === 'select') {
    return (
      <select
        className="epSelect"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— select —</option>
        {def.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  if (def.type === 'country') {
    return (
      <select
        className="epSelect"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— select country —</option>
        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    )
  }

  if (def.type === 'number') {
    return (
      <div className="epNumWrap">
        <input
          type="number"
          className="epInput"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '0'}
        />
        {def.unit && <span className="epUnit">{def.unit}</span>}
      </div>
    )
  }

  if (def.type === 'date') {
    return (
      <input
        type="date"
        className="epInput epDateNative"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    )
  }

  return (
    <input
      type="text"
      className="epInput"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Enter value…'}
    />
  )
}

// ── Validation message ───────────────────────────────────────────────────────
function ValidationMsg({ leafId, value }) {
  if (!value) return null
  const def = getFieldDef(leafId)
  if (!def.validate) return null
  const err = def.validate(value)
  if (!err) return <span className="epValidOk">✓ Valid</span>
  return <span className="epValidErr">⚠ {err}</span>
}

// ── Bi-temporal preview table ────────────────────────────────────────────────
function BiTemporalPreview({ rows }) {
  if (!rows || rows.length === 0) return null
  return (
    <div className="epPreview">
      <div className="epPreviewHdr">Bi-temporal Preview</div>
      <table className="epPreviewTable">
        <thead>
          <tr>
            <th>Value</th>
            <th>Valid From</th>
            <th>Valid To</th>
            <th>Tx Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.isNew ? 'epNewRow' : 'epOldRow'}>
              <td className="epPreviewVal">{r.val || '—'}</td>
              <td className="epMono">{r.from || '—'}</td>
              <td className="epMono">{r.to || '—'}</td>
              <td className="epMono epTxTime">{r.tx || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Saved flash ──────────────────────────────────────────────────────────────
function SaveFlash({ show }) {
  if (!show) return null
  return <div className="epSaveFlash">✓ Saved to audit log</div>
}

// ── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'history', label: 'History',       icon: '⏱', editOnly: false },
  { id: 'current', label: 'Set Current',   icon: '✎', editOnly: true },
  { id: 'source',  label: 'From Source',   icon: '⊕', editOnly: true },
  { id: 'correct', label: 'Correct Past',  icon: '↺', editOnly: true },
  { id: 'insert',  label: 'Add to History',icon: '+', editOnly: true },
]

// ── Main component ───────────────────────────────────────────────────────────
export default function FieldEditPanel({ vessel, leaf, editMode, curDate, histRows, onClose, onJumpDate }) {

  const [tab, setTab]             = useState('history')
  const [newVal, setNewVal]       = useState('')
  const [valFrom, setValFrom]     = useState(TODAY)
  const [valTo, setValTo]         = useState('')
  const [openEnded, setOpenEnded] = useState(true)
  const [corrFrom, setCorrFrom]   = useState('')
  const [corrTo, setCorrTo]       = useState('')
  const [corrVal, setCorrVal]     = useState('')
  const [corrReason, setCorrReason] = useState('')
  const [insVal, setInsVal]       = useState('')
  const [insFrom, setInsFrom]     = useState('')
  const [insTo, setInsTo]         = useState('')
  const [insOpen, setInsOpen]     = useState(false)
  const [saved, setSaved]         = useState(false)

  // Reset state when the leaf changes or edit mode toggles
  useEffect(() => {
    setTab(editMode ? 'current' : 'history')
    setNewVal('')
    setCorrFrom(''); setCorrTo(''); setCorrVal(''); setCorrReason('')
    setInsVal(''); setInsFrom(''); setInsTo('')
    setSaved(false)
  }, [leaf?.id, editMode])

  // Vendor source rows (simulated from seed)
  const vendorRows = useMemo(() => {
    if (!vessel || !leaf) return []
    const curVal = histRows?.[0]?.val || '—'
    const seed = leaf.id + vessel.imo
    const vendors = [
      { key: 'IHS',     label: 'IHS Fairplay',   badgeCls: 'sIHS', coverage: 0.95 },
      { key: 'AIS',     label: 'AIS / MarAIS',    badgeCls: 'sAIS', coverage: 0.65 },
      { key: 'EQUASIS', label: 'Equasis',          badgeCls: 'sDNV', coverage: 0.70 },
      { key: 'GISIS',   label: 'IMO GISIS',        badgeCls: 'sLR',  coverage: 0.50 },
    ]
    return vendors.map(v => {
      const hasCoverage = dRand('cov' + v.key + seed) < v.coverage
      if (!hasCoverage) return { ...v, val: '—', hasData: false, matches: false, score: 0, asOf: '' }
      const conflictR = dRand('cfl' + v.key + seed)
      const val = conflictR < 0.12 ? '(differs)' : curVal
      const matches = val === curVal
      const score = matches
        ? 0.90 + dRand('sc' + v.key + seed) * 0.10
        : 0.45 + dRand('sc2' + v.key + seed) * 0.30
      const day = String(Math.floor(dRand('ts' + v.key + seed) * 20) + 5).padStart(2, '0')
      return { ...v, val, hasData: true, matches, score, asOf: `2024-01-${day}` }
    })
  }, [vessel, leaf, histRows])

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!leaf) {
    return (
      <div className="epEmpty">
        <div className="epEmptyIcon">⏱</div>
        <div className="epEmptyTitle">Attribute History</div>
        <div className="epEmptySub">
          {editMode
            ? 'Click any attribute to view history and edit options'
            : 'Click any attribute to view bi-temporal change history and audit trail'}
        </div>
      </div>
    )
  }

  const def = getFieldDef(leaf.id)
  const currentVal = histRows?.[0]?.val || '—'
  const visibleTabs = TABS.filter(t => !t.editOnly || editMode)

  return (
    <div className="ep">

      {/* ── Header ── */}
      <div className="epHdr">
        <div className="epHdrInfo">
          <div className="epHdrLabel">{leaf.label}</div>
          <div className="epHdrMeta">
            <span className="epHdrCurrentVal">{currentVal}</span>
            <span className="epFieldTypeBadge">{def.type}</span>
          </div>
        </div>
        <button className="epClose" onClick={onClose} title="Close">✕</button>
      </div>

      {/* ── Tab bar ── */}
      <div className="epTabs">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            className={'epTab' + (tab === t.id ? ' on' : '') + (t.editOnly ? ' epTabEdit' : '')}
            onClick={() => setTab(t.id)}
            type="button"
          >
            <span className="epTabIcon">{t.icon}</span>
            <span className="epTabLabel">{t.label}</span>
          </button>
        ))}
      </div>

      <SaveFlash show={saved} />

      {/* ══════════════════════════════════════════════════════
          TAB: History
      ══════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="epHistBody">
          {histRows && histRows.length > 0 ? (
            histRows.map((h, i) => {
              const isActive = curDate >= h.from && (h.to === null || curDate < h.to)
              return (
                <div
                  key={i}
                  className={'histRow' + (i === 0 ? ' histCur' : '') + (isActive ? ' histActive' : '')}
                  onClick={() => onJumpDate(h.from)}
                  title={`Jump timeline to ${h.from}`}
                >
                  <div className="histVal">{h.val || '—'}</div>
                  <div className="histMeta">
                    <Src s={h.src || 'IHS'} />
                    <span>{h.from} → {h.to || 'Present'}</span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="epNoHistory">No historical records found for this attribute.</div>
          )}

          <div className="sqlBox">
            <div className="sqlBoxHdr"><span className="sqlLabel">BigQuery · Bi-temporal</span></div>
            <div style={{ padding: '0 14px 10px' }}>
              <pre style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:'#98c379', lineHeight:1.6, margin:0 }}>{
`SELECT value, valid_from, valid_to,
  transaction_time
FROM \`sp_maritime.vessel_history\`
WHERE imo = '${vessel.imo}'
  AND attribute = '${leaf.label}'
ORDER BY transaction_time DESC`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Set Current — update the current / latest value
      ══════════════════════════════════════════════════════ */}
      {tab === 'current' && (
        <div className="epBody">
          <div className="epOpDesc">
            Set a new current value. The existing record will be closed at the <em>Valid From</em> date
            and a new open-ended record created.
          </div>

          <div className="epField">
            <label className="epLabel">New Value</label>
            <FieldValueInput leafId={leaf.id} value={newVal} onChange={setNewVal}
              placeholder={`Current: ${currentVal}`} />
            <ValidationMsg leafId={leaf.id} value={newVal} />
          </div>

          <div className="epField">
            <label className="epLabel">Valid From</label>
            <input type="date" className="epInput epDateNative"
              value={valFrom} onChange={e => setValFrom(e.target.value)} />
          </div>

          <div className="epField epFieldInline">
            <label className="epLabel">Valid To</label>
            <label className="epCheckLabel">
              <input type="checkbox" checked={openEnded} onChange={e => setOpenEnded(e.target.checked)} />
              Open-ended (present)
            </label>
            {!openEnded && (
              <input type="date" className="epInput epDateNative"
                value={valTo} onChange={e => setValTo(e.target.value)} />
            )}
          </div>

          <BiTemporalPreview rows={[
            { val: newVal || '(new value)', from: valFrom, to: openEnded ? 'Present' : valTo, tx: 'now (on save)', isNew: true },
            { val: currentVal, from: histRows?.[0]?.from || '—', to: valFrom, tx: histRows?.[0]?.from || '—', isNew: false },
          ]} />

          <div className="epActions">
            <button className="btn btnS btnSm" type="button" onClick={() => setNewVal('')}>Clear</button>
            <button className="btn btnP btnSm" type="button"
              disabled={!newVal} onClick={handleSave}>
              💾 Save to Audit Log
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: From Source — apply a vendor value
      ══════════════════════════════════════════════════════ */}
      {tab === 'source' && (
        <div className="epBody">
          <div className="epOpDesc">
            Review values from available data sources. Click <strong>Apply</strong> to pre-fill
            the <em>Set Current</em> form with that value.
          </div>

          <div className="epSourceList">
            {vendorRows.map(v => (
              <div key={v.key} className={'epSourceRow' + (!v.hasData ? ' epSourceMiss' : '')}>
                <div className="epSourceLeft">
                  <span className={`src ${v.badgeCls}`} style={{ fontSize: 9, flexShrink: 0 }}>{v.key}</span>
                  <div className="epSourceInfo">
                    <div className="epSourceLabel">{v.label}</div>
                    {v.hasData
                      ? <div className={'epSourceVal' + (!v.matches ? ' epSourceDiff' : '')}>{v.val}</div>
                      : <div className="epSourceNoData">No data available</div>}
                  </div>
                </div>

                {v.hasData && (
                  <div className="epSourceRight">
                    <div className="epSourceScoreBar">
                      <div className="epScoreTrack">
                        <div className="epScoreFill" style={{
                          width: Math.round(v.score * 100) + '%',
                          background: v.score >= 0.9 ? 'var(--green)' : v.score >= 0.7 ? 'var(--amber)' : 'var(--red)'
                        }} />
                      </div>
                      <span className="epScoreNum"
                        style={{ color: v.score >= 0.9 ? 'var(--green)' : v.score >= 0.7 ? 'var(--amber)' : 'var(--red)' }}>
                        {Math.round(v.score * 100)}%
                      </span>
                    </div>
                    <div className="epSourceAs">{v.asOf}</div>
                    <button
                      className={'epApplyBtn' + (v.matches ? ' epApplyMatch' : ' epApplyDiff')}
                      type="button"
                      onClick={() => { setNewVal(v.val); setTab('current') }}
                    >
                      {v.matches ? '✓ Match' : '⊕ Apply'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Correct Past — fix a historical period
      ══════════════════════════════════════════════════════ */}
      {tab === 'correct' && (
        <div className="epBody">
          <div className="epOpDesc">
            Correct a value in a past period. The original record is kept in the audit log with
            your correction layered on top (AS-OF correction).
          </div>

          <div className="epField">
            <label className="epLabel">Period to Correct</label>
            <div className="epDateGroup">
              <input type="date" className="epInput epDateNative epDateHalf"
                value={corrFrom} onChange={e => setCorrFrom(e.target.value)} />
              <span className="epDateArrow">→</span>
              <input type="date" className="epInput epDateNative epDateHalf"
                value={corrTo} onChange={e => setCorrTo(e.target.value)} />
            </div>
            {histRows && histRows.length > 0 && (
              <div className="epHintRow">
                <span className="epHintLbl">Quick-pick existing period:</span>
                {histRows.slice(0, 5).map((h, i) => (
                  <button key={i} className="epPeriodChip" type="button"
                    onClick={() => { setCorrFrom(h.from); setCorrTo(h.to || TODAY) }}>
                    {h.from.slice(0, 7)} → {h.to ? h.to.slice(0, 7) : 'now'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="epField">
            <label className="epLabel">Corrected Value</label>
            <FieldValueInput leafId={leaf.id} value={corrVal} onChange={setCorrVal} />
            <ValidationMsg leafId={leaf.id} value={corrVal} />
          </div>

          <div className="epField">
            <label className="epLabel">Reason <span className="epOptional">(optional)</span></label>
            <input type="text" className="epInput"
              value={corrReason} onChange={e => setCorrReason(e.target.value)}
              placeholder="e.g. Data entry error, source discrepancy…" />
          </div>

          {corrFrom && corrTo && corrVal && (
            <BiTemporalPreview rows={[
              { val: corrVal, from: corrFrom, to: corrTo, tx: 'now (on save)', isNew: true },
            ]} />
          )}

          <div className="epActions">
            <button className="btn btnS btnSm" type="button"
              onClick={() => { setCorrFrom(''); setCorrTo(''); setCorrVal(''); setCorrReason('') }}>
              Clear
            </button>
            <button className="btn btnP btnSm" type="button"
              disabled={!corrFrom || !corrTo || !corrVal} onClick={handleSave}>
              💾 Save Correction
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Add to History — insert a new historical record
      ══════════════════════════════════════════════════════ */}
      {tab === 'insert' && (
        <div className="epBody">
          <div className="epOpDesc">
            Insert a new record into the attribute history for a specific period.
            Use this to fill in missing data or back-fill a known past value.
          </div>

          <div className="epField">
            <label className="epLabel">Value</label>
            <FieldValueInput leafId={leaf.id} value={insVal} onChange={setInsVal} />
            <ValidationMsg leafId={leaf.id} value={insVal} />
          </div>

          <div className="epField">
            <label className="epLabel">Valid From</label>
            <input type="date" className="epInput epDateNative"
              value={insFrom} onChange={e => setInsFrom(e.target.value)} />
          </div>

          <div className="epField epFieldInline">
            <label className="epLabel">Valid To</label>
            <label className="epCheckLabel">
              <input type="checkbox" checked={insOpen} onChange={e => setInsOpen(e.target.checked)} />
              Open-ended (present)
            </label>
            {!insOpen && (
              <input type="date" className="epInput epDateNative"
                value={insTo} onChange={e => setInsTo(e.target.value)} />
            )}
          </div>

          {insVal && insFrom && (
            <BiTemporalPreview rows={[
              { val: insVal, from: insFrom, to: insOpen ? 'Present' : insTo, tx: 'now (on save)', isNew: true },
            ]} />
          )}

          <div className="epActions">
            <button className="btn btnS btnSm" type="button"
              onClick={() => { setInsVal(''); setInsFrom(''); setInsTo('') }}>
              Clear
            </button>
            <button className="btn btnP btnSm" type="button"
              disabled={!insVal || !insFrom} onClick={handleSave}>
              💾 Insert Record
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
