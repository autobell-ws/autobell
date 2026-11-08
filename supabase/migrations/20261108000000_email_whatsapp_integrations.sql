-- Migration: 20261108000000_email_whatsapp_integrations.sql
-- Description: WhatsApp API, Email Integration Configs, Notification Templates & Dispatch Logs

-- 1. Email Integration Configuration Table (Single Row)
CREATE TABLE IF NOT EXISTS public.email_integration_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    provider TEXT NOT NULL DEFAULT 'smtp', -- 'smtp', 'resend', 'sendgrid', 'postmark', 'custom'
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_host TEXT DEFAULT 'smtp.gmail.com',
    smtp_port INT DEFAULT 587,
    smtp_user TEXT DEFAULT '',
    smtp_password TEXT DEFAULT '',
    smtp_secure BOOLEAN DEFAULT TRUE,
    sender_name TEXT DEFAULT 'AutoBell Cloud System',
    sender_email TEXT DEFAULT 'notifications@autobell-portal.com',
    api_key TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial row
INSERT INTO public.email_integration_config (id, provider, is_enabled, smtp_host, smtp_port, sender_name, sender_email)
VALUES (1, 'smtp', FALSE, 'smtp.gmail.com', 587, 'AutoBell Cloud System', 'notifications@autobell-portal.com')
ON CONFLICT (id) DO NOTHING;

-- 2. WhatsApp API Integration Configuration Table (Single Row)
CREATE TABLE IF NOT EXISTS public.whatsapp_integration_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    provider TEXT NOT NULL DEFAULT 'meta', -- 'meta', 'twilio', 'ultramsg', 'green_api', 'wasapi', 'generic_webhook'
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    api_endpoint TEXT DEFAULT 'https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages',
    api_key TEXT DEFAULT '',
    phone_number_id TEXT DEFAULT '',
    sender_phone TEXT DEFAULT '',
    account_sid TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial row
INSERT INTO public.whatsapp_integration_config (id, provider, is_enabled, api_endpoint)
VALUES (1, 'meta', FALSE, 'https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages')
ON CONFLICT (id) DO NOTHING;

-- 3. Notification Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', -- 'onboarding', 'billing', 'system_alert'
    channels TEXT[] NOT NULL DEFAULT ARRAY['email'], -- ['email', 'whatsapp'] or ['email']
    email_subject TEXT,
    email_body_html TEXT,
    whatsapp_body_text TEXT,
    available_variables TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_key ON public.notification_templates(template_key);

-- 4. Communication Logs Table
CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL, -- 'email', 'whatsapp'
    template_key TEXT,
    recipient TEXT NOT NULL,
    subject TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'simulated'
    error_message TEXT,
    response_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at ON public.communication_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_channel ON public.communication_logs(channel);

-- 5. Seed Core Notification Templates
-- 5.1 Account Registration (Dual: Email & WhatsApp)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'account_registration',
    'Account Registration Welcome',
    'onboarding',
    ARRAY['email', 'whatsapp'],
    'Welcome to AutoBell Cloud - Account Created for {{school_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 20px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">🔔 AutoBell Cloud Platform</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">Intelligent Audio & Automated Bell Management</p>
  </div>
  <div style="padding: 24px 0;">
    <h2 style="color: #0f172a; margin-top: 0;">Welcome, {{user_name}}!</h2>
    <p style="color: #475569; line-height: 1.6;">Your organization <strong>{{school_name}}</strong> has been successfully registered on the AutoBell Cloud network.</p>
    <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #1e293b;">Your Registration Details:</p>
      <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.6;">
        <li><strong>Account Email:</strong> {{email}}</li>
        <li><strong>Registered Institution:</strong> {{school_name}}</li>
        <li><strong>Contact Phone:</strong> {{phone}}</li>
      </ul>
    </div>
    <p style="color: #475569; line-height: 1.6;">You can access your portal to configure campus zones, timetable schedules, and connect your AutoBell hardware controllers.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{login_url}}" style="background: #0284c7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In to Dashboard</a>
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Need onboarding assistance? Reach our customer operations helpline at <strong>{{support_phone}}</strong>.</p>
  </div>
  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
    &copy; 2026 AutoBell Systems Inc. All rights reserved.
  </div>
