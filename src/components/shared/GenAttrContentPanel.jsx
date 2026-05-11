import { useState } from 'react'

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

export default function GenAttrContentPanel({ entity, tree, getVal, activeNode, editMode, selLeafId, onSelectLeaf }) {
  const [collapsedSecs, setCollapsedSecs] = useState(new Set())
  const [hideEmpty,     setHideEmpty]     = useState(false)

  function toggleSec(id) {
    setCollapsedSecs(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  if (!entity) return null

  const node = (activeNode ? findNode(tree, activeNode) : null) || tree[0]
  const sections = buildSections(node)
  const namedSections = sections.filter(s => s.sectionLabel)
  const allLeaves = gatherLeaves(node)
  const totalLeaves = allLeaves.length
  const allCollapsed = namedSections.length > 0 && namedSections.every(s => collapsedSecs.has(s.sectionId))

  function toggleCollapseAll() {
    if (allCollapsed) setCollapsedSecs(new Set())
    else setCollapsedSecs(new Set(namedSections.map(s => s.sectionId)))
  }

  return (
    <div className="atContent">
      <div className="atContentHdr">
        <div className="atContentHdrLeft">
          <span className="atContentTitle">{node.label}</span>
          <span className="atContentCount">{totalLeaves} attributes</span>
          {editMode && <span className="atContentEditBadge">✎ Edit mode</span>}
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
          >
            {hideEmpty ? '👁 Show Empty' : '⊘ Hide Empty'}
          </button>
        </div>
      </div>

      <div className="atContentBody">
        {sections.map(sec => {
          const isCollapsed = collapsedSecs.has(sec.sectionId)
          const populatedCount = sec.leaves.filter(l => {
            const v = getVal(entity, l.id)
            return v && v !== '—'
          }).length
          const allPop = populatedCount === sec.leaves.length
          const visibleLeaves = hideEmpty
            ? sec.leaves.filter(l => { const v = getVal(entity, l.id); return v && v !== '—' })
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
                  {visibleLeaves.map((leaf, ri) => {
                    const curVal = getVal(entity, leaf.id)
                    const isEmpty = !curVal || curVal === '—'
                    const isSel = selLeafId === leaf.id

                    return (
                      <div
                        key={leaf.id}
                        className={`afRow${isSel ? ' afSel' : ''}${isEmpty ? ' afRowEmpty' : ''}${ri % 2 === 1 ? ' afRowAlt' : ''}`}
                        onClick={() => onSelectLeaf(leaf.id, leaf.label)}
                      >
                        <span className="afLbl">{leaf.label}</span>
                        <span className={`afVal${isEmpty ? ' afEmpty' : ''}${editMode ? ' afValEdit' : ''}`}>
                          {curVal || '—'}
                          {editMode && <span className="afEditHint">✎</span>}
                        </span>
                      </div>
                    )
                  })}
                  {hideEmpty && visibleLeaves.length === 0 && (
                    <div className="afEmptySection">All fields in this section are empty</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
