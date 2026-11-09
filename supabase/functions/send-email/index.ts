// AutoBell Custom SMTP & Notification Edge Function
// Zero external dependencies to guarantee instant cold-start and maximum reliability on Deno.

function renderTemplateText(templateText: string, variables: Record<string, any>): string {
  if (!templateText) return ''
  let result = templateText
  for (const [key, value] of Object.entries(variables || {})) {
    const cleanVal = value !== undefined && value !== null ? String(value) : ''
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), cleanVal)
  }
  return result
}

async function sendSmtpEmail({
  host,
  port,
  user,
  pass,
  from,
  fromName,
  to,
  subject,
  html
}: {
  host: string
  port: number
  user: string
  pass: string
  from: string
  fromName: string
  to: string
  subject: string
  html: string
}) {
  const targetPort = Number(port) || 465
  const conn = await Deno.connectTls({ hostname: host, port: targetPort })
  const reader = conn.readable.getReader()
  const writer = conn.writable.getWriter()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  async function readReply(): Promise<string> {
    let text = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      text += decoder.decode(value)
      const lines = text.trimEnd().split('\n')
      const lastLine = lines[lines.length - 1]
      if (/^\d{3} /.test(lastLine)) break
    }
    return text
  }

  async function sendCmd(cmd: string): Promise<string> {
    await writer.write(encoder.encode(cmd + '\r\n'))
    return await readReply()
  }

  await readReply()
  await sendCmd('EHLO ' + host)
  const auth = await sendCmd('AUTH LOGIN')
  if (!auth.startsWith('334')) throw new Error('AUTH LOGIN failed: ' + auth)

  const uRes = await sendCmd(btoa(user))
  if (!uRes.startsWith('334')) throw new Error('Username rejected: ' + uRes)

  const pRes = await sendCmd(btoa(pass))
  if (!pRes.startsWith('235')) throw new Error('Password rejected: ' + pRes)

  const mf = await sendCmd('MAIL FROM:<' + from + '>')
  if (!mf.startsWith('250')) throw new Error('MAIL FROM rejected: ' + mf)

  const rc = await sendCmd('RCPT TO:<' + to + '>')
  if (!rc.startsWith('250')) throw new Error('RCPT TO rejected: ' + rc)

  const d = await sendCmd('DATA')
  if (!d.startsWith('354')) throw new Error('DATA command rejected: ' + d)

  const msgId = '<' + Date.now() + '.' + Math.random().toString(36).substring(2) + '@' + host + '>'
  const senderDisplay = fromName ? `"${fromName}" <${from}>` : `<${from}>`

  const emailContent = [
    'From: ' + senderDisplay,
    'To: <' + to + '>',
    'Subject: ' + subject,
    'Message-ID: ' + msgId,
    'Date: ' + new Date().toUTCString(),
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
    '',
    '.'
  ].join('\r\n')

  const sendRes = await sendCmd(emailContent)
  await sendCmd('QUIT')
  conn.close()

  if (!sendRes.startsWith('250')) throw new Error('Delivery failed: ' + sendRes)
  return { response: sendRes.trim(), messageId: msgId }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zoqzgirtrhpxodrutjvs.supabase.co'
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcXpnaXJ0cmhweG9kcnV0anZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDk2MjgyOSwiZXhwIjoyMTA2NTM4ODI5fQ.-6obiCFLco05bMofL9Fz66mfiluqsQKIqbcnvqJD_cE'

  try {
    const payload = await req.json().catch(() => ({}))
    const {
      to,
      recipient,
      templateKey = null,
      variables = {},
      testMode = false
    } = payload

    const targetTo = to || recipient
    if (!targetTo) {
      return new Response(JSON.stringify({ success: false, error: 'Recipient email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // 1. Fetch DB email integration config using service role
    let dbConfig: any = null
    try {
      const cfgRes = await fetch(supabaseUrl + '/rest/v1/email_integration_config?id=eq.1', {
        headers: {
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey
        }
      })
      if (cfgRes.ok) {
        const rows = await cfgRes.json()
        if (rows && rows.length > 0) dbConfig = rows[0]
      }
    } catch (cfgErr) {
      console.warn('Could not read email_integration_config from DB:', cfgErr)
    }

    const host = payload.host || dbConfig?.smtp_host || 'mail.digitapbs.pk'
    const port = Number(payload.port || dbConfig?.smtp_port || 465)
    const user = payload.user || dbConfig?.smtp_user || 'autobell@digitapbs.pk'
    const pass = payload.pass || dbConfig?.smtp_password || 'Maven@1979#'
    const from = payload.from || dbConfig?.sender_email || 'autobell@digitapbs.pk'
    const fromName = payload.fromName || dbConfig?.sender_name || 'AutoBell Cloud System'
    const isEnabled = dbConfig ? dbConfig.is_enabled : true

    // Check if simulation mode should be applied (disabled gateway and not test mode)
    if (!isEnabled && !testMode) {
      const simNotice = 'Email logged in simulation mode (Email gateway is disabled in settings)'
      try {
        await fetch(supabaseUrl + '/rest/v1/communication_logs', {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': 'Bearer ' + supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            channel: 'email',
            template_key: templateKey,
            recipient: targetTo,
            subject: payload.subject || 'AutoBell Notification (Simulated)',
            payload: { variables, testMode },
            status: 'simulated',
            error_message: null,
            response_data: { notice: simNotice, targetTo }
          })
        })
      } catch (logErr) {
        console.warn('Simulation log failed:', logErr)
      }

      return new Response(JSON.stringify({
        success: true,
        status: 'simulated',
        message: `Simulation Mode: Email logged for ${targetTo} (Gateway disabled)`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // 2. Resolve template from DB if needed
    let finalSubject = payload.subject || ''
    let finalHtml = payload.html || payload.bodyHtml || ''

    if (templateKey && (!finalSubject || !finalHtml)) {
      try {
        const tplRes = await fetch(supabaseUrl + '/rest/v1/notification_templates?template_key=eq.' + encodeURIComponent(templateKey), {
          headers: {
            'apikey': supabaseKey,
            'Authorization': 'Bearer ' + supabaseKey
          }
        })
        if (tplRes.ok) {
          const tpls = await tplRes.json()
          if (tpls && tpls.length > 0) {
            const tpl = tpls[0]
            if (!finalSubject && tpl.email_subject) {
              finalSubject = renderTemplateText(tpl.email_subject, variables)
            }
            if (!finalHtml && tpl.email_body_html) {
              finalHtml = renderTemplateText(tpl.email_body_html, variables)
            }
          }
        }
      } catch (tplErr) {
        console.warn('Failed resolving template from DB:', tplErr)
      }
    }

    if (!finalSubject) finalSubject = 'AutoBell Cloud Notification'
    if (!finalHtml) finalHtml = '<p>Notification from AutoBell Cloud System</p>'

    let dispatchResult = null
    let status = 'sent'
    let errorMessage = null

    try {
      dispatchResult = await sendSmtpEmail({
        host,
        port,
        user,
        pass,
        from,
        fromName,
        to: targetTo,
        subject: finalSubject,
        html: finalHtml
      })
    } catch (err: any) {
      status = 'failed'
      errorMessage = err.message || 'Custom SMTP delivery failed'
    }

    // 3. Insert audit log into communication_logs table
    let logId = null
    try {
      const logRes = await fetch(supabaseUrl + '/rest/v1/communication_logs', {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          channel: 'email',
          template_key: templateKey,
          recipient: targetTo,
          subject: finalSubject,
          payload: { variables, testMode },
          status,
          error_message: errorMessage,
          response_data: dispatchResult || {}
        })
      })
      if (logRes.ok) {
        const createdLogs = await logRes.json()
        if (createdLogs && createdLogs.length > 0) logId = createdLogs[0].id
      }
    } catch (logErr) {
      console.warn('Log insert error:', logErr)
    }

    if (status === 'failed') {
      return new Response(JSON.stringify({
        success: false,
        status: 'failed',
        error: errorMessage,
        message: 'SMTP Delivery Failed: ' + errorMessage,
        logId
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'sent',
      message: `Email successfully delivered to ${targetTo} via Custom SMTP (${host})`,
      logId,
      details: dispatchResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
