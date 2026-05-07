import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const COS = [
  {id:1, name:'Aegean Carriers SA',       country:'Greece',       role:'Registered Owner',   fleet:12,  vessels:['PACIFIC STAR','ADRIATIC SPIRIT'],    bo:'K. Papadopoulos',          sanc:'Clear',     type:'Shipowner',               pi:'Steamship Mutual',        address:'Piraeus, Greece',               phone:'+30 210 429 1000', email:'info@aegeancarriers.gr',          founded:1985,employees:240},
  {id:2, name:'Pacific Crude Carriers',   country:'Singapore',    role:'Registered Owner',   fleet:8,   vessels:['EASTERN PIONEER'],                   bo:'Pacific Crude Holdings',   sanc:'Clear',     type:'Shipowner',               pi:'Gard P&I',                address:'Singapore',                     phone:'+65 6222 1234',    email:'ops@paccrudell.sg',               founded:1998,employees:380},
  {id:3, name:'Tokyo Gas Shipping',       country:'Japan',        role:'Registered Owner',   fleet:6,   vessels:['STELLAR WIND'],                      bo:'Tokyo Gas Corp',           sanc:'Clear',     type:'Shipowner',               pi:'Japan P&I Club',          address:'Tokyo, Japan',                  phone:'+81 3 5400 7400',  email:'',                                founded:1992,employees:180},
  {id:4, name:'A.P. Moller-Maersk',       country:'Denmark',      role:'Commercial Operator',fleet:748, vessels:['MAERSK COLON'],                      bo:'A.P. Moller Holding',      sanc:'Clear',     type:'Container Line',          pi:'UK P&I Club',             address:'Copenhagen, Denmark',           phone:'+45 3363 3363',    email:'customerservice@maersk.com',      founded:1904,employees:95000},
  {id:5, name:'Columbia Ship Mgmt',       country:'Cyprus',       role:'Technical Manager',  fleet:380, vessels:['PACIFIC STAR'],                      bo:'Held Mühlen Family',       sanc:'Clear',     type:'Ship Manager',            pi:'North of England P&I',    address:'Limassol, Cyprus',              phone:'+357 25 843100',   email:'admin@columbia.com.cy',           founded:1978,employees:3200},
  {id:6, name:'V.Ships',                  country:'Monaco',       role:'Technical Manager',  fleet:920, vessels:['OCEAN PRIDE','SUNRISE CARRIER'],     bo:'Oaktree Capital / V.Group',sanc:'Clear',     type:'Ship Manager',            pi:'Various',                 address:'Monaco',                        phone:'+377 9770 3800',   email:'info@vships.com',                 founded:1984,employees:30000},
  {id:7, name:'Gard P&I Club',            country:'Norway',       role:'P&I Club',           fleet:9800,vessels:[],                                   bo:'Mutual Club',              sanc:'Clear',     type:'P&I Club',                pi:'—',                       address:'Arendal, Norway',               phone:'+47 37 01 91 00',  email:'gard@gard.no',                    founded:1907,employees:1100},
  {id:8, name:'UK P&I Club',              country:'United Kingdom',role:'P&I Club',          fleet:6200,vessels:[],                                   bo:'Mutual Club',              sanc:'Clear',     type:'P&I Club',                pi:'—',                       address:'Newcastle upon Tyne, UK',       phone:'+44 191 232 5221', email:'enquiries@ukpandi.com',           founded:1869,employees:420},
  {id:9, name:'Star Bulk Carriers',       country:'Greece',       role:'Registered Owner',   fleet:128, vessels:['ATLANTIC BULKER'],                   bo:'Oaktree Capital',          sanc:'Clear',     type:'Shipowner',               pi:'North of England P&I',    address:'Athens, Greece',                phone:'+30 210 891 7740', email:'ir@starbulk.com',                 founded:2006,employees:680},
  {id:10,name:'MSC Mediterranean',        country:'Switzerland',  role:'Registered Owner',   fleet:744, vessels:['MSC OSCAR'],                         bo:'Gianluigi Aponte Family',  sanc:'Clear',     type:'Container Line',          pi:'Steamship Mutual',        address:'Geneva, Switzerland',           phone:'+41 22 703 8888',  email:'',                                founded:1970,employees:150000},
  {id:11,name:'DNV GL',                   country:'Norway',       role:'Class Society',      fleet:13200,vessels:[],                                  bo:'Det Norske Veritas',       sanc:'Clear',     type:'Classification Society',  pi:'—',                       address:'Høvik, Norway',                 phone:'+47 67 57 99 00',  email:'',                                founded:1864,employees:12500},
  {id:12,name:"Lloyd's Register",         country:'United Kingdom',role:'Class Society',     fleet:9800,vessels:[],                                   bo:'Mutual / Charitable Found.',sanc:'Clear',    type:'Classification Society',  pi:'—',                       address:'London, UK',                    phone:'+44 20 7709 9166', email:'',                                founded:1760,employees:9400},
  {id:13,name:'Bureau Veritas Marine',    country:'France',       role:'Class Society',      fleet:11400,vessels:[],                                  bo:'Bureau Veritas SA',        sanc:'Clear',     type:'Classification Society',  pi:'—',                       address:'Neuilly-sur-Seine, France',     phone:'+33 1 55 24 70 00',email:'',                                founded:1828,employees:80000},
  {id:14,name:'Synergy Marine Group',     country:'Singapore',    role:'Manning Agent',      fleet:450, vessels:[],                                   bo:'Rajesh Unni',              sanc:'Clear',     type:'Manning Agent',           pi:'—',                       address:'Singapore',                     phone:'+65 6879 7500',    email:'info@synergymarine.com',          founded:2006,employees:7400},
  {id:15,name:'Euronav NV',               country:'Belgium',      role:'Registered Owner',   fleet:42,  vessels:['EURONAV NINA'],                      bo:'Saverys Family / CMB',     sanc:'Clear',     type:'Shipowner',               pi:'North of England P&I',    address:'Antwerp, Belgium',              phone:'+32 3 247 44 11',  email:'ir@euronav.com',                  founded:2000,employees:540},
]

