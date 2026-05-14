import { useState, useRef } from 'react'
import { ATTRIBUTE_TREE, NODE_ENTITY_KEYS } from '../../data/attributeRegistry'
import { getChangedFieldCount } from '../../data/vesselTimeline'

function getNodeChg(vessel, nodeId, curDate) {
  const keys = NODE_ENTITY_KEYS[nodeId]
  if (!keys?.length) return 0
  return [...new Set(keys)].reduce((sum, k) => sum + getChangedFieldCount(vessel, k, curDate), 0)
}

function sortedTopLevel(tree, favorites, personaSections) {
  const order = personaSections?.length ? personaSections : tree.map(n => n.id)
  return [...tree].sort((a, b) => {
    const aFav = favorites.has(a.id), bFav = favorites.has(b.id)
    if (aFav !== bFav) return aFav ? -1 : 1
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

const MIN_W = 140
const MAX_W = 480
const DEFAULT_W = 220

export default function AttrTreeSidebar({ vessel, curDate, activeNode, onSelectNode, favorites = new Set(), onToggleFavorite, personaAttrSections, topContent }) {
  const [expanded,   setExpanded]   = useState(new Set())
  const [collapsed,  setCollapsed]  = useState(false)
  const [sbWidth,    setSbWidth]    = useState(DEFAULT_W)
  const widthRef = useRef(DEFAULT_W)

  const showChg = curDate && curDate < '2024-01-30'

  function toggle(e, id) {
    e.stopPropagation()
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function startResize(e) {
    e.preventDefault()
    const startX = e.clientX
    const startW = widthRef.current

    function onMove(ev) {
      const newW = Math.max(MIN_W, Math.min(MAX_W, startW + (ev.clientX - startX)))
      widthRef.current = newW
      setSbWidth(newW)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.classList.remove('ew-resizing')
    }
    document.body.classList.add('ew-resizing')
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const sorted = sortedTopLevel(ATTRIBUTE_TREE, favorites, personaAttrSections)
  const pinnedCount = sorted.filter(n => favorites.has(n.id)).length

  function renderNode(node, depth, index) {
    const hasCh = !!node.children?.length
    const isExp = expanded.has(node.id)
    const isAct = activeNode === node.id
    const chg   = showChg ? getNodeChg(vessel, node.id, curDate) : 0
    const isFav = depth === 0 && favorites.has(node.id)
    const isPersonaPri = depth === 0 && !isFav && personaAttrSections?.length > 0 &&
      personaAttrSections.indexOf(node.id) < 3

    const showPinnedSep = depth === 0 && pinnedCount > 0 && index === pinnedCount
    const sep = showPinnedSep ? (
      <div key={node.id + '-sep'} className="atSbSep">
        <span className="atSbSepLbl">All sections</span>
      </div>
    ) : null

    if (hasCh) {
      const el = (
        <div key={node.id} className={`atSbGroup${isFav ? ' atSbPinned' : ''}${isPersonaPri ? ' atSbPersonaPri' : ''}`}>
          <div
            className={`atSbHdr${depth === 0 ? ' atSbRoot' : ''}${isAct ? ' atSbActive' : ''}`}
            style={{ paddingLeft: 8 + depth * 12 }}
            onClick={() => onSelectNode(node.id)}
          >
            <button
              className="atSbArrowBtn"
              onClick={e => toggle(e, node.id)}
              aria-label={isExp ? 'Collapse' : 'Expand'}
            >{isExp ? '▾' : '▸'}</button>
            <span className="atSbLabel">{node.label}</span>
            {isPersonaPri && <span className="atSbRoleBadge" title="Priority for your role">For You</span>}
            {chg > 0 && <span className="detSbChg">+{chg}</span>}
            {depth === 0 && (
              <button
                className={`atSbStarBtn${isFav ? ' starred' : ''}`}
                title={isFav ? 'Unpin section' : 'Pin to top'}
                onClick={e => { e.stopPropagation(); onToggleFavorite?.(node.id) }}
              >{isFav ? '★' : '☆'}</button>
            )}
          </div>
          {isExp && (
            <div>
              {node.children.map((c, ci) => renderNode(c, depth + 1, ci))}
            </div>
          )}
        </div>
      )
      return sep ? [sep, el] : el
    }

    const el = (
      <div
        key={node.id}
        className={`atSbLeaf${isAct ? ' atSbActive' : ''}`}
        style={{ paddingLeft: 12 + depth * 12 }}
        onClick={() => onSelectNode(node.id)}
      >
        <span className="atSbLabel">{node.label}</span>
        {chg > 0 && <span className="detSbChg">+{chg}</span>}
      </div>
    )
    return sep ? [sep, el] : el
  }

  if (collapsed) {
    return (
      <div className="atSidebar atSbCollapsed">
        <button
          className="atSbExpandBtn"
          onClick={() => setCollapsed(false)}
          title="Expand navigation"
        >›</button>
      </div>
    )
  }

  return (
    <div
      className="atSidebar"
      style={{ flex: `0 0 ${sbWidth}px`, width: sbWidth, minWidth: sbWidth }}
    >
      {/* Injected top content (voyage card, image strip, etc.) */}
      {topContent}

      {/* Header strip */}
      <div className="atSbHeader">
        <span className="atSbHeaderTitle">Navigation</span>
        <button
          className="atSbCollapseBtn"
          onClick={() => setCollapsed(true)}
          title="Collapse navigation"
        >‹</button>
      </div>

      {/* Nav content */}
      <div className="atSbContent">
        {pinnedCount > 0 && (
          <div className="atSbSep atSbSepTop">
            <span className="atSbSepLbl">Pinned</span>
          </div>
        )}
        {sorted.map((n, i) => renderNode(n, 0, i))}
      </div>

      {/* Resize handle on right edge */}
      <div className="atSbResizeHandle" onMouseDown={startResize} title="Drag to resize" />
    </div>
  )
}
