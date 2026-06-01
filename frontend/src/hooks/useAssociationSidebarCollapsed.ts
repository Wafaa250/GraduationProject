import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'skillswap-association-sidebar-collapsed'

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useAssociationSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      /* ignore */
    }
  }, [collapsed])

  const toggle = useCallback(() => {
    setCollapsed((c) => !c)
  }, [])

  return { collapsed, setCollapsed, toggle }
}
