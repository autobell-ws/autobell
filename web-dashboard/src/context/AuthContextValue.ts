import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthRole = 'super_admin' | 'admin' | 'operator' | 'partner' | null

export type AuthContextType = {
  session: Session | null
  user: User | null
  schoolId: string | null
  partnerId: string | null
  role: AuthRole
  effectiveRole: AuthRole
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

  // Backward compatibility aliases
  impersonatedSchoolId: string | null
  impersonatedPartnerId: string | null
  isImpersonating: boolean
  impersonateSchool: (targetSchoolId: string) => void
  impersonatePartner: (targetPartnerId: string, targetUserId?: string) => void
  stopImpersonation: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
