import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'
import { WhatsAppFloatingButton } from '@/components/public/WhatsAppFloatingButton'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-teal-500/20 selection:text-teal-700 dark:selection:text-teal-300">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  )
}

