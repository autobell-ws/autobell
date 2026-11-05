# AutoBell Master Architecture & Implementation Prompt: Total Separation of Super Admin and School Admin

> **File:** `admin1.md`  
> **Target:** AutoBell Web Dashboard & Database Infrastructure  
> **Scope:** Full isolation between Super Admin and School Admin (Database, Authentication Context, Route Guards, Layouts, and Shared Components).

---

## 1. Executive Summary & Root Cause Analysis

### The Problem
When logged in as a Super Admin (`muddasirh@gmail.com`), navigating between dashboard tabs (e.g., Overview, School Management, Inventory, Support Tickets, Enterprise Reports) intermittently or permanently demotes the user to a School Admin (`admin`), redirecting them from `/super-admin/*` to `/dashboard/*`.

### Deep Dive: Why the System Was Switching Super Admin to Admin

Through a forensic audit of the entire codebase and database schema, five intertwined flaws were identified:

1. **Database Seed Flaw (`01-seed.sql` & Trigger `handle_new_user`):**
   - In `supabase/init/01-seed.sql`, the initial super admin user (`muddasirh@gmail.com`) was seeded into `public.users` with `role = 'admin'` and `school_id = 'a0000000-0000-0000-0000-000000000001'`.
   - In `supabase/init/00-schema.sql`, the trigger `handle_new_user()` automatically assigned a fallback school ID (`v_default_school_id = (SELECT id FROM public.schools LIMIT 1)`) to *every* user, erroneously tethering Super Admins to an arbitrary school.

2. **Asynchronous Race Condition in `AuthContext.tsx`:**
   - On page navigation, tab clicks, or Supabase `TOKEN_REFRESHED` events, `fetchUserDetails()` runs asynchronously.
   - In `AuthContext.tsx`:
     ```typescript
     const resolvedRole = (data.role as AuthRole) || metaRole || 'admin'
     ```
     Because `data.role` in the database was `'admin'`, it **overwrote** `metaRole` (`super_admin`). As soon as the database query returned, `role` was mutated from `super_admin` to `admin`.

3. **Toxic Role Mutation via Impersonation (`sessionStorage`):**
   - Line 208 of `AuthContext.tsx` defined `role` as:
     ```typescript
     role: impersonatedSchoolId ? 'admin' : (impersonatedPartnerId ? 'partner' : role)
     ```
   - When "Impersonate" was clicked on any school or partner, the user's authentic `role` was overwritten with `'admin'`.
   - Because `impersonatedSchoolId` was saved in `sessionStorage`, any page refresh or tab click read this key on initialization, permanently locking the user into the `admin` role and blocking access to `/super-admin/*`.
   - When `stopImpersonation()` was invoked, it called `fetchUserDetails(user.id)` without passing `currentUser`, causing `metaRole` to evaluate to `null` and defaulting the role back to `'admin'`.

4. **Shared Components Between Super Admin and School Admin:**
   - Both `/super-admin/reports` and `/dashboard/reports` rendered the identical component (`ReportsManager.tsx`).
   - Both `/super-admin/tickets` and `/dashboard/tickets` rendered the identical component (`TicketManagement.tsx`).
   - These shared components queried `const { role, schoolId } = useAuth()`. When `schoolId` was non-null (due to seed or impersonation), they filtered data by `schoolId` instead of platform-wide data, creating visual role confusion.

5. **Fragile Route Guard Fallbacks in `ProtectedRoute.tsx`:**
   - In `ProtectedRoute.tsx`, if `role` momentarily became `'admin'` while on `/super-admin/*`, the guard executed:
     ```typescript
     if (requiredRole && role !== requiredRole) {
       return <Navigate to="/dashboard" replace />
     }
     ```
   - This immediately evicted the Super Admin to `/dashboard`.

---

## 2. Target Architecture: Total Role Separation

