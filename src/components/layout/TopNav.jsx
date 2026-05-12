import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { usePreferences } from '../../contexts/PreferencesContext'
import { PERSONA_LIST } from '../../data/personas'

const AI_GREET = "Hello! I'm the Maritime Intelligence AI Assistant.\n\nI can help you search vessels by name or IMO, analyze port congestion, check sanctions and compliance, identify AIS dark activity, and summarize PSC inspection data.\n\nWhat would you like to explore?"

const QUICK_QS = [
  'Which vessels are currently detained?',
  'Paris MOU high-risk vessels',
  'Singapore port congestion status',
  'AIS dark activity this week',
  'PSC detentions year-to-date',
  'VLCC tankers in Arabian Gulf',
]

function aiRespond(q) {
  const lq = q.toLowerCase()
  if (lq.includes('detain')) return "**Active Detentions — Monitored Fleet**\n\n🔴 **OCEAN PRIDE** (IMO 9341122)\nDetained at Rotterdam · Paris MOU · 14 deficiencies\nDeficiency areas: ISM/SMS, fire safety, life-saving equipment\nDetention date: 2024-01-30\n\n🟡 **SUNRISE CARRIER** (IMO 9412888)\nPreviously detained at Qingdao · Tokyo MOU · 8 deficiencies\nStatus: Released — monitoring recommended\n\nWould you like the full PSC report for either vessel?"
  if (lq.includes('paris') || lq.includes('high risk') || lq.includes('high-risk')) return "**Paris MOU — High-Risk Vessel Ranking**\n\nRisk scores based on: age, flag state, vessel type, inspection history.\n\n1. **OCEAN PRIDE** — Score 87/100\n   Bulk Carrier · 18yr · Panama flag · Bulk Carrier >15yr profile\n\n2. **PIONEER TRADER** — Score 73/100\n   General Cargo · 13yr · Liberia flag\n\n3. **SUNRISE CARRIER** — Score 68/100\n   Bulk Carrier · 17yr · Panama flag · Prior detention\n\nHigh-risk vessels are prioritised for inspection at next Paris MOU port call."
  if (lq.includes('singapore') || lq.includes('congestion')) return "**Port of Singapore — Live Operational Status**\n\nCongestion Index: **72%** ⚠️ MEDIUM\n\n• Annual port calls: 82,442\n• Vessels at anchor: ~340 (estimated)\n• Active berths: 74 across T1/T2 Pasir Panjang, Jurong Island\n• Max draft: 20.5m (Singapore Strait limit)\n• MOU Region: Tokyo MOU\n• PSC Authority: Maritime and Port Authority\n\nCurrent delays: 4–8 hours average waiting time at container terminals."
  if (lq.includes('ais dark') || lq.includes('dark')) return "**AIS Dark Activity — Current Week**\n\n🌑 **MT NORTHERN GHOST** (IMO 9778899) — CRITICAL\nSignal blackout: 23 days\nLast position: Baltic Sea 55.5°N 20.8°E\nFlag: St Kitts & Nevis · Owner: Northsea Trading Ltd\n⚠️ Potential sanctions evasion risk — recommend OFAC/SDN cross-check\n\n🌑 **MT POSEIDON QUEEN** (IMO 9667788)\nStatus unknown · Last seen: Red Sea\nFlag: Cameroon · Cargo: Unknown\n\nRecommendation: Flag both vessels for enhanced due diligence."
  if (lq.includes('psc') || lq.includes('year') || lq.includes('ytd')) return "**PSC Detentions — Year to Date 2024**\n\nTotal Inspections: 847 · Detention Rate: 2.7%\nTotal Detentions: 23\n\n**Top Deficiency Categories:**\n1. Fire safety equipment — 34%\n2. Life-saving appliances — 28%\n3. ISM/SMS documentation — 21%\n4. MARPOL compliance — 11%\n5. Crew certification — 6%\n\n**Highest-risk flags:** Panama · Liberia · Cameroon · Tanzania\n**Highest-risk types:** Bulk Carriers >15yr · General Cargo"
  if (lq.includes('vlcc') || lq.includes('arabian')) return "**VLCC Tankers — Arabian Gulf & Adjacent Waters**\n\nTracking 4 VLCC-class vessels (>200,000 DWT):\n\n• **EASTERN PIONEER** (319,000 DWT) — IMO 9287631\n  Underway · Singapore flag · Pacific Crude Carriers\n\n• **EURONAV NINA** (308,491 DWT) — IMO 9320116\n  In Service · Belgium flag · Euronav NV\n\n• **MT SUEZ GLORY** (298,000 DWT) — IMO 9445566\n  Transiting Suez Canal · Malta flag\n\n• **MT STELLAR** (310,000 DWT) — IMO 9667799\n  Underway · Hong Kong flag · CNOOC\n\nWould you like voyage details or sanctions screening?"
  return `I searched the maritime database for **"${q}"**.\n\nI found relevant records across vessels, companies, ports, and compliance data. For a more targeted answer, try:\n\n• A vessel name or IMO number\n• Port name or LOCODE\n• Sanctions screening for a company\n• PSC inspection history by flag or MOU region\n• AIS tracking queries\n\nOr try one of the quick questions below.`
}

