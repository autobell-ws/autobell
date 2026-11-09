import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  MessageSquare,
  Send,
  Save,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Server,
  Key,
  Globe,
  Copy,
  Check,
  Search,
  Filter,
  Info,
  Clock,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getEmailConfig,
  saveEmailConfig,
  getWhatsAppConfig,
  saveWhatsAppConfig,
  getNotificationTemplates,
  saveNotificationTemplate,
  getCommunicationLogs,
  sendEmailNotification,
  sendWhatsAppNotification,
  type EmailIntegrationConfig,
  type WhatsAppIntegrationConfig,
  type NotificationTemplate,
  type CommunicationLog,
  type EmailProvider,
  type WhatsAppProvider,
  renderTemplateText
} from '@/lib/communication'

export default function CommunicationIntegrations() {
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'templates' | 'logs'>('email')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Email Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailIntegrationConfig>({
    id: 1,
    provider: 'smtp',
    is_enabled: false,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_secure: true,
    sender_name: 'AutoBell Cloud System',
    sender_email: 'notifications@autobell-portal.com',
    api_key: ''
  })
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [showEmailApiKey, setShowEmailApiKey] = useState(false)

  // WhatsApp Configuration State
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppIntegrationConfig>({
    id: 1,
    provider: 'meta',
    is_enabled: false,
    api_endpoint: 'https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages',
    api_key: '',
    phone_number_id: '',
    sender_phone: '',
    account_sid: ''
  })
  const [showWaApiKey, setShowWaApiKey] = useState(false)

  // Templates State
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [templateFilterCategory, setTemplateFilterCategory] = useState<string>('all')
  const [templateFilterChannel, setTemplateFilterChannel] = useState<string>('all')

  // Testing Dispatches State
  const [testEmailRecipient, setTestEmailRecipient] = useState('')
  const [testEmailTemplate, setTestEmailTemplate] = useState('account_registration')
  const [testingEmail, setTestingEmail] = useState(false)

  const [testWaRecipient, setTestWaRecipient] = useState('')
  const [testWaTemplate, setTestWaTemplate] = useState('account_registration')
  const [testingWa, setTestingWa] = useState(false)

  // Logs State
  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [logChannelFilter, setLogChannelFilter] = useState<'all' | 'email' | 'whatsapp'>('all')
  const [logSearchQuery, setLogSearchQuery] = useState('')
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<CommunicationLog | null>(null)

  // Preview Mode in Template Modal
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('preview')
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [emailData, waData, tplData, logData] = await Promise.all([
        getEmailConfig(),
        getWhatsAppConfig(),
        getNotificationTemplates(),
        getCommunicationLogs(100)
      ])

      if (emailData) setEmailConfig(emailData)
      if (waData) setWhatsappConfig(waData)
      if (tplData) setTemplates(tplData)
      if (logData) setLogs(logData)
    } catch (err: any) {
      console.error('Failed to load communication settings:', err)
      toast.error('Failed to load settings: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Save Email Config
  const handleSaveEmailConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const res = await saveEmailConfig(emailConfig)
      if (!res.success) throw new Error(res.error)
      toast.success('Email integration settings saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save email settings')
    } finally {
      setSaving(false)
    }
  }

  // Save WhatsApp Config
  const handleSaveWhatsAppConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const res = await saveWhatsAppConfig(whatsappConfig)
      if (!res.success) throw new Error(res.error)
      toast.success('WhatsApp API integration settings saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save WhatsApp settings')
    } finally {
      setSaving(false)
    }
  }

  // Test Email Send
  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      toast.error('Please enter a recipient email address for testing.')
      return
    }

    setTestingEmail(true)
    try {
      const sampleVariables: Record<string, string> = {
        user_name: 'Principal Dr. Farhan Ahmed',
        school_name: 'Beaconhouse Al-Falah Campus',
        campus_name: 'North Wing',
        email: testEmailRecipient.trim(),
        phone: '+92 300 1234567',
        login_url: window.location.origin + '/login',
        dashboard_url: window.location.origin + '/dashboard',
        support_phone: '+92 321 8887766',
        support_email: 'support@autobell-portal.com',
        invoice_id: 'INV-2026-089',
        amount: '45,000',
        currency: 'PKR',
        payment_method: 'Online Bank Direct (1Link)',
        payment_date: new Date().toLocaleDateString('en-GB'),
        plan_name: 'Annual Enterprise Campus License (4-Zone Relays)',
        receipt_url: window.location.origin + '/orders',
        due_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB'),
        days_remaining: '7',
        payment_url: window.location.origin + '/orders',
        bank_details: 'Bank Alfalah | Account: 0145-1008928371 | Title: AutoBell Technologies',
        device_name: 'Central Clock Tower S3 (Zone 1)',
        mac_address: '48:27:E2:0D:3C:A4',
        location_area: 'Auditorium & Admin Quad',
        last_seen: new Date().toLocaleTimeString(),
        troubleshoot_url: window.location.origin + '/devices',
        operator_name: 'Admin Station #1 (Super Admin)',
        timestamp: new Date().toLocaleTimeString(),
        affected_zones: 'All 4 Campus Zones (Left + Right Relays)',
        reason: 'Authorized manual safety drill',
        expiry_date: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB'),
        renewal_url: window.location.origin + '/orders',
        title: 'Scheduled Cloud Infrastructure Maintenance',
        broadcast_message: 'Firmware OTA updates and neural voice cache re-indexing scheduled for Saturday midnight.',
        maintenance_window: 'Saturday, 11:00 PM to 1:00 AM PKT',
        affected_services: 'Cloud TTS Synthesis (Local bells ring uninterrupted)',
        support_portal_url: window.location.origin + '/support'
      }

      const res = await sendEmailNotification({
        templateKey: testEmailTemplate,
        recipient: testEmailRecipient.trim(),
        variables: sampleVariables,
        testMode: true,
        customConfig: emailConfig
      })

      if (res.success && res.status === 'sent') {
        toast.success(`Live Test Succeeded: ${res.message}`)
        const updatedLogs = await getCommunicationLogs(100)
        setLogs(updatedLogs)
      } else if (res.success && res.status === 'simulated') {
        toast.info(res.message)
        const updatedLogs = await getCommunicationLogs(100)
        setLogs(updatedLogs)
      } else {
        toast.error(res.message || 'Email delivery failed')
      }
    } catch (err: any) {
      toast.error('Test dispatch failed: ' + err.message)
    } finally {
      setTestingEmail(false)
    }
  }

  // Test WhatsApp Send
  const handleSendTestWhatsApp = async () => {
    if (!testWaRecipient.trim()) {
      toast.error('Please enter a recipient phone number with country code (e.g. +923001234567).')
      return
    }

    setTestingWa(true)
    try {
      const sampleVariables: Record<string, string> = {
        user_name: 'Principal Dr. Farhan Ahmed',
        school_name: 'Beaconhouse Al-Falah Campus',
        campus_name: 'North Wing',
        email: 'farhan.ahmed@beaconhouse.edu.pk',
        login_url: window.location.origin + '/login',
        dashboard_url: window.location.origin + '/dashboard',
        support_phone: '+92 321 8887766',
        support_email: 'support@autobell-portal.com',
        invoice_id: 'INV-2026-089',
        amount: '45,000',
        currency: 'PKR',
        payment_method: 'Online Bank Direct (1Link)',
        payment_date: new Date().toLocaleDateString('en-GB'),
        plan_name: 'Annual Enterprise Campus License',
        receipt_url: window.location.origin + '/orders',
        due_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB'),
        days_remaining: '7',
        payment_url: window.location.origin + '/orders'
      }

      const res = await sendWhatsAppNotification({
        templateKey: testWaTemplate,
        recipientPhone: testWaRecipient.trim(),
        variables: sampleVariables,
        testMode: true,
        customConfig: whatsappConfig
      })

      if (res.success && res.status === 'sent') {
        toast.success(`Live Test Succeeded: ${res.message}`)
        const updatedLogs = await getCommunicationLogs(100)
        setLogs(updatedLogs)
      } else if (res.success && res.status === 'simulated') {
        toast.info(res.message)
        const updatedLogs = await getCommunicationLogs(100)
        setLogs(updatedLogs)
      } else {
        toast.error(res.message || 'WhatsApp message dispatch failed')
      }
    } catch (err: any) {
      toast.error('Test dispatch failed: ' + err.message)
    } finally {
      setTestingWa(false)
    }
  }

  // Save Template Edit
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return
    setSaving(true)
    try {
      const res = await saveNotificationTemplate(selectedTemplate)
      if (!res.success) throw new Error(res.error)
      toast.success(`Template "${selectedTemplate.title}" updated successfully!`)
      setIsEditModalOpen(false)
      const tpls = await getNotificationTemplates()
      setTemplates(tpls)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  const copyVariableTag = (variable: string) => {
    navigator.clipboard.writeText(variable)
    setCopiedVar(variable)
    toast.success(`Copied ${variable} to clipboard!`)
    setTimeout(() => setCopiedVar(null), 2000)
  }

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    if (templateFilterCategory !== 'all' && tpl.category !== templateFilterCategory) return false
    if (templateFilterChannel === 'dual' && !(tpl.channels.includes('email') && tpl.channels.includes('whatsapp'))) return false
    if (templateFilterChannel === 'email_only' && !(!tpl.channels.includes('whatsapp') && tpl.channels.includes('email'))) return false
    return true
  })

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (logChannelFilter !== 'all' && log.channel !== logChannelFilter) return false
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase()
      const matchesRecipient = log.recipient?.toLowerCase().includes(q)
      const matchesSubject = log.subject?.toLowerCase().includes(q)
      const matchesTemplate = log.template_key?.toLowerCase().includes(q)
      return matchesRecipient || matchesSubject || matchesTemplate
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500/20 via-emerald-500/20 to-primary/20 text-primary border border-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Email & WhatsApp Integration Center
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Super Admin
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Centralized gateway configuration for WhatsApp Cloud API & Email SMTP, transactional templates, and real-time dispatch logs.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Status Cards */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/60 text-xs">
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-muted-foreground">Email:</span>
            <span className={`font-semibold ${emailConfig.is_enabled ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {emailConfig.is_enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/60 text-xs">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-muted-foreground">WhatsApp:</span>
            <span className={`font-semibold ${whatsappConfig.is_enabled ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {whatsappConfig.is_enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <button
            onClick={loadAllData}
            title="Refresh All Data"
            className="p-2 rounded-lg border border-border bg-card/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'email'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email API & SMTP Settings
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'whatsapp'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          WhatsApp API Gateway
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'templates'
              ? 'border-purple-500 text-purple-500 bg-purple-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          Notification Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-amber-500 text-amber-500 bg-amber-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Dispatch Audit Logs ({logs.length})
        </button>
      </div>

      {/* TAB 1: EMAIL INTEGRATION FORM */}
      {activeTab === 'email' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Email Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveEmailConfig} className="p-6 rounded-xl border border-border bg-card/60 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Email Service & SMTP Settings</h2>
                    <p className="text-xs text-muted-foreground">Configure outbound transactional and system email dispatch</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      emailConfig.is_enabled
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        emailConfig.is_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {emailConfig.is_enabled ? 'Live Production Active' : 'Simulation Mode'}
                  </span>
                  <label htmlFor="email-enabled-toggle" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    {emailConfig.is_enabled ? 'Enabled' : 'Disabled'}
                  </label>
                  <input
                    id="email-enabled-toggle"
                    type="checkbox"
                    checked={emailConfig.is_enabled}
                    onChange={(e) => setEmailConfig({ ...emailConfig, is_enabled: e.target.checked })}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Dispatch Provider</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'smtp', label: 'Custom SMTP', sub: 'Gmail / cPanel / Postfix' },
                    { id: 'resend', label: 'Resend API', sub: 'High deliverability REST' },
                    { id: 'sendgrid', label: 'SendGrid API', sub: 'Twilio SendGrid v3' },
                    { id: 'postmark', label: 'Postmark / Custom', sub: 'Transactional API' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEmailConfig({ ...emailConfig, provider: p.id as EmailProvider })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        emailConfig.provider === p.id
                          ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                          : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <div className="text-xs font-semibold text-foreground">{p.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Sender Display Name</label>
                  <input
                    type="text"
                    value={emailConfig.sender_name}
                    onChange={(e) => setEmailConfig({ ...emailConfig, sender_name: e.target.value })}
                    placeholder="e.g. AutoBell Cloud Operations"
                    className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">From Email Address</label>
                  <input
                    type="email"
                    value={emailConfig.sender_email}
                    onChange={(e) => setEmailConfig({ ...emailConfig, sender_email: e.target.value })}
                    placeholder="notifications@autobell-portal.com"
                    className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Conditional: SMTP Credentials */}
              {emailConfig.provider === 'smtp' ? (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">SMTP Server Credentials</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">SMTP Host / Server</label>
                      <input
                        type="text"
                        value={emailConfig.smtp_host}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                        placeholder="smtp.gmail.com or mail.yourdomain.com"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Port</label>
                      <input
                        type="number"
                        value={emailConfig.smtp_port}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: parseInt(e.target.value) || 587 })}
                        placeholder="587"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">SMTP User / Username</label>
                      <input
                        type="text"
                        value={emailConfig.smtp_user}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value })}
                        placeholder="notifications@yourdomain.com"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">SMTP Password / App Password</label>
                      <div className="relative">
                        <input
                          type={showEmailPassword ? 'text' : 'password'}
                          value={emailConfig.smtp_password || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
                          placeholder="••••••••••••••••"
                          className="w-full rounded-lg bg-background border border-border p-2.5 pr-9 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmailPassword(!showEmailPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showEmailPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="smtp-ssl-secure"
                      type="checkbox"
                      checked={emailConfig.smtp_secure}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_secure: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <label htmlFor="smtp-ssl-secure" className="text-xs text-muted-foreground cursor-pointer">
                      Use Secure Connection (STARTTLS / SSL on Port 465 or 587)
                    </label>
                  </div>
                </div>
              ) : (
                /* API Provider Key Input */
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {emailConfig.provider.toUpperCase()} API Key
                    </h3>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Secret API Key / Bearer Token
                    </label>
                    <div className="relative">
                      <input
                        type={showEmailApiKey ? 'text' : 'password'}
                        value={emailConfig.api_key || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, api_key: e.target.value })}
                        placeholder="re_123456789... or SG.123456789..."
                        className="w-full rounded-lg bg-background border border-border p-2.5 pr-9 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailApiKey(!showEmailApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showEmailApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Email Gateway Settings
                </button>
              </div>
            </form>
          </div>

          {/* Test Email Dispatcher & Templates Quick View (1 col) */}
          <div className="space-y-6">
            {/* Test Email Card */}
            <div className="p-5 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-sky-500/20 pb-2.5">
                <Send className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Test Email Dispatch</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Recipient Test Email</label>
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="admin@school.edu or your.email@gmail.com"
                    className="w-full rounded-lg bg-background border border-border p-2 text-xs text-foreground focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Test Template</label>
                  <select
                    value={testEmailTemplate}
                    onChange={(e) => setTestEmailTemplate(e.target.value)}
                    className="w-full rounded-lg bg-background border border-border p-2 text-xs text-foreground focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <optgroup label="Dual Templates (Email & WhatsApp)">
                      <option value="account_registration">Account Registration Welcome</option>
                      <option value="registration_confirmation">Registration Confirmation & Activation</option>
                      <option value="payment_confirmation">Payment Confirmation & Receipt</option>
                      <option value="payment_reminder">Payment Renewal Reminder</option>
                    </optgroup>
                    <optgroup label="Email-Only Important Alerts">
                      <option value="device_offline_alert">Device Hardware Offline Alert</option>
                      <option value="emergency_stop_alert">Emergency Audio Stop Alert</option>
                      <option value="subscription_expiry_warning">Subscription Expiry Warning</option>
                      <option value="system_broadcast">Official System Notice</option>
                    </optgroup>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingEmail}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-sky-600 text-white font-medium text-xs hover:bg-sky-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  {testingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Dispatch Test Email Now
                </button>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Dispatches a sample rendered email using your chosen template. If live credentials are not yet entered, it safely records a Simulated Log entry in audit history.
                </p>
              </div>
            </div>

            {/* Email Templates Summary Card */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-foreground">Available Email Templates</span>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                {templates.filter(t => t.channels.includes('email')).slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/30">
                    <span className="font-medium text-foreground truncate pr-2">{t.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                      t.channels.includes('whatsapp') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-400'
                    }`}>
                      {t.channels.includes('whatsapp') ? 'Dual' : 'Email Only'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHATSAPP API INTEGRATION FORM */}
      {activeTab === 'whatsapp' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main WhatsApp Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveWhatsAppConfig} className="p-6 rounded-xl border border-border bg-card/60 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">WhatsApp Business API Settings</h2>
                    <p className="text-xs text-muted-foreground">Configure Meta Cloud API, Twilio, or custom WhatsApp gateway</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      whatsappConfig.is_enabled
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        whatsappConfig.is_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {whatsappConfig.is_enabled ? 'Live Production Active' : 'Simulation Mode'}
                  </span>
                  <label htmlFor="wa-enabled-toggle" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    {whatsappConfig.is_enabled ? 'Enabled' : 'Disabled'}
                  </label>
                  <input
                    id="wa-enabled-toggle"
                    type="checkbox"
                    checked={whatsappConfig.is_enabled}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, is_enabled: e.target.checked })}
                    className="h-5 w-5 rounded border-border text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Meta Policy Reminder Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Strict Meta Policy Enforcement:</strong> Per system specification, WhatsApp messaging is strictly limited to <strong>Account Registration</strong>, <strong>Registration Confirmation</strong>, <strong>Payment Confirmation</strong>, and <strong>Payment Reminders</strong>. All other notifications (hardware offline, emergency audio stops, maintenance) are routed strictly to <strong>Email Only</strong>.
                </div>
              </div>

              {/* WhatsApp Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">WhatsApp Gateway Provider</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'meta', label: 'Meta WhatsApp Cloud API', sub: 'Official Meta Graph API v19+' },
                    { id: 'twilio', label: 'Twilio WhatsApp API', sub: 'Programmable Messaging' },
                    { id: 'ultramsg', label: 'UltraMsg Gateway', sub: 'Instance ID & Web API' },
                    { id: 'green_api', label: 'Green API', sub: 'Fast WhatsApp Instance' },
                    { id: 'wasapi', label: 'Wasapi Gateway', sub: 'Multi-device bridge' },
                    { id: 'generic_webhook', label: 'Custom HTTP Webhook', sub: 'Self-hosted webhook' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setWhatsappConfig({ ...whatsappConfig, provider: p.id as WhatsAppProvider })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        whatsappConfig.provider === p.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-foreground font-semibold shadow-xs'
                          : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <div className="text-xs font-semibold text-foreground">{p.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields based on provider */}
              {whatsappConfig.provider === 'meta' && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Meta Cloud API Credentials</h3>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">API Endpoint URL</label>
                    <input
                      type="text"
                      value={whatsappConfig.api_endpoint}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_endpoint: e.target.value })}
                      placeholder="https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages"
                      className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Meta Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={whatsappConfig.phone_number_id}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })}
                        placeholder="e.g. 10482910492810"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                        Sender WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={whatsappConfig.sender_phone}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, sender_phone: e.target.value })}
                        placeholder="+923001234567 or +14155238886"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Permanent Access Token / System User Token
                    </label>
                    <div className="relative">
                      <input
                        type={showWaApiKey ? 'text' : 'password'}
                        value={whatsappConfig.api_key || ''}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_key: e.target.value })}
                        placeholder="EAABw..."
                        className="w-full rounded-lg bg-background border border-border p-2.5 pr-9 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWaApiKey(!showWaApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showWaApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {whatsappConfig.provider === 'twilio' && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Twilio WhatsApp Configuration</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Twilio Account SID</label>
                      <input
                        type="text"
                        value={whatsappConfig.account_sid || ''}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, account_sid: e.target.value })}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Sender Phone Number</label>
                      <input
                        type="text"
                        value={whatsappConfig.sender_phone}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, sender_phone: e.target.value })}
                        placeholder="whatsapp:+14155238886"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Twilio Auth Token</label>
                    <div className="relative">
                      <input
                        type={showWaApiKey ? 'text' : 'password'}
                        value={whatsappConfig.api_key || ''}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_key: e.target.value })}
                        placeholder="••••••••••••••••••••••••••••••"
                        className="w-full rounded-lg bg-background border border-border p-2.5 pr-9 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWaApiKey(!showWaApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showWaApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {whatsappConfig.provider !== 'meta' && whatsappConfig.provider !== 'twilio' && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Gateway Webhook Endpoint</h3>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">API Request URL</label>
                    <input
                      type="text"
                      value={whatsappConfig.api_endpoint}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_endpoint: e.target.value })}
                      placeholder="https://api.ultramsg.com/instance123/messages/chat"
                      className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Instance ID / Phone ID</label>
                      <input
                        type="text"
                        value={whatsappConfig.phone_number_id}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })}
                        placeholder="instance12345"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">API Token / Secret Key</label>
                      <input
                        type="password"
                        value={whatsappConfig.api_key || ''}
                        onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_key: e.target.value })}
                        placeholder="••••••••••••••••"
                        className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-xs shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save WhatsApp Gateway Settings
                </button>
              </div>
            </form>
          </div>

          {/* Test WhatsApp Dispatcher & Approved Templates (1 col) */}
          <div className="space-y-6">
            {/* Test WhatsApp Card */}
            <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2.5">
                <Send className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Test WhatsApp Dispatch</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={testWaRecipient}
                    onChange={(e) => setTestWaRecipient(e.target.value)}
                    placeholder="+923001234567 (with country code)"
                    className="w-full rounded-lg bg-background border border-border p-2 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Template</label>
                  <select
                    value={testWaTemplate}
                    onChange={(e) => setTestWaTemplate(e.target.value)}
                    className="w-full rounded-lg bg-background border border-border p-2 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="account_registration">1. Account Registration Welcome</option>
                    <option value="registration_confirmation">2. Registration Confirmation & Activation</option>
                    <option value="payment_confirmation">3. Payment Confirmation & Receipt</option>
                    <option value="payment_reminder">4. Payment Renewal Reminder</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestWhatsApp}
                  disabled={testingWa}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  {testingWa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Dispatch Test WhatsApp Message
                </button>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Sends formatted WhatsApp text to the target number. If no live Meta API key is set, the system generates a Simulated Log entry in audit logs.
                </p>
              </div>
            </div>

            {/* Approved WhatsApp Templates Preview Card */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-foreground">Approved WhatsApp Templates</span>
                <span className="text-[10px] text-emerald-500 font-mono font-semibold">4 Transactional</span>
              </div>

              <div className="space-y-2 text-xs">
                {templates.filter(t => t.channels.includes('whatsapp')).map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-muted/40 border border-border/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-xs">{t.title}</span>
                      <span className="text-[10px] text-emerald-500 font-mono">WhatsApp + Email</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 font-mono">
                      {t.whatsapp_body_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATION TEMPLATES MASTER */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card/60">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Channel:
              </span>
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateFilterChannel('all')}
                  className={`px-3 py-1.5 ${templateFilterChannel === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  All ({templates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilterChannel('dual')}
                  className={`px-3 py-1.5 ${templateFilterChannel === 'dual' ? 'bg-emerald-600 text-white font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  Dual (Email + WhatsApp)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilterChannel('email_only')}
                  className={`px-3 py-1.5 ${templateFilterChannel === 'email_only' ? 'bg-sky-600 text-white font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  Email Only Alerts
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Category:</span>
              <select
                value={templateFilterCategory}
                onChange={(e) => setTemplateFilterCategory(e.target.value)}
                className="text-xs rounded-lg border border-border bg-background p-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="onboarding">Onboarding & Registration</option>
                <option value="billing">Billing & Payments</option>
                <option value="system_alert">System Alerts & Security</option>
              </select>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates.map((tpl) => {
              const isDual = tpl.channels.includes('email') && tpl.channels.includes('whatsapp')
              return (
                <div
                  key={tpl.id}
                  className="p-5 rounded-xl border border-border bg-card/60 hover:border-primary/40 transition-all space-y-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{tpl.title}</h3>
                        {isDual ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <MessageSquare className="w-3 h-3" /> Email + WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <Mail className="w-3 h-3" /> Email Only Alert
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        Key: <span className="text-primary">{tpl.template_key}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(tpl)
                        setIsEditModalOpen(true)
                      }}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-medium text-foreground transition-colors shadow-xs"
                    >
                      Customize Template
                    </button>
                  </div>

                  {/* Email Subject preview */}
                  {tpl.email_subject && (
                    <div className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border/30">
                      <span className="font-semibold text-muted-foreground mr-1.5">Email Subject:</span>
                      <span className="text-foreground">{tpl.email_subject}</span>
                    </div>
                  )}

                  {/* WhatsApp Body Preview if dual */}
                  {tpl.whatsapp_body_text && (
                    <div className="text-xs bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/15 font-mono text-[11px] text-foreground whitespace-pre-wrap line-clamp-3">
                      {tpl.whatsapp_body_text}
                    </div>
                  )}

                  {/* Available variables */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Variables:</span>
                    {tpl.available_variables?.map((v) => (
                      <span
                        key={v}
                        onClick={() => copyVariableTag(v)}
                        title="Click to copy"
                        className="cursor-pointer text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors font-mono"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DISPATCH AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card/60">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search recipient, template or subject..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Channel:</span>
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setLogChannelFilter('all')}
                  className={`px-3 py-1.5 ${logChannelFilter === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  All ({logs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLogChannelFilter('email')}
                  className={`px-3 py-1.5 ${logChannelFilter === 'email' ? 'bg-sky-600 text-white font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  Email ({logs.filter(l => l.channel === 'email').length})
                </button>
                <button
                  type="button"
                  onClick={() => setLogChannelFilter('whatsapp')}
                  className={`px-3 py-1.5 ${logChannelFilter === 'whatsapp' ? 'bg-emerald-600 text-white font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  WhatsApp ({logs.filter(l => l.channel === 'whatsapp').length})
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const updatedLogs = await getCommunicationLogs(100)
                  setLogs(updatedLogs)
                  toast.success('Logs refreshed')
                }}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No communication dispatches recorded yet matching your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Template</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {log.channel === 'whatsapp' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-sans font-medium text-[11px]">
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sky-400 font-sans font-medium text-[11px]">
                              <Mail className="w-3.5 h-3.5" /> Email
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-foreground font-sans font-medium">
                          {log.template_key || 'Custom Message'}
                        </td>
                        <td className="py-3 px-4 text-foreground font-mono">
                          {log.recipient}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-sans font-bold ${
                            log.status === 'sent'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : log.status === 'simulated'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLogForDetails(log)}
                            className="text-xs text-primary hover:underline font-sans font-medium"
                          >
                            View Payload
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEMPLATE EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedTemplate.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    template_key: <span className="text-primary">{selectedTemplate.template_key}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('editor')}
                      className={`px-3 py-1.5 ${previewTab === 'editor' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                    >
                      Template Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('preview')}
                      className={`px-3 py-1.5 ${previewTab === 'preview' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                    >
                      Live Preview
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Available Variables Toolstrip */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Available Replacement Variables (Click to copy):
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedTemplate.available_variables?.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => copyVariableTag(v)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-mono text-foreground hover:border-primary transition-colors"
                      >
                        {copiedVar === v ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {previewTab === 'editor' ? (
                  <div className="space-y-4">
                    {/* Email Subject */}
                    {selectedTemplate.channels.includes('email') && (
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">Email Subject Line</label>
                        <input
                          type="text"
                          value={selectedTemplate.email_subject || ''}
                          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, email_subject: e.target.value })}
                          className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Email HTML Body */}
                    {selectedTemplate.channels.includes('email') && (
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">Email Body (HTML)</label>
                        <textarea
                          rows={10}
                          value={selectedTemplate.email_body_html || ''}
                          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, email_body_html: e.target.value })}
                          className="w-full rounded-lg bg-background border border-border p-3 text-xs text-foreground font-mono focus:ring-2 focus:ring-primary focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    )}

                    {/* WhatsApp Body Text (If Dual) */}
                    {selectedTemplate.channels.includes('whatsapp') && (
                      <div>
                        <label className="text-xs font-semibold text-emerald-500 mb-1 block flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message Body (Markdown & Emojis)
                        </label>
                        <textarea
                          rows={6}
                          value={selectedTemplate.whatsapp_body_text || ''}
                          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, whatsapp_body_text: e.target.value })}
                          className="w-full rounded-lg bg-background border border-emerald-500/40 p-3 text-xs text-foreground font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          WhatsApp supports *bold*, _italic_, ~strikethrough~, and emojis. Keep under 1024 characters.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* LIVE PREVIEW TAB */
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Email Preview */}
                    {selectedTemplate.channels.includes('email') && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          Email Rendered Preview
                        </div>
                        <div className="border border-border rounded-xl p-4 bg-white text-slate-800 shadow-inner max-h-[500px] overflow-y-auto">
                          <div className="border-b pb-2 mb-3 text-xs">
                            <strong>Subject:</strong>{' '}
                            {renderTemplateText(selectedTemplate.email_subject || '', {
                              school_name: 'Beaconhouse Al-Falah Campus',
                              user_name: 'Dr. Farhan Ahmed',
                              invoice_id: 'INV-2026-089',
                              due_date: '15/11/2026'
                            })}
                          </div>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: renderTemplateText(selectedTemplate.email_body_html || '', {
                                user_name: 'Dr. Farhan Ahmed',
                                school_name: 'Beaconhouse Al-Falah Campus',
                                campus_name: 'Main Campus',
                                email: 'farhan.ahmed@beaconhouse.edu.pk',
                                phone: '+92 300 1234567',
                                login_url: '#',
                                dashboard_url: '#',
                                support_phone: '+92 321 8887766',
                                support_email: 'support@autobell-portal.com',
                                invoice_id: 'INV-2026-089',
                                amount: '45,000',
                                currency: 'PKR',
                                payment_method: '1Link Bank Transfer',
                                payment_date: '08/11/2026',
                                plan_name: 'Annual Campus Enterprise License',
                                receipt_url: '#',
                                due_date: '15/11/2026',
                                days_remaining: '7',
                                payment_url: '#',
                                bank_details: 'Bank Alfalah | Account: 0145-1008928371'
                              })
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Bubble Preview */}
                    {selectedTemplate.channels.includes('whatsapp') ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                          WhatsApp Mobile Chat Bubble Preview
                        </div>

                        <div className="rounded-xl border border-border bg-[#0b141a] p-4 max-h-[500px] overflow-y-auto">
                          {/* Chat header simulation */}
                          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60 mb-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                              AB
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-100">AutoBell Verified Business</div>
                              <div className="text-[10px] text-emerald-400">Official Notification Channel</div>
                            </div>
                          </div>

                          {/* Message bubble */}
                          <div className="bg-[#005c4b] text-slate-100 p-3.5 rounded-lg rounded-tl-none max-w-sm text-xs whitespace-pre-wrap font-sans shadow-md leading-relaxed">
                            {renderTemplateText(selectedTemplate.whatsapp_body_text || '', {
                              user_name: 'Dr. Farhan Ahmed',
                              school_name: 'Beaconhouse Al-Falah Campus',
                              campus_name: 'Main Campus',
                              email: 'farhan.ahmed@beaconhouse.edu.pk',
                              login_url: 'https://autobell-portal.vercel.app/login',
                              dashboard_url: 'https://autobell-portal.vercel.app/dashboard',
                              support_phone: '+92 321 8887766',
                              support_email: 'support@autobell-portal.com',
                              invoice_id: 'INV-2026-089',
                              amount: '45,000',
                              currency: 'PKR',
                              payment_method: '1Link Bank Transfer',
                              payment_date: '08/11/2026',
                              plan_name: 'Annual Campus Enterprise License',
                              receipt_url: 'https://autobell-portal.vercel.app/orders',
                              due_date: '15/11/2026',
                              days_remaining: '7',
                              payment_url: 'https://autobell-portal.vercel.app/orders'
                            })}
                            <div className="text-[10px] text-slate-300/80 text-right mt-2 flex items-center justify-end gap-1 font-mono">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              <CheckCircle2 className="w-3 h-3 text-sky-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Notice for Email-only templates */
                      <div className="p-6 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center text-xs text-muted-foreground space-y-2">
                        <Mail className="w-8 h-8 text-sky-400 opacity-60" />
                        <h4 className="font-semibold text-foreground">Email-Only Notification Policy</h4>
                        <p className="max-w-xs text-[11px] leading-relaxed">
                          This template is reserved for Email delivery only (hardware diagnostic alerts, emergency shutdowns, or security notices) in accordance with Meta WhatsApp policies.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Template Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOG DETAILS MODAL */}
      <AnimatePresence>
        {selectedLogForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Communication Dispatch Audit</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLogForDetails(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-3 font-mono text-xs max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-sans">Channel:</span>
                  <span className="text-foreground uppercase font-bold">{selectedLogForDetails.channel}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-sans">Recipient:</span>
                  <span className="text-foreground">{selectedLogForDetails.recipient}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-sans">Status:</span>
                  <span className="uppercase font-bold text-emerald-400">{selectedLogForDetails.status}</span>
                </div>
                {selectedLogForDetails.subject && (
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-muted-foreground font-sans">Subject:</span>
                    <span className="text-foreground font-sans text-xs">{selectedLogForDetails.subject}</span>
                  </div>
                )}
                {selectedLogForDetails.error_message && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-sans">
                    <strong>Error:</strong> {selectedLogForDetails.error_message}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground font-sans text-xs block mb-1">Response Data / Payload:</span>
                  <pre className="p-3 rounded-lg bg-muted text-[11px] overflow-x-auto text-foreground whitespace-pre-wrap">
                    {JSON.stringify(selectedLogForDetails.response_data || selectedLogForDetails.payload, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-3 border-t border-border bg-muted/20 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedLogForDetails(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
