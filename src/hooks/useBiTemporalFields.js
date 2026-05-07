import { useMemo } from 'react'
import { getEntityFieldsAtDate, getChangedFieldCount } from '../data/vesselTimeline'
import { getEntityFields } from '../data/entities'

export function useBiTemporalFields(vessel, entityKey, curDate) {
  return useMemo(() => {
    if (!vessel) return { fields: [], changedCount: 0, currentFields: [] }
    return {
      fields: getEntityFieldsAtDate(vessel, entityKey, curDate),
      currentFields: getEntityFields(vessel, entityKey),
      changedCount: getChangedFieldCount(vessel, entityKey, curDate)
    }
  }, [vessel, entityKey, curDate])
}