```
+-----------------------------------------------------------------------------------+
|                                 AUTOBELL IDENTITY                                 |
+-----------------------------------------------------------------------------------+
                                          |
                      +-------------------+-------------------+
                      |                                       |
                      v                                       v
        +---------------------------+           +---------------------------+
        |        SUPER ADMIN        |           |       SCHOOL ADMIN        |
        +---------------------------+           +---------------------------+
        | * Base Role: super_admin  |           | * Base Role: admin        |
        | * school_id: NULL always  |           | * school_id: NOT NULL     |
        | * Scope: Entire Platform  |           | * Scope: Single Campus    |
        | * Route: /super-admin/*   |           | * Route: /dashboard/*     |
        | * Guard: requiredRole=    |           | * Guard: requiredRole=    |
        |          "super_admin"    |           |          "admin"          |
        +---------------------------+           +---------------------------+
                      |                                       |
                      | (Inspects School)                     |
                      v                                       |
        +---------------------------+                         |
        |    INSPECTION CONTEXT     |                         |
        | * Base Role: super_admin  |                         |
        | * inspectedSchoolId: UUID |                         |
        | * NEVER mutates role      |                         |
        +---------------------------+                         |
                      |                                       |
                      +-------------------+-------------------+
                                          |
                                          v
                              +-----------------------+
                              | Dedicated Portal View |
                              +-----------------------+
```

### Architectural Principles:
1. **Immutable User Role:** The user's authenticated `role` is determined solely by verified Super Admin credentials and database record. It **NEVER** mutates into `'admin'` under any circumstances.
2. **Strict Route Isolation:**
   - `/super-admin/*` is strictly guarded for `role === 'super_admin'`.
   - `/dashboard/*` is strictly guarded for `role === 'admin' || role === 'operator'`.
   - A Super Admin visiting `/dashboard` without active inspection is redirected to `/super-admin`.
3. **Dedicated Super Admin Inspection Mode:** If a Super Admin views a school's configuration, their role remains `super_admin` with an `inspectedSchoolId` property. They are never spoofed as `'admin'`.
4. **Decoupled Components:** Super Admin pages and School Admin pages must have clear component separation or explicit mode flags so state never leaks between roles.

---

## 3. Step-by-Step Implementation Instructions

### Step 1: Database Migration & Cleanup (SQL)

Execute the following SQL script on both local Docker Supabase (`00-schema.sql` / `01-seed.sql`) and live cloud Supabase:

```sql
-- ==============================================================================
-- 1. FIX USER TRIGGER: Super Admins must NEVER be assigned a default school_id
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_default_school_id uuid;
    v_user_role text;
BEGIN
    v_user_role := COALESCE(
        NEW.raw_app_meta_data->>'role',
        NEW.raw_user_meta_data->>'role',
        'admin'
    );

    -- Super admins must have NULL school_id
    IF v_user_role = 'super_admin' THEN
        INSERT INTO public.users (id, full_name, role, school_id, tts_enabled, ota_enabled)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Super Administrator'),
            'super_admin',
            NULL,
            true,
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'super_admin',
            school_id = NULL,
            tts_enabled = true,
            ota_enabled = true;
    ELSE
        SELECT id INTO v_default_school_id FROM public.schools LIMIT 1;
        INSERT INTO public.users (id, full_name, role, school_id, tts_enabled, ota_enabled)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'School Administrator'),
            v_user_role,
            v_default_school_id,
            true,
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            tts_enabled = true,
            ota_enabled = true,
            school_id = COALESCE(public.users.school_id, v_default_school_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. CLEAN UP EXISTING SUPER ADMIN ACCOUNTS
-- ==============================================================================
-- Ensure muddasirh@gmail.com has super_admin role and NULL school_id
UPDATE public.users
SET role = 'super_admin',
    school_id = NULL,
    full_name = 'Super Administrator'
WHERE id IN (
    SELECT id FROM auth.users WHERE LOWER(email) = 'muddasirh@gmail.com'
);

-- Update auth.users metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"super_admin"'),
    raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"super_admin"')
WHERE LOWER(email) = 'muddasirh@gmail.com';

-- Ensure user_roles table is consistent
DELETE FROM public.user_roles
WHERE user_id IN (
    SELECT id FROM auth.users WHERE LOWER(email) = 'muddasirh@gmail.com'
) AND role != 'super_admin';

-- ==============================================================================
-- 3. PERMANENT SEED FIX (supabase/init/01-seed.sql)
-- ==============================================================================
-- In 01-seed.sql, replace the public.users insert with:
-- INSERT INTO public.users (id, full_name, role, school_id, tts_enabled, ota_enabled)
-- VALUES (v_user_id, 'Super Administrator', 'super_admin', NULL, true, true)
-- ON CONFLICT (id) DO UPDATE SET school_id = NULL, role = 'super_admin';
```

