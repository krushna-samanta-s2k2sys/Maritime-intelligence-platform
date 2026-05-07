import { useState, useMemo } from 'react'
import { VESSELS } from '../data/vessels'

export function useVesselFilter() {
  const [search, setSearch] = useState('')
  const [shipType, setShipType] = useState('')
  const [flag, setFlag] = useState('')
  const [status, setStatus] = useState('')
  const [classSoc, setClassSoc] = useState('')

  const filtered = useMemo(() => VESSELS.filter(v => {
    if (search && !v.nm.toLowerCase().includes(search.toLowerCase()) &&
        !v.imo.includes(search) && !v.mmsi.includes(search)) return false
    if (shipType && v.ty !== shipType) return false
    if (flag && v.fn !== flag) return false
    if (status && v.st !== status) return false
    if (classSoc && v.cls !== classSoc) return false
    return true
  }), [search, shipType, flag, status, classSoc])

  return { filtered, search, setSearch, shipType, setShipType, flag, setFlag, status, setStatus, classSoc, setClassSoc }
}
