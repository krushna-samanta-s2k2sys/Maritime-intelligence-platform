import { useState, useMemo } from 'react'
import { ALL_VESSEL_COLUMNS, COLUMN_GROUPS } from '../../data/attributeRegistry'
import { usePreferences } from '../../contexts/PreferencesContext'

export default function ColumnPickerModal({ onClose }) {
  const { vesselColumns, updateVesselColumns, resetVesselColumns } = usePreferences()
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(() => new Set(vesselColumns))
  const [expanded, setExpanded]   = useState(() => new Set())

  const alwaysCols = ALL_VESSEL_COLUMNS.filter(c => c.always)

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return ALL_VESSEL_COLUMNS.filter(c =>
      !c.always &&
      (c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    )
  }, [search])

  const visibleCols = useMemo(() =>
    ALL_VESSEL_COLUMNS.filter(c => c.always || selected.has(c.id)),
  [selected])

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleExpand(key) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function apply()  { updateVesselColumns([...selected]); onClose() }
  function reset()  { resetVesselColumns(); onClose() }

  const selectedCount = visibleCols.filter(c => !c.always).length

  return (
    <div className="cpModalOverlay" onMouseDown={onClose}>
      <div className="cpModal" onMouseDown={e => e.stopPropagation()}>

        <div className="cpModalHead">
          <div>
            <div className="cpModalTitle">Column Configuration</div>
            <div className="cpModalSub">
              {selectedCount} columns selected · Always visible: {alwaysCols.map(c => c.label).join(', ')}
            </div>
          </div>
          <button className="cpModalClose" onClick={onClose}>✕</button>
        </div>

        <div className="cpModalBody">
          {/* Left: tree of all available columns */}
          <div className="cpLeft">
            <div className="cpLeftHead">
              <div className="cpSectionTitle">Available Columns</div>
              <div className="cpTreeSearch">
                <div className="cpTreeSearchIcon">⌕</div>
                <input
                  autoFocus
                  className="cpTreeSearchInp"
                  placeholder="Search columns… e.g. DWT, Flag, Owner"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="cpTreeSearchClear" onClick={() => setSearch('')}>✕</button>
                )}
              </div>
            </div>

            <div className="cpLeftList">
              {search.trim() ? (
                searchResults.length > 0 ? (
                  <>
                    <div className="cpResultsHdr">
                      {searchResults.length} column{searchResults.length !== 1 ? 's' : ''} found
                    </div>
                    {searchResults.map(col => {
                      const on  = selected.has(col.id)
                      const grp = COLUMN_GROUPS.find(g => g.key === col.group)
                      return (
                        <button
                          key={col.id}
                          className={`cpTreeResult${on ? ' cpTreeResultOn' : ''}`}
                          onClick={() => toggle(col.id)}
                        >
                          <div className="cpTreeResultMeta">
                            <div className="cpTreeResultPath">{grp?.label || col.group}</div>
                            <div className="cpTreeResultLabel">{col.label}</div>
                          </div>
                          <span className={`cpTreeChk${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                        </button>
                      )
                    })}
                  </>
                ) : (
                  <div className="ftEmpty">No columns matching "<strong>{search}</strong>"</div>
                )
              ) : (
                <div className="cpTree">
                  {COLUMN_GROUPS.map(g => {
                    const cols = ALL_VESSEL_COLUMNS.filter(c => !c.always && c.group === g.key)
                    if (cols.length === 0) return null
                    const isOpen       = expanded.has(g.key)
                    const selectedInGrp = cols.filter(c => selected.has(c.id)).length
                    return (
                      <div key={g.key}>
                        <button
                          className={`cpTreeBranch${isOpen ? ' cpTreeOpen' : ''}`}
                          onClick={() => toggleExpand(g.key)}
                        >
                          <span className="cpTreeArrow">{isOpen ? '▾' : '▸'}</span>
                          <span className="cpTreeBranchLabel">{g.label}</span>
                          {selectedInGrp > 0
                            ? <span className="cpTreeBadge">{selectedInGrp}/{cols.length}</span>
                            : <span className="cpTreeCount">{cols.length}</span>
                          }
                        </button>
                        {isOpen && (
                          <div className="cpTreeChildren">
                            {cols.map(col => {
                              const on = selected.has(col.id)
                              return (
                                <button
                                  key={col.id}
                                  className={`cpTreeLeaf${on ? ' cpTreeLeafOn' : ''}`}
                                  onClick={() => toggle(col.id)}
                                >
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

          {/* Right: currently selected columns */}
          <div className="cpRight">
            <div className="cpRightHead">
              <div className="cpSectionTitle">Visible Columns ({visibleCols.length})</div>
              <div className="cpRightSub">Click a column in the tree to toggle · Fixed columns always shown</div>
            </div>
            <div className="cpRightList">
              {visibleCols.map(col => (
                <div
                  key={col.id}
                  className={`cpVisRow${col.always ? ' cpVisFixed' : ''}`}
                >
                  {col.always
                    ? <span className="cpVisLock" title="Always visible">🔒</span>
                    : <span className="cpVisHandle">⠿</span>
                  }
                  <span className="cpVisLabel">{col.label}</span>
                  <span className="cpVisGroup">
                    {COLUMN_GROUPS.find(g => g.key === col.group)?.label || ''}
                  </span>
                  {!col.always && (
                    <button className="cpVisRemove" onClick={() => toggle(col.id)} title="Remove">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cpModalFoot">
          <button className="btn btnS btnSm" onClick={reset}>↺ Reset to Default</button>
          <button className="btn btnS btnSm" onClick={() => setSelected(new Set())}>Clear All</button>
          <div style={{ flex: 1 }} />
          <button className="btn btnS btnSm" onClick={onClose}>Cancel</button>
          <button className="btn btnP btnSm" onClick={apply}>Apply ({visibleCols.length} columns)</button>
        </div>
      </div>
    </div>
  )
}