---

### Step 2: Rewrite `AuthContext.tsx` & `AuthContextValue.ts`

Replace the implementation in `src/context/AuthContext.tsx` with a bulletproof, non-mutating state model:

#### `src/context/AuthContextValue.ts`:
```typescript
import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthRole = 'super_admin' | 'admin' | 'operator' | 'partner' | null

export type AuthContextType = {
  session: Session | null
  user: User | null
  schoolId: string | null        // NULL for super_admin; school UUID for school admin
  role: AuthRole                 // Base authenticated role (NEVER overridden by inspection)
  effectiveRole: AuthRole        // What UI mode is currently being rendered
  ttsEnabled: boolean
  otaEnabled: boolean
  loading: boolean
  signOut: () => Promise<void>
  
  // Inspection State (Super Admin inspecting a specific school/partner)
  inspectedSchoolId: string | null
  inspectedPartnerId: string | null
  isInspecting: boolean
  startSchoolInspection: (schoolId: string) => void
  startPartnerInspection: (partnerId: string) => void
  stopInspection: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
```

#### `src/context/AuthContext.tsx`:
```typescript
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

  // Inspection states (Never overwrite baseRole!)
  const [inspectedSchoolId, setInspectedSchoolId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('inspectedSchoolId')
    }
    return null
  })

  const [inspectedPartnerId, setInspectedPartnerId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('inspectedPartnerId')
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

      // 2. Query public.users
      const { data, error } = await supabase
        .from('users')
        .select('school_id, role, tts_enabled, ota_enabled')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        console.warn('Profile query fallback for:', userId)
        const finalRole = metaRole || (isKnownSuperAdmin ? 'super_admin' : 'admin')
        setBaseRole(finalRole)
        setDbSchoolId(finalRole === 'super_admin' ? null : 'a0000000-0000-0000-0000-000000000001')
        return
      }

      // Prioritize super_admin metadata over accidental DB 'admin' downgrade
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
      setBaseRole(isKnownSuperAdmin ? 'super_admin' : 'admin')
      setDbSchoolId(isKnownSuperAdmin ? null : 'a0000000-0000-0000-0000-000000000001')
    }
  }, [])

  const startSchoolInspection = useCallback((targetSchoolId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('inspectedSchoolId', targetSchoolId)
      sessionStorage.removeItem('inspectedPartnerId')
    }
    setInspectedSchoolId(targetSchoolId)
    setInspectedPartnerId(null)
  }, [])

  const startPartnerInspection = useCallback((targetPartnerId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('inspectedPartnerId', targetPartnerId)
      sessionStorage.removeItem('inspectedSchoolId')
    }
    setInspectedPartnerId(targetPartnerId)
    setInspectedSchoolId(null)
  }, [])

  const stopInspection = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('inspectedSchoolId')
      sessionStorage.removeItem('inspectedPartnerId')
    }
    setInspectedSchoolId(null)
    setInspectedPartnerId(null)
  }, [])

  useEffect(() => {
    let isCancelled = false

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) console.warn('Auth session error:', error)
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
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (isCancelled) return
      if (event === 'SIGNED_OUT' || !currentSession?.user) {
        queryClient.clear()
        setSession(null)
        setUser(null)
        setBaseRole(null)
        setDbSchoolId(null)
        stopInspection()
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
      subscription.unsubscribe()
    }
  }, [fetchUserDetails, queryClient, stopInspection])

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
      stopInspection()
      await supabase.auth.signOut()
      queryClient.clear()
      setSession(null)
      setUser(null)
      setBaseRole(null)
      setDbSchoolId(null)
    },
    inspectedSchoolId,
    inspectedPartnerId,
    isInspecting: !!inspectedSchoolId || !!inspectedPartnerId,
    startSchoolInspection,
    startPartnerInspection,
    stopInspection
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
```

