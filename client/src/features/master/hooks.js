import { useState, useEffect, useCallback } from 'react'
import { getCropsApi, getLocationsApi, getBranchesApi } from './api'

export function useCrops() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCropsApi()
      setData(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load crops')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useLocations() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getLocationsApi()
      setData(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useBranches() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getBranchesApi()
      setData(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
