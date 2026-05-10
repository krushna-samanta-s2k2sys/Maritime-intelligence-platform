import { useState } from 'react'
import { ATTRIBUTE_TREE } from '../../data/attributeTree'
import { getChangedFieldCount } from '../../data/vesselTimeline'

// Maps attribute-tree branch IDs → entity keys used by getChangedFieldCount
const NODE_ENTITY_KEYS = {
  // General
  'general':          ['imo', 'flag'],
  'gen-identity':     ['imo', 'flag'],
  'gen-status':       ['imo'],
  'gen-crew':         ['crew'],

  // Ownership & Management
  'ownership':        ['ownership', 'finance'],
  'own-regowner':     ['ownership'],
  'own-techman':      ['ownership'],
  'own-shipman':      ['ownership'],
  'own-docco':        ['ownership'],
  'own-bareboat':     ['ownership'],
  'own-charterer':    ['ownership'],
  'own-sp':           ['finance'],

  // Classification & Surveys
  'classification':   ['class', 'certs'],
  'class-society':    ['class'],
  'class-notation':   ['class'],
  'class-surveys':    ['class', 'certs'],

  // Safety & Certification
  'safety':           ['certs'],
  'safety-doc':       ['certs'],
  'safety-smc':       ['certs'],
  'safety-iopp':      ['certs'],
  'safety-insurance': ['ownership'],

  // Compliance
  'compliance':       ['sanctions'],
  'comp-sanctions':   ['sanctions'],
}

function getNodeChg(vessel, nodeId, curDate) {
  const keys = NODE_ENTITY_KEYS[nodeId]
  if (!keys?.length) return 0
  return [...new Set(keys)].reduce((sum, k) => sum + getChangedFieldCount(vessel, k, curDate), 0)
}

// Reorder top-level tree: pinned favorites first, then persona-priority order, then rest
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

export default function AttrTreeSidebar({ vessel, curDate, activeNode, onSelectNode, favorites = new Set(), onToggleFavorite, personaAttrSections }) {
  // Start fully collapsed — key={vessel.id} in parent resets this on new vessel
  const [expanded, setExpanded] = useState(new Set())

  const showChg = curDate && curDate < '2024-01-30'

  function toggle(e, id) {
    e.stopPropagation()
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const sorted = sortedTopLevel(ATTRIBUTE_TREE, favorites, personaAttrSections)

  // Find where pinned ends and persona-ordered begins for the divider
  const pinnedCount = sorted.filter(n => favorites.has(n.id)).length

  function renderNode(node, depth, index) {
    const hasCh = !!node.children?.length
    const isExp = expanded.has(node.id)
    const isAct = activeNode === node.id
    const chg   = showChg ? getNodeChg(vessel, node.id, curDate) : 0
    const isFav = depth === 0 && favorites.has(node.id)
    const isPersonaPri = depth === 0 && !isFav && personaAttrSections?.length > 0 &&
      personaAttrSections.indexOf(node.id) < 3

    // Divider before first non-pinned item when there are pinned items
    const showPinnedSep = depth === 0 && pinnedCount > 0 && index === pinnedCount

    const sep = showPinnedSep ? (
      <div key={node.id + '-sep'} className="atSbSep">
        <span className="atSbSepLbl">All sections</span>
      </div>
    ) : null

    if (hasCh) {
      const el = (
        <div key={node.id} className={`atSbGroup${isFav ? ' atSbPinned' : ''}`}>
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
            {isPersonaPri && <span className="atSbRoleDot" title="Priority for your role" />}
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
              {node.children.map(c => renderNode(c, depth + 1))}
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

  return (
    <div className="atSidebar">
      {pinnedCount > 0 && (
        <div className="atSbSep atSbSepTop">
          <span className="atSbSepLbl">Pinned</span>
        </div>
      )}
      {sorted.map((n, i) => renderNode(n, 0, i))}
    </div>
  )
}