---

### Step 3: Hardened `ProtectedRoute.tsx`

Update `src/components/ProtectedRoute.tsx` to prevent accidental role redirects:

```typescript
import { useAuth } from '@/hooks/useAuth'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  requiredRole?: 'super_admin' | 'admin' | 'operator' | 'partner'
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, role, loading, isInspecting } = useAuth()
  const location = useLocation()

  if (loading || (user && !role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Verifying AutoBell credentials...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 1. Super Admin Route Protection
  if (requiredRole === 'super_admin') {
    if (role !== 'super_admin') {
      return <Navigate to={role === 'partner' ? '/partner' : '/dashboard'} replace />
    }
    return <Outlet />
  }

  // 2. Partner Route Protection
  if (requiredRole === 'partner') {
    if (role === 'partner' || (role === 'super_admin' && isInspecting)) {
      return <Outlet />
    }
    return <Navigate to={role === 'super_admin' ? '/super-admin' : '/dashboard'} replace />
  }

  // 3. School Admin Dashboard Route Protection (/dashboard/*)
  // Super Admins are ONLY allowed here if they are actively inspecting a school!
  if (!requiredRole || requiredRole === 'admin') {
    if (role === 'super_admin') {
      if (!isInspecting) {
        // Super Admin clicked a link pointing to /dashboard without inspection -> redirect back to /super-admin
        return <Navigate to="/super-admin" replace />
      }
      return <Outlet />
    }
    if (role === 'partner') {
      return <Navigate to="/partner" replace />
    }
    return <Outlet />
  }

  return <Outlet />
}
```

---

### Step 4: Update `ImpersonationBanner.tsx` to Inspection Banner

Update `src/components/ImpersonationBanner.tsx` to handle `isInspecting`, `inspectedSchoolId`, and `stopInspection()` without mutating the base role:

```typescript
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export function ImpersonationBanner() {
  const { isInspecting, stopInspection, inspectedSchoolId, inspectedPartnerId, role } = useAuth()
  const navigate = useNavigate()

  const { data: school } = useQuery({
    queryKey: ['inspect_school_name', inspectedSchoolId],
    enabled: !!inspectedSchoolId && isInspecting,
    queryFn: async () => {
      const { data } = await supabase
        .from('schools')
        .select('name')
        .eq('id', inspectedSchoolId)
        .single()
      return data
    }
  })

  const { data: partner } = useQuery({
    queryKey: ['inspect_partner_name', inspectedPartnerId],
    enabled: !!inspectedPartnerId && isInspecting,
    queryFn: async () => {
      const { data } = await supabase
        .from('partners')
        .select('company_name')
        .eq('id', inspectedPartnerId)
        .single()
      return data
    }
  })

  // Only show banner if active inspection is in progress
  if (!isInspecting || role !== 'super_admin') return null

  const handleReturn = () => {
    const wasPartner = !!inspectedPartnerId
    stopInspection()
    if (wasPartner) {
      navigate('/super-admin/partners')
    } else {
      navigate('/super-admin/schools')
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex h-10 items-center justify-between bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow-md border-b border-amber-600/30">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-900 animate-pulse" />
        {inspectedPartnerId ? (
          <span>
            Super Admin View: Inspecting Partner Channel <span className="underline font-bold">{partner?.company_name || 'Loading...'}</span>
          </span>
        ) : (
          <span>
            Super Admin View: Inspecting School Campus <span className="underline font-bold">{school?.name || 'Loading...'}</span>
          </span>
        )}
      </div>
      <button
        onClick={handleReturn}
        className="inline-flex items-center gap-1.5 rounded bg-amber-950 px-3 py-1 text-xs font-bold text-amber-50 hover:bg-amber-900 transition-colors shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Exit Inspection & Return to Super Admin
      </button>
    </div>
  )
}
```

