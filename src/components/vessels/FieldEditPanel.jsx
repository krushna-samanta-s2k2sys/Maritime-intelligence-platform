import { useState, useMemo, useEffect, useRef } from 'react'
import { getFieldDef, COUNTRIES, simulateVendorDiff } from '../../data/fieldTypes'
import { dRand } from '../../data/entities'

const TODAY = '2024-01-30'

const SRC_CLS = { IHS:'sIHS', AIS:'sAIS', LR:'sLR', BV:'sBV', DNV:'sDNV', NK:'sNK', KR:'sKR' }
function Src({ s }) {
  return <span className={`src ${SRC_CLS[s] || 'sIHS'}`} style={{ fontSize: 8 }}>{s}</span>
}

// ── File upload zone ─────────────────────────────────────────────────────────
function FileUploadZone({ files, setFiles }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  function handleFiles(fileList) {
    const year = new Date().getFullYear()
    const arr = Array.from(fileList).map(f => {
      const ts = Date.now()
      const icon = f.type.startsWith('image/') ? '🖼' : '📄'
      return {
        name: f.name,
        size: f.size,
        type: f.type,
        icon,
        bucket: `s3://maritime-data-assets/edits/${year}/${ts}-${f.name}`,
      }
    })
    setFiles(prev => [...prev, ...arr])
  }

  return (
    <div>
      <div
        className={`epUploadZone${drag ? ' epUploadDrag' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        <span className="epUploadIcon">📎</span>
        <span className="epUploadText">Drop files or click to upload</span>
        <span className="epUploadSub">Images, PDF, CSV, Excel, Word</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          accept="image/*,.pdf,.csv,.xlsx,.xls,.doc,.docx"
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>
      {files.length > 0 && (
        <div className="epUploadList">
          {files.map((f, i) => (
            <div key={i} className="epUploadFile">
              <span className="epUploadFileIcon">{f.icon}</span>
              <div className="epUploadFileInfo">
                <span className="epUploadFileName">{f.name}</span>
                <span className="epUploadFileMeta">{(f.size / 1024).toFixed(1)} KB</span>
                <span className="epUploadBucket">{f.bucket}</span>
              </div>
              <button
                className="epUploadFileRemove"
                type="button"
                onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Multi-value tag input ────────────────────────────────────────────────────
function MultiValueInput({ options, value, onChange }) {
  const selected = Array.isArray(value) ? value : []
  const [search, setSearch] = useState('')

  function toggle(opt) {
    onChange(selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt])
  }

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div className="epMulti">
      {selected.length > 0 && (
        <div className="epMultiTags">
          {selected.map(v => (
            <span key={v} className="epMultiTag">
              {v}
              <button className="epMultiTagX" type="button" onClick={() => toggle(v)}>✕</button>
            </span>
          ))}
        </div>
      )}
      {options.length > 6 && (
        <input
          className="epInput epMultiSearch"
          placeholder="Filter options…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}
      <div className="epMultiOpts">
        {filtered.map(opt => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              className={'epMultiOpt' + (on ? ' on' : '')}
              onClick={() => toggle(opt)}
            >
              <span className={'epMultiChk' + (on ? ' on' : '')}>{on ? '✓' : ''}</span>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
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

  if (def.type === 'multivalue') {
    return <MultiValueInput options={def.options || []} value={value} onChange={onChange} />
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

  if (def.type === 'datetime') {
    return (
      <input
        type="datetime-local"
        className="epInput epDateNative"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    )
  }

  if (def.type === 'textarea') {
    return (
      <textarea
        className="epInput epTextarea"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Enter text…'}
        rows={3}
      />
    )
  }

  if (def.type === 'email') {
    return (
      <input
        type="email"
        className="epInput"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'name@example.com'}
      />
    )
  }

  if (def.type === 'url') {
    return (
      <input
        type="url"
        className="epInput"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'https://…'}
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
  if (!value || (Array.isArray(value) && value.length === 0)) return null
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
              <td className="epPreviewVal">{Array.isArray(r.val) ? r.val.join(', ') : (r.val || '—')}</td>
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

function emptyVal(def) {
  if (def.type === 'boolean')    return '—'
  if (def.type === 'multivalue') return []
  return ''
}

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
  const [pickedVendor, setPickedVendor] = useState(null)

  // Reason + file upload shared across edit tabs
  const [reason, setReason]             = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])

  const def = leaf ? getFieldDef(leaf.id) : { type: 'text' }

  // Reset state when the leaf changes or edit mode toggles
  useEffect(() => {
    setTab(editMode ? 'current' : 'history')
    setNewVal(emptyVal(def))
    setCorrFrom(''); setCorrTo(''); setCorrVal(emptyVal(def)); setCorrReason('')
    setInsVal(emptyVal(def)); setInsFrom(''); setInsTo('')
    setSaved(false); setPickedVendor(null)
    setReason(''); setUploadedFiles([])
  }, [leaf?.id, editMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync timeline position when the active edit tab changes
  useEffect(() => {
    if (tab === 'current')              onJumpDate(TODAY)
    else if (tab === 'correct' && corrFrom) onJumpDate(corrFrom)
    else if (tab === 'insert'  && insFrom)  onJumpDate(insFrom)
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Vendor source rows (simulated from seed)
  const vendorRows = useMemo(() => {
    if (!vessel || !leaf) return []
    const curVal = histRows?.[0]?.val || '—'
    const seed = leaf.id + vessel.imo
    const vendors = [
      { key: 'IHS',     label: 'IHS Fairplay',  badgeCls: 'sIHS', coverage: 0.95 },
      { key: 'AIS',     label: 'AIS / MarAIS',   badgeCls: 'sAIS', coverage: 0.65 },
      { key: 'EQUASIS', label: 'Equasis',         badgeCls: 'sDNV', coverage: 0.70 },
      { key: 'GISIS',   label: 'IMO GISIS',       badgeCls: 'sLR',  coverage: 0.50 },
    ]
    return vendors.map(v => {
      const hasCoverage = dRand('cov' + v.key + seed) < v.coverage
      if (!hasCoverage) return { ...v, val: '—', hasData: false, matches: false, score: 0, asOf: '' }
      const conflictR = dRand('cfl' + v.key + seed)
      const val = conflictR < 0.12
        ? simulateVendorDiff(curVal, leaf.id, v.key + seed, dRand)
        : curVal
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

  function hasValue(v) {
    if (Array.isArray(v)) return v.length > 0
    return v && v !== '—' && v.trim() !== ''
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

  const currentVal = histRows?.[0]?.val || '—'
  const visibleTabs = TABS.filter(t => !t.editOnly || editMode)

  const fieldTypeLabelMap = {
    text: 'Text', textarea: 'Text', number: 'Number', select: 'Dropdown',
    boolean: 'Boolean', date: 'Date', datetime: 'Date & Time',
    country: 'Country', multivalue: 'Multi-select', email: 'Email', url: 'URL',
  }

  const saveDisabled =
    tab === 'current' ? !hasValue(newVal) :
    tab === 'correct' ? !corrFrom || !corrTo || !hasValue(corrVal) :
    tab === 'insert'  ? !hasValue(insVal) || !insFrom :
    true

  const saveLabel =
    tab === 'correct' ? '💾 Save Correction' :
    tab === 'insert'  ? '💾 Insert Record'   :
    '💾 Save'

  function handleClear() {
    if (tab === 'current') { setNewVal(emptyVal(def)); setPickedVendor(null) }
    if (tab === 'correct') { setCorrFrom(''); setCorrTo(''); setCorrVal(emptyVal(def)); setCorrReason('') }
    if (tab === 'insert')  { setInsVal(emptyVal(def)); setInsFrom(''); setInsTo('') }
    setReason(''); setUploadedFiles([])
  }

  const showHdrActions = editMode && ['current', 'correct', 'insert'].includes(tab)

  return (
    <div className="ep">

      {/* ── Header ── */}
      <div className="epHdr">
        <div className="epHdrInfo">
          <div className="epHdrLabel">{leaf.label}</div>
          <div className="epHdrMeta">
            <span className="epHdrCurrentVal" title="Current value">{
              Array.isArray(currentVal) ? currentVal.join(', ') : currentVal
            }</span>
            <span className="epFieldTypeBadge">{fieldTypeLabelMap[def.type] || def.type}</span>
            {def.unit && <span className="epFieldTypeBadge" style={{background:'#f0f4ff',color:'#555'}}>{def.unit}</span>}
          </div>
        </div>
        {showHdrActions && (
          <div className="epHdrActions">
            <button className="btn btnS btnSm" type="button" onClick={handleClear}>Clear</button>
            <button className="btn btnP btnSm" type="button" disabled={saveDisabled} onClick={handleSave}>{saveLabel}</button>
          </div>
        )}
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
                  <div className="histVal">{Array.isArray(h.val) ? h.val.join(', ') : (h.val || '—')}</div>
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

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Set Current — update the current / latest value
      ══════════════════════════════════════════════════════ */}
      {tab === 'current' && (
        <>
          <div className="epBody">
            <div className="epOpDesc">
              Set a new current value. The existing record will be closed at the <em>Valid From</em> date
              and a new open-ended record created.
            </div>

            <div className="epField">
              <label className="epLabel">New Value</label>
              <FieldValueInput leafId={leaf.id} value={newVal} onChange={setNewVal}
                placeholder={`Current: ${Array.isArray(currentVal) ? currentVal.join(', ') : currentVal}`} />
              <ValidationMsg leafId={leaf.id} value={newVal} />
            </div>

            {/* Vendor suggestions inline */}
            {vendorRows.some(v => v.hasData) && (
              <div className="epField">
                <label className="epLabel">Use Vendor Value</label>
                <div className="epVendorPicker">
                  {vendorRows.filter(v => v.hasData).map(v => {
                    const isPicked = pickedVendor === v.key
                    return (
                      <button
                        key={v.key}
                        type="button"
                        className={'epVendorChip' + (isPicked ? ' on' : '') + (!v.matches ? ' epVendorDiff' : '')}
                        onClick={() => { setPickedVendor(v.key); setNewVal(v.val) }}
                        title={`${v.label} · as of ${v.asOf} · confidence ${Math.round(v.score * 100)}%`}
                      >
                        <span className={`src ${v.badgeCls}`} style={{ fontSize: 8 }}>{v.key}</span>
                        <span className="epVendorChipVal">{v.val}</span>
                        <span className="epVendorChipScore" style={{
                          color: v.score >= 0.9 ? 'var(--green)' : v.score >= 0.7 ? 'var(--amber)' : 'var(--red)'
                        }}>{Math.round(v.score * 100)}%</span>
                        {!v.matches && <span className="epVendorDiffDot" title="Differs from master" />}
                      </button>
                    )
                  })}
                </div>
                {pickedVendor && (
                  <div className="epVendorHint">
                    Value pre-filled from <strong>{vendorRows.find(v => v.key === pickedVendor)?.label}</strong> · edit above if needed
                  </div>
                )}
              </div>
            )}

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

            <div className="epField">
              <label className="epLabel">Reason / Explanation</label>
              <textarea
                className="epInput epTextarea"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why this value is being set (e.g. updated from official registry, corrected from source discrepancy)…"
                rows={3}
              />
            </div>

            <div className="epField">
              <label className="epLabel">Supporting Documents</label>
              <FileUploadZone files={uploadedFiles} setFiles={setUploadedFiles} />
            </div>

            <BiTemporalPreview rows={[
              { val: newVal || '(new value)', from: valFrom, to: openEnded ? 'Present' : valTo, tx: 'now (on save)', isNew: true },
              { val: currentVal, from: histRows?.[0]?.from || '—', to: valFrom, tx: histRows?.[0]?.from || '—', isNew: false },
            ]} />
          </div>
        </>
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
                    {v.hasData && <div className="epSourceAs">{v.asOf}</div>}
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
        <>
          <div className="epBody">
            <div className="epOpDesc">
              Correct a value in a past period. The original record is kept in the audit log with
              your correction layered on top (AS-OF correction).
            </div>

            <div className="epField">
              <label className="epLabel">Period to Correct</label>
              <div className="epDateGroup">
                <input type="date" className="epInput epDateNative epDateHalf"
                  value={corrFrom} onChange={e => { setCorrFrom(e.target.value); if (e.target.value) onJumpDate(e.target.value) }} />
                <span className="epDateArrow">→</span>
                <input type="date" className="epInput epDateNative epDateHalf"
                  value={corrTo} onChange={e => setCorrTo(e.target.value)} />
              </div>
              {histRows && histRows.length > 0 && (
                <div className="epHintRow">
                  <span className="epHintLbl">Quick-pick existing period:</span>
                  {histRows.slice(0, 5).map((h, i) => (
                    <button key={i} className="epPeriodChip" type="button"
                      onClick={() => { setCorrFrom(h.from); setCorrTo(h.to || TODAY); onJumpDate(h.from) }}>
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
              <label className="epLabel">Reason / Explanation <span className="epOptional">(required for audit)</span></label>
              <textarea
                className="epInput epTextarea"
                value={corrReason}
                onChange={e => setCorrReason(e.target.value)}
                placeholder="Describe why this correction is needed (e.g. data entry error, source discrepancy, official document reference)…"
                rows={3}
              />
            </div>

            <div className="epField">
              <label className="epLabel">Supporting Documents</label>
              <FileUploadZone files={uploadedFiles} setFiles={setUploadedFiles} />
            </div>

            {corrFrom && corrTo && hasValue(corrVal) && (
              <BiTemporalPreview rows={[
                { val: corrVal, from: corrFrom, to: corrTo, tx: 'now (on save)', isNew: true },
              ]} />
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Add to History — insert a new historical record
      ══════════════════════════════════════════════════════ */}
      {tab === 'insert' && (
        <>
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
                value={insFrom} onChange={e => { setInsFrom(e.target.value); if (e.target.value) onJumpDate(e.target.value) }} />
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

            <div className="epField">
              <label className="epLabel">Reason / Explanation</label>
              <textarea
                className="epInput epTextarea"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe the source of this historical record (e.g. back-filled from port authority records, legacy system migration)…"
                rows={3}
              />
            </div>

            <div className="epField">
              <label className="epLabel">Supporting Documents</label>
              <FileUploadZone files={uploadedFiles} setFiles={setUploadedFiles} />
            </div>

            {hasValue(insVal) && insFrom && (
              <BiTemporalPreview rows={[
                { val: insVal, from: insFrom, to: insOpen ? 'Present' : insTo, tx: 'now (on save)', isNew: true },
              ]} />
            )}
          </div>
        </>
      )}

    </div>
  )
}
