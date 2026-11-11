import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://oopyelhldjyyoupetynq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcHllbGhsZGp5eW91cGV0eW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MzA0ODgsImV4cCI6MjEwOTMwNjQ4OH0.Nw2qW21GJs9MjkC_U6rcHt3uCS846K2oB8j4WkvcLdQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const payload = req.body || {};
    const { action, channel, recipient, subject, bodyHtml, bodyText, templateKey, variables = {}, config, testMode = false } = payload;

    const targetChannel = channel || (action === 'send_whatsapp' ? 'whatsapp' : 'email');

    if (!recipient) {
      return res.status(400).json({ success: false, error: 'Recipient is required' });
    }

    if (targetChannel === 'email') {
      return await handleEmailDispatch(req, res, {
        recipient,
        subject,
        bodyHtml,
        templateKey,
        variables,
        customConfig: config,
        testMode
      });
    } else if (targetChannel === 'whatsapp') {
      return await handleWhatsAppDispatch(req, res, {
        recipientPhone: recipient,
        bodyText,
        templateKey,
        variables,
        customConfig: config,
        testMode
      });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid channel. Use "email" or "whatsapp".' });
    }
  } catch (err) {
    console.error('Unhandled notify handler error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}

/**
 * Handle Live Email Dispatching
 */
async function handleEmailDispatch(req, res, options) {
  const { recipient, subject, bodyHtml, templateKey, variables, customConfig, testMode } = options;

  let emailConfig = customConfig;
  if (!emailConfig) {
    const { data: dbConfig } = await supabase
      .from('email_integration_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    emailConfig = dbConfig;
  }

  if (!emailConfig) {
    return res.status(400).json({ success: false, error: 'Email configuration not found' });
  }

  const isEnabled = emailConfig.is_enabled || testMode;
  if (!isEnabled) {
    // Audit simulation
    await logCommunication({
      channel: 'email',
      template_key: templateKey || null,
      recipient,
      subject: subject || 'AutoBell Notification',
      payload: { variables, simulated: true },
      status: 'simulated',
      response_data: { notice: 'Email integration is disabled. Running in simulation mode.' }
    });

    return res.status(200).json({
      success: true,
      status: 'simulated',
      message: `Simulation Mode: Email formatted for ${recipient} (Gateway disabled)`
    });
  }

  let finalSubject = subject || 'AutoBell Notification';
  let finalHtml = bodyHtml || '<p>AutoBell Notification</p>';
  let dispatchResult = null;
  let status = 'sent';
  let errorMessage = null;

  try {
    const provider = emailConfig.provider || 'smtp';

    if (provider === 'smtp') {
      // Live SMTP Dispatch using Nodemailer
      const host = emailConfig.smtp_host || 'mail.digitapbs.pk';
      const port = Number(emailConfig.smtp_port) || 587;
      const secure = port === 465; // Port 465 is implicit SSL; 587 is STARTTLS
      const user = emailConfig.smtp_user;
      const pass = emailConfig.smtp_password;

      if (!user || !pass) {
        throw new Error('SMTP credentials incomplete (missing username or password)');
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false // Prevents failure with self-signed or shared cPanel certs
        }
      });

      const senderFrom = emailConfig.sender_name 
        ? `"${emailConfig.sender_name}" <${emailConfig.sender_email || user}>`
        : (emailConfig.sender_email || user);

      const info = await transporter.sendMail({
        from: senderFrom,
        to: recipient,
        subject: finalSubject,
        html: finalHtml,
        text: finalHtml.replace(/<[^>]*>?/gm, ' ')
      });

      dispatchResult = {
        provider: 'smtp',
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted
      };
    } else if (provider === 'resend') {
      if (!emailConfig.api_key) throw new Error('Resend API Key is required');
      const rRes = await fetch('https://api.resend.com/emails', {
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
      const rJson = await rRes.json();
      if (!rRes.ok) throw new Error(rJson.message || `Resend error: ${rRes.statusText}`);
      dispatchResult = rJson;
    } else if (provider === 'sendgrid') {
      if (!emailConfig.api_key) throw new Error('SendGrid API Key is required');
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
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
      if (!sgRes.ok) {
        const sgErr = await sgRes.text();
        throw new Error(`SendGrid API error (${sgRes.status}): ${sgErr}`);
      }
      dispatchResult = { provider: 'sendgrid', status: 'sent', statusCode: sgRes.status };
    } else if (provider === 'postmark') {
      if (!emailConfig.api_key) throw new Error('Postmark Server Token is required');
      const pmRes = await fetch('https://api.postmarkapp.com/email', {
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
      const pmJson = await pmRes.json();
      if (!pmRes.ok) throw new Error(pmJson.Message || `Postmark error: ${pmRes.statusText}`);
      dispatchResult = pmJson;
    } else if (provider === 'custom' && emailConfig.smtp_host) {
      // Generic Webhook
      const whRes = await fetch(emailConfig.smtp_host, {
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
      dispatchResult = { status: whRes.status, statusText: whRes.statusText };
      if (!whRes.ok) throw new Error(`Webhook endpoint returned HTTP ${whRes.status}`);
    } else {
      throw new Error(`Unsupported email provider: ${provider}`);
    }
  } catch (sendErr) {
    console.error('Email dispatch failed:', sendErr);
    status = 'failed';
    errorMessage = sendErr.message || 'Unknown email delivery error';
  }

  // Audit Log
  const logId = await logCommunication({
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
    return res.status(400).json({
      success: false,
      status: 'failed',
      error: errorMessage,
      message: `Email delivery failed: ${errorMessage}`,
      logId
    });
  }

  return res.status(200).json({
    success: true,
    status: 'sent',
    message: `Email successfully delivered to ${recipient}`,
    details: dispatchResult,
    logId
  });
}

/**
 * Handle Live WhatsApp Dispatching
 */
async function handleWhatsAppDispatch(req, res, options) {
  const { recipientPhone, bodyText, templateKey, variables, customConfig, testMode } = options;

  let waConfig = customConfig;
  if (!waConfig) {
    const { data: dbConfig } = await supabase
      .from('whatsapp_integration_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    waConfig = dbConfig;
  }

  if (!waConfig) {
    return res.status(400).json({ success: false, error: 'WhatsApp configuration not found' });
  }

  const isEnabled = waConfig.is_enabled || testMode;
  const cleanPhone = normalizePhone(recipientPhone);

  if (!isEnabled) {
    await logCommunication({
      channel: 'whatsapp',
      template_key: templateKey || null,
      recipient: cleanPhone,
      subject: null,
      payload: { variables, simulated: true },
      status: 'simulated',
      response_data: { notice: 'WhatsApp integration is disabled. Running in simulation mode.' }
    });

    return res.status(200).json({
      success: true,
      status: 'simulated',
      message: `Simulation Mode: WhatsApp message formatted for ${cleanPhone} (Gateway disabled)`
    });
  }

  let finalBodyText = bodyText || 'AutoBell Cloud Notification';
  let dispatchResult = null;
  let status = 'sent';
  let errorMessage = null;

  try {
    const provider = waConfig.provider || 'meta';

    if (provider === 'meta') {
      if (!waConfig.api_key) throw new Error('Meta System User Access Token (API Key) is required');
      if (!waConfig.phone_number_id) throw new Error('Meta Phone Number ID is required');

      const endpoint = (waConfig.api_endpoint || 'https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages')
        .replace('{PHONE_NUMBER_ID}', waConfig.phone_number_id.trim());

      const digitsOnly = cleanPhone.replace(/\D/g, '');

      const metaRes = await fetch(endpoint, {
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
          text: {
            preview_url: true,
            body: finalBodyText
          }
        })
      });

      const metaJson = await metaRes.json();
      if (!metaRes.ok) {
        throw new Error(metaJson.error?.message || `Meta Cloud API error (${metaRes.status})`);
      }
      dispatchResult = metaJson;
    } else if (provider === 'twilio') {
      if (!waConfig.account_sid || !waConfig.api_key) {
        throw new Error('Twilio Account SID and Auth Token are required');
      }
      const sender = waConfig.sender_phone.startsWith('whatsapp:')
        ? waConfig.sender_phone
        : `whatsapp:${waConfig.sender_phone.replace(/\s+/g, '')}`;

      const target = `whatsapp:${cleanPhone}`;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${waConfig.account_sid}/Messages.json`;

      const params = new URLSearchParams();
      params.append('From', sender);
      params.append('To', target);
      params.append('Body', finalBodyText);

      const authHeader = 'Basic ' + Buffer.from(`${waConfig.account_sid}:${waConfig.api_key}`).toString('base64');
      const twilioRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const twilioJson = await twilioRes.json();
      if (!twilioRes.ok) {
        throw new Error(twilioJson.message || `Twilio error: ${twilioRes.statusText}`);
      }
      dispatchResult = twilioJson;
    } else if (provider === 'ultramsg') {
      const endpoint = waConfig.api_endpoint || 'https://api.ultramsg.com/messages/chat';
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      const uRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: waConfig.api_key,
          to: digitsOnly,
          body: finalBodyText
        })
      });
      const uJson = await uRes.json().catch(() => ({ status: uRes.statusText }));
      if (!uRes.ok || uJson.error) {
        throw new Error(uJson.error || `UltraMsg error: ${uRes.statusText}`);
      }
      dispatchResult = uJson;
    } else if (provider === 'green_api') {
      const endpoint = waConfig.api_endpoint;
      if (!endpoint) throw new Error('Green API Endpoint is required');
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      const gRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${digitsOnly}@c.us`,
          message: finalBodyText
        })
      });
      const gJson = await gRes.json().catch(() => ({ status: gRes.statusText }));
      if (!gRes.ok) throw new Error(`Green API error (${gRes.status})`);
      dispatchResult = gJson;
    } else if (provider === 'wasapi') {
      const endpoint = waConfig.api_endpoint || 'https://api.wasapi.io/v1/messages';
      const wRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waConfig.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: finalBodyText
        })
      });
      const wJson = await wRes.json().catch(() => ({ status: wRes.statusText }));
      if (!wRes.ok) throw new Error(`Wasapi error (${wRes.status})`);
      dispatchResult = wJson;
    } else if (waConfig.api_endpoint) {
      // Custom Webhook
      const whRes = await fetch(waConfig.api_endpoint, {
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
      });
      dispatchResult = { status: whRes.status, statusText: whRes.statusText };
      if (!whRes.ok) throw new Error(`Webhook endpoint returned HTTP ${whRes.status}`);
    } else {
      throw new Error(`Unsupported WhatsApp provider: ${provider}`);
    }
  } catch (waErr) {
    console.error('WhatsApp dispatch failed:', waErr);
    status = 'failed';
    errorMessage = waErr.message || 'WhatsApp message dispatch failed';
  }

  // Audit Log
  const logId = await logCommunication({
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
    return res.status(400).json({
      success: false,
      status: 'failed',
      error: errorMessage,
      message: `WhatsApp delivery failed: ${errorMessage}`,
      logId
    });
  }

  return res.status(200).json({
    success: true,
    status: 'sent',
    message: `WhatsApp message dispatched successfully to ${cleanPhone}`,
    details: dispatchResult,
    logId
  });
}

function normalizePhone(phone) {
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

async function logCommunication(data) {
  try {
    const { data: inserted } = await supabase
      .from('communication_logs')
      .insert({
        channel: data.channel,
        template_key: data.template_key,
        recipient: data.recipient,
        subject: data.subject,
        payload: data.payload,
        status: data.status,
        error_message: data.error_message,
        response_data: data.response_data
      })
      .select('id')
      .single();
    return inserted?.id || null;
  } catch (e) {
    console.warn('Could not insert communication log:', e.message);
    return null;
  }
}

