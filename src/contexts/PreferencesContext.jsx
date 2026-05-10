import { createContext, useContext, useState } from 'react'
import { PERSONAS, DEFAULT_PERSONA_ID } from '../data/personas'

const Ctx = createContext(null)

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export function PreferencesProvider({ children }) {
  const [personaId, setPersonaId]         = useState(() => load('mip_persona', DEFAULT_PERSONA_ID))
  const [layoutOverrides, setLayoutOvr]   = useState(() => load('mip_layouts', {}))
  const [columnOverrides, setColumnOvr]   = useState(() => load('mip_columns', {}))
  const [attrFavsOvr,     setAttrFavsOvr] = useState(() => load('mip_attr_favs', {}))
  const [filterOverrides, setFilterOvr]   = useState(() => load('mip_filters', {}))

  const persona = PERSONAS[personaId] || PERSONAS[DEFAULT_PERSONA_ID]

  const dashboardLayout = layoutOverrides[personaId] ?? persona.dashboardCards
  const vesselColumns   = columnOverrides[personaId]  ?? persona.vesselColumns
  const vesselFilters   = filterOverrides[personaId]  ?? []
  const attrFavorites   = new Set(attrFavsOvr[personaId] ?? [])

  function switchPersona(id) {
    setPersonaId(id)
    save('mip_persona', id)
  }

  function updateDashboardLayout(next) {
    const ovr = { ...layoutOverrides, [personaId]: next }
    setLayoutOvr(ovr)
    save('mip_layouts', ovr)
  }

  function resetDashboardLayout() {
    const ovr = { ...layoutOverrides }
    delete ovr[personaId]
    setLayoutOvr(ovr)
    save('mip_layouts', ovr)
  }

  function updateVesselColumns(cols) {
    const ovr = { ...columnOverrides, [personaId]: cols }
    setColumnOvr(ovr)
    save('mip_columns', ovr)
  }

  function resetVesselColumns() {
    const ovr = { ...columnOverrides }
    delete ovr[personaId]
    setColumnOvr(ovr)
    save('mip_columns', ovr)
  }

  function updateVesselFilters(filters) {
    const ovr = { ...filterOverrides, [personaId]: filters }
    setFilterOvr(ovr)
    save('mip_filters', ovr)
  }

  function resetVesselFilters() {
    const ovr = { ...filterOverrides }
    delete ovr[personaId]
    setFilterOvr(ovr)
    save('mip_filters', ovr)
  }

  function toggleAttrFavorite(nodeId) {
    const cur = new Set(attrFavsOvr[personaId] ?? [])
    cur.has(nodeId) ? cur.delete(nodeId) : cur.add(nodeId)
    const ovr = { ...attrFavsOvr, [personaId]: [...cur] }
    setAttrFavsOvr(ovr)
    save('mip_attr_favs', ovr)
  }

  return (
    <Ctx.Provider value={{
      personaId, persona, switchPersona,
      dashboardLayout, updateDashboardLayout, resetDashboardLayout,
      vesselColumns, updateVesselColumns, resetVesselColumns,
      vesselFilters, updateVesselFilters, resetVesselFilters,
      attrFavorites, toggleAttrFavorite,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePreferences() {
  return useContext(Ctx)
}
