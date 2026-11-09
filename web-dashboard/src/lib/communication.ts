import { supabase, supabaseUrl } from '@/lib/supabase'

export type EmailProvider = 'smtp' | 'resend' | 'sendgrid' | 'postmark' | 'custom'
export type WhatsAppProvider = 'meta' | 'twilio' | 'ultramsg' | 'green_api' | 'wasapi' | 'generic_webhook'

export interface EmailIntegrationConfig {
  id: number
  provider: EmailProvider
  is_enabled: boolean
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password?: string
  smtp_secure: boolean
  sender_name: string
  sender_email: string
  api_key?: string
  updated_at?: string
}

export interface WhatsAppIntegrationConfig {
  id: number
  provider: WhatsAppProvider
  is_enabled: boolean
  api_endpoint: string
  api_key?: string
  phone_number_id: string
  sender_phone: string
  account_sid?: string
  updated_at?: string
}

export interface NotificationTemplate {
  id: string
  template_key: string
  title: string
  category: 'onboarding' | 'billing' | 'system_alert' | 'general'
  channels: ('email' | 'whatsapp')[]
  email_subject?: string | null
  email_body_html?: string | null
  whatsapp_body_text?: string | null
  available_variables: string[]
  is_active: boolean
  updated_at?: string
}

export interface CommunicationLog {
  id: string
  channel: 'email' | 'whatsapp'
  template_key: string | null
  recipient: string
  subject?: string | null
  payload?: any
  status: 'sent' | 'failed' | 'simulated'
  error_message?: string | null
  response_data?: any
  created_at: string
}

/**
 * Replace all {{variable}} tags with runtime values
 */
export function renderTemplateText(templateText: string, variables: Record<string, string | number | undefined | null>): string {
  if (!templateText) return ''
  let result = templateText
  for (const [key, value] of Object.entries(variables)) {
    const cleanVal = value !== undefined && value !== null ? String(value) : ''
    // Replace {{key}}
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), cleanVal)
  }
  return result
}

/**
 * Normalize phone numbers to E.164 without dashes or spaces (e.g. +923001234567)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2)
  } else if (!cleaned.startsWith('+') && cleaned.length >= 10) {
    // If Pakistani local number 03xx, format as +923xx
    if (cleaned.startsWith('03')) {
      cleaned = '+92' + cleaned.substring(1)
    } else {
      cleaned = '+' + cleaned
    }
  }
  return cleaned
}

/**
 * Fetch Email Integration Settings
 */
export async function getEmailConfig(): Promise<EmailIntegrationConfig | null> {
  const { data, error } = await supabase
    .from('email_integration_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.error('Failed to get email config:', error)
    return null
  }
  return data
}

/**
 * Save Email Integration Settings
 */
export async function saveEmailConfig(config: Partial<EmailIntegrationConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_integration_config')
      .upsert({
        id: 1,
        ...config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save email settings' }
  }
}

/**
 * Fetch WhatsApp Integration Settings
 */
export async function getWhatsAppConfig(): Promise<WhatsAppIntegrationConfig | null> {
  const { data, error } = await supabase
    .from('whatsapp_integration_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.error('Failed to get WhatsApp config:', error)
    return null
  }
  return data
}

/**
 * Save WhatsApp Integration Settings
 */
export async function saveWhatsAppConfig(config: Partial<WhatsAppIntegrationConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('whatsapp_integration_config')
      .upsert({
        id: 1,
        ...config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save WhatsApp settings' }
  }
}

/**
 * Fetch All Notification Templates
 */
export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .order('category')
    .order('title')
  if (error) {
    console.error('Failed to get templates:', error)
    return []
  }
  return data || []
}

/**
 * Save / Update a Notification Template
 */
export async function saveNotificationTemplate(template: Partial<NotificationTemplate>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notification_templates')
      .upsert({
        ...template,
        updated_at: new Date().toISOString()
      })
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save template' }
  }
}

/**
 * Fetch Communication Logs
 */
export async function getCommunicationLogs(limit = 50): Promise<CommunicationLog[]> {
  const { data, error } = await supabase
    .from('communication_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('Failed to fetch communication logs:', error)
    return []
  }
  return data || []
}

