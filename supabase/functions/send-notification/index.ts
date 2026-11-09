import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    const { action, channel, recipient, subject, bodyHtml, bodyText, templateKey, variables = {}, config, testMode = false } = payload;
    const targetChannel = channel || (action === 'send_whatsapp' ? 'whatsapp' : 'email');

    if (!recipient) {
      return new Response(JSON.stringify({ success: false, error: "Recipient is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (targetChannel === 'whatsapp') {
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
        return new Response(JSON.stringify({ success: false, error: "WhatsApp config not found" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const isEnabled = waConfig.is_enabled || testMode;
      const cleanPhone = normalizePhone(recipient);

      if (!isEnabled) {
        await logToDb(supabase, {
          channel: 'whatsapp',
          template_key: templateKey || null,
          recipient: cleanPhone,
          subject: null,
          payload: { variables, simulated: true },
          status: 'simulated',
          response_data: { notice: 'WhatsApp integration is disabled (simulation mode)' }
        });

        return new Response(JSON.stringify({
          success: true,
          status: 'simulated',
          message: `Simulation: WhatsApp message formatted for ${cleanPhone} (Gateway disabled)`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const finalBodyText = bodyText || 'AutoBell Cloud System Notification';
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
          if (!waConfig.account_sid || !waConfig.api_key) {
            throw new Error('Twilio Account SID and Auth Token required');
          }
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

      await logToDb(supabase, {
        channel: 'whatsapp',
        template_key: templateKey || null,
        recipient: cleanPhone,
        subject: null,
        payload: { variables, testMode },
        status,
        error_message: errorMessage,
        response_data: dispatchResult || {}
      });

      if (status === 'failed') {
        return new Response(JSON.stringify({
          success: false,
          status: 'failed',
          error: errorMessage,
          message: `WhatsApp delivery failed: ${errorMessage}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        status: 'sent',
        message: `WhatsApp message dispatched successfully to ${cleanPhone}`,
        details: dispatchResult
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Email Channel
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
      return new Response(JSON.stringify({ success: false, error: "Email config not found" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const isEnabled = emailConfig.is_enabled || testMode;
    if (!isEnabled) {
      await logToDb(supabase, {
        channel: 'email',
        template_key: templateKey || null,
        recipient,
        subject: subject || 'AutoBell Notification',
        payload: { variables, simulated: true },
        status: 'simulated',
        response_data: { notice: 'Email integration is disabled (simulation mode)' }
      });

      return new Response(JSON.stringify({
        success: true,
        status: 'simulated',
        message: `Simulation: Email formatted for ${recipient} (Gateway disabled)`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const finalSubject = subject || 'AutoBell Notification';
    const finalHtml = bodyHtml || '<p>AutoBell Notification</p>';
    let dispatchResult = null;
    let status = 'sent';
    let errorMessage = null;

    try {
      const provider = emailConfig.provider || 'resend';

      if (provider === 'resend') {
        if (!emailConfig.api_key) throw new Error('Resend API Key is required');
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
        if (!res.ok) throw new Error(resJson.message || `Resend error: ${res.statusText}`);
        dispatchResult = resJson;
      } else if (provider === 'sendgrid') {
        if (!emailConfig.api_key) throw new Error('SendGrid API Key is required');
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
        dispatchResult = { provider: 'sendgrid', status: 'sent', statusCode: res.status };
      } else if (provider === 'postmark') {
        if (!emailConfig.api_key) throw new Error('Postmark Server Token is required');
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
        if (!res.ok) throw new Error(resJson.Message || `Postmark error: ${res.statusText}`);
        dispatchResult = resJson;
      } else if (provider === 'custom' && emailConfig.smtp_host) {
        const res = await fetch(emailConfig.smtp_host, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(emailConfig.api_key ? { 'Authorization': `Bearer ${emailConfig.api_key}` } : {})
          },
          body: JSON.stringify({
            recipient,
            subject: finalSubject,
            html: finalHtml,
            timestamp: new Date().toISOString()
          })
        });
        dispatchResult = { status: res.status, statusText: res.statusText };
        if (!res.ok) throw new Error(`Custom webhook returned HTTP ${res.status}`);
      } else {
        throw new Error(`Provider '${provider}' requires serverless execution on Vercel API endpoint for direct SMTP.`);
      }
    } catch (err: any) {
      status = 'failed';
      errorMessage = err.message || 'Email dispatch failed';
    }

    await logToDb(supabase, {
      channel: 'email',
      template_key: templateKey || null,
      recipient,
      subject: finalSubject,
      payload: { variables, testMode },
      status,
      error_message: errorMessage,
      response_data: dispatchResult || {}
    });

    if (status === 'failed') {
      return new Response(JSON.stringify({
        success: false,
        status: 'failed',
        error: errorMessage,
        message: `Email delivery failed: ${errorMessage}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'sent',
      message: `Email successfully delivered to ${recipient}`,
      details: dispatchResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("send-notification error:", error);
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

async function logToDb(supabase: any, data: any) {
  try {
    await supabase.from('communication_logs').insert(data);
  } catch (e: any) {
    console.warn('Logging error:', e.message);
  }
}

