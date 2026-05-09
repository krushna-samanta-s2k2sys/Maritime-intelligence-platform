import { useState } from 'react'
import { CARD_CATALOG, CARD_CATEGORIES } from '../../data/dashboardCards'

export default function CardCatalog({ activeCardIds, onAdd, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const cards = Object.values(CARD_CATALOG).filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false
    return true
  })

  const available = cards.filter(c => !activeCardIds.includes(c.id))
  const added     = cards.filter(c => activeCardIds.includes(c.id))

  return (
    <div className="catalogOverlay" onClick={onClose}>
      <div className="catalogModal" onClick={e => e.stopPropagation()}>
        <div className="catalogHead">
          <div className="catalogTitle">Add Dashboard Cards</div>
          <div className="catalogSub">{available.length} available · {added.length} already on dashboard</div>
          <button className="catalogClose" onClick={onClose}>✕</button>
        </div>

        {/* Category tabs */}
        <div className="catalogTabs">
          <button className={`catalogTab${activeCategory==='all'?' on':''}`} onClick={() => setActiveCategory('all')}>
            All ({Object.values(CARD_CATALOG).length})
          </button>
          {CARD_CATEGORIES.map(cat => {
            const cnt = Object.values(CARD_CATALOG).filter(c => c.category === cat.key).length
            return (
              <button key={cat.key} className={`catalogTab${activeCategory===cat.key?' on':''}`} onClick={() => setActiveCategory(cat.key)}>
                {cat.icon} {cat.label} ({cnt})
              </button>
            )
          })}
        </div>

        <div className="catalogBody">
          {available.length > 0 && (
            <>
              <div className="catalogSection">Available to add</div>
              <div className="catalogGrid">
                {available.map(card => (
                  <div key={card.id} className="catalogCard">
                    <div className="catalogCardIcon">{card.icon}</div>
                    <div className="catalogCardInfo">
                      <div className="catalogCardTitle">{card.title}</div>
                      <div className="catalogCardDesc">{card.description}</div>
                    </div>
                    <button className="btn btnP btnSm" onClick={() => onAdd(card.id)}>+ Add</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {added.length > 0 && (
            <>
              <div className="catalogSection" style={{marginTop:16}}>Already on dashboard</div>
              <div className="catalogGrid">
                {added.map(card => (
                  <div key={card.id} className="catalogCard catalogCardAdded">
                    <div className="catalogCardIcon">{card.icon}</div>
                    <div className="catalogCardInfo">
                      <div className="catalogCardTitle">{card.title}</div>
                      <div className="catalogCardDesc">{card.description}</div>
                    </div>
                    <span className="tag tG" style={{flexShrink:0}}>✓ Added</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {available.length === 0 && added.length === 0 && (
            <div className="empty">No cards match this category</div>
          )}
        </div>
      </div>
    </div>
  )
}