export default function TopNav() {
  const { persona, personaId, switchPersona } = usePreferences()
  const [showPersonaDrop, setShowPersonaDrop] = useState(false)
  const [showUserDrop,    setShowUserDrop]    = useState(false)
  const [showAiPanel,     setShowAiPanel]     = useState(false)
  const [aiMessages,      setAiMessages]      = useState([{ role: 'ai', text: AI_GREET }])
  const [aiInput,         setAiInput]         = useState('')
  const [aiThinking,      setAiThinking]      = useState(false)
  const personaRef = useRef(null)
  const userRef    = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (personaRef.current && !personaRef.current.contains(e.target)) setShowPersonaDrop(false)
      if (userRef.current    && !userRef.current.contains(e.target))    setShowUserDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, aiThinking])

  function sendMessage(text) {
    const q = (text || aiInput).trim()
    if (!q || aiThinking) return
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', text: q }])
    setAiThinking(true)
    setTimeout(() => {
      setAiMessages(prev => [...prev, { role: 'ai', text: aiRespond(q) }])
      setAiThinking(false)
    }, 800 + Math.random() * 500)
  }

  function renderMsg(text) {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    )
  }

  const nl = ({ isActive }) => isActive ? 'nt active' : 'nt'

  return (
    <>
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

            <button className="aiBtn" onClick={() => setShowAiPanel(v => !v)}>
              <span>✦</span> Ask AI
            </button>
            <div className="navSep"></div>

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
          <NavLink to="/vessels"       className={nl}><span className="ntI">🚢</span> Vessels</NavLink>
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
          <NavLink to="/vessel-images" className={nl}><span className="ntI">📷</span> Images</NavLink>
          <div className="navSep"></div>
          <NavLink to="/etl"         className={nl}><span className="ntI">⚙️</span> ETL</NavLink>
          <NavLink to="/bigquery"    className={nl}><span className="ntI">🔬</span> DM</NavLink>
        </div>
      </nav>

      {/* ── Ask AI Sliding Panel ───────────────────────── */}
      <style>{`
        @keyframes aiDot{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}
        @keyframes aiSlide{from{transform:translateX(100%)}to{transform:translateX(0)}}
      `}</style>

      {showAiPanel && (
        <div style={{position:'fixed',inset:0,zIndex:1200,display:'flex',justifyContent:'flex-end',pointerEvents:'all'}}>
          <div
            style={{position:'absolute',inset:0,background:'rgba(0,0,0,.32)',backdropFilter:'blur(2px)'}}
            onClick={() => setShowAiPanel(false)}
          />
          <div style={{
            position:'relative',width:430,background:'#fff',display:'flex',flexDirection:'column',
            boxShadow:'-6px 0 28px rgba(0,0,0,.22)',animation:'aiSlide .22s ease',
          }}>
            {/* Panel header */}
            <div style={{
              background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
              padding:'14px 18px',display:'flex',alignItems:'center',gap:10,flexShrink:0,
            }}>
              <div style={{
                width:34,height:34,borderRadius:9,background:'rgba(255,255,255,.15)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,
              }}>✦</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>Maritime AI Assistant</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.55)',marginTop:1,textTransform:'uppercase',letterSpacing:.4}}>Powered by S&amp;P Maritime Intelligence</div>
              </div>
              <button
                onClick={() => setShowAiPanel(false)}
                style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'rgba(255,255,255,.8)',borderRadius:5,padding:'4px 10px',cursor:'pointer',fontFamily:'inherit',fontSize:11}}
              >✕</button>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>
              {aiMessages.map((m, i) => (
                <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',flexDirection:m.role==='user'?'row-reverse':'row'}}>
                  {m.role === 'ai' && (
                    <div style={{
                      width:28,height:28,borderRadius:'50%',flexShrink:0,
                      background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',
                    }}>✦</div>
                  )}
                  <div style={{
                    maxWidth:'84%',padding:'9px 13px',fontSize:12,lineHeight:1.65,
                    whiteSpace:'pre-line',
                    borderRadius:m.role==='ai'?'3px 12px 12px 12px':'12px 3px 12px 12px',
                    background:m.role==='ai'?'#f5f4ff':'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    color:m.role==='ai'?'var(--txt)':'#fff',
                    border:m.role==='ai'?'1px solid #e0ddf7':'none',
                  }}>
                    {renderMsg(m.text)}
                  </div>
                </div>
              ))}
              {aiThinking && (
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',flexShrink:0}}>✦</div>
                  <div style={{padding:'11px 14px',borderRadius:'3px 12px 12px 12px',background:'#f5f4ff',border:'1px solid #e0ddf7',display:'flex',gap:5,alignItems:'center'}}>
                    {[0,1,2].map(j => (
                      <div key={j} style={{width:6,height:6,borderRadius:'50%',background:'#7c3aed',animation:`aiDot 1.2s ease-in-out ${j*0.18}s infinite`}}/>
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            {/* Quick questions */}
            <div style={{padding:'10px 16px',borderTop:'1px solid var(--bd)',background:'var(--bg2)',flexShrink:0}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,color:'var(--txt3)',marginBottom:7}}>Quick Questions</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {QUICK_QS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={aiThinking}
                    style={{
                      fontSize:10,padding:'4px 10px',border:'1px solid var(--bd)',
                      borderRadius:12,background:'#fff',color:'var(--txt2)',
                      cursor:'pointer',fontFamily:'inherit',transition:'all .12s',
                      opacity:aiThinking?.6:1,
                    }}
                  >{q}</button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--bd)',background:'#fff',display:'flex',gap:8,flexShrink:0}}>
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Ask about vessels, ports, compliance, sanctions…"
                style={{
                  flex:1,background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--txt)',
                  fontSize:12,padding:'8px 12px',borderRadius:6,outline:'none',fontFamily:'inherit',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={aiThinking || !aiInput.trim()}
                style={{
                  background:'linear-gradient(135deg,#7c3aed,#4f46e5)',border:'none',color:'#fff',
                  borderRadius:6,padding:'8px 14px',cursor:'pointer',fontWeight:700,fontSize:12,
                  fontFamily:'inherit',opacity:(aiThinking||!aiInput.trim())?.5:1,transition:'opacity .15s',
                }}
              >Send ↑</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
