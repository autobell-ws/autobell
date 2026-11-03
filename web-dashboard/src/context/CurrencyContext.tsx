import React, { createContext, useContext, useState } from 'react'

export type CurrencyCode = 'PKR' | 'USD' | 'AED' | 'SAR' | 'EUR' | 'GBP'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  label: string
  flag: string
  exchangeRateFromUsd: number // 1 USD in this currency
  format: (amount: number) => string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs. ',
    label: 'Pakistan (PKR)',
    flag: '🇵🇰',
    exchangeRateFromUsd: 280,
    format: (amount: number) => `Rs. ${Math.round(amount).toLocaleString()}`,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'United States & Global (USD)',
    flag: '🇺🇸',
    exchangeRateFromUsd: 1,
    format: (amount: number) => `$${Math.round(amount).toLocaleString()}`,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    label: 'UAE & Middle East (AED)',
    flag: '🇦🇪',
    exchangeRateFromUsd: 3.67,
    format: (amount: number) => `${Math.round(amount).toLocaleString()} AED`,
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR ',
    label: 'Saudi Arabia (SAR)',
    flag: '🇸🇦',
    exchangeRateFromUsd: 3.75,
    format: (amount: number) => `${Math.round(amount).toLocaleString()} SAR`,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Europe (EUR)',
    flag: '🇪🇺',
    exchangeRateFromUsd: 0.93,
    format: (amount: number) => `€${Math.round(amount).toLocaleString()}`,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'United Kingdom (GBP)',
    flag: '🇬🇧',
    exchangeRateFromUsd: 0.80,
    format: (amount: number) => `£${Math.round(amount).toLocaleString()}`,
  },
}

interface CurrencyContextType {
  currency: CurrencyCode
  currencyConfig: CurrencyConfig
  setCurrency: (code: CurrencyCode) => void
  convertPrice: (priceUsd: number, pricePkrOverride?: number) => { amount: number; formatted: string }
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autobell_currency') as CurrencyCode
      if (saved && CURRENCIES[saved]) return saved
      // Auto-detect based on timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      if (tz.includes('Karachi') || tz.includes('Asia/Karachi')) return 'PKR'
      if (tz.includes('Dubai') || tz.includes('Asia/Dubai')) return 'AED'
      if (tz.includes('Riyadh') || tz.includes('Asia/Riyadh')) return 'SAR'
      if (tz.includes('London') || tz.includes('Europe/London')) return 'GBP'
      if (tz.includes('Europe')) return 'EUR'
    }
    return 'PKR' // Default anchor market
  })

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code)
    if (typeof window !== 'undefined') {
      localStorage.setItem('autobell_currency', code)
    }
  }

  const currencyConfig = CURRENCIES[currency]

  const convertPrice = (priceUsd: number, pricePkrOverride?: number) => {
    let amount: number
    if (currency === 'PKR') {
      amount = pricePkrOverride ?? (priceUsd * CURRENCIES.PKR.exchangeRateFromUsd)
    } else if (currency === 'USD') {
      amount = priceUsd
    } else {
      amount = priceUsd * currencyConfig.exchangeRateFromUsd
    }
    return {
      amount,
      formatted: currencyConfig.format(amount),
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, currencyConfig, setCurrency, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

