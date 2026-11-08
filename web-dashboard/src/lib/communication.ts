import { supabase } from '@/lib/supabase'

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
}): Promise<{ success: boolean; status: 'sent' | 'simulated' | 'failed'; message: string; logId?: string }> {
  const { templateKey, recipient, variables = {} } = options
  let finalSubject = options.subject || ''
  let finalBodyHtml = options.bodyHtml || ''

  try {
    const emailConfig = await getEmailConfig()
    
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

    const isSimulated = !emailConfig?.is_enabled || (!emailConfig.api_key && !emailConfig.smtp_user)

    let status: 'sent' | 'simulated' | 'failed' = isSimulated ? 'simulated' : 'sent'
    let errorMessage: string | null = null
    let responseData: any = null

    if (!isSimulated && emailConfig) {
      // Real API Call if provider API Key configured (e.g. Resend)
      if (emailConfig.provider === 'resend' && emailConfig.api_key) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${emailConfig.api_key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: `${emailConfig.sender_name} <${emailConfig.sender_email}>`,
              to: [recipient],
              subject: finalSubject,
              html: finalBodyHtml
            })
          })
          const resJson = await res.json()
          if (!res.ok) {
            status = 'failed'
            errorMessage = resJson.message || 'Resend API error'
          } else {
            responseData = resJson
          }
        } catch (apiErr: any) {
          status = 'failed'
          errorMessage = apiErr.message || 'Network error connecting to email provider'
        }
      } else {
        // SMTP / Generic webhook / fallback
        responseData = {
          provider: emailConfig.provider,
          host: emailConfig.smtp_host,
          port: emailConfig.smtp_port,
          from: emailConfig.sender_email,
          queued: true
        }
      }
    } else {
      responseData = {
        notice: 'Email logged in simulation mode (enable Email Integration with valid credentials to deliver to live inboxes)',
        renderedSubject: finalSubject,
        recipient
      }
    }

    // Audit Log in communication_logs
    const { data: logEntry } = await supabase
      .from('communication_logs')
      .insert({
        channel: 'email',
        template_key: templateKey || null,
        recipient,
        subject: finalSubject,
        payload: { variables, finalSubject },
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
        : status === 'simulated'
        ? `Email generated and logged in Simulation Mode for ${recipient}`
        : `Email delivery failed: ${errorMessage}`,
      logId: logEntry?.id
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
}): Promise<{ success: boolean; status: 'sent' | 'simulated' | 'failed'; message: string; logId?: string }> {
  const { templateKey, recipientPhone, variables = {} } = options
  let finalBodyText = options.bodyText || ''

  try {
    const waConfig = await getWhatsAppConfig()
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

    const isSimulated = !waConfig?.is_enabled || (!waConfig.api_key && !waConfig.api_endpoint)

    let status: 'sent' | 'simulated' | 'failed' = isSimulated ? 'simulated' : 'sent'
    let errorMessage: string | null = null
    let responseData: any = null

    if (!isSimulated && waConfig) {
      if (waConfig.provider === 'meta' && waConfig.api_key && waConfig.phone_number_id) {
        // Meta WhatsApp Cloud API
        try {
          const endpoint = waConfig.api_endpoint.replace('{PHONE_NUMBER_ID}', waConfig.phone_number_id)
          const metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone.replace('+', ''),
            type: 'text',
            text: {
              preview_url: true,
              body: finalBodyText
            }
          }

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waConfig.api_key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(metaPayload)
          })
          const resJson = await res.json()
          if (!res.ok) {
            status = 'failed'
            errorMessage = resJson.error?.message || 'Meta WhatsApp API returned an error'
            responseData = resJson
          } else {
            responseData = resJson
          }
        } catch (apiErr: any) {
          status = 'failed'
          errorMessage = apiErr.message || 'Failed connecting to Meta WhatsApp Cloud API'
        }
      } else if (waConfig.provider === 'twilio' && waConfig.api_key && waConfig.account_sid) {
        // Twilio Programmable Messaging WhatsApp
        try {
          const url = `https://api.twilio.com/2010-04-01/Accounts/${waConfig.account_sid}/Messages.json`
          const params = new URLSearchParams()
          params.append('From', waConfig.sender_phone.startsWith('whatsapp:') ? waConfig.sender_phone : `whatsapp:${waConfig.sender_phone}`)
          params.append('To', `whatsapp:${cleanPhone}`)
          params.append('Body', finalBodyText)

          const authHeader = 'Basic ' + btoa(`${waConfig.account_sid}:${waConfig.api_key}`)
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          })
          const resJson = await res.json()
          if (!res.ok) {
            status = 'failed'
            errorMessage = resJson.message || 'Twilio WhatsApp API error'
            responseData = resJson
          } else {
            responseData = resJson
          }
        } catch (apiErr: any) {
          status = 'failed'
          errorMessage = apiErr.message || 'Failed connecting to Twilio API'
        }
      } else if (waConfig.api_endpoint) {
        // Generic Webhook / UltraMsg / Wasapi
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
            responseData = resJson
          } else {
            responseData = resJson
          }
        } catch (webhookErr: any) {
          status = 'failed'
          errorMessage = webhookErr.message || 'Custom webhook failed'
        }
      }
    } else {
      responseData = {
        notice: 'WhatsApp message logged in simulation mode (configure and enable WhatsApp API settings to dispatch live WhatsApp messages)',
        cleanPhone,
        renderedMessage: finalBodyText
      }
    }

    // Audit Log in communication_logs
    const { data: logEntry } = await supabase
      .from('communication_logs')
      .insert({
        channel: 'whatsapp',
        template_key: templateKey || null,
        recipient: cleanPhone,
        payload: { variables, finalBodyText },
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
        : status === 'simulated'
        ? `WhatsApp message formatted and logged in Simulation Mode for ${cleanPhone}`
        : `WhatsApp delivery failed: ${errorMessage}`,
      logId: logEntry?.id
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
