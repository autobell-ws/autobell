import { useState, useRef, useEffect } from 'react'
import { useCurrency, CURRENCIES, type CurrencyCode } from '@/context/CurrencyContext'
import { Globe, ChevronDown } from 'lucide-react'

export function RegionalSelector() {
  const { currency, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 focus:outline-none"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>{CURRENCIES[currency].flag}</span>
        <span className="font-semibold">{currency}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ring-1 ring-black/5 z-50 py-1.5 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
            Select Market & Currency
          </div>
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
            const item = CURRENCIES[code]
            const isSelected = currency === code
            return (
              <button
                key={code}
                onClick={() => {
                  setCurrency(code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{item.code}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

