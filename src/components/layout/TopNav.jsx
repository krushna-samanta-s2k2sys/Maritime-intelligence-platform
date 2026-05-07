import { NavLink } from 'react-router-dom'

export default function TopNav() {
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
          <button className="aiBtn">
            <span>✦</span> Ask AI
          </button>
          <div style={{width:'1px',height:'22px',background:'rgba(255,255,255,.12)'}}></div>
          <div className="userChip">
            <div className="userAv">KS</div>
            Krushna Samanta ▾
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
