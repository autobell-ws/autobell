import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendSmtpEmail({ host, port, user, pass, from, fromName, to, subject, html }) {
  const targetPort = Number(port) || 465;
  const conn = await Deno.connectTls({ hostname: host, port: targetPort });
  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readReply() {
    let text = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
      const lines = text.trimEnd().split("\n");
      const lastLine = lines[lines.length - 1];
      if (/^\d{3} /.test(lastLine)) break;
    }
    return text;
  }

  async function sendCmd(cmd) {
    await writer.write(encoder.encode(cmd + "\r\n"));
    return await readReply();
  }

  await readReply();
  await sendCmd("EHLO " + host);
  const auth = await sendCmd("AUTH LOGIN");
  if (!auth.startsWith("334")) throw new Error("AUTH LOGIN failed: " + auth);

  const uRes = await sendCmd(btoa(user));
  if (!uRes.startsWith("334")) throw new Error("Username rejected: " + uRes);

  const pRes = await sendCmd(btoa(pass));
  if (!pRes.startsWith("235")) throw new Error("Password rejected: " + pRes);

  const mf = await sendCmd("MAIL FROM:<" + from + ">");
  if (!mf.startsWith("250")) throw new Error("MAIL FROM rejected: " + mf);

  const rc = await sendCmd("RCPT TO:<" + to + ">");
  if (!rc.startsWith("250")) throw new Error("RCPT TO rejected: " + rc);

  const d = await sendCmd("DATA");
  if (!d.startsWith("354")) throw new Error("DATA command rejected: " + d);

  const msgId = "<" + Date.now() + "." + Math.random().toString(36).substring(2) + "@" + host + ">";
  const senderDisplay = fromName ? `"${fromName}" <${from}>` : `<${from}>`;

  const emailContent = [
    "From: " + senderDisplay,
    "To: <" + to + ">",
    "Subject: " + subject,
    "Message-ID: " + msgId,
    "Date: " + new Date().toUTCString(),
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
    "",
    "."
  ].join("\r\n");

  const sendRes = await sendCmd(emailContent);
  await sendCmd("QUIT");
  conn.close();

  if (!sendRes.startsWith("250")) throw new Error("Delivery failed: " + sendRes);
  return { response: sendRes.trim(), messageId: msgId };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://oopyelhldjyyoupetynq.supabase.co';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json().catch(() => ({}));
    const {
      channel = 'email',
      action,
      recipient,
      subject,
      bodyHtml,
      bodyText,
      templateKey,
      variables = {},
      config,
      testMode = false
    } = payload;

    const targetChannel = channel || (action === 'send_whatsapp' ? 'whatsapp' : 'email');

    if (!recipient) {
      return new Response(JSON.stringify({ success: false, error: 'Recipient is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (targetChannel === 'email') {
      let emailConfig = config;
      if (!emailConfig) {
        const { data: dbConfig } = await supabase
          .from('email_integration_config')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        emailConfig = dbConfig;
      }

      if (!emailConfig) {
        throw new Error('Email integration configuration not found');
      }

      const isLive = emailConfig.is_enabled || testMode;
      const finalSubject = subject || 'AutoBell Cloud Notification';
      const finalHtml = bodyHtml || '<p>Notification from AutoBell Cloud</p>';

      if (!isLive) {
        const { data: logEntry } = await supabase.from('communication_logs').insert({
          channel: 'email',
          template_key: templateKey || null,
          recipient,
          subject: finalSubject,
          payload: { variables, simulated: true },
          status: 'simulated',
          response_data: { notice: 'Email integration is disabled. Running in simulation mode.' }
        }).select('id').single();

        return new Response(JSON.stringify({
          success: true,
          status: 'simulated',
          message: `Simulation Mode: Email formatted for ${recipient} (Gateway disabled)`,
          logId: logEntry?.id
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let dispatchResult = null;
      let status = 'sent';
      let errorMessage = null;

      try {
        const provider = emailConfig.provider || 'smtp';

        if (provider === 'smtp') {
          const host = emailConfig.smtp_host || 'mail.digitapbs.pk';
          const port = Number(emailConfig.smtp_port) || 465;
          const user = emailConfig.smtp_user;
          const pass = emailConfig.smtp_password;
          const from = emailConfig.sender_email || user;
          const fromName = emailConfig.sender_name || 'AutoBell Cloud System';

          if (!user || !pass) throw new Error('SMTP credentials incomplete (missing username or password)');

          dispatchResult = await sendSmtpEmail({
            host,
            port,
            user,
            pass,
            from,
            fromName,
            to: recipient,
            subject: finalSubject,
            html: finalHtml
          });
        } else if (provider === 'resend' && emailConfig.api_key) {
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
              html: finalHtml
            })
          });
          const resJson = await res.json();
          if (!res.ok) throw new Error(resJson.message || `Resend error (${res.status})`);
          dispatchResult = resJson;
        } else if (provider === 'sendgrid' && emailConfig.api_key) {
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
              content: [{ type: 'text/html', value: finalHtml }]
            })
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`SendGrid API error (${res.status}): ${errText}`);
          }
          dispatchResult = { provider: 'sendgrid', status: 'sent' };
        } else if (provider === 'postmark' && emailConfig.api_key) {
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
              HtmlBody: finalHtml
            })
          });
          const resJson = await res.json();
          if (!res.ok) throw new Error(resJson.Message || `Postmark error (${res.status})`);
          dispatchResult = resJson;
        } else {
          throw new Error(`Unsupported email provider: ${provider}`);
        }
      } catch (err: any) {
        status = 'failed';
        errorMessage = err.message || 'Email delivery failed';
      }

      const { data: logEntry } = await supabase.from('communication_logs').insert({
        channel: 'email',
        template_key: templateKey || null,
        recipient,
        subject: finalSubject,
        payload: { variables, testMode },
        status,
        error_message: errorMessage,
        response_data: dispatchResult || {}
      }).select('id').single();

      if (status === 'failed') {
        return new Response(JSON.stringify({
          success: false,
          status: 'failed',
          error: errorMessage,
          message: `Email delivery failed: ${errorMessage}`,
          logId: logEntry?.id
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        status: 'sent',
        message: `Email successfully delivered to ${recipient}`,
        details: dispatchResult,
        logId: logEntry?.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- WHATSAPP DISPATCH ---
    let waConfig = config;
    if (!waConfig) {
      const { data: dbConfig } = await supabase
        .from('whatsapp_integration_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      waConfig = dbConfig;
    }

    if (!waConfig) {
      throw new Error('WhatsApp integration configuration not found');
    }

    const cleanPhone = normalizePhone(recipient);
    const isLive = waConfig.is_enabled || testMode;
    const finalBodyText = bodyText || 'AutoBell Cloud Notification';

    if (!isLive) {
      const { data: logEntry } = await supabase.from('communication_logs').insert({
        channel: 'whatsapp',
        template_key: templateKey || null,
        recipient: cleanPhone,
        subject: null,
        payload: { variables, simulated: true },
        status: 'simulated',
        response_data: { notice: 'WhatsApp integration is disabled (simulation mode)' }
      }).select('id').single();

      return new Response(JSON.stringify({
        success: true,
        status: 'simulated',
        message: `Simulation Mode: WhatsApp message formatted for ${cleanPhone} (Gateway disabled)`,
        logId: logEntry?.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let dispatchResult = null;
    let status = 'sent';
    let errorMessage = null;

    try {
      const provider = waConfig.provider || 'meta';

      if (provider === 'meta') {
        if (!waConfig.api_key) throw new Error('Meta System User Access Token is required');
        if (!waConfig.phone_number_id) throw new Error('Meta Phone Number ID is required');

        const endpoint = (waConfig.api_endpoint || 'https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages')
          .replace('{PHONE_NUMBER_ID}', waConfig.phone_number_id.trim());

        const digitsOnly = cleanPhone.replace(/\D/g, '');
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waConfig.api_key.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: digitsOnly,
            type: 'text',
            text: { preview_url: true, body: finalBodyText }
          })
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error?.message || `Meta Cloud API error (${res.status})`);
        dispatchResult = resJson;
      } else if (provider === 'twilio') {
        if (!waConfig.account_sid || !waConfig.api_key) throw new Error('Twilio Account SID and Auth Token required');
        const sender = waConfig.sender_phone.startsWith('whatsapp:')
          ? waConfig.sender_phone
          : `whatsapp:${waConfig.sender_phone.replace(/\s+/g, '')}`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${waConfig.account_sid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('From', sender);
        params.append('To', `whatsapp:${cleanPhone}`);
        params.append('Body', finalBodyText);

        const authHeader = 'Basic ' + btoa(`${waConfig.account_sid}:${waConfig.api_key}`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.message || `Twilio error: ${res.statusText}`);
        dispatchResult = resJson;
      } else if (provider === 'ultramsg') {
        const endpoint = waConfig.api_endpoint || 'https://api.ultramsg.com/messages/chat';
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: waConfig.api_key,
            to: digitsOnly,
            body: finalBodyText
          })
        });
        const resJson = await res.json().catch(() => ({ status: res.statusText }));
        if (!res.ok || resJson.error) throw new Error(resJson.error || `UltraMsg error (${res.status})`);
        dispatchResult = resJson;
      } else if (provider === 'green_api') {
        const endpoint = waConfig.api_endpoint;
        if (!endpoint) throw new Error('Green API Endpoint required');
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${digitsOnly}@c.us`,
            message: finalBodyText
          })
        });
        const resJson = await res.json().catch(() => ({ status: res.statusText }));
        if (!res.ok) throw new Error(`Green API error (${res.status})`);
        dispatchResult = resJson;
      } else if (provider === 'wasapi') {
        const endpoint = waConfig.api_endpoint || 'https://api.wasapi.io/v1/messages';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ phone: cleanPhone, message: finalBodyText })
        });
        const resJson = await res.json().catch(() => ({ status: res.statusText }));
        if (!res.ok) throw new Error(`Wasapi error (${res.status})`);
        dispatchResult = resJson;
      } else if (waConfig.api_endpoint) {
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
            timestamp: new Date().toISOString()
          })
        });
        dispatchResult = { status: res.status, statusText: res.statusText };
        if (!res.ok) throw new Error(`Webhook endpoint returned HTTP ${res.status}`);
      } else {
        throw new Error(`Unsupported WhatsApp provider: ${provider}`);
      }
    } catch (err: any) {
      status = 'failed';
      errorMessage = err.message || 'WhatsApp dispatch failed';
    }

    const { data: logEntry } = await supabase.from('communication_logs').insert({
      channel: 'whatsapp',
      template_key: templateKey || null,
      recipient: cleanPhone,
      subject: null,
      payload: { variables, testMode },
      status,
      error_message: errorMessage,
      response_data: dispatchResult || {}
    }).select('id').single();

    if (status === 'failed') {
      return new Response(JSON.stringify({
        success: false,
        status: 'failed',
        error: errorMessage,
        message: `WhatsApp delivery failed: ${errorMessage}`,
        logId: logEntry?.id
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'sent',
      message: `WhatsApp message dispatched successfully to ${cleanPhone}`,
      details: dispatchResult,
      logId: logEntry?.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('send-notification error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function normalizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (!cleaned.startsWith('+') && cleaned.length >= 10) {
    if (cleaned.startsWith('03')) {
      cleaned = '+92' + cleaned.substring(1);
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}
