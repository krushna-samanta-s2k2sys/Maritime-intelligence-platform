import { useNavigate, useLocation } from 'react-router-dom'

/* Shared sub-nav for all ETL section pages.
   Props:
     view         – current sub-view string ('list'|'configure'|'global'), only relevant for /etl
     onViewChange – setter to change sub-view on the /etl page
     metrics      – optional { pipelines, errors, qcFailed, review, active } override
*/

const DEFAULT_METRICS = {
  pipelines: 12,
  errors:    1,
  qcFailed:  4075,
  review:    838,
  active:    11,
}

export default function ETLSubNav({ view = 'list', onViewChange, metrics: m = {} }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const stats = { ...DEFAULT_METRICS, ...m }

  function goSettings() {
    if (pathname === '/etl') onViewChange?.('global')
    else navigate('/etl', { state: { view: 'global' } })
  }

  const tabs = [
    { id:'pipelines', label:'⚙ Pipelines',   onClick: () => pathname === '/etl' ? onViewChange?.('list') : navigate('/etl') },
    { id:'runs',      label:'📋 Run History', onClick: () => navigate('/etl-runs')   },
    { id:'review',    label:'👁 Review',      onClick: () => navigate('/etl-review') },
    { id:'settings',  label:'⚙ Settings',    onClick: goSettings },
  ]

  function isActive(id) {
    if (id === 'settings')  return pathname === '/etl' && view === 'global'
    if (id === 'pipelines') return pathname === '/etl' && view !== 'global'
    if (id === 'runs')      return pathname === '/etl-runs'
    if (id === 'review')    return pathname === '/etl-review'
    return false
  }

  return (
    <div className="etlSubNavWrap">
      {/* Tab row */}
      <div className="etlSubNavRow">
        <div className="etlSubNavTabs">
          {tabs.map(t => (
            <button key={t.id}
              className={`etlSubNavTab${isActive(t.id) ? ' on' : ''}`}
              onClick={t.onClick}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Inline metrics on the right */}
        <div className="etlSubMetrics">
          <div className="etlSubMetric">
            <span className="etlSubMetricVal">{stats.pipelines}</span>
            <span className="etlSubMetricLbl">Pipelines</span>
          </div>
          <div className="etlSubMetricDiv"/>
          <div className="etlSubMetric">
            <span className="etlSubMetricVal" style={{color:'#dc2626'}}>{stats.errors}</span>
            <span className="etlSubMetricLbl">Errors</span>
          </div>
          <div className="etlSubMetricDiv"/>
          <div className="etlSubMetric">
            <span className="etlSubMetricVal" style={{color:'#d97706'}}>{stats.qcFailed.toLocaleString()}</span>
            <span className="etlSubMetricLbl">QC Failed</span>
          </div>
          <div className="etlSubMetricDiv"/>
          <div className="etlSubMetric">
            <span className="etlSubMetricVal" style={{color:'#7c3aed'}}>{stats.review.toLocaleString()}</span>
            <span className="etlSubMetricLbl">Need Review</span>
          </div>
          <div className="etlSubMetricDiv"/>
          <div className="etlSubMetric">
            <span className="etlSubMetricVal" style={{color:'#16a34a'}}>{stats.active}</span>
            <span className="etlSubMetricLbl">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
