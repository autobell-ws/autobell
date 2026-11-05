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

  // Only show banner if active inspection is in progress by Super Admin
  if (!isInspecting || role !== 'super_admin') return null

  const handleReturn = async () => {
    const wasPartner = !!inspectedPartnerId
    await stopInspection()
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
            Super Admin View: Inspecting Partner Channel <span className="underline font-bold">{partner?.company_name || 'Partner'}</span>
          </span>
        ) : (
          <span>
            Super Admin View: Inspecting School Campus <span className="underline font-bold">{school?.name || 'School'}</span>
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