</div>',
    '🔔 *Welcome to AutoBell Cloud!*

Dear *{{user_name}}*,
Your account for *{{school_name}}* has been registered successfully on the AutoBell Cloud Platform.

📋 *Account Details:*
• *Email:* {{email}}
• *Institution:* {{school_name}}
• *Portal Access:* {{login_url}}

Our onboarding team is reviewing your setup. If you have any questions, reach us at {{support_phone}}.

_AutoBell - Smart Timetable & Intelligent Audio Network_',
    ARRAY['{{user_name}}', '{{school_name}}', '{{email}}', '{{phone}}', '{{login_url}}', '{{support_phone}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    whatsapp_body_text = EXCLUDED.whatsapp_body_text,
    available_variables = EXCLUDED.available_variables;

-- 5.2 Registration Confirmation (Dual: Email & WhatsApp)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'registration_confirmation',
    'Registration Confirmation & Activation',
    'onboarding',
    ARRAY['email', 'whatsapp'],
    'Registration Confirmed: {{school_name}} is Activated on AutoBell',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">✅ Account Activated & Confirmed</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">AutoBell Cloud Platform</p>
  </div>
  <div style="padding: 24px 0;">
    <h2 style="color: #0f172a; margin-top: 0;">Congratulations, {{user_name}}!</h2>
    <p style="color: #475569; line-height: 1.6;">Your registration for <strong>{{school_name}}</strong> (Campus: {{campus_name}}) has been verified and confirmed by our system administrators.</p>
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; margin: 20px 0; border-radius: 6px;">
      <p style="margin: 0 0 6px; font-weight: bold; color: #065f46;">Activation Summary:</p>
      <ul style="margin: 0; padding-left: 20px; color: #047857; line-height: 1.6;">
        <li><strong>Status:</strong> Active / Full Cloud License</li>
        <li><strong>Campus:</strong> {{campus_name}}</li>
        <li><strong>Service Plan:</strong> {{plan_name}}</li>
      </ul>
    </div>
    <p style="color: #475569; line-height: 1.6;">Your hardware units are ready for auto-sync. You can now launch period bells, stream audio broadcasts, and test offline fallback capabilities.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Launch AutoBell Dashboard</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">Support inquiries: Contact <strong>{{support_email}}</strong>.</p>
  </div>
  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
    &copy; 2026 AutoBell Systems Inc. All rights reserved.
  </div>
</div>',
    '✅ *AutoBell Account Confirmed & Activated!*

Congratulations *{{user_name}}*!
Your registration for *{{school_name}}* ({{campus_name}}) is now officially *CONFIRMED and ACTIVATED*.

🚀 *Access Your Smart Bell Portal:*
{{dashboard_url}}

🎉 *Active Plan:* {{plan_name}}
You can now link hardware controllers, set daily bell schedules, and broadcast live neural announcements.

Need help? Reply here or email {{support_email}}.',
    ARRAY['{{user_name}}', '{{school_name}}', '{{campus_name}}', '{{plan_name}}', '{{dashboard_url}}', '{{support_email}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    whatsapp_body_text = EXCLUDED.whatsapp_body_text,
    available_variables = EXCLUDED.available_variables;

-- 5.3 Payment Confirmation (Dual: Email & WhatsApp)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'payment_confirmation',
    'Payment Confirmation & Official Receipt',
    'billing',
    ARRAY['email', 'whatsapp'],
    'Payment Received - Invoice #{{invoice_id}} for {{school_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #4f46e5, #4338ca); padding: 20px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">🧾 Payment Receipt</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">AutoBell Cloud Platform</p>
  </div>
  <div style="padding: 24px 0;">
    <h2 style="color: #0f172a; margin-top: 0;">Thank You, {{customer_name}}!</h2>
    <p style="color: #475569; line-height: 1.6;">We have successfully received and processed your payment for <strong>{{school_name}}</strong>.</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
        <tr><td style="padding: 6px 0; color: #64748b;">Invoice Reference:</td><td style="text-align: right; font-weight: bold; font-family: monospace;">#{{invoice_id}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Amount Paid:</td><td style="text-align: right; font-weight: bold; color: #059669;">{{currency}} {{amount}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Payment Method:</td><td style="text-align: right; font-weight: bold;">{{payment_method}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Transaction Date:</td><td style="text-align: right;">{{payment_date}}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Covered Service:</td><td style="text-align: right;">{{plan_name}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{receipt_url}}" style="background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download Official Receipt (PDF)</a>
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Your automated bell services and cloud neural broadcast remain active without interruption.</p>
  </div>
  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
    &copy; 2026 AutoBell Systems Inc. All rights reserved.
  </div>
</div>',
    '🧾 *AutoBell Payment Receipt*

Dear *{{customer_name}}*,
Thank you! Your payment for *{{school_name}}* has been received and confirmed.

💳 *Transaction Summary:*
• *Invoice ID:* #{{invoice_id}}
• *Amount Paid:* {{currency}} {{amount}}
• *Payment Method:* {{payment_method}}
• *Date:* {{payment_date}}
• *Service Plan:* {{plan_name}}

📄 *View / Download Receipt:*
{{receipt_url}}

Your automated bell scheduling and cloud audio broadcast continue without interruption.',
    ARRAY['{{school_name}}', '{{customer_name}}', '{{invoice_id}}', '{{amount}}', '{{currency}}', '{{payment_method}}', '{{payment_date}}', '{{plan_name}}', '{{receipt_url}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    whatsapp_body_text = EXCLUDED.whatsapp_body_text,
    available_variables = EXCLUDED.available_variables;

-- 5.4 Payment Reminder (Dual: Email & WhatsApp)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'payment_reminder',
    'Payment Renewal Reminder',
    'billing',
    ARRAY['email', 'whatsapp'],
    'Reminder: AutoBell Cloud Subscription Due on {{due_date}} for {{school_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 20px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">⏰ Subscription Payment Reminder</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">AutoBell Cloud Platform</p>
  </div>
  <div style="padding: 24px 0;">
    <h2 style="color: #0f172a; margin-top: 0;">Dear {{customer_name}},</h2>
    <p style="color: #475569; line-height: 1.6;">This is a friendly reminder that the cloud subscription for <strong>{{school_name}}</strong> is due in <strong>{{days_remaining}} days</strong> on <strong>{{due_date}}</strong>.</p>
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #78350f;">
        <tr><td style="padding: 6px 0;">Invoice #:</td><td style="text-align: right; font-weight: bold; font-family: monospace;">#{{invoice_id}}</td></tr>
        <tr><td style="padding: 6px 0;">Amount Due:</td><td style="text-align: right; font-weight: bold;">{{currency}} {{amount}}</td></tr>
        <tr><td style="padding: 6px 0;">Due Date:</td><td style="text-align: right; font-weight: bold;">{{due_date}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{payment_url}}" style="background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pay Online Now</a>
    </div>
    <div style="background: #f8fafc; padding: 14px; border-radius: 6px; font-size: 13px; color: #475569;">
      <strong>Bank Transfer Details:</strong><br/>
      {{bank_details}}
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 16px;">Timely payment ensures continuous firmware heartbeat sync, weather announcements, and cloud timetable updates.</p>
  </div>
  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
    &copy; 2026 AutoBell Systems Inc. All rights reserved.
  </div>
</div>',
    '⏰ *AutoBell Subscription Payment Reminder*

Dear *{{customer_name}}*,
This is a friendly reminder that the subscription license for *{{school_name}}* is due in *{{days_remaining}} days* (*{{due_date}}*).

📌 *Invoice Summary:*
• *Invoice:* #{{invoice_id}}
• *Amount Due:* {{currency}} {{amount}}
• *Due Date:* {{due_date}}

💳 *Pay Online Instantly:*
{{payment_url}}

Please ensure timely renewal to maintain continuous cloud bell operation and firmware sync.

_AutoBell Finance Team_',
    ARRAY['{{school_name}}', '{{customer_name}}', '{{invoice_id}}', '{{amount}}', '{{currency}}', '{{due_date}}', '{{days_remaining}}', '{{payment_url}}', '{{bank_details}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    whatsapp_body_text = EXCLUDED.whatsapp_body_text,
    available_variables = EXCLUDED.available_variables;

-- 5.5 Device Offline Alert (EMAIL ONLY)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'device_offline_alert',
    'Device Hardware Offline Alert (Email Only)',
    'system_alert',
    ARRAY['email'],
    '⚠️ Hardware Alert: Bell Controller "{{device_name}}" is Offline at {{school_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <div style="background: #dc2626; padding: 18px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 22px;">⚠️ Hardware Controller Offline</h1>
    <p style="margin: 4px 0 0; opacity: 0.9;">AutoBell Hardware Monitoring Alert</p>
  </div>
  <div style="padding: 20px 0;">
    <h3 style="color: #0f172a; margin-top: 0;">Device Connectivity Issue Detected</h3>
    <p style="color: #475569; line-height: 1.6;">The bell controller <strong>{{device_name}}</strong> installed at <strong>{{school_name}}</strong> has missed consecutive heartbeat checks and is reported <strong>OFFLINE</strong>.</p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 14px; margin: 18px 0;">
      <p style="margin: 0 0 6px; font-weight: bold; color: #991b1b;">Device Diagnostics:</p>
      <ul style="margin: 0; padding-left: 20px; color: #b91c1c; font-size: 13px; line-height: 1.6;">
        <li><strong>Controller Name:</strong> {{device_name}}</li>
        <li><strong>MAC Address:</strong> {{mac_address}}</li>
        <li><strong>Installed Zone / Campus:</strong> {{location_area}}</li>
        <li><strong>Last Heartbeat Recorded:</strong> {{last_seen}}</li>
      </ul>
    </div>
    <p style="color: #475569; line-height: 1.6; font-size: 13px;"><em>Note: The controller will continue executing cached bell timetables autonomously offline from internal RTC. However, cloud speech, live audio streaming, and instant ring commands are unavailable until reconnected.</em></p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{troubleshoot_url}}" style="background: #dc2626; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Inspect Hardware in Portal</a>
    </div>
  </div>
</div>',
    NULL,
    ARRAY['{{school_name}}', '{{device_name}}', '{{mac_address}}', '{{location_area}}', '{{last_seen}}', '{{troubleshoot_url}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    available_variables = EXCLUDED.available_variables;

-- 5.6 Emergency Stop Alert (EMAIL ONLY)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'emergency_stop_alert',
    'Emergency Audio Stop Triggered (Email Only)',
    'system_alert',
    ARRAY['email'],
    '🚨 EMERGENCY AUDIO STOP: Triggered at {{school_name}} by {{operator_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; background: #ffffff;">
  <div style="background: #991b1b; padding: 18px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 22px;">🚨 EMERGENCY STOP ACTIVATED</h1>
    <p style="margin: 4px 0 0; opacity: 0.9;">Immediate System Audio Shutdown</p>
  </div>
  <div style="padding: 20px 0;">
    <p style="color: #475569; line-height: 1.6;">An immediate Emergency Audio Halt was invoked on the AutoBell network for <strong>{{school_name}}</strong>.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px; margin: 16px 0;">
      <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 13px; line-height: 1.6;">
        <li><strong>Triggered By:</strong> {{operator_name}}</li>
        <li><strong>Timestamp:</strong> {{timestamp}}</li>
        <li><strong>Affected Zones:</strong> {{affected_zones}}</li>
        <li><strong>Stated Reason:</strong> {{reason}}</li>
      </ul>
    </div>
    <p style="color: #64748b; font-size: 13px;">All streaming audio, bells, buzzers, and amplifiers were immediately disengaged across all selected hardware channels.</p>
  </div>
</div>',
    NULL,
    ARRAY['{{school_name}}', '{{operator_name}}', '{{timestamp}}', '{{affected_zones}}', '{{reason}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    available_variables = EXCLUDED.available_variables;

-- 5.7 Subscription Expiry Warning (EMAIL ONLY)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'subscription_expiry_warning',
    'Subscription Expiry Warning (Email Only)',
    'billing',
    ARRAY['email'],
    'Urgent: AutoBell Cloud Service Expiry Notice for {{school_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <div style="background: #e11d48; padding: 18px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 22px;">Notice of Cloud Service Expiration</h1>
  </div>
  <div style="padding: 20px 0;">
    <p style="color: #475569; line-height: 1.6;">Dear School Administrator,<br/>The cloud license for <strong>{{school_name}}</strong> (Plan: {{plan_name}}) is scheduled to expire on <strong>{{expiry_date}}</strong>.</p>
    <p style="color: #475569; line-height: 1.6;">Following expiration, cloud-based text-to-speech generation, remote emergency broadcasts, and weather announcements will be suspended until renewal is processed.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{renewal_url}}" style="background: #e11d48; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Renew Cloud License</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">Helpline: {{support_phone}}.</p>
  </div>
</div>',
    NULL,
    ARRAY['{{school_name}}', '{{plan_name}}', '{{expiry_date}}', '{{renewal_url}}', '{{support_phone}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    available_variables = EXCLUDED.available_variables;

-- 5.8 System Maintenance / Broadcast (EMAIL ONLY)
INSERT INTO public.notification_templates (template_key, title, category, channels, email_subject, email_body_html, whatsapp_body_text, available_variables)
VALUES (
    'system_broadcast',
    'System Maintenance & Official Notice (Email Only)',
    'system_alert',
    ARRAY['email'],
    'AutoBell System Notice: {{title}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <div style="background: #0f172a; padding: 18px; border-radius: 6px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 22px;">📢 Official System Notice</h1>
    <p style="margin: 4px 0 0; opacity: 0.8;">AutoBell Cloud Platform</p>
  </div>
  <div style="padding: 20px 0;">
    <h3 style="color: #0f172a; margin-top: 0;">{{title}}</h3>
    <div style="color: #334155; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">{{broadcast_message}}</div>
    <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 18px 0; font-size: 13px; color: #475569;">
      <strong>Scheduled Window:</strong> {{maintenance_window}}<br/>
      <strong>Affected Services:</strong> {{affected_services}}
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{support_portal_url}}" style="background: #0f172a; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">System Status Portal</a>
    </div>
  </div>
</div>',
    NULL,
    ARRAY['{{title}}', '{{broadcast_message}}', '{{maintenance_window}}', '{{affected_services}}', '{{support_portal_url}}']
)
ON CONFLICT (template_key) DO UPDATE SET
    title = EXCLUDED.title,
    email_subject = EXCLUDED.email_subject,
    email_body_html = EXCLUDED.email_body_html,
    available_variables = EXCLUDED.available_variables;

-- 6. Enable RLS and Permissive Policies
ALTER TABLE public.email_integration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_integration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- Policies for email_integration_config
DROP POLICY IF EXISTS "Super admin full access email config" ON public.email_integration_config;
CREATE POLICY "Super admin full access email config" ON public.email_integration_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

-- Policies for whatsapp_integration_config
DROP POLICY IF EXISTS "Super admin full access whatsapp config" ON public.whatsapp_integration_config;
CREATE POLICY "Super admin full access whatsapp config" ON public.whatsapp_integration_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

-- Policies for notification_templates
DROP POLICY IF EXISTS "Anyone logged in can read templates" ON public.notification_templates;
CREATE POLICY "Anyone logged in can read templates" ON public.notification_templates
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Super admin full access templates" ON public.notification_templates;
CREATE POLICY "Super admin full access templates" ON public.notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

-- Policies for communication_logs
DROP POLICY IF EXISTS "Super admin full access communication logs" ON public.communication_logs;
CREATE POLICY "Super admin full access communication logs" ON public.communication_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );
