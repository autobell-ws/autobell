import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthRole } from './AuthContextValue'
import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [baseRole, setBaseRole] = useState<AuthRole>(null)
  const [dbSchoolId, setDbSchoolId] = useState<string | null>(null)
  const [dbPartnerId, setDbPartnerId] = useState<string | null>(null)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [otaEnabled, setOtaEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // Inspection states (Super Admin inspecting a specific campus or partner - NEVER overwrites baseRole)
  const [inspectedSchoolId, setInspectedSchoolId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('inspectedSchoolId') || sessionStorage.getItem('impersonatedSchoolId')
    }
    return null
  })

  const [inspectedPartnerId, setInspectedPartnerId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('inspectedPartnerId') || sessionStorage.getItem('impersonatedPartnerId')
    }
    return null
  })

  const fetchUserDetails = useCallback(async (userId: string, currentUser?: User | null) => {
    try {
      // 1. Fast path: User & App metadata check
      const email = currentUser?.email?.toLowerCase() || ''
      const isKnownSuperAdmin = email === 'muddasirh@gmail.com'
      const metaRole = (currentUser?.app_metadata?.role as AuthRole) ||
                       (currentUser?.user_metadata?.role as AuthRole) ||
                       (isKnownSuperAdmin ? 'super_admin' : null)

      // If already known super admin, set early to prevent render flash
      if (metaRole === 'super_admin' || isKnownSuperAdmin) {
        setBaseRole('super_admin')
        setDbSchoolId(null)
      }

      // 2. Query public.users
      const queryPromise = supabase
        .from('users')
        .select('school_id, role, tts_enabled, ota_enabled')
        .eq('id', userId)
        .maybeSingle()

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 6000)
      )

      type UserDetailsRow = {
        school_id: string | null
        role: AuthRole
        tts_enabled: boolean | null
        ota_enabled: boolean | null
      }

      type UserDetailsResponse = {
        data: UserDetailsRow | null
        error: unknown
      }

      const { data, error } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as UserDetailsResponse

      if (error || !data) {
        console.warn('Profile query fallback for:', userId, error)
        const finalRole = (metaRole === 'super_admin' || isKnownSuperAdmin) ? 'super_admin' : (metaRole || 'admin')
        setBaseRole(finalRole)
        setDbSchoolId(finalRole === 'super_admin' ? null : 'a0000000-0000-0000-0000-000000000001')
        setTtsEnabled(true)
        setOtaEnabled(true)
        return
      }

      // Determine resolved role: Super admin metadata CANNOT be overridden by an accidental DB 'admin' downgrade
      let resolvedRole: AuthRole = data.role as AuthRole
      if (metaRole === 'super_admin' || isKnownSuperAdmin) {
        resolvedRole = 'super_admin'
      } else if (!resolvedRole) {
        resolvedRole = metaRole || 'admin'
      }

      setBaseRole(resolvedRole)
      setDbSchoolId(resolvedRole === 'super_admin' ? null : (data.school_id ?? null))
      setTtsEnabled(data.tts_enabled !== false)
      setOtaEnabled(data.ota_enabled !== false)

      if (resolvedRole === 'partner') {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        setDbPartnerId(partnerData ? partnerData.id : null)
      } else {
        setDbPartnerId(null)
      }
    } catch (err) {
      console.error('Error fetching user details:', err)
      const isKnownSuperAdmin = currentUser?.email?.toLowerCase() === 'muddasirh@gmail.com'
      const fallbackRole: AuthRole = isKnownSuperAdmin ? 'super_admin' : 'admin'
      setBaseRole(fallbackRole)
      setDbSchoolId(fallbackRole === 'super_admin' ? null : 'a0000000-0000-0000-0000-000000000001')
      setTtsEnabled(true)
      setOtaEnabled(true)
    }
  }, [])

  const startSchoolInspection = useCallback((targetSchoolId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('inspectedSchoolId', targetSchoolId)
      sessionStorage.removeItem('inspectedPartnerId')
      sessionStorage.setItem('impersonatedSchoolId', targetSchoolId)
      sessionStorage.removeItem('impersonatedPartnerId')
    }
    setInspectedSchoolId(targetSchoolId)
    setInspectedPartnerId(null)
  }, [])

  const startPartnerInspection = useCallback((targetPartnerId: string, _targetUserId?: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('inspectedPartnerId', targetPartnerId)
      sessionStorage.removeItem('inspectedSchoolId')
      sessionStorage.setItem('impersonatedPartnerId', targetPartnerId)
      sessionStorage.removeItem('impersonatedSchoolId')
    }
    setInspectedPartnerId(targetPartnerId)
    setInspectedSchoolId(null)
  }, [])

  const stopInspection = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('inspectedSchoolId')
      sessionStorage.removeItem('inspectedPartnerId')
      sessionStorage.removeItem('impersonatedSchoolId')
      sessionStorage.removeItem('impersonatedPartnerId')
    }
    setInspectedSchoolId(null)
    setInspectedPartnerId(null)
    if (user) {
      await fetchUserDetails(user.id, user)
    }
  }, [user, fetchUserDetails])

  useEffect(() => {
    let isCancelled = false

    const watchdog = setTimeout(() => {
      setLoading(false)
    }, 2000)

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Session retrieval error:', error)
        }
        if (!isCancelled) {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserDetails(session.user.id, session.user)
          } else {
            setBaseRole(null)
            setDbSchoolId(null)
          }
        }
      } catch (err) {
        console.error('Session init error:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (isCancelled) return
      console.log('Auth state changed:', event)

      if (event === 'SIGNED_OUT' || !currentSession?.user) {
        queryClient.clear()
        setSession(null)
        setUser(null)
        setBaseRole(null)
        setDbSchoolId(null)
        setLoading(false)
        return
      }

      setSession(currentSession)
      setUser(currentSession.user)

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        await fetchUserDetails(currentSession.user.id, currentSession.user)
      }
      setLoading(false)
    })

    return () => {
      isCancelled = true
      clearTimeout(watchdog)
      subscription.unsubscribe()
    }
  }, [fetchUserDetails, queryClient])

  // Effective role is only used for UI preview rendering if inspecting
  const effectiveRole: AuthRole = useMemo(() => {
    if (baseRole === 'super_admin') {
      if (inspectedSchoolId) return 'admin'
      if (inspectedPartnerId) return 'partner'
      return 'super_admin'
    }
    return baseRole
  }, [baseRole, inspectedSchoolId, inspectedPartnerId])

  const effectiveSchoolId = useMemo(() => {
    if (baseRole === 'super_admin') {
      return inspectedSchoolId
    }
    return dbSchoolId
  }, [baseRole, inspectedSchoolId, dbSchoolId])

  const effectivePartnerId = useMemo(() => {
    if (baseRole === 'super_admin') {
      return inspectedPartnerId
    }
    return dbPartnerId
  }, [baseRole, inspectedPartnerId, dbPartnerId])

  const value = useMemo(() => ({
    session,
    user,
    role: baseRole,                      // CRITICAL: Base role NEVER mutates to 'admin'
    effectiveRole,                      // Used only for inspection rendering
    schoolId: effectiveSchoolId,
    partnerId: effectivePartnerId,
    ttsEnabled: baseRole === 'super_admin' || baseRole === 'admin' || ttsEnabled,
    otaEnabled: baseRole === 'super_admin' || baseRole === 'admin' || otaEnabled,
    loading,
    signOut: async () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('inspectedSchoolId')
        sessionStorage.removeItem('inspectedPartnerId')
        sessionStorage.removeItem('impersonatedSchoolId')
        sessionStorage.removeItem('impersonatedPartnerId')
      }
      await supabase.auth.signOut()
      queryClient.clear()
      setSession(null)
      setUser(null)
      setBaseRole(null)
      setDbSchoolId(null)
      setInspectedSchoolId(null)
      setInspectedPartnerId(null)
      setDbPartnerId(null)
    },
    inspectedSchoolId,
    inspectedPartnerId,
    isInspecting: !!inspectedSchoolId || !!inspectedPartnerId,
    startSchoolInspection,
    startPartnerInspection,
    stopInspection,

    // Backward compatibility aliases for existing components
    impersonatedSchoolId: inspectedSchoolId,
    impersonatedPartnerId: inspectedPartnerId,
    isImpersonating: !!inspectedSchoolId || !!inspectedPartnerId,
    impersonateSchool: startSchoolInspection,
    impersonatePartner: startPartnerInspection,
    stopImpersonation: stopInspection,
  }), [
    session,
    user,
    baseRole,
    effectiveRole,
    effectiveSchoolId,
    effectivePartnerId,
    ttsEnabled,
    otaEnabled,
    loading,
    inspectedSchoolId,
    inspectedPartnerId,
    startSchoolInspection,
    startPartnerInspection,
    stopInspection,
    queryClient
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