---

### Step 5: Update `SchoolManagement.tsx` Action Button

In `src/pages/super-admin/SchoolManagement.tsx`:
Change `impersonateSchool(school.id)` to `startSchoolInspection(school.id)`:

```typescript
// Replace:
// impersonateSchool(school.id)
// navigate('/dashboard')

// With:
const { startSchoolInspection } = useAuth()
// ...
<button
  onClick={() => {
    startSchoolInspection(school.id)
    navigate('/dashboard')
  }}
  className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all"
  title="Inspect School Dashboard"
>
  <LogIn className="h-5 w-5" />
</button>
```

And in `src/pages/super-admin/PartnerManagement.tsx`:
```typescript
// Replace impersonatePartner with startPartnerInspection:
const { startPartnerInspection } = useAuth()
// ...
<button
  onClick={() => {
    startPartnerInspection(partner.id)
    navigate('/partner')
  }}
  className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors"
  title="Inspect Partner Portal"
>
  <LogIn className="h-4.5 w-4.5" />
</button>
```

---

### Step 6: Decouple Shared Components (`ReportsManager` & `TicketManagement`)

1. **`ReportsManager.tsx`:**
   Add explicit `viewMode?: 'super_admin' | 'school'` prop.
   - When rendered under `/super-admin/reports`:
     Pass `viewMode="super_admin"`. Super admin queries all records across all schools without checking `schoolId`.
   - When rendered under `/dashboard/reports`:
     Pass `viewMode="school"`. Requires `schoolId` and restricts queries to `school_id`.

2. **`TicketManagement.tsx`:**
   Add explicit `viewMode?: 'super_admin' | 'school'` prop.
   - When rendered under `/super-admin/tickets`:
     Pass `viewMode="super_admin"`. Displays all tickets across the platform, ticket assignment, and internal notes.
   - When rendered under `/dashboard/tickets`:
     Pass `viewMode="school"`. Filters strictly to the school's tickets and disables internal triage fields.

---

## 4. Verification & Testing Checklist

After applying this prompt, verify each step:

1. **Super Admin Tab Switching Test:**
   - Log in as `muddasirh@gmail.com`.
   - Click sequentially through every tab in the Super Admin sidebar:
     `Overview` -> `School Management` -> `User Management` -> `Partner Management` -> `Notification Policy` -> `Pre-Announcements` -> `Inventory` -> `System Health` -> `Support Tickets` -> `Enterprise Reports` -> `Backups & Restore`.
   - **Requirement:** The URL must stay within `/super-admin/*`. Under no condition should the role flip to `'admin'` or redirect to `/dashboard/*`.

2. **Page Refresh & Direct URL Navigation Test:**
   - Go to `/super-admin/inventory` and press `F5` (hard refresh).
   - **Requirement:** Page loads directly into Inventory Management without redirecting to `/dashboard`.

3. **School Inspection Test:**
   - In `School Management`, click "Inspect School Dashboard" on any school.
   - **Requirement:** 
     - Navigates to `/dashboard`.
     - Amber banner displays at the top: *"Super Admin View: Inspecting School Campus..."*.
     - Click "Exit Inspection & Return to Super Admin".
     - **Requirement:** Returns immediately to `/super-admin/schools`. `role` is still `super_admin`.

4. **School Admin Route Isolation Test:**
   - Log in as a regular school admin.
   - Attempt to manually navigate to `/super-admin` in the browser URL bar.
   - **Requirement:** `ProtectedRoute` immediately blocks access and redirects back to `/dashboard`.

