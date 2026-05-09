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

  const persona = PERSONAS[personaId] || PERSONAS[DEFAULT_PERSONA_ID]

  const dashboardLayout = layoutOverrides[personaId] ?? persona.dashboardCards
  const vesselColumns   = columnOverrides[personaId]  ?? persona.vesselColumns

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

  return (
    <Ctx.Provider value={{
      personaId, persona, switchPersona,
      dashboardLayout, updateDashboardLayout, resetDashboardLayout,
      vesselColumns, updateVesselColumns, resetVesselColumns,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePreferences() {
  return useContext(Ctx)
}
