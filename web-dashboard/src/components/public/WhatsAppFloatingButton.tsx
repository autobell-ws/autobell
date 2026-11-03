import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function WhatsAppFloatingButton() {
  const whatsappNumber = '923000780280'
  const defaultMessage = encodeURIComponent(
    'Assalam-o-Alaikum / Hello AutoBell Team! I am interested in implementing AutoBell automated bell & PA system in our educational institution. Please share details and pricing.'
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="hidden md:flex mr-3 bg-white text-slate-800 text-xs font-semibold py-2 px-3.5 rounded-full shadow-xl border border-slate-200 items-center gap-2 group-hover:scale-105 transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>Chat with Campus Solution Specialist</span>
      </motion.div>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-emerald-500/50 transition-all border-2 border-white focus:outline-none focus:ring-4 focus:ring-emerald-300"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
      </motion.a>
    </div>
  )
}

