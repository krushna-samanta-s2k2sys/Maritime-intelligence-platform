import { useState } from 'react'
import { ATTRIBUTE_TREE } from '../../data/attributeTree'
import { getAttrValue, getAttrValueAtDate } from '../../data/attrValueMap'
import { dRand, buildVendorList } from '../../data/entities'
import { simulateVendorDiff } from '../../data/fieldTypes'

function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

function gatherLeaves(node) {
  if (!node.children) return [node]
  return node.children.flatMap(gatherLeaves)
}

function buildSections(node) {
  if (!node.children) {
    return [{ sectionId: node.id, sectionLabel: '', leaves: [node] }]
  }
  const sections = []
  const directLeaves = []
  for (const child of node.children) {
    if (child.children) {
      sections.push({ sectionId: child.id, sectionLabel: child.label, leaves: gatherLeaves(child) })
    } else {
      directLeaves.push(child)
    }
  }
  if (directLeaves.length) sections.unshift({ sectionId: node.id + '-d', sectionLabel: '', leaves: directLeaves })
  return sections
}

function CompareTable({ vessel, leaves, activeNode, editMode, selLeafId, onSelectLeaf }) {
  const vendors = buildVendorList(vessel, activeNode)

  return (
    <div className="msWrap">
      <table className="msTable">
        <thead>
          <tr>
            <th style={{ width: 140 }}>Attribute</th>
            <th style={{ background: '#f0f7ff', width: 160 }}>Master (Golden Record)</th>
            {vendors.map(v => (
              <th key={v.key}>
                <span className={`src ${v.badgeCls}`}>{v.badgeLbl}</span> {v.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leaves.map(leaf => {
            const masterVal = getAttrValue(vessel, leaf.id) || '—'
            const isSel = selLeafId === leaf.id
            const seed = leaf.label + (vessel?.imo || '') + activeNode

            return (
              <tr key={leaf.id} className={isSel ? 'msRowSel' : ''}>
                <td>
                  <div
                    className={'msAttr' + (isSel ? ' selA' : '')}
                    onClick={() => onSelectLeaf(leaf.id, leaf.label)}
                  >{leaf.label}</div>
                </td>

                <td className="msMaster">
                  <div
                    className={'msMasterV' + (editMode ? ' msMasterVEdit' : '')}
                    onClick={() => onSelectLeaf(leaf.id, leaf.label)}
                    title={editMode ? 'Click to edit' : undefined}
                  >
                    {masterVal}
                    {editMode && <span className="afEditHint">✎</span>}
                  </div>
                  <div className="msMasterSrc">
                    <span className="src sIHS" style={{ fontSize: 8 }}>IHS</span>
                  </div>
                </td>

                {vendors.map(v => {
                  const covers = dRand('cov' + v.key + seed) < v.coverage
                  if (!covers) {
                    return (
                      <td key={v.key} className="msVCell miss">
                        <div className="msVVal missV">—</div>
                      </td>
                    )
                  }
                  const conflictR = dRand('cfl' + v.key + seed)
                  let value = masterVal
                  let cellCls = 'match', valCls = 'matchV', score = 1.0
                  if (conflictR < 0.04) {
                    value = simulateVendorDiff(masterVal, leaf.id, v.key + seed, dRand)
                    cellCls = 'diff'; valCls = 'diffV'; score = 0.62
                  } else if (conflictR < 0.12) {
                    value = simulateVendorDiff(masterVal, leaf.id, 'mn' + v.key + seed, dRand)
                    cellCls = 'diff'; valCls = 'diffV'; score = 0.87
                  }
                  const barColor = score >= 0.95 ? '#34a853' : score >= 0.75 ? '#f59e0b' : '#d93025'
                  const ts = '2024-01-' + (Math.floor(dRand('ts' + v.key + leaf.label) * 20) + 10)

                  return (
                    <td key={v.key} className={'msVCell ' + cellCls}>
                      <div className={'msVVal ' + valCls}>{value}</div>
                      <div className="msVBar">
                        <div className="msVBarTr">
                          <div className="msVBarFl" style={{ width: Math.round(score * 100) + '%', background: barColor }} />
                        </div>
                        <span style={{ fontSize: 8, color: 'var(--txt3)', fontFamily: 'monospace' }}>{score.toFixed(2)}</span>
                      </div>
                      <div className="msVTs">{ts}</div>
                      {editMode && cellCls === 'diff' && (
                        <button
                          className="applyBtn"
                          onClick={() => onSelectLeaf(leaf.id, leaf.label)}
                          title="Open edit panel to apply this value"
                        >&#10003; Review &amp; Apply</button>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AttrContentPanel({ vessel, activeNode, editMode, selLeafId, onSelectLeaf, curDate }) {
  const [viewMode,      setViewMode]      = useState('fields')
  const [collapsedSecs, setCollapsedSecs] = useState(new Set())
  const [hideEmpty,     setHideEmpty]     = useState(false)
  const [pinnedLeafIds, setPinnedLeafIds] = useState(new Set())

  function toggleSec(id) {
    setCollapsedSecs(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function togglePin(e, leafId) {
    e.stopPropagation()
    setPinnedLeafIds(prev => {
      const s = new Set(prev)
      s.has(leafId) ? s.delete(leafId) : s.add(leafId)
      return s
    })
  }

  if (!vessel) return null
  const inHistMode = curDate && curDate < '2024-01-30'
  const node = (activeNode ? findNode(ATTRIBUTE_TREE, activeNode) : null) || ATTRIBUTE_TREE[0]
  const sections = buildSections(node)
  const namedSections = sections.filter(s => s.sectionLabel)
  const allLeaves = gatherLeaves(node)
  const totalLeaves = allLeaves.length

  const allCollapsed = namedSections.length > 0 && namedSections.every(s => collapsedSecs.has(s.sectionId))

  // All leaf nodes across the entire tree (for resolving pinned IDs)
  const allTreeLeaves = ATTRIBUTE_TREE.flatMap(n => gatherLeaves(n))
  const pinnedLeaves  = allTreeLeaves.filter(l => pinnedLeafIds.has(l.id))

  function toggleCollapseAll() {
    if (allCollapsed) {
      setCollapsedSecs(new Set())
    } else {
      setCollapsedSecs(new Set(namedSections.map(s => s.sectionId)))
    }
  }

  function renderLeafRow(leaf, ri, inPinnedSection = false) {
    const curVal     = getAttrValue(vessel, leaf.id)
    const histVal    = inHistMode ? getAttrValueAtDate(vessel, leaf.id, curDate) : curVal
    const isEmpty    = !curVal || curVal === '—'
    const isChg      = inHistMode && histVal !== curVal && histVal !== '' && curVal !== ''
    const isSel      = selLeafId === leaf.id
    const isPinned   = pinnedLeafIds.has(leaf.id)
    const displayVal = isChg ? histVal : (curVal || '—')

    return (
      <div
        key={leaf.id + (inPinnedSection ? '-pin' : '')}
        className={`afRow${isSel ? ' afSel' : ''}${isChg ? ' afChg' : ''}${isEmpty ? ' afRowEmpty' : ''}${ri % 2 === 1 ? ' afRowAlt' : ''}`}
        onClick={() => onSelectLeaf(leaf.id, leaf.label)}
      >
        <span className={`afLbl${isChg ? ' afLblChg' : ''}`}>{leaf.label}</span>

        <span className={`afVal${isEmpty && !isChg ? ' afEmpty' : ''}${editMode ? ' afValEdit' : ''}`}>
          {displayVal}
          {isChg && !editMode && (
            <span className="afNowBadge" title={`Current value: ${curVal}`}>
              NOW {curVal}
            </span>
          )}
          {editMode && <span className="afEditHint">✎</span>}
        </span>

        {leaf.filterId && <span className="afFilterTag">{leaf.filterId}</span>}

        <button
          className={`afPinBtn${isPinned ? ' afPinBtnOn' : ''}`}
          onClick={e => togglePin(e, leaf.id)}
          title={isPinned ? 'Unpin attribute' : 'Pin to top'}
        >{isPinned ? '★' : '☆'}</button>
      </div>
    )
  }

  return (
    <div className="atContent">
      {/* ── Panel header ── */}
      <div className="atContentHdr">
        <div className="atContentHdrLeft">
          <span className="atContentTitle">{node.label}</span>
          <span className="atContentCount">{totalLeaves} attributes</span>
          {editMode && <span className="atContentEditBadge">✎ Edit mode</span>}
          {inHistMode && (
            <span className="atHistModeBadge">
              <span className="atHistModeDot" />
              Viewing {curDate}
            </span>
          )}
        </div>

        <div className="atContentHdrRight">
          {namedSections.length > 0 && (
            <button className="afCtrlBtn" onClick={toggleCollapseAll}>
              {allCollapsed ? '⊞ Expand All' : '⊟ Collapse All'}
            </button>
          )}
          <button
            className={`afCtrlBtn${hideEmpty ? ' afCtrlBtnActive' : ''}`}
            onClick={() => setHideEmpty(v => !v)}
            title="Hide fields with no value"
          >
            {hideEmpty ? '👁 Show Empty' : '⊘ Hide Empty'}
          </button>
          <div className="viewToggle">
            <button className={'vtBtn' + (viewMode === 'fields'  ? ' on' : '')} onClick={() => setViewMode('fields')}>Fields</button>
            <button className={'vtBtn' + (viewMode === 'compare' ? ' on' : '')} onClick={() => setViewMode('compare')}>Compare Sources</button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="atContentBody">
        {viewMode === 'compare' ? (
          <CompareTable
            vessel={vessel}
            leaves={allLeaves}
            activeNode={activeNode}
            editMode={editMode}
            selLeafId={selLeafId}
            onSelectLeaf={onSelectLeaf}
          />
        ) : (
          <>
            {/* ── Pinned attributes section ── */}
            {pinnedLeaves.length > 0 && (
              <div className="afPinnedSection">
                <div className="afPinnedHdr">
                  <span className="afPinnedHdrIcon">★</span>
                  <span className="afPinnedHdrLabel">Pinned Attributes</span>
                  <span className="afPinnedHdrCount">{pinnedLeaves.length}</span>
                  <button className="afPinnedClearBtn" onClick={() => setPinnedLeafIds(new Set())}>Clear all</button>
                </div>
                <div className="afList">
                  {pinnedLeaves.map((leaf, ri) => renderLeafRow(leaf, ri, true))}
                </div>
              </div>
            )}

            {sections.map(sec => {
              const isCollapsed = collapsedSecs.has(sec.sectionId)
              const populatedCount = sec.leaves.filter(l => {
                const v = getAttrValue(vessel, l.id)
                return v && v !== '—'
              }).length
              const allPop = populatedCount === sec.leaves.length
              const visibleLeaves = hideEmpty
                ? sec.leaves.filter(l => { const v = getAttrValue(vessel, l.id); return v && v !== '—' })
                : sec.leaves

              return (
                <div key={sec.sectionId} className="afSection">
                  {sec.sectionLabel && (
                    <div
                      className={`afSectionHdr${isCollapsed ? ' afSectionHdrCollapsed' : ''}`}
                      onClick={() => toggleSec(sec.sectionId)}
                    >
                      <span className="afSectionChevron">{isCollapsed ? '▸' : '▾'}</span>
                      <span className="afSectionTitle">{sec.sectionLabel}</span>
                      <span className={`afSectionPop${allPop ? ' afSectionPopFull' : ''}`}>
                        {populatedCount}/{sec.leaves.length}
                      </span>
                    </div>
                  )}

                  {!isCollapsed && (
                    <div className="afList">
                      {visibleLeaves.map((leaf, ri) => renderLeafRow(leaf, ri))}
                      {hideEmpty && visibleLeaves.length === 0 && (
                        <div className="afEmptySection">All fields in this section are empty</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