const KPIS = [['42,881','Companies'],['15,444','Ship Owners'],['8,220','Ship Managers'],['188','P&I Clubs'],['412','Class Societies'],['1,884','Manning Agents']]
const ROLES = ['Registered Owner','Beneficial Owner','Commercial Operator','Technical Manager','Ship Manager','P&I Club','Class Society','Manning Agent','DOC Company']
const TYPE_ICONS = {Shipowner:'🚢','Container Line':'📦','Ship Manager':'⚙️','P&I Club':'🛡','Classification Society':'📋','Manning Agent':'👤'}

function chainNode(icon, role, name, country, color) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',border:'1px solid var(--bd)',borderRadius:6,background:'#fff',cursor:'pointer'}}>
      <div style={{width:32,height:32,borderRadius:8,background:color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:9,fontWeight:700,color,textTransform:'uppercase',letterSpacing:.5}}>{role}</div>
        <div style={{fontSize:12,fontWeight:600,color:'var(--txt)'}}>{name}</div>
        <div style={{fontSize:10,color:'var(--txt3)'}}>{country}</div>
      </div>
      <span style={{fontSize:18,color:'var(--txt3)'}}>›</span>
    </div>
  )
}

export default function Companies() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [ctryFilter, setCtryFilter] = useState('')
  const [selCo, setSelCo] = useState(null)

  const filtered = useMemo(() => {
    let cs = COS
    if (search) { const q=search.toLowerCase(); cs=cs.filter(c=>c.name.toLowerCase().includes(q)||c.country.toLowerCase().includes(q)||c.role.toLowerCase().includes(q)) }
    if (roleFilter) cs=cs.filter(c=>c.role===roleFilter)
    if (ctryFilter) cs=cs.filter(c=>c.country===ctryFilter)
    return cs
  }, [search, roleFilter, ctryFilter])

  const sancColor = s => s==='Clear'?'#137333':s==='Watchlist'?'#b45309':'#c8102e'

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',minHeight:0}}>
      {/* Search */}
      <div className="sBar">
        <div className="siWrap"><span className="siIc">🔍</span><input className="si" placeholder="Search company name, country, role (owner, manager, P&I club)…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="fSel" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="">All Roles</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
        <select className="fSel" value={ctryFilter} onChange={e=>setCtryFilter(e.target.value)}>
          <option value="">All Countries</option>
          {['Greece','Singapore','Norway','Denmark','Japan','Germany','United Kingdom','USA','China','South Korea','Switzerland'].map(c=><option key={c}>{c}</option>)}
        </select>
        <select className="fSel"><option value="">All Screening Statuses</option><option>Clear</option><option>Watchlist</option><option>Sanctioned</option></select>
        <button className="btn btnP">🔍 Search</button>
      </div>
      {/* KPI chips */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'8px 14px',background:'var(--bg2)',borderBottom:'1px solid var(--bd)'}}>
        {KPIS.map(([v,l])=>(
          <div key={l} style={{display:'flex',flexDirection:'column',gap:1,background:'#fff',border:'1px solid var(--bd)',borderRadius:4,padding:'6px 10px',minWidth:80}}>
            <div style={{fontSize:16,fontWeight:700,color:'var(--txt)'}}>{v}</div>
            <div style={{fontSize:9,color:'var(--txt3)',textTransform:'uppercase',letterSpacing:.3}}>{l}</div>
          </div>
        ))}
      </div>
      {/* Main 2-col */}
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',flex:1,minHeight:0,overflow:'hidden'}}>
        {/* Company List */}
        <div style={{borderRight:'1px solid var(--bd)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'8px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--bd)',background:'var(--bg3)',flexShrink:0}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--txt)'}}>COMPANIES</span>
            <span style={{fontSize:10,color:'var(--txt3)'}}>{filtered.length} companies</span>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {filtered.length === 0 ? <div className="empty">No companies found</div> : filtered.map(c => {
              const ic = TYPE_ICONS[c.type] || '🏢'
              const sc = sancColor(c.sanc)
              return (
                <div key={c.id} onClick={()=>setSelCo(c)} style={{padding:'10px 14px',borderBottom:'1px solid var(--bd)',cursor:'pointer',background:selCo?.id===c.id?'var(--bg2)':'#fff',borderLeft:selCo?.id===c.id?'3px solid var(--sp-red)':'3px solid transparent'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                    <span style={{fontSize:13}}>{ic}</span>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--txt)',flex:1}}>{c.name}</span>
                    <span className="tag tN" style={{fontSize:8}}>{c.type}</span>
                    <span style={{width:7,height:7,borderRadius:'50%',background:sc,flexShrink:0}} title={`Sanctions: ${c.sanc}`}/>
                  </div>
                  <div style={{display:'flex',gap:10,fontSize:10,color:'var(--txt3)'}}>
                    <span>{c.country}</span>
                    <span>Fleet: <strong style={{color:'var(--txt)'}}>{c.fleet}</strong></span>
                    <span>{c.role}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Company Detail */}
        <div style={{overflowY:'auto',background:'var(--bg)'}}>
          {!selCo ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:80,color:'var(--txt3)'}}>
              <span style={{fontSize:40}}>🏢</span>
              <span style={{fontSize:13,fontWeight:600}}>Select a company</span>
              <span style={{fontSize:11,textAlign:'center'}}>Click a company to view ownership chain, fleet, and compliance details</span>
            </div>
          ) : (() => {
            const c = selCo
            const ic = TYPE_ICONS[c.type] || '🏢'
            const sc = sancColor(c.sanc)
            return (
              <div style={{padding:16,display:'flex',flexDirection:'column',gap:14}}>
                {/* Company Card */}
                <div className="panel">
                  <div style={{padding:'14px 16px',display:'flex',gap:14,alignItems:'flex-start',borderBottom:'1px solid var(--bd)'}}>
                    <div style={{width:52,height:52,borderRadius:10,background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>{ic}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:18,fontWeight:700,color:'var(--txt)'}}>{c.name}</div>
                      <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>{c.type} · {c.country} · Est. {c.founded}</div>
                      <div style={{display:'flex',gap:6,marginTop:6}}>
                        <span className="tag tN">{c.role}</span>
                        <span className="tag" style={{background:sc+'33',color:sc}}>{c.sanc}</span>
                        {c.fleet>0 && <span className="tag tB">{c.fleet} vessels</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btnS btnSm" onClick={()=>navigate('/compliance')}>🚨 Screen</button>
                      <button className="btn btnS btnSm">↗ Export</button>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)'}}>
                    {[['Beneficial Owner',c.bo],['Country',c.country],['Founded',c.founded],['Employees',c.employees.toLocaleString()],['Address',c.address],['Phone',c.phone],['P&I Club',c.pi],['Sanctions',c.sanc]].map(([l,v])=>(
                      <div key={l} style={{padding:'8px 14px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:10,fontWeight:700,color:'var(--txt3)',minWidth:120,flexShrink:0}}>{l}</span>
                        <span style={{fontSize:12,color:'var(--txt)'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Ownership Chain */}
                <div className="panel">
                  <div className="panelH"><span className="panelT">🔗 Beneficial Ownership Chain</span></div>
                  <div style={{padding:16,display:'flex',flexDirection:'column',gap:8}}>
                    {chainNode('🏛','BENEFICIAL OWNER',c.bo,c.country,'#6200ea')}
                    <div style={{textAlign:'center',fontSize:10,color:'var(--txt3)',padding:'4px 0'}}>↓ 100% ownership</div>
                    {chainNode('🏢','HOLDING COMPANY',c.name+' Holdings Ltd','Marshall Islands','#1558d6')}
                    <div style={{textAlign:'center',fontSize:10,color:'var(--txt3)',padding:'4px 0'}}>↓ 100% ownership</div>
                    {chainNode('🚢','REGISTERED OWNER',c.name,c.country,'#137333')}
                    {c.role!=='Technical Manager'&&c.role!=='Ship Manager'&&<>
                      <div style={{textAlign:'center',fontSize:10,color:'var(--txt3)',padding:'4px 0'}}>↓ manages</div>
                      {chainNode('⚙️','TECHNICAL MANAGER',c.name==='Aegean Carriers SA'?'Columbia Ship Mgmt':c.name,c.country,'#b45309')}
                    </>}
                  </div>
                </div>
                {/* Fleet */}
                {c.vessels&&c.vessels.length>0&&(
                  <div className="panel">
                    <div className="panelH"><span className="panelT">🚢 Owned Fleet (sample)</span><span className="tag tB" style={{marginLeft:'auto'}}>{c.fleet} total</span></div>
                    <div style={{padding:14,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
                      {c.vessels.map(v=>(
                        <div key={v} onClick={()=>navigate('/vessels')} style={{border:'1px solid var(--bd)',borderRadius:6,padding:'10px 12px',cursor:'pointer',background:'#fff'}}><div style={{fontSize:12,fontWeight:700,color:'var(--blue)'}}>{v}</div><div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>Container Ship · Active</div><div style={{fontSize:9,color:'var(--txt3)',fontFamily:'monospace',marginTop:2}}>IMO 9412345</div></div>
                      ))}
                      <div onClick={()=>navigate('/vessels')} style={{border:'1px dashed var(--bd)',borderRadius:6,padding:'10px 12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--txt3)',fontSize:10}}>+ {c.fleet-c.vessels.length} more vessels →</div>
                    </div>
                  </div>
                )}
                {/* Corporate Tree */}
                <div className="panel">
                  <div className="panelH"><span className="panelT">🏗 Corporate Structure</span></div>
                  <div style={{padding:16,display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
                    <div style={{border:'1px solid var(--bd)',borderRadius:6,padding:'8px 14px',background:'#f3e8ff',fontWeight:700,fontSize:12,color:'#6200ea'}}>{c.bo}<br/><span style={{fontSize:8,opacity:.7}}>Beneficial Owner</span></div>
                    <div style={{width:2,height:20,background:'var(--bd)'}}/>
                    <div style={{border:'2px solid var(--sp-red)',borderRadius:6,padding:'8px 14px',background:'#fff',fontWeight:700,fontSize:12}}>{c.name} Holdings Ltd<br/><span style={{fontSize:8,color:'var(--txt3)'}}>Marshall Islands SPV</span></div>
                    <div style={{width:2,height:20,background:'var(--bd)'}}/>
                    <div style={{display:'flex',gap:20}}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
                        <div style={{width:2,height:12,background:'var(--bd)'}}/>
                        <div style={{border:'1px solid var(--bd)',borderRadius:6,padding:'6px 10px',background:'#fff',fontSize:11}}>{c.name}<br/><span style={{fontSize:8,color:'var(--txt3)'}}>Ship Owning Co.</span></div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
                        <div style={{width:2,height:12,background:'var(--bd)'}}/>
                        <div style={{border:'1px solid var(--bd)',borderRadius:6,padding:'6px 10px',background:'#fff',fontSize:11}}>{c.name} Trading Ltd<br/><span style={{fontSize:8,color:'var(--txt3)'}}>Commercial Ops</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