/**
 * Dispatch Email Notification
 */
export async function sendEmailNotification(options: {
  templateKey?: string
  recipient: string
  subject?: string
  bodyHtml?: string
  variables?: Record<string, string | number | undefined | null>
  testMode?: boolean
  customConfig?: EmailIntegrationConfig
}): Promise<{ success: boolean; status: 'sent' | 'simulated' | 'failed'; message: string; logId?: string; details?: any }> {
  const { templateKey, recipient, variables = {}, testMode = false, customConfig } = options
  let finalSubject = options.subject || ''
  let finalBodyHtml = options.bodyHtml || ''

  try {
    const emailConfig = customConfig || await getEmailConfig()
    
    // Resolve template if templateKey provided
    if (templateKey) {
      const { data: tpl } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('template_key', templateKey)
        .maybeSingle()

      if (tpl) {
        if (!finalSubject && tpl.email_subject) {
          finalSubject = renderTemplateText(tpl.email_subject, variables)
        }
        if (!finalBodyHtml && tpl.email_body_html) {
          finalBodyHtml = renderTemplateText(tpl.email_body_html, variables)
        }
      }
    }

    if (!finalSubject) finalSubject = 'AutoBell Notification'
    if (!finalBodyHtml) finalBodyHtml = '<p>Notification from AutoBell Cloud</p>'

    // If caller doesn't have emailConfig (e.g. unauthenticated /register due to Supabase RLS),
    // delegate directly to Edge Function which has service_role database access
    if (!emailConfig) {
      try {
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            subject: finalSubject,
            html: finalBodyHtml,
            templateKey,
            variables,
            testMode
          })
        })
        const edgeJson = await edgeRes.json().catch(() => null)
        if (edgeRes.ok && edgeJson?.success) {
          return {
            success: true,
            status: edgeJson.status || 'sent',
            message: edgeJson.message || `Email sent to ${recipient}`,
            logId: edgeJson.logId,
            details: edgeJson.details
          }
        } else {
          return {
            success: false,
            status: edgeJson?.status || 'failed',
            message: edgeJson?.message || edgeJson?.error || 'Email delivery failed',
            logId: edgeJson?.logId
          }
        }
      } catch (err: any) {
        console.warn('Anonymous edge send-email failed:', err)
      }
    }

    const isLive = (emailConfig?.is_enabled || testMode) && (emailConfig?.api_key || emailConfig?.smtp_user || emailConfig?.smtp_host)

    if (!isLive) {
      // Simulation Mode
      const notice = 'Email logged in simulation mode (enable Email Integration with valid credentials to deliver to live inboxes)'
      const { data: logEntry } = await supabase
        .from('communication_logs')
        .insert({
          channel: 'email',
          template_key: templateKey || null,
          recipient,
          subject: finalSubject,
          payload: { variables, finalSubject, testMode },
          status: 'simulated',
          error_message: null,
          response_data: { notice, renderedSubject: finalSubject, recipient }
        })
        .select('id')
        .single()

      return {
        success: true,
        status: 'simulated',
        message: `Simulation Mode: Email formatted for ${recipient} (Gateway disabled)`,
        logId: logEntry?.id
      }
    }

    // --- LIVE PRODUCTION DISPATCH ---
    // 1. If provider is SMTP, dispatch via dedicated Supabase Edge Function (Deno TLS socket to mail.digitapbs.pk)
    if (emailConfig?.provider === 'smtp') {
      try {
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            subject: finalSubject,
            html: finalBodyHtml,
            templateKey,
            variables,
            testMode,
            host: emailConfig.smtp_host || 'mail.digitapbs.pk',
            port: emailConfig.smtp_port || 465,
            user: emailConfig.smtp_user || 'autobell@digitapbs.pk',
            pass: emailConfig.smtp_password || undefined,
            from: emailConfig.sender_email || 'autobell@digitapbs.pk',
            fromName: emailConfig.sender_name || 'AutoBell Cloud System'
          })
        })

        const edgeJson = await edgeRes.json().catch(() => null)
        if (edgeRes.ok && edgeJson?.success) {
          return {
            success: true,
            status: edgeJson.status || 'sent',
            message: edgeJson.message || `Email successfully delivered to ${recipient}`,
            logId: edgeJson.logId,
            details: edgeJson.details
          }
        } else {
          return {
            success: false,
            status: 'failed',
            message: edgeJson?.message || edgeJson?.error || 'Email delivery failed via Custom SMTP',
            logId: edgeJson?.logId,
            details: edgeJson
          }
        }
      } catch (edgeErr: any) {
        console.error('Edge Function send-email invocation failed:', edgeErr)
        return {
          success: false,
          status: 'failed',
          message: edgeErr.message || 'Failed connecting to AutoBell Edge SMTP service'
        }
      }
    }

    // 2. Try Backend Vercel Serverless Function (/api/notify) for other server-side providers
    try {
      const apiRes = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_email',
          recipient,
          subject: finalSubject,
          bodyHtml: finalBodyHtml,
          templateKey,
          variables,
          config: emailConfig,
          testMode
        })
      })

      const apiJson = await apiRes.json().catch(() => null)
      if (apiRes.ok && apiJson?.success) {
        return {
          success: true,
          status: 'sent',
          message: apiJson.message || `Email successfully delivered to ${recipient}`,
          logId: apiJson.logId,
          details: apiJson.details
        }
      } else if (apiJson && apiJson.status === 'failed') {
        return {
          success: false,
          status: 'failed',
          message: apiJson.message || apiJson.error || 'Email delivery failed',
          logId: apiJson.logId
        }
      }
    } catch (backendErr) {
      console.warn('Backend /api/notify dispatch attempt bypassed or failed:', backendErr)
    }

    // 3. Direct Client-side REST Fallback (for Resend, SendGrid, Postmark, Webhook)
    let status: 'sent' | 'simulated' | 'failed' = 'sent'
    let errorMessage: string | null = null
    let responseData: any = null

    if (emailConfig?.provider === 'resend' && emailConfig.api_key) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${emailConfig.sender_name || 'AutoBell'} <${emailConfig.sender_email}>`,
            to: [recipient],
            subject: finalSubject,
            html: finalBodyHtml
          })
        })
        const resJson = await res.json()
        if (!res.ok) {
          status = 'failed'
          errorMessage = resJson.message || 'Resend API returned error'
        } else {
          responseData = resJson
        }
      } catch (err: any) {
        status = 'failed'
        errorMessage = err.message || 'Network error connecting to Resend'
      }
    } else if (emailConfig?.provider === 'sendgrid' && emailConfig.api_key) {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipient }] }],
            from: { email: emailConfig.sender_email, name: emailConfig.sender_name },
            subject: finalSubject,
            content: [{ type: 'text/html', value: finalBodyHtml }]
          })
        })
        if (!res.ok) {
          const errText = await res.text()
          status = 'failed'
          errorMessage = `SendGrid error (${res.status}): ${errText}`
        } else {
          responseData = { provider: 'sendgrid', status: 'sent' }
        }
      } catch (err: any) {
        status = 'failed'
        errorMessage = err.message || 'Network error connecting to SendGrid'
      }
    } else if (emailConfig?.provider === 'postmark' && emailConfig.api_key) {
      try {
        const res = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            'X-Postmark-Server-Token': emailConfig.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            From: `${emailConfig.sender_name} <${emailConfig.sender_email}>`,
            To: recipient,
            Subject: finalSubject,
            HtmlBody: finalBodyHtml
          })
        })
        const resJson = await res.json()
        if (!res.ok) {
          status = 'failed'
          errorMessage = resJson.Message || 'Postmark returned error'
        } else {
          responseData = resJson
        }
      } catch (err: any) {
        status = 'failed'
        errorMessage = err.message || 'Network error connecting to Postmark'
      }
    } else if (emailConfig?.provider === 'smtp') {
      status = 'sent'
      responseData = { provider: 'smtp', status: 'sent via Edge SMTP' }
    } else {
      status = 'failed'
      errorMessage = `Unsupported email provider configuration: ${emailConfig?.provider}`
    }

    // Audit Log in communication_logs
    const { data: logEntry } = await supabase
      .from('communication_logs')
      .insert({
        channel: 'email',
        template_key: templateKey || null,
        recipient,
        subject: finalSubject,
        payload: { variables, finalSubject, testMode },
        status,
        error_message: errorMessage,
        response_data: responseData
      })
      .select('id')
      .single()

    return {
      success: status !== 'failed',
      status,
      message: status === 'sent'
        ? `Email successfully sent to ${recipient}`
        : `Email delivery failed: ${errorMessage}`,
      logId: logEntry?.id,
      details: responseData
    }
  } catch (err: any) {
    console.error('Email dispatch error:', err)
    return {
      success: false,
      status: 'failed',
      message: err.message || 'Failed to dispatch email'
    }
  }
}

/**
 * Dispatch WhatsApp Notification
 * Note: WhatsApp is restricted to Account Registration, Registration Confirmation, Payment Confirmation, and Payment Reminders.
 */
export async function sendWhatsAppNotification(options: {
  templateKey?: string
  recipientPhone: string
  bodyText?: string
  variables?: Record<string, string | number | undefined | null>
  testMode?: boolean
  customConfig?: WhatsAppIntegrationConfig
}): Promise<{ success: boolean; status: 'sent' | 'simulated' | 'failed'; message: string; logId?: string; details?: any }> {
  const { templateKey, recipientPhone, variables = {}, testMode = false, customConfig } = options
  let finalBodyText = options.bodyText || ''

  try {
    const waConfig = customConfig || await getWhatsAppConfig()
    const cleanPhone = normalizePhoneNumber(recipientPhone)

    // Resolve template if templateKey provided
    if (templateKey) {
      const { data: tpl } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('template_key', templateKey)
        .maybeSingle()

      if (tpl && !finalBodyText && tpl.whatsapp_body_text) {
        finalBodyText = renderTemplateText(tpl.whatsapp_body_text, variables)
      }
    }

    if (!finalBodyText) {
      finalBodyText = 'AutoBell Notification: Important system alert for your institution.'
    }

    const isLive = (waConfig?.is_enabled || testMode) && (waConfig?.api_key || waConfig?.api_endpoint || waConfig?.account_sid)

    if (!isLive) {
      // Simulation Mode
      const notice = 'WhatsApp message logged in simulation mode (configure and enable WhatsApp API settings to dispatch live WhatsApp messages)'
      const { data: logEntry } = await supabase
        .from('communication_logs')
        .insert({
          channel: 'whatsapp',
          template_key: templateKey || null,
          recipient: cleanPhone,
          payload: { variables, finalBodyText, testMode },
          status: 'simulated',
          error_message: null,
          response_data: { notice, cleanPhone, renderedMessage: finalBodyText }
        })
        .select('id')
        .single()

      return {
        success: true,
        status: 'simulated',
        message: `Simulation Mode: WhatsApp message formatted for ${cleanPhone} (Gateway disabled)`,
        logId: logEntry?.id
      }
    }

    // --- LIVE PRODUCTION DISPATCH ---
    // 1. Try Backend Vercel Serverless Function (/api/notify)
    try {
      const apiRes = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_whatsapp',
          recipient: cleanPhone,
          bodyText: finalBodyText,
          templateKey,
          variables,
          config: waConfig,
          testMode
        })
      })

      const apiJson = await apiRes.json().catch(() => null)
      if (apiRes.ok && apiJson?.success) {
        return {
          success: true,
          status: 'sent',
          message: apiJson.message || `WhatsApp message dispatched successfully to ${cleanPhone}`,
          logId: apiJson.logId,
          details: apiJson.details
        }
      } else if (apiJson && apiJson.status === 'failed') {
        return {
          success: false,
          status: 'failed',
          message: apiJson.message || apiJson.error || 'WhatsApp message dispatch failed',
          logId: apiJson.logId
        }
      }
    } catch (backendErr) {
      console.warn('Backend /api/notify dispatch attempt bypassed or failed:', backendErr)
    }

    // 2. Direct Client-side REST Fallback
    let status: 'sent' | 'simulated' | 'failed' = 'sent'
    let errorMessage: string | null = null
    let responseData: any = null

    if (waConfig) {
      if (waConfig.provider === 'meta' && waConfig.api_key && waConfig.phone_number_id) {
        try {
          const endpoint = waConfig.api_endpoint.replace('{PHONE_NUMBER_ID}', waConfig.phone_number_id.trim())
          const digitsOnly = cleanPhone.replace(/\D/g, '')
          const metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: digitsOnly,
            type: 'text',
            text: {
              preview_url: true,
              body: finalBodyText
            }
          }

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waConfig.api_key.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(metaPayload)
          })
          const resJson = await res.json()
          if (!res.ok) {
            status = 'failed'
            errorMessage = resJson.error?.message || 'Meta WhatsApp API returned an error'
          } else {
            responseData = resJson
          }
        } catch (apiErr: any) {
          status = 'failed'
          errorMessage = apiErr.message || 'Failed connecting to Meta WhatsApp Cloud API'
        }
      } else if (waConfig.provider === 'ultramsg' && waConfig.api_key) {
        try {
          const endpoint = waConfig.api_endpoint || 'https://api.ultramsg.com/messages/chat'
          const digitsOnly = cleanPhone.replace(/\D/g, '')
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: waConfig.api_key,
              to: digitsOnly,
              body: finalBodyText
            })
          })
          const resJson = await res.json().catch(() => ({ status: res.statusText }))
          if (!res.ok || resJson.error) {
            status = 'failed'
            errorMessage = resJson.error || `UltraMsg error: ${res.statusText}`
          } else {
            responseData = resJson
          }
        } catch (uErr: any) {
          status = 'failed'
          errorMessage = uErr.message || 'UltraMsg connection error'
        }
      } else if (waConfig.provider === 'green_api' && waConfig.api_endpoint) {
        try {
          const digitsOnly = cleanPhone.replace(/\D/g, '')
          const res = await fetch(waConfig.api_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: `${digitsOnly}@c.us`,
              message: finalBodyText
            })
          })
          const resJson = await res.json().catch(() => ({ status: res.statusText }))
          if (!res.ok) {
            status = 'failed'
            errorMessage = `Green API error (${res.status})`
          } else {
            responseData = resJson
          }
        } catch (gErr: any) {
          status = 'failed'
          errorMessage = gErr.message || 'Green API connection error'
        }
      } else if (waConfig.provider === 'twilio') {
        status = 'failed'
        errorMessage = 'Twilio API requires server-side execution due to browser CORS policies. Handled on live Vercel deployment.'
      } else if (waConfig.api_endpoint) {
        try {
          const res = await fetch(waConfig.api_endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(waConfig.api_key ? { 'Authorization': `Bearer ${waConfig.api_key}` } : {})
            },
            body: JSON.stringify({
              to: cleanPhone,
              message: finalBodyText,
              template_key: templateKey || 'custom',
              sender: waConfig.sender_phone,
              timestamp: new Date().toISOString()
            })
          })
          const resJson = await res.json().catch(() => ({ status: res.statusText }))
          if (!res.ok) {
            status = 'failed'
            errorMessage = `Endpoint returned status ${res.status}`
          } else {
            responseData = resJson
          }
        } catch (webhookErr: any) {
          status = 'failed'
          errorMessage = webhookErr.message || 'Custom webhook failed'
        }
      }
    }

    // Audit Log in communication_logs
    const { data: logEntry } = await supabase
      .from('communication_logs')
      .insert({
        channel: 'whatsapp',
        template_key: templateKey || null,
        recipient: cleanPhone,
        payload: { variables, finalBodyText, testMode },
        status,
        error_message: errorMessage,
        response_data: responseData
      })
      .select('id')
      .single()

    return {
      success: status !== 'failed',
      status,
      message: status === 'sent'
        ? `WhatsApp message dispatched successfully to ${cleanPhone}`
        : `WhatsApp delivery failed: ${errorMessage}`,
      logId: logEntry?.id,
      details: responseData
    }
  } catch (err: any) {
    console.error('WhatsApp dispatch error:', err)
    return {
      success: false,
      status: 'failed',
      message: err.message || 'Failed to dispatch WhatsApp message'
    }
  }
}

