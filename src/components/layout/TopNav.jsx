import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { usePreferences } from '../../contexts/PreferencesContext'
import { PERSONA_LIST } from '../../data/personas'

export default function TopNav() {
  const { persona, personaId, switchPersona } = usePreferences()
  const [showPersonaDrop, setShowPersonaDrop] = useState(false)
  const [showUserDrop,    setShowUserDrop]    = useState(false)
  const personaRef = useRef(null)
  const userRef    = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (personaRef.current && !personaRef.current.contains(e.target)) setShowPersonaDrop(false)
      if (userRef.current    && !userRef.current.contains(e.target))    setShowUserDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const nl = ({ isActive }) => isActive ? 'nt active' : 'nt'

  return (
    <nav className="topNav">
      <div className="navStrip">
        <svg className="navLogo" viewBox="0 0 140 28" width="140" height="28">
          <text className="navLogoText" x="0" y="22">S&amp;P Global</text>
        </svg>
        <div className="navDiv"></div>
        <div className="navProdWrap">
          <div className="navProd">Maritime Intelligence Platform</div>
          <div className="navProdSub">powered by S&amp;P Global Maritime Data</div>
        </div>

        <div className="navR">
          {/* Persona selector */}
          <div className="personaWrap" ref={personaRef}>
            <button
              className="personaBtn"
              onClick={() => { setShowPersonaDrop(v => !v); setShowUserDrop(false) }}
              title="Switch persona / role"
            >
              <span>{persona.icon}</span>
              <span className="personaBtnName">{persona.name}</span>
              <span style={{fontSize:8,opacity:.6}}>▾</span>
            </button>
            {showPersonaDrop && (
              <div className="personaDrop">
                <div className="personaDropHead">Switch Persona</div>
                {PERSONA_LIST.map(p => (
                  <button
                    key={p.id}
                    className={`personaDropItem${p.id === personaId ? ' on' : ''}`}
                    onClick={() => { switchPersona(p.id); setShowPersonaDrop(false) }}
                  >
                    <span className="personaDropIcon">{p.icon}</span>
                    <div className="personaDropInfo">
                      <div className="personaDropName">{p.name}</div>
                      <div className="personaDropDesc">{p.description}</div>
                    </div>
                    {p.id === personaId && <span style={{color:'#4ade80',fontSize:12,marginLeft:'auto'}}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="aiBtn">
            <span>✦</span> Ask AI
          </button>
          <div style={{width:'1px',height:'22px',background:'rgba(255,255,255,.12)'}}></div>

          {/* User menu */}
          <div className="userWrap" ref={userRef}>
            <div className="userChip" onClick={() => { setShowUserDrop(v => !v); setShowPersonaDrop(false) }}>
              <div className="userAv">KS</div>
              Krushna Samanta ▾
            </div>
            {showUserDrop && (
              <div className="userDrop">
                <div className="userDropHead">
                  <div className="userAv" style={{width:32,height:32,fontSize:11}}>KS</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,color:'var(--txt)'}}>Krushna Samanta</div>
                    <div style={{fontSize:10,color:'var(--txt3)'}}>krushna.samanta@gmail.com</div>
                  </div>
                </div>
                <div className="userDropDivider"/>
                <button className="userDropItem">⚙ Settings</button>
                <button className="userDropItem">🔔 Notifications</button>
                <button className="userDropItem">📋 My Saved Filters</button>
                <div className="userDropDivider"/>
                <button className="userDropItem" style={{color:'var(--red)'}}>↩ Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="navTabs">
        <NavLink to="/dashboard"   className={nl}><span className="ntI">▦</span> Dashboard</NavLink>
        <NavLink to="/vessels"     className={nl}><span className="ntI">🚢</span> Vessels</NavLink>
        <NavLink to="/companies"   className={nl}><span className="ntI">🏢</span> Companies</NavLink>
        <NavLink to="/ports"       className={nl}><span className="ntI">⚓</span> Ports</NavLink>
        <div className="navSep"></div>
        <NavLink to="/movements"   className={nl}><span className="ntI">🗺</span> Movements</NavLink>
        <NavLink to="/fixtures"    className={nl}><span className="ntI">📋</span> Fixtures</NavLink>
        <div className="navSep"></div>
        <NavLink to="/psc"         className={nl}><span className="ntI">🔍</span> Port State Control</NavLink>
        <NavLink to="/compliance"  className={nl}><span className="ntI">🚨</span> Compliance</NavLink>
        <div className="navSep"></div>
        <NavLink to="/events"      className={nl}><span className="ntI">⚡</span> Events</NavLink>
        <NavLink to="/imo-core"    className={nl}><span className="ntI">🆔</span> IMO Core</NavLink>
        <NavLink to="/gis-ais"     className={nl}><span className="ntI">🌍</span> GIS / AIS</NavLink>
        <div className="navSep"></div>
        <NavLink to="/etl"         className={nl}><span className="ntI">⚙️</span> ETL Pipelines</NavLink>
        <NavLink to="/bigquery"    className={nl}><span className="ntI">🔬</span> BigQuery</NavLink>
      </div>
    </nav>
  )
}
