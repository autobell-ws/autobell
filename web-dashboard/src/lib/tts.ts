import { supabase } from './supabase';

export async function generateSecureTTS(
  provider: string,
  text: string,
  settings: any = {}
): Promise<Blob> {
  let edgeErrorMsg = '';
  try {
    const { data, error } = await supabase.functions.invoke('generate-speech', {
      body: { provider, text, settings },
      // @ts-expect-error - responseType is valid but missing in types
      responseType: 'blob',
    })

    if (!error && data) {
      if (data instanceof Blob) {
        return data;
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        return new Blob([data as BlobPart], { type: 'audio/mpeg' });
      }
    }

    if (error) {
      edgeErrorMsg = error.message || '';
      if ((error as any).context && typeof (error as any).context.text === 'function') {
        try {
          const bodyText = await (error as any).context.text();
          const parsed = JSON.parse(bodyText);
          if (parsed?.error) edgeErrorMsg = parsed.error;
        } catch (_) {}
      }
    }
  } catch (err: any) {
    edgeErrorMsg = err?.message || 'Failed to connect to edge function';
  }

  // Fallback to Vercel Serverless Function (/api/generate-speech) if Edge Function is unavailable
  try {
    const response = await fetch('/api/generate-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, text, settings }),
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        return blob;
      }
    }
  } catch (fallbackErr) {
    console.warn('Vercel API fallback failed:', fallbackErr);
  }

  // If a custom provider (e.g. openai) failed, automatically fallback to google-free
  if (provider !== 'google-free') {
    console.warn(`Provider ${provider} failed (${edgeErrorMsg}). Falling back to Google Free TTS...`);
    return generateSecureTTS('google-free', text, settings);
  }

  throw new Error(edgeErrorMsg || `Failed to generate speech via secure endpoint for ${provider}`);
}

export async function generateTTS(
  text: string, 
  _apiKey: string, // Kept for signature compatibility, but ignored
  baseUrl: string = 'https://api.openai.com/v1',
  model: string = 'tts-1',
  voice: string = 'alloy'
): Promise<Blob> {
  return generateSecureTTS('openai', text, { baseUrl, model, voice });
}

export async function generateTopMediaiTTS(
  text: string,
  _apiKey: string, // Ignored
  speaker: string = '00151554-3826-11ee-a861-00163e2ac61b',
  emotion: string = 'Neutral'
): Promise<Blob> {
  return generateSecureTTS('topmediai', text, { speaker, emotion });
}

export async function generateCambAITTS(
  text: string,
  _apiKey: string, // Ignored
  voiceId: number = 147320,
  language: number = 1,
  gender: number = 1,
  age: number = 30
): Promise<Blob> {
  return generateSecureTTS('cambai', text, { voiceId, language, gender, age });
}

export async function generateElevenLabsTTS(
  text: string,
  _apiKey: string, // Ignored
  voiceId: string = '21m00Tcm4TlvDq8ikWAM',
  modelId: string = 'eleven_monolingual_v1'
): Promise<Blob> {
  return generateSecureTTS('elevenlabs', text, { voiceId, modelId });
}

export async function generateGoogleFreeTTS(
  text: string,
  language: string = 'en',
  gender: string = 'female'
): Promise<Blob> {
  return generateSecureTTS('google-free', text, { language, gender });
}
