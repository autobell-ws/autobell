import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { QueryProvider } from '@/providers/QueryProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ClaimDevice from '@/pages/ClaimDevice'
import DashboardLayout from '@/layout/DashboardLayout'
import Overview from '@/pages/Overview'
import BellManagement from '@/pages/BellManagement'
import ProfileEditor from '@/pages/ProfileEditor'
import PeriodBellsAndAnnouncements from '@/pages/PeriodBellsAndAnnouncements'
import AudioManager from '@/pages/AudioManager'
import SchoolSettings from '@/pages/SchoolSettings'
import SchoolBackups from '@/pages/SchoolBackups'
import Broadcast from '@/pages/Broadcast'
import ReportsManager from '@/pages/ReportsManager'
import TicketManagement from '@/pages/TicketManagement'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import SuperAdminLayout from '@/layout/SuperAdminLayout'
import SuperAdminOverview from '@/pages/super-admin/Overview'
import SchoolManagement from '@/pages/super-admin/SchoolManagement'
import UserManagement from '@/pages/super-admin/UserManagement'
import InventoryManagement from '@/pages/super-admin/InventoryManagement'
import SuperAdminBackups from '@/pages/super-admin/Backups'
import PartnerManagement from '@/pages/super-admin/PartnerManagement'
import NotificationManagement from '@/pages/super-admin/NotificationManagement'
import CommunicationIntegrations from '@/pages/super-admin/CommunicationIntegrations'
import PreAnnouncementManagement from '@/pages/super-admin/PreAnnouncementManagement'
import HealthDashboard from '@/pages/super-admin/HealthDashboard'

import PartnerLayout from '@/layout/PartnerLayout'
import PartnerOverview from '@/pages/partner/Overview'
import PartnerLeads from '@/pages/partner/Leads'
import PartnerDeals from '@/pages/partner/Deals'
import PartnerPayments from '@/pages/partner/Payments'
import PartnerCommissions from '@/pages/partner/Commissions'
import PartnerSettings from '@/pages/partner/Settings'

// Public Marketing & E-Commerce Pages
import PublicLayout from '@/layout/PublicLayout'
import Home from '@/pages/public/Home'
import Products from '@/pages/public/Products'
import Pricing from '@/pages/public/Pricing'
import Solutions from '@/pages/public/Solutions'
import Buy from '@/pages/public/Buy'
import CalculatorPage from '@/pages/public/CalculatorPage'
import DemoPage from '@/pages/public/DemoPage'
import PartnersPage from '@/pages/public/PartnersPage'
import AboutContactPage from '@/pages/public/AboutContactPage'
import LegalPage from '@/pages/public/LegalPage'

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <CurrencyProvider>
            <ThemeProvider>
              <BrowserRouter>
                <ImpersonationBanner />
                <Routes>
                  {/* Public Marketing & E-Commerce Routes (Official Main Page) */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/solutions" element={<Solutions />} />
                    <Route path="/solutions/:type" element={<Solutions />} />
                    <Route path="/buy" element={<Buy />} />
                    <Route path="/calculator" element={<Navigate to="/" replace />} />
                    <Route path="/demo" element={<DemoPage />} />
                    <Route path="/partners" element={<PartnersPage />} />
                    <Route path="/about" element={<AboutContactPage />} />
                    <Route path="/contact" element={<AboutContactPage />} />
                    <Route path="/legal" element={<LegalPage />} />
                  </Route>

                  {/* Unified Authentication & Onboarding Gateways */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/setup" element={<ClaimDevice />} />
                  <Route path="/claim" element={<ClaimDevice />} />

                  {/* Channel Partner Portal Routes */}
                  <Route element={<ProtectedRoute requiredRole="partner" />}>
                    <Route path="/partner" element={<PartnerLayout />}>
                      <Route index element={<PartnerOverview />} />
                      <Route path="leads" element={<PartnerLeads />} />
                      <Route path="deals" element={<PartnerDeals />} />
                      <Route path="payments" element={<PartnerPayments />} />
                      <Route path="commissions" element={<PartnerCommissions />} />
                      <Route path="settings" element={<PartnerSettings />} />
                    </Route>
                  </Route>

                  {/* Super Admin Oversight Routes */}
                  <Route element={<ProtectedRoute requiredRole="super_admin" />}>
                    <Route path="/super-admin" element={<SuperAdminLayout />}>
                      <Route index element={<SuperAdminOverview />} />
                      <Route path="schools" element={<SchoolManagement />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="partners" element={<PartnerManagement />} />
                      <Route path="notifications" element={<NotificationManagement />} />
                      <Route path="integrations" element={<CommunicationIntegrations />} />
                      <Route path="pre-announcements" element={<PreAnnouncementManagement />} />
                      <Route path="inventory" element={<InventoryManagement />} />
                      <Route path="backups" element={<SuperAdminBackups />} />
                      <Route path="health" element={<HealthDashboard />} />
                      <Route path="tickets" element={<TicketManagement viewMode="super_admin" />} />
                      <Route path="reports" element={<ReportsManager viewMode="super_admin" />} />
                    </Route>
                  </Route>

                  {/* School Admin / Operator Dashboard Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                      <Route index element={<Overview />} />
                      <Route path="bells" element={<BellManagement />} />
                      <Route path="profiles" element={<ProfileEditor />} />
                      <Route path="bells-and-announcements" element={<PeriodBellsAndAnnouncements />} />
                      <Route path="audio" element={<AudioManager />} />
                      <Route path="broadcast" element={<Broadcast />} />
                      <Route path="reports" element={<ReportsManager viewMode="school" />} />
                      <Route path="tickets" element={<TicketManagement viewMode="school" />} />
                      <Route path="settings" element={<SchoolSettings />} />
                      <Route path="backups" element={<SchoolBackups />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}

export default App
