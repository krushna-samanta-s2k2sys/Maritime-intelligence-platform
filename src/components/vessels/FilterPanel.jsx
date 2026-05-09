import { useState } from 'react'

export default function FilterPanel({ filters, onChange, availableValues, onClear }) {
  const [openGroups, setOpenGroups] = useState({ type:true, status:true, flag:false, class:false, numeric:false })

  function toggleGroup(key) {
    setOpenGroups(p => ({ ...p, [key]: !p[key] }))
  }

  function toggleMulti(field, value) {
    const current = filters[field] || []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    onChange({ ...filters, [field]: next })
  }

  function setRange(field, value) {
    onChange({ ...filters, [field]: value })
  }

  const activeCount = Object.values(filters).flat().filter(v => v !== '').length

  return (
    <div className="filterPanel">
      <div className="filterPanelHead">
        <span className="filterPanelTitle">Filters</span>
        {activeCount > 0 && (
          <span className="tag tB" style={{marginLeft:6}}>{activeCount}</span>
        )}
        {activeCount > 0 && (
          <button className="filterClearAll" onClick={onClear}>Clear all</button>
        )}
      </div>

      {/* Ship Type */}
      <FilterGroup label="Ship Type" open={openGroups.type} onToggle={() => toggleGroup('type')} activeCount={filters.types?.length}>
        {availableValues.types.map(({ value, count }) => (
          <FilterChip
            key={value}
            label={value}
            count={count}
            active={filters.types?.includes(value)}
            onClick={() => toggleMulti('types', value)}
          />
        ))}
      </FilterGroup>

      {/* Status */}
      <FilterGroup label="Status" open={openGroups.status} onToggle={() => toggleGroup('status')} activeCount={filters.statuses?.length}>
        {availableValues.statuses.map(({ value, count }) => (
          <FilterChip
            key={value}
            label={value}
            count={count}
            active={filters.statuses?.includes(value)}
            onClick={() => toggleMulti('statuses', value)}
          />
        ))}
      </FilterGroup>

      {/* Flag / Country */}
      <FilterGroup label="Flag / Country" open={openGroups.flag} onToggle={() => toggleGroup('flag')} activeCount={filters.flags?.length}>
        <div className="filterScrollList">
          {availableValues.flags.map(({ value, count, emoji }) => (
            <FilterChip
              key={value}
              label={`${emoji} ${value}`}
              count={count}
              active={filters.flags?.includes(value)}
              onClick={() => toggleMulti('flags', value)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Class Society */}
      <FilterGroup label="Class Society" open={openGroups.class} onToggle={() => toggleGroup('class')} activeCount={filters.classes?.length}>
        {availableValues.classes.map(({ value, count }) => (
          <FilterChip
            key={value}
            label={value}
            count={count}
            active={filters.classes?.includes(value)}
            onClick={() => toggleMulti('classes', value)}
          />
        ))}
      </FilterGroup>

      {/* Numeric ranges */}
      <FilterGroup label="Numeric Ranges" open={openGroups.numeric} onToggle={() => toggleGroup('numeric')} activeCount={(filters.dwtMin||filters.dwtMax||filters.yearMin||filters.yearMax||filters.gtMin||filters.gtMax) ? 1 : 0}>
        <div className="filterRangeGroup">
          <div className="filterRangeLabel">DWT (tonnes)</div>
          <div className="filterRangeRow">
            <input className="filterRangeInput" type="number" placeholder="Min" value={filters.dwtMin||''} onChange={e => setRange('dwtMin', e.target.value)} />
            <span className="filterRangeSep">–</span>
            <input className="filterRangeInput" type="number" placeholder="Max" value={filters.dwtMax||''} onChange={e => setRange('dwtMax', e.target.value)} />
          </div>
        </div>
        <div className="filterRangeGroup">
          <div className="filterRangeLabel">Gross Tonnage (GT)</div>
          <div className="filterRangeRow">
            <input className="filterRangeInput" type="number" placeholder="Min" value={filters.gtMin||''} onChange={e => setRange('gtMin', e.target.value)} />
            <span className="filterRangeSep">–</span>
            <input className="filterRangeInput" type="number" placeholder="Max" value={filters.gtMax||''} onChange={e => setRange('gtMax', e.target.value)} />
          </div>
        </div>
        <div className="filterRangeGroup">
          <div className="filterRangeLabel">Year Built</div>
          <div className="filterRangeRow">
            <input className="filterRangeInput" type="number" placeholder="From" value={filters.yearMin||''} onChange={e => setRange('yearMin', e.target.value)} />
            <span className="filterRangeSep">–</span>
            <input className="filterRangeInput" type="number" placeholder="To" value={filters.yearMax||''} onChange={e => setRange('yearMax', e.target.value)} />
          </div>
        </div>
        <div className="filterRangeGroup">
          <div className="filterRangeLabel">LOA (metres)</div>
          <div className="filterRangeRow">
            <input className="filterRangeInput" type="number" placeholder="Min" value={filters.loaMin||''} onChange={e => setRange('loaMin', e.target.value)} />
            <span className="filterRangeSep">–</span>
            <input className="filterRangeInput" type="number" placeholder="Max" value={filters.loaMax||''} onChange={e => setRange('loaMax', e.target.value)} />
          </div>
        </div>
      </FilterGroup>

      {/* Ice Class */}
      {availableValues.iceClasses.length > 0 && (
        <FilterGroup label="Ice Class" open={openGroups.ice} onToggle={() => toggleGroup('ice')} activeCount={filters.iceClasses?.length}>
          {availableValues.iceClasses.map(({ value, count }) => (
            <FilterChip
              key={value}
              label={value}
              count={count}
              active={filters.iceClasses?.includes(value)}
              onClick={() => toggleMulti('iceClasses', value)}
            />
          ))}
        </FilterGroup>
      )}
    </div>
  )
}

function FilterGroup({ label, open, onToggle, activeCount, children }) {
  return (
    <div className="filterGroup">
      <button className="filterGroupHdr" onClick={onToggle}>
        <span className="filterGroupLabel">{label}</span>
        {activeCount > 0 && <span className="tag tB" style={{marginLeft:6,fontSize:9}}>{activeCount}</span>}
        <span className="filterGroupArrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="filterGroupBody">{children}</div>}
    </div>
  )
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button className={`filterChip${active ? ' on' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <span className="filterChipCount">{count}</span>
    </button>
  )
}
